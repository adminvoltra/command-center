'use client';

import Link from 'next/link';
import { useAppContext } from '@/lib/useAppContext';

export default function ContextPage() {
  const { ctx, isLoading, refresh } = useAppContext();

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </div>
    );
  }

  const contextSummary = `# Voltra Mission Control — Claude Context
Last Updated: ${new Date(ctx.lastUpdated).toLocaleString()}

## Voltra Mode Context (Activated with "Voltra Mode")

### Paid Income Projects
${ctx.projects.filter(p => p.category === 'paid').map(p =>
  `- ${p.name} | Status: ${p.status} | Progress: ${p.progress}% | ${p.rate || p.value || ''}
  Notes: ${p.notes}`
).join('\n')}

### Growth Ventures
${ctx.projects.filter(p => p.category === 'growth').map(p =>
  `- ${p.name} | Status: ${p.status} | Progress: ${p.progress}%${p.daysToFinish ? ` | ~${p.daysToFinish} days left` : ''}
  Notes: ${p.notes}`
).join('\n')}

### Weekly Goals (${ctx.weeklyGoals.filter(g => g.done).length}/${ctx.weeklyGoals.length} done)
${ctx.weeklyGoals.map(g =>
  `- [${g.done ? 'X' : ' '}] ${g.text} (${g.priority} priority)`
).join('\n')}

### Clients (${(ctx.clients || []).length})
${(ctx.clients || []).map(c =>
  `- ${c.name} (${c.status})${c.contactName ? ` — ${c.contactName}` : ''}${c.email ? ` <${c.email}>` : ''}`
).join('\n')}

### Daily Baseline Plan
${ctx.dailyPlan.map(b =>
  `${b.time} — ${b.label} (${b.duration})${b.notes ? `\n  ${b.notes}` : ''}`
).join('\n')}

### Goal
Feel on top of things every day. Accomplish minimum priorities early. Have freedom and breathing room for the rest of the day.

### Notion Integration
Status: ${ctx.notionConnected ? 'Connected' : 'Ready to connect — set NOTION_API_KEY env var'}
`;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <img src="/Vstar.svg" alt="Voltra" style={{ height: 28, marginRight: 10 }} />
          <span className="brand">Voltra Mission Control</span>
          <span className="brand-sub">Claude Context View</span>
        </div>
        <div className="topbar-right">
          <Link href="/" className="nav-btn">← Dashboard</Link>
        </div>
      </header>

      <div className="context-page">
        <div className="context-header">
          <h1>Claude-Readable Context</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="nav-btn"
              onClick={() => refresh()}
            >
              Refresh from Redis
            </button>
            <button
              className="nav-btn"
              onClick={() => navigator.clipboard.writeText(contextSummary)}
            >
              Copy All
            </button>
          </div>
        </div>
        <pre>{contextSummary}</pre>
        <div style={{ marginTop: 20 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>
            <span className="dot dot-green" /> Raw JSON
          </div>
          <pre>{JSON.stringify(ctx, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
