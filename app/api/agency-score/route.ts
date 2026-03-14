import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { redis, CONTEXT_KEY } from '@/lib/redis';
import { VoltraContext, AgencyScoreEntry, ActivityLogEntry } from '@/lib/context';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getActivitiesForDate(activities: ActivityLogEntry[], date: string): ActivityLogEntry[] {
  return activities.filter(a => a.timestamp.startsWith(date));
}

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json() as { context: VoltraContext };
    const today = getTodayDate();
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get today's activities
    const todayActivities = getActivitiesForDate(context.activityLog || [], today);

    // Build activity summary
    const activitySummary = todayActivities.length > 0
      ? todayActivities.map(a => `- [${a.type}] ${a.description} (${new Date(a.timestamp).toLocaleTimeString()})`).join('\n')
      : 'No activities logged today yet.';

    // Get recent scores for context
    const recentScores = (context.agencyScores || [])
      .slice(-7)
      .map(s => `${s.date}: ${s.score}/100`)
      .join(', ') || 'No previous scores';

    const prompt = `You are an executive performance analyst calculating a daily Agency Score (1-100) that measures initiative, productivity, and execution quality.

DATE: ${todayFormatted}

TODAY'S COMPLETED ACTIVITIES:
${activitySummary}

CURRENT STATE:
- Projects: ${context.projects.length} total (${context.projects.filter(p => p.status === 'active').length} active)
- Weekly Goals: ${context.weeklyGoals.filter(g => g.done).length}/${context.weeklyGoals.length} completed
- Active Reminders: ${(context.reminders || []).filter(r => !r.isCompleted).length}
- Today's Schedule Blocks: ${context.dailyPlan.length}

RECENT AGENCY SCORES:
${recentScores}

FULL CONTEXT:
${JSON.stringify({
  projects: context.projects,
  weeklyGoals: context.weeklyGoals,
  performance: context.performance,
}, null, 2)}

Calculate an Agency Score (1-100) based on:
1. **Volume of Output** (25%): Number of tasks/goals completed today
2. **Quality of Focus** (25%): Did they work on high-priority items vs low-priority busy work?
3. **Initiative & Proactivity** (25%): Did they create new goals, make progress on projects, or just maintain?
4. **Consistency** (25%): How does today compare to recent performance patterns?

SCORING GUIDELINES:
- 90-100: Exceptional day. Multiple high-impact completions, significant project progress.
- 75-89: Strong day. Good progress on priorities, consistent execution.
- 60-74: Average day. Some progress but could be more focused.
- 40-59: Below average. Minimal output or focused on low-impact work.
- 1-39: Poor day. Little to no productive activity logged.

If no activities are logged today, score should be low (10-30) unless it's early in the day.

Respond with EXACTLY this JSON format (no markdown, just raw JSON):
{
  "score": [number 1-100],
  "report": "[Professional 3-4 sentence analysis explaining the score. Be specific about what drove the score up or down. Include actionable insight for improvement. No emojis, no fluff.]"
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    let scoreData: { score: number; report: string };
    try {
      scoreData = JSON.parse(text.trim());
    } catch {
      // If parsing fails, extract score and report manually
      const scoreMatch = text.match(/"score":\s*(\d+)/);
      const reportMatch = text.match(/"report":\s*"([^"]+)"/);
      scoreData = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
        report: reportMatch ? reportMatch[1] : 'Unable to generate detailed report.'
      };
    }

    // Ensure score is within bounds
    const score = Math.max(1, Math.min(100, scoreData.score));

    // Create the score entry
    const scoreEntry: AgencyScoreEntry = {
      date: today,
      score,
      report: scoreData.report,
      activitiesCount: todayActivities.length,
      calculatedAt: new Date().toISOString(),
    };

    // Update context with new score (replace if today's score exists)
    const updatedScores = (context.agencyScores || []).filter(s => s.date !== today);
    updatedScores.push(scoreEntry);

    // Keep only last 30 days of scores
    const trimmedScores = updatedScores.slice(-30);

    // Save to Redis
    const updatedContext: VoltraContext = {
      ...context,
      agencyScores: trimmedScores,
      lastUpdated: new Date().toISOString(),
    };

    await redis.set(CONTEXT_KEY, JSON.stringify(updatedContext));

    return NextResponse.json({
      success: true,
      score: scoreEntry,
      context: updatedContext,
    });
  } catch (error) {
    console.error('Agency Score API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate agency score'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve today's score without recalculating
export async function GET() {
  try {
    const data = await redis.get(CONTEXT_KEY);
    if (!data) {
      return NextResponse.json({ success: false, error: 'No context found' }, { status: 404 });
    }

    const context = typeof data === 'string' ? JSON.parse(data) : data as VoltraContext;
    const today = getTodayDate();
    const todayScore = (context.agencyScores || []).find((s: AgencyScoreEntry) => s.date === today);

    return NextResponse.json({
      success: true,
      score: todayScore || null,
      hasScoreToday: !!todayScore,
    });
  } catch (error) {
    console.error('Agency Score GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch agency score'
    }, { status: 500 });
  }
}
