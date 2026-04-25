'use client'

import { ListItem } from '@/components/ListItem'
import type { ListItemType } from '@/components/shopping-list-type'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtimeListItems } from '@/hooks/useRealtimeListItems'
import { useRef, useState } from 'react'

export function ShoppingList({ listId }: { listId: string }) {
  const { user } = useAuth()
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnchecking, setIsUnchecking] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showUncheckAllConfirm, setShowUncheckAllConfirm] = useState(false)
  const [transitioningItems, setTransitioningItems] = useState<Set<string>>(
    new Set()
  )
  const inputRef = useRef<HTMLInputElement>(null)

  // Use real-time hook for list items with WebSocket-like updates
  const {
    items: realtimeItems,
    error: realtimeError,
    addItem,
    toggleComplete,
    deleteItem,
  } = useRealtimeListItems(listId, user?.id)

  // Convert to component format
  const items: ListItemType[] = realtimeItems.map(item => ({
    id: item.id,
    name: item.item.name,
    quantity: item.quantity,
    isCompleted: item.isCompleted, // Use camelCase field name
    notes: item.notes || null,
    addedAt: item.createdAt, // Use camelCase field name
    updatedAt: item.updatedAt, // Use camelCase field name
    createdAt: item.createdAt, // Use camelCase field name
    shopping_list_id: listId, // We know this from context
    item: {
      id: item.item.id,
      name: item.item.name,
      category: item.item.category || null,
    },
  }))

  const error = realtimeError

  const handleAddItem = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    // Check if item already exists in the list (client-side check for better UX)
    const existingItem = items.find(
      item => item.name.toLowerCase() === newItemName.trim().toLowerCase()
    )

    if (existingItem) {
      return // Item already exists, skip silently or show message
    }

    setIsSubmitting(true)

    try {
      await addItem(newItemName.trim(), newItemQuantity)
      setNewItemName('')
      setNewItemQuantity(1)
      // Focus the input field after a brief delay
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    } catch (err) {
      console.error('Error adding item:', err)
    } finally {
      setIsSubmitting(false)
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

      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        await toggleComplete(itemId, currentStatus)
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
      await deleteItem(itemToDelete.id)
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
      await Promise.all(completedItems.map(item => deleteItem(item.id)))
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
    setShowUncheckAllConfirm(true)
  }

  const confirmUncheckAll = async () => {
    const completedItems = items.filter(item => item.isCompleted)
    if (completedItems.length === 0) return

    setIsUnchecking(true)
    setShowUncheckAllConfirm(false)

    try {
      // Uncheck all completed items
      await Promise.all(
        completedItems.map(item => toggleComplete(item.id, true))
      )
    } catch (error) {
      console.error('Error unchecking items:', error)
    } finally {
      setIsUnchecking(false)
    }
  }

  const cancelUncheckAll = () => {
    setShowUncheckAllConfirm(false)
  }

  return (
    <div id="divX" className="rounded-lg mt-2">
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

      {/* Uncheck All Items Confirmation Modal */}
      {showUncheckAllConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border shadow-xl rounded-lg p-6 max-w-sm mx-4">
            <p className="text-foreground/70 mb-6">
              Are you sure you want to uncheck all completed items?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelUncheckAll}>
                Cancel
              </Button>
              <Button onClick={confirmUncheckAll} disabled={isUnchecking}>
                {isUnchecking ? 'Unchecking...' : 'Uncheck All'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="bg-card rounded-lg shadow-sm ">
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
              }}
              placeholder="Add an item"
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
      <div id="div0" className="mt-2 space-y-2">
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
                <div id="div1" className="space-y-1">
                  {uncompletedItems.map(listItem => (
                    <ListItem
                      key={listItem.id}
                      listItem={listItem}
                      isCompleted={false}
                      idPrefix="uncompleted-item"
                      transitioningItems={transitioningItems}
                      onToggleComplete={handleToggleComplete}
                      onRemoveItem={handleRemoveItem}
                    />
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
                  const dateA = new Date(a.updatedAt || a.createdAt).getTime()
                  const dateB = new Date(b.updatedAt || b.createdAt).getTime()
                  return dateB - dateA
                })
              return completedItems.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <h4 className="font-semibold text-muted-foreground ml-2">
                      Completed ({completedItems.length})
                    </h4>
                    {/* Bulk Actions */}
                    <div className="flex gap-2">
                      {/* Uncheck All Button */}
                      <Button
                        variant="link"
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
                        variant="link"
                        size="sm"
                        onClick={handleDeleteCompleted}
                        disabled={
                          items.filter(item => item.isCompleted).length === 0 ||
                          isDeleting
                        }
                        className="text-destructive/70 border-destructive/20 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete All'}
                      </Button>
                    </div>
                  </div>

                  {completedItems.map(listItem => (
                    <ListItem
                      key={listItem.id}
                      listItem={listItem}
                      isCompleted={true}
                      idPrefix="completed-item"
                      transitioningItems={transitioningItems}
                      onToggleComplete={handleToggleComplete}
                      onRemoveItem={handleRemoveItem}
                    />
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
