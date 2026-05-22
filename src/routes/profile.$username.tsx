import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { db } from '#/db'
import { getUpcomingExceptions } from '#/db/exceptions'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const getProfile = createServerFn({ method: 'GET' })
  .inputValidator((username: string) => username)
  .handler(async ({ data: username }) => {
    const profile = await db.user.findUnique({ where: { username } })
    if (!profile) return null

    const scheduleRows = await db.schedule.findMany({ where: { userId: profile.id } })
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
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function ProfilePage() {
  const { profile, schedule: scheduleRows, exceptions } = Route.useLoaderData()

  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
  const sorted = [...scheduleRows].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  )

  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <h1 className="mb-1 text-3xl font-bold">@{profile.username}</h1>
      <p className="mb-8 text-sm text-gray-500">{profile.name}</p>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400">No schedule set yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 font-medium">Day</th>
              <th className="pb-2 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.dayOfWeek} className="border-b last:border-0">
                <td className="py-2">{DAY_NAMES[row.dayOfWeek]}</td>
                <td className="py-2">
                  {row.isWorking ? `${row.startTime} – ${row.endTime}` : 'Off'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {exceptions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Upcoming exceptions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => (
                <tr key={ex.id} className="border-b last:border-0">
                  <td className="py-2">{formatExceptionDate(ex.date)}</td>
                  <td className="py-2">
                    {ex.isWorking ? `${ex.startTime} – ${ex.endTime}` : 'Off'}
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
