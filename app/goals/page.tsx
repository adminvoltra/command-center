'use client';

import { useState, useMemo } from 'react';
import type { Goal, Collaborator } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';

type Priority = 'high' | 'medium' | 'low';
type GoalTab = 'overview' | 'Luke' | 'Aidan';

const emptyGoal: Omit<Goal, 'id'> = {
  text: '',
  priority: 'medium',
  done: false,
  assignees: [],
};

export default function GoalsPage() {
  const { ctx, save, saveWithActivity, isLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState<GoalTab>('overview');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editAssignees, setEditAssignees] = useState<Collaborator[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>(emptyGoal);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // Filter goals by tab
  const filteredGoals = useMemo(() => {
    if (activeTab === 'overview') return ctx.weeklyGoals;
    return ctx.weeklyGoals.filter(g => (g.assignees || []).includes(activeTab as Collaborator));
  }, [ctx.weeklyGoals, activeTab]);

  // CREATE
  const addGoal = () => {
    if (!newGoal.text.trim()) return;
    const goal: Goal = {
      ...newGoal,
      id: Date.now().toString(),
    };
    saveWithActivity(
      { ...ctx, weeklyGoals: [...ctx.weeklyGoals, goal] },
      { type: 'goal_created', description: `Created goal: "${newGoal.text}"`, metadata: { priority: newGoal.priority } }
    );
    setNewGoal(emptyGoal);
    setIsAddModalOpen(false);
  };

  // Toggle done
  const toggleGoal = (id: string) => {
    const goal = ctx.weeklyGoals.find(g => g.id === id);
    if (!goal) return;
    const newDoneState = !goal.done;
    const updatedCtx = {
      ...ctx,
      weeklyGoals: ctx.weeklyGoals.map((g: Goal) =>
        g.id === id ? { ...g, done: newDoneState } : g
      ),
    };
    if (newDoneState) {
      saveWithActivity(updatedCtx, {
        type: 'goal_completed',
        description: `Completed goal: "${goal.text}"`,
        metadata: { priority: goal.priority, goalId: id }
      });
    } else {
      save(updatedCtx);
    }
  };

  // Start editing
  const startEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditText(goal.text);
    setEditPriority(goal.priority);
    setEditAssignees(goal.assignees || []);
  };

  // Save edit
  const saveEdit = () => {
    if (!editText.trim() || !editingId) return;
    save({
      ...ctx,
      weeklyGoals: ctx.weeklyGoals.map((g: Goal) =>
        g.id === editingId ? { ...g, text: editText, priority: editPriority, assignees: editAssignees } : g
      ),
    });
    setEditingId(null);
  };

  // DELETE
  const deleteGoal = (id: string) => {
    save({ ...ctx, weeklyGoals: ctx.weeklyGoals.filter(g => g.id !== id) });
    setDeleteConfirm(null);
    setEditingId(null);
  };

  const doneCount = filteredGoals.filter(g => g.done).length;
  const totalCount = filteredGoals.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Sort goals
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Tab counts
  const lukeCount = ctx.weeklyGoals.filter(g => (g.assignees || []).includes('Luke')).length;
  const aidanCount = ctx.weeklyGoals.filter(g => (g.assignees || []).includes('Aidan')).length;

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Goals</h1>
          <p className="page-subtitle">
            {doneCount} of {totalCount} completed ({progress}%)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Goal
        </button>
      </div>

      {/* Tabs */}
      <div className="schedule-tabs" style={{ marginBottom: 'var(--space-lg)' }}>
        <button className={`schedule-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview ({ctx.weeklyGoals.length})
        </button>
        <button
          className={`schedule-tab ${activeTab === 'Luke' ? 'active' : ''}`}
          onClick={() => setActiveTab('Luke')}
          style={activeTab === 'Luke' ? { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', borderColor: '#fbbf24' } : {}}
        >
          Luke ({lukeCount})
        </button>
        <button
          className={`schedule-tab ${activeTab === 'Aidan' ? 'active' : ''}`}
          onClick={() => setActiveTab('Aidan')}
          style={activeTab === 'Aidan' ? { background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', borderColor: '#60a5fa' } : {}}
        >
          Aidan ({aidanCount})
        </button>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
          <span>{doneCount} completed</span>
          <span>{totalCount - doneCount} remaining</span>
        </div>
      </div>

      {/* Goal list */}
      <div className="goal-list">
        {sortedGoals.map((goal: Goal) => (
          <div key={goal.id} className={`goal-item ${goal.done ? 'done' : ''}`}>
            {editingId === goal.id ? (
              <div className="goal-edit-form">
                <input
                  type="text"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="edit-input"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <select
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value as Priority)}
                  className="edit-select"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Assignees</label>
                  <CollaboratorPicker selected={editAssignees} onChange={setEditAssignees} />
                </div>
                <div className="goal-edit-actions">
                  <button className="btn btn-small" onClick={saveEdit}>Save</button>
                  <button className="btn btn-small" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm(goal.id)}>Delete</button>
                </div>
              </div>
            ) : (
              <>
                <button className="goal-check" onClick={() => toggleGoal(goal.id)} type="button">
                  {goal.done ? '✓' : ''}
                </button>
                <div className="goal-content" onClick={() => startEdit(goal)} style={{ cursor: 'pointer', flex: 1 }}>
                  <span className="goal-text">{goal.text}</span>
                  {(goal.assignees || []).length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <CollaboratorBadges assignees={goal.assignees || []} />
                    </div>
                  )}
                </div>
                <div className={`priority-pip priority-${goal.priority}`} title={goal.priority} />
              </>
            )}
          </div>
        ))}
        {sortedGoals.length === 0 && (
          <div className="empty-state">
            {activeTab === 'overview' ? 'No goals yet. Add one to get started.' : `No goals assigned to ${activeTab} yet.`}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Goal">
        <div className="edit-form">
          <div className="edit-row">
            <label>Goal *</label>
            <input
              type="text"
              value={newGoal.text}
              onChange={e => setNewGoal({ ...newGoal, text: e.target.value })}
              className="edit-input"
              placeholder="What do you want to accomplish?"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && newGoal.text.trim()) addGoal(); }}
            />
          </div>
          <div className="edit-row">
            <label>Priority</label>
            <select
              value={newGoal.priority}
              onChange={e => setNewGoal({ ...newGoal, priority: e.target.value as Priority })}
              className="edit-select"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="edit-row">
            <label>Assignees</label>
            <CollaboratorPicker selected={newGoal.assignees || []} onChange={assignees => setNewGoal({ ...newGoal, assignees })} />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addGoal} disabled={!newGoal.text.trim()}>Add Goal</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Goal">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>
          Are you sure you want to delete this goal? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => deleteConfirm && deleteGoal(deleteConfirm)}>Delete</button>
        </div>
      </Modal>
    </main>
  );
}
