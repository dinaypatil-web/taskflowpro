import apiClient from './client'
import { Stakeholder } from '@/types/task'

export interface CreateStakeholderRequest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  organization?: string
  tags?: string[]
}

export interface UpdateStakeholderRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  organization?: string
  tags?: string[]
}

export interface StakeholderQuery {
  page?: number
  limit?: number
  search?: string
  organization?: string
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StakeholdersResponse {
  stakeholders: Stakeholder[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const stakeholdersApi = {
  getStakeholders: async (query: StakeholderQuery = {}): Promise<StakeholdersResponse> => {
    const response = await apiClient.get('/stakeholders', { params: query })
    return response.data
  },

  getStakeholder: async (id: string): Promise<Stakeholder> => {
    const response = await apiClient.get(`/stakeholders/${id}`)
    return response.data
  },

  createStakeholder: async (data: CreateStakeholderRequest): Promise<Stakeholder> => {
    const response = await apiClient.post('/stakeholders', data)
    return response.data
  },

  updateStakeholder: async (id: string, data: UpdateStakeholderRequest): Promise<Stakeholder> => {
    const response = await apiClient.patch(`/stakeholders/${id}`, data)
    return response.data
  },

  deleteStakeholder: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/stakeholders/${id}`)
    return response.data
  },

  getStakeholderTasks: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(`/stakeholders/${id}/tasks`)
    return response.data
  },

  createBulkStakeholders: async (stakeholders: CreateStakeholderRequest[]): Promise<Stakeholder[]> => {
    const response = await apiClient.post('/stakeholders/bulk', { stakeholders })
    return response.data
  },
}