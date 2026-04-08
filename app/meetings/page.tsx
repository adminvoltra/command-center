'use client';

import { useState } from 'react';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import CollaboratorPicker from '@/components/CollaboratorPicker';
import type { MeetingNote, Collaborator } from '@/lib/context';

export default function MeetingsPage() {
  const { ctx, save, isLoading } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<MeetingNote>>({});
  const [newNote, setNewNote] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    content: '',
    assignees: [] as Collaborator[],
    projectId: '',
  });

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  const meetingNotes = ctx.meetingNotes || [];

  // Sort by date descending
  const sortedNotes = [...meetingNotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    const note: MeetingNote = {
      id: `meeting-${Date.now()}`,
      title: newNote.title.trim(),
      date: newNote.date,
      content: newNote.content.trim(),
      projectId: newNote.projectId || undefined,
      assignees: newNote.assignees,
      createdAt: new Date().toISOString(),
    };
    save({
      ...ctx,
      meetingNotes: [...meetingNotes, note],
    });
    setNewNote({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      content: '',
      assignees: [],
      projectId: '',
    });
    setIsAddModalOpen(false);
  };

  const deleteNote = (id: string) => {
    save({
      ...ctx,
      meetingNotes: meetingNotes.filter((n) => n.id !== id),
    });
    setViewingId(null);
  };

  const startEditing = (note: MeetingNote) => {
    setEditingId(note.id);
    setEditDraft({ ...note });
    setViewingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !editDraft.title?.trim() || !editDraft.content?.trim()) return;
    save({
      ...ctx,
      meetingNotes: meetingNotes.map((n) =>
        n.id === editingId ? { ...n, ...editDraft } : n
      ),
    });
    setEditingId(null);
    setEditDraft({});
  };

  const viewingNote = viewingId ? meetingNotes.find((n) => n.id === viewingId) : null;

  // Group by month
  const groupedNotes: Record<string, MeetingNote[]> = {};
  sortedNotes.forEach((note) => {
    const monthKey = new Date(note.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    if (!groupedNotes[monthKey]) groupedNotes[monthKey] = [];
    groupedNotes[monthKey].push(note);
  });

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meeting Log</h1>
          <p className="page-subtitle">Capture and review meeting notes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + New Meeting Note
        </button>
      </div>

      {/* Stats */}
      <div className="log-stats">
        <div className="log-stat">
          <span className="log-stat-value">{meetingNotes.length}</span>
          <span className="log-stat-label">Total Meetings</span>
        </div>
        <div className="log-stat">
          <span className="log-stat-value" style={{ color: 'var(--gold)' }}>
            {meetingNotes.filter((n) => {
              const d = new Date(n.date);
              const now = new Date();
              return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            }).length}
          </span>
          <span className="log-stat-label">This Week</span>
        </div>
        <div className="log-stat">
          <span className="log-stat-value" style={{ color: 'var(--info)' }}>
            {new Set(meetingNotes.flatMap((n) => n.assignees)).size}
          </span>
          <span className="log-stat-label">Participants</span>
        </div>
      </div>

      {/* Meeting Notes List */}
      {Object.keys(groupedNotes).length > 0 ? (
        <div className="meeting-list">
          {Object.entries(groupedNotes).map(([month, notes]) => (
            <div key={month} className="meeting-month">
              <div className="meeting-month-header">{month}</div>
              <div className="meeting-month-notes">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="meeting-card"
                    onClick={() => setViewingId(note.id)}
                  >
                    <div className="meeting-card-header">
                      <h3 className="meeting-card-title">{note.title}</h3>
                      <span className="meeting-card-date">
                        {new Date(note.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="meeting-card-preview">
                      {note.content.length > 160
                        ? note.content.slice(0, 160) + '...'
                        : note.content}
                    </p>
                    {note.assignees.length > 0 && (
                      <div className="meeting-card-footer">
                        {note.assignees.map((a) => (
                          <span key={a} className={`collab-badge collab-${a.toLowerCase()}`}>
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">No meeting notes yet.</p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            Add Your First Meeting Note
          </button>
        </div>
      )}

      {/* View Meeting Modal */}
      {viewingNote && (
        <Modal
          isOpen={true}
          onClose={() => setViewingId(null)}
          title={viewingNote.title}
        >
          <div className="meeting-view">
            <div className="meeting-view-meta">
              <span>
                {new Date(viewingNote.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {viewingNote.assignees.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {viewingNote.assignees.map((a) => (
                    <span key={a} className={`collab-badge collab-${a.toLowerCase()}`}>
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="meeting-view-content">{viewingNote.content}</div>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => deleteNote(viewingNote.id)}
              >
                Delete
              </button>
              <button className="btn" onClick={() => startEditing(viewingNote)}>
                Edit
              </button>
              <button className="btn btn-primary" onClick={() => setViewingId(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Meeting Modal */}
      <Modal
        isOpen={editingId !== null}
        onClose={() => { setEditingId(null); setEditDraft({}); }}
        title="Edit Meeting Note"
      >
        <div className="edit-form">
          <div className="edit-row">
            <label>Title *</label>
            <input
              type="text"
              value={editDraft.title || ''}
              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
              className="edit-input"
            />
          </div>
          <div className="edit-row">
            <label>Date</label>
            <input
              type="date"
              value={editDraft.date || ''}
              onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
              className="edit-input"
            />
          </div>
          <div className="edit-row">
            <label>Attendees</label>
            <CollaboratorPicker
              selected={(editDraft.assignees as Collaborator[]) || []}
              onChange={(assignees) => setEditDraft({ ...editDraft, assignees })}
            />
          </div>
          <div className="edit-row">
            <label>Meeting Notes *</label>
            <textarea
              value={editDraft.content || ''}
              onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })}
              className="edit-textarea meeting-textarea"
              rows={12}
              placeholder="Meeting notes..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => { setEditingId(null); setEditDraft({}); }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={saveEdit}
              disabled={!editDraft.title?.trim() || !editDraft.content?.trim()}
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Meeting Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Meeting Note"
      >
        <div className="edit-form">
          <div className="edit-row">
            <label>Title *</label>
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="edit-input"
              placeholder="e.g., Weekly Sync, Client Kickoff"
              autoFocus
            />
          </div>
          <div className="edit-row">
            <label>Date</label>
            <input
              type="date"
              value={newNote.date}
              onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
              className="edit-input"
            />
          </div>
          <div className="edit-row">
            <label>Attendees</label>
            <CollaboratorPicker
              selected={newNote.assignees}
              onChange={(assignees) => setNewNote({ ...newNote, assignees })}
            />
          </div>
          <div className="edit-row">
            <label>Project</label>
            <select
              value={newNote.projectId}
              onChange={(e) => setNewNote({ ...newNote, projectId: e.target.value })}
              className="edit-select"
            >
              <option value="">No project</option>
              {ctx.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="edit-row">
            <label>Meeting Notes *</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="edit-textarea meeting-textarea"
              rows={12}
              placeholder="Type your meeting notes here..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={addNote}
              disabled={!newNote.title.trim() || !newNote.content.trim()}
            >
              Save Meeting Note
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
