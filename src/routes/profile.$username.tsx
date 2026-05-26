import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { db } from '#/db'
import { getUpcomingExceptions } from '#/db/exceptions'
import { getAvailabilityStatus } from '#/lib/availability'
import { DAY_NAMES, DAY_ORDER, formatExceptionDate } from '#/lib/schedule'
import { AvailabilityHero } from '#/components/AvailabilityHero'

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
