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
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-lg border border-border bg-secondary/30 p-6">
        <p className="text-muted-foreground">No celebrations yet</p>
      </div>
    )
  }

  const visibleCelebrations = celebrations.slice(0, MAX_VISIBLE_ITEMS)

  return (
    <div className="flex flex-col gap-1 overflow-hidden">
      {visibleCelebrations.map((c, i) => (
        <div
          key={c.id}
          className="flex animate-slide-in items-center gap-3 rounded-lg border border-border bg-secondary/50 p-1.5"
          style={{
            animationDelay: `${i * 80}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <div className="flex shrink-0 -space-x-2">
            {(c.team_members ?? []).slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-background"
              >
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary/20 text-xs font-bold text-primary">
                    {getInitials(m.name)}
                  </div>
                )}
              </div>
            ))}
            {(!c.team_members || c.team_members.length === 0) && (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs text-muted-foreground">
                —
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{c.title}</p>
            {c.subtitle && (
              <p className="truncate text-muted-foreground text-sm">{c.subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            {c.amount != null && (
              <p className="font-bold tabular-nums text-accent">${c.amount.toLocaleString()}</p>
            )}
            {c.created_at && (
              <span className="text-[9px] text-muted-foreground">{timeAgo(c.created_at)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
