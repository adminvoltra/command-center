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
  handoffPrompt?: string;
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
  phases?: Phase[];
  instructions?: string;
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
  createdBy?: Collaborator;
  createdAt?: string;
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

export type ClientStatus = 'active' | 'prospect' | 'paused' | 'churned';

export interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
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

// ===== MISSION CONTROL TYPES =====

export type PhaseStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
export type StepStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete' | 'skipped';

export interface PhaseStep {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  assignees: Collaborator[];
  notes?: string;
  completedAt?: string;
  handoffPrompt?: string;
}

export interface Phase {
  id: string;
  number: number;
  name: string;
  description: string;
  status: PhaseStatus;
  steps: PhaseStep[];
  prerequisites: string[];
  validationGate?: string;
  startedAt?: string;
  completedAt?: string;
  instructions?: string;
  checklistInstructions?: string;
  handoffPrompt?: string;
}

export interface Workstream {
  collaborator: Collaborator;
  currentFocus: string;
  currentPhaseId?: string;
  blockers: string[];
  lastUpdate: string;
}

export interface Checkpoint {
  id: string;
  title: string;
  phaseId: string;
  targetDate?: string;
  isComplete: boolean;
  notes?: string;
}

export interface DiscoveryItem {
  id: string;
  question: string;
  answer?: string;
  category: string;
  status: 'open' | 'answered' | 'deferred';
  assignees: Collaborator[];
  createdAt: string;
}

export interface Risk {
  id: string;
  description: string;
  severity: Priority;
  phaseId?: string;
  mitigation?: string;
  isResolved: boolean;
}

export interface MeetingNote {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  content: string;
  projectId?: string;
  assignees: Collaborator[];
  createdAt: string;
}

export interface MissionControl {
  phases: Phase[];
  workstreams: Workstream[];
  checkpoints: Checkpoint[];
  discoveryItems: DiscoveryItem[];
  risks: Risk[];
  currentPhaseId: string;
}

export function createDefaultPhases(): Phase[] {
  return [
    { id: 'phase-1', number: 1, name: 'Discovery & Context Gathering', description: 'Gather brand context, platform status, assets, tool constraints, workflow preferences, and client packaging requirements.', status: 'not-started', steps: [], prerequisites: [], validationGate: 'Discovery summary produced with business overview, marketing objective, platform scope, assets, assumptions, constraints, risks, and recommended design direction.' },
    { id: 'phase-2', number: 2, name: 'Architecture & Design Direction', description: 'Define system architecture layers: content intelligence, generation, approval, scheduling, analytics, feedback, abstraction, logging, packaging, and mission control.', status: 'not-started', steps: [], prerequisites: ['phase-1'], validationGate: 'Architecture document with all layers defined including purpose, inputs, outputs, dependencies, failure points, and swapability.' },
    { id: 'phase-3', number: 3, name: 'Tooling Evaluation and Selection', description: 'Evaluate and select specific tools for each architecture layer based on reliability, cost, flexibility, and integration requirements.', status: 'not-started', steps: [], prerequisites: ['phase-2'], validationGate: 'Tool selection matrix with chosen tools, fallbacks, and rationale for each layer.' },
    { id: 'phase-4', number: 4, name: 'Content System Design', description: 'Design content intelligence and generation pipeline including industry customization, platform-specific formatting, hooks, CTAs, and variations.', status: 'not-started', steps: [], prerequisites: ['phase-3'], validationGate: 'Content pipeline specification with generation flow, industry templates, platform adapters, and variation system.' },
    { id: 'phase-5', number: 5, name: 'Approval & Human-in-the-Loop Workflow', description: 'Design approval workflow with approve/edit/reject/regenerate flow, rejection reason capture, and feedback learning loop.', status: 'not-started', steps: [], prerequisites: ['phase-4'], validationGate: 'Approval system design with UX flow, edit/reject capture, regeneration logic, and feedback integration.' },
    { id: 'phase-6', number: 6, name: 'Scheduling & Publishing Workflow', description: 'Design automated scheduling and publishing pipeline with optimal timing, platform API integration, and queue management.', status: 'not-started', steps: [], prerequisites: ['phase-5'], validationGate: 'Publishing pipeline specification with scheduling logic, platform connectors, and queue management.' },
    { id: 'phase-7', number: 7, name: 'Analytics, Reporting & Self-Improvement', description: 'Design analytics collection, weekly reporting, performance feedback loops, content optimization, and self-improvement logic.', status: 'not-started', steps: [], prerequisites: ['phase-6'], validationGate: 'Analytics system design with metrics, reporting templates, feedback loops, and optimization rules.' },
    { id: 'phase-8', number: 8, name: 'Model Abstraction & Reliability', description: 'Design model/tool abstraction layer for provider swapping, fallback workflows, dependency isolation, and minimal lock-in.', status: 'not-started', steps: [], prerequisites: ['phase-3'], validationGate: 'Abstraction layer spec with provider interfaces, swap procedures, and fallback workflows.' },
    { id: 'phase-9', number: 9, name: 'Packaging & Client Reusability', description: 'Design multi-tenant packaging for client deployment including tenant isolation, configuration, access control, and subscription readiness.', status: 'not-started', steps: [], prerequisites: ['phase-7'], validationGate: 'Packaging design with tenant model, configuration schema, onboarding flow, and access control.' },
    { id: 'phase-10', number: 10, name: 'Documentation, Hours & Handoff', description: 'Produce final documentation, hours estimate structure, knowledge base, IP protection notes, and immediate execution plan.', status: 'not-started', steps: [], prerequisites: ['phase-9'], validationGate: 'Complete documentation package with implementation guide, hours estimate, and day-1 execution plan.' },
  ];
}

