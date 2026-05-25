import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { db } from '#/db'
import { getUpcomingExceptions } from '#/db/exceptions'
import type { AvailabilityStatus } from '#/lib/availability'
import { getAvailabilityStatus } from '#/lib/availability'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const getProfile = createServerFn({ method: 'GET' })
  .inputValidator((username: string) => username)
  .handler(async ({ data: username }) => {
    const profile = await db.user.findUnique({ where: { username } })
    if (!profile) return null

    const scheduleRows = await db.schedule.findMany({
      where: { userId: profile.id },
    })
    const exceptions = await getUpcomingExceptions(db, profile.id)

    return { profile, schedule: scheduleRows, exceptions }
  })

export const Route = createFileRoute('/profile/$username')({
  loader: async ({ params }) => {
    const data = await getProfile({ data: params.username })
    if (!data) throw notFound()
    return data
  },
  component: ProfilePage,
  notFoundComponent: () => (
    <div className="mx-auto mt-16 max-w-lg px-4 text-center">
      <p className="text-gray-500">Profile not found.</p>
    </div>
  ),
})

function formatExceptionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function AvailabilityHero({ status }: { status: AvailabilityStatus }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  if (status.kind === 'no-schedule') {
    return (
      <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-4">
        <p className="text-sm text-zinc-400">No schedule set yet.</p>
      </div>
    )
  }

  const available = status.kind === 'available'

  const reason =
    status.kind === 'available'
      ? `${status.start} – ${status.end}`
      : status.kind === 'before-hours'
        ? `Working from ${status.start}`
        : status.kind === 'after-hours'
          ? `Finished at ${status.end}`
          : 'Off today'

  return (
    <div
      className={`mb-8 rounded-lg border px-5 py-4 ${
        available
          ? 'border-emerald-700 bg-emerald-950/60'
          : 'border-zinc-700 bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-zinc-500'}`}
        />
        <span
          className={`font-semibold ${available ? 'text-emerald-400' : 'text-zinc-300'}`}
        >
          {available ? 'Available now' : 'Not available'}
        </span>
      </div>
      <p className="mt-1 pl-4 text-sm">{reason}</p>
      <p className="mt-3 text-xs">Times shown in your local timezone · {tz}</p>
    </div>
  )
}

function ProfilePage() {
  const { profile, schedule: scheduleRows, exceptions } = Route.useLoaderData()

  const status = getAvailabilityStatus(scheduleRows, exceptions)
  const sorted = [...scheduleRows].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  )

  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <h1 className="mb-1 text-3xl font-bold">@{profile.username}</h1>
      <p className="mb-6 text-sm text-zinc-500">{profile.name}</p>

      <AvailabilityHero status={status} />

      {sorted.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Schedule
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.dayOfWeek}
                  className="border-b border-zinc-800 last:border-0"
                >
                  <td className="py-2 text-zinc-400">
                    {DAY_NAMES[row.dayOfWeek]}
                  </td>
                  <td className="py-2 text-right">
                    {row.isWorking ? (
                      `${row.startTime} – ${row.endTime}`
                    ) : (
                      <span className="text-zinc-600">Off</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exceptions.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Upcoming exceptions
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {exceptions.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-zinc-800 last:border-0"
                >
                  <td className="py-2 text-zinc-400">
                    {formatExceptionDate(ex.date)}
                  </td>
                  <td className="py-2 text-right">
                    {ex.isWorking ? (
                      `${ex.startTime} – ${ex.endTime}`
                    ) : (
                      <span className="text-zinc-600">Off</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
