'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { GET_USER_ACCESSIBLE_LISTS } from '@/lib/graphql/queries'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

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
  const { user, logout } = useAuth()

  // All hooks must be called before conditional logic
  const { loading, error, data } = useQuery<{
    getUserAccessibleLists: ShoppingList[]
  }>(GET_USER_ACCESSIBLE_LISTS, {
    variables: { userId },
    skip: !userId, // Skip query if no userId
  })

  // Redirect if not authenticated or trying to access another user's lists
  if (!user) {
    router.push('/')
    return null
  }

  if (user.id !== userId) {
    router.push(`/user/${user.id}/lists`)
    return null
  }

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
              <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
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

                      {totalItems > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>
                              {completedItems}/{totalItems} completed
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full progress-bar"
                              data-progress={getProgressValue(completedItems, totalItems)}
                            />
                          </div>
                        </div>
                      )}

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
