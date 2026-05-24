import type { PrismaClient } from '@prisma/client'

export type ExceptionInput = {
  date: string
  isWorking: boolean
  startTime: string | null
  endTime: string | null
}

export function getUpcomingExceptions(db: PrismaClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return db.scheduleException.findMany({
    where: { userId, date: { gte: today } },
    orderBy: { date: 'asc' },
  })
}

export function upsertException(
  db: PrismaClient,
  userId: string,
  data: ExceptionInput,
) {
  return db.scheduleException.upsert({
    where: { userId_date: { userId, date: data.date } },
    create: {
      userId,
      date: data.date,
      isWorking: data.isWorking,
      startTime: data.startTime,
      endTime: data.endTime,
    },
    update: {
      isWorking: data.isWorking,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  })
}

export function deleteException(db: PrismaClient, userId: string, id: string) {
  return db.scheduleException.deleteMany({ where: { id, userId } })
}
