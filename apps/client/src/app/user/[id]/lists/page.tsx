'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtimeUserLists } from '@/hooks/useRealtimeUserLists'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserListsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user, logout, isLoading: authLoading } = useAuth()

  // Use real-time hook for user lists with WebSocket-like updates
  const { lists, loading, error } = useRealtimeUserLists(userId)
  // Debug: log loading state on every render
  console.log(
    '[UserListsPage] Render: loading =',
    loading,
    'lists.length =',
    lists?.length,
    'error =',
    error
  )

  // Use useEffect for redirects to avoid issues with navigation
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    } else if (user && user.id !== userId) {
      router.push(`/user/${user.id}/lists`)
    }
  }, [user, userId, router, authLoading])

  // Visible debug element for loading state
  // Remove this after debugging
  const debugLoading = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        background: '#fff',
        color: '#000',
        padding: 4,
        border: '1px solid #000',
      }}
    >
      [DEBUG] loading: {loading ? 'true' : 'false'}
    </div>
  )

  if (loading)
    return (
      <>
        {debugLoading}
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      </>
    )

  if (error)
    return (
      <>
        {debugLoading}
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
            <p className="text-muted-foreground">
              Failed to load lists: {error}
            </p>
            <Link href="/" className="btn btn-primary mt-4 inline-block">
              Go Back Home
            </Link>
          </div>
        </div>
      </>
    )

  return (
    <>
      {debugLoading}
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  My Shopping Lists
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user?.name}!
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <button
                  type="submit"
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              {lists?.length === 0 ? (
                <div className="bg-card rounded-lg shadow-md p-8 text-center">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    No Lists Yet
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Create your first shopping list to get started!
                  </p>
                  <Link
                    href={`/user/${userId}/create-list`}
                    className="btn btn-primary"
                  >
                    Create New List
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Link
                      href={`/user/${userId}/create-list`}
                      className="btn btn-primary"
                    >
                      Create New List
                    </Link>
                  </div>

                  {lists?.map(
                    (list: {
                      id: string
                      title: string
                      created_at: string
                    }) => (
                      <div
                        key={list.id}
                        className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              {list.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>
                                Created{' '}
                                {new Date(list.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Link
                              href={`/list/${list.id}`}
                              className="btn btn-primary"
                            >
                              View List
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </>
  )
}
