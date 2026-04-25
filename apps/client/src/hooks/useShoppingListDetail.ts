'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
