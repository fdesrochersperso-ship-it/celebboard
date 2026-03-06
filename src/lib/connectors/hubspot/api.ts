import type { SupabaseClient } from '@supabase/supabase-js'
import { getValidToken, refreshAccessToken } from './auth'

const HUBSPOT_API_BASE = 'https://api.hubapi.com'
const MAX_PAGINATED_RESULTS = 10_000

type Integration = {
  id: string
  credentials: Record<string, unknown>
}

type HubSpotPagedResponse = {
  results?: unknown[]
  paging?: { next?: { after?: string } }
  [key: string]: unknown
}

async function fetchWithToken(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

async function parseErrorResponse(res: Response): Promise<string> {
  const text = await res.text()
  let body: string
  try {
    const json = JSON.parse(text) as { message?: string; error?: string }
    body = json.message ?? json.error ?? text
  } catch {
    body = text || res.statusText
  }
  return `HubSpot API error ${res.status}: ${body}`
}

export function hubspotApi(
  integration: Integration,
  supabase: SupabaseClient
) {
  return {
    async get(
      endpoint: string,
      params?: Record<string, string>
    ): Promise<unknown> {
      const token = await getValidToken(integration, supabase)
      const url = new URL(`${HUBSPOT_API_BASE}/${endpoint.replace(/^\//, '')}`)
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      }

      let res = await fetchWithToken(url.toString(), token)

      if (res.status === 401) {
        const refreshToken = integration.credentials.refresh_token as string
        if (!refreshToken) {
          throw new Error(await parseErrorResponse(res))
        }
        const tokens = await refreshAccessToken(refreshToken)
        const tokenExpiresAt = new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString()
        await supabase
          .from('integrations')
          .update({
            credentials: {
              ...integration.credentials,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_expires_at: tokenExpiresAt,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id)

        res = await fetchWithToken(url.toString(), tokens.access_token)
      }

      if (!res.ok) {
        throw new Error(await parseErrorResponse(res))
      }

      return res.json()
    },

    async post(endpoint: string, body: unknown): Promise<unknown> {
      const token = await getValidToken(integration, supabase)
      const url = `${HUBSPOT_API_BASE}/${endpoint.replace(/^\//, '')}`

      let res = await fetchWithToken(url, token, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (res.status === 401) {
        const refreshToken = integration.credentials.refresh_token as string
        if (!refreshToken) {
          throw new Error(await parseErrorResponse(res))
        }
        const tokens = await refreshAccessToken(refreshToken)
        const tokenExpiresAt = new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString()
        await supabase
          .from('integrations')
          .update({
            credentials: {
              ...integration.credentials,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_expires_at: tokenExpiresAt,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id)

        res = await fetchWithToken(url, tokens.access_token, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        throw new Error(await parseErrorResponse(res))
      }

      return res.json()
    },

    async getAll(
      endpoint: string,
      params?: Record<string, string>
    ): Promise<unknown[]> {
      const allResults: unknown[] = []
      let after: string | undefined

      while (allResults.length < MAX_PAGINATED_RESULTS) {
        const queryParams: Record<string, string> = {
          ...params,
          limit: '100',
        }
        if (after) {
          queryParams.after = after
        }

        const data = (await this.get(endpoint, queryParams)) as HubSpotPagedResponse
        const results = data.results ?? []
        allResults.push(...results)

        after = data.paging?.next?.after
        if (!after || results.length === 0) break
      }

      if (allResults.length >= MAX_PAGINATED_RESULTS) {
        console.warn(
          `HubSpot getAll hit safety cap of ${MAX_PAGINATED_RESULTS} for ${endpoint}`
        )
      }

      return allResults
    },
  }
}
