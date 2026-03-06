import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { type NextRequest } from 'next/server'

/**
 * Temporary debug endpoint to inspect user-org relationships.
 * DELETE THIS FILE after debugging — no auth check, exposes org structure.
 */
export async function GET(request: NextRequest) {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  const supabase = createServiceClient()

  // Current user's memberships
  let memberships: Array<{ org_id: string; org_name: string; role: string }> = []
  if (user) {
    const { data: membershipRows } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)

    if (membershipRows?.length) {
      const orgIds = [...new Set(membershipRows.map((m) => m.org_id))]
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)

      const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]))
      memberships = membershipRows.map((m) => ({
        org_id: m.org_id,
        org_name: orgMap.get(m.org_id) ?? '(unknown)',
        role: m.role ?? '',
      }))
    }
  }

  // All orgs and all org_members
  const { data: allOrgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .order('name')

  const { data: allOrgMembers } = await supabase
    .from('org_members')
    .select('org_id, user_id, role')
    .order('org_id')

  return NextResponse.json({
    current_user: user
      ? { id: user.id, email: user.email ?? user.user_metadata?.email ?? null }
      : null,
    memberships,
    all_orgs: allOrgs ?? [],
    all_org_members: allOrgMembers ?? [],
  })
}
