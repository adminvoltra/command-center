'use client';

import { useState } from 'react';
import type { Project } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

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
};

export default function ProjectsPage() {
  const { ctx, save, saveWithActivity, isLoading } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Project | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>(emptyProject);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // CREATE
  const addProject = () => {
    if (!newProject.name.trim()) return;
    const project: Project = {
      ...newProject,
      id: Date.now().toString(),
    };
    saveWithActivity(
      { ...ctx, projects: [...ctx.projects, project] },
      { type: 'project_created', description: `Created project: "${newProject.name}"`, metadata: { category: newProject.category } }
    );
    setNewProject(emptyProject);
    setIsAddModalOpen(false);
  };

  // Start editing - copy project to draft
  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditDraft({ ...project });
  };

  // Update draft (local only, no save)
  const updateDraft = (updates: Partial<Project>) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, ...updates });
  };

  // SAVE - commit draft to context
  const saveProject = () => {
    if (!editDraft) return;

    const originalProject = ctx.projects.find(p => p.id === editDraft.id);
    if (!originalProject) return;

    const updatedCtx = {
      ...ctx,
      projects: ctx.projects.map(p => (p.id === editDraft.id ? editDraft : p)),
    };

    // Log activity for significant changes
    if (editDraft.status === 'done' && originalProject.status !== 'done') {
      saveWithActivity(updatedCtx, {
        type: 'project_completed',
        description: `Completed project: "${editDraft.name}"`,
        metadata: { projectId: editDraft.id, category: editDraft.category }
      });
    } else if (editDraft.progress > (originalProject.progress || 0)) {
      saveWithActivity(updatedCtx, {
        type: 'project_progress',
        description: `Updated "${editDraft.name}" progress: ${originalProject.progress}% → ${editDraft.progress}%`,
        metadata: { projectId: editDraft.id, oldProgress: originalProject.progress, newProgress: editDraft.progress }
      });
    } else {
      save(updatedCtx);
    }

    setEditingId(null);
    setEditDraft(null);
  };

  // Cancel editing - discard draft
  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  // DELETE
  const deleteProject = (id: string) => {
    save({ ...ctx, projects: ctx.projects.filter(p => p.id !== id) });
    setDeleteConfirm(null);
  };

  const paidProjects = ctx.projects.filter(p => p.category === 'paid');
  const growthProjects = ctx.projects.filter(p => p.category === 'growth');

  const ProjectCard = ({ project }: { project: Project }) => {
    const isEditing = editingId === project.id;
    const draft = isEditing && editDraft ? editDraft : project;

    if (isEditing && editDraft) {
      return (
        <div className="project-card editing">
          <div className="edit-form">
            <div className="edit-row">
              <label>Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={e => updateDraft({ name: e.target.value })}
                className="edit-input"
              />
            </div>
            <div className="edit-row-group">
              <div className="edit-row">
                <label>Status</label>
                <select
                  value={draft.status}
                  onChange={e => updateDraft({ status: e.target.value as ProjectStatus })}
                  className="edit-select"
                >
                  <option value="active">Active</option>
                  <option value="waiting">Waiting</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="edit-row">
                <label>Category</label>
                <select
                  value={draft.category}
                  onChange={e => updateDraft({ category: e.target.value as ProjectCategory })}
                  className="edit-select"
                >
                  <option value="paid">Paid</option>
                  <option value="growth">Growth</option>
                </select>
              </div>
            </div>
            <div className="edit-row">
              <label>Progress ({draft.progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={draft.progress}
                onChange={e => updateDraft({ progress: parseInt(e.target.value) })}
                className="edit-range"
              />
            </div>
            <div className="edit-row-group">
              <div className="edit-row">
                <label>Rate</label>
                <input
                  type="text"
                  value={draft.rate || ''}
                  onChange={e => updateDraft({ rate: e.target.value })}
                  className="edit-input"
                  placeholder="e.g. $50/hr"
                />
              </div>
              <div className="edit-row">
                <label>Value</label>
                <input
                  type="text"
                  value={draft.value || ''}
                  onChange={e => updateDraft({ value: e.target.value })}
                  className="edit-input"
                  placeholder="e.g. $5,000"
                />
              </div>
            </div>
            <div className="edit-row">
              <label>Days to Finish</label>
              <input
                type="number"
                value={draft.daysToFinish || ''}
                onChange={e => updateDraft({ daysToFinish: e.target.value ? parseInt(e.target.value) : undefined })}
                className="edit-input"
                placeholder="Optional"
              />
            </div>
            <div className="edit-row">
              <label>Notes</label>
              <textarea
                value={draft.notes}
                onChange={e => updateDraft({ notes: e.target.value })}
                className="edit-textarea"
                rows={3}
              />
            </div>
            <div className="edit-actions">
              <button className="btn btn-small btn-primary" onClick={saveProject}>
                Save
              </button>
              <button className="btn btn-small" onClick={cancelEditing}>
                Cancel
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => setDeleteConfirm(project.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="project-card" onClick={() => startEditing(project)} style={{ cursor: 'pointer' }}>
        <div className="project-header">
          <span className="project-name">{project.name}</span>
          <div className="project-meta">
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
        </div>

        <div className="project-progress">
          <div className="progress-bar">
            <div
              className={`progress-fill ${project.category === 'growth' ? 'blue' : ''}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="progress-label">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
        </div>

        <p className="project-notes">{project.notes}</p>

        {(project.rate || project.value || project.daysToFinish) && (
          <div className="project-footer">
            {project.rate && <span className="project-rate">{project.rate}</span>}
            {project.value && <span className="project-rate">{project.value}</span>}
            {project.daysToFinish && (
              <span className="project-days">~{project.daysToFinish} days remaining</span>
            )}
          </div>
        )}
        <div className="card-edit-hint">Click to edit</div>
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

      {/* Paid Projects */}
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="section-header">
          <h2 className="section-title">Paid Income</h2>
          <span className="section-badge">{paidProjects.length} projects</span>
        </div>
        <div className="project-grid">
          {paidProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {paidProjects.length === 0 && (
            <div className="empty-state">No paid projects yet</div>
          )}
        </div>
      </section>

      {/* Growth Projects */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Growth Ventures</h2>
          <span className="section-badge">{growthProjects.length} projects</span>
        </div>
        <div className="project-grid">
          {growthProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {growthProjects.length === 0 && (
            <div className="empty-state">No growth projects yet</div>
          )}
        </div>
      </section>

      {/* Add Project Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Project">
        <div className="edit-form">
          <div className="edit-row">
            <label>Name *</label>
            <input
              type="text"
              value={newProject.name}
              onChange={e => setNewProject({ ...newProject, name: e.target.value })}
              className="edit-input"
              placeholder="Project name"
              autoFocus
            />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Category</label>
              <select
                value={newProject.category}
                onChange={e => setNewProject({ ...newProject, category: e.target.value as ProjectCategory })}
                className="edit-select"
              >
                <option value="paid">Paid</option>
                <option value="growth">Growth</option>
              </select>
            </div>
            <div className="edit-row">
              <label>Status</label>
              <select
                value={newProject.status}
                onChange={e => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                className="edit-select"
              >
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="edit-row">
            <label>Progress ({newProject.progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={newProject.progress}
              onChange={e => setNewProject({ ...newProject, progress: parseInt(e.target.value) })}
              className="edit-range"
            />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Rate</label>
              <input
                type="text"
                value={newProject.rate || ''}
                onChange={e => setNewProject({ ...newProject, rate: e.target.value })}
                className="edit-input"
                placeholder="e.g. $50/hr"
              />
            </div>
            <div className="edit-row">
              <label>Value</label>
              <input
                type="text"
                value={newProject.value || ''}
                onChange={e => setNewProject({ ...newProject, value: e.target.value })}
                className="edit-input"
                placeholder="e.g. $5,000"
              />
            </div>
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <textarea
              value={newProject.notes}
              onChange={e => setNewProject({ ...newProject, notes: e.target.value })}
              className="edit-textarea"
              rows={3}
              placeholder="Project details..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addProject} disabled={!newProject.name.trim()}>
              Add Project
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Project">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>
          Are you sure you want to delete this project? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => deleteConfirm && deleteProject(deleteConfirm)}>
            Delete
          </button>
        </div>
      </Modal>
    </main>
  );
}
