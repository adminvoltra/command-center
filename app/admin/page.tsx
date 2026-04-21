'use client';

import { useAppContext } from '@/lib/useAppContext';

export default function AdminPage() {
  const { ctx, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  const totalTasks = ctx.projects.reduce((sum, p) => sum + (p.tasks || []).length, 0);
  const activityCount = (ctx.activityLog || []).length;
  const agencyScoreCount = (ctx.agencyScores || []).length;
  const scheduleCount = (ctx.scheduleEvents || []).length;
  const meetingCount = (ctx.meetingNotes || []).length;

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">System settings and data management</p>
        </div>
      </div>

      <div className="mc-stats" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="mc-stat">
          <span className="mc-stat-value">{ctx.projects.length}</span>
          <span className="mc-stat-label">Projects</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{totalTasks}</span>
          <span className="mc-stat-label">Project Todos</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{ctx.weeklyGoals.length}</span>
          <span className="mc-stat-label">Tasks</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{scheduleCount}</span>
          <span className="mc-stat-label">Calendar Events</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{meetingCount}</span>
          <span className="mc-stat-label">Meeting Notes</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{ctx.clients.length}</span>
          <span className="mc-stat-label">Clients</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{activityCount}</span>
          <span className="mc-stat-label">Activity Log Entries</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{agencyScoreCount}</span>
          <span className="mc-stat-label">Agency Scores</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--space-sm)' }}>System</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 'var(--space-sm)' }}>
            Last updated {new Date(ctx.lastUpdated).toLocaleString()}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Notion: {ctx.notionConnected ? 'Connected' : 'Not connected'}
          </p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--space-sm)' }}>Data</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Context is stored in Redis. Use the Overview page&apos;s natural-language Update bar, or edit items directly on their respective pages.
          </p>
        </section>
      </div>
    </main>
  );
}
