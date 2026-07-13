'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const isDev = process.env.NODE_ENV === 'development'
const debugLog = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args)
  }
}

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

interface FetchItemsParams {
  silent: boolean
  suppressError: boolean
}

const STALE_REFETCH_THRESHOLD_MS = 30000

function mapDbItemToListItem(item: {
  id: string
  name: string
  quantity: number
  is_completed: boolean
  notes: string | null
  shopping_list_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}): ListItem {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    isCompleted: item.is_completed,
    notes: item.notes || undefined,
    shoppingListId: item.shopping_list_id,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    item: {
      id: item.id,
      name: item.name,
    },
  }
}

export function useRealtimeListItems(listId: string, userId?: string) {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listId) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let reconnectAttempts = 0
    let isActive = true
    let channelHasSubscribedOnce = false
    let needsResync = false
    let lastSuccessfulSyncAt = 0

    // Initial fetch with item details
    async function fetchItems({ silent, suppressError }: FetchItemsParams) {
      debugLog('[ListItems] fetchItems called, listId:', listId)
      try {
        if (!silent) {
          setLoading(true)
          setError(null)
        }

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

        lastSuccessfulSyncAt = Date.now()
        debugLog(
          '[ListItems] fetchItems success, count:',
          listItemsData?.length
        )
        // Transform database fields (snake_case) to interface fields (camelCase)
        setItems(listItemsData?.map(mapDbItemToListItem) || [])
        debugLog('[ListItems] fetchItems finished, loading set to false')
      } catch (err: unknown) {
        console.error('Full error object:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch items'
        console.error('Error message:', errorMessage)
        if (!suppressError) {
          setError(errorMessage)
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    }

    function clearReconnectTimer() {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    }

    function shouldRefetchOnVisibilityOrOnline() {
      if (needsResync) return true
      if (!lastSuccessfulSyncAt) return true

      return Date.now() - lastSuccessfulSyncAt > STALE_REFETCH_THRESHOLD_MS
    }

    function markNeedsResync() {
      needsResync = true
    }

    function scheduleReconnect(reason: string) {
      if (!isActive || reconnectTimeout) return

      const delayMs = Math.min(1000 * 2 ** reconnectAttempts, 30000)
      reconnectAttempts += 1
      debugLog(
        `[ListItems] Scheduling realtime reconnect in ${delayMs}ms (reason: ${reason}, attempt: ${reconnectAttempts})`
      )

      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null
        subscribeToRealtime()
      }, delayMs)
    }

    function subscribeToRealtime() {
      if (!isActive) return

      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }

      channel = supabase
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
            debugLog(
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
              debugLog('✅ Adding new item to state:', newItem)
              setItems(prev => {
                // Ignore duplicate realtime insert for an item we already have.
                if (prev.some(item => item.id === newItem.id)) {
                  return prev
                }

                // Replace matching optimistic temp item when realtime confirms insert.
                const tempItemIndex = prev.findIndex(
                  item =>
                    item.id.startsWith('temp-') &&
                    item.name === newItem.name &&
                    item.quantity === newItem.quantity &&
                    item.shoppingListId === newItem.shoppingListId
                )

                if (tempItemIndex !== -1) {
                  const next = [...prev]
                  next[tempItemIndex] = newItem as ListItem
                  return next
                }

                return [newItem as ListItem, ...prev]
              })
            } else if (payload.eventType === 'UPDATE') {
              // Update existing item with proper field name transformation
              debugLog('🔄 Updating item in state:', payload.new.id)
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
                    debugLog('✅ Item updated:', updatedItem)
                    return updatedItem
                  }
                  return item
                })
              )
            } else if (payload.eventType === 'DELETE') {
              debugLog('🗑️ Deleting item from state:', payload.old.id)
              setItems(prev => prev.filter(item => item.id !== payload.old.id))
            }
          }
        )
        .subscribe(status => {
          debugLog('📡 Subscription status:', status)

          if (status === 'SUBSCRIBED') {
            reconnectAttempts = 0
            clearReconnectTimer()

            if (!channelHasSubscribedOnce) {
              channelHasSubscribedOnce = true
              return
            }

            if (needsResync) {
              needsResync = false
              void fetchItems({ silent: true, suppressError: true })
            }
            return
          }

          if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            markNeedsResync()
            scheduleReconnect(status)
          }
        })
    }

    fetchItems({ silent: false, suppressError: false })
    subscribeToRealtime()

    // Add tab visibility handler
    const handleVisibilityChange = () => {
      debugLog('[ListItems] visibilitychange event:', document.visibilityState)
      if (document.visibilityState === 'visible') {
        if (shouldRefetchOnVisibilityOrOnline()) {
          debugLog('[ListItems] Tab became visible, refetching items...')
          needsResync = false
          void fetchItems({ silent: true, suppressError: true })
        }
      }
    }

    const handleOnline = () => {
      debugLog('[ListItems] Browser is online, forcing realtime reconnect')
      reconnectAttempts = 0
      clearReconnectTimer()
      subscribeToRealtime()

      if (shouldRefetchOnVisibilityOrOnline()) {
        needsResync = false
        void fetchItems({ silent: true, suppressError: true })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      isActive = false
      clearReconnectTimer()
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [listId])

  // Add item function - with optimistic updates for immediate UI feedback
  const addItem = async (name: string, quantity = 1) => {
    try {
      debugLog('🔄 Adding item:', { name, quantity, listId, userId })

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

      debugLog('✅ Item added successfully:', data)

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
        setItems(prev => {
          const withoutTemp = prev.filter(item => item.id !== tempId)
          if (withoutTemp.some(item => item.id === realItem.id)) {
            return withoutTemp
          }
          return [realItem, ...withoutTemp]
        })
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
      debugLog('🔄 Toggling completion:', {
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

      debugLog('✅ Item toggled successfully:', data)
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

      debugLog('✅ Item deleted successfully')
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
