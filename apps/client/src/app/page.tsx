'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const { user, login, isLoading, getLastOpenedListId } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // biome-ignore lint/correctness/useExhaustiveDependencies: router function changes reference on every render, causes infinite loops
  useEffect(() => {
    if (user && !isLoading) {
      // If user is logged in, redirect to their last opened list or lists page
      const lastListId = getLastOpenedListId()
      if (lastListId) {
        router.push(`/list/${lastListId}`)
      } else {
        router.push(`/user/${user.id}/lists`)
      }
    }
  }, [user, isLoading]) // Remove function dependencies to prevent infinite loops

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const success = await login(email.trim())
      if (!success) {
        setError(
          'User not found. Please check your email or create an account.'
        )
      }
      // If successful, the useEffect above will handle the redirect
    } catch (err) {
      console.log('Login error:', err)
      setError('An error occurred during login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )
  }

  if (user) {
    // This should not be reached due to the useEffect redirect above
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Shopping List App
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to manage your shopping lists
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-md border p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="username email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input text-foreground"
                placeholder="Enter your email address"
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/create-user"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-muted border border-border rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Features
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create and manage multiple shopping lists</li>
              <li>• Access your lists from any device</li>
              <li>• View public lists shared by others</li>
              <li>• Real-time updates and collaboration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
