import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { uploadTeamPhoto, UploadError } from '@/lib/storage/upload'
import { type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const orgId = formData.get('orgId') as string | null
    const memberId = formData.get('memberId') as string | null

    if (!file || !orgId || !memberId) {
      return NextResponse.json(
        { error: 'Missing file, orgId, or memberId' },
        { status: 400 }
      )
    }

    if (typeof (file as File).size === 'number' && (file as File).size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    const supabaseService = createServiceClient()

    // Verify org and member exist, member belongs to org
    const { data: member, error: memberError } = await supabaseService
      .from('team_members')
      .select('id, org_id')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // If authenticated, verify user is org member
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
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (user) {
      const { data: membership } = await supabaseAuth
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json(
          { error: 'Not a member of this organization' },
          { status: 403 }
        )
      }
    }
    // If not authenticated: allow (invite flow — URL is the secret)

    const publicUrl = await uploadTeamPhoto(file, orgId, memberId)

    const { error: updateError } = await supabaseService
      .from('team_members')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('org_id', orgId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update team member photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ photoUrl: publicUrl })
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      )
    }
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Team photo upload error:', err)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
