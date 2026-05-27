import { PrismaClient } from '@prisma/client'

console.log('--- Prisma Initialization ---')
console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('process.cwd():', process.cwd())

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

