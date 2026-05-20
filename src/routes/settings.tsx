import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { eq } from 'drizzle-orm'

import { auth } from '#/lib/auth'
import { authClient } from '#/lib/auth-client'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '#/db'
import { schedule } from '#/db/schema'

type ScheduleRow = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
}

const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  return await auth.api.getSession({ headers: request.headers })
})

const getSchedule = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return []
  return await db.select().from(schedule).where(eq(schedule.userId, session.user.id))
})

const saveSchedule = createServerFn({ method: 'POST' })
  .inputValidator((data: ScheduleRow[]) => data)
  .handler(async ({ data: rows }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    for (const row of rows) {
      await db
        .insert(schedule)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
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
  })

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  loader: async () => ({ scheduleRows: await getSchedule() }),
  component: SettingsPage,
})

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function buildInitialRows(dbRows: (typeof schedule.$inferSelect)[]): ScheduleRow[] {
  const byDay = Object.fromEntries(dbRows.map((r) => [r.dayOfWeek, r]))
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    startTime: byDay[day]?.startTime ?? '09:00',
    endTime: byDay[day]?.endTime ?? '17:00',
    isWorking: byDay[day]?.isWorking ?? (day >= 1 && day <= 5),
  }))
}

function SettingsPage() {
  const { session } = Route.useRouteContext()
  const { scheduleRows } = Route.useLoaderData()
  const [rows, setRows] = useState(() => buildInitialRows(scheduleRows))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateRow = (dayOfWeek: number, patch: Partial<ScheduleRow>) => {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSchedule({ data: rows })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="mb-8 rounded border p-4">
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-medium">{session.user.email}</p>
        <p className="text-sm text-gray-600">@{session.user.username}</p>
      </div>
      <div className="mb-8">
        <Link
          to="/profile/$username"
          params={{ username: session.user.username ?? '' }}
          className="text-sm underline"
        >
          View my public profile →
        </Link>
      </div>
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Working hours</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
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
                    onChange={(e) => updateRow(row.dayOfWeek, { isWorking: e.target.checked })}
                    className="cursor-pointer"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="time"
                    value={row.startTime}
                    disabled={!row.isWorking}
                    onChange={(e) => updateRow(row.dayOfWeek, { startTime: e.target.value })}
                    className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:text-gray-400"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="time"
                    value={row.endTime}
                    disabled={!row.isWorking}
                    onChange={(e) => updateRow(row.dayOfWeek, { endTime: e.target.value })}
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
      <button
        onClick={() => authClient.signOut()}
        className="mt-8 text-sm text-red-600 hover:underline"
      >
        Sign out
      </button>
    </div>
  )
}
