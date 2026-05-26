import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'
import { db } from '#/db'
import { getUpcomingExceptions } from '#/db/exceptions'
import { getSchedule } from '#/db/schedule'
import { UserCard } from '#/components/UserCard'
import { WorkingHoursEditor } from '#/components/WorkingHoursEditor'
import { ExceptionsEditor } from '#/components/ExceptionsEditor'

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

function SettingsPage() {
  const { session } = Route.useRouteContext()
  const { scheduleRows, exceptionRows } = Route.useLoaderData()

  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <UserCard
        email={session.user.email}
        username={session.user.username ?? ''}
      />
      <WorkingHoursEditor scheduleRows={scheduleRows} />
      <ExceptionsEditor exceptionRows={exceptionRows} />
    </div>
  )
}
