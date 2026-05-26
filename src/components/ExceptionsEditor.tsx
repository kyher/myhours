import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { ScheduleException } from '@prisma/client'
import { auth } from '#/lib/auth'
import { db } from '#/db'
import { upsertException, deleteException } from '#/db/exceptions'
import type { ExceptionInput } from '#/db/exceptions'
import { formatExceptionDate } from '#/lib/schedule'

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

export function ExceptionsEditor({
  exceptionRows,
}: {
  exceptionRows: ScheduleException[]
}) {
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 10)
  const [newDate, setNewDate] = useState('')
  const [newIsWorking, setNewIsWorking] = useState(false)
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('17:00')
  const [addingException, setAddingException] = useState(false)

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
  )
}
