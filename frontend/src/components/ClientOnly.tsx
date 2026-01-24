'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Specialized wrapper for auth-protected pages
interface AuthProtectedPageProps {
  children: React.ReactNode
}

export function AuthProtectedPage({ children }: AuthProtectedPageProps) {
  return (
    <ClientOnly 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      {children}
    </ClientOnly>
  )
}