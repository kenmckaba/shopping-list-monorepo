'use client'

import { gql, useMutation } from '@apollo/client'
import type React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface User {
  id: string
  name: string
  email: string
  last_opened_list_id?: string | null
  created_at?: string
}

// Local storage user includes password
interface LocalStorageUser extends User {
  password: string
}

interface LocalAuthContextType {
  user: User | null
  isLoading: boolean
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  signOut: () => Promise<void>
  updateLastOpenedList: (listId: string | null) => void
  getLastOpenedListId: () => string | null
}

// GraphQL mutation for creating user in local database
const CREATE_USER_LOCAL = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`

const LocalAuthContext = createContext<LocalAuthContextType | undefined>(
  undefined
)

// Mock local authentication - no email confirmation needed!
export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Apollo mutation for creating user in database
  const [createUserMutation] = useMutation(CREATE_USER_LOCAL)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('localAuthUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('localAuthUser')
      }
    }
    setIsLoading(false)
  }, [])

  // Sign up - creates account instantly without email confirmation
  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true)

        // Check if user already exists in localStorage
        const existingUsers: LocalStorageUser[] = JSON.parse(
          localStorage.getItem('localAuthUsers') || '[]'
        )
        const existingUser = existingUsers.find(
          (u: LocalStorageUser) => u.email === email
        )

        if (existingUser) {
          return {
            success: false,
            error: 'Account already exists. Try "Sign In" instead.',
          }
        }

        // Create new user locally
        const localUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          email,
          created_at: new Date().toISOString(),
        }

        // Save to localStorage first for immediate login
        const updatedUsers = [...existingUsers, { ...localUser, password }]
        localStorage.setItem('localAuthUsers', JSON.stringify(updatedUsers))
        localStorage.setItem('localAuthUser', JSON.stringify(localUser))

        setUser(localUser)

        // Also create user in local database
        try {
          await createUserMutation({
            variables: {
              name,
              email,
            },
          })
        } catch (_dbError) {
          // User still exists in localStorage, so auth works even if DB sync fails
        }
        return { success: true }
      } catch (error: unknown) {
        console.error('Local signup error:', error)
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        }
      } finally {
        setIsLoading(false)
      }
    },
    [createUserMutation]
  )

  // Sign in - checks against localStorage
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true)

        // Check credentials in localStorage
        const existingUsers: LocalStorageUser[] = JSON.parse(
          localStorage.getItem('localAuthUsers') || '[]'
        )
        const user = existingUsers.find(
          (u: LocalStorageUser) => u.email === email && u.password === password
        )

        if (!user) {
          return {
            success: false,
            error:
              'Invalid email or password. If you don\'t have an account yet, try "Sign Up" to create one.',
          }
        }

        // Remove password from user object for security
        const { password: _, ...userWithoutPassword } = user
        localStorage.setItem(
          'localAuthUser',
          JSON.stringify(userWithoutPassword)
        )
        setUser(userWithoutPassword)

        return { success: true }
      } catch (error: unknown) {
        console.error('Local signin error:', error)
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Logout
  const logout = useCallback(async () => {
    localStorage.removeItem('localAuthUser')
    localStorage.removeItem('lastOpenedListId')
    setUser(null)
  }, [])

  const signOut = useCallback(async () => {
    await logout()
  }, [logout])

  // Update last opened list
  const updateLastOpenedList = useCallback((listId: string | null) => {
    if (listId) {
      localStorage.setItem('lastOpenedListId', listId)
    } else {
      localStorage.removeItem('lastOpenedListId')
    }

    setUser(prevUser => {
      if (prevUser && prevUser.last_opened_list_id !== listId) {
        const updatedUser = { ...prevUser, last_opened_list_id: listId }
        localStorage.setItem('localAuthUser', JSON.stringify(updatedUser))
        return updatedUser
      }
      return prevUser
    })
  }, [])

  const getLastOpenedListId = useCallback(() => {
    // First check localStorage for immediate access
    const stored = localStorage.getItem('lastOpenedListId')
    if (stored) {
      return stored
    }

    // Fallback to user's stored preference
    return user?.last_opened_list_id || null
  }, [user?.last_opened_list_id])

  const value = {
    user,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    logout,
    signOut,
    updateLastOpenedList,
    getLastOpenedListId,
  }

  return (
    <LocalAuthContext.Provider value={value}>
      {children}
    </LocalAuthContext.Provider>
  )
}

export function useLocalAuth() {
  const context = useContext(LocalAuthContext)
  if (context === undefined) {
    throw new Error('useLocalAuth must be used within a LocalAuthProvider')
  }
  return context
}
