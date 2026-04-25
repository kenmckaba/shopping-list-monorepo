'use client'

import { useCreateUser, useUser } from '@/lib/supabase-hooks'
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

type User = {
  id: string
  name: string
  email: string
  lastOpenedListId: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string) => Promise<User>
  createUser: (name: string, email: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Get user data when email is set
  const { user: userData, loading: userLoading } = useUser(currentEmail)
  const { createUser: createUserMutation } = useCreateUser()

  // Load email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail')
    if (savedEmail) {
      setCurrentEmail(savedEmail)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Update current user when userData changes
  useEffect(() => {
    if (userData) {
      setCurrentUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        lastOpenedListId: userData.last_opened_list_id,
      })
    }
    setIsLoading(userLoading)
  }, [userData, userLoading])

  const login = async (email: string): Promise<User> => {
    setIsLoading(true)

    try {
      // Set email to trigger user fetch
      setCurrentEmail(email)
      localStorage.setItem('userEmail', email)

      // Wait a bit for the user query to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Login timeout'))
        }, 10000)

        const checkUser = () => {
          if (userData && !userLoading) {
            clearTimeout(timeout)
            resolve({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              lastOpenedListId: userData.last_opened_list_id,
            })
          } else if (!userLoading && !userData) {
            clearTimeout(timeout)
            reject(new Error('User not found'))
          } else {
            setTimeout(checkUser, 100)
          }
        }
        checkUser()
      })
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const createUser = async (name: string, email: string): Promise<User> => {
    setIsLoading(true)

    try {
      const newUser = await createUserMutation(name, email)

      // Set as current user and save email
      setCurrentEmail(email)
      localStorage.setItem('userEmail', email)

      const user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        lastOpenedListId: newUser.last_opened_list_id,
      }

      setCurrentUser(user)
      setIsLoading(false)

      return user
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setCurrentEmail('')
    localStorage.removeItem('userEmail')
    setIsLoading(false)
  }

  const value: AuthContextType = {
    user: currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    createUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
