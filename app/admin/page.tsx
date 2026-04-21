'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/lib/useAppContext';
import ThemeToggle from '@/components/ThemeToggle';

interface FbPost {
  id: string;
  message: string | null;
  createdTime: string;
  permalinkUrl: string | null;
  reactions: number;
  comments: number;
  attachment: { type: string | null; mediaUrl: string | null; targetUrl: string | null } | null;
}

interface FbState {
  loading: boolean;
  configured: boolean;
  error: string | null;
  posts: FbPost[];
}

export default function AdminPage() {
  const { ctx, isLoading } = useAppContext();
  const [fb, setFb] = useState<FbState>({ loading: true, configured: false, error: null, posts: [] });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/social/facebook')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setFb({
          loading: false,
          configured: !!data.configured,
          error: data.error || null,
          posts: data.posts || [],
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setFb({ loading: false, configured: false, error: err?.message || 'Fetch failed', posts: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const stats: { label: string; value: number }[] = [
    { label: 'Projects', value: ctx.projects.length },
    { label: 'Project Todos', value: totalTasks },
    { label: 'Tasks', value: ctx.weeklyGoals.length },
    { label: 'Calendar Events', value: scheduleCount },
    { label: 'Meeting Notes', value: meetingCount },
    { label: 'Clients', value: ctx.clients.length },
    { label: 'Activity Log', value: activityCount },
    { label: 'Agency Scores', value: agencyScoreCount },
  ];

  const lastUpdated = new Date(ctx.lastUpdated);
  const lastUpdatedText = lastUpdated.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">System settings, appearance, and data management</p>
        </div>
      </div>

      <div className="admin-grid">
        {/* Appearance ---------------------------------------------------- */}
        <section className="admin-section admin-col-full">
          <div className="admin-section-head">
            <div>
              <span className="admin-eyebrow">Appearance</span>
              <h2 className="admin-section-title">Theme</h2>
              <p className="admin-section-desc">
                Switch between light and dark surfaces, or follow your operating system. Changes apply instantly and persist across sessions.
              </p>
            </div>
          </div>
          <div className="theme-toggle-row">
            <div className="theme-toggle-meta">
              <span className="admin-kv-key">Interface</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Dark is canonical — light is an operational twin with retuned gold and visible shadows.
              </span>
            </div>
            <ThemeToggle ariaLabel="Interface theme" />
          </div>
        </section>

        {/* System overview stats ---------------------------------------- */}
        <section className="admin-section admin-col-full">
          <div className="admin-section-head">
            <div>
              <span className="admin-eyebrow">Overview</span>
              <h2 className="admin-section-title">Workspace totals</h2>
              <p className="admin-section-desc">Live counts across your command center data model.</p>
            </div>
          </div>
          <div className="admin-stats">
            {stats.map((s) => (
              <div key={s.label} className="admin-stat">
                <span className="admin-stat-label">{s.label}</span>
                <span className="admin-stat-value">{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* System status ------------------------------------------------ */}
        <section className="admin-section admin-col-half">
          <div className="admin-section-head">
            <div>
              <span className="admin-eyebrow">Status</span>
              <h2 className="admin-section-title">System</h2>
              <p className="admin-section-desc">Integration health and last synchronization.</p>
            </div>
          </div>
          <div>
            <div className="admin-kv">
              <span className="admin-kv-key">Last Updated</span>
              <span className="admin-kv-value">{lastUpdatedText}</span>
            </div>
            <div className="admin-kv">
              <span className="admin-kv-key">Notion</span>
              <span className={`admin-pill`} data-status={ctx.notionConnected ? 'ok' : 'warn'}>
                <span className="admin-pill-dot" aria-hidden />
                {ctx.notionConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="admin-kv">
              <span className="admin-kv-key">Storage</span>
              <span className="admin-pill" data-status="ok">
                <span className="admin-pill-dot" aria-hidden />
                Upstash Redis
              </span>
            </div>
          </div>
        </section>

        {/* Work log ----------------------------------------------------- */}
        <section className="admin-section admin-col-half">
          <div className="admin-section-head">
            <div>
              <span className="admin-eyebrow">Audit</span>
              <h2 className="admin-section-title">Work Log</h2>
              <p className="admin-section-desc">
                Full history of task, project, and goal activity across the workspace. Searchable, paginated, timestamped.
              </p>
            </div>
            <span className="admin-pill" data-status="ok">
              <span className="admin-pill-dot" aria-hidden />
              {activityCount.toLocaleString()} entries
            </span>
          </div>
          <div className="admin-actions">
            <Link href="/log" className="btn btn-primary btn-lg">Open Work Log</Link>
          </div>
        </section>

        {/* Facebook Page ----------------------------------------------- */}
        <section className="admin-section admin-col-full">
          <div className="admin-section-head">
            <div>
              <span className="admin-eyebrow">Social</span>
              <h2 className="admin-section-title">Facebook — Voltra LLC</h2>
              <p className="admin-section-desc">Recent posts from the Voltra Page via Meta Graph API.</p>
            </div>
            <span
              className="admin-pill"
              data-status={fb.configured && !fb.error ? 'ok' : fb.error ? 'warn' : 'warn'}
            >
              <span className="admin-pill-dot" aria-hidden />
              {fb.loading
                ? 'Loading…'
                : fb.error
                ? 'Error'
                : fb.configured
                ? `${fb.posts.length} posts`
                : 'Not configured'}
            </span>
          </div>
          {fb.error && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 'var(--space-md)' }}>
              {fb.error}
            </p>
          )}
          {!fb.loading && fb.configured && !fb.error && fb.posts.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No posts returned.</p>
          )}
          {fb.posts.length > 0 && (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {fb.posts.map((p) => (
                <article
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: p.attachment?.mediaUrl ? '80px 1fr' : '1fr',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                  }}
                >
                  {p.attachment?.mediaUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.attachment.mediaUrl}
                      alt=""
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                      {new Date(p.createdTime).toLocaleString(undefined, {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {p.message && (
                      <p
                        style={{
                          fontSize: 14,
                          color: 'var(--text-1)',
                          margin: '0 0 var(--space-sm) 0',
                          whiteSpace: 'pre-wrap',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.message}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 12, color: 'var(--text-2)' }}>
                      <span>👍 {p.reactions}</span>
                      <span>💬 {p.comments}</span>
                      {p.permalinkUrl && (
                        <a
                          href={p.permalinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)' }}
                        >
                          Open on Facebook ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Data management --------------------------------------------- */}
        <section className="admin-section admin-col-full">
          <div className="admin-section-head">
            <div>
              <span className="admin-eyebrow">Data</span>
              <h2 className="admin-section-title">Context storage</h2>
              <p className="admin-section-desc">
                Context is stored in Upstash Redis. Use the Overview page&apos;s natural-language update bar, or edit items directly on their respective pages. This page is read-only.
              </p>
            </div>
          </div>
          <div className="admin-actions">
            <Link href="/" className="btn btn-ghost btn-lg">Go to Overview</Link>
            <Link href="/projects" className="btn btn-ghost btn-lg">Projects</Link>
            <Link href="/goals" className="btn btn-ghost btn-lg">Tasks</Link>
            <Link href="/clients" className="btn btn-ghost btn-lg">Clients</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
