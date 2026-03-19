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

export function ShoppingList({
  listId,
  items,
  onItemsUpdate,
}: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  const [addItemToList] = useMutation(ADD_ITEM_TO_LIST, {
    onCompleted: () => {
      setNewItemName('')
      setNewItemQuantity(1)
      // Removed onItemsUpdate call - subscriptions will handle the update
    },
  })

  const [updateListItem] = useMutation(UPDATE_LIST_ITEM, {
    // Removed onCompleted callback - subscriptions will handle the update
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
      // Subscription data automatically updates Apollo cache
      // No need to manually refetch
      console.log('Item updated:', data.data?.itemUpdated)
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
        className="bg-white p-4 rounded-lg shadow-md"
      >
        <h3 className="text-lg font-semibold mb-3">Add New Item</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="itemName" className="sr-only">
              Item name
            </label>
            <input
              type="text"
              id="itemName"
              name="itemName"
              autoComplete="off"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="input flex-1"
              required
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
          items.map((listItem) => (
            <div
              key={listItem.id}
              className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                listItem.isCompleted
                  ? 'border-green-500 bg-green-50'
                  : 'border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={listItem.isCompleted}
                      onChange={() =>
                        handleToggleComplete(listItem.id, listItem.isCompleted)
                      }
                      className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500 touch-target"
                      aria-label={`Mark ${listItem.item.name} as ${listItem.isCompleted ? 'incomplete' : 'complete'}`}
                    />
                    <div
                      className={
                        listItem.isCompleted ? 'line-through text-gray-500' : ''
                      }
                    >
                      <p className="font-medium">{listItem.item.name}</p>
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
          ))
        )}
      </div>
    </div>
  )
}