export interface VoltraContext {
  lastUpdated: string;
  projects: Project[];
  dailyPlan: DailyBlock[];
  weeklyGoals: Goal[];
  reminders: Reminder[];
  clients: Client[];
  /** @deprecated kept for backward compat with existing Redis data */
  jobSearch?: {
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
  meetingNotes: MeetingNote[];
  missionControl: MissionControl;
}

// Default context — update this as your needs evolve
export const defaultContext: VoltraContext = {
  lastUpdated: new Date().toISOString(),
  notionConnected: false,
  projects: [
    {
      id: 'social-media-automation',
      name: 'Social Media Automation',
      category: 'growth',
      status: 'active',
      progress: 0,
      notes: 'End-to-end automated social media marketing solution for Voltra. Starting with Facebook and LinkedIn, designed to be packageable for future clients.',
      assignees: ['Aidan', 'Luke'],
      tasks: [],
      phases: createDefaultPhases(),
      lastTouched: new Date().toISOString(),
    },
  ],
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
  clients: [],
  scratchpad: '',
  activityLog: [],
  agencyScores: [],
  scheduleEvents: [],
  meetingNotes: [],
  missionControl: {
    currentPhaseId: 'phase-1',
    phases: [
      { id: 'phase-1', number: 1, name: 'Discovery & Context Gathering', description: 'Gather brand context, platform status, assets, tool constraints, workflow preferences, and client packaging requirements.', status: 'not-started', steps: [], prerequisites: [], validationGate: 'Discovery summary produced with business overview, marketing objective, platform scope, assets, assumptions, constraints, risks, and recommended design direction.' },
      { id: 'phase-2', number: 2, name: 'Architecture & Design Direction', description: 'Define system architecture layers: content intelligence, generation, approval, scheduling, analytics, feedback, abstraction, logging, packaging, and mission control.', status: 'not-started', steps: [], prerequisites: ['phase-1'], validationGate: 'Architecture document with all layers defined including purpose, inputs, outputs, dependencies, failure points, and swapability.' },
      { id: 'phase-3', number: 3, name: 'Tooling Evaluation and Selection', description: 'Evaluate and select specific tools for each architecture layer based on reliability, cost, flexibility, and integration requirements.', status: 'not-started', steps: [], prerequisites: ['phase-2'], validationGate: 'Tool selection matrix with chosen tools, fallbacks, and rationale for each layer.' },
      { id: 'phase-4', number: 4, name: 'Content System Design', description: 'Design content intelligence and generation pipeline including industry customization, platform-specific formatting, hooks, CTAs, and variations.', status: 'not-started', steps: [], prerequisites: ['phase-3'], validationGate: 'Content pipeline specification with generation flow, industry templates, platform adapters, and variation system.' },
      { id: 'phase-5', number: 5, name: 'Approval & Human-in-the-Loop Workflow', description: 'Design approval workflow with approve/edit/reject/regenerate flow, rejection reason capture, and feedback learning loop.', status: 'not-started', steps: [], prerequisites: ['phase-4'], validationGate: 'Approval system design with UX flow, edit/reject capture, regeneration logic, and feedback integration.' },
      { id: 'phase-6', number: 6, name: 'Scheduling & Publishing Workflow', description: 'Design automated scheduling and publishing pipeline with optimal timing, platform API integration, and queue management.', status: 'not-started', steps: [], prerequisites: ['phase-5'], validationGate: 'Publishing pipeline specification with scheduling logic, platform connectors, and queue management.' },
      { id: 'phase-7', number: 7, name: 'Analytics, Reporting & Self-Improvement', description: 'Design analytics collection, weekly reporting, performance feedback loops, content optimization, and self-improvement logic.', status: 'not-started', steps: [], prerequisites: ['phase-6'], validationGate: 'Analytics system design with metrics, reporting templates, feedback loops, and optimization rules.' },
      { id: 'phase-8', number: 8, name: 'Model Abstraction & Reliability', description: 'Design model/tool abstraction layer for provider swapping, fallback workflows, dependency isolation, and minimal lock-in.', status: 'not-started', steps: [], prerequisites: ['phase-3'], validationGate: 'Abstraction layer spec with provider interfaces, swap procedures, and fallback workflows.' },
      { id: 'phase-9', number: 9, name: 'Packaging & Client Reusability', description: 'Design multi-tenant packaging for client deployment including tenant isolation, configuration, access control, and subscription readiness.', status: 'not-started', steps: [], prerequisites: ['phase-7'], validationGate: 'Packaging design with tenant model, configuration schema, onboarding flow, and access control.' },
      { id: 'phase-10', number: 10, name: 'Documentation, Hours & Handoff', description: 'Produce final documentation, hours estimate structure, knowledge base, IP protection notes, and immediate execution plan.', status: 'not-started', steps: [], prerequisites: ['phase-9'], validationGate: 'Complete documentation package with implementation guide, hours estimate, and day-1 execution plan.' },
    ],
    workstreams: [
      { collaborator: 'Aidan', currentFocus: '', currentPhaseId: 'phase-1', blockers: [], lastUpdate: new Date().toISOString() },
      { collaborator: 'Luke', currentFocus: '', currentPhaseId: 'phase-1', blockers: [], lastUpdate: new Date().toISOString() },
    ],
    checkpoints: [],
    discoveryItems: [],
    risks: [],
  },
};
