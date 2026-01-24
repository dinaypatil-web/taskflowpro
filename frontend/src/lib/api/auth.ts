import apiClient from './client'
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenResponse,
  VerifyTokenRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
} from '@/types/auth'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  },

  verifyToken: async (data: VerifyTokenRequest): Promise<{ user: any; message: string }> => {
    const response = await apiClient.post('/auth/verify', data)
    return response.data
  },

  requestPasswordReset: async (data: RequestPasswordResetRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/request-password-reset', data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', data)
    return response.data
  },
}