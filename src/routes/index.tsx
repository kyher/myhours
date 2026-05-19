import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock, Link2, Users } from 'lucide-react'

import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session } = authClient.useSession()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="flex flex-col items-center justify-center px-8 py-32 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Know when your
          <br />
          <span className="text-emerald-500">team works.</span>
        </h1>
        <p className="mt-6 max-w-xl text-xl text-zinc-400">
          Set your hours, share your link. No more guessing when colleagues are
          available.
        </p>
        <div className="mt-10 flex gap-4">
          {session ? (
            <>
              <Link
                to="/settings"
                className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
              >
                Settings
              </Link>
              <Link
                to="/profile/$username"
                params={{ username: session.user.username ?? '' }}
                className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold transition-colors hover:border-zinc-500"
              >
                My Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold transition-colors hover:border-zinc-500"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="border-t border-zinc-800 px-8 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-center text-3xl font-bold">
            How it works
          </h2>
          <div className="grid gap-12 sm:grid-cols-3">
            <Step
              number="01"
              icon={<Clock className="h-6 w-6" />}
              title="Set your hours"
              description="Register and configure your weekly working schedule, including exceptions for holidays or irregular days."
            />
            <Step
              number="02"
              icon={<Link2 className="h-6 w-6" />}
              title="Share your link"
              description="Your profile lives at a public URL. Share it with your team once and they'll always know your hours."
            />
            <Step
              number="03"
              icon={<Users className="h-6 w-6" />}
              title="Team stays in sync"
              description="Colleagues check your profile whenever they need to know if you're around. No more chasing people to ask."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 px-8 py-24 text-center">
        <h2 className="text-3xl font-bold">Ready to share your hours?</h2>
        <p className="mt-4 text-zinc-400">
          Create your profile in under a minute.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-lg bg-emerald-500 px-8 py-3 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Create your profile
        </Link>
      </section>
    </div>
  )
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-semibold text-emerald-500">
          {number}
        </span>
        <div className="text-emerald-500">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="leading-relaxed text-zinc-400">{description}</p>
    </div>
  )
}
