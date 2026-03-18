'use client'

import { CREATE_USER } from '@/lib/graphql/mutations'
import { GET_USERS } from '@/lib/graphql/queries'
import { USER_ADDED } from '@/lib/graphql/subscriptions'
import { useMutation, useSubscription } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateUserPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createUser] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: data => {
      // Redirect to the user's lists page
      router.push(`/user/${data.createUser.id}/lists`)
    },
    onError: error => {
      console.error('Error creating user:', error)
      setIsSubmitting(false)
    },
  })

  // Subscribe to user additions for real-time updates
  useSubscription(USER_ADDED)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setIsSubmitting(true)
    try {
      await createUser({
        variables: {
          name: name.trim(),
          email: email.trim(),
        },
      })
    } catch (error) {
      console.error('Submission error:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-primary-600 hover:underline mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-600 mt-2">
              Create an account to start managing your shopping lists
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input"
                  placeholder="Enter your full name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="username email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your email address"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim()}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your account will be created instantly</li>
                <li>• You'll be taken to your personal dashboard</li>
                <li>• You can start creating shopping lists right away</li>
                <li>• Share lists with others for collaborative shopping</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
