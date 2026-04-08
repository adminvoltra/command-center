'use client';

import React from 'react';
import Link from 'next/link';
import type { Project, Collaborator } from '@/lib/context';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';

type ProjectCategory = 'paid' | 'growth';
type ProjectStatus = 'active' | 'waiting' | 'blocked' | 'done';

export interface ProjectCardProps {
  project: Project;
  isEditing: boolean;
  editDraft: Project | null;
  isExpanded: boolean;
  onUpdateDraft: (updates: Partial<Project>) => void;
  onSaveProject: () => void;
  onCancelEditing: () => void;
  onStartEditing: (project: Project) => void;
  onRequestDelete: (id: string) => void;
  onToggleExpand: (id: string | null) => void;
  onToggleTask: (projectId: string, taskId: string) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  addingTaskFor: string | null;
  onSetAddingTaskFor: (id: string | null) => void;
  newTaskTitle: string;
  onSetNewTaskTitle: (title: string) => void;
  newTaskPriority: 'high' | 'medium' | 'low';
  onSetNewTaskPriority: (p: 'high' | 'medium' | 'low') => void;
  newTaskAssignees: Collaborator[];
  onSetNewTaskAssignees: (a: Collaborator[]) => void;
  newTaskDueDate: string;
  onSetNewTaskDueDate: (d: string) => void;
  onAddTask: (projectId: string) => void;
}

const ProjectCard = React.memo(function ProjectCard({
  project,
  isEditing,
  editDraft,
  isExpanded,
  onUpdateDraft,
  onSaveProject,
  onCancelEditing,
  onRequestDelete,
  onToggleExpand,
  onToggleTask,
  onDeleteTask,
  addingTaskFor,
  onSetAddingTaskFor,
  newTaskTitle,
  onSetNewTaskTitle,
  newTaskPriority,
  onSetNewTaskPriority,
  newTaskAssignees,
  onSetNewTaskAssignees,
  newTaskDueDate,
  onSetNewTaskDueDate,
  onAddTask,
}: ProjectCardProps) {
  const tasks = project.tasks || [];
  const doneTasks = tasks.filter(t => t.done).length;

  if (isEditing && editDraft) {
    return (
      <div className="project-card editing">
        <div className="edit-form">
          <div className="edit-row">
            <label>Name</label>
            <input type="text" value={editDraft.name} onChange={e => onUpdateDraft({ name: e.target.value })} className="edit-input" />
          </div>
          <div className="edit-row">
            <label>Assignees</label>
            <CollaboratorPicker selected={editDraft.assignees || []} onChange={assignees => onUpdateDraft({ assignees })} />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Status</label>
              <select value={editDraft.status} onChange={e => onUpdateDraft({ status: e.target.value as ProjectStatus })} className="edit-select">
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="edit-row">
              <label>Category</label>
              <select value={editDraft.category} onChange={e => onUpdateDraft({ category: e.target.value as ProjectCategory })} className="edit-select">
                <option value="paid">Paid</option>
                <option value="growth">Growth</option>
              </select>
            </div>
          </div>
          <div className="edit-row">
            <label>Progress ({editDraft.progress}%)</label>
            <input type="range" min="0" max="100" value={editDraft.progress} onChange={e => onUpdateDraft({ progress: parseInt(e.target.value) })} className="edit-range" />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Rate</label>
              <input type="text" value={editDraft.rate || ''} onChange={e => onUpdateDraft({ rate: e.target.value })} className="edit-input" placeholder="e.g. $50/hr" />
            </div>
            <div className="edit-row">
              <label>Value</label>
              <input type="text" value={editDraft.value || ''} onChange={e => onUpdateDraft({ value: e.target.value })} className="edit-input" placeholder="e.g. $5,000" />
            </div>
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <textarea value={editDraft.notes} onChange={e => onUpdateDraft({ notes: e.target.value })} className="edit-textarea" rows={3} />
          </div>
          <div className="edit-actions">
            <button className="btn btn-small btn-primary" onClick={onSaveProject}>Save</button>
            <button className="btn btn-small" onClick={onCancelEditing}>Cancel</button>
            <button className="btn btn-small btn-danger" onClick={() => onRequestDelete(project.id)}>Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-card">
      <Link href={`/projects/${project.id}`} className="project-header" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
        <span className="project-name">{project.name}</span>
        <div className="project-meta">
          <CollaboratorBadges assignees={project.assignees || []} />
          <span className={`badge badge-${project.status}`}>{project.status}</span>
        </div>
      </Link>

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
        <div className="project-tasks-header" onClick={() => onToggleExpand(isExpanded ? null : project.id)} style={{ cursor: 'pointer' }}>
          <span className="project-tasks-label">
            Tasks {tasks.length > 0 && <span className="task-count">{doneTasks}/{tasks.length}</span>}
          </span>
          <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
        </div>

        {isExpanded && (
          <div className="task-list">
            {tasks.sort((a, b) => Number(a.done) - Number(b.done)).map(task => (
              <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
                <button className="task-check" onClick={() => onToggleTask(project.id, task.id)}>
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
                <button className="task-delete" onClick={() => onDeleteTask(project.id, task.id)}>×</button>
              </div>
            ))}

            {addingTaskFor === project.id ? (
              <div className="task-add-form">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => onSetNewTaskTitle(e.target.value)}
                  className="edit-input"
                  placeholder="Task title..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && onAddTask(project.id)}
                />
                <div className="task-add-options">
                  <select value={newTaskPriority} onChange={e => onSetNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')} className="edit-select">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <input type="date" value={newTaskDueDate} onChange={e => onSetNewTaskDueDate(e.target.value)} className="edit-input" />
                  <CollaboratorPicker selected={newTaskAssignees} onChange={onSetNewTaskAssignees} />
                </div>
                <div className="edit-actions">
                  <button className="btn btn-small btn-primary" onClick={() => onAddTask(project.id)} disabled={!newTaskTitle.trim()}>Add</button>
                  <button className="btn btn-small" onClick={() => onSetAddingTaskFor(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-small" onClick={() => onSetAddingTaskFor(project.id)} style={{ marginTop: 'var(--space-sm)' }}>
                + Add Task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ProjectCard;
