'use client';

import { useState } from 'react';
import type { Reminder } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

const emptyReminder: Omit<Reminder, 'id' | 'syncedAt'> = {
  title: '',
  notes: '',
  dueDate: '',
  isCompleted: false,
  list: '',
  priority: 0,
};

export default function RemindersPage() {
  const { ctx, save, saveWithActivity, isLoading } = useAppContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState<Omit<Reminder, 'id' | 'syncedAt'>>(emptyReminder);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // CREATE
  const addReminder = () => {
    if (!newReminder.title.trim()) return;
    const reminder: Reminder = {
      ...newReminder,
      id: Date.now().toString(),
      syncedAt: new Date().toISOString(),
    };
    saveWithActivity(
      { ...ctx, reminders: [...ctx.reminders, reminder] },
      { type: 'reminder_created', description: `Created reminder: "${newReminder.title}"` }
    );
    setNewReminder(emptyReminder);
    setIsAddModalOpen(false);
  };

  // UPDATE
  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    save({
      ...ctx,
      reminders: ctx.reminders.map((r: Reminder) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const toggleReminder = (id: string) => {
    const reminder = ctx.reminders.find(r => r.id === id);
    if (!reminder) return;

    const newCompletedState = !reminder.isCompleted;
    const updatedCtx = {
      ...ctx,
      reminders: ctx.reminders.map((r: Reminder) =>
        r.id === id ? { ...r, isCompleted: newCompletedState } : r
      ),
    };

    if (newCompletedState) {
      saveWithActivity(updatedCtx, {
        type: 'reminder_completed',
        description: `Completed reminder: "${reminder.title}"`,
        metadata: { reminderId: id }
      });
    } else {
      save(updatedCtx);
    }
  };

  // DELETE
  const deleteReminder = (id: string) => {
    save({ ...ctx, reminders: ctx.reminders.filter(r => r.id !== id) });
    setDeleteConfirm(null);
    setEditingId(null);
  };

  const fetchReminders = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      if (data.success && data.reminders) {
        save({ ...ctx, reminders: data.reminders });
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearReminders = async () => {
    try {
      await fetch('/api/reminders', { method: 'DELETE' });
    } catch (err) {
      console.error('Clear failed:', err);
    }
    save({ ...ctx, reminders: [] });
  };

  const activeReminders = ctx.reminders?.filter(r => !r.isCompleted) || [];
  const completedReminders = ctx.reminders?.filter(r => r.isCompleted) || [];

  const ReminderItem = ({ reminder, isCompleted }: { reminder: Reminder; isCompleted?: boolean }) => {
    const isEditing = editingId === reminder.id;

    if (isEditing) {
      return (
        <div className="reminder-item editing">
          <div className="edit-form" style={{ width: '100%' }}>
            <div className="edit-row">
              <label>Title</label>
              <input
                type="text"
                value={reminder.title}
                onChange={e => updateReminder(reminder.id, { title: e.target.value })}
                className="edit-input"
                autoFocus
              />
            </div>
            <div className="edit-row">
              <label>Notes</label>
              <textarea
                value={reminder.notes || ''}
                onChange={e => updateReminder(reminder.id, { notes: e.target.value })}
                className="edit-textarea"
                rows={2}
              />
            </div>
            <div className="edit-row-group">
              <div className="edit-row">
                <label>Due Date</label>
                <input
                  type="date"
                  value={reminder.dueDate ? reminder.dueDate.split('T')[0] : ''}
                  onChange={e => updateReminder(reminder.id, { dueDate: e.target.value || undefined })}
                  className="edit-input"
                />
              </div>
              <div className="edit-row">
                <label>List</label>
                <input
                  type="text"
                  value={reminder.list || ''}
                  onChange={e => updateReminder(reminder.id, { list: e.target.value })}
                  className="edit-input"
                  placeholder="e.g. Work, Personal"
                />
              </div>
            </div>
            <div className="edit-row">
              <label>Priority</label>
              <select
                value={reminder.priority || 0}
                onChange={e => updateReminder(reminder.id, { priority: parseInt(e.target.value) })}
                className="edit-select"
              >
                <option value={0}>None</option>
                <option value={1}>Low</option>
                <option value={5}>Medium</option>
                <option value={9}>High</option>
              </select>
            </div>
            <div className="edit-actions">
              <button className="btn btn-small" onClick={() => setEditingId(null)}>
                Done
              </button>
              <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm(reminder.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`reminder-item ${isCompleted ? 'completed' : ''}`}
        style={{ cursor: 'pointer' }}
      >
        <button
          className="reminder-check"
          onClick={() => toggleReminder(reminder.id)}
          type="button"
        >
          {isCompleted ? '✓' : ''}
        </button>
        <div className="reminder-content" onClick={() => setEditingId(reminder.id)}>
          <div className="reminder-title">{reminder.title}</div>
          {reminder.notes && !isCompleted && (
            <div className="reminder-notes">{reminder.notes}</div>
          )}
          <div className="reminder-meta">
            {reminder.list && (
              <span className="reminder-list-tag">{reminder.list}</span>
            )}
            {reminder.dueDate && (
              <span className="reminder-due">
                Due: {new Date(reminder.dueDate).toLocaleDateString()}
              </span>
            )}
            {reminder.priority && reminder.priority > 0 && (
              <span className={`priority-tag priority-${reminder.priority === 9 ? 'high' : reminder.priority === 5 ? 'medium' : 'low'}`}>
                {reminder.priority === 9 ? 'High' : reminder.priority === 5 ? 'Medium' : 'Low'}
              </span>
            )}
          </div>
          <div className="card-edit-hint">Click to edit</div>
        </div>
      </div>
    );
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">
            {activeReminders.length} active, {completedReminders.length} completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Reminder
        </button>
      </div>

      {/* Actions */}
      <div className="reminder-actions">
        <button
          className="btn"
          onClick={fetchReminders}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Fetch from iOS'}
        </button>
        {ctx.reminders?.length > 0 && (
          <button className="btn" onClick={clearReminders}>
            Clear All
          </button>
        )}
      </div>

      {/* Active Reminders */}
      {activeReminders.length > 0 && (
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="section-header">
            <h2 className="section-title">Active</h2>
            <span className="section-badge">{activeReminders.length}</span>
          </div>
          <div className="reminder-list">
            {activeReminders.map((reminder: Reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Completed</h2>
            <span className="section-badge">{completedReminders.length}</span>
          </div>
          <div className="reminder-list">
            {completedReminders.map((reminder: Reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} isCompleted />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!ctx.reminders || ctx.reminders.length === 0) && (
        <div className="empty-state">
          <p className="empty-state-text">
            No reminders yet. Add one manually or sync from iOS.
          </p>
        </div>
      )}

      {/* Setup Info */}
      <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-xl)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--space-md)' }}>
          iOS Shortcuts Setup
        </h3>
        <ol style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8, paddingLeft: 'var(--space-lg)' }}>
          <li>Open iOS Shortcuts app</li>
          <li>Create a new shortcut with &quot;Find All Reminders&quot;</li>
          <li>Add &quot;Get Contents of URL&quot; action</li>
          <li>Set URL to your /api/reminders endpoint</li>
          <li>Set method to POST with JSON body</li>
          <li>Run the shortcut to sync reminders</li>
        </ol>
      </div>

      {/* Add Reminder Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Reminder">
        <div className="edit-form">
          <div className="edit-row">
            <label>Title *</label>
            <input
              type="text"
              value={newReminder.title}
              onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
              className="edit-input"
              placeholder="What do you need to remember?"
              autoFocus
            />
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <textarea
              value={newReminder.notes || ''}
              onChange={e => setNewReminder({ ...newReminder, notes: e.target.value })}
              className="edit-textarea"
              rows={2}
              placeholder="Additional details..."
            />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Due Date</label>
              <input
                type="date"
                value={newReminder.dueDate || ''}
                onChange={e => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                className="edit-input"
              />
            </div>
            <div className="edit-row">
              <label>List</label>
              <input
                type="text"
                value={newReminder.list || ''}
                onChange={e => setNewReminder({ ...newReminder, list: e.target.value })}
                className="edit-input"
                placeholder="e.g. Work"
              />
            </div>
          </div>
          <div className="edit-row">
            <label>Priority</label>
            <select
              value={newReminder.priority || 0}
              onChange={e => setNewReminder({ ...newReminder, priority: parseInt(e.target.value) })}
              className="edit-select"
            >
              <option value={0}>None</option>
              <option value={1}>Low</option>
              <option value={5}>Medium</option>
              <option value={9}>High</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addReminder} disabled={!newReminder.title.trim()}>
              Add Reminder
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Reminder">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>
          Are you sure you want to delete this reminder? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => deleteConfirm && deleteReminder(deleteConfirm)}>
            Delete
          </button>
        </div>
      </Modal>
    </main>
  );
}
