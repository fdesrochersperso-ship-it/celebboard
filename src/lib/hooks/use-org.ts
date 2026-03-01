'use client'

import { createClient } from '@/lib/supabase-clients'
import { useEffect, useState } from 'react'

type OrgData = {
  orgId: string
  orgName: string
}

const orgCache: Record<string, OrgData> = {}

export function useOrg(): {
  orgId: string | null
  orgName: string | null
  loading: boolean
} {
  const [state, setState] = useState<{
    orgId: string | null
    orgName: string | null
    loading: boolean
  }>({ orgId: null, orgName: null, loading: true })

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setState((prev) => (prev.loading ? { orgId: null, orgName: null, loading: false } : prev))
      }
    }, 12000) // Stop loading after 12s to avoid infinite spinner

    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setState({ orgId: null, orgName: null, loading: false })
          return
        }

        const cached = orgCache[user.id]
        if (cached) {
          if (!cancelled) setState({ ...cached, loading: false })
          return
        }

        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!membership?.org_id) {
          if (!cancelled) setState({ orgId: null, orgName: null, loading: false })
          return
        }

        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', membership.org_id)
          .single()

        const orgData: OrgData = {
          orgId: membership.org_id,
          orgName: org?.name ?? 'Organization',
        }
        orgCache[user.id] = orgData

        if (!cancelled) {
          setState({ ...orgData, loading: false })
        }
      } catch {
        if (!cancelled) setState({ orgId: null, orgName: null, loading: false })
      }
    }

    load()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  return state
}
