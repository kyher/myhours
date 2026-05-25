import { describe, it, expect } from 'vitest'
import { getAvailabilityStatus } from '#/lib/availability.ts'
import type { Schedule, ScheduleException } from '@prisma/client'

// Minimal stubs — only the fields getAvailabilityStatus reads
function makeRow(
  dayOfWeek: number,
  opts: { isWorking?: boolean; startTime?: string; endTime?: string } = {},
): Schedule {
  return {
    id: 'r1',
    userId: 'u1',
    dayOfWeek,
    isWorking: opts.isWorking ?? true,
    startTime: opts.startTime ?? '09:00',
    endTime: opts.endTime ?? '17:00',
  }
}

function makeException(
  date: string,
  opts: {
    isWorking?: boolean
    startTime?: string | null
    endTime?: string | null
  } = {},
): ScheduleException {
  return {
    id: 'e1',
    userId: 'u1',
    date,
    isWorking: opts.isWorking ?? false,
    startTime: opts.startTime ?? null,
    endTime: opts.endTime ?? null,
  }
}

// 2026-05-25 is a Monday (day 1)
const MONDAY_MIDDAY = new Date('2026-05-25T12:00:00')
const MONDAY = 1

describe('getAvailabilityStatus', () => {
  it('returns no-schedule when schedule is empty', () => {
    const result = getAvailabilityStatus([], [], MONDAY_MIDDAY)
    expect(result).toEqual({ kind: 'no-schedule' })
  })

  it('returns off when today has no matching row', () => {
    // Only a Tuesday row, but today is Monday
    const result = getAvailabilityStatus([makeRow(2)], [], MONDAY_MIDDAY)
    expect(result).toEqual({ kind: 'off' })
  })

  it('returns off when the matching row is not a working day', () => {
    const result = getAvailabilityStatus(
      [makeRow(MONDAY, { isWorking: false })],
      [],
      MONDAY_MIDDAY,
    )
    expect(result).toEqual({ kind: 'off' })
  })

  it('returns available when current time is within working hours', () => {
    const result = getAvailabilityStatus(
      [makeRow(MONDAY, { startTime: '09:00', endTime: '17:00' })],
      [],
      MONDAY_MIDDAY, // 12:00
    )
    expect(result).toEqual({ kind: 'available', start: '09:00', end: '17:00' })
  })

  it('returns before-hours when current time is before start', () => {
    const early = new Date('2026-05-25T08:00:00')
    const result = getAvailabilityStatus(
      [makeRow(early.getDay(), { startTime: '09:00', endTime: '17:00' })],
      [],
      early,
    )
    expect(result).toEqual({ kind: 'before-hours', start: '09:00' })
  })

  it('returns after-hours when current time is at or past end', () => {
    const late = new Date('2026-05-25T17:00:00')
    const result = getAvailabilityStatus(
      [makeRow(late.getDay(), { startTime: '09:00', endTime: '17:00' })],
      [],
      late,
    )
    expect(result).toEqual({ kind: 'after-hours', end: '17:00' })
  })

  it('exception overrides a working day to off', () => {
    const now = new Date('2026-05-25T12:00:00')
    const result = getAvailabilityStatus(
      [makeRow(now.getDay(), { isWorking: true })],
      [makeException('2026-05-25', { isWorking: false })],
      now,
    )
    expect(result).toEqual({ kind: 'off' })
  })

  it('exception overrides a non-working day to available', () => {
    const now = new Date('2026-05-25T12:00:00')
    const result = getAvailabilityStatus(
      [makeRow(now.getDay(), { isWorking: false })],
      [
        makeException('2026-05-25', {
          isWorking: true,
          startTime: '10:00',
          endTime: '14:00',
        }),
      ],
      now,
    )
    expect(result).toEqual({ kind: 'available', start: '10:00', end: '14:00' })
  })

  it('exception on a different date does not affect today', () => {
    const now = new Date('2026-05-25T12:00:00')
    const result = getAvailabilityStatus(
      [
        makeRow(now.getDay(), {
          isWorking: true,
          startTime: '09:00',
          endTime: '17:00',
        }),
      ],
      [makeException('2026-05-26', { isWorking: false })],
      now,
    )
    expect(result).toEqual({ kind: 'available', start: '09:00', end: '17:00' })
  })
})
