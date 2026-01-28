
export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum Category {
  PERSONAL = 'Personal',
  COMPANY = 'Company'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  joinDate: string;
}

export interface ProjectMilestone {
  id: string;
  text: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: Category;
  priority: Priority;
  dueDate: string;
  progress: number; // 0-100
  completionCriteria?: { id: string; text: string; completed: boolean; }[];
  milestones?: ProjectMilestone[];
}

export interface Task {
  id: string;
  projectId?: string; // Optional linkage to a project
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category: Category;
  dueDate: string;
  dueTime?: string; // HH:mm format
  assignee?: string;
  dependencies?: string[]; // IDs of tasks that must be completed first
  reminderMinutes?: number; // Minutes before due date to remind
  reminderSent?: boolean;
}

export type View = 'DASHBOARD' | 'PROJECTS' | 'TASKS' | 'CALENDAR' | 'WORKFLOW' | 'PROFILE';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AIResponse {
  suggestedTasks?: Partial<Task>[];
  analysis?: string;
}

// Added TimeEntry interface to resolve the export error in TimeTracking.tsx
export interface TimeEntry {
  id: string;
  taskId?: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in seconds
  date: string;      // YYYY-MM-DD
}
