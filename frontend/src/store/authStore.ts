import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api/auth'
import { User } from '@/types/auth'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  initializeAuth: () => void
  setUser: (user: User) => void
  clearAuth: () => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          const response = await authApi.login({ email, password })
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
          
          toast.success('Login successful!')
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          throw error
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true })
          const response = await authApi.register(data)
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
          
          toast.success('Registration successful!')
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          throw error
        }
      },

      logout: () => {
        authApi.logout().catch(() => {
          // Ignore logout errors
        })
        
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
        
        toast.success('Logged out successfully')
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken()
          set({
            accessToken: response.accessToken,
            isAuthenticated: true,
          })
        } catch (error) {
          // Refresh failed, clear auth
          get().clearAuth()
          throw error
        }
      },

      initializeAuth: () => {
        const state = get()
        if (state.accessToken && state.user) {
          set({
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setUser: (user: User) => {
        set({ user })
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
)