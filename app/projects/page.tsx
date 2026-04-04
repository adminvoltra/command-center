'use client';

import { useState } from 'react';
import type { Project, Task, Collaborator } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';

type ProjectCategory = 'paid' | 'growth';
type ProjectStatus = 'active' | 'waiting' | 'blocked' | 'done';

const emptyProject: Omit<Project, 'id'> = {
  name: '',
  category: 'paid',
  status: 'active',
  progress: 0,
  notes: '',
  rate: '',
  value: '',
  daysToFinish: undefined,
  assignees: [],
  tasks: [],
};

export default function ProjectsPage() {
  const { ctx, save, saveWithActivity, isLoading } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Project | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>(emptyProject);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  // Task add
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
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

  // CREATE project
  const addProject = () => {
    if (!newProject.name.trim()) return;
    const project: Project = {
      ...newProject,
      id: Date.now().toString(),
      tasks: [],
    };
    saveWithActivity(
      { ...ctx, projects: [...ctx.projects, project] },
      { type: 'project_created', description: `Created project: "${newProject.name}"`, metadata: { category: newProject.category } }
    );
    setNewProject(emptyProject);
    setIsAddModalOpen(false);
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditDraft({ ...project });
  };

  const updateDraft = (updates: Partial<Project>) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, ...updates });
  };

  const saveProject = () => {
    if (!editDraft) return;
    const originalProject = ctx.projects.find(p => p.id === editDraft.id);
    if (!originalProject) return;

    const updatedCtx = {
      ...ctx,
      projects: ctx.projects.map(p => (p.id === editDraft.id ? editDraft : p)),
    };

    if (editDraft.status === 'done' && originalProject.status !== 'done') {
      saveWithActivity(updatedCtx, {
        type: 'project_completed',
        description: `Completed project: "${editDraft.name}"`,
        metadata: { projectId: editDraft.id }
      });
    } else if (editDraft.progress > (originalProject.progress || 0)) {
      saveWithActivity(updatedCtx, {
        type: 'project_progress',
        description: `Updated "${editDraft.name}" progress: ${originalProject.progress}% → ${editDraft.progress}%`,
        metadata: { projectId: editDraft.id }
      });
    } else {
      save(updatedCtx);
    }

    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const deleteProject = (id: string) => {
    save({ ...ctx, projects: ctx.projects.filter(p => p.id !== id) });
    setDeleteConfirm(null);
  };

  // TASK CRUD
  const addTask = (projectId: string) => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      done: false,
      priority: newTaskPriority,
      assignees: newTaskAssignees,
      dueDate: newTaskDueDate || undefined,
      projectId,
      createdAt: new Date().toISOString(),
    };
    const updatedProjects = ctx.projects.map(p =>
      p.id === projectId ? { ...p, tasks: [...(p.tasks || []), task] } : p
    );
    save({ ...ctx, projects: updatedProjects });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskAssignees([]);
    setNewTaskDueDate('');
    setAddingTaskFor(null);
  };

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

  const deleteTask = (projectId: string, taskId: string) => {
    const updatedProjects = ctx.projects.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId) };
    });
    save({ ...ctx, projects: updatedProjects });
  };

  const paidProjects = ctx.projects.filter(p => p.category === 'paid');
  const growthProjects = ctx.projects.filter(p => p.category === 'growth');

  const lukeProjects = ctx.projects.filter(p => (p.assignees || []).includes('Luke'));
  const aidanProjects = ctx.projects.filter(p => (p.assignees || []).includes('Aidan'));
  const unassignedProjects = ctx.projects.filter(p => !p.assignees || p.assignees.length === 0);

  const ProjectCard = ({ project }: { project: Project }) => {
    const isEditing = editingId === project.id;
    const isExpanded = expandedProject === project.id;
    const tasks = project.tasks || [];
    const doneTasks = tasks.filter(t => t.done).length;

    if (isEditing && editDraft) {
      return (
        <div className="project-card editing">
          <div className="edit-form">
            <div className="edit-row">
              <label>Name</label>
              <input type="text" value={editDraft.name} onChange={e => updateDraft({ name: e.target.value })} className="edit-input" />
            </div>
            <div className="edit-row">
              <label>Assignees</label>
              <CollaboratorPicker selected={editDraft.assignees || []} onChange={assignees => updateDraft({ assignees })} />
            </div>
            <div className="edit-row-group">
              <div className="edit-row">
                <label>Status</label>
                <select value={editDraft.status} onChange={e => updateDraft({ status: e.target.value as ProjectStatus })} className="edit-select">
                  <option value="active">Active</option>
                  <option value="waiting">Waiting</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="edit-row">
                <label>Category</label>
                <select value={editDraft.category} onChange={e => updateDraft({ category: e.target.value as ProjectCategory })} className="edit-select">
                  <option value="paid">Paid</option>
                  <option value="growth">Growth</option>
                </select>
              </div>
            </div>
            <div className="edit-row">
              <label>Progress ({editDraft.progress}%)</label>
              <input type="range" min="0" max="100" value={editDraft.progress} onChange={e => updateDraft({ progress: parseInt(e.target.value) })} className="edit-range" />
            </div>
            <div className="edit-row-group">
              <div className="edit-row">
                <label>Rate</label>
                <input type="text" value={editDraft.rate || ''} onChange={e => updateDraft({ rate: e.target.value })} className="edit-input" placeholder="e.g. $50/hr" />
              </div>
              <div className="edit-row">
                <label>Value</label>
                <input type="text" value={editDraft.value || ''} onChange={e => updateDraft({ value: e.target.value })} className="edit-input" placeholder="e.g. $5,000" />
              </div>
            </div>
            <div className="edit-row">
              <label>Notes</label>
              <textarea value={editDraft.notes} onChange={e => updateDraft({ notes: e.target.value })} className="edit-textarea" rows={3} />
            </div>
            <div className="edit-actions">
              <button className="btn btn-small btn-primary" onClick={saveProject}>Save</button>
              <button className="btn btn-small" onClick={cancelEditing}>Cancel</button>
              <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm(project.id)}>Delete</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="project-card">
        <div className="project-header" onClick={() => startEditing(project)} style={{ cursor: 'pointer' }}>
          <span className="project-name">{project.name}</span>
          <div className="project-meta">
            <CollaboratorBadges assignees={project.assignees || []} />
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
        </div>

        <div className="project-progress">
          <div className="progress-bar">
            <div className={`progress-fill ${project.category === 'growth' ? 'blue' : ''}`} style={{ width: `${project.progress}%` }} />
          </div>
          <div className="progress-label">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
        </div>

        {project.notes && <p className="project-notes">{project.notes}</p>}

        {(project.rate || project.value || project.daysToFinish) && (
          <div className="project-footer">
            {project.rate && <span className="project-rate">{project.rate}</span>}
            {project.value && <span className="project-rate">{project.value}</span>}
            {project.daysToFinish && <span className="project-days">~{project.daysToFinish} days remaining</span>}
          </div>
        )}

        {/* Tasks section */}
        <div className="project-tasks-section">
          <div className="project-tasks-header" onClick={() => setExpandedProject(isExpanded ? null : project.id)} style={{ cursor: 'pointer' }}>
            <span className="project-tasks-label">
              Tasks {tasks.length > 0 && <span className="task-count">{doneTasks}/{tasks.length}</span>}
            </span>
            <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
          </div>

          {isExpanded && (
            <div className="task-list">
              {tasks.sort((a, b) => Number(a.done) - Number(b.done)).map(task => (
                <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
                  <button className="task-check" onClick={() => toggleTask(project.id, task.id)}>
                    {task.done ? '✓' : ''}
                  </button>
                  <div className="task-body">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      <span className={`badge badge-sm badge-${task.priority}`}>{task.priority}</span>
                      <CollaboratorBadges assignees={task.assignees} />
                      {task.dueDate && <span className="task-due">{task.dueDate}</span>}
                    </div>
                  </div>
                  <button className="task-delete" onClick={() => deleteTask(project.id, task.id)}>×</button>
                </div>
              ))}

              {addingTaskFor === project.id ? (
                <div className="task-add-form">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="edit-input"
                    placeholder="Task title..."
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && addTask(project.id)}
                  />
                  <div className="task-add-options">
                    <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')} className="edit-select">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className="edit-input" />
                    <CollaboratorPicker selected={newTaskAssignees} onChange={setNewTaskAssignees} />
                  </div>
                  <div className="edit-actions">
                    <button className="btn btn-small btn-primary" onClick={() => addTask(project.id)} disabled={!newTaskTitle.trim()}>Add</button>
                    <button className="btn btn-small" onClick={() => setAddingTaskFor(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-small" onClick={() => setAddingTaskFor(project.id)} style={{ marginTop: 'var(--space-sm)' }}>
                  + Add Task
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {ctx.projects.length} total projects across paid and growth categories
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Project
        </button>
      </div>

      {/* Luke's Projects */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="section-header">
          <h2 className="section-title"><span className="collab-badge collab-badge-luke" style={{ fontSize: 14, padding: '4px 12px', marginRight: 8 }}>Luke</span> Projects</h2>
          <span className="section-badge">{lukeProjects.length} projects</span>
        </div>
        <div className="project-grid">
          {lukeProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {lukeProjects.length === 0 && (
            <div className="empty-state">No projects assigned to Luke yet</div>
          )}
        </div>
      </section>

      {/* Aidan's Projects */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="section-header">
          <h2 className="section-title"><span className="collab-badge collab-badge-aidan" style={{ fontSize: 14, padding: '4px 12px', marginRight: 8 }}>Aidan</span> Projects</h2>
          <span className="section-badge">{aidanProjects.length} projects</span>
        </div>
        <div className="project-grid">
          {aidanProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {aidanProjects.length === 0 && (
            <div className="empty-state">No projects assigned to Aidan yet</div>
          )}
        </div>
      </section>

      {/* Unassigned Projects */}
      {unassignedProjects.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Unassigned</h2>
            <span className="section-badge">{unassignedProjects.length} projects</span>
          </div>
          <div className="project-grid">
            {unassignedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Add Project Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Project">
        <div className="edit-form">
          <div className="edit-row">
            <label>Name *</label>
            <input type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="edit-input" placeholder="Project name" autoFocus />
          </div>
          <div className="edit-row">
            <label>Assignees</label>
            <CollaboratorPicker selected={newProject.assignees} onChange={assignees => setNewProject({ ...newProject, assignees })} />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Category</label>
              <select value={newProject.category} onChange={e => setNewProject({ ...newProject, category: e.target.value as ProjectCategory })} className="edit-select">
                <option value="paid">Paid</option>
                <option value="growth">Growth</option>
              </select>
            </div>
            <div className="edit-row">
              <label>Status</label>
              <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })} className="edit-select">
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="edit-row">
            <label>Progress ({newProject.progress}%)</label>
            <input type="range" min="0" max="100" value={newProject.progress} onChange={e => setNewProject({ ...newProject, progress: parseInt(e.target.value) })} className="edit-range" />
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <textarea value={newProject.notes} onChange={e => setNewProject({ ...newProject, notes: e.target.value })} className="edit-textarea" rows={3} placeholder="Project details..." />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addProject} disabled={!newProject.name.trim()}>Add Project</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Project">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>
          Are you sure you want to delete this project? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => deleteConfirm && deleteProject(deleteConfirm)}>Delete</button>
        </div>
      </Modal>
    </main>
  );
}
