import { eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { schedule } from './schema.ts'
import type * as schema from './schema.ts'

type Db = BetterSQLite3Database<typeof schema>

export type ScheduleRowInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
}

export function getSchedule(db: Db, userId: string) {
  return db.select().from(schedule).where(eq(schedule.userId, userId))
}

export async function upsertScheduleRows(db: Db, userId: string, rows: ScheduleRowInput[]) {
  for (const row of rows) {
    await db
      .insert(schedule)
      .values({
        id: crypto.randomUUID(),
        userId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        isWorking: row.isWorking,
      })
      .onConflictDoUpdate({
        target: [schedule.userId, schedule.dayOfWeek],
        set: {
          startTime: row.startTime,
          endTime: row.endTime,
          isWorking: row.isWorking,
        },
      })
  }
}
