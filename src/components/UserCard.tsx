import { Link } from '@tanstack/react-router'

export function UserCard({
  email,
  username,
}: {
  email: string
  username: string
}) {
  return (
    <div className="mb-8 bg-linear-to-r from-emerald-700 to-emerald-900 p-4 rounded flex items-center place-content-between">
      <div>
        <p className="text-sm">Signed in as</p>
        <p className="font-medium">{email}</p>
        <p className="text-sm text-white">@{username}</p>
      </div>
      <Link
        to="/profile/$username"
        params={{ username }}
        className="text-sm underline"
      >
        View my public profile →
      </Link>
    </div>
  )
}
