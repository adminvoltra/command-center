'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import type { AgencyScoreEntry } from '@/lib/context';

const HERO_IMAGE = '/branding/cover header2.png';

export default function Overview() {
  const { ctx, save, refresh, isLoading } = useAppContext();
  const [updateText, setUpdateText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);


  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Get today's agency score if it exists
  const todayScore: AgencyScoreEntry | undefined = (ctx.agencyScores || []).find(s => s.date === today);

  // Get recent scores for trend (last 7 days)
  const recentScores = (ctx.agencyScores || []).slice(-7);

  // Calculate agency score
  const calculateScore = async () => {
    setIsCalculatingScore(true);
    try {
      const res = await fetch('/api/agency-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx }),
      });
      const data = await res.json();
      if (data.success) {
        await refresh(); // Refresh context to get updated scores
        setShowScoreModal(true);
      }
    } catch (err) {
      console.error('Failed to calculate score:', err);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'var(--success)';
    if (score >= 60) return 'var(--gold)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  const handleUpdate = async () => {
    if (!updateText.trim()) return;
    setIsUpdating(true);
    setUpdateMsg('');

    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: updateText, currentContext: ctx }),
      });
      const data = await res.json();
      if (data.success) {
        await refresh(); // Reload context from Redis
        setUpdateText('');
        setUpdateMsg('Dashboard updated successfully');
        setTimeout(() => setUpdateMsg(''), 3000);
      } else {
        setUpdateMsg(data.error || 'Update failed. Please try again.');
      }
    } catch {
      setUpdateMsg('Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate stats
  const totalProjects = ctx.projects.length;
  const paidProjects = ctx.projects.filter(p => p.category === 'paid').length;
  const growthProjects = ctx.projects.filter(p => p.category === 'growth').length;
  const doneGoals = ctx.weeklyGoals.filter(g => g.done).length;
  const totalGoals = ctx.weeklyGoals.length;
  const highPriorityGoals = ctx.weeklyGoals.filter(g => g.priority === 'high' && !g.done).length;

  return (
    <main className="page-container overview-page">
      {/* Background Image */}
      <div
        className="overview-background"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <div className="overview-overlay" />

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">
          Last updated {new Date(ctx.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Agency Score - Main Feature */}
      <div className="agency-score-section">
        <button
          className="agency-score-card"
          onClick={() => todayScore ? setShowScoreModal(true) : calculateScore()}
          disabled={isCalculatingScore}
        >
          <div className="agency-score-header">
            <span className="agency-score-label">Agency Score</span>
            <span className="agency-score-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>

          {isCalculatingScore ? (
            <div className="agency-score-loading">
              <div className="loading-spinner" />
              <span>Analyzing productivity...</span>
            </div>
          ) : todayScore ? (
            <>
              <div className="agency-score-value" style={{ color: getScoreColor(todayScore.score) }}>
                {todayScore.score}
              </div>
              <div className="agency-score-rating" style={{ color: getScoreColor(todayScore.score) }}>
                {getScoreLabel(todayScore.score)}
              </div>
              <div className="agency-score-activities">
                {todayScore.activitiesCount} activities logged
              </div>
              <div className="agency-score-cta">Click for detailed report</div>
            </>
          ) : (
            <>
              <div className="agency-score-empty">
                <span className="agency-score-empty-icon">◆</span>
                <span>Calculate Today&apos;s Score</span>
              </div>
              <div className="agency-score-activities">
                {(ctx.activityLog || []).filter(a => a.timestamp.startsWith(today)).length} activities logged today
              </div>
            </>
          )}

          {/* Mini trend chart */}
          {recentScores.length > 1 && (
            <div className="agency-score-trend">
              {recentScores.map((s, i) => (
                <div
                  key={s.date}
                  className="trend-bar"
                  style={{
                    height: `${s.score}%`,
                    background: i === recentScores.length - 1 ? getScoreColor(s.score) : 'var(--surface-3)',
                  }}
                  title={`${s.date}: ${s.score}`}
                />
              ))}
            </div>
          )}
        </button>
      </div>

      {/* Navigation Cards */}
      <div className="overview-nav">
        <Link href="/projects" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
            </svg>
          </div>
          <span className="nav-card-label">Projects</span>
          <span className="nav-card-count">{totalProjects} total</span>
          <span className="nav-card-detail">{paidProjects} paid · {growthProjects} growth</span>
        </Link>

        <Link href="/goals" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <span className="nav-card-label">Goals</span>
          <span className="nav-card-count">{doneGoals}/{totalGoals} done</span>
          <span className="nav-card-detail">{highPriorityGoals > 0 ? `${highPriorityGoals} high priority` : 'No high priority'}</span>
        </Link>

        <Link href="/schedule" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="nav-card-label">Schedule</span>
          <span className="nav-card-count">{ctx.dailyPlan.length} blocks</span>
          <span className="nav-card-detail">{ctx.dailyPlan[0]?.time || 'No schedule'}</span>
        </Link>

        <Link href="/jobs" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <span className="nav-card-label">Clients</span>
          <span className="nav-card-count">{ctx.jobSearch.activeConversations.length} active</span>
          <span className="nav-card-detail">{ctx.jobSearch.applicationsThisWeek} contacts this week</span>
        </Link>

        <Link href="/log" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="nav-card-label">Work Log</span>
          <span className="nav-card-count">{(ctx.activityLog || []).length} entries</span>
          <span className="nav-card-detail">{(ctx.activityLog || []).filter(a => a.timestamp.startsWith(today)).length} today</span>
        </Link>
      </div>

      {/* Update Section */}
      <div className="update-section">
        <h2 className="update-title">Update Dashboard</h2>
        <p className="update-subtitle">
          Type natural language commands to update your dashboard. Example: &quot;Mark project X as done&quot; or &quot;Add new client to target companies&quot;
        </p>
        <div className="update-bar">
          <input
            className="update-input"
            type="text"
            placeholder="Tell Claude what to update..."
            value={updateText}
            onChange={e => setUpdateText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); }}
            disabled={isUpdating}
          />
          <button
            className="update-btn"
            onClick={handleUpdate}
            disabled={isUpdating || !updateText.trim()}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
        {updateMsg && <div className="update-msg">{updateMsg}</div>}
      </div>

      {/* Agency Score Detail Modal */}
      <Modal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        title="Agency Score Report"
      >
        {todayScore && (
          <div className="agency-report">
            <div className="agency-report-header">
              <div className="agency-report-score" style={{ color: getScoreColor(todayScore.score) }}>
                {todayScore.score}
                <span className="agency-report-max">/100</span>
              </div>
              <div className="agency-report-label" style={{ color: getScoreColor(todayScore.score) }}>
                {getScoreLabel(todayScore.score)}
              </div>
            </div>

            <div className="agency-report-meta">
              <span>{new Date(todayScore.calculatedAt).toLocaleString()}</span>
              <span>{todayScore.activitiesCount} activities analyzed</span>
            </div>

            <div className="agency-report-content">
              <h4>Analysis</h4>
              <p>{todayScore.report}</p>
            </div>

            {/* Today's Activities */}
            <div className="agency-report-activities">
              <h4>Today&apos;s Activities</h4>
              {(ctx.activityLog || [])
                .filter(a => a.timestamp.startsWith(today))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(activity => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-type">{activity.type.replace('_', ' ')}</span>
                    <span className="activity-desc">{activity.description}</span>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              {(ctx.activityLog || []).filter(a => a.timestamp.startsWith(today)).length === 0 && (
                <p className="no-activities">No activities logged today yet.</p>
              )}
            </div>

            <div className="agency-report-actions">
              <button className="btn" onClick={() => setShowScoreModal(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => { setShowScoreModal(false); calculateScore(); }}>
                Recalculate
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
