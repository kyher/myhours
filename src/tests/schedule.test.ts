import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, insertTestUser  } from './helpers/db.ts'
import type {TestDb} from './helpers/db.ts';
import { getSchedule, upsertScheduleRows } from '#/db/schedule.ts'

const USER_A = 'user-a'
const USER_B = 'user-b'

let db: TestDb

beforeEach(async () => {
  db = await createTestDb()
  await insertTestUser(db, USER_A)
  await insertTestUser(db, USER_B)
})

describe('getSchedule', () => {
  it('returns schedule rows for the given user', async () => {
    await upsertScheduleRows(db, USER_A, [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isWorking: true },
    ])

    const rows = await getSchedule(db, USER_A)

    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.userId === USER_A)).toBe(true)
  })

  it("does not return another user's rows", async () => {
    await upsertScheduleRows(db, USER_B, [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
    ])

    const rows = await getSchedule(db, USER_A)

    expect(rows).toHaveLength(0)
  })
})

describe('upsertScheduleRows', () => {
  it('inserts rows for each day', async () => {
    await upsertScheduleRows(db, USER_A, [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', isWorking: true },
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isWorking: false },
    ])

    const rows = await getSchedule(db, USER_A)

    expect(rows).toHaveLength(3)
  })

  it('updates an existing row on conflict (same user + dayOfWeek)', async () => {
    await upsertScheduleRows(db, USER_A, [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
    ])
    await upsertScheduleRows(db, USER_A, [
      { dayOfWeek: 1, startTime: '10:00', endTime: '15:00', isWorking: false },
    ])

    const rows = await getSchedule(db, USER_A)

    expect(rows).toHaveLength(1)
    expect(rows[0].startTime).toBe('10:00')
    expect(rows[0].endTime).toBe('15:00')
    expect(rows[0].isWorking).toBe(false)
  })

  it("does not affect another user's row for the same day", async () => {
    await upsertScheduleRows(db, USER_A, [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
    ])
    await upsertScheduleRows(db, USER_B, [
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', isWorking: true },
    ])

    const rowsA = await getSchedule(db, USER_A)
    expect(rowsA[0].startTime).toBe('09:00')
  })
})
