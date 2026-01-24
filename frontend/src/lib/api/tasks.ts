import apiClient from './client'
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  VoiceTaskRequest,
  TaskQuery,
  TasksResponse,
  TaskStats,
} from '@/types/task'

export const tasksApi = {
  getTasks: async (query: TaskQuery = {}): Promise<TasksResponse> => {
    const response = await apiClient.get('/tasks', { params: query })
    return response.data
  },

  getTask: async (id: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}`)
    return response.data
  },

  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post('/tasks', data)
    return response.data
  },

  createVoiceTask: async (data: VoiceTaskRequest): Promise<Task> => {
    const response = await apiClient.post('/tasks/voice', data)
    return response.data
  },

  updateTask: async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.patch(`/tasks/${id}`, data)
    return response.data
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/tasks/${id}`)
    return response.data
  },

  getTaskStats: async (): Promise<TaskStats> => {
    const response = await apiClient.get('/tasks/stats')
    return response.data
  },

  getOverdueTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/overdue')
    return response.data
  },

  getUpcomingTasks: async (days?: number): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/upcoming', {
      params: days ? { days } : {},
    })
    return response.data
  },
}