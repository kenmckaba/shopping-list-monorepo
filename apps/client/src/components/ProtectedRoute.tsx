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
  const { user, supabaseUser, isLoading } = useAuth()
  const router = useRouter()
  const authenticatedUser = user || supabaseUser

  // biome-ignore lint/correctness/useExhaustiveDependencies: router changes reference on render, causes infinite loops
  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !authenticatedUser) {
        router.push(redirectTo)
      } else if (!requireAuth && authenticatedUser) {
        // If user is logged in and trying to access a non-auth page (like login)
        router.push(`/user/${authenticatedUser.id}/lists`)
      }
    }
  }, [authenticatedUser, isLoading, requireAuth, redirectTo]) // Remove router from dependencies

  // Only block with spinner on initial load when we don't yet know the auth state.
  // If the user is already known, render children immediately and let auth events
  // update state in the background (avoids spinner on tab switch / token refresh).
  if (isLoading && !authenticatedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )
  }

  if (requireAuth && !authenticatedUser) {
    return null // Will redirect via useEffect
  }

  if (!requireAuth && authenticatedUser) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
