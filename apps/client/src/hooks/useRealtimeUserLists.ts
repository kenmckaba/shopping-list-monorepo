'use client'

import { supabase } from '@/lib/supabase'
// @ts-ignore: Import type only if available
// eslint-disable-next-line import/named
import type { SupabaseChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ShoppingList {
  id: string
  title: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export function useRealtimeUserLists(userId: string) {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use refs to ensure stable references for fetch and channel
  // Use the correct type for the channel ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchLists = useCallback(async () => {
    if (!userId) return
    console.log('[UserLists] fetchLists called, userId:', userId)
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLists(data || [])
      console.log('[UserLists] fetchLists success, count:', data?.length)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch lists'
      setError(errorMessage)
      console.error('[UserLists] fetchLists error:', errorMessage)
    } finally {
      setLoading(false)
      console.log('[UserLists] fetchLists finished, loading set to false')
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchLists()

    // Set up real-time subscription
    const channel = supabase
      .channel(`user_lists_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `owner_id=eq.${userId}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setLists(prev => [payload.new as ShoppingList, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setLists(prev =>
              prev.map(list =>
                list.id === payload.new.id
                  ? (payload.new as ShoppingList)
                  : list
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setLists(prev => prev.filter(list => list.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, fetchLists])

  // Refetch lists and reset loading when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log(
        '[UserLists] visibilitychange event:',
        document.visibilityState
      )
      if (document.visibilityState === 'visible') {
        console.log('[UserLists] Tab became visible, refetching lists...')
        fetchLists()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchLists])

  // Create new list
  const createList = async (title: string, description?: string) => {
    try {
      const { error } = await supabase.from('shopping_lists').insert({
        title,
        description,
        owner_id: userId,
      })

      if (error) throw error
      // List will be added automatically via real-time subscription
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create list'
      setError(errorMessage)
      throw err
    }
  }

  // Delete list
  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error
      // Deletion will be reflected automatically via real-time subscription
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete list'
      setError(errorMessage)
    }
  }

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
  }
}
