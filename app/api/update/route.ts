import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { redis, CONTEXT_KEY } from '@/lib/redis';
import type { VoltraContext } from '@/lib/context';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { instruction, currentContext } = await req.json();

  // Build a compact summary of context for Claude to understand state
  const contextSummary = {
    projectNames: currentContext.projects?.map((p: { name: string; status: string }) => `${p.name} (${p.status})`) || [],
    dailyPlanCount: currentContext.dailyPlan?.length || 0,
    goalCount: currentContext.weeklyGoals?.length || 0,
    reminderCount: currentContext.reminders?.length || 0,
    applicationsThisWeek: currentContext.jobSearch?.applicationsThisWeek || 0,
  };

  const prompt = `You are a data update assistant for the Voltra Mission Control dashboard.

Current state summary:
- Projects: ${contextSummary.projectNames.join(', ') || 'none'}
- Daily plan blocks: ${contextSummary.dailyPlanCount}
- Weekly goals: ${contextSummary.goalCount}
- Reminders: ${contextSummary.reminderCount}
- Job applications this week: ${contextSummary.applicationsThisWeek}

User's instruction: "${instruction}"

Return a JSON object with ONLY the fields that need to change. Use these EXACT schemas:

PROJECTS - MUST include all these fields for new projects:
{ "id": "kebab-case-id", "name": "Project Name", "category": "paid" or "growth", "status": "active", "progress": 0, "notes": "Description" }

DAILY PLAN:
{ "time": "X:XX AM/PM", "label": "Task", "duration": "X min/hr" }

WEEKLY GOALS:
{ "id": "unique-id", "text": "Goal text", "priority": "high|medium|low", "done": false }

RULES:
- Return ONLY fields being changed, not the entire context
- For projects: "category" must be "paid" (for income) or "growth" (for unpaid/side projects)
- For "empty my schedule" or "clear my schedule": return { "dailyPlan": [], "_replace": true }
- For adding schedule blocks: return { "dailyPlan": [new blocks] }
- Use 12-hour format with AM/PM for times

EXAMPLES:
- "add new growth project called Liner Pros" → { "projects": [{ "id": "liner-pros", "name": "Liner Pros", "category": "growth", "status": "active", "progress": 0, "notes": "" }] }
- "add paid project DYO at $30/hr" → { "projects": [{ "id": "dyo", "name": "DYO", "category": "paid", "status": "active", "progress": 0, "rate": "$30/hr", "notes": "" }] }
- "clear my schedule" → { "dailyPlan": [], "_replace": true }
- "add meeting at 2pm" → { "dailyPlan": [{ "time": "2:00 PM", "label": "Meeting", "duration": "30 min" }] }
- "set applications to 5" → { "jobSearch": { "applicationsThisWeek": 5 } }
- "add goal to finish app" → { "weeklyGoals": [{ "id": "finish-app", "text": "Finish app", "priority": "high", "done": false }] }
- "add low priority goal for reading" → { "weeklyGoals": [{ "id": "reading", "text": "Reading", "priority": "low", "done": false }] }

Return ONLY raw JSON, no markdown, no explanation, no backticks.`;

  try {
    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 500 });
    }

    console.log('Calling Claude API with instruction:', instruction);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Check if response was truncated
    if (response.stop_reason === 'max_tokens') {
      console.error('Response was truncated - max_tokens reached');
      return NextResponse.json({
        success: false,
        error: 'Response truncated - context too large'
      }, { status: 500 });
    }

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Claude response length:', text.length);

    // Strip any accidental markdown
    const clean = text.replace(/```json|```/g, '').trim();

    let patch: Record<string, unknown>;
    try {
      patch = JSON.parse(clean);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw response:', clean.substring(0, 500));
      return NextResponse.json({
        success: false,
        error: 'Claude returned invalid JSON',
        details: clean.substring(0, 200)
      }, { status: 500 });
    }

    console.log('Received patch:', JSON.stringify(patch));

    // Apply the patch to the current context
    const updatedContext: VoltraContext = {
      ...currentContext,
      lastUpdated: new Date().toISOString(),
    };

    // Helper to create kebab-case id from text
    const toKebabId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Apply each field from the patch
    if (patch.dailyPlan !== undefined) {
      if (patch._replace || (Array.isArray(patch.dailyPlan) && patch.dailyPlan.length === 0)) {
        // Replace mode or empty array
        if (Array.isArray(patch.dailyPlan) && patch.dailyPlan.length > 0) {
          // Apply defaults to each block
          updatedContext.dailyPlan = (patch.dailyPlan as Array<{ time?: string; label?: string; duration?: string; notes?: string }>).map(block => ({
            time: block.time || '9:00 AM',
            label: block.label || 'Untitled Block',
            duration: block.duration || '1 hour',
            notes: block.notes || '',
          })) as VoltraContext['dailyPlan'];
        } else {
          updatedContext.dailyPlan = [];
        }
      } else if (Array.isArray(patch.dailyPlan)) {
        // Append mode - add to existing with defaults
        const newBlocks = (patch.dailyPlan as Array<{ time?: string; label?: string; duration?: string; notes?: string }>).map(block => ({
          time: block.time || '9:00 AM',
          label: block.label || 'Untitled Block',
          duration: block.duration || '1 hour',
          notes: block.notes || '',
        }));
        updatedContext.dailyPlan = [...(currentContext.dailyPlan || []), ...newBlocks] as VoltraContext['dailyPlan'];
      }
    }

    if (patch.weeklyGoals !== undefined && Array.isArray(patch.weeklyGoals)) {
      if (patch._replace) {
        // Replace mode - apply defaults to all goals
        updatedContext.weeklyGoals = (patch.weeklyGoals as Array<{ id?: string; text?: string; [key: string]: unknown }>).map(goal => ({
          id: goal.id || (goal.text ? toKebabId(goal.text) : `goal-${Date.now()}`),
          text: goal.text || 'Untitled Goal',
          priority: (goal.priority === 'high' || goal.priority === 'medium' || goal.priority === 'low') ? goal.priority : 'medium',
          done: typeof goal.done === 'boolean' ? goal.done : false,
        })) as VoltraContext['weeklyGoals'];
      } else {
        // Append mode - add new goals with defaults
        const newGoals = (patch.weeklyGoals as Array<{ id?: string; text?: string; [key: string]: unknown }>).map(goal => ({
          id: goal.id || (goal.text ? toKebabId(goal.text) : `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
          text: goal.text || 'Untitled Goal',
          priority: (goal.priority === 'high' || goal.priority === 'medium' || goal.priority === 'low') ? goal.priority : 'medium',
          done: typeof goal.done === 'boolean' ? goal.done : false,
        }));
        updatedContext.weeklyGoals = [...(currentContext.weeklyGoals || []), ...newGoals] as VoltraContext['weeklyGoals'];
      }
    }

    if (patch.projects !== undefined && Array.isArray(patch.projects)) {
      // For projects, update existing by id or add new with defaults
      const existingProjects = [...(currentContext.projects || [])];
      for (const proj of patch.projects as Array<{ id?: string; name?: string; [key: string]: unknown }>) {
        // Generate id from name if missing
        const projectId = proj.id || (proj.name ? toKebabId(proj.name) : `proj-${Date.now()}`);

        const existingIdx = existingProjects.findIndex(p => p.id === projectId);
        if (existingIdx >= 0) {
          // Update existing project
          existingProjects[existingIdx] = { ...existingProjects[existingIdx], ...proj, id: projectId };
        } else {
          // Add new project with defaults
          const newProject = {
            id: projectId,
            name: proj.name || 'Untitled Project',
            category: (proj.category === 'paid' || proj.category === 'growth') ? proj.category : 'growth',
            status: proj.status || 'active',
            progress: typeof proj.progress === 'number' ? proj.progress : 0,
            notes: proj.notes || '',
            lastTouched: new Date().toISOString(),
            ...(proj.rate ? { rate: proj.rate } : {}),
            ...(proj.value ? { value: proj.value } : {}),
            ...(proj.daysToFinish ? { daysToFinish: proj.daysToFinish } : {}),
          };
          existingProjects.push(newProject as VoltraContext['projects'][0]);
        }
      }
      updatedContext.projects = existingProjects;
    }

    if (patch.jobSearch !== undefined && typeof patch.jobSearch === 'object') {
      updatedContext.jobSearch = { ...currentContext.jobSearch, ...patch.jobSearch as object };
    }

    if (patch.scratchpad !== undefined) {
      updatedContext.scratchpad = patch.scratchpad as string;
    }

    await redis.set(CONTEXT_KEY, JSON.stringify(updatedContext));
    console.log('Successfully saved to Redis');

    return NextResponse.json({ success: true, context: updatedContext });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update API error:', errorMessage, error);
    return NextResponse.json({
      success: false,
      error: `Update failed: ${errorMessage}`,
      context: currentContext
    }, { status: 500 });
  }
}
