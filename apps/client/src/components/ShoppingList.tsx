'use client'

import {
  ADD_ITEM_TO_LIST,
  REMOVE_ITEM_FROM_LIST,
  UPDATE_LIST_ITEM,
} from '@/lib/graphql/mutations'
import { GET_LIST_ITEMS } from '@/lib/graphql/queries'
import {
  ITEM_ADDED_TO_LIST,
  ITEM_REMOVED,
  ITEM_UPDATED,
} from '@/lib/graphql/subscriptions'
import { useApolloClient, useMutation, useSubscription } from '@apollo/client'
import { useState } from 'react'

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
  }
}

interface ShoppingListProps {
  listId: string
  items: ListItem[]
  onItemsUpdate?: () => void
}

export function ShoppingList({
  listId,
  items,
  onItemsUpdate,
}: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const client = useApolloClient()

  const [addItemToList] = useMutation(ADD_ITEM_TO_LIST, {
    onCompleted: () => {
      setNewItemName('')
      setNewItemQuantity(1)
      setError(null)
      setIsSubmitting(false)
      // Removed onItemsUpdate call - subscriptions will handle the update
    },
    onError: (error) => {
      setIsSubmitting(false)
      // Check if it's a duplicate item error
      if (
        error.message?.includes('Unique constraint failed') ||
        error.message?.includes('already exists')
      ) {
        setError(`"${newItemName}" is already in this list`)
      } else {
        setError('Failed to add item. Please try again.')
      }
    },
  })

  const [updateListItem] = useMutation(UPDATE_LIST_ITEM, {
    onCompleted: (data) => {
      // When an item is updated, manually reorder the cache to put it at the top of its section
      const updatedItem = data.updateListItem

      // Update the cache directly
      client.cache.updateQuery(
        {
          query: GET_LIST_ITEMS,
          variables: { listId },
        },
        (existingData) => {
          if (!existingData?.getListItems) return existingData

          // Remove the updated item from its current position
          const otherItems = existingData.getListItems.filter(
            (item: ListItem) => item.id !== updatedItem.id,
          )

          // Add the updated item to the beginning of the list (it will be filtered/sorted in render)
          return {
            ...existingData,
            getListItems: [updatedItem, ...otherItems],
          }
        },
      )
    },
  })

  const [removeItemFromList] = useMutation(REMOVE_ITEM_FROM_LIST, {
    // Removed onCompleted callback - subscriptions will handle the update
  })

  // Subscribe to real-time updates - don't trigger refetch as subscriptions automatically update cache
  useSubscription(ITEM_ADDED_TO_LIST, {
    onData: ({ data, client }) => {
      // Manually update cache to add the new item
      if (data.data?.itemAddedToList) {
        const newItem = data.data.itemAddedToList
        console.log('Item added:', newItem)

        // Update the GET_LIST_ITEMS query cache
        client.cache.updateQuery(
          {
            query: GET_LIST_ITEMS,
            variables: { listId },
          },
          (existingData) => {
            if (!existingData?.getListItems) return existingData

            // Add the new item to the beginning of the list
            return {
              ...existingData,
              getListItems: [newItem, ...existingData.getListItems],
            }
          },
        )
      }
    },
  })

  useSubscription(ITEM_UPDATED, {
    onData: ({ data }) => {
      // Just log for debugging - mutation onCompleted handles cache updates
      if (data.data?.itemUpdated) {
        console.log(
          'Item updated:',
          data.data.itemUpdated.item.name,
          'isCompleted:',
          data.data.itemUpdated.isCompleted,
        )
      }
    },
  })

  useSubscription(ITEM_REMOVED, {
    onData: ({ data, client }) => {
      // Manually update cache to remove the deleted item
      if (data.data?.itemRemoved) {
        const removedItemId = data.data.itemRemoved
        console.log('Item removed:', removedItemId)

        // Update the GET_LIST_ITEMS query cache
        client.cache.updateQuery(
          {
            query: GET_LIST_ITEMS,
            variables: { listId },
          },
          (existingData) => {
            if (!existingData?.getListItems) return existingData

            return {
              ...existingData,
              getListItems: existingData.getListItems.filter(
                (item: ListItem) => item.id !== removedItemId,
              ),
            }
          },
        )
      }
    },
  })

  const handleAddItem = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    // Check if item already exists in the list (client-side check for better UX)
    const existingItem = items.find(
      (item) =>
        item.item.name.toLowerCase() === newItemName.trim().toLowerCase(),
    )

    if (existingItem) {
      setError(`"${newItemName.trim()}" is already in this list`)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await addItemToList({
        variables: {
          listId,
          itemName: newItemName.trim(),
          quantity: newItemQuantity,
        },
      })
    } catch (error) {
      console.error('Error adding item:', error)
      // Error is handled in the mutation's onError callback
    }
  }

  const handleToggleComplete = async (
    itemId: string,
    currentStatus: boolean,
  ) => {
    try {
      await updateListItem({
        variables: {
          id: itemId,
          isCompleted: !currentStatus,
        },
      })
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateListItem({
        variables: {
          id: itemId,
          quantity: Math.max(1, quantity),
        },
      })
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItemFromList({
        variables: { id: itemId },
      })
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white p-1 rounded-lg shadow-md"
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              id="itemName"
              name="itemName"
              autoComplete="off"
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value)
                if (error) setError(null) // Clear error when user starts typing
              }}
              placeholder="Add a new item"
              className={`input flex-1 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Items List */}
      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items in this list yet. Add some items to get started!
          </div>
        ) : (
          <>
            {/* Unchecked Items */}
            {(() => {
              const uncompletedItems = items.filter((item) => !item.isCompleted)
              return uncompletedItems.length > 0 ? (
                <div className="space-y-2">
                  {uncompletedItems.map((listItem) => (
                    <div
                      key={listItem.id}
                      className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              name="itemCompleted"
                              checked={listItem.isCompleted}
                              onChange={() =>
                                handleToggleComplete(
                                  listItem.id,
                                  listItem.isCompleted,
                                )
                              }
                              className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500 touch-target"
                              aria-label={`Mark ${listItem.item.name} as ${listItem.isCompleted ? 'incomplete' : 'complete'}`}
                            />
                            <div>
                              <p className="font-medium">
                                {listItem.item.name}
                              </p>
                              {listItem.item.category && (
                                <p className="text-sm text-gray-500">
                                  {listItem.item.category}
                                </p>
                              )}
                            </div>
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(listItem.id)}
                            className="w-8 h-8 rounded-lg border border-red-300 bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 touch-target"
                            aria-label={`Remove ${listItem.item.name} from list`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            })()}

            {/* Checked Items */}
            {(() => {
              const completedItems = items
                .filter((item) => item.isCompleted)
                .sort((a, b) => {
                  // Sort by updatedAt (most recent first), fallback to addedAt if updatedAt is missing
                  const dateA = new Date(
                    a.updatedAt || a.addedAt || '',
                  ).getTime()
                  const dateB = new Date(
                    b.updatedAt || b.addedAt || '',
                  ).getTime()
                  return dateB - dateA
                })
              return completedItems.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 border-t pt-4">
                    Completed Items ({completedItems.length})
                  </h4>
                  {completedItems.map((listItem) => (
                    <div
                      key={listItem.id}
                      className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              name="itemCompleted"
                              checked={listItem.isCompleted}
                              onChange={() =>
                                handleToggleComplete(
                                  listItem.id,
                                  listItem.isCompleted,
                                )
                              }
                              className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500 touch-target"
                              aria-label={`Mark ${listItem.item.name} as ${listItem.isCompleted ? 'incomplete' : 'complete'}`}
                            />
                            <div className="line-through text-gray-500">
                              <p className="font-medium">
                                {listItem.item.name}
                              </p>
                              {listItem.item.category && (
                                <p className="text-sm text-gray-500">
                                  {listItem.item.category}
                                </p>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            })()}
          </>
        )}
      </div>
    </div>
  )
}
