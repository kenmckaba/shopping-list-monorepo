'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ShoppingList } from '@/components/ShoppingList'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import {
  GET_LIST_BY_ID,
  GET_LIST_ITEMS,
  GET_USER_ACCESSIBLE_LISTS,
} from '@/lib/graphql/queries'
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
  updatedAt?: string
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

  const { loading, error, data } = useQuery<{
    getListItems: ListItem[]
  }>(GET_LIST_ITEMS, {
    variables: { listId },
    skip: !listId,
    // Removed pollInterval since we have real-time subscriptions
    // pollInterval: 5000, // Poll every 5 seconds for updates
  })

  // Separate query for list details
  const { data: listData } = useQuery<{
    getShoppingListById: {
      id: string
      title: string
      description?: string
      isPublic: boolean
      createdAt: string
      updatedAt: string
      owner: {
        id: string
        name: string
      }
    }
  }>(GET_LIST_BY_ID, {
    variables: { id: listId },
    skip: !listId,
  })

  // Query for all lists the user has access to (this should include both owned and shared)
  const { data: userData } = useQuery<{
    getUserAccessibleLists: {
      id: string
      title: string
      description?: string
      isPublic: boolean
      createdAt: string
      owner: {
        id: string
        name: string
      }
    }[]
  }>(GET_USER_ACCESSIBLE_LISTS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  })

  // Update the last opened list when this page loads
  useEffect(() => {
    if (user && listId) {
      updateLastOpenedList(listId)
    }
  }, [user, listId, updateLastOpenedList])

  const listItems = data?.getListItems
  const listInfo = listData?.getShoppingListById
  const listTitle = listInfo?.title
  const listOwner = listInfo?.owner

  // Get all lists the user has access to (much simpler now!)
  const userAccessibleLists = userData?.getUserAccessibleLists

  // Always include current list if it's not already in accessible lists
  const currentListInfo = {
    id: listId,
    title: listTitle,
    owner: listOwner,
  }

  const isCurrentListInAccessibleLists = userAccessibleLists?.some(
    list => list.id === listId
  )
  const allUserLists = isCurrentListInAccessibleLists
    ? userAccessibleLists
    : userAccessibleLists
      ? [...userAccessibleLists, currentListInfo]
      : [currentListInfo]

  // Handle list selection change
  const handleListChange = useCallback(
    (selectedListId: string) => {
      if (selectedListId !== listId) {
        router.push(`/list/${selectedListId}`)
      }
    },
    [listId, router]
  )

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
          <p className="text-muted-foreground">Failed to load list: {error.message}</p>
          <Link href="/" className="btn btn-primary mt-4 inline-block">
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
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={() => {
                  if (user?.id) {
                    console.log('Navigating to lists page for user:', user.id)
                    window.location.href = `/user/${user.id}/lists`
                  }
                }}
                className="text-primary hover:underline inline-block cursor-pointer bg-transparent border-none p-2 text-left hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-ring"
              >
                ← Back to Lists
              </button>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                {/* Always show dropdown if user exists, with fallback */}
                {user ? (
                  <select
                    value={listId}
                    onChange={e => handleListChange(e.target.value)}
                    className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center bg-background border-2 border-input rounded-lg px-2 sm:px-4 py-1 sm:py-2 cursor-pointer hover:border-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
                    aria-label="Select a shopping list"
                  >
                    {allUserLists?.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h1 className="text-3xl font-bold text-foreground">
                    {listTitle}
                  </h1>
                )}
              </div>
            </div>
          </div>

          {/* Shopping List Component */}
          <div className="max-w-2xl mx-auto">
            <ShoppingList listId={listId} items={listItems || []} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
