'use client';

import { useState } from 'react';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

export default function JobsPage() {
  const { ctx, save, isLoading } = useAppContext();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [draftSalary, setDraftSalary] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newConversation, setNewConversation] = useState('');
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddConversationOpen, setIsAddConversationOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  const { jobSearch } = ctx;

  // UPDATE helpers
  const updateJobSearch = (updates: Partial<typeof jobSearch>) => {
    save({ ...ctx, jobSearch: { ...jobSearch, ...updates } });
  };

  // Target Companies CRUD
  const addTargetCompany = () => {
    if (!newCompany.trim()) return;
    if (jobSearch.targetCompanies.includes(newCompany.trim())) return;
    updateJobSearch({ targetCompanies: [...jobSearch.targetCompanies, newCompany.trim()] });
    setNewCompany('');
    setIsAddCompanyOpen(false);
  };

  const removeTargetCompany = (company: string) => {
    updateJobSearch({
      targetCompanies: jobSearch.targetCompanies.filter(c => c !== company),
      activeConversations: jobSearch.activeConversations.filter(c => c !== company),
    });
  };

  // Active Conversations CRUD
  const addConversation = () => {
    if (!newConversation.trim()) return;
    if (jobSearch.activeConversations.includes(newConversation.trim())) return;
    const updatedConversations = [...jobSearch.activeConversations, newConversation.trim()];
    // Also add to target companies if not there
    const updatedCompanies = jobSearch.targetCompanies.includes(newConversation.trim())
      ? jobSearch.targetCompanies
      : [...jobSearch.targetCompanies, newConversation.trim()];
    updateJobSearch({
      activeConversations: updatedConversations,
      targetCompanies: updatedCompanies,
    });
    setNewConversation('');
    setIsAddConversationOpen(false);
  };

  const toggleConversation = (company: string) => {
    if (jobSearch.activeConversations.includes(company)) {
      updateJobSearch({
        activeConversations: jobSearch.activeConversations.filter(c => c !== company),
      });
    } else {
      updateJobSearch({
        activeConversations: [...jobSearch.activeConversations, company],
      });
    }
  };

  const removeConversation = (company: string) => {
    updateJobSearch({
      activeConversations: jobSearch.activeConversations.filter(c => c !== company),
    });
  };

  // Applications counter
  const incrementApplications = () => {
    updateJobSearch({ applicationsThisWeek: jobSearch.applicationsThisWeek + 1 });
  };

  const decrementApplications = () => {
    if (jobSearch.applicationsThisWeek > 0) {
      updateJobSearch({ applicationsThisWeek: jobSearch.applicationsThisWeek - 1 });
    }
  };

  const resetWeeklyApplications = () => {
    updateJobSearch({ applicationsThisWeek: 0 });
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <p className="page-subtitle">
          Track your clients and conversations
        </p>
      </div>

      {/* Stats */}
      <div className="job-stats">
        <div className="job-stat-card" onClick={() => { if (!isEditingSalary) { setDraftSalary(jobSearch.targetSalary); setIsEditingSalary(true); }}} style={{ cursor: 'pointer' }}>
          <div className="job-stat-label">Target Salary</div>
          {isEditingSalary ? (
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <input
                type="text"
                value={draftSalary}
                onChange={e => setDraftSalary(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { updateJobSearch({ targetSalary: draftSalary }); setIsEditingSalary(false); }
                  if (e.key === 'Escape') setIsEditingSalary(false);
                }}
                className="edit-input stat-input"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
              <button className="btn btn-small btn-primary" onClick={e => { e.stopPropagation(); updateJobSearch({ targetSalary: draftSalary }); setIsEditingSalary(false); }}>Save</button>
            </div>
          ) : (
            <div className="job-stat-value">{jobSearch.targetSalary}</div>
          )}
        </div>
        <div className="job-stat-card">
          <div className="job-stat-label">Applications This Week</div>
          <div className="job-stat-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button className="btn btn-small" onClick={decrementApplications} disabled={jobSearch.applicationsThisWeek === 0}>
              -
            </button>
            <span>{jobSearch.applicationsThisWeek}</span>
            <button className="btn btn-small" onClick={incrementApplications}>
              +
            </button>
          </div>
          <button
            className="btn btn-small"
            onClick={resetWeeklyApplications}
            style={{ marginTop: 'var(--space-sm)', fontSize: 11 }}
          >
            Reset Week
          </button>
        </div>
        <div className="job-stat-card" onClick={() => setIsEditingStatus(true)} style={{ cursor: 'pointer' }}>
          <div className="job-stat-label">Status</div>
          {isEditingStatus ? (
            <select
              value={jobSearch.status}
              onChange={e => {
                updateJobSearch({ status: e.target.value });
                setIsEditingStatus(false);
              }}
              onBlur={() => setIsEditingStatus(false)}
              className="edit-select stat-input"
              autoFocus
            >
              <option value="Active">Active</option>
              <option value="Passive">Passive</option>
              <option value="On Hold">On Hold</option>
              <option value="Accepted Offer">Accepted Offer</option>
            </select>
          ) : (
            <div className="job-stat-value" style={{ fontSize: 18 }}>{jobSearch.status}</div>
          )}
        </div>
      </div>

      {/* Active Conversations */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="card-header">
          <span className="card-title">Active Conversations</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <span className="card-badge">{jobSearch.activeConversations.length}</span>
            <button className="btn btn-small" onClick={() => setIsAddConversationOpen(true)}>
              + Add
            </button>
          </div>
        </div>
        <div className="company-list">
          {jobSearch.activeConversations.map(company => (
            <span
              key={company}
              className="company-chip active editable"
              onClick={() => removeConversation(company)}
              title="Click to remove from active"
            >
              {company} ×
            </span>
          ))}
        </div>
        {jobSearch.activeConversations.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>
            No active conversations yet. Click a target company below to start one.
          </p>
        )}
      </div>

      {/* Target Companies */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Target Companies</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <span className="card-badge">{jobSearch.targetCompanies.length}</span>
            <button className="btn btn-small" onClick={() => setIsAddCompanyOpen(true)}>
              + Add
            </button>
          </div>
        </div>
        <div className="company-list">
          {jobSearch.targetCompanies.map(company => (
            <div key={company} className="company-chip-wrapper">
              <span
                className={`company-chip ${jobSearch.activeConversations.includes(company) ? 'active' : ''}`}
                onClick={() => toggleConversation(company)}
                title={jobSearch.activeConversations.includes(company) ? 'Click to mark inactive' : 'Click to mark as active conversation'}
              >
                {company}
              </span>
              <button
                className="chip-delete"
                onClick={() => removeTargetCompany(company)}
                title="Remove company"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {jobSearch.targetCompanies.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>
            No target companies yet
          </p>
        )}
      </div>

      {/* Add Company Modal */}
      <Modal isOpen={isAddCompanyOpen} onClose={() => setIsAddCompanyOpen(false)} title="Add Target Company">
        <div className="edit-form">
          <div className="edit-row">
            <label>Company Name</label>
            <input
              type="text"
              value={newCompany}
              onChange={e => setNewCompany(e.target.value)}
              className="edit-input"
              placeholder="e.g. Microsoft"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addTargetCompany()}
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddCompanyOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addTargetCompany} disabled={!newCompany.trim()}>
              Add Company
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Conversation Modal */}
      <Modal isOpen={isAddConversationOpen} onClose={() => setIsAddConversationOpen(false)} title="Add Active Conversation">
        <div className="edit-form">
          <div className="edit-row">
            <label>Company Name</label>
            <input
              type="text"
              value={newConversation}
              onChange={e => setNewConversation(e.target.value)}
              className="edit-input"
              placeholder="e.g. Google"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addConversation()}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 'var(--space-sm)' }}>
            This will also add to target companies if not already there.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddConversationOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addConversation} disabled={!newConversation.trim()}>
              Add Conversation
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
