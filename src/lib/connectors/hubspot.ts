import type { SupabaseClient } from '@supabase/supabase-js'

type Integration = {
  id: string
  credentials: Record<string, unknown>
}

type HubSpotOwner = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  archived?: boolean
  type?: string
}

type HubSpotOwnersResponse = {
  results: HubSpotOwner[]
  paging?: { next?: { after?: string } }
}

export async function syncTeamMembers(
  integration: Integration,
  orgId: string,
  supabase: SupabaseClient
): Promise<{ created: number; updated: number }> {
  const token = (integration.credentials as { access_token?: string }).access_token
  if (!token) {
    throw new Error('HubSpot integration missing access_token')
  }

  const allOwners: HubSpotOwner[] = []
  let after: string | undefined

  do {
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (after) params.set('after', after)

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/owners?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? `HubSpot API error: ${res.status}`)
    }

    const data = (await res.json()) as HubSpotOwnersResponse
    const owners = data.results ?? []
    const personOwners = owners.filter(
      (o) => !o.archived && o.type !== 'QUEUE'
    )
    allOwners.push(...personOwners)
    after = data.paging?.next?.after
  } while (after)

  let created = 0
  let updated = 0

  for (const owner of allOwners) {
    const name = [owner.firstName ?? '', owner.lastName ?? '']
      .join(' ')
      .trim() || 'Unknown'
    const email = owner.email ?? null
    const hubspotOwnerId = String(owner.id)

    const { data: existing } = await supabase
      .from('team_members')
      .select('id, name, email, photo_url, external_ids')
      .eq('org_id', orgId)
      .contains('external_ids', { hubspot_owner_id: hubspotOwnerId })
      .maybeSingle()

    const existingIds = (existing?.external_ids ?? {}) as Record<string, string>
    const externalIds = {
      ...existingIds,
      hubspot_owner_id: hubspotOwnerId,
    }

    const basePayload = {
      name,
      email,
      external_ids: externalIds,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from('team_members')
        .update(basePayload)
        .eq('id', existing.id)
      if (!error) updated++
    } else {
      const { error } = await supabase.from('team_members').insert({
        org_id: orgId,
        name,
        email,
        external_ids: { hubspot_owner_id: hubspotOwnerId },
        updated_at: new Date().toISOString(),
      })
      if (!error) created++
    }
  }

  return { created, updated }
}
