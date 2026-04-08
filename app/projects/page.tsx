'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { Project, Task, Collaborator } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';
import ProjectCard from '@/components/ProjectCard';

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

  const { lukeProjects, aidanProjects, unassignedProjects } = useMemo(() => ({
    lukeProjects: ctx.projects.filter(p => (p.assignees || []).includes('Luke')),
    aidanProjects: ctx.projects.filter(p => (p.assignees || []).includes('Aidan')),
    unassignedProjects: ctx.projects.filter(p => !p.assignees || p.assignees.length === 0),
  }), [ctx.projects]);

  const renderProjectCard = (project: Project) => (
    <ProjectCard
      key={project.id}
      project={project}
      isEditing={editingId === project.id}
      editDraft={editDraft}
      isExpanded={expandedProject === project.id}
      onUpdateDraft={updateDraft}
      onSaveProject={saveProject}
      onCancelEditing={cancelEditing}
      onStartEditing={startEditing}
      onRequestDelete={setDeleteConfirm}
      onToggleExpand={setExpandedProject}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      addingTaskFor={addingTaskFor}
      onSetAddingTaskFor={setAddingTaskFor}
      newTaskTitle={newTaskTitle}
      onSetNewTaskTitle={setNewTaskTitle}
      newTaskPriority={newTaskPriority}
      onSetNewTaskPriority={setNewTaskPriority}
      newTaskAssignees={newTaskAssignees}
      onSetNewTaskAssignees={setNewTaskAssignees}
      newTaskDueDate={newTaskDueDate}
      onSetNewTaskDueDate={setNewTaskDueDate}
      onAddTask={addTask}
    />
  );

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
          {lukeProjects.map(renderProjectCard)}
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
          {aidanProjects.map(renderProjectCard)}
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
            {unassignedProjects.map(renderProjectCard)}
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
