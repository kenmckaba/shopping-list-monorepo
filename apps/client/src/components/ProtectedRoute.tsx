'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: router changes reference on render, causes infinite loops
  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        // If user is logged in and trying to access a non-auth page (like login)
        router.push(`/user/${user.id}/lists`)
      }
    }
  }, [user, isLoading, requireAuth, redirectTo]) // Remove router from dependencies

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect via useEffect
  }

  if (!requireAuth && user) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
