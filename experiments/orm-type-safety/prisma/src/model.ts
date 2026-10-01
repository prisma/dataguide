import { localConnection } from './helper.js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: localConnection('EXPERIMENT_DATABASE_URL') }),
})
