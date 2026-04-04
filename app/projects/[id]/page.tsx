'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Phase, PhaseStep, PhaseStatus, StepStatus, Collaborator, Task } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';

const stepStatusOptions: { value: StepStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
  { value: 'skipped', label: 'Skipped' },
];

function ProjectInstructions({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="project-instructions-section" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="phase-field-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="phase-field-label">Project Instructions</span>
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="edit-textarea phase-textarea"
          rows={12}
          placeholder="Paste your full project prompt or instructions here..."
          autoFocus
          style={{ width: '100%', minHeight: 200 }}
        />
        <div className="edit-actions" style={{ marginTop: 'var(--space-sm)' }}>
          <button className="btn btn-small btn-primary" onClick={() => { onSave(draft); setEditing(false); }}>Save</button>
          <button className="btn btn-small" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-instructions-section" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="phase-field-header" style={{ marginBottom: 'var(--space-sm)' }}>
        <span className="phase-field-label">Project Instructions</span>
        <button className="btn btn-small" onClick={() => { setDraft(value); setEditing(true); }}>Edit</button>
      </div>
      <div className="phase-field-content" onClick={() => { setDraft(value); setEditing(true); }} style={{ minHeight: 80 }}>
        {value || <span className="phase-field-empty">Click to add project instructions or paste a prompt...</span>}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { ctx, save, isLoading } = useAppContext();

  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [addingStepFor, setAddingStepFor] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepAssignees, setNewStepAssignees] = useState<Collaborator[]>([]);
  const [confirmCompletePhase, setConfirmCompletePhase] = useState<string | null>(null);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [draftInstructions, setDraftInstructions] = useState('');
  const [draftChecklist, setDraftChecklist] = useState('');
  // Task add
  const [addingTask, setAddingTask] = useState(false);
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

  const project = ctx.projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <main className="page-container">
        <div className="page-header">
          <h1 className="page-title">Project Not Found</h1>
        </div>
        <Link href="/projects" className="btn">← Back to Projects</Link>
      </main>
    );
  }

  const phases = project.phases || [];
  const tasks = project.tasks || [];
  const completedPhases = phases.filter(p => p.status === 'complete').length;
  const currentPhase = phases.find(p => p.status === 'in-progress') || phases.find(p => p.status !== 'complete');
  const doneTasks = tasks.filter(t => t.done).length;

  // Helper to update this project
  const updateProject = (updates: Partial<typeof project>) => {
    save({
      ...ctx,
      projects: ctx.projects.map(p => p.id === projectId ? { ...p, ...updates, lastTouched: new Date().toISOString() } : p),
    });
  };

  // Phase operations
  const setPhaseStatus = (phaseId: string, status: PhaseStatus) => {
    const now = new Date().toISOString();
    const updatedPhases = phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p, status,
        startedAt: status === 'in-progress' && !p.startedAt ? now : p.startedAt,
        completedAt: status === 'complete' ? now : undefined,
      };
    });
    // Calculate progress based on phase completion
    const progress = Math.round((updatedPhases.filter(p => p.status === 'complete').length / updatedPhases.length) * 100);
    updateProject({ phases: updatedPhases, progress });
    setConfirmCompletePhase(null);
  };

  const addStep = (phaseId: string) => {
    if (!newStepTitle.trim()) return;
    const step: PhaseStep = {
      id: Date.now().toString(),
      title: newStepTitle.trim(),
      status: 'not-started',
      assignees: newStepAssignees,
    };
    const updatedPhases = phases.map(p =>
      p.id === phaseId ? { ...p, steps: [...p.steps, step] } : p
    );
    updateProject({ phases: updatedPhases });
    setNewStepTitle('');
    setNewStepAssignees([]);
    setAddingStepFor(null);
  };

  const updateStepStatus = (phaseId: string, stepId: string, status: StepStatus) => {
    const now = new Date().toISOString();
    const updatedPhases = phases.map(p => {
      if (p.id !== phaseId) return p;
      const newSteps = p.steps.map(s =>
        s.id === stepId ? { ...s, status, completedAt: status === 'complete' ? now : undefined } : s
      );
      const hasActive = newSteps.some(s => s.status === 'in-progress' || s.status === 'complete');
      const allDone = newSteps.length > 0 && newSteps.every(s => s.status === 'complete' || s.status === 'skipped');
      let phaseStatus = p.status;
      if (allDone) phaseStatus = 'complete';
      else if (hasActive && phaseStatus === 'not-started') phaseStatus = 'in-progress';
      return { ...p, steps: newSteps, status: phaseStatus, startedAt: phaseStatus === 'in-progress' && !p.startedAt ? now : p.startedAt, completedAt: allDone ? now : undefined };
    });
    const progress = Math.round((updatedPhases.filter(p => p.status === 'complete').length / updatedPhases.length) * 100);
    updateProject({ phases: updatedPhases, progress });
  };

  const deleteStep = (phaseId: string, stepId: string) => {
    const updatedPhases = phases.map(p =>
      p.id === phaseId ? { ...p, steps: p.steps.filter(s => s.id !== stepId) } : p
    );
    updateProject({ phases: updatedPhases });
  };

  const prereqsMet = (phase: Phase) => {
    return phase.prerequisites.every(preId => {
      const pre = phases.find(p => p.id === preId);
      return pre?.status === 'complete';
    });
  };

  // Task operations
  const addTask = () => {
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
    updateProject({ tasks: [...tasks, task] });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskAssignees([]);
    setNewTaskDueDate('');
    setAddingTask(false);
  };

  const toggleTask = (taskId: string) => {
    updateProject({ tasks: tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) });
  };

  const deleteTask = (taskId: string) => {
    updateProject({ tasks: tasks.filter(t => t.id !== taskId) });
  };

  return (
    <main className="page-container">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Link href="/projects" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>← Projects</Link>
      </div>

      {/* Project Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">
            <CollaboratorBadges assignees={project.assignees || []} />
            <span style={{ marginLeft: 'var(--space-sm)' }} className={`badge badge-${project.status}`}>{project.status}</span>
          </p>
        </div>
      </div>

      {project.notes && (
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>{project.notes}</p>
      )}

      {/* Phase Stepper */}
      {phases.length > 0 && (
        <>
          <div className="phase-stepper">
            {phases.map((phase: Phase) => (
              <div
                key={phase.id}
                className={`phase-step-indicator ${phase.status} ${phase.id === currentPhase?.id ? 'current' : ''}`}
                onClick={() => { setExpandedPhase(expandedPhase === phase.id ? null : phase.id); setEditingInstructions(false); setEditingChecklist(false); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="phase-step-number">
                  {phase.status === 'complete' ? '✓' : phase.number}
                </div>
                <span className="phase-step-name">{phase.name}</span>
              </div>
            ))}
          </div>

          {/* Project Instructions */}
          <ProjectInstructions value={project.instructions || ''} onSave={(val: string) => updateProject({ instructions: val })} />

          {/* Expanded Phase Detail (only the clicked phase) */}
          {expandedPhase && (() => {
            const phase = phases.find(p => p.id === expandedPhase);
            if (!phase) return null;
            const stepsComplete = phase.steps.filter(s => s.status === 'complete').length;
            const isCurrent = phase.id === currentPhase?.id;
            const prereqsOk = prereqsMet(phase);

            return (
              <div className={`phase-card ${phase.status} ${isCurrent ? 'current' : ''}`} style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="phase-card-header">
                  <div className="phase-card-left">
                    <span className="phase-card-number" style={{ color: phase.status === 'complete' ? 'var(--success)' : isCurrent ? 'var(--gold)' : 'var(--text-3)' }}>
                      {phase.status === 'complete' ? '✓' : phase.number}
                    </span>
                    <div>
                      <h3 className="phase-card-name">{phase.name}</h3>
                      <p className="phase-card-desc">{phase.description}</p>
                    </div>
                  </div>
                  <div className="phase-card-right">
                    {phase.steps.length > 0 && <span className="task-count">{stepsComplete}/{phase.steps.length}</span>}
                    <span className={`badge badge-${phase.status === 'not-started' ? 'waiting' : phase.status === 'in-progress' ? 'active' : phase.status}`}>
                      {phase.status.replace('-', ' ')}
                    </span>
                    <button className="btn btn-small" onClick={() => setExpandedPhase(null)} style={{ marginLeft: 'var(--space-sm)' }}>×</button>
                  </div>
                </div>

                <div className="phase-card-body">
                  {phase.prerequisites.length > 0 && (
                    <div className="phase-prereqs">
                      <span className="phase-prereq-label">Prerequisites:</span>
                      {phase.prerequisites.map(preId => {
                        const pre = phases.find(p => p.id === preId);
                        return (
                          <span key={preId} className={`phase-prereq-badge ${pre?.status === 'complete' ? 'met' : 'unmet'}`}>
                            {pre?.status === 'complete' ? '✓' : '○'} {pre?.name}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {phase.validationGate && (
                    <div className="mc-validation-gate">
                      <span className="mc-gate-label">Exit Gate:</span> {phase.validationGate}
                    </div>
                  )}

                  <div className="phase-controls">
                    {phase.status === 'not-started' && prereqsOk && (
                      <button className="btn btn-small btn-primary" onClick={() => setPhaseStatus(phase.id, 'in-progress')}>Start Phase</button>
                    )}
                    {phase.status === 'not-started' && !prereqsOk && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Waiting on prerequisites</span>
                    )}
                    {phase.status === 'in-progress' && (
                      <button className="btn btn-small" onClick={() => setConfirmCompletePhase(phase.id)}>Mark Complete</button>
                    )}
                    {phase.status === 'blocked' && (
                      <button className="btn btn-small" onClick={() => setPhaseStatus(phase.id, 'in-progress')}>Unblock</button>
                    )}
                  </div>

                  {/* Steps */}
                  <div className="task-list" style={{ marginTop: 'var(--space-md)' }}>
                    {phase.steps.map((step: PhaseStep) => (
                      <div key={step.id} className={`task-item ${step.status === 'complete' ? 'done' : ''}`}>
                        <select
                          value={step.status}
                          onChange={e => updateStepStatus(phase.id, step.id, e.target.value as StepStatus)}
                          className="step-status-select"
                          style={{ color: step.status === 'complete' ? 'var(--success)' : step.status === 'in-progress' ? 'var(--gold)' : step.status === 'blocked' ? 'var(--error)' : 'var(--text-3)' }}
                        >
                          {stepStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <div className="task-body">
                          <span className="task-title">{step.title}</span>
                          <div className="task-meta">
                            <CollaboratorBadges assignees={step.assignees} />
                          </div>
                        </div>
                        <button className="task-delete" onClick={() => deleteStep(phase.id, step.id)}>×</button>
                      </div>
                    ))}

                    {addingStepFor === phase.id ? (
                      <div className="task-add-form">
                        <input type="text" value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} className="edit-input" placeholder="Step description..." autoFocus onKeyDown={e => e.key === 'Enter' && addStep(phase.id)} />
                        <div className="task-add-options">
                          <CollaboratorPicker selected={newStepAssignees} onChange={setNewStepAssignees} />
                        </div>
                        <div className="edit-actions">
                          <button className="btn btn-small btn-primary" onClick={() => addStep(phase.id)} disabled={!newStepTitle.trim()}>Add</button>
                          <button className="btn btn-small" onClick={() => setAddingStepFor(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-small" onClick={() => setAddingStepFor(phase.id)} style={{ marginTop: 'var(--space-sm)' }}>+ Add Step</button>
                    )}
                  </div>

                  {/* Prompt & Checklist Instructions */}
                  <div className="phase-fields">
                    <div className="phase-field">
                      <div className="phase-field-header">
                        <span className="phase-field-label">Prompt</span>
                        {!editingInstructions && (
                          <button className="btn btn-small" onClick={() => { setDraftInstructions(phase.instructions || ''); setEditingInstructions(true); }}>Edit</button>
                        )}
                      </div>
                      {editingInstructions ? (
                        <div>
                          <textarea
                            value={draftInstructions}
                            onChange={e => setDraftInstructions(e.target.value)}
                            className="edit-textarea phase-textarea"
                            rows={6}
                            placeholder="Enter prompt or implementation guidance for this phase..."
                            autoFocus
                          />
                          <div className="edit-actions" style={{ marginTop: 'var(--space-sm)' }}>
                            <button className="btn btn-small btn-primary" onClick={() => {
                              const updatedPhases = phases.map(p => p.id === phase.id ? { ...p, instructions: draftInstructions } : p);
                              updateProject({ phases: updatedPhases });
                              setEditingInstructions(false);
                            }}>Save</button>
                            <button className="btn btn-small" onClick={() => setEditingInstructions(false)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="phase-field-content" onClick={() => { setDraftInstructions(phase.instructions || ''); setEditingInstructions(true); }}>
                          {phase.instructions || <span className="phase-field-empty">Click to add prompt...</span>}
                        </div>
                      )}
                    </div>

                    <div className="phase-field">
                      <div className="phase-field-header">
                        <span className="phase-field-label">Checklist Instructions</span>
                        {!editingChecklist && (
                          <button className="btn btn-small" onClick={() => { setDraftChecklist(phase.checklistInstructions || ''); setEditingChecklist(true); }}>Edit</button>
                        )}
                      </div>
                      {editingChecklist ? (
                        <div>
                          <textarea
                            value={draftChecklist}
                            onChange={e => setDraftChecklist(e.target.value)}
                            className="edit-textarea phase-textarea"
                            rows={6}
                            placeholder="Enter checklist items, verification steps, or completion criteria..."
                          />
                          <div className="edit-actions" style={{ marginTop: 'var(--space-sm)' }}>
                            <button className="btn btn-small btn-primary" onClick={() => {
                              const updatedPhases = phases.map(p => p.id === phase.id ? { ...p, checklistInstructions: draftChecklist } : p);
                              updateProject({ phases: updatedPhases });
                              setEditingChecklist(false);
                            }}>Save</button>
                            <button className="btn btn-small" onClick={() => setEditingChecklist(false)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="phase-field-content" onClick={() => { setDraftChecklist(phase.checklistInstructions || ''); setEditingChecklist(true); }}>
                          {phase.checklistInstructions || <span className="phase-field-empty">Click to add checklist instructions...</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Tasks Section */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tasks {tasks.length > 0 && <span className="task-count" style={{ marginLeft: 'var(--space-sm)' }}>{doneTasks}/{tasks.length}</span>}
          </h2>
          <button className="btn btn-small btn-primary" onClick={() => setAddingTask(true)}>+ Add Task</button>
        </div>

        <div className="task-list">
          {tasks.sort((a, b) => Number(a.done) - Number(b.done)).map(task => (
            <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
              <button className="task-check" onClick={() => toggleTask(task.id)}>
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
              <button className="task-delete" onClick={() => deleteTask(task.id)}>×</button>
            </div>
          ))}
          {tasks.length === 0 && !addingTask && (
            <div className="empty-state">No tasks yet.</div>
          )}
        </div>

        {addingTask && (
          <div className="task-add-form" style={{ marginTop: 'var(--space-sm)' }}>
            <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="edit-input" placeholder="Task title..." autoFocus onKeyDown={e => e.key === 'Enter' && addTask()} />
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
              <button className="btn btn-small btn-primary" onClick={addTask} disabled={!newTaskTitle.trim()}>Add</button>
              <button className="btn btn-small" onClick={() => setAddingTask(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Complete Phase Confirmation */}
      <Modal isOpen={confirmCompletePhase !== null} onClose={() => setConfirmCompletePhase(null)} title="Complete Phase">
        <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-2)' }}>
          Mark this phase as complete? Make sure the validation gate has been satisfied.
        </p>
        {confirmCompletePhase && (
          <div className="mc-validation-gate" style={{ marginBottom: 'var(--space-xl)' }}>
            <span className="mc-gate-label">Exit Gate:</span> {phases.find(p => p.id === confirmCompletePhase)?.validationGate || 'None specified'}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setConfirmCompletePhase(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => confirmCompletePhase && setPhaseStatus(confirmCompletePhase, 'complete')}>Confirm Complete</button>
        </div>
      </Modal>
    </main>
  );
}
