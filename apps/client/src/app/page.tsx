'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const {
    user,
    isLoading,
    updateLastOpenedList,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [redirectAttempted, setRedirectAttempted] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: router function changes reference on every render, causes infinite loops
  useEffect(() => {
    if (user && !isLoading && !redirectAttempted) {
      // Check if we're returning from an error (URL has error parameter)
      const urlParams = new URLSearchParams(window.location.search)
      const hasListError = urlParams.get('listError') === 'true'

      // Clear invalid last opened list ID if there was an error
      if (hasListError) {
        updateLastOpenedList(null)
        setRedirectAttempted(true)
        router.push(`/user/${user.id}/lists`)
        return
      }

      // Always redirect to the lists page after login
      setRedirectAttempted(true)
      router.push(`/user/${user.id}/lists`)
    }
  }, [user, isLoading, redirectAttempted])

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!email.trim()) return
    if (!password.trim()) return
    if (authMode === 'signup' && !name.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      let success = false

      if (authMode === 'signin') {
        const result = await signInWithEmail(email.trim(), password)
        success = result.success
        if (!success) {
          setError(result.error || 'Sign in failed. Please try again.')
        }
      } else if (authMode === 'signup') {
        const result = await signUpWithEmail(
          email.trim(),
          password,
          name.trim()
        )
        success = result.success
        if (!success) {
          setError(result.error || 'Account creation failed. Please try again.')
        } else {
          setError(
            '✅ Account created! Please check your email to verify your account.'
          )
        }
      }

      // If successful, the useEffect above will handle the redirect
    } catch (_err: unknown) {
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
          {/* Authentication Mode Selector */}
          <div className="mb-6">
            <div className="flex space-x-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin')
                  setError('')
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  authMode === 'signin'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup')
                  setError('')
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  authMode === 'signup'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Mode descriptions */}
            <p className="text-sm text-muted-foreground mt-2">
              {authMode === 'signin' &&
                '🔐 Sign in with your existing email and password'}
              {authMode === 'signup' &&
                '✨ Create a new account with email and password'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Name field for signup */}
            {authMode === 'signup' && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-card-foreground mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input text-foreground"
                  placeholder="Enter your full name"
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}

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

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete={
                  authMode === 'signup' ? 'new-password' : 'current-password'
                }
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input text-foreground"
                placeholder="Enter your password"
                required
                disabled={isSubmitting}
                minLength={6}
              />
              {authMode === 'signup' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 6 characters long
                </p>
              )}
            </div>

            {error && (
              <div
                className={`border rounded-md p-3 ${
                  error.startsWith('✅')
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !email.trim() ||
                !password.trim() ||
                (authMode === 'signup' && !name.trim())
              }
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {authMode === 'signin' && 'Signing In...'}
                  {authMode === 'signup' && 'Creating Account...'}
                </div>
              ) : (
                <>
                  {authMode === 'signin' && '🔐 Sign In'}
                  {authMode === 'signup' && '✨ Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Sign in help */}
          {authMode === 'signin' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Invalid credentials?</strong> If you don't have an
                account yet, try "Sign Up" to create one.
              </p>
            </div>
          )}

          {/* Sign up help */}
          {authMode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Rate limit issues?</strong> Supabase limits account
                creation emails. If you hit the limit, wait ~1 hour or try a
                different email address.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {authMode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin')
                      setError('')
                    }}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in here
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup')
                      setError('')
                    }}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Create one here
                  </button>
                </>
              )}
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
