'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { CREATE_LIST } from '@/lib/graphql/mutations'
import { GET_USER_ACCESSIBLE_LISTS } from '@/lib/graphql/queries'
import { LIST_ADDED } from '@/lib/graphql/subscriptions'
import { useMutation, useSubscription } from '@apollo/client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function CreateListPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // All hooks must be called before any conditional logic
  const [createList] = useMutation(CREATE_LIST, {
    refetchQueries: [
      { query: GET_USER_ACCESSIBLE_LISTS, variables: { userId } },
    ],
    onCompleted: data => {
      router.push(`/list/${data.createList.id}`)
    },
    onError: error => {
      console.error('Error creating list:', error)
      setIsSubmitting(false)
    },
  })

  // Subscribe to list additions for real-time updates
  useSubscription(LIST_ADDED)

  // Redirect if trying to access another user's create page (after all hooks)
  if (user && user.id !== userId) {
    router.push(`/user/${user.id}/create-list`)
    return null
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await createList({
        variables: {
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic,
          ownerId: userId, // Pass the userId as ownerId
        },
      })
    } catch (error) {
      console.error('Submission error:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                Create Shopping List
              </h1>
              <p className="mt-2 text-muted-foreground">
                Create a new shopping list to organize your items
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  List Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  autoComplete="off"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Weekly Groceries"
                  className="input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  autoComplete="off"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this shopping list..."
                  className="input"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isPublic"
                      name="isPublic"
                      type="checkbox"
                      checked={isPublic}
                      onChange={e => setIsPublic(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="isPublic"
                      className="font-medium text-foreground"
                    >
                      Make this list public
                    </label>
                    <p className="text-muted-foreground">
                      Public lists can be discovered and viewed by others
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Link
                  href={`/user/${userId}/lists`}
                  className="flex-1 btn btn-secondary text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="flex-1 btn btn-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </div>
                  ) : (
                    'Create List'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h3 className="text-sm font-medium text-primary mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-primary/80 space-y-1">
                <li>• Your list will be created instantly</li>
                <li>
                  • You'll be taken to your new list to start adding items
                </li>
                <li>
                  • You can share it with others for collaborative shopping
                </li>
                <li>• Track your progress as you complete items</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
