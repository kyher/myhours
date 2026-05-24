import {
  createFileRoute,
  redirect,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { auth } from '#/lib/auth'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '#/db'
import type { Schedule } from '@prisma/client'
import {
  getUpcomingExceptions,
  upsertException,
  deleteException,
} from '#/db/exceptions'
import type { ExceptionInput } from '#/db/exceptions'
import { getSchedule, upsertScheduleRows } from '#/db/schedule'
import type { ScheduleRowInput } from '#/db/schedule'

type ScheduleRow = ScheduleRowInput

const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  return await auth.api.getSession({ headers: request.headers })
})

const getScheduleFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return []
  return await getSchedule(db, session.user.id)
})

const getExceptionsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return []
  return await getUpcomingExceptions(db, session.user.id)
})

const saveScheduleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ScheduleRow[]) => data)
  .handler(async ({ data: rows }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    await upsertScheduleRows(db, session.user.id, rows)
  })

const saveExceptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ExceptionInput) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    await upsertException(db, session.user.id, data)
  })

const removeExceptionFn = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    await deleteException(db, session.user.id, id)
  })

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  loader: async () => ({
    scheduleRows: await getScheduleFn(),
    exceptionRows: await getExceptionsFn(),
  }),
  component: SettingsPage,
})

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function buildInitialRows(dbRows: Schedule[]): ScheduleRow[] {
  const byDay: Partial<Record<number, Schedule>> = Object.fromEntries(
    dbRows.map((r) => [r.dayOfWeek, r]),
  )
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    startTime: byDay[day]?.startTime ?? '09:00',
    endTime: byDay[day]?.endTime ?? '17:00',
    isWorking: byDay[day]?.isWorking ?? (day >= 1 && day <= 5),
  }))
}

function formatExceptionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function SettingsPage() {
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const { scheduleRows, exceptionRows } = Route.useLoaderData()
  const [rows, setRows] = useState(() => buildInitialRows(scheduleRows))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const [newDate, setNewDate] = useState('')
  const [newIsWorking, setNewIsWorking] = useState(false)
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('17:00')
  const [addingException, setAddingException] = useState(false)

  const updateRow = (dayOfWeek: number, patch: Partial<ScheduleRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)),
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveScheduleFn({ data: rows })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleAddException = async () => {
    if (!newDate) return
    setAddingException(true)
    try {
      await saveExceptionFn({
        data: {
          date: newDate,
          isWorking: newIsWorking,
          startTime: newIsWorking ? newStartTime : null,
          endTime: newIsWorking ? newEndTime : null,
        },
      })
      setNewDate('')
      setNewIsWorking(false)
      setNewStartTime('09:00')
      setNewEndTime('17:00')
      await router.invalidate()
    } finally {
      setAddingException(false)
    }
  }

  const handleDeleteException = async (id: string) => {
    await removeExceptionFn({ data: id })
    await router.invalidate()
  }

  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="mb-8 bg-linear-to-r from-emerald-700 to-emerald-900 p-4 rounded flex items-center place-content-between">
        <div>
          <p className="text-sm">Signed in as</p>
          <p className="font-medium">{session.user.email}</p>
          <p className="text-sm text-white">@{session.user.username}</p>
        </div>
        <Link
          to="/profile/$username"
          params={{ username: session.user.username ?? '' }}
          className="text-sm underline"
        >
          View my public profile →
        </Link>
      </div>
      <div className="mb-8"></div>
      <div className="mb-8 bg-emerald-900 p-4 rounded">
        <h2 className="mb-4 text-lg font-semibold">Working hours</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">Day</th>
              <th className="pb-2 font-medium">Working</th>
              <th className="pb-2 font-medium">Start</th>
              <th className="pb-2 font-medium">End</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dayOfWeek} className="border-b last:border-0">
                <td className="py-2">{DAY_NAMES[row.dayOfWeek]}</td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={row.isWorking}
                    onChange={(e) =>
                      updateRow(row.dayOfWeek, { isWorking: e.target.checked })
                    }
                    className="cursor-pointer"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="time"
                    value={row.startTime}
                    disabled={!row.isWorking}
                    onChange={(e) =>
                      updateRow(row.dayOfWeek, { startTime: e.target.value })
                    }
                    className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:text-gray-400"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="time"
                    value={row.endTime}
                    disabled={!row.isWorking}
                    onChange={(e) =>
                      updateRow(row.dayOfWeek, { endTime: e.target.value })
                    }
                    className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:text-gray-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>

      <div className="mb-8 bg-emerald-900 p-4 rounded">
        <h2 className="mb-4 text-lg font-semibold">Upcoming exceptions</h2>
        {exceptionRows.length > 0 && (
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Hours</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {exceptionRows.map((ex) => (
                <tr key={ex.id} className="border-b last:border-0">
                  <td className="py-2">{formatExceptionDate(ex.date)}</td>
                  <td className="py-2">
                    {ex.isWorking ? `${ex.startTime} – ${ex.endTime}` : 'Off'}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleDeleteException(ex.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs">Date</label>
            <input
              type="date"
              value={newDate}
              min={today}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <input
              type="checkbox"
              id="newIsWorking"
              checked={newIsWorking}
              onChange={(e) => setNewIsWorking(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="newIsWorking" className="text-sm">
              Working
            </label>
          </div>
          <div>
            <label className="mb-1 block text-xs">Start</label>
            <input
              type="time"
              value={newStartTime}
              disabled={!newIsWorking}
              onChange={(e) => setNewStartTime(e.target.value)}
              className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs">End</label>
            <input
              type="time"
              value={newEndTime}
              disabled={!newIsWorking}
              onChange={(e) => setNewEndTime(e.target.value)}
              className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:text-gray-400"
            />
          </div>
          <button
            onClick={handleAddException}
            disabled={!newDate || addingException}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {addingException ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
