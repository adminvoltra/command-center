'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

type Priority = 'high' | 'medium' | 'low';

const emptyGoal: Omit<Goal, 'id'> = {
  text: '',
  priority: 'medium',
  done: false,
};

export default function GoalsPage() {
  const { ctx, save, saveWithActivity, isLoading } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
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

  // UPDATE - toggle done
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
      // Goal completed - log activity
      saveWithActivity(updatedCtx, {
        type: 'goal_completed',
        description: `Completed goal: "${goal.text}"`,
        metadata: { priority: goal.priority, goalId: id }
      });
    } else {
      // Goal uncompleted - just save without logging
      save(updatedCtx);
    }
  };

  // UPDATE - start editing
  const startEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditText(goal.text);
    setEditPriority(goal.priority);
  };

  // UPDATE - save edit
  const saveEdit = () => {
    if (!editText.trim() || !editingId) return;
    save({
      ...ctx,
      weeklyGoals: ctx.weeklyGoals.map((g: Goal) =>
        g.id === editingId ? { ...g, text: editText, priority: editPriority } : g
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

  const doneCount = ctx.weeklyGoals.filter(g => g.done).length;
  const totalCount = ctx.weeklyGoals.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Sort goals: incomplete first, then by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedGoals = [...ctx.weeklyGoals].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

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
                <div className="goal-edit-actions">
                  <button className="btn btn-small" onClick={saveEdit}>Save</button>
                  <button className="btn btn-small" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm(goal.id)}>Delete</button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="goal-check"
                  onClick={() => toggleGoal(goal.id)}
                  type="button"
                >
                  {goal.done ? '✓' : ''}
                </button>
                <div className="goal-content" onClick={() => startEdit(goal)} style={{ cursor: 'pointer', flex: 1 }}>
                  <span className="goal-text">{goal.text}</span>
                </div>
                <div className={`priority-pip priority-${goal.priority}`} title={goal.priority} />
              </>
            )}
          </div>
        ))}
        {sortedGoals.length === 0 && (
          <div className="empty-state">No goals yet. Add one to get started.</div>
        )}
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-lg)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Legend:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="priority-pip priority-high" />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="priority-pip priority-medium" />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="priority-pip priority-low" />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Low</span>
          </div>
        </div>
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
              onKeyDown={e => {
                if (e.key === 'Enter' && newGoal.text.trim()) addGoal();
              }}
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
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addGoal} disabled={!newGoal.text.trim()}>
              Add Goal
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Goal">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>
          Are you sure you want to delete this goal? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => deleteConfirm && deleteGoal(deleteConfirm)}>
            Delete
          </button>
        </div>
      </Modal>
    </main>
  );
}
