'use client'

import { createClient } from '@/lib/supabase-clients'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plug, PartyPopper, BarChart3, Users, Monitor, History, LogOut, Sparkles } from 'lucide-react'

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/integrations', label: 'Integrations', icon: Plug },
  { href: '/app/celebrations', label: 'Celebrations', icon: PartyPopper },
  { href: '/app/kpis', label: 'KPIs', icon: BarChart3 },
  { href: '/app/team', label: 'Team', icon: Users },
  { href: '/app/display', label: 'Display Settings', icon: Monitor },
  { href: '/app/history', label: 'History', icon: History },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [orgName, setOrgName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.org_id) {
        setLoading(false)
        if (!pathname.startsWith('/app/setup')) {
          router.replace('/app/setup')
        }
        return
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', membership.org_id)
        .single()

      setOrgName(org?.name ?? null)
      setLoading(false)
    }

    loadOrg()
  }, [router, pathname])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="app-shell relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_22%)]" />
      <div className="relative flex min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl">
          <div className="border-b border-sidebar-border px-4 py-4">
            <Link href="/app" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl gradient-primary shadow-card">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {loading ? 'Loading...' : orgName ?? 'CelebBoard'}
                </p>
                <p className="text-xs text-muted-foreground">Admin workspace</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground'
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 rounded-xl text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
