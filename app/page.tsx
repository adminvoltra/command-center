'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/lib/useAppContext';
import { CollaboratorBadges } from '@/components/CollaboratorPicker';
import { GLSLHills } from '@/components/ui/glsl-hills';

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
  const upcomingEvents = (ctx.scheduleEvents || []).filter(e => e.date >= today).length;

  return (
    <main className="page-container overview-page">
      {/* Background Image */}
      <div className="overview-background" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="overview-overlay" />

      {/* Hero Banner */}
      <div className="hero-banner hero-banner-glsl">
        <GLSLHills />
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <div className="hero-banner-eyebrow">
            <span className="hero-banner-pulse" aria-hidden="true" />
            Voltra Mission Control
          </div>
          <h1 className="hero-banner-title">Overview</h1>
          <p className="hero-banner-subtitle">
            Projects, goals, meetings, and work logs — unified in one operational view for the Voltra team.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="page-subtitle">
            Last updated {new Date(ctx.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="social-links" aria-label="Voltra social links">
          <a
            href="https://github.com/orgs/Voltra-LLC/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            aria-label="Voltra on GitHub"
            title="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18.92-.26 1.9-.39 2.87-.39s1.95.13 2.87.39c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.85 1.18 3.11 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56C20.22 21.37 23.5 17.07 23.5 12 23.5 5.73 18.27.5 12 .5Z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/company/voltrallc"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            aria-label="Voltra on LinkedIn"
            title="LinkedIn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45C23.21 24 24 23.22 24 22.26V1.74C24 .78 23.21 0 22.22 0Z" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/people/Voltra-LLC/61580799924687/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            aria-label="Voltra on Facebook"
            title="Facebook"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.12 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mc-stats" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="mc-stat">
          <span className="mc-stat-value">{activeProjects}</span>
          <span className="mc-stat-label">Active Projects</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{doneTasks}/{totalTasks || '—'}</span>
          <span className="mc-stat-label">Project Todos Done</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{doneGoals}/{totalGoals || '—'}</span>
          <span className="mc-stat-label">Tasks Done</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{upcomingEvents}</span>
          <span className="mc-stat-label">Upcoming Events</span>
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
          <span className="nav-card-label">Tasks</span>
          <span className="nav-card-count">{doneGoals}/{totalGoals} done</span>
        </Link>

        <Link href="/schedule" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="nav-card-label">Calendar</span>
          <span className="nav-card-count">{upcomingEvents} upcoming</span>
        </Link>

        <Link href="/projects/todos" className="nav-card">
          <div className="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <span className="nav-card-label">Project Todos</span>
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
