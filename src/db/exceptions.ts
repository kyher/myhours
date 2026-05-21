import { eq, gte, and } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { scheduleException } from './schema.ts'
import type * as schema from './schema.ts'

type Db = BetterSQLite3Database<typeof schema>

export type ExceptionInput = {
  date: string
  isWorking: boolean
  startTime: string | null
  endTime: string | null
}

export function getUpcomingExceptions(db: Db, userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return db
    .select()
    .from(scheduleException)
    .where(and(eq(scheduleException.userId, userId), gte(scheduleException.date, today)))
    .orderBy(scheduleException.date)
}

export function upsertException(db: Db, userId: string, data: ExceptionInput) {
  return db
    .insert(scheduleException)
    .values({
      id: crypto.randomUUID(),
      userId,
      date: data.date,
      isWorking: data.isWorking,
      startTime: data.startTime,
      endTime: data.endTime,
    })
    .onConflictDoUpdate({
      target: [scheduleException.userId, scheduleException.date],
      set: {
        isWorking: data.isWorking,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    })
}

export function deleteException(db: Db, userId: string, id: string) {
  return db
    .delete(scheduleException)
    .where(and(eq(scheduleException.id, id), eq(scheduleException.userId, userId)))
}
