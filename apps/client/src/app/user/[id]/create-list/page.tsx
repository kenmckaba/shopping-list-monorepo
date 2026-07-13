'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function CreateListPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { user } = useAuth()

  const ownerId = user?.id || userId

  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          title: trimmedTitle,
          owner_id: ownerId,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      if (!data?.id) {
        throw new Error('Create list completed but list ID was missing')
      }

      router.push(`/list/${data.id}`)
    } catch (error: unknown) {
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

              <div className="flex space-x-4">
                <Link
                  href={`/user/${ownerId}/lists`}
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
