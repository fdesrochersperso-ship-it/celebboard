import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { randomBytes } from 'crypto'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'org'
}

function generateDisplayToken(): string {
  return randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orgName, userId } = body

    if (!orgName || typeof orgName !== 'string' || !userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid orgName and userId' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const baseSlug = slugify(orgName)
    let slug = baseSlug
    let slugSuffix = 0

    // Ensure unique slug
    while (true) {
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break
      slug = `${baseSlug}-${++slugSuffix}`
    }

    const displayToken = generateDisplayToken()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName.trim(),
        slug,
        display_token: displayToken,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Failed to create organization:', orgError)
      return NextResponse.json(
        { error: orgError.message },
        { status: 500 }
      )
    }

    const { error: memberError } = await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: userId,
      role: 'owner',
    })

    if (memberError) {
      console.error('Failed to create org member:', memberError)
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: memberError.message },
        { status: 500 }
      )
    }

    const { error: configError } = await supabase.from('dashboard_config').insert({
      org_id: org.id,
    })

    if (configError) {
      console.error('Failed to create dashboard config:', configError)
      await supabase.from('org_members').delete().eq('org_id', org.id)
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: configError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(org)
  } catch (err) {
    console.error('setup-org error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
