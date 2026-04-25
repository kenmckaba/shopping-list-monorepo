'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface ListItem {
  id: string
  name: string
  quantity: number
  isCompleted: boolean // Using camelCase to match component expectations
  notes?: string
  shoppingListId: string // Using camelCase to match component expectations
  createdBy: string | null // Using camelCase to match component expectations
  createdAt: string // Using camelCase to match component expectations
  updatedAt: string // Using camelCase to match component expectations
  // Keep item property for backward compatibility with components
  item: {
    id: string
    name: string
    category?: string
  }
}

export function useRealtimeListItems(listId: string, userId?: string) {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listId) return

    // Initial fetch with item details
    async function fetchItems() {
      try {
        setLoading(true)
        setError(null)

        // Check authentication status
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        console.log('Current user:', user?.id, 'Auth error:', authError)

        // First try to fetch list_items without join to test basic access
        const { data: listItemsData, error: listItemsError } = await supabase
          .from('list_items')
          .select('*')
          .eq('shopping_list_id', listId)
          .order('updated_at', { ascending: false })

        if (listItemsError) {
          console.error('Error fetching list_items:', listItemsError)
          throw listItemsError
        }

        console.log('Successfully fetched items:', listItemsData?.length || 0)
        // Transform database fields (snake_case) to interface fields (camelCase)
        setItems(
          listItemsData?.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            isCompleted: item.is_completed, // Transform field name
            notes: item.notes,
            shoppingListId: item.shopping_list_id, // Transform field name
            createdBy: item.created_by, // Transform field name
            createdAt: item.created_at, // Transform field name
            updatedAt: item.updated_at, // Transform field name
            item: {
              id: item.id,
              name: item.name,
            },
          })) || []
        )
      } catch (err: unknown) {
        console.error('Full error object:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch items'
        console.error('Error message:', errorMessage)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()

    // Set up real-time subscription
    const channel = supabase
      .channel(`list_items_${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `shopping_list_id=eq.${listId}`,
        },
        async payload => {
          console.log(
            '📡 Real-time payload received:',
            payload.eventType,
            payload
          )

          if (payload.eventType === 'INSERT') {
            // Transform the new item to match our expected format
            const newItem = {
              id: payload.new.id,
              name: payload.new.name,
              quantity: payload.new.quantity,
              isCompleted: payload.new.is_completed, // Transform field name
              notes: payload.new.notes,
              shoppingListId: payload.new.shopping_list_id, // Transform field name
              createdBy: payload.new.created_by, // Transform field name
              createdAt: payload.new.created_at, // Transform field name
              updatedAt: payload.new.updated_at, // Transform field name
              item: {
                id: payload.new.id,
                name: payload.new.name,
                category: payload.new.category || null,
              },
            }
            console.log('✅ Adding new item to state:', newItem)
            setItems(prev => [newItem as ListItem, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Update existing item with proper field name transformation
            console.log('🔄 Updating item in state:', payload.new.id)
            setItems(prev =>
              prev.map(item => {
                if (item.id === payload.new.id) {
                  const updatedItem = {
                    ...item,
                    id: payload.new.id,
                    name: payload.new.name,
                    quantity: payload.new.quantity,
                    isCompleted: payload.new.is_completed, // Transform field name
                    notes: payload.new.notes,
                    createdAt: payload.new.created_at,
                    updatedAt: payload.new.updated_at,
                    shoppingListId: payload.new.shopping_list_id,
                    createdBy: payload.new.created_by,
                    item: {
                      id: payload.new.id,
                      name: payload.new.name,
                      category: payload.new.category || null,
                    },
                  }
                  console.log('✅ Item updated:', updatedItem)
                  return updatedItem
                }
                return item
              })
            )
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Deleting item from state:', payload.old.id)
            setItems(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe(status => {
        console.log('📡 Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId])

  // Add item function - with optimistic updates for immediate UI feedback
  const addItem = async (name: string, quantity = 1) => {
    try {
      console.log('🔄 Adding item:', { name, quantity, listId, userId })

      // Create a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const tempItem: ListItem = {
        id: tempId,
        name,
        quantity,
        isCompleted: false,
        notes: undefined,
        shoppingListId: listId,
        createdBy: userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        item: {
          id: tempId,
          name,
        },
      }

      // Optimistically add to UI first
      setItems(prev => [tempItem, ...prev])

      // Add item to database
      const { data, error } = await supabase
        .from('list_items')
        .insert({
          name,
          quantity,
          shopping_list_id: listId,
          is_completed: false,
          created_by: userId || null,
        })
        .select()

      if (error) {
        console.error('❌ Add item error:', error)
        // Remove the temporary item on error
        setItems(prev => prev.filter(item => item.id !== tempId))
        throw error
      }

      console.log('✅ Item added successfully:', data)

      // Replace temp item with real item from database
      if (data?.[0]) {
        const realItem = {
          id: data[0].id,
          name: data[0].name,
          quantity: data[0].quantity,
          isCompleted: data[0].is_completed,
          notes: data[0].notes,
          shoppingListId: data[0].shopping_list_id,
          createdBy: data[0].created_by,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at,
          item: {
            id: data[0].id,
            name: data[0].name,
          },
        }
        setItems(prev =>
          prev.map(item => (item.id === tempId ? realItem : item))
        )
      }
    } catch (err: unknown) {
      console.error('❌ Add item catch block:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add item'
      setError(errorMessage)
      throw err
    }
  }

  // Toggle completion
  const toggleComplete = async (itemId: string, isCompleted: boolean) => {
    try {
      console.log('🔄 Toggling completion:', {
        itemId,
        isCompleted,
        newState: !isCompleted,
      })

      // Optimistically update the UI first for immediate feedback
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                isCompleted: !isCompleted,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      )

      const { data, error } = await supabase
        .from('list_items')
        .update({
          is_completed: !isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()

      if (error) {
        console.error('❌ Toggle completion error:', error)
        // Revert the optimistic update on error
        setItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, isCompleted: isCompleted } // Revert back
              : item
          )
        )
        throw error
      }

      console.log('✅ Item toggled successfully:', data)
      // UI is already updated optimistically, no need to wait for real-time
    } catch (err: unknown) {
      console.error('❌ Toggle completion catch block:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to toggle completion'
      setError(errorMessage)
    }
  }

  // Delete item - with optimistic updates for immediate UI feedback
  const deleteItem = async (itemId: string) => {
    try {
      // Store the item for potential rollback
      const itemToDelete = items.find(item => item.id === itemId)

      // Optimistically remove from UI first
      setItems(prev => prev.filter(item => item.id !== itemId))

      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('❌ Delete item error:', error)
        // Restore the item on error if we have it
        if (itemToDelete) {
          setItems(prev => [itemToDelete, ...prev])
        }
        throw error
      }

      console.log('✅ Item deleted successfully')
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete item'
      setError(errorMessage)
    }
  }

  return {
    items,
    loading,
    error,
    addItem,
    toggleComplete,
    deleteItem,
  }
}
