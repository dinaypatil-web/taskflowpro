export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  priority: Priority
  status: TaskStatus
  dueDate?: string
  completedAt?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
  isVoiceCreated: boolean
  voiceMetadata?: VoiceMetadata
  taskStakeholders: TaskStakeholder[]
  reminders?: Reminder[]
  calendarEvents?: CalendarEvent[]
}

export interface VoiceMetadata {
  originalTranscript?: string
  confidence?: number
  language?: string
  processingTime?: number
  [key: string]: any
}

export interface TaskStakeholder {
  id: string
  taskId: string
  stakeholderId: string
  role: string
  createdAt: string
  stakeholder: Stakeholder
}

export interface Stakeholder {
  id: string
  userId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  organization?: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
  taskStakeholders?: {
    task: {
      id: string;
      title: string;
      status: TaskStatus;
      priority: Priority;
      dueDate?: string;
    }
  }[]
  reminderLogs?: any[]
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  stakeholderIds?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  priority?: Priority
  status?: TaskStatus
  dueDate?: string
  stakeholderIds?: string[]
}

export interface VoiceTaskRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  stakeholderIds?: string[]
  voiceMetadata?: VoiceMetadata
}

export interface TaskQuery {
  page?: number
  limit?: number
  status?: TaskStatus
  priority?: Priority
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dueDateFrom?: string
  dueDateTo?: string
}

export interface TasksResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface TaskStats {
  [key: string]: number
}

export type ReminderType = 'TASK_DUE' | 'TASK_OVERDUE' | 'TASK_ASSIGNED' | 'CUSTOM'
export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED'

export interface Reminder {
  id: string
  taskId: string
  type: ReminderType
  scheduledAt: string
  message?: string
  isRecurring: boolean
  recurringPattern?: string
  status: ReminderStatus
  attempts: number
  maxAttempts: number
  lastAttemptAt?: string
  nextRetryAt?: string
  createdAt: string
  updatedAt: string
  task?: {
    id: string
    title: string
    status: TaskStatus
    dueDate?: string
  }
  reminderLogs?: ReminderLog[]
}

export interface ReminderLog {
  id: string
  reminderId: string
  userId: string
  stakeholderId?: string
  provider: 'EMAIL' | 'SMS' | 'WHATSAPP'
  recipient: string
  message: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED'
  errorMessage?: string
  deliveredAt?: string
  createdAt: string
  stakeholder?: Stakeholder
}

export interface CalendarEvent {
  id: string
  userId: string
  taskId?: string
  title: string
  description?: string
  startDate: string
  endDate: string
  isAllDay: boolean
  location?: string
  createdAt: string
  updatedAt: string
  task?: {
    id: string
    title: string
    status: TaskStatus
    priority: Priority
  }
}