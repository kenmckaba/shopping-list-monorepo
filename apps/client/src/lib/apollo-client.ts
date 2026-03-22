import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

// Load Apollo Client development messages in development mode
if (process.env.NODE_ENV === 'development') {
  loadDevMessages()
  loadErrorMessages()
}

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
  // Add timeout and better error handling for mobile network connectivity
  fetchOptions: {
    timeout: 10000, // 10 second timeout
  },
  fetch: (uri, options) => {
    // Add a timeout wrapper for better mobile network handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    return fetch(uri, {
      ...options,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))
  },
})

const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql',
          connectionParams: {
            // Add connection timeout
          },
          retryAttempts: 3,
          shouldRetry: () => true,
          connectionAckWaitTimeout: 5000, // 5 second timeout for connection ack
          // Add error handling for WebSocket connections
          on: {
            error: error => {
              console.warn('WebSocket connection error:', error)
            },
            closed: () => {
              console.warn('WebSocket connection closed')
            },
          },
        })
      )
    : null

// Use split link to route queries/mutations to HTTP and subscriptions to WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink || httpLink, // Fallback to HTTP link if WebSocket not available (SSR)
  httpLink
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getListItems: {
            merge: false, // Always replace cached data, don't merge
          },
        },
      },
      User: {
        fields: {
          ownedLists: {
            merge: false,
          },
          sharedLists: {
            merge: false,
          },
        },
      },
      ShoppingList: {
        fields: {
          items: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'ignore',
      fetchPolicy: 'cache-and-network', // Better for mobile connectivity
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
