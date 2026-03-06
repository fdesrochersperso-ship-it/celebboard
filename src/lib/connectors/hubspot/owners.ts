import type { SupabaseClient } from '@supabase/supabase-js'
import { hubspotApi } from './api'

type HubSpotOwner = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  archived?: boolean
  type?: string
  userId?: string
  teams?: unknown[]
  [key: string]: unknown
}

export async function syncHubSpotOwners(
  integration: { id: string; credentials: Record<string, unknown> },
  orgId: string,
  supabase: SupabaseClient
): Promise<{ synced: number; created: number; updated: number }> {
  const api = hubspotApi(integration, supabase)

  const allOwners = (await api.getAll('crm/v3/owners')) as HubSpotOwner[]
  const activeOwners = allOwners.filter((o) => o.archived !== true)

  let created = 0
  let updated = 0

  for (const owner of activeOwners) {
    const hubspotOwnerId = String(owner.id)
    const name =
      [owner.firstName ?? '', owner.lastName ?? ''].join(' ').trim() ||
      owner.email ||
      'Unknown'
    const email = owner.email ?? null

    // Find existing: first by hubspot_owner_id, then by email
    let existing: { id: string; name: string; email: string | null; photo_url: string | null; external_ids: Record<string, string> } | null =
      null

    const { data: byHubSpotId } = await supabase
      .from('team_members')
      .select('id, name, email, photo_url, external_ids')
      .eq('org_id', orgId)
      .contains('external_ids', { hubspot_owner_id: hubspotOwnerId })
      .maybeSingle()

    if (byHubSpotId) {
      existing = byHubSpotId as typeof existing
    } else if (email) {
      const { data: byEmail } = await supabase
        .from('team_members')
        .select('id, name, email, photo_url, external_ids')
        .eq('org_id', orgId)
        .eq('email', email)
        .maybeSingle()
      if (byEmail) {
        existing = byEmail as typeof existing
      }
    }

    const existingIds = (existing?.external_ids ?? {}) as Record<string, string>
    const externalIds = {
      ...existingIds,
      hubspot_owner_id: hubspotOwnerId,
    }

    const now = new Date().toISOString()

    if (existing) {
      // Update name, email, external_ids — do NOT include photo_url (preserve user-uploaded photos)
      const updatePayload: Record<string, unknown> = {
        name,
        email,
        external_ids: externalIds,
        updated_at: now,
      }

      const { error } = await supabase
        .from('team_members')
        .update(updatePayload)
        .eq('id', existing.id)

      if (!error) updated++
    } else {
      const { error } = await supabase.from('team_members').insert({
        org_id: orgId,
        name,
        email,
        external_ids: { hubspot_owner_id: hubspotOwnerId },
        updated_at: now,
      })

      if (!error) created++
    }
  }

  // Update integrations.config.owners_last_synced
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('config')
    .eq('id', integration.id)
    .single()

  const currentConfig = (existingIntegration?.config as Record<string, unknown>) ?? {}
  const updatedConfig = {
    ...currentConfig,
    owners_last_synced: new Date().toISOString(),
  }

  await supabase
    .from('integrations')
    .update({
      config: updatedConfig,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id)

  return {
    synced: activeOwners.length,
    created,
    updated,
  }
}
