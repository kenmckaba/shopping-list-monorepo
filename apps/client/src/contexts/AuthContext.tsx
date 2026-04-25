'use client'

import { createClient } from '@supabase/supabase-js'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { LocalAuthProvider, useLocalAuth } from './LocalAuthContext'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface User {
  id: string
  name: string
  email: string
  last_opened_list_id?: string | null
  created_at?: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  logout: () => Promise<void>
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateLastOpenedList: (listId: string | null) => void
  getLastOpenedListId: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch or create user profile in our users table
  const syncUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // First, try to get existing user
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .single()

      if (existingUser) {
        setUser(existingUser)
      } else {
        // Create new user profile
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name:
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split('@')[0] ||
              'User',
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating user profile:', error)
        } else {
          setUser(newUser)
        }
      }
    } catch (error) {
      console.error('Error syncing user profile:', error)
    }
  }, [])

  // Sign in with email and password
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error('Sign in error:', error)

          // Provide more specific error messages
          if (error.message.includes('Invalid login credentials')) {
            return {
              success: false,
              error:
                'Invalid email or password. If you don\'t have an account yet, try "Sign Up" to create one.',
            }
          }

          if (
            error.message.includes('email rate limit exceeded') ||
            error.message.includes('rate limit')
          ) {
            return {
              success: false,
              error:
                '🚫 Email rate limit exceeded. Please wait about 1 hour before trying again, or try a different email address.',
            }
          }

          return { success: false, error: error.message }
        }

        if (data.user) {
          setSupabaseUser(data.user)
          await syncUserProfile(data.user)
          return { success: true }
        }
        return { success: false, error: 'Authentication failed' }
      } catch (error: unknown) {
        console.error('Sign in error:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
        return {
          success: false,
          error: errorMessage,
        }
      } finally {
        setIsLoading(false)
      }
    },
    [syncUserProfile]
  )

  // Sign up with email and password
  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            // Disable email confirmation for development
            emailRedirectTo: undefined,
          },
        })

        if (error) {
          console.error('Sign up error:', error)

          // Provide more specific error messages
          if (error.message.includes('User already registered')) {
            return {
              success: false,
              error: 'Account already exists. Try "Sign In" instead.',
            }
          }

          if (
            error.message.includes('email rate limit exceeded') ||
            error.message.includes('rate limit')
          ) {
            // In development mode, provide immediate workarounds
            const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

            if (isDev) {
              const randomNum = Math.floor(Math.random() * 1000)
              return {
                success: false,
                error: `🚫 Rate limit hit! Quick fixes:

1️⃣ Try: test${randomNum}@example.com
2️⃣ Disable "Email Confirmation" in Supabase dashboard
3️⃣ Wait ~1 hour for reset`,
              }
            }

            return {
              success: false,
              error:
                '🚫 Email rate limit exceeded. Please wait about 1 hour before trying to create an account with this email, or try a different email address.',
            }
          }

          return { success: false, error: error.message }
        }

        if (data.user) {
          return { success: true }
        }
        return { success: false, error: 'Account creation failed' }
      } catch (error: unknown) {
        console.error('Sign up error:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
        return {
          success: false,
          error: errorMessage,
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      setUser(null)
      setSupabaseUser(null)
      localStorage.removeItem('lastOpenedListId')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Simple logout method
  const logout = useCallback(async () => {
    await signOut()
  }, [signOut])

  // Update last opened list
  const updateLastOpenedList = useCallback((listId: string | null) => {
    if (listId) {
      localStorage.setItem('lastOpenedList', listId)
    } else {
      localStorage.removeItem('lastOpenedList')
    }

    setUser(prevUser => {
      if (prevUser && prevUser.last_opened_list_id !== listId) {
        return { ...prevUser, last_opened_list_id: listId }
      }
      return prevUser
    })
  }, [])

  // Get last opened list ID
  const getLastOpenedListId = useCallback((): string | null => {
    const localStorageValue = localStorage.getItem('lastOpenedList')
    if (localStorageValue) {
      return localStorageValue
    }
    return user?.last_opened_list_id || null
  }, [user?.last_opened_list_id])

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      setIsLoading(true)

      if (session?.user) {
        setSupabaseUser(session.user)
        await syncUserProfile(session.user)
      } else {
        setUser(null)
        setSupabaseUser(null)
      }

      setIsLoading(false)
    })

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      if (session?.user) {
        setSupabaseUser(session.user)
        syncUserProfile(session.user)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [syncUserProfile])

  const value = useMemo(
    () => ({
      user,
      supabaseUser,
      isLoading,
      logout,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updateLastOpenedList,
      getLastOpenedListId,
    }),
    [
      user,
      supabaseUser,
      isLoading,
      logout,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updateLastOpenedList,
      getLastOpenedListId,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Smart wrapper that chooses between local and Supabase auth
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Check environment variable - ensure it's properly loaded
  const useLocalServer = process.env.NEXT_PUBLIC_USE_LOCAL_SERVER === 'true'

  console.log(
    'AuthProvider - NEXT_PUBLIC_USE_LOCAL_SERVER:',
    process.env.NEXT_PUBLIC_USE_LOCAL_SERVER
  )
  console.log('AuthProvider - useLocalServer:', useLocalServer)

  // Use local auth only when explicitly set to true
  if (useLocalServer) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>
  }

  // Default to Supabase auth
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
}

// Hook that works with both local and Supabase auth
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
