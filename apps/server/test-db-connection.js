import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')
    const userCount = await prisma.user.count()
    const listCount = await prisma.shoppingList.count()
    const itemCount = await prisma.item.count()

    console.log('Database connection successful!')
    console.log(`Users: ${userCount}, Lists: ${listCount}, Items: ${itemCount}`)
  } catch (error) {
    console.error('Database connection error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
