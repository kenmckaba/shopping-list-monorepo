import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

// Load Apollo Client development messages in development mode
if (process.env.NODE_ENV === 'development') {
  loadDevMessages()
  loadErrorMessages()
}

// GraphQL endpoint URLs - supports both local and Supabase
function getGraphQLUrl() {
  // Use local server in development mode
  if (process.env.NEXT_PUBLIC_USE_LOCAL_SERVER === 'true') {
    return (
      process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'
    )
  }

  // Use Supabase for production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }
  return `${supabaseUrl}/graphql/v1`
}

function getWSUrl() {
  // Use local server in development mode
  if (process.env.NEXT_PUBLIC_USE_LOCAL_SERVER === 'true') {
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql'
  }

  // Use Supabase for production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }
  return `${supabaseUrl.replace('https://', 'wss://')}/graphql/v1`
}

// Create HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: getGraphQLUrl(),
  fetchOptions: {
    timeout: 10000, // 10 second timeout for mobile networks
  },
})

// Create WebSocket link for subscriptions
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: getWSUrl(),
          connectionParams: () => {
            const token = localStorage.getItem('authToken')

            // Local server - minimal auth
            if (process.env.NEXT_PUBLIC_USE_LOCAL_SERVER === 'true') {
              return {
                ...(token && { Authorization: `Bearer ${token}` }),
              }
            }

            // Supabase - requires API key
            const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            return {
              headers: {
                apikey: apiKey,
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          },
        })
      )
    : null

// Create auth link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken')

  // Local server - minimal auth
  if (process.env.NEXT_PUBLIC_USE_LOCAL_SERVER === 'true') {
    return {
      headers: {
        ...headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  }

  // Supabase - requires API key
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return {
    headers: {
      ...headers,
      apikey: apiKey,
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }
})

// Split link: send subscriptions to WebSocket, queries/mutations to HTTP
const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      authLink.concat(httpLink)
    )
  : authLink.concat(httpLink)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          usersCollection: {
            merge: false, // Replace instead of merge for Supabase
          },
          shopping_listsCollection: {
            merge: false,
          },
          list_itemsCollection: {
            merge: false,
          },
          itemsCollection: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network', // Better for real-time apps
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first', // Use cache when network is slow
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})
