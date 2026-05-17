import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { user, schedule } from '#/db/schema'

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
    const [profile] = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
    if (!profile) return null

    const scheduleRows = await db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, profile.id))

    return { profile, schedule: scheduleRows }
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
  const { profile, schedule: scheduleRows } = Route.useLoaderData()

  const sorted = [...scheduleRows].sort((a, b) => a.dayOfWeek - b.dayOfWeek)

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
    </div>
  )
}
