import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params

    const supabase = createServiceClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('display_token', token)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Invalid display token' }, { status: 404 })
    }

    const { data: items, error } = await supabase
      .from('feed_items')
      .select('id, author_name, content_type, image_url, text_content, source, metadata, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    return NextResponse.json({ items: items ?? [] })
  } catch (err) {
    console.error('Display feed error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
