import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { useState } from 'react'
import type { Schedule } from '@prisma/client'
import { auth } from '#/lib/auth'
import { db } from '#/db'
import { upsertScheduleRows } from '#/db/schedule'
import type { ScheduleRowInput } from '#/db/schedule'
import { DAY_NAMES, DAY_ORDER } from '#/lib/schedule'

type ScheduleRow = ScheduleRowInput

const saveScheduleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ScheduleRow[]) => data)
  .handler(async ({ data: rows }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')
    await upsertScheduleRows(db, session.user.id, rows)
  })

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

export function WorkingHoursEditor({
  scheduleRows,
}: {
  scheduleRows: Schedule[]
}) {
  const [rows, setRows] = useState(() => buildInitialRows(scheduleRows))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  return (
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
  )
}
