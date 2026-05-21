import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import * as schema from '#/db/schema.ts'

const migrationsFolder = resolve(fileURLToPath(new URL('../../../drizzle', import.meta.url)))

export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })
  return db
}

export type TestDb = ReturnType<typeof createTestDb>

export async function insertTestUser(db: TestDb, id: string) {
  await db.insert(schema.user).values({
    id,
    name: 'Test User',
    email: `${id}@test.com`,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}
