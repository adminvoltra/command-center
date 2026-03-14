import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

export async function POST(req: NextRequest) {
  try {
    const { context, type = 'morning' } = await req.json();

    const briefingPrompts: Record<string, string> = {
      morning: `You are a chief of staff preparing a daily executive briefing. Write a professional morning briefing document.

DATE: ${today}

CURRENT OPERATIONAL DATA:
${JSON.stringify(context, null, 2)}

Generate an executive briefing with the following sections. Use professional business language - no emojis, no motivational fluff, no "quick wins" type language. Write as if preparing a briefing for a Fortune 500 executive.

**SITUATION SUMMARY**
Two sentences on current operational status. Reference specific metrics.

**CRITICAL PATH ITEM**
The single highest-priority deliverable today. Include rationale based on deadline proximity, revenue impact, or dependency chains.

**REVENUE OPERATIONS**
Status of active income-generating work. Include rates/values where available. Flag any items requiring attention to maintain cash flow.

**PIPELINE STATUS**
Brief status on growth initiatives and job search funnel. Include conversion metrics where relevant.

**RISK REGISTER**
Items at risk of slippage. Be specific about what's threatened and why.

**RECOMMENDED ACTIONS**
Three specific, time-bound actions for today. Format as action items with clear deliverables.

Write in a direct, professional tone. Focus on outcomes and accountability. Under 250 words total.`,

      weekly: `You are a strategy consultant preparing a weekly performance review for an executive client.

REVIEW PERIOD: Week ending ${today}

OPERATIONAL DATA:
${JSON.stringify(context, null, 2)}

Generate a weekly performance analysis with the following sections. Use professional consulting language - data-driven, objective, actionable.

**EXECUTIVE SUMMARY**
Three-sentence overview of the week's performance against objectives.

**PERFORMANCE SCORECARD**
Rate overall execution 1-10 with specific justification. Break down by category:
- Revenue Work: [score] - [one line rationale]
- Growth Initiatives: [score] - [one line rationale]
- Career Development: [score] - [one line rationale]

**KEY ACCOMPLISHMENTS**
Bullet list of measurable progress made. Be specific with percentages and deliverables.

**GAPS & SHORTFALLS**
What fell short of target? Why? Be direct about underperformance.

**PATTERN ANALYSIS**
One behavioral or operational pattern observed. Could be positive (sustain) or negative (correct).

**STRATEGIC RECOMMENDATIONS**
Top 3 priorities for the coming week with success criteria for each.

Professional tone throughout. No motivational language. Focus on accountability and measurable outcomes. Under 300 words.`,

      focus: `You are an executive coach. Based on the current operational data, provide a single focus recommendation.

CURRENT STATE:
${JSON.stringify(context, null, 2)}

Analyze using these criteria:
1. Proximity to completion (highest % = fastest win)
2. Revenue impact (paid work > growth projects)
3. Time since last touched (neglected items need attention)
4. Blocking relationships (what unlocks other work)

Respond with exactly:

**RECOMMENDED FOCUS**
[One specific task or project]

**RATIONALE**
[Two sentences maximum explaining the selection criteria]

**SUCCESS CRITERIA**
[What "done" looks like for this session]

No motivational language. Pure operational clarity. Under 75 words.`,

      blockers: `You are an operations analyst conducting a risk assessment.

OPERATIONAL DATA:
${JSON.stringify(context, null, 2)}

Analyze for operational risks and blockers:

**STALLED INITIATIVES**
Projects with insufficient progress velocity. Flag items at same percentage for extended periods or with approaching deadlines.

**GOAL ATTAINMENT RISK**
Weekly goals unlikely to be achieved at current pace. Calculate implied daily requirement to hit target.

**RESOURCE ALLOCATION ISSUES**
Misalignment between stated priorities (daily plan) and actual time investment patterns.

**DEPENDENCY RISKS**
Items waiting on external inputs or decisions. Flag aging dependencies.

**RECOMMENDED MITIGATIONS**
Specific corrective actions for each identified risk.

Be direct and specific. No motivational language. Under 200 words.`
    };

    const prompt = briefingPrompts[type] || briefingPrompts.morning;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      success: true,
      briefing: text,
      type,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Briefing API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate briefing'
    }, { status: 500 });
  }
}
