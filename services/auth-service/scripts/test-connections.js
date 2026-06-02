const { PrismaClient } = require('@prisma/client')
const Redis = require('ioredis')

async function main() {
  const prisma = new PrismaClient()
  const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) })
  try {
    const users = await prisma.user.findMany({ take: 2 })
    console.log('db users sample:', users.map(u=>u.email))
  } catch (e) {
    console.error('db error', e)
  }
  try {
    const pong = await redis.ping()
    console.log('redis pong', pong)
  } catch (e) {
    console.error('redis error', e)
  }
  process.exit(0)
}

main()
