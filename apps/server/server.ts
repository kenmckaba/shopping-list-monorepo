import { EventEmitter } from 'node:events'
import http from 'node:http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
// import { createClient } from "@libsql/client";
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { gql } from 'graphql-tag'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'

// Initialize Prisma Client with libSQL adapter
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

interface User {
  id: string
  name: string
  email: string
}

// Interfaces removed - using Prisma generated types instead

interface CreateUserArgs {
  name: string
  email: string
}

interface CreateListArgs {
  title: string
  description?: string
  isPublic?: boolean
}

interface CreateItemArgs {
  name: string
  category?: string
}

interface AddItemToListArgs {
  listId: string
  itemName: string
  quantity?: number
  notes?: string
}

interface GetUserByIdArgs {
  id: string
}

// Create simple event emitter for subscriptions
const eventEmitter = new EventEmitter()

// Simple async iterator implementation
const createAsyncIterator = (eventName: string) => {
  return {
    [Symbol.asyncIterator]: () => {
      const listeners: Array<(value: unknown) => void> = []
      let listening = true

      const listener = (data: unknown) => {
        if (listening) {
          for (const resolve of listeners) {
            resolve({ value: data })
          }
          listeners.length = 0
        }
      }

      eventEmitter.on(eventName, listener)

      return {
        next: () =>
          new Promise(resolve => {
            if (listening) {
              listeners.push(resolve)
            } else {
              resolve({ done: true, value: undefined })
            }
          }),
        return: () => {
          listening = false
          eventEmitter.removeListener(eventName, listener)
          return Promise.resolve({ done: true, value: undefined })
        },
      }
    },
  }
}

const typeDefs = gql`
    type Query {
      getUsers: [User]
      getUserById(id: ID!): User
      getUserByEmail(email: String!): User
      getUserLists(userId: ID!): [ShoppingList]
      getUserAccessibleLists(userId: ID!): [ShoppingList]
      getShoppingListById(id: ID!): ShoppingList
      getListItems(listId: ID!): [ListItemWithDetails]
      searchItems(query: String!): [Item]
    }

    type Mutation {
      createUser(name: String!, email: String!): User
      updateUser(id: ID!, name: String, email: String): User
      deleteUser(id: ID!): Boolean
      loginUser(email: String!): User
      updateLastOpenedList(userId: ID!, listId: ID!): User

      createList(title: String!, description: String, isPublic: Boolean, ownerId: ID!): ShoppingList
      updateList(id: ID!, title: String, description: String, isPublic: Boolean): ShoppingList
      deleteList(id: ID!): Boolean
      shareList(listId: ID!, userId: ID!, permission: String!): Boolean

      createItem(name: String!, category: String): Item
      addItemToList(listId: ID!, itemName: String!, quantity: Int, notes: String): ListItemWithDetails
      updateListItem(id: ID!, quantity: Int, isCompleted: Boolean, notes: String): ListItemWithDetails
      removeItemFromList(id: ID!): Boolean
    }

    type Subscription {
      userAdded: User
      userUpdated: User
      userDeleted: String

      listAdded: ShoppingList
      listUpdated: ShoppingList
      listDeleted: String

      itemAddedToList: ListItemWithDetails
      itemUpdated: ListItemWithDetails
      itemRemoved: String
    }

    type User {
      id: ID!
      name: String!
      email: String!
      lastOpenedListId: String
      ownedLists: [ShoppingList]
      sharedLists: [ListShare]
      createdAt: String
    }

    type ShoppingList {
      id: ID!
      title: String!
      description: String
      isPublic: Boolean!
      owner: User!
      items: [ListItemWithDetails]
      sharedWith: [ListShare]
      createdAt: String
      updatedAt: String
    }

    type Item {
      id: ID!
      name: String!
      category: String
      createdBy: User!
      createdAt: String
    }

    type ListItem {
      id: ID!
      quantity: Int!
      isCompleted: Boolean!
      notes: String
      addedAt: String
      updatedAt: String
    }

    type ListItemWithDetails {
      id: ID!
      quantity: Int!
      isCompleted: Boolean!
      notes: String
      addedAt: String
      updatedAt: String
      item: Item!
      list: ShoppingList!
    }

    type ListShare {
      id: ID!
      permission: String!
      user: User!
      list: ShoppingList!
      sharedAt: String
    }
`

