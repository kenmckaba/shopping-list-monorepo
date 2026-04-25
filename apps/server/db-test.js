import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function test() {
  try {
    console.log('Testing database connection...')
    const count = await prisma.user.count()
    console.log('Users:', count)
  } catch (e) {
    console.error('Database Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
