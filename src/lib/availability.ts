import type { Schedule, ScheduleException } from '@prisma/client'

export type AvailabilityStatus =
  | { kind: 'available'; start: string; end: string }
  | { kind: 'before-hours'; start: string }
  | { kind: 'after-hours'; end: string }
  | { kind: 'off' }
  | { kind: 'no-schedule' }

export function getAvailabilityStatus(
  schedule: Schedule[],
  exceptions: ScheduleException[],
  now = new Date(),
): AvailabilityStatus {
  if (schedule.length === 0) return { kind: 'no-schedule' }

  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const exception = exceptions.find((e) => e.date === todayStr)

  let isWorking: boolean
  let start: string | null | undefined
  let end: string | null | undefined

  if (exception) {
    isWorking = exception.isWorking
    start = exception.startTime
    end = exception.endTime
  } else {
    const row = schedule.find((r) => r.dayOfWeek === now.getDay())
    if (!row) return { kind: 'off' }
    isWorking = row.isWorking
    start = row.startTime
    end = row.endTime
  }

  if (!isWorking || !start || !end) return { kind: 'off' }
  if (currentTime < start) return { kind: 'before-hours', start }
  if (currentTime >= end) return { kind: 'after-hours', end }
  return { kind: 'available', start, end }
}
