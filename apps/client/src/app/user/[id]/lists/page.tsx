'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtimeUserLists } from '@/hooks/useRealtimeUserLists'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function UserListsPage() {
  const params = useParams()
  const userId = params.id as string
  const { user, logout } = useAuth()
  const effectiveUserId = user?.id || userId

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

  // Visible debug element for loading state
  // Remove this after debugging
  const debugLoading = (
    <div className="fixed left-0 top-0 z-[9999] border border-black bg-white px-1 text-black">
      [DEBUG] loading: {loading ? 'true' : 'false'}
    </div>
  )

  if (loading && lists.length === 0)
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
                  All Shopping Lists
                </h1>
                <p className="text-muted-foreground mt-1">
                  Browse and collaborate on every shared list.
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
                    href={`/user/${effectiveUserId}/create-list`}
                    className="btn btn-primary"
                  >
                    Create New List
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Link
                      href={`/user/${effectiveUserId}/create-list`}
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
