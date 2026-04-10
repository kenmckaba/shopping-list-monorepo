'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useRef, useState } from 'react'

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
}

export function ShoppingList({ listId, items }: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnchecking, setIsUnchecking] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [transitioningItems, setTransitioningItems] = useState<Set<string>>(
    new Set()
  )
  const client = useApolloClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [addItemToList] = useMutation(ADD_ITEM_TO_LIST, {
    onCompleted: () => {
      setNewItemName('')
      setNewItemQuantity(1)
      setError(null)
      setIsSubmitting(false)
      // Focus the input field after a brief delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    },
    onError: error => {
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
    onCompleted: data => {
      // When an item is updated, manually reorder the cache to put it at the top of its section
      const updatedItem = data.updateListItem

      // Update the cache directly
      client.cache.updateQuery(
        {
          query: GET_LIST_ITEMS,
          variables: { listId },
        },
        existingData => {
          if (!existingData?.getListItems) return existingData

          // Remove the updated item from its current position
          const otherItems = existingData.getListItems.filter(
            (item: ListItem) => item.id !== updatedItem.id
          )

          // Add the updated item to the beginning of the list (it will be filtered/sorted in render)
          return {
            ...existingData,
            getListItems: [updatedItem, ...otherItems],
          }
        }
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
          existingData => {
            if (!existingData?.getListItems) return existingData

            // Add the new item to the beginning of the list
            return {
              ...existingData,
              getListItems: [newItem, ...existingData.getListItems],
            }
          }
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
          data.data.itemUpdated.isCompleted
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
          existingData => {
            if (!existingData?.getListItems) return existingData

            return {
              ...existingData,
              getListItems: existingData.getListItems.filter(
                (item: ListItem) => item.id !== removedItemId
              ),
            }
          }
        )
      }
    },
  })

  const handleAddItem = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    // Check if item already exists in the list (client-side check for better UX)
    const existingItem = items.find(
      item => item.item.name.toLowerCase() === newItemName.trim().toLowerCase()
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
    currentStatus: boolean
  ) => {
    // If item is currently transitioning, ignore the click
    if (transitioningItems.has(itemId)) return

    try {
      // Add to transitioning state immediately for visual feedback
      setTransitioningItems(prev => new Set([...prev, itemId]))

      // Wait 500ms before actually updating the item
      setTimeout(async () => {
        try {
          await updateListItem({
            variables: {
              id: itemId,
              isCompleted: !currentStatus,
            },
          })
        } catch (error) {
          console.error('Error updating item:', error)
        } finally {
          // Remove from transitioning state after update completes
          setTransitioningItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(itemId)
            return newSet
          })
        }
      }, 500)
    } catch (error) {
      console.error('Error updating item:', error)
      // Remove from transitioning state if there's an error
      setTransitioningItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    setItemToDelete({ id: itemId, name: itemName })
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await removeItemFromList({
        variables: { id: itemToDelete.id },
      })
      setItemToDelete(null)
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const cancelDelete = () => {
    setItemToDelete(null)
  }

  const handleDeleteCompleted = async () => {
    setShowDeleteAllConfirm(true)
  }

  const confirmDeleteCompleted = async () => {
    const completedItems = items.filter(item => item.isCompleted)
    if (completedItems.length === 0) return

    setIsDeleting(true)
    setShowDeleteAllConfirm(false)

    try {
      // Delete all completed items
      await Promise.all(
        completedItems.map(item =>
          removeItemFromList({
            variables: { id: item.id },
          })
        )
      )
    } catch (error) {
      console.error('Error deleting completed items:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeleteCompleted = () => {
    setShowDeleteAllConfirm(false)
  }

  const handleUncheckAll = async () => {
    const completedItems = items.filter(item => item.isCompleted)
    if (completedItems.length === 0) return

    setIsUnchecking(true)

    try {
      // Uncheck all completed items
      await Promise.all(
        completedItems.map(item =>
          updateListItem({
            variables: {
              id: item.id,
              isCompleted: false,
            },
          })
        )
      )
    } catch (error) {
      console.error('Error unchecking items:', error)
    } finally {
      setIsUnchecking(false)
    }
  }

  return (
    <div className="space-y-4 bg-secondary p-4 rounded-lg">
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border shadow-xl rounded-lg p-6 max-w-sm mx-4">
            <p className="text-card-foreground mb-6">
              Are you sure you want to delete "{itemToDelete.name}"?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Completed Items Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border shadow-xl rounded-lg p-6 max-w-sm mx-4">
            <p className="text-foreground/70 mb-6">
              Are you sure you want to delete all completed items? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelDeleteCompleted}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCompleted}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-card p-4 rounded-lg shadow-sm border"
      >
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="itemName" className="sr-only">
              Add new item to shopping list
            </label>
            <Input
              type="text"
              id="itemName"
              name="itemName"
              ref={inputRef}
              autoComplete="off"
              value={newItemName}
              onChange={e => {
                setNewItemName(e.target.value)
                if (error) setError(null) // Clear error when user starts typing
              }}
              placeholder="Add an item"
              className={error ? 'border-destructive' : ''}
              required
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !newItemName.trim()}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </form>

      {/* Items List */}
      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No items in this list yet. Add some items to get started!
          </div>
        ) : (
          <>
            {/* Unchecked Items */}
            {(() => {
              const uncompletedItems = items.filter(item => !item.isCompleted)
              return uncompletedItems.length > 0 ? (
                <div className="space-y-2">
                  {uncompletedItems.map(listItem => (
                    <div
                      key={listItem.id}
                      className="w-full bg-card p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-primary hover:bg-accent transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`uncompleted-item-${listItem.id}`}
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`uncompleted-item-${listItem.id}`}
                            name="itemCompleted"
                            checked={
                              listItem.isCompleted ||
                              transitioningItems.has(listItem.id)
                            }
                            onChange={() =>
                              handleToggleComplete(
                                listItem.id,
                                listItem.isCompleted
                              )
                            }
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <div className="ml-2">
                            <p className="font-medium text-foreground">
                              {listItem.item.name}
                            </p>
                            {listItem.item.category && (
                              <p className="text-sm text-muted-foreground">
                                {listItem.item.category}
                              </p>
                            )}
                          </div>
                        </label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              handleRemoveItem(listItem.id, listItem.item.name)
                            }}
                            className="w-9 h-9 border-destructive/20 text-destructive/70 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-colors"
                            aria-label={`Remove ${listItem.item.name} from list`}
                          >
                            ×
                          </Button>
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
                .filter(item => item.isCompleted)
                .sort((a, b) => {
                  // Sort by updatedAt (most recent first), fallback to addedAt if updatedAt is missing
                  const dateA = new Date(a.updatedAt || a.addedAt).getTime()
                  const dateB = new Date(b.updatedAt || b.addedAt).getTime()
                  return dateB - dateA
                })
              return completedItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <h4 className="font-semibold text-muted-foreground">
                      Completed ({completedItems.length})
                    </h4>
                    {/* Bulk Actions */}
                    <div className="flex gap-2">
                      {/* Uncheck All Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUncheckAll}
                        disabled={
                          items.filter(item => item.isCompleted).length === 0 ||
                          isUnchecking
                        }
                      >
                        {isUnchecking ? 'Unchecking...' : 'Uncheck All'}
                      </Button>
                      {/* Delete Completed Items Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteCompleted}
                        disabled={
                          items.filter(item => item.isCompleted).length === 0 ||
                          isDeleting
                        }
                        className="text-destructive/70 border-destructive/20 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete all'}
                      </Button>
                    </div>
                  </div>

                  {completedItems.map(listItem => (
                    <div
                      key={listItem.id}
                      className="w-full bg-muted p-4 rounded-lg shadow-sm border border-border border-l-4 border-l-success hover:bg-muted/80 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`completed-item-${listItem.id}`}
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`completed-item-${listItem.id}`}
                            name="itemCompleted"
                            checked={
                              listItem.isCompleted &&
                              !transitioningItems.has(listItem.id)
                            }
                            onChange={() =>
                              handleToggleComplete(
                                listItem.id,
                                listItem.isCompleted
                              )
                            }
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <div className="line-through ml-2 text-muted-foreground">
                            <p className="font-medium">{listItem.item.name}</p>
                            {listItem.item.category && (
                              <p className="text-sm text-muted-foreground">
                                {listItem.item.category}
                              </p>
                            )}
                          </div>
                        </label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              handleRemoveItem(listItem.id, listItem.item.name)
                            }}
                            className="w-9 h-9 border-destructive/20 text-destructive/70 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-colors"
                            aria-label={`Remove ${listItem.item.name} from list`}
                          >
                            ×
                          </Button>
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
