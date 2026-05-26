import type { AvailabilityStatus } from '#/lib/availability'

export function AvailabilityHero({ status }: { status: AvailabilityStatus }) {
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
