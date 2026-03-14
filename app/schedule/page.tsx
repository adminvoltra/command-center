'use client';

import { useState } from 'react';
import type { DailyBlock } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

const emptyBlock: Omit<DailyBlock, 'id'> = {
  time: '09:00',
  label: '',
  duration: '1 hour',
  notes: '',
};

export default function SchedulePage() {
  const { ctx, save, isLoading } = useAppContext();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<DailyBlock | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBlock, setNewBlock] = useState<Omit<DailyBlock, 'id'>>(emptyBlock);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // CREATE
  const addBlock = () => {
    if (!newBlock.label.trim()) return;
    const updatedPlan = [...ctx.dailyPlan, newBlock];
    // Sort by time
    updatedPlan.sort((a, b) => a.time.localeCompare(b.time));
    save({ ...ctx, dailyPlan: updatedPlan });
    setNewBlock(emptyBlock);
    setIsAddModalOpen(false);
  };

  // Start editing - copy block to draft
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditDraft({ ...ctx.dailyPlan[index] });
  };

  // Update draft (local only, no save)
  const updateDraft = (updates: Partial<DailyBlock>) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, ...updates });
  };

  // SAVE - commit draft to context
  const saveBlock = () => {
    if (editingIndex === null || !editDraft) return;
    const updatedPlan = ctx.dailyPlan.map((block, i) =>
      i === editingIndex ? editDraft : block
    );
    // Sort by time
    updatedPlan.sort((a, b) => a.time.localeCompare(b.time));
    save({ ...ctx, dailyPlan: updatedPlan });
    setEditingIndex(null);
    setEditDraft(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingIndex(null);
    setEditDraft(null);
  };

  // DELETE
  const deleteBlock = (index: number) => {
    save({ ...ctx, dailyPlan: ctx.dailyPlan.filter((_, i) => i !== index) });
    setDeleteConfirm(null);
    setEditingIndex(null);
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Schedule</h1>
          <p className="page-subtitle">
            Your baseline daily plan with {ctx.dailyPlan.length} time blocks
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Block
        </button>
      </div>

      <div className="card">
        <div className="timeline">
          {ctx.dailyPlan.map((block: DailyBlock, index: number) => {
            const isEditing = editingIndex === index;
            const draft = isEditing && editDraft ? editDraft : block;

            return (
            <div key={`${block.time}-${index}`} className={`timeline-item ${isEditing ? 'editing' : ''}`}>
              {isEditing && editDraft ? (
                <div className="timeline-edit-form">
                  <div className="edit-row-group">
                    <div className="edit-row">
                      <label>Time</label>
                      <input
                        type="time"
                        value={draft.time}
                        onChange={e => updateDraft({ time: e.target.value })}
                        className="edit-input"
                      />
                    </div>
                    <div className="edit-row">
                      <label>Duration</label>
                      <input
                        type="text"
                        value={draft.duration}
                        onChange={e => updateDraft({ duration: e.target.value })}
                        className="edit-input"
                        placeholder="e.g. 2 hours"
                      />
                    </div>
                  </div>
                  <div className="edit-row">
                    <label>Activity</label>
                    <input
                      type="text"
                      value={draft.label}
                      onChange={e => updateDraft({ label: e.target.value })}
                      className="edit-input"
                      autoFocus
                    />
                  </div>
                  <div className="edit-row">
                    <label>Notes</label>
                    <input
                      type="text"
                      value={draft.notes || ''}
                      onChange={e => updateDraft({ notes: e.target.value })}
                      className="edit-input"
                      placeholder="Optional details"
                    />
                  </div>
                  <div className="edit-actions">
                    <button className="btn btn-small btn-primary" onClick={saveBlock}>
                      Save
                    </button>
                    <button className="btn btn-small" onClick={cancelEditing}>
                      Cancel
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => setDeleteConfirm(index)}>
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="timeline-time">{block.time}</div>
                  <div className="timeline-marker" />
                  <div className="timeline-content" onClick={() => startEditing(index)} style={{ cursor: 'pointer' }}>
                    <div className="timeline-label">{block.label}</div>
                    <div className="timeline-duration">{block.duration}</div>
                    {block.notes && <div className="timeline-notes">{block.notes}</div>}
                    <div className="card-edit-hint">Click to edit</div>
                  </div>
                </>
              )}
            </div>
          );
          })}
          {ctx.dailyPlan.length === 0 && (
            <div className="empty-state">No schedule blocks yet. Add one to get started.</div>
          )}
        </div>
      </div>

      {/* Add Block Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Time Block">
        <div className="edit-form">
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Time *</label>
              <input
                type="time"
                value={newBlock.time}
                onChange={e => setNewBlock({ ...newBlock, time: e.target.value })}
                className="edit-input"
              />
            </div>
            <div className="edit-row">
              <label>Duration</label>
              <input
                type="text"
                value={newBlock.duration}
                onChange={e => setNewBlock({ ...newBlock, duration: e.target.value })}
                className="edit-input"
                placeholder="e.g. 2 hours"
              />
            </div>
          </div>
          <div className="edit-row">
            <label>Activity *</label>
            <input
              type="text"
              value={newBlock.label}
              onChange={e => setNewBlock({ ...newBlock, label: e.target.value })}
              className="edit-input"
              placeholder="What will you work on?"
              autoFocus
            />
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <input
              type="text"
              value={newBlock.notes || ''}
              onChange={e => setNewBlock({ ...newBlock, notes: e.target.value })}
              className="edit-input"
              placeholder="Optional details"
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addBlock} disabled={!newBlock.label.trim()}>
              Add Block
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Time Block">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>
          Are you sure you want to delete this time block? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => deleteConfirm !== null && deleteBlock(deleteConfirm)}>
            Delete
          </button>
        </div>
      </Modal>
    </main>
  );
}
