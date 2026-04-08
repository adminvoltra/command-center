'use client';

import { useState } from 'react';
import type { Client, ClientStatus } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

const STATUS_OPTIONS: ClientStatus[] = ['active', 'prospect', 'paused', 'churned'];

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  prospect: 'Prospect',
  paused: 'Paused',
  churned: 'Churned',
};

const emptyDraft = (): Omit<Client, 'id' | 'createdAt'> => ({
  name: '',
  contactName: '',
  email: '',
  phone: '',
  status: 'prospect',
  notes: '',
});

export default function ClientsPage() {
  const { ctx, save, isLoading } = useAppContext();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  const clients = ctx.clients || [];

  // Filter
  const filtered = clients.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // CRUD
  const addClient = () => {
    if (!draft.name.trim()) return;
    const newClient: Client = {
      ...draft,
      name: draft.name.trim(),
      contactName: draft.contactName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      notes: draft.notes.trim(),
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    save({ ...ctx, clients: [...clients, newClient] });
    setDraft(emptyDraft());
    setIsAddOpen(false);
  };

  const updateClient = () => {
    if (!editingId || !draft.name.trim()) return;
    const updated = clients.map(c =>
      c.id === editingId
        ? {
            ...c,
            name: draft.name.trim(),
            contactName: draft.contactName.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            status: draft.status,
            notes: draft.notes.trim(),
          }
        : c
    );
    save({ ...ctx, clients: updated });
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const deleteClient = (id: string) => {
    save({ ...ctx, clients: clients.filter(c => c.id !== id) });
  };

  const openEdit = (client: Client) => {
    setDraft({
      name: client.name,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      status: client.status,
      notes: client.notes,
    });
    setEditingId(client.id);
  };

  const openAdd = () => {
    setDraft(emptyDraft());
    setIsAddOpen(true);
  };

  const closeModal = () => {
    setIsAddOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const statusCounts = STATUS_OPTIONS.reduce(
    (acc, s) => {
      acc[s] = clients.filter(c => c.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            {clients.length} total
            {statusCounts.active > 0 && <span style={{ marginLeft: 'var(--space-sm)' }}>&middot; {statusCounts.active} active</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Client</button>
      </div>

      {/* Filters */}
      <div className="client-filters">
        <input
          type="text"
          className="edit-input"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="edit-select"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]} ({statusCounts[s] || 0})</option>
          ))}
        </select>
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          {clients.length === 0
            ? 'No clients yet. Add your first client to get started.'
            : 'No clients match your filters.'}
        </div>
      ) : (
        <div className="client-list">
          {filtered.map(client => (
            <div key={client.id} className="client-row">
              <div className="client-row-main">
                <div className="client-name-group">
                  <span className="client-name">{client.name}</span>
                  <span className={`badge badge-sm badge-${client.status}`}>
                    {STATUS_LABELS[client.status]}
                  </span>
                </div>
                <div className="client-details">
                  {client.contactName && (
                    <span className="client-detail">
                      <span className="client-detail-label">Contact</span>
                      {client.contactName}
                    </span>
                  )}
                  {client.email && (
                    <span className="client-detail">
                      <span className="client-detail-label">Email</span>
                      {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="client-detail">
                      <span className="client-detail-label">Phone</span>
                      {client.phone}
                    </span>
                  )}
                </div>
                {client.notes && (
                  <div className="client-notes">{client.notes}</div>
                )}
              </div>
              <div className="client-row-actions">
                <button className="btn btn-small" onClick={() => openEdit(client)}>Edit</button>
                <button className="btn btn-small btn-danger" onClick={() => deleteClient(client.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen || editingId !== null}
        onClose={closeModal}
        title={editingId ? 'Edit Client' : 'Add Client'}
      >
        <div className="edit-form">
          <div className="edit-row">
            <label>Company / Client Name *</label>
            <input
              type="text"
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              className="edit-input"
              placeholder="e.g. Acme Corp"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && (editingId ? updateClient() : addClient())}
            />
          </div>
          <div className="edit-row">
            <label>Contact Name</label>
            <input
              type="text"
              value={draft.contactName}
              onChange={e => setDraft({ ...draft, contactName: e.target.value })}
              className="edit-input"
              placeholder="e.g. John Smith"
            />
          </div>
          <div className="edit-row">
            <label>Email</label>
            <input
              type="email"
              value={draft.email}
              onChange={e => setDraft({ ...draft, email: e.target.value })}
              className="edit-input"
              placeholder="e.g. john@acme.com"
            />
          </div>
          <div className="edit-row">
            <label>Phone</label>
            <input
              type="tel"
              value={draft.phone}
              onChange={e => setDraft({ ...draft, phone: e.target.value })}
              className="edit-input"
              placeholder="e.g. (555) 123-4567"
            />
          </div>
          <div className="edit-row">
            <label>Status</label>
            <select
              value={draft.status}
              onChange={e => setDraft({ ...draft, status: e.target.value as ClientStatus })}
              className="edit-select"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <textarea
              value={draft.notes}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              className="edit-input"
              placeholder="Any additional notes..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={editingId ? updateClient : addClient}
              disabled={!draft.name.trim()}
            >
              {editingId ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
