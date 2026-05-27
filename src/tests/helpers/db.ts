import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

let prisma: PrismaClient | undefined

function getClient(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaPg(process.env.DATABASE_URL!)
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export type TestDb = PrismaClient

export async function createTestDb(): Promise<TestDb> {
  const db = getClient()
  await db.scheduleException.deleteMany()
  await db.schedule.deleteMany()
  await db.session.deleteMany()
  await db.account.deleteMany()
  await db.verification.deleteMany()
  await db.user.deleteMany()
  return db
}

export async function insertTestUser(db: TestDb, id: string) {
  await db.user.create({
    data: {
      id,
      name: 'Test User',
      email: `${id}@test.com`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}
