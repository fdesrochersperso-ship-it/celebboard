import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { getHubSpotAuthUrl } from '@/lib/connectors/hubspot/auth'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('org_id')
    if (!orgId) {
      return NextResponse.redirect(
        new URL('/app/integrations?error=missing_org_id', request.url)
      )
    }

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
    if (!user) {
      return NextResponse.redirect(
        new URL('/app/integrations?error=unauthorized', request.url)
      )
    }

    const supabase = createServiceClient()
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.redirect(
        new URL('/app/integrations?error=forbidden', request.url)
      )
    }

    const authUrl = getHubSpotAuthUrl(orgId)
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('HubSpot authorize error:', err)
    return NextResponse.redirect(
      new URL('/app/integrations?error=connection_failed', request.url)
    )
  }
}
