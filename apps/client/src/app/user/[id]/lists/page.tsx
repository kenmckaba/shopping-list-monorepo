'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { GET_USER_ACCESSIBLE_LISTS } from '@/lib/graphql/queries'
import { LIST_ADDED, LIST_DELETED, LIST_UPDATED } from '@/lib/graphql/subscriptions'
import { useQuery, useSubscription } from '@apollo/client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ShoppingList {
  id: string
  title: string
  description?: string
  isPublic: boolean
  createdAt: string
  owner: {
    id: string
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    isCompleted: boolean
    item: {
      name: string
    }
  }>
}

export default function UserListsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user, logout, isLoading: authLoading } = useAuth()

  // All hooks must be called before conditional logic
  const { loading, error, data } = useQuery<{
    getUserAccessibleLists: ShoppingList[]
  }>(GET_USER_ACCESSIBLE_LISTS, {
    variables: { userId },
    skip: !userId, // Skip query if no userId
  })

  // Subscribe to real-time list updates
  useSubscription(LIST_ADDED, {
    onData: ({ data, client }) => {
      // Manually update cache to add the new list
      if (data.data?.listAdded) {
        const newList = data.data.listAdded
        console.log('List added:', newList)

        // Update the GET_USER_ACCESSIBLE_LISTS query cache
        client.cache.updateQuery(
          {
            query: GET_USER_ACCESSIBLE_LISTS,
            variables: { userId },
          },
          existingData => {
            if (!existingData?.getUserAccessibleLists) return existingData

            // Add the new list to the beginning of the lists
            return {
              ...existingData,
              getUserAccessibleLists: [newList, ...existingData.getUserAccessibleLists],
            }
          }
        )
      }
    },
  })

  useSubscription(LIST_UPDATED, {
    onData: ({ data, client }) => {
      // Manually update cache to modify the existing list
      if (data.data?.listUpdated) {
        const updatedList = data.data.listUpdated
        console.log('List updated:', updatedList)

        // Update the GET_USER_ACCESSIBLE_LISTS query cache
        client.cache.updateQuery(
          {
            query: GET_USER_ACCESSIBLE_LISTS,
            variables: { userId },
          },
          existingData => {
            if (!existingData?.getUserAccessibleLists) return existingData

            // Replace the updated list in the lists array
            return {
              ...existingData,
              getUserAccessibleLists: existingData.getUserAccessibleLists.map(
                (list: ShoppingList) =>
                  list.id === updatedList.id ? { ...list, ...updatedList } : list
              ),
            }
          }
        )
      }
    },
  })

  useSubscription(LIST_DELETED, {
    onData: ({ data, client }) => {
      // Manually update cache to remove the deleted list
      if (data.data?.listDeleted) {
        const deletedListId = data.data.listDeleted
        console.log('List deleted:', deletedListId)

        // Update the GET_USER_ACCESSIBLE_LISTS query cache
        client.cache.updateQuery(
          {
            query: GET_USER_ACCESSIBLE_LISTS,
            variables: { userId },
          },
          existingData => {
            if (!existingData?.getUserAccessibleLists) return existingData

            // Remove the deleted list from the lists array
            return {
              ...existingData,
              getUserAccessibleLists: existingData.getUserAccessibleLists.filter(
                (list: ShoppingList) => list.id !== deletedListId
              ),
            }
          }
        )
      }
    },
  })

  // Use useEffect for redirects to avoid issues with navigation
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    } else if (user && user.id !== userId) {
      router.push(`/user/${user.id}/lists`)
    }
  }, [user, userId, router, authLoading])

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
          <p className="text-gray-600">Failed to load lists: {error.message}</p>
          <Link href="/" className="btn btn-primary mt-4 inline-block">
            Go Back Home
          </Link>
        </div>
      </div>
    )

  const lists = data?.getUserAccessibleLists || []

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Shopping Lists</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}!</p>
            </div>
            <button type="submit" onClick={logout} className="btn btn-secondary">
              Sign Out
            </button>
          </div>

          <div className="max-w-2xl mx-auto">
            {lists.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Lists Yet</h2>
                <p className="text-gray-600 mb-4">
                  Create your first shopping list to get started!
                </p>
                <Link href={`/user/${userId}/create-list`} className="btn btn-primary">
                  Create New List
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Link href={`/user/${userId}/create-list`} className="btn btn-primary">
                    Create New List
                  </Link>
                </div>

                {lists.map(list => {
                  const totalItems = list.items.length
                  const completedItems = list.items.filter(item => item.isCompleted).length

                  return (
                    <div
                      key={list.id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{list.title}</h3>
                          {list.description && (
                            <p className="text-gray-600 text-sm mb-2">{list.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {totalItems} item{totalItems !== 1 ? 's' : ''}
                            </span>
                            <span>•</span>
                            <span className={list.isPublic ? 'text-blue-600' : 'text-gray-500'}>
                              {list.isPublic ? 'Public' : 'Private'}
                            </span>
                            <span>•</span>
                            <span>by {list.owner.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link href={`/list/${list.id}`} className="btn btn-primary">
                          View List
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
