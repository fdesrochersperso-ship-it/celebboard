import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ orgId: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { orgId } = await params

    const supabase = createServiceClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { data: members } = await supabase
      .from('team_members')
      .select('id, name, photo_url')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    return NextResponse.json({
      orgName: org.name,
      members: (members ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        photoUrl: m.photo_url,
      })),
    })
  } catch (err) {
    console.error('Invite members error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
