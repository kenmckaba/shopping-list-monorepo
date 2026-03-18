'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ShoppingList } from '@/components/ShoppingList'
import { useAuth } from '@/contexts/AuthContext'
import { GET_LIST_ITEMS } from '@/lib/graphql/queries'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: router changes reference on render, causes infinite loops
  useEffect(() => {
    if (user && listId) {
      updateLastOpenedList(listId)
    }
  }, [user, listId]) // Remove function dependencies to prevent infinite loops

  const listItems = data?.getListItems || []
  const listTitle = listItems[0]?.list.title || 'Shopping List'
  const listOwner = listItems[0]?.list.owner
  const totalItems = listItems.length
  const completedItems = listItems.filter(item => item.isCompleted).length

  // Memoize the refetch callback to prevent infinite re-renders
  const handleItemsUpdate = useCallback(() => {
    refetch()
  }, [refetch])

  // Calculate progress percentage and round to nearest predefined value
  const getProgressValue = (completed: number, total: number): string => {
    if (total === 0) return '0'
    const percentage = Math.round((completed / total) * 100)

    // Round to nearest predefined CSS value
    if (percentage <= 5) return '0'
    if (percentage <= 15) return '10'
    if (percentage <= 22) return '20'
    if (percentage <= 27) return '25'
    if (percentage <= 35) return '30'
    if (percentage <= 45) return '40'
    if (percentage <= 55) return '50'
    if (percentage <= 65) return '60'
    if (percentage <= 72) return '70'
    if (percentage <= 77) return '75'
    if (percentage <= 85) return '80'
    if (percentage <= 95) return '90'
    return '100'
  }

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
            <Link href="/" className="text-primary-600 hover:underline mb-2 inline-block">
              ← Back to Home
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{listTitle}</h1>
                {listOwner && <p className="text-gray-600">Created by {listOwner.name}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {completedItems} of {totalItems} items completed
                </p>
                {totalItems > 0 && (
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary-600 h-2 rounded-full progress-bar"
                      data-progress={getProgressValue(completedItems, totalItems)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shopping List Component */}
          <div className="max-w-2xl mx-auto">
            <ShoppingList listId={listId} items={listItems} onItemsUpdate={handleItemsUpdate} />
          </div>

          {/* Share Info */}
          {totalItems > 0 && (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tip</h3>
                <p className="text-sm text-blue-700">
                  Changes to this list are updated in real-time. Share the URL with others to
                  collaborate!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
