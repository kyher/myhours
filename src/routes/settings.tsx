import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { auth } from '#/lib/auth'
import { authClient } from '#/lib/auth-client'
import { getRequest } from '@tanstack/react-start/server'

const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  return await auth.api.getSession({ headers: request.headers })
})

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { session } = Route.useRouteContext()

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
      <div className="rounded border p-4 text-sm text-gray-500">
        Working hours management coming soon.
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
