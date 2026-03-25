// Test GraphQL and Apollo Server imports
import 'dotenv/config'

console.log('✅ dotenv loaded')

try {
  console.log('🔄 Testing basic Node.js imports...')
  const { EventEmitter } = await import('node:events')
  const http = await import('node:http')
  console.log('✅ Node.js imports successful')

  console.log('🔄 Testing Apollo Server imports...')
  const { ApolloServer } = await import('@apollo/server')
  const { expressMiddleware } = await import('@apollo/server/express4')
  const { ApolloServerPluginDrainHttpServer } = await import(
    '@apollo/server/plugin/drainHttpServer'
  )
  console.log('✅ Apollo Server imports successful')

  console.log('🔄 Testing GraphQL Tools imports...')
  const { makeExecutableSchema } = await import('@graphql-tools/schema')
  console.log('✅ GraphQL Tools imports successful')

  console.log('🔄 Testing Express imports...')
  const cors = (await import('cors')).default
  const express = (await import('express')).default
  console.log('✅ Express imports successful')

  console.log('🔄 Testing GraphQL-WS imports...')
  const { gql } = await import('graphql-tag')
  const { useServer } = await import('graphql-ws/lib/use/ws')
  const { WebSocketServer } = await import('ws')
  console.log('✅ GraphQL-WS imports successful')

  console.log('🔄 Testing Prisma imports...')
  const { PrismaLibSql } = await import('@prisma/adapter-libsql')
  const { PrismaClient } = await import('@prisma/client')
  console.log('✅ Prisma imports successful')

  console.log('✅ All imports test completed successfully')
} catch (error) {
  console.error('❌ Error during import test:', error)
  console.error('Stack:', error.stack)
  process.exit(1)
}
