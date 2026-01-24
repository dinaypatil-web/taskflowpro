'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    // Hydrate the store from localStorage
    useAuthStore.persist.rehydrate()
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}