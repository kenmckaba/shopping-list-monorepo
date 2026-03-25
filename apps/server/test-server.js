// Test script to isolate the server startup issue
import 'dotenv/config'

console.log('✅ dotenv loaded')

console.log('✅ DATABASE_URL:', process.env.DATABASE_URL)

try {
  console.log('🔄 Testing Prisma imports...')
  const { PrismaLibSql } = await import('@prisma/adapter-libsql')
  const { PrismaClient } = await import('@prisma/client')
  console.log('✅ Prisma imports successful')

  console.log('🔄 Testing Prisma adapter creation...')
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL,
  })
  console.log('✅ Prisma adapter created')

  console.log('🔄 Testing Prisma client creation...')
  const prisma = new PrismaClient({ adapter })
  console.log('✅ Prisma client created')

  console.log('🔄 Testing Prisma connection...')
  await prisma.$connect()
  console.log('✅ Prisma connected successfully')

  await prisma.$disconnect()
  console.log('✅ Test completed successfully')
} catch (error) {
  console.error('❌ Error during test:', error)
  process.exit(1)
}
