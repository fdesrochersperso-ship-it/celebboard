import type { SupabaseClient } from '@supabase/supabase-js'
import { syncHubSpotOwners } from './hubspot/owners'

type Integration = {
  id: string
  credentials: Record<string, unknown>
}

/**
 * Sync HubSpot owners to team_members.
 * Re-exports syncHubSpotOwners for backward compatibility with syncTeamMembers API.
 */
export async function syncTeamMembers(
  integration: Integration,
  orgId: string,
  supabase: SupabaseClient
): Promise<{ created: number; updated: number }> {
  const result = await syncHubSpotOwners(integration, orgId, supabase)
  return { created: result.created, updated: result.updated }
}
