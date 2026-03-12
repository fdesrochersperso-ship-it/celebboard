import type { SupabaseClient } from '@supabase/supabase-js'
import { syncHubSpotOwners } from './hubspot/owners'
import {
  fetchDealProperties,
  fetchContactProperties,
  fetchCompanyProperties,
  fetchPipelines,
  fetchOwners,
  fetchAndCacheAllSchemas,
} from './hubspot/schema-cache'

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

// Schema fetch and cache (CELEBRATION-BUILDER-REDESIGN-SPEC)
export {
  fetchDealProperties,
  fetchContactProperties,
  fetchCompanyProperties,
  fetchPipelines,
  fetchOwners,
  fetchAndCacheAllSchemas,
}
