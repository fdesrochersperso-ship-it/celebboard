import { createHmac, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type HubSpotTokens = {
  access_token: string
  refresh_token: string
  expires_in: number
}

export type HubSpotTokenInfo = {
  hub_id: string
  hub_domain: string
  user?: string
  scopes?: string[]
  token?: string
  token_type?: string
  expires_in?: number
  app_id?: string
  user_id?: string
  [key: string]: unknown
}

type IntegrationCredentials = {
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  [key: string]: unknown
}

type Integration = {
  id: string
  credentials?: IntegrationCredentials | Record<string, unknown> | string | null
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize'
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token'
const HUBSPOT_ACCESS_TOKENS_URL = 'https://api.hubapi.com/oauth/v1/access-tokens'

const SCOPES = [
  'crm.objects.contacts.read',
  'crm.objects.companies.read',
  'crm.objects.deals.read',
  'crm.objects.owners.read',
  'crm.schemas.contacts.read',
  'crm.schemas.companies.read',
  'crm.schemas.deals.read',
  'crm.schemas.custom.read',
].join(' ')

const TOKEN_BUFFER_MINUTES = 5

// -----------------------------------------------------------------------------
// State token (HMAC-signed orgId for CSRF protection)
// -----------------------------------------------------------------------------

function signState(orgId: string): string {
  const secret = process.env.HUBSPOT_CLIENT_SECRET
  if (!secret) {
    throw new Error('HUBSPOT_CLIENT_SECRET is not set')
  }
  const signature = createHmac('sha256', secret).update(orgId).digest('hex')
  return `${orgId}.${signature}`
}

export function verifyState(state: string): string | null {
  const secret = process.env.HUBSPOT_CLIENT_SECRET
  if (!secret || !state) return null

  const dot = state.indexOf('.')
  if (dot === -1) return null

  const orgId = state.slice(0, dot)
  const providedSig = state.slice(dot + 1)

  const expectedSig = createHmac('sha256', secret).update(orgId).digest('hex')

  try {
    if (
      providedSig.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(expectedSig, 'hex'))
    ) {
      return null
    }
  } catch {
    return null
  }

  return orgId
}

// -----------------------------------------------------------------------------
// Redirect URI (OAuth callback URL)
// -----------------------------------------------------------------------------

function getHubSpotRedirectUri(): string {
  // Explicit override (e.g. custom domain, or local dev)
  if (process.env.HUBSPOT_REDIRECT_URI) {
    return process.env.HUBSPOT_REDIRECT_URI
  }
  // Vercel sets VERCEL_URL automatically (e.g. "your-app.vercel.app")
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/integrations/hubspot/callback`
  }
  // Local development fallback
  return 'http://localhost:3000/api/integrations/hubspot/callback'
}

// -----------------------------------------------------------------------------
// 1. getHubSpotAuthUrl
// -----------------------------------------------------------------------------

export function getHubSpotAuthUrl(orgId: string): string {
  const clientId = process.env.HUBSPOT_CLIENT_ID
  if (!clientId) {
    throw new Error('HUBSPOT_CLIENT_ID must be set')
  }

  const state = signState(orgId)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getHubSpotRedirectUri(),
    scope: SCOPES,
    state,
  })

  return `${HUBSPOT_AUTH_URL}?${params.toString()}`
}

// -----------------------------------------------------------------------------
// 2. exchangeCodeForTokens
// -----------------------------------------------------------------------------

export async function exchangeCodeForTokens(code: string): Promise<HubSpotTokens> {
  const clientId = process.env.HUBSPOT_CLIENT_ID
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be set')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getHubSpotRedirectUri(),
    code,
  })

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = (await res.json()) as HubSpotTokens & { error?: string; message?: string }

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `HubSpot token exchange failed: ${res.status}`)
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}

// -----------------------------------------------------------------------------
// 3. refreshAccessToken
// -----------------------------------------------------------------------------

export async function refreshAccessToken(refreshToken: string): Promise<HubSpotTokens> {
  const clientId = process.env.HUBSPOT_CLIENT_ID
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be set')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  })

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = (await res.json()) as HubSpotTokens & { error?: string; message?: string }

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `HubSpot token refresh failed: ${res.status}`)
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}

// -----------------------------------------------------------------------------
// 4. getValidToken
// -----------------------------------------------------------------------------

function normalizeCredentials(
  raw: unknown
): IntegrationCredentials {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      return (JSON.parse(raw) as IntegrationCredentials) ?? {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as IntegrationCredentials
  }
  return {}
}

export async function getValidToken(
  integration: Integration,
  supabase: SupabaseClient
): Promise<string> {
  const creds = normalizeCredentials(integration.credentials)
  const accessToken = creds.access_token
  const refreshToken = creds.refresh_token

  // OAuth: need both tokens for refresh flow
  if (accessToken && refreshToken) {
    // Normal OAuth path
  } else if (accessToken && !refreshToken) {
    // Legacy PAT (private app token) - no refresh, use as-is
    return accessToken
  } else {
    throw new Error(
      `HubSpot integration missing access_token or refresh_token. ` +
        `Credentials keys: ${Object.keys(creds).join(', ') || '(empty)'}`
    )
  }

  const expiresAt = creds.token_expires_at
  const bufferMs = TOKEN_BUFFER_MINUTES * 60 * 1000
  const now = Date.now()

  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime()
    if (expiresMs > now + bufferMs) {
      return accessToken
    }
  }

  const tokens = await refreshAccessToken(refreshToken)
  const tokenExpiresAt = new Date(now + tokens.expires_in * 1000).toISOString()

  const updatedCredentials: IntegrationCredentials = {
    ...creds,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: tokenExpiresAt,
  }

  const { error } = await supabase
    .from('integrations')
    .update({
      credentials: updatedCredentials,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id)

  if (error) {
    throw new Error(`Failed to update integration tokens: ${error.message}`)
  }

  return tokens.access_token
}

// -----------------------------------------------------------------------------
// 5. getTokenInfo
// -----------------------------------------------------------------------------

export async function getTokenInfo(accessToken: string): Promise<HubSpotTokenInfo> {
  const url = `${HUBSPOT_ACCESS_TOKENS_URL}/${encodeURIComponent(accessToken)}`

  const res = await fetch(url)

  const data = (await res.json()) as HubSpotTokenInfo & { status?: string; message?: string }

  if (!res.ok) {
    throw new Error(data.message ?? data.status ?? `HubSpot token info failed: ${res.status}`)
  }

  return data
}
