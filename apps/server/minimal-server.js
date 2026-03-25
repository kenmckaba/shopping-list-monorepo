// Minimal GraphQL server test
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import { gql } from 'graphql-tag'

console.log('🚀 Starting minimal GraphQL server test...')

// Simple GraphQL schema
const typeDefs = gql`
  type Query {
    hello: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
  },
}

async function startServer() {
  try {
    console.log('🔄 Creating Express app...')
    const app = express()
    const httpServer = http.createServer(app)

    console.log('🔄 Creating Apollo Server...')
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    })

    console.log('🔄 Starting Apollo Server...')
    await server.start()
    console.log('✅ Apollo Server started')

    console.log('🔄 Setting up middleware...')
    app.use('/graphql', express.json(), expressMiddleware(server))

    const PORT = 4001 // Use different port to avoid conflicts
    const HOST = '0.0.0.0'

    console.log('🔄 Starting HTTP server...')
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server running at http://${HOST}:${PORT}/graphql`)
    })
  } catch (error) {
    console.error('❌ Server startup failed:', error)
    process.exit(1)
  }
}

startServer()
