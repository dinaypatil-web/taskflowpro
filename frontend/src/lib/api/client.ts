import axios, { AxiosError, AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1'

if (typeof window !== 'undefined') {
  console.log('🌐 API Config:', {
    baseUrl: API_URL,
    env: process.env.NODE_ENV,
    nextPublicUrl: process.env.NEXT_PUBLIC_API_URL
  })
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await useAuthStore.getState().refreshToken()
        const token = useAuthStore.getState().accessToken
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        useAuthStore.getState().clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    const errorMessage = (error.response?.data as any)?.message || error.message

    if (error.response?.status === 400) {
      toast.error(`Bad Request (400): ${errorMessage}`, { duration: 10000 })
    } else if (error.response?.status === 404) {
      toast.error(`Resource not found (404). Check API URL: ${API_URL}`)
    } else if (error.response?.status === 403) {
      toast.error('Access denied')
    } else if (error.response && error.response.status >= 500) {
      toast.error(`Server error: ${errorMessage}`)
    } else if (!error.response) {
      toast.error(`Network error: ${errorMessage}. Check if backend is running.`)
    }

    return Promise.reject(error)
  }
)

export default apiClient