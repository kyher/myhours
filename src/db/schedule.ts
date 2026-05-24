import type { PrismaClient } from '@prisma/client'

export type ScheduleRowInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
}

export function getSchedule(db: PrismaClient, userId: string) {
  return db.schedule.findMany({ where: { userId } })
}

export async function upsertScheduleRows(
  db: PrismaClient,
  userId: string,
  rows: ScheduleRowInput[],
) {
  for (const row of rows) {
    await db.schedule.upsert({
      where: { userId_dayOfWeek: { userId, dayOfWeek: row.dayOfWeek } },
      create: {
        userId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        isWorking: row.isWorking,
      },
      update: {
        startTime: row.startTime,
        endTime: row.endTime,
        isWorking: row.isWorking,
      },
    })
  }
}
