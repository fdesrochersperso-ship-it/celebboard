'use client'

import { createClient } from '@/lib/supabase-clients'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plug, PartyPopper, BarChart3, Users, Monitor, History, LogOut } from 'lucide-react'

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
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {loading ? 'Loading...' : orgName ?? 'CelebBoard'}
          </h2>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
