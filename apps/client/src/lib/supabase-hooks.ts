import { useEffect, useState } from 'react'
import { type Database, supabase } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
type ListItem = Database['public']['Tables']['list_items']['Row']

// User hooks
export function useUser(email: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!email) {
      setUser(null)
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error) throw error
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [email])

  return { user, loading, error }
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = async (name: string, email: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return { createUser, loading, error }
}

// Shopping List hooks
export function useUserLists(userId: string) {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLists([])
      setLoading(false)
      return
    }

    const fetchLists = async () => {
      try {
        const { data, error } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('owner_id', userId)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setLists(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lists')
      } finally {
        setLoading(false)
      }
    }

    fetchLists()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('shopping_lists')
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

  return { lists, loading, error }
}

export function useCreateList() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createList = async (title: string, ownerId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([{ title, owner_id: ownerId }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to create list'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return { createList, loading, error }
}

// List Items hooks
export function useListItems(listId: string) {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listId) {
      setItems([])
      setLoading(false)
      return
    }

    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('list_items')
          .select('*')
          .eq('shopping_list_id', listId)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setItems(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch items')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('list_items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `shopping_list_id=eq.${listId}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [payload.new as ListItem, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev =>
              prev.map(item =>
                item.id === payload.new.id ? (payload.new as ListItem) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId])

  return { items, loading, error }
}

export function useItemMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addItem = async (
    name: string,
    quantity: number,
    shoppingListId: string,
    createdBy: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('list_items')
        .insert([
          {
            name,
            quantity,
            shopping_list_id: shoppingListId,
            created_by: createdBy,
            is_completed: false,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add item'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (id: string, updates: Partial<ListItem>) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('list_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to update item'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from('list_items').delete().eq('id', id)

      if (error) throw error
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to remove item'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return { addItem, updateItem, removeItem, loading, error }
}
