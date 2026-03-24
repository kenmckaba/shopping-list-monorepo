'use client'

import { GET_USER_BY_EMAIL } from '@/lib/graphql/queries'
import { useLazyQuery } from '@apollo/client'
import type React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface User {
  id: string
  name: string
  email: string
  lastOpenedListId?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string) => Promise<boolean>
  logout: () => void
  updateLastOpenedList: (listId: string) => void
  getLastOpenedListId: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [getUserByEmail, { data, loading, error }] =
    useLazyQuery(GET_USER_BY_EMAIL)

  // Handle query results with useEffect instead of onCompleted
  useEffect(() => {
    if (data?.getUserByEmail) {
      setUser(data.getUserByEmail)
      localStorage.setItem('user', JSON.stringify(data.getUserByEmail))
      localStorage.setItem('userEmail', data.getUserByEmail.email)
    }
  }, [data])

  // Handle query errors with useEffect instead of onError
  useEffect(() => {
    if (error) {
      console.error('Error fetching user:', error)
    }
  }, [error])

  // Update loading state based on query loading state
  useEffect(() => {
    if (!loading) {
      setIsLoading(false)
    }
  }, [loading])

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedEmail = localStorage.getItem('userEmail')

    if (storedUser && storedEmail) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsLoading(false)

        // Don't auto-refetch on mount - only refetch when explicitly logging in
        // This prevents the infinite loop from getUserByEmail triggering onCompleted
        // getUserByEmail({ variables: { email: storedEmail } })
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('userEmail')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, []) // Remove function dependencies to prevent infinite loops

  const login = useCallback(
    async (email: string): Promise<boolean> => {
      setIsLoading(true)

      try {
        // Use the query promise directly without Promise.race timeout
        // to avoid interfering with React 19 Suspense mechanisms
        const result = await getUserByEmail({ variables: { email } })
        const userData = result?.data?.getUserByEmail
        if (userData) {
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('userEmail', userData.email)
          setIsLoading(false)
          return true
        }
        setIsLoading(false)
        return false
      } catch (error) {
        console.error('Login error:', error)
        // Don't catch Suspense exceptions - rethrow them
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          error.name === 'Suspense'
        ) {
          throw error
        }
        setIsLoading(false)
        return false
      }
    },
    [getUserByEmail]
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('lastOpenedList')
  }, [])

  const updateLastOpenedList = useCallback((listId: string) => {
    setUser(prevUser => {
      if (prevUser && prevUser.lastOpenedListId !== listId) {
        const updatedUser = { ...prevUser, lastOpenedListId: listId }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        localStorage.setItem('lastOpenedList', listId)
        return updatedUser
      }
      return prevUser
    })
  }, []) // No dependencies needed - uses function form of setUser

  const getLastOpenedListId = useCallback((): string | null => {
    // Prioritize user's stored lastOpenedListId, fall back to localStorage
    return user?.lastOpenedListId || localStorage.getItem('lastOpenedList')
  }, [user?.lastOpenedListId]) // Remove user dependency - function already accesses current user value

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      updateLastOpenedList,
      getLastOpenedListId,
    }),
    [user, isLoading, login, logout, updateLastOpenedList, getLastOpenedListId]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
