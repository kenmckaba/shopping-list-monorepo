'use client'

import { ADD_ITEM_TO_LIST, REMOVE_ITEM_FROM_LIST, UPDATE_LIST_ITEM } from '@/lib/graphql/mutations'
import { ITEM_ADDED_TO_LIST, ITEM_REMOVED, ITEM_UPDATED } from '@/lib/graphql/subscriptions'
import { useMutation, useSubscription } from '@apollo/client'
import { useState } from 'react'

interface ListItem {
  id: string
  quantity: number
  isCompleted: boolean
  notes?: string
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

export function ShoppingList({ listId, items, onItemsUpdate }: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  const [addItemToList] = useMutation(ADD_ITEM_TO_LIST, {
    onCompleted: () => {
      setNewItemName('')
      setNewItemQuantity(1)
      onItemsUpdate?.()
    },
  })

  const [updateListItem] = useMutation(UPDATE_LIST_ITEM, {
    onCompleted: () => onItemsUpdate?.(),
  })

  const [removeItemFromList] = useMutation(REMOVE_ITEM_FROM_LIST, {
    onCompleted: () => onItemsUpdate?.(),
  })

  // Subscribe to real-time updates
  useSubscription(ITEM_ADDED_TO_LIST, {
    onData: () => onItemsUpdate?.(),
  })

  useSubscription(ITEM_UPDATED, {
    onData: () => onItemsUpdate?.(),
  })

  useSubscription(ITEM_REMOVED, {
    onData: () => onItemsUpdate?.(),
  })

  const handleAddItem = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!newItemName.trim()) return

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
    }
  }

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
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
      <form onSubmit={handleAddItem} className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Add New Item</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="itemName" className="sr-only">
              Item name
            </label>
            <input
              type="text"
              id="itemName"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="input flex-1"
              required
            />
          </div>
          <div className="w-20">
            <label htmlFor="itemQuantity" className="sr-only">
              Quantity
            </label>
            <input
              type="number"
              id="itemQuantity"
              value={newItemQuantity}
              onChange={e => setNewItemQuantity(Number(e.target.value))}
              min="1"
              className="input w-full"
              title="Quantity"
              placeholder="1"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </div>
      </form>

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items in this list yet. Add some items to get started!
          </div>
        ) : (
          items.map(listItem => (
            <div
              key={listItem.id}
              className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                listItem.isCompleted ? 'border-green-500 bg-green-50' : 'border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={listItem.isCompleted}
                      onChange={() => handleToggleComplete(listItem.id, listItem.isCompleted)}
                      className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500 touch-target"
                      aria-label={`Mark ${listItem.item.name} as ${listItem.isCompleted ? 'incomplete' : 'complete'}`}
                    />
                    <div className={listItem.isCompleted ? 'line-through text-gray-500' : ''}>
                      <p className="font-medium">{listItem.item.name}</p>
                      {listItem.item.category && (
                        <p className="text-sm text-gray-500">{listItem.item.category}</p>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(listItem.id, listItem.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center touch-target"
                    disabled={listItem.quantity <= 1}
                    aria-label={`Decrease quantity of ${listItem.item.name}`}
                    title={`Decrease quantity of ${listItem.item.name}`}
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{listItem.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(listItem.id, listItem.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center touch-target"
                    aria-label={`Increase quantity of ${listItem.item.name}`}
                    title={`Increase quantity of ${listItem.item.name}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(listItem.id)}
                    className="ml-2 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center touch-target"
                    aria-label={`Remove ${listItem.item.name} from list`}
                    title={`Remove ${listItem.item.name} from list`}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
