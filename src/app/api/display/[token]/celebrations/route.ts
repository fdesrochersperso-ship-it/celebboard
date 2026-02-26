import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)
    const idParam = searchParams.get('id')

    const supabase = createServiceClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('display_token', token)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Invalid display token' }, { status: 404 })
    }

    const baseQuery = supabase
      .from('celebrations')
      .select(`
        id, title, subtitle, amount, created_at, team_member_ids,
        celebration_templates ( visual_style, sound, duration_seconds )
      `)
      .eq('org_id', org.id)

    const { data: celebrationsData, error } = idParam
      ? await baseQuery.eq('id', idParam).maybeSingle()
      : await baseQuery.order('created_at', { ascending: false }).limit(limit)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch celebrations' }, { status: 500 })
    }

    const celebrationsList = idParam
      ? celebrationsData ? [celebrationsData] : []
      : (celebrationsData ?? [])

    if (idParam && celebrationsList.length === 0) {
      return NextResponse.json({ error: 'Celebration not found' }, { status: 404 })
    }

    const memberIds = new Set<string>()
    for (const c of celebrationsList) {
      for (const id of (c.team_member_ids as string[]) ?? []) {
        if (id) memberIds.add(id)
      }
    }

    let membersMap: Record<string, { id: string; name: string; photo_url: string | null }> = {}
    if (memberIds.size > 0) {
      const { data: members } = await supabase
        .from('team_members')
        .select('id, name, photo_url')
        .in('id', [...memberIds])
      for (const m of members ?? []) {
        membersMap[m.id] = { id: m.id, name: m.name, photo_url: m.photo_url }
      }
    }

    return NextResponse.json({
      celebrations: celebrationsList.map((c) => {
        const memberIdsList = (c.team_member_ids as string[]) ?? []
        const team_members = memberIdsList
          .map((id) => membersMap[id])
          .filter(Boolean)
        const template = c.celebration_templates as {
          visual_style?: string
          sound?: string
          duration_seconds?: number
        } | null
        return {
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          amount: c.amount != null ? Number(c.amount) : null,
          created_at: c.created_at,
          team_members,
          visual_style: template?.visual_style ?? 'confetti',
          sound: template?.sound ?? 'victory',
          duration_seconds: template?.duration_seconds ?? 20,
        }
      }),
    })
  } catch (err) {
    console.error('Display celebrations error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
