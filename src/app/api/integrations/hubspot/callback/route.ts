import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import {
  verifyState,
  exchangeCodeForTokens,
  getTokenInfo,
} from '@/lib/connectors/hubspot/auth'
import { syncHubSpotSchema } from '@/lib/connectors/hubspot/schema'
import { syncHubSpotOwners } from '@/lib/connectors/hubspot/owners'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/app/integrations', request.url)

  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')

    if (!code || !state) {
      redirectUrl.searchParams.set('error', 'invalid_state')
      return NextResponse.redirect(redirectUrl)
    }

    const orgId = verifyState(state)
    console.log('[HubSpot callback] decoded org_id from state:', orgId)
    if (!orgId) {
      redirectUrl.searchParams.set('error', 'invalid_state')
      return NextResponse.redirect(redirectUrl)
    }

    const tokens = await exchangeCodeForTokens(code)
    const tokenInfo = await getTokenInfo(tokens.access_token)

    const hubId = tokenInfo.hub_id
    const hubDomain = tokenInfo.hub_domain ?? ''

    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString()

    console.log('[HubSpot callback] tokens received:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in,
      portal_id: tokenInfo.hub_id,
    })

    const credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokenExpiresAt,
      portal_id: String(hubId),
      hub_domain: hubDomain,
    }

    console.log('[HubSpot callback] credentials to save:', JSON.stringify(credentials))

    const config = {
      portal_id: String(hubId),
      hub_domain: hubDomain,
    }

    const supabase = createServiceClient()

    // Use explicit update/insert to avoid upsert JSONB quirks.
    // Find any HubSpot integration for this org (may have been created with different name via add-integration-dialog).
    const { data: existing } = await supabase
      .from('integrations')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('type', 'hubspot')
      .limit(1)
      .maybeSingle()

    const payload = {
      org_id: orgId,
      type: 'hubspot',
      name: 'HubSpot',
      credentials,
      config,
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    let integration: { id: string; org_id: string; credentials: unknown } | null = null

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('integrations')
        .update({
          credentials,
          config,
          status: 'active',
          updated_at: payload.updated_at,
        })
        .eq('id', existing.id)
        .select('id, org_id, credentials')
        .single()

      if (updateError) {
        console.error('HubSpot callback update error:', updateError)
        redirectUrl.searchParams.set('error', 'connection_failed')
        return NextResponse.redirect(redirectUrl)
      }
      integration = updated
      console.log('[HubSpot callback] upsert result (update):', JSON.stringify({
        id: integration?.id,
        has_credentials: !!integration?.credentials,
        credentials_keys: integration?.credentials ? Object.keys(integration.credentials as object) : [],
      }))
    } else {
      // No existing HubSpot integration — insert new one
      const { data: inserted, error: insertError } = await supabase
        .from('integrations')
        .insert(payload)
        .select('id, org_id, credentials')
        .single()

      if (insertError) {
        console.error('HubSpot callback insert error:', insertError)
        redirectUrl.searchParams.set('error', 'connection_failed')
        return NextResponse.redirect(redirectUrl)
      }
      integration = inserted
      console.log('[HubSpot callback] upsert result (insert):', JSON.stringify({
        id: integration?.id,
        has_credentials: !!integration?.credentials,
        credentials_keys: integration?.credentials ? Object.keys(integration.credentials as object) : [],
      }))
    }

    // Fetch full integration record for sync (use the one we just updated/inserted)
    const integrationRecord = integration
    let ownersSynced = 0
    if (integrationRecord) {
      const integrationForSync = {
        id: integrationRecord.id,
        credentials: (integrationRecord.credentials ?? {}) as Record<string, unknown>,
      }
      try {
        await syncHubSpotSchema(integrationForSync, orgId, supabase)
      } catch (schemaErr) {
        console.error('HubSpot schema sync error:', schemaErr)
      }
      try {
        const ownersResult = await syncHubSpotOwners(
          integrationForSync,
          orgId,
          supabase
        )
        ownersSynced = ownersResult.synced
      } catch (ownersErr) {
        console.error('HubSpot owners sync error:', ownersErr)
      }
      console.log(
        `HubSpot connected for org ${orgId}: schema synced, ${ownersSynced} owners synced`
      )
    }

    redirectUrl.searchParams.set('connected', 'hubspot')
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('HubSpot callback error:', err)
    redirectUrl.searchParams.set('error', 'connection_failed')
    return NextResponse.redirect(redirectUrl)
  }
}
