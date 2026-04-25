'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ShoppingList } from '@/components/ShoppingList'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { useShoppingListDetail } from '@/hooks/useShoppingListDetail'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ListPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string
  const { user, updateLastOpenedList } = useAuth()

  // Get list details
  const {
    list: listInfo,
    loading: listLoading,
    error: listError,
  } = useShoppingListDetail(listId)

  // Update the last opened list when this page loads
  useEffect(() => {
    if (user && listId) {
      updateLastOpenedList(listId)
    }
  }, [user, listId, updateLastOpenedList])

  const listTitle = listInfo?.title

  if (listLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )

  // Handle case where list doesn't exist (no error but no data)
  if (!listLoading && !listError && !listInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            List Not Found
          </h1>
          <p className="text-muted-foreground">
            This list may have been deleted or you don't have access to it.
          </p>
          <Link
            href="/?listError=true"
            className="btn btn-primary mt-4 inline-block"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    )
  }

  if (listError)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">
            Failed to load list: {listError}
          </p>
          <Link
            href="/?listError=true"
            className="btn btn-primary mt-4 inline-block"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-2">
          {/* Header */}
          <div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (user?.id) {
                    // Use Next.js router for proper navigation
                    router.push(`/user/${user.id}/lists`)
                  } else {
                    // Fallback navigation
                    router.back()
                  }
                }}
                className="text-primary hover:text-primary/80 inline-block cursor-pointer bg-transparent border-none p-2 text-left hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                ← Back to Lists
              </button>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  {listTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Shopping List Component */}
          <div className="max-w-2xl mx-auto">
            <ShoppingList listId={listId} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
