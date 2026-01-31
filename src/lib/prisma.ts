import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL

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