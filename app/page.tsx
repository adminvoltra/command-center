'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/lib/useAppContext';
import { CollaboratorBadges } from '@/components/CollaboratorPicker';

const backgroundImages = [
  '/media/Gould_Vesturhorn-Mt.-Wave-Reflections-.jpg',
  '/media/Great-Ocean-Road-London-Bridge.jpg',
  '/media/Lake-Moraine-Tree-and-Mountain-Vista.jpg',
  '/media/Lilac-breasted-Roller,-Tanzania-2.jpg',
  '/media/Paris-Opera-Ceiling--by-Marc-Chagall.jpg',
  '/media/RGCreationZone_Background.jpg',
  '/media/Sydney-Opera-House-16-mm.jpg',
  '/media/Train-Street-In-Hanoi,-VIetnam.jpg',
  '/media/Vatnajaokull-Iceland-Fire-and-Ice-Sunrise-Edit-2.jpg',
  '/media/View-from-Tunnel-Bridge-at-Sunset.jpg',
  '/media/Yellowstone-Sunstars-Trees-in-Winter.jpg',
  '/media/Yosemite--Half-Dome-Vibrant-Colors.jpg',
  '/media/Yosemite-Rapids-Fall-Colors.jpg',
];

export default function Overview() {
  const { ctx, refresh, isLoading } = useAppContext();
  const [updateText, setUpdateText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const updateMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (updateMsgTimerRef.current) clearTimeout(updateMsgTimerRef.current);
    };
  }, []);

  const backgroundImage = useMemo(() => {
    return backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
  }, []);

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
        await refresh();
        setUpdateText('');
        setUpdateMsg('Updated successfully');
        if (updateMsgTimerRef.current) clearTimeout(updateMsgTimerRef.current);
        updateMsgTimerRef.current = setTimeout(() => setUpdateMsg(''), 3000);
      } else {
        setUpdateMsg(data.error || 'Update failed.');
      }
    } catch {
      setUpdateMsg('Update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const totalProjects = ctx.projects.length;
  const activeProjects = ctx.projects.filter(p => p.status === 'active').length;
  const doneGoals = ctx.weeklyGoals.filter(g => g.done).length;
  const totalGoals = ctx.weeklyGoals.length;
  const totalTasks = ctx.projects.reduce((sum, p) => sum + (p.tasks || []).length, 0);
  const doneTasks = ctx.projects.reduce((sum, p) => sum + (p.tasks || []).filter(t => t.done).length, 0);
  const scheduleEvents = (ctx.scheduleEvents || []).length;

  return (
    <main className="page-container overview-page">
      {/* Background Image */}
      <div className="overview-background" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="overview-overlay" />

      {/* Hero Banner */}
      <div className="hero-banner" style={{ backgroundImage: `url('/branding/cover-header2.png')` }}>
        <div className="hero-banner-overlay" />
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">
          Last updated {new Date(ctx.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mc-stats" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="mc-stat">
          <span className="mc-stat-value">{activeProjects}</span>
          <span className="mc-stat-label">Active Projects</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{doneTasks}/{totalTasks || '—'}</span>
          <span className="mc-stat-label">Tasks Done</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{doneGoals}/{totalGoals || '—'}</span>
          <span className="mc-stat-label">Goals Done</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{scheduleEvents}</span>
          <span className="mc-stat-label">Scheduled Events</span>
        </div>
      </div>

      {/* Active Projects */}
      {ctx.projects.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projects</h2>
          <div className="project-grid">
            {ctx.projects.map(project => {
              const phases = project.phases || [];
              const completedPhases = phases.filter(p => p.status === 'complete').length;
              const currentPhase = phases.find(p => p.status === 'in-progress') || phases.find(p => p.status !== 'complete');
              const projectTasks = (project.tasks || []);
              const tasksDone = projectTasks.filter(t => t.done).length;

              return (
                <Link href={`/projects/${project.id}`} key={project.id} className="project-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <div className="project-header">
                    <span className="project-name">{project.name}</span>
                    <div className="project-meta">
                      <CollaboratorBadges assignees={project.assignees || []} />
                      <span className={`badge badge-${project.status}`}>{project.status}</span>
                    </div>
                  </div>
                  <div className="project-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                    </div>
                    <div className="progress-label">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                  </div>
                  {project.notes && <p className="project-notes">{project.notes}</p>}
                  <div className="project-footer">
                    {phases.length > 0 && <span className="project-rate">{completedPhases}/{phases.length} phases</span>}
                    {projectTasks.length > 0 && <span className="project-rate">{tasksDone}/{projectTasks.length} tasks</span>}
                    {currentPhase && <span className="project-days">Phase: {currentPhase.name}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
        </Link>

        <Link href="/schedule" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="nav-card-label">Schedule</span>
          <span className="nav-card-count">{scheduleEvents} events</span>
        </Link>

        <Link href="/todos" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <span className="nav-card-label">Todos</span>
          <span className="nav-card-count">{doneTasks}/{totalTasks}</span>
        </Link>

        <Link href="/log" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span className="nav-card-label">Work Log</span>
          <span className="nav-card-count">{(ctx.activityLog || []).filter(a => a.timestamp.startsWith(today)).length} today</span>
        </Link>
      </div>

      {/* Update Section */}
      <div className="update-section">
        <h2 className="update-title">Update Dashboard</h2>
        <p className="update-subtitle">
          Type natural language commands. Example: &quot;Mark project X as done&quot; or &quot;Add a new growth project&quot;
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
          <button className="update-btn" onClick={handleUpdate} disabled={isUpdating || !updateText.trim()}>
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
        {updateMsg && <div className="update-msg">{updateMsg}</div>}
      </div>
    </main>
  );
}
