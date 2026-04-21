'use client';

import { useState, useMemo } from 'react';
import {
  startOfWeek, endOfWeek,
  eachDayOfInterval, format,
  addWeeks, subWeeks, isToday,
} from 'date-fns';
import type { ScheduleEvent, Collaborator } from '@/lib/context';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';
import CollaboratorPicker, { CollaboratorBadges } from '@/components/CollaboratorPicker';

type ViewMode = 'monthly' | 'weekly';

const emptyEvent: Omit<ScheduleEvent, 'id'> = {
  title: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
  assignees: [],
  notes: '',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

function formatTime(time: string | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${m} ${period}`;
}

export default function SchedulePage() {
  const { ctx, save, isLoading } = useAppContext();
  const [view, setView] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<ScheduleEvent, 'id'>>(emptyEvent);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<ScheduleEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [collabFilter, setCollabFilter] = useState<string>('all');

  const allEvents = ctx.scheduleEvents || [];
  const events = collabFilter === 'all'
    ? allEvents
    : allEvents.filter(e => e.assignees.includes(collabFilter as Collaborator));

  // Month view days — rolling 5 weeks starting at the week containing currentDate
  const monthDays = useMemo(() => {
    const calStart = startOfWeek(currentDate);
    const calEnd = endOfWeek(addWeeks(currentDate, 4));
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Pre-compute event lookups to avoid filtering per-cell
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      const existing = map.get(event.date);
      if (existing) existing.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [events]);

  const eventsByDateHour = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      if (!event.startTime) continue;
      const hour = event.startTime.substring(0, 2);
      const key = `${event.date}-${hour}`;
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  const getEventsForDate = (date: Date) => {
    return eventsByDate.get(format(date, 'yyyy-MM-dd')) || [];
  };

  if (isLoading) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  // CRUD
  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    const event: ScheduleEvent = { ...newEvent, id: Date.now().toString() };
    save({ ...ctx, scheduleEvents: [...events, event] });
    setNewEvent(emptyEvent);
    setIsAddModalOpen(false);
  };

  const saveEvent = () => {
    if (!editingEvent) return;
    save({
      ...ctx,
      scheduleEvents: events.map(e => e.id === editingEvent.id ? editingEvent : e),
    });
    setEditingEvent(null);
  };

  const deleteEvent = (id: string) => {
    save({ ...ctx, scheduleEvents: events.filter(e => e.id !== id) });
    setDeleteConfirm(null);
    setEditingEvent(null);
    setViewingEvent(null);
    setSelectedDate(null);
  };

  const openAddForDate = (date: Date) => {
    setNewEvent({ ...emptyEvent, date: format(date, 'yyyy-MM-dd') });
    setIsAddModalOpen(true);
  };

  // Events for selected date panel
  const selectedDateEvents = selectedDate
    ? events.filter(e => e.date === selectedDate).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    : [];

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">
            {events.length} events scheduled
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-primary" onClick={() => { setNewEvent(emptyEvent); setIsAddModalOpen(true); }}>
            + Add Event
          </button>
        </div>
      </div>

      {/* View Tabs + Filter */}
      <div className="schedule-tabs">
        <button className={`schedule-tab ${view === 'monthly' ? 'active' : ''}`} onClick={() => setView('monthly')}>Monthly</button>
        <button className={`schedule-tab ${view === 'weekly' ? 'active' : ''}`} onClick={() => setView('weekly')}>Weekly</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Filter:</span>
          <button className={`collab-chip ${collabFilter === 'all' ? 'selected' : ''}`} style={collabFilter === 'all' ? { background: 'var(--surface-2)', color: 'var(--text-1)', borderColor: 'var(--text-3)' } : {}} onClick={() => setCollabFilter('all')}>All</button>
          <button className={`collab-chip collab-chip-luke ${collabFilter === 'Luke' ? 'selected' : ''}`} onClick={() => setCollabFilter(collabFilter === 'Luke' ? 'all' : 'Luke')}>Luke</button>
          <button className={`collab-chip collab-chip-aidan ${collabFilter === 'Aidan' ? 'selected' : ''}`} onClick={() => setCollabFilter(collabFilter === 'Aidan' ? 'all' : 'Aidan')}>Aidan</button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav">
        <button className="btn btn-small" onClick={() => setCurrentDate(view === 'monthly' ? subWeeks(currentDate, 5) : subWeeks(currentDate, 1))}>
          ← Prev
        </button>
        <h2 className="calendar-title">
          {view === 'monthly'
            ? `${format(monthDays[0], 'MMM d')} – ${format(monthDays[monthDays.length - 1], 'MMM d, yyyy')}`
            : `Week of ${format(startOfWeek(currentDate), 'MMM d')} – ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
          }
        </h2>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-small" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-small" onClick={() => setCurrentDate(view === 'monthly' ? addWeeks(currentDate, 5) : addWeeks(currentDate, 1))}>
            Next →
          </button>
        </div>
      </div>

      {/* Monthly View */}
      {view === 'monthly' && (
        <div className="calendar-month">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {monthDays.map(day => {
            const dayEvents = getEventsForDate(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            return (
              <div
                key={dateStr}
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${selectedDate === dateStr ? 'selected' : ''}`}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                onDoubleClick={() => openAddForDate(day)}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className="calendar-event-chip" onClick={e => { e.stopPropagation(); setViewingEvent(ev); }}>
                      {ev.startTime && <span className="event-time">{formatTime(ev.startTime)}</span>}
                      <span className="event-chip-title">{ev.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="calendar-event-more">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly View */}
      {view === 'weekly' && (
        <div className="calendar-week">
          {/* Header row */}
          <div className="week-header-spacer" />
          {weekDays.map(day => (
            <div key={format(day, 'yyyy-MM-dd')} className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
              <span className="week-day-name">{format(day, 'EEE')}</span>
              <span className="week-day-num">{format(day, 'd')}</span>
            </div>
          ))}

          {/* Time rows */}
          {hours.map(hour => (
            <div key={hour} className="week-time-row">
              <div className="week-time-label">{hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`}</div>
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hourStr = hour.toString().padStart(2, '0');
                const hourEvents = eventsByDateHour.get(`${dateStr}-${hourStr}`) || [];
                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    className={`week-cell ${isToday(day) ? 'today' : ''}`}
                    onDoubleClick={() => {
                      setNewEvent({ ...emptyEvent, date: dateStr, startTime: `${hourStr}:00`, endTime: `${(hour + 1).toString().padStart(2, '0')}:00` });
                      setIsAddModalOpen(true);
                    }}
                  >
                    {hourEvents.map(ev => (
                      <div key={ev.id} className="week-event" onClick={e => { e.stopPropagation(); setViewingEvent(ev); }}>
                        {ev.startTime && <span className="week-event-time">{formatTime(ev.startTime)}</span>}
                        <span className="week-event-title">{ev.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Selected Date Detail Panel */}
      {selectedDate && view === 'monthly' && (
        <div className="day-detail-panel">
          <div className="day-detail-header">
            <h3>{format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</h3>
            <button className="btn btn-small btn-primary" onClick={() => openAddForDate(new Date(selectedDate + 'T12:00:00'))}>+ Add</button>
          </div>
          {selectedDateEvents.length === 0 ? (
            <p className="empty-state">No events. Double-click a day or click + Add.</p>
          ) : (
            <div className="day-detail-events">
              {selectedDateEvents.map(ev => (
                <div key={ev.id} className="day-event-card" onClick={() => setViewingEvent(ev)}>
                  <div className="day-event-time">
                    {ev.startTime && ev.endTime ? `${formatTime(ev.startTime)} – ${formatTime(ev.endTime)}` : formatTime(ev.startTime) || 'All day'}
                  </div>
                  <div className="day-event-title">{ev.title}</div>
                  <CollaboratorBadges assignees={ev.assignees} />
                  {ev.notes && <div className="day-event-notes">{ev.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Event">
        <div className="edit-form">
          <div className="edit-row">
            <label>Title *</label>
            <input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="edit-input" placeholder="Event title" autoFocus />
          </div>
          <div className="edit-row">
            <label>Date *</label>
            <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="edit-input" />
          </div>
          <div className="edit-row-group">
            <div className="edit-row">
              <label>Start Time</label>
              <input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} className="edit-input" />
            </div>
            <div className="edit-row">
              <label>End Time</label>
              <input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} className="edit-input" />
            </div>
          </div>
          <div className="edit-row">
            <label>Assignees</label>
            <CollaboratorPicker selected={newEvent.assignees} onChange={assignees => setNewEvent({ ...newEvent, assignees })} />
          </div>
          <div className="edit-row">
            <label>Project</label>
            <select value={newEvent.projectId || ''} onChange={e => setNewEvent({ ...newEvent, projectId: e.target.value || undefined })} className="edit-select">
              <option value="">No project</option>
              {ctx.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="edit-row">
            <label>Notes</label>
            <textarea value={newEvent.notes || ''} onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })} className="edit-textarea" rows={2} />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addEvent} disabled={!newEvent.title.trim()}>Add Event</button>
          </div>
        </div>
      </Modal>

      {/* View Event Modal */}
      <Modal isOpen={viewingEvent !== null} onClose={() => setViewingEvent(null)} title="Event Details">
        {viewingEvent && (() => {
          const project = viewingEvent.projectId ? ctx.projects.find(p => p.id === viewingEvent.projectId) : null;
          const dateLabel = new Date(viewingEvent.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
          const timeLabel = viewingEvent.startTime && viewingEvent.endTime
            ? `${formatTime(viewingEvent.startTime)} – ${formatTime(viewingEvent.endTime)}`
            : viewingEvent.startTime
              ? formatTime(viewingEvent.startTime)
              : 'All day';
          return (
            <div className="event-view">
              <h3 className="event-view-title">{viewingEvent.title}</h3>
              <div className="event-view-row">
                <span className="event-view-label">When</span>
                <div className="event-view-value">
                  <div>{dateLabel}</div>
                  <div className="event-view-subtle">{timeLabel}</div>
                </div>
              </div>
              {viewingEvent.assignees.length > 0 && (
                <div className="event-view-row">
                  <span className="event-view-label">Assignees</span>
                  <div className="event-view-value">
                    <CollaboratorBadges assignees={viewingEvent.assignees} />
                  </div>
                </div>
              )}
              {project && (
                <div className="event-view-row">
                  <span className="event-view-label">Project</span>
                  <div className="event-view-value">{project.name}</div>
                </div>
              )}
              {viewingEvent.notes && (
                <div className="event-view-row">
                  <span className="event-view-label">Notes</span>
                  <div className="event-view-value event-view-notes">{viewingEvent.notes}</div>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn btn-danger" onClick={() => setDeleteConfirm(viewingEvent.id)}>Delete</button>
                <button className="btn" onClick={() => setViewingEvent(null)}>Close</button>
                <button className="btn btn-primary" onClick={() => { setEditingEvent(viewingEvent); setViewingEvent(null); }}>Edit</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Event Modal */}
      <Modal isOpen={editingEvent !== null} onClose={() => setEditingEvent(null)} title="Edit Event">
        {editingEvent && (
          <div className="edit-form">
            <div className="edit-row">
              <label>Title</label>
              <input type="text" value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} className="edit-input" />
            </div>
            <div className="edit-row">
              <label>Date</label>
              <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} className="edit-input" />
            </div>
            <div className="edit-row-group">
              <div className="edit-row">
                <label>Start Time</label>
                <input type="time" value={editingEvent.startTime || ''} onChange={e => setEditingEvent({ ...editingEvent, startTime: e.target.value })} className="edit-input" />
              </div>
              <div className="edit-row">
                <label>End Time</label>
                <input type="time" value={editingEvent.endTime || ''} onChange={e => setEditingEvent({ ...editingEvent, endTime: e.target.value })} className="edit-input" />
              </div>
            </div>
            <div className="edit-row">
              <label>Assignees</label>
              <CollaboratorPicker selected={editingEvent.assignees} onChange={assignees => setEditingEvent({ ...editingEvent, assignees })} />
            </div>
            <div className="edit-row">
              <label>Project</label>
              <select value={editingEvent.projectId || ''} onChange={e => setEditingEvent({ ...editingEvent, projectId: e.target.value || undefined })} className="edit-select">
                <option value="">No project</option>
                {ctx.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="edit-row">
              <label>Notes</label>
              <textarea value={editingEvent.notes || ''} onChange={e => setEditingEvent({ ...editingEvent, notes: e.target.value })} className="edit-textarea" rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => setDeleteConfirm(editingEvent.id)}>Delete</button>
              <button className="btn" onClick={() => setEditingEvent(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEvent}>Save</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Event">
        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--text-2)' }}>Delete this event? This cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => deleteConfirm && deleteEvent(deleteConfirm)}>Delete</button>
        </div>
      </Modal>
    </main>
  );
}
