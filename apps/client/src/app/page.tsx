'use client'

import { GET_USERS } from '@/lib/graphql/queries'
import { useQuery } from '@apollo/client'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
}

export default function Home() {
  const { loading, error, data } = useQuery<{ getUsers: User[] }>(GET_USERS)

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600" />
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">Failed to load data: {error.message}</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure your GraphQL server is running on http://localhost:4000
          </p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping List App</h1>
          <p className="text-xl text-gray-600">Manage your shopping lists efficiently</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Users</h2>
            {data?.getUsers && data.getUsers.length > 0 ? (
              <ul className="space-y-3">
                {data.getUsers.map(user => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Link href={`/user/${user.id}/lists`} className="btn btn-primary text-sm">
                      View Lists
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Run the seed script on your server to add sample data
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link href="/create-user" className="btn btn-primary">
              Create New User
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
