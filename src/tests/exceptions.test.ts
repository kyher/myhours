import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, insertTestUser, type TestDb } from './helpers/db.ts'
import { getUpcomingExceptions, upsertException, deleteException } from '#/db/exceptions.ts'

const USER_A = 'user-a'
const USER_B = 'user-b'
const FUTURE = '2099-12-31'
const PAST = '2000-01-01'

let db: TestDb

beforeEach(async () => {
  db = createTestDb()
  await insertTestUser(db, USER_A)
  await insertTestUser(db, USER_B)
})

describe('getUpcomingExceptions', () => {
  it('returns exceptions on or after today', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: false, startTime: null, endTime: null })
    await upsertException(db, USER_A, { date: PAST, isWorking: false, startTime: null, endTime: null })

    const rows = await getUpcomingExceptions(db, USER_A)

    expect(rows).toHaveLength(1)
    expect(rows[0].date).toBe(FUTURE)
  })

  it('only returns exceptions for the given user', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: false, startTime: null, endTime: null })
    await upsertException(db, USER_B, { date: FUTURE, isWorking: false, startTime: null, endTime: null })

    const rows = await getUpcomingExceptions(db, USER_A)

    expect(rows).toHaveLength(1)
    expect(rows[0].userId).toBe(USER_A)
  })

  it('returns results ordered by date ascending', async () => {
    await upsertException(db, USER_A, { date: '2099-06-01', isWorking: false, startTime: null, endTime: null })
    await upsertException(db, USER_A, { date: '2099-03-01', isWorking: false, startTime: null, endTime: null })
    await upsertException(db, USER_A, { date: '2099-09-01', isWorking: false, startTime: null, endTime: null })

    const rows = await getUpcomingExceptions(db, USER_A)
    const dates = rows.map((r) => r.date)

    expect(dates).toEqual(['2099-03-01', '2099-06-01', '2099-09-01'])
  })
})

describe('upsertException', () => {
  it('inserts a day-off exception', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: false, startTime: null, endTime: null })

    const rows = await getUpcomingExceptions(db, USER_A)

    expect(rows).toHaveLength(1)
    expect(rows[0].isWorking).toBe(false)
    expect(rows[0].startTime).toBeNull()
    expect(rows[0].endTime).toBeNull()
  })

  it('inserts a custom-hours exception', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: true, startTime: '10:00', endTime: '14:00' })

    const rows = await getUpcomingExceptions(db, USER_A)

    expect(rows[0].isWorking).toBe(true)
    expect(rows[0].startTime).toBe('10:00')
    expect(rows[0].endTime).toBe('14:00')
  })

  it('replaces an existing exception for the same date (upsert)', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: true, startTime: '09:00', endTime: '17:00' })
    await upsertException(db, USER_A, { date: FUTURE, isWorking: false, startTime: null, endTime: null })

    const rows = await getUpcomingExceptions(db, USER_A)

    expect(rows).toHaveLength(1)
    expect(rows[0].isWorking).toBe(false)
  })

  it('does not affect another user\'s exception on the same date', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: true, startTime: '09:00', endTime: '17:00' })
    await upsertException(db, USER_B, { date: FUTURE, isWorking: false, startTime: null, endTime: null })

    const rowsA = await getUpcomingExceptions(db, USER_A)
    expect(rowsA[0].isWorking).toBe(true)
  })
})

describe('deleteException', () => {
  it('removes the exception', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: false, startTime: null, endTime: null })
    const [exception] = await getUpcomingExceptions(db, USER_A)

    await deleteException(db, USER_A, exception.id)

    const rows = await getUpcomingExceptions(db, USER_A)
    expect(rows).toHaveLength(0)
  })

  it('does not delete another user\'s exception', async () => {
    await upsertException(db, USER_A, { date: FUTURE, isWorking: false, startTime: null, endTime: null })
    const [exceptionA] = await getUpcomingExceptions(db, USER_A)

    await deleteException(db, USER_B, exceptionA.id)

    const rows = await getUpcomingExceptions(db, USER_A)
    expect(rows).toHaveLength(1)
  })
})