const resolvers = {
  Query: {
    getUsers: async (): Promise<User[]> => {
      return await prisma.user.findMany()
    },
    getUserById: async (
      _parent: unknown,
      args: GetUserByIdArgs
    ): Promise<User | null> => {
      return await prisma.user.findUnique({
        where: { id: args.id },
        include: {
          ownedLists: true,
          sharedLists: {
            include: {
              list: true,
            },
          },
        },
      })
    },
    getUserByEmail: async (
      _parent: unknown,
      args: { email: string }
    ): Promise<User | null> => {
      return await prisma.user.findUnique({
        where: { email: args.email },
        include: {
          ownedLists: true,
          sharedLists: {
            include: {
              list: true,
            },
          },
        },
      })
    },
    getUserLists: async (_parent: unknown, args: { userId: string }) => {
      const ownedLists = await prisma.shoppingList.findMany({
        where: { ownerId: args.userId },
        include: {
          owner: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      const sharedLists = await prisma.listShare.findMany({
        where: { userId: args.userId },
        include: {
          list: {
            include: {
              owner: true,
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
        },
      })

      return [
        ...(ownedLists || []),
        ...(sharedLists || []).map((share: { list: unknown }) => share.list),
      ]
    },
    getUserAccessibleLists: async (
      _parent: unknown,
      args: { userId: string }
    ) => {
      const ownedLists = await prisma.shoppingList.findMany({
        where: { ownerId: args.userId },
        include: {
          owner: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      const sharedPublicLists = await prisma.shoppingList.findMany({
        where: {
          isPublic: true,
          NOT: { ownerId: args.userId },
        },
        include: {
          owner: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      const sharedPrivateLists = await prisma.listShare.findMany({
        where: { userId: args.userId },
        include: {
          list: {
            include: {
              owner: true,
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
        },
      })

      return [
        ...(ownedLists || []),
        ...(sharedPublicLists || []),
        ...(sharedPrivateLists || []).map(
          (share: { list: unknown }) => share.list
        ),
      ]
    },

    getShoppingListById: async (_parent: unknown, args: { id: string }) => {
      const list = await prisma.shoppingList.findUnique({
        where: { id: args.id },
        include: {
          owner: true,
        },
      })

      if (!list) {
        throw new Error(`Shopping list with ID ${args.id} not found`)
      }

      return list
    },

    getListItems: async (_parent: unknown, args: { listId: string }) => {
      // Get list items with full details
      const items = await prisma.listItem.findMany({
        where: { listId: args.listId },
        include: {
          item: {
            include: {
              createdBy: true,
            },
          },
          list: {
            include: {
              owner: true,
            },
          },
        },
        orderBy: {
          addedAt: 'desc',
        },
      })

      // If no items exist, create a dummy entry with just the list info
      if (items.length === 0) {
        const list = await prisma.shoppingList.findUnique({
          where: { id: args.listId },
          include: {
            owner: true,
          },
        })

        if (!list) {
          throw new Error(`Shopping list with ID ${args.listId} not found`)
        }

        // Return an empty array - the client will handle this case
        return []
      }

      return items
    },
    searchItems: async (_parent: unknown, args: { query: string }) => {
      return await prisma.item.findMany({
        where: {
          name: {
            contains: args.query,
          },
        },
        include: {
          createdBy: true,
        },
      })
    },
  },
  Mutation: {
    createUser: async (
      _parent: unknown,
      args: CreateUserArgs
    ): Promise<User> => {
      const { name, email } = args

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        console.log(
          `User with email "${email}" already exists, returning existing user:`,
          existingUser
        )
        // Instead of throwing an error, return the existing user (automatic login)
        // This provides a better user experience - if they forgot they had an account, we just log them in
        return existingUser
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
        },
      })

      console.log('Created new user:', newUser)
      eventEmitter.emit('USER_ADDED', { userAdded: newUser })
      return newUser
    },
    updateUser: async (
      _parent: unknown,
      args: { id: string; name?: string; email?: string }
    ): Promise<User | null> => {
      try {
        const updateData: {
          name?: string
          email?: string
        } = {}

        if (args.name !== undefined) updateData.name = args.name
        if (args.email !== undefined) updateData.email = args.email

        const updatedUser = await prisma.user.update({
          where: { id: args.id },
          data: updateData,
        })

        eventEmitter.emit('USER_UPDATED', { userUpdated: updatedUser })
        return updatedUser
      } catch (error) {
        console.error('Error updating user:', error)
        return null
      }
    },
    deleteUser: async (
      _parent: unknown,
      args: { id: string }
    ): Promise<boolean> => {
      try {
        await prisma.user.delete({
          where: { id: args.id },
        })

        eventEmitter.emit('USER_DELETED', { userDeleted: args.id })
        return true
      } catch (error) {
        console.error('Error deleting user:', error)
        throw new Error(
          `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    },

    loginUser: async (
      _parent: unknown,
      args: { email: string }
    ): Promise<User | null> => {
      return await prisma.user.findUnique({
        where: { email: args.email },
        include: {
          ownedLists: true,
          sharedLists: {
            include: {
              list: true,
            },
          },
        },
      })
    },

    updateLastOpenedList: async (
      _parent: unknown,
      args: { userId: string; listId: string }
    ): Promise<User | null> => {
      return await prisma.user.update({
        where: { id: args.userId },
        data: { lastOpenedListId: args.listId },
      })
    },

    createList: async (
      _parent: unknown,
      args: CreateListArgs & { ownerId: string }
    ) => {
      // Verify the user exists before creating the list
      const userExists = await prisma.user.findUnique({
        where: { id: args.ownerId },
      })

      if (!userExists) {
        throw new Error(`User with ID ${args.ownerId} not found`)
      }

      const newList = await prisma.shoppingList.create({
        data: {
          title: args.title,
          description: args.description || null,
          isPublic: args.isPublic || false,
          ownerId: args.ownerId,
        },
        include: {
          owner: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      eventEmitter.emit('LIST_ADDED', { listAdded: newList })
      return newList
    },

    createItem: async (
      _parent: unknown,
      args: CreateItemArgs & { createdById: string }
    ) => {
      // Check if item already exists
      const existingItem = await prisma.item.findUnique({
        where: { name: args.name },
      })

      if (existingItem) {
        return existingItem
      }

      return await prisma.item.create({
        data: {
          name: args.name,
          category: args.category || null,
          createdById: args.createdById, // This should come from auth context
        },
        include: {
          createdBy: true,
        },
      })
    },

    addItemToList: async (_parent: unknown, args: AddItemToListArgs) => {
      // Verify the list exists
      const listExists = await prisma.shoppingList.findUnique({
        where: { id: args.listId },
      })

      if (!listExists) {
        throw new Error(`Shopping list with ID ${args.listId} not found`)
      }

      // First, create or find the item
      let item = await prisma.item.findUnique({
        where: { name: args.itemName },
      })

      if (!item) {
        // Ensure system user exists for item creation
        let systemUser = await prisma.user.findUnique({
          where: { email: 'system@example.com' },
        })

        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              name: 'System',
              email: 'system@example.com',
            },
          })
        }

        item = await prisma.item.create({
          data: {
            name: args.itemName,
            createdById: systemUser.id,
          },
        })
      }

      // Add item to list
      const listItem = await prisma.listItem.create({
        data: {
          listId: args.listId,
          itemId: item.id,
          quantity: args.quantity || 1,
          notes: args.notes || null,
        },
        include: {
          item: {
            include: {
              createdBy: true,
            },
          },
          list: {
            include: {
              owner: true,
            },
          },
        },
      })

      eventEmitter.emit('ITEM_ADDED_TO_LIST', { itemAddedToList: listItem })
      return listItem
    },

    updateListItem: async (
      _parent: unknown,
      args: {
        id: string
        quantity?: number
        isCompleted?: boolean
        notes?: string
      }
    ) => {
      const updateData: {
        quantity?: number
        isCompleted?: boolean
        notes?: string
      } = {}

      if (args.quantity !== undefined) updateData.quantity = args.quantity
      if (args.isCompleted !== undefined)
        updateData.isCompleted = args.isCompleted
      if (args.notes !== undefined) updateData.notes = args.notes

      const updatedItem = await prisma.listItem.update({
        where: { id: args.id },
        data: updateData,
        include: {
          item: {
            include: {
              createdBy: true,
            },
          },
          list: {
            include: {
              owner: true,
            },
          },
        },
      })

      eventEmitter.emit('ITEM_UPDATED', { itemUpdated: updatedItem })
      return updatedItem
    },

    removeItemFromList: async (_parent: unknown, args: { id: string }) => {
      try {
        await prisma.listItem.delete({
          where: { id: args.id },
        })

        eventEmitter.emit('ITEM_REMOVED', { itemRemoved: args.id })
        return true
      } catch (error) {
        console.error('Error removing item from list:', error)
        return false
      }
    },
  },
  Subscription: {
    userAdded: {
      subscribe: () => {
        console.log('Client subscribed to USER_ADDED')
        return createAsyncIterator('USER_ADDED')
      },
    },
    userUpdated: {
      subscribe: () => {
        console.log('Client subscribed to USER_UPDATED')
        return createAsyncIterator('USER_UPDATED')
      },
    },
    userDeleted: {
      subscribe: () => {
        console.log('Client subscribed to USER_DELETED')
        return createAsyncIterator('USER_DELETED')
      },
    },
    listAdded: {
      subscribe: () => createAsyncIterator('LIST_ADDED'),
    },
    listUpdated: {
      subscribe: () => createAsyncIterator('LIST_UPDATED'),
    },
    listDeleted: {
      subscribe: () => createAsyncIterator('LIST_DELETED'),
    },
    itemAddedToList: {
      subscribe: () => createAsyncIterator('ITEM_ADDED_TO_LIST'),
    },
    itemUpdated: {
      subscribe: () => createAsyncIterator('ITEM_UPDATED'),
    },
    itemRemoved: {
      subscribe: () => createAsyncIterator('ITEM_REMOVED'),
    },
  },
}

// Create the schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

// Create an Express app and HTTP server
const app = express()
const httpServer = http.createServer(app)

// Create our WebSocket server using the HTTP server we just set up
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
})

// Save the returned server's info so we can shutdown this server later
// biome-ignore lint/correctness/useHookAtTopLevel: useServer is from graphql-ws, not a React hook
const serverCleanup = useServer({ schema }, wsServer)

// Set up ApolloServer
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Proper shutdown for the WebSocket server
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          },
        }
      },
    },
  ],
})

// Start the GraphQL server with error handling
try {
  await server.start()
  console.log('✅ Apollo Server started successfully')
} catch (error) {
  console.error('❌ Failed to start Apollo Server:', error)
  process.exit(1)
}

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function
const getAllowedOrigins = () => {
  // Default development origins
  const allowedStringOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001', // For port conflicts
    'http://127.0.0.1:3001', // For port conflicts
    'http://localhost:3002', // Alternative port
    'http://127.0.0.1:3002', // Alternative port
  ]

  // Get origins from environment variable (comma-separated)
  const envOrigins =
    process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || []

  // Combine defaults with environment origins
  const allStringOrigins = [...allowedStringOrigins, ...envOrigins]

  // Development regex patterns
  const developmentPatterns = [
    /^http:\/\/192\.168\.[0-9]+\.[0-9]+:(3000|3001|3002)$/,
    /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:(3000|3001|3002)$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+:(3000|3001|3002)$/,
  ]

  // Return a function that checks both string matches and regex matches
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    // Check string origins
    if (allStringOrigins.includes(origin)) {
      return callback(null, true)
    }

    // In development, check regex patterns
    if (process.env.NODE_ENV === 'development') {
      for (const pattern of developmentPatterns) {
        if (pattern.test(origin)) {
          return callback(null, true)
        }
      }
    }

    // Origin not allowed
    callback(null, false)
  }
}

app.use(
  '/graphql',
  cors<cors.CorsRequest>({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Apollo-Require-Preflight',
    ],
    exposedHeaders: ['Content-Length', 'ETag'],
  }),
  express.json(),
  expressMiddleware(server) as unknown as express.RequestHandler
)

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000
const HOST = process.env.HOST || '0.0.0.0'

// Now that our HTTP server is fully set up, we can listen to it
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server is now running on http://${HOST}:${PORT}/graphql`)
  console.log(`📡 Subscriptions ready at ws://${HOST}:${PORT}/graphql`)

  // For development, show the local network access URLs
  if (HOST === '0.0.0.0') {
    console.log('\nServer can be accessed from other devices at:')
    console.log(`- Local: http://localhost:${PORT}/graphql`)
    console.log(`- Network: http://[YOUR_IP_ADDRESS]:${PORT}/graphql`)
    console.log(
      '\nTo find your IP address, run: ipconfig (Windows) or ifconfig (Mac/Linux)'
    )
  }
})

// Add error handling for the HTTP server
httpServer.on('error', error => {
  console.error('❌ HTTP Server error:', error)
  process.exit(1)
})

// Handle uncaught exceptions and promise rejections
process.on('uncaughtException', error => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', reason => {
  console.error('❌ Unhandled Promise Rejection:', reason)
  process.exit(1)
})

///// Query, Mutation, Subscription
//// typeDefs, resolvers
