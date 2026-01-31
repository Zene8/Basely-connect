import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL || ''
  
  // Clean URL from quotes if they exist
  url = url.replace(/^"|"$/g, '')

  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
    const pool = new Pool({ connectionString: url })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }

  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
