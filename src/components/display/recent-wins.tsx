'use client'

type TeamMember = {
  id: string
  name: string
  photo_url: string | null
}

type Celebration = {
  id: string
  title: string
  subtitle: string | null
  amount: number | null
  created_at?: string
  team_members?: TeamMember[]
}

const MAX_VISIBLE_ITEMS = 4

type Props = {
  celebrations: Celebration[]
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function timeAgo(iso: string): string {
  try {
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (sec < 60) return 'Just now'
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
    return `${Math.floor(sec / 86400)}d ago`
  } catch {
    return ''
  }
}

export function RecentWins({ celebrations }: Props) {
  if (celebrations.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="text-zinc-500" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)' }}>
          No celebrations yet
        </p>
      </div>
    )
  }

  const visibleCelebrations = celebrations.slice(0, MAX_VISIBLE_ITEMS)

  return (
    <div className="flex flex-col gap-2 overflow-hidden">
      {visibleCelebrations.map((c, i) => (
        <div
          key={c.id}
          className="flex animate-slide-in items-center gap-3 border border-white/[0.06] bg-white/[0.03] p-3"
          style={{
            animationDelay: `${i * 80}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <div className="flex shrink-0 -space-x-2">
            {(c.team_members ?? []).slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="relative size-10 shrink-0 overflow-hidden border-2 border-[#0a0a0f]"
                style={{
                  borderRadius: '50%',
                  boxShadow: '0 0 12px rgba(234, 179, 8, 0.3)',
                }}
              >
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-zinc-700 text-xs font-bold text-zinc-300">
                    {getInitials(m.name)}
                  </div>
                )}
              </div>
            ))}
            {(!c.team_members || c.team_members.length === 0) && (
              <div
                className="flex size-10 shrink-0 items-center justify-center border-2 border-[#0a0a0f] bg-zinc-700/50 text-xs text-zinc-400"
                style={{ borderRadius: '50%' }}
              >
                —
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate font-medium text-white"
              style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1rem)' }}
            >
              {c.title}
            </p>
            {c.subtitle && (
              <p
                className="truncate text-zinc-400"
                style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)' }}
              >
                {c.subtitle}
              </p>
            )}
          </div>
          {c.amount != null && (
            <p
              className="shrink-0 font-bold tabular-nums"
              style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.35rem)',
                color: '#eab308',
                textShadow: '0 0 20px rgba(234, 179, 8, 0.4)',
              }}
            >
              ${c.amount.toLocaleString()}
            </p>
          )}
          {c.created_at && (
            <span
              className="shrink-0 text-zinc-500"
              style={{ fontSize: 'clamp(0.7rem, 1vw, 0.8rem)' }}
            >
              {timeAgo(c.created_at)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
