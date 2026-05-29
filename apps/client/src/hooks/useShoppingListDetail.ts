'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export interface ShoppingListDetail {
  id: string
  title: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export function useShoppingListDetail(listId: string) {
  const [list, setList] = useState<ShoppingListDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listId) return

    async function fetchList() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('id', listId)
          .single()

        if (error) throw error
        setList(data)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch list'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [listId])

  return { list, loading, error }
}
