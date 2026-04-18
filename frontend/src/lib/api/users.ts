import apiClient from './client'
import { User } from '@/types/auth'

export const usersApi = {
  getProfile: async () => {
    const response = await apiClient.get<User>('/users/profile')
    return response.data
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.put<User>('/users/profile', data)
    return response.data
  },

  getAvailableSuperiors: async () => {
    const response = await apiClient.get<User[]>('/users/available-superiors')
    return response.data
  },

  getAvailableAssignees: async () => {
    const response = await apiClient.get<User[]>('/users/available-assignees')
    return response.data
  },

  getSubordinates: async () => {
    const response = await apiClient.get<User[]>('/users/subordinates')
    return response.data
  },

  getUserStats: async () => {
    const response = await apiClient.get('/users/stats')
    return response.data
  },

  updatePassword: async (data: any) => {
    const response = await apiClient.patch('/users/password', data)
    return response.data
  },
}
