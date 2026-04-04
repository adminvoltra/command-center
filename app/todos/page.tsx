'use client';

import { useState, useMemo } from 'react';
import type { Task, Collaborator } from '@/lib/context';
import { COLLABORATORS } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import { CollaboratorBadges } from '@/components/CollaboratorPicker';

export default function TodosPage() {
  const { ctx, save, isLoading } = useAppContext();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [collabFilter, setCollabFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showDone, setShowDone] = useState(false);

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // Gather all tasks from all projects
  const allTasks: (Task & { projectName: string })[] = useMemo(() => {
    return ctx.projects.flatMap(p =>
      (p.tasks || []).map(t => ({ ...t, projectId: p.id, projectName: p.name }))
    );
  }, [ctx.projects]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    if (!showDone) {
      tasks = tasks.filter(t => !t.done);
    }

    if (projectFilter !== 'all') {
      tasks = tasks.filter(t => t.projectId === projectFilter);
    }

    if (collabFilter !== 'all') {
      tasks = tasks.filter(t => t.assignees.includes(collabFilter as Collaborator));
    }

    if (dateFilter) {
      tasks = tasks.filter(t => t.dueDate === dateFilter);
    }

    // Sort: priority (high first), then due date, then creation date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return tasks;
  }, [allTasks, projectFilter, collabFilter, dateFilter, showDone]);

  const toggleTask = (projectId: string, taskId: string) => {
    const updatedProjects = ctx.projects.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: (p.tasks || []).map(t =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      };
    });
    save({ ...ctx, projects: updatedProjects });
  };

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.done).length;
  const overdueTasks = allTasks.filter(t => !t.done && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length;

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Todos</h1>
          <p className="page-subtitle">
            {doneTasks}/{totalTasks} completed
            {overdueTasks > 0 && <span style={{ color: 'var(--error)', marginLeft: 'var(--space-sm)' }}>{overdueTasks} overdue</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="todo-filters">
        <div className="todo-filter">
          <label>Project</label>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="edit-select">
            <option value="all">All Projects</option>
            {ctx.projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="todo-filter">
          <label>Assignee</label>
          <select value={collabFilter} onChange={e => setCollabFilter(e.target.value)} className="edit-select">
            <option value="all">Everyone</option>
            {COLLABORATORS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="todo-filter">
          <label>Due Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="edit-input"
          />
        </div>

        <div className="todo-filter">
          <label>&nbsp;</label>
          <label className="toggle-label">
            <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
            <span>Show completed</span>
          </label>
        </div>

        {(projectFilter !== 'all' || collabFilter !== 'all' || dateFilter) && (
          <div className="todo-filter">
            <label>&nbsp;</label>
            <button className="btn btn-small" onClick={() => { setProjectFilter('all'); setCollabFilter('all'); setDateFilter(''); }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="todo-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            {allTasks.length === 0
              ? 'No tasks yet. Add tasks from the Projects page.'
              : 'No tasks match your filters.'
            }
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = !task.done && task.dueDate && task.dueDate < new Date().toISOString().split('T')[0];
            return (
              <div key={task.id} className={`todo-item ${task.done ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`}>
                <button className="task-check" onClick={() => toggleTask(task.projectId, task.id)}>
                  {task.done ? '✓' : ''}
                </button>
                <div className="todo-body">
                  <div className="todo-title-row">
                    <span className="todo-title">{task.title}</span>
                    <span className={`badge badge-sm badge-${task.priority}`}>{task.priority}</span>
                  </div>
                  <div className="todo-meta">
                    <span className="todo-project">{task.projectName}</span>
                    <CollaboratorBadges assignees={task.assignees} />
                    {task.dueDate && (
                      <span className={`todo-due ${isOverdue ? 'overdue' : ''}`}>
                        Due: {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary stats */}
      {filteredTasks.length > 0 && (
        <div className="todo-summary">
          Showing {filteredTasks.length} of {totalTasks} tasks
        </div>
      )}
    </main>
  );
}
