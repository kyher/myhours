import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { authClient } from '#/lib/auth-client'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'MyHours',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const { data: session } = authClient.useSession()

  return (
    <>
      <nav className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-8 py-4 text-sm text-zinc-50">
        <Link to="/" className="font-semibold text-emerald-500">
          MyHours
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <>
              <Link
                to="/settings"
                className="text-zinc-400 transition-colors hover:text-zinc-50"
              >
                Settings
              </Link>
              <Link
                to="/profile/$username"
                params={{ username: session.user.username ?? '' }}
                className="text-zinc-400 transition-colors hover:text-zinc-50"
              >
                My Profile
              </Link>
              <button
                onClick={() => authClient.signOut()}
                className="text-zinc-400 transition-colors hover:text-zinc-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-zinc-400 transition-colors hover:text-zinc-50"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-emerald-500 px-3 py-1.5 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
