'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    async function fetchLists() {
      try {
        const { data, error } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setLists(data || [])
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch lists'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

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
