'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import type { ActivityType } from '@/lib/context';

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'goal_created', label: 'Task Created' },
  { value: 'goal_completed', label: 'Task Completed' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_progress', label: 'Project Progress' },
  { value: 'project_completed', label: 'Project Completed' },
  { value: 'reminder_created', label: 'Todo Created' },
  { value: 'reminder_completed', label: 'Todo Completed' },
  { value: 'schedule_completed', label: 'Schedule Block Done' },
];

export default function ActivityLogPage() {
  const { ctx, saveWithActivity, isLoading } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'goal_completed' as ActivityType,
    description: '',
    notes: '',
  });
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [filterDays, setFilterDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterDays, searchQuery, pageSize]);

  const toggleDay = (date: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // Add manual log entry
  const addEntry = () => {
    if (!newEntry.description.trim()) return;
    const description = newEntry.notes
      ? `${newEntry.description} — ${newEntry.notes}`
      : newEntry.description;

    saveWithActivity(ctx, {
      type: newEntry.type,
      description,
      metadata: { manual: true },
    });

    setNewEntry({ type: 'goal_completed', description: '', notes: '' });
    setIsAddModalOpen(false);
  };

  // Get activities within filter range
  const cutoffDate = new Date();
  if (filterDays === 1) {
    cutoffDate.setHours(0, 0, 0, 0);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - filterDays);
  }

  const activitiesInRange = (ctx.activityLog || [])
    .filter(a => new Date(a.timestamp) >= cutoffDate);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredActivities = activitiesInRange
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(a => {
      if (!normalizedQuery) return true;
      return (
        a.description.toLowerCase().includes(normalizedQuery) ||
        a.type.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Paginate
  const totalFiltered = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const activities = filteredActivities.slice(pageStart, pageEnd);

  // Group by date
  const groupedActivities: Record<string, typeof activities> = {};
  activities.forEach(activity => {
    const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  // Calculate stats — always use activitiesInRange so KPIs reflect the time window, not the type filter
  const totalActivities = activitiesInRange.length;
  const goalsCompleted = activitiesInRange.filter(a => a.type === 'goal_completed').length;
  const projectsProgressed = activitiesInRange.filter(a => a.type === 'project_progress' || a.type === 'project_completed').length;
  const tasksCompleted = activitiesInRange.filter(a => a.type === 'reminder_completed').length;

  // Get type color
  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'goal_completed': return 'var(--success)';
      case 'goal_created': return 'var(--success)';
      case 'project_completed': return 'var(--gold)';
      case 'project_progress': return 'var(--info)';
      case 'project_created': return 'var(--info)';
      case 'reminder_completed': return 'var(--warning)';
      case 'reminder_created': return 'var(--warning)';
      case 'schedule_completed': return 'var(--slate)';
      default: return 'var(--text-3)';
    }
  };

  // Format type label — remap reminder_* to Task for consistency with UI
  const formatType = (type: ActivityType) => {
    const labels: Record<ActivityType, string> = {
      goal_created: 'Task Created',
      goal_completed: 'Task Completed',
      project_created: 'Project Created',
      project_progress: 'Project Progress',
      project_completed: 'Project Completed',
      reminder_created: 'Todo Created',
      reminder_completed: 'Todo Completed',
      schedule_completed: 'Schedule Block Done',
    };
    return labels[type] || type;
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">
            Track your progress and accomplishments
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Log Work
        </button>
      </div>

      {/* Stats Row */}
      <div className="log-stats">
        <div className="log-stat">
          <span className="log-stat-value">{totalActivities}</span>
          <span className="log-stat-label">Total Activities</span>
        </div>
        <div className="log-stat">
          <span className="log-stat-value" style={{ color: 'var(--success)' }}>{goalsCompleted}</span>
          <span className="log-stat-label">Tasks</span>
        </div>
        <div className="log-stat">
          <span className="log-stat-value" style={{ color: 'var(--info)' }}>{projectsProgressed}</span>
          <span className="log-stat-label">Project Updates</span>
        </div>
        <div className="log-stat">
          <span className="log-stat-value" style={{ color: 'var(--warning)' }}>{tasksCompleted}</span>
          <span className="log-stat-label">Todos Done</span>
        </div>
      </div>

      {/* Filters */}
      <div className="log-filters">
        <div className="filter-group">
          <label>Time Range</label>
          <select
            value={filterDays}
            onChange={e => setFilterDays(Number(e.target.value))}
            className="filter-select"
          >
            <option value={1}>Today</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last Year</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as ActivityType | 'all')}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {activityTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
          <label>Search</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search descriptions..."
              className="filter-select"
              style={{ width: '100%', paddingRight: searchQuery ? 28 : undefined }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity List */}
      {totalFiltered > 0 && (
        <div className="log-pagination-summary">
          Showing {pageStart + 1}–{Math.min(pageEnd, totalFiltered)} of {totalFiltered}
        </div>
      )}
      {Object.keys(groupedActivities).length > 0 ? (
        <div className="log-list">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date} className="log-day">
              <div
                className={`log-day-header ${collapsedDays.has(date) ? 'collapsed' : ''}`}
                onClick={() => toggleDay(date)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`collapse-arrow ${collapsedDays.has(date) ? '' : 'expanded'}`}>▶</span>
                  <span className="log-day-date">{date}</span>
                </div>
                <span className="log-day-count">{dayActivities.length} activities</span>
              </div>
              {!collapsedDays.has(date) && (
                <div className="log-day-activities">
                  {dayActivities.map(activity => (
                    <div key={activity.id} className="log-item">
                      <div
                        className="log-item-indicator"
                        style={{ background: getTypeColor(activity.type) }}
                      />
                      <div className="log-item-content">
                        <div className="log-item-header">
                          <span className="log-item-type" style={{ color: getTypeColor(activity.type) }}>
                            {formatType(activity.type)}
                          </span>
                          <span className="log-item-time">
                            {new Date(activity.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="log-item-desc">{activity.description}</p>
                        {activity.metadata?.manual === true && (
                          <span className="log-item-manual">Manual entry</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">
            {normalizedQuery ? `No activities match "${searchQuery}".` : 'No activities logged in this time period.'}
          </p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            Log Your First Entry
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="log-pagination">
          <button
            className="btn btn-small"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <span className="log-pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-small"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="filter-select"
            style={{ marginLeft: 'auto', width: 'auto' }}
            aria-label="Per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log Completed Work">
        <div className="edit-form">
          <div className="edit-row">
            <label>Type *</label>
            <select
              value={newEntry.type}
              onChange={e => setNewEntry({ ...newEntry, type: e.target.value as ActivityType })}
              className="edit-select"
            >
              {activityTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="edit-row">
            <label>What did you accomplish? *</label>
            <input
              type="text"
              value={newEntry.description}
              onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
              className="edit-input"
              placeholder="e.g., Finished MVP for client project"
              autoFocus
            />
          </div>
          <div className="edit-row">
            <label>Additional Notes</label>
            <textarea
              value={newEntry.notes}
              onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
              className="edit-textarea"
              rows={2}
              placeholder="Optional details..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={addEntry}
              disabled={!newEntry.description.trim()}
            >
              Log Entry
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
