'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ShoppingList } from '@/components/ShoppingList'
import { useAuth } from '@/contexts/AuthContext'
import { GET_LIST_ITEMS } from '@/lib/graphql/queries'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

interface ListItem {
  id: string
  quantity: number
  isCompleted: boolean
  notes?: string
  addedAt: string
  item: {
    id: string
    name: string
    category?: string
    createdBy: {
      id: string
      name: string
    }
  }
  list: {
    id: string
    title: string
    owner: {
      id: string
      name: string
    }
  }
}

export default function ListPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string
  const { user, updateLastOpenedList } = useAuth()

  const { loading, error, data, refetch } = useQuery<{
    getListItems: ListItem[]
  }>(GET_LIST_ITEMS, {
    variables: { listId },
    skip: !listId,
    // Removed pollInterval since we have real-time subscriptions
    // pollInterval: 5000, // Poll every 5 seconds for updates
  })

  // Update the last opened list when this page loads
  useEffect(() => {
    if (user && listId) {
      updateLastOpenedList(listId)
    }
  }, [user, listId, updateLastOpenedList])

  const listItems = data?.getListItems || []
  const listTitle = listItems[0]?.list.title || 'Shopping List'
  const listOwner = listItems[0]?.list.owner
  const totalItems = listItems.length
  const completedItems = listItems.filter(item => item.isCompleted).length

  // Memoize the refetch callback to prevent infinite re-renders
  const handleItemsUpdate = useCallback(() => {
    refetch()
  }, [refetch])

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600" />
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">Failed to load list: {error.message}</p>
          <Link href="/" className="btn btn-primary mt-4 inline-block">
            Go Back Home
          </Link>
        </div>
      </div>
    )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  console.log('Navigating to lists page for user:', user.id)
                  window.location.href = `/user/${user.id}/lists`
                }}
                className="text-primary-600 hover:underline mb-2 inline-block cursor-pointer bg-transparent border-none p-2 text-left hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                ← Back to Lists
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  console.log('Navigating to home page')
                  window.location.href = '/'
                }}
                className="text-primary-600 hover:underline mb-2 inline-block cursor-pointer bg-transparent border-none p-2 text-left hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                ← Back to Home
              </button>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{listTitle}</h1>
                {listOwner && <p className="text-gray-600">Created by {listOwner.name}</p>}
              </div>
            </div>
          </div>

          {/* Shopping List Component */}
          <div className="max-w-2xl mx-auto">
            <ShoppingList listId={listId} items={listItems} onItemsUpdate={handleItemsUpdate} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
