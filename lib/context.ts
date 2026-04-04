// lib/context.ts
// This is Voltra's master context file — the single source of truth for the dashboard.
// Claude reads /api/context (JSON) to always have the latest state.
// Update this file or use the /api/update endpoint to change values.

export type Priority = 'high' | 'medium' | 'low';
export type ProjectStatus = 'active' | 'waiting' | 'blocked' | 'done';
export type Collaborator = 'Aidan' | 'Luke';

export const COLLABORATORS: Collaborator[] = ['Aidan', 'Luke'];

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  assignees: Collaborator[];
  dueDate?: string; // YYYY-MM-DD
  projectId: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  category: 'paid' | 'growth';
  status: ProjectStatus;
  progress: number; // 0-100
  daysToFinish?: number;
  rate?: string;
  value?: string;
  notes: string;
  lastTouched?: string;
  assignees: Collaborator[];
  tasks: Task[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  assignees: Collaborator[];
  projectId?: string;
  notes?: string;
  color?: string;
}

export interface DailyBlock {
  time: string;
  label: string;
  projectId?: string;
  duration: string;
  notes?: string;
}

export interface Goal {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
  assignees?: Collaborator[];
}

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string;
  isCompleted: boolean;
  list?: string;
  priority?: number; // 0 = none, 1 = low, 5 = medium, 9 = high
  syncedAt: string;
}

export interface PerformanceMetrics {
  currentStreak: number; // days in a row hitting daily goals
  longestStreak: number;
  weeklyHoursLogged: number;
  goalsCompletedThisWeek: number;
  goalsCompletedTotal: number;
  projectsShipped: number;
  lastActiveDate: string;
  weeklyScores: number[]; // last 4 weeks, 1-10
}

export type ActivityType =
  | 'goal_completed'
  | 'goal_created'
  | 'project_progress'
  | 'project_completed'
  | 'project_created'
  | 'reminder_completed'
  | 'reminder_created'
  | 'schedule_completed';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface AgencyScoreEntry {
  date: string; // YYYY-MM-DD
  score: number; // 1-100
  report: string; // AI-generated explanation
  activitiesCount: number;
  calculatedAt: string;
}


export interface VoltraContext {
  lastUpdated: string;
  projects: Project[];
  dailyPlan: DailyBlock[];
  weeklyGoals: Goal[];
  reminders: Reminder[];
  jobSearch: {
    status: string;
    targetSalary: string;
    targetCompanies: string[];
    activeConversations: string[];
    applicationsThisWeek: number;
  };
  performance: PerformanceMetrics;
  scratchpad: string;
  notionConnected: boolean; // placeholder — flip to true when Notion is ready
  activityLog: ActivityLogEntry[];
  agencyScores: AgencyScoreEntry[];
  scheduleEvents: ScheduleEvent[];
}

// Default context — update this as your needs evolve
export const defaultContext: VoltraContext = {
  lastUpdated: new Date().toISOString(),
  notionConnected: false,
  projects: [],
  dailyPlan: [],
  weeklyGoals: [],
  reminders: [], // Synced from iOS Shortcuts
  performance: {
    currentStreak: 0,
    longestStreak: 0,
    weeklyHoursLogged: 0,
    goalsCompletedThisWeek: 0,
    goalsCompletedTotal: 0,
    projectsShipped: 0,
    lastActiveDate: new Date().toISOString(),
    weeklyScores: [],
  },
  jobSearch: {
    status: '',
    targetSalary: '',
    targetCompanies: [],
    activeConversations: [],
    applicationsThisWeek: 0,
  },
  scratchpad: '',
  activityLog: [],
  agencyScores: [],
  scheduleEvents: [],
};
