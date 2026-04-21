'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Task, Collaborator } from '@/lib/context';
import { COLLABORATORS } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';

export default function TodosPage() {
  const { ctx, save, saveWithActivity, isLoading } = useAppContext();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [collabFilter, setCollabFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showDone, setShowDone] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskAssignees, setNewTaskAssignees] = useState<Collaborator[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

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
    const project = ctx.projects.find(p => p.id === projectId);
    const task = project?.tasks?.find(t => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;
    const updatedProjects = ctx.projects.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: (p.tasks || []).map(t =>
          t.id === taskId ? { ...t, done: newDone } : t
        ),
      };
    });
    const updatedCtx = { ...ctx, projects: updatedProjects };
    if (newDone) {
      saveWithActivity(updatedCtx, {
        type: 'reminder_completed',
        description: `Completed task: "${task.title}"`,
        metadata: { taskId, projectId, projectName: project?.name },
      });
    } else {
      save(updatedCtx);
    }
  };

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.done).length;
  const overdueTasks = allTasks.filter(t => !t.done && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length;

  const addTask = () => {
    if (!newTaskTitle.trim() || !newTaskProject) return;
    const task: Task & { projectName?: string } = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      done: false,
      priority: newTaskPriority,
      assignees: newTaskAssignees,
      dueDate: newTaskDueDate || undefined,
      projectId: newTaskProject,
      createdAt: new Date().toISOString(),
    };
    delete task.projectName;
    const project = ctx.projects.find(p => p.id === newTaskProject);
    const updatedProjects = ctx.projects.map(p =>
      p.id === newTaskProject ? { ...p, tasks: [...(p.tasks || []), task] } : p
    );
    saveWithActivity(
      { ...ctx, projects: updatedProjects },
      {
        type: 'reminder_created',
        description: `Created task: "${task.title}"`,
        metadata: { taskId: task.id, projectId: newTaskProject, projectName: project?.name, priority: task.priority },
      }
    );
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskAssignees([]);
    setNewTaskDueDate('');
    setAddingTask(false);
  };

  return (
    <main className="page-container">
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Link href="/projects" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>← Projects</Link>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Todos</h1>
          <p className="page-subtitle">
            {doneTasks}/{totalTasks} completed
            {overdueTasks > 0 && <span style={{ color: 'var(--error)', marginLeft: 'var(--space-sm)' }}>{overdueTasks} overdue</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddingTask(true)}>+ Add Todo</button>
      </div>

      {addingTask && (
        <div className="task-add-form" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div className="edit-row">
            <label>Task *</label>
            <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="edit-input" placeholder="Task title..." autoFocus onKeyDown={e => e.key === 'Enter' && addTask()} />
          </div>
          <div className="edit-row">
            <label>Project *</label>
            <select value={newTaskProject} onChange={e => setNewTaskProject(e.target.value)} className="edit-select">
              <option value="">Select a project</option>
              {ctx.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="task-add-options">
            <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')} className="edit-select">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className="edit-input" />
            <CollaboratorPicker selected={newTaskAssignees} onChange={setNewTaskAssignees} />
          </div>
          <div className="edit-actions" style={{ marginTop: 'var(--space-sm)' }}>
            <button className="btn btn-small btn-primary" onClick={addTask} disabled={!newTaskTitle.trim() || !newTaskProject}>Add Todo</button>
            <button className="btn btn-small" onClick={() => setAddingTask(false)}>Cancel</button>
          </div>
        </div>
      )}

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
