'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './apollo-client'

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  )
}
