import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const supabase = createServiceClient()
  const { data: rows, error } = await supabase
    .from('organizations')
    .select('id, name, display_token')
    .limit(5)

  if (error) {
    console.error('Dev display-token error:', error)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
  if (!data?.display_token) {
    return NextResponse.json({
      error: 'No organizations with display_token found. Create an org first at /app.',
      hint: 'Go to /app, sign up, and create an organization.',
    }, { status: 404 })
  }

  return NextResponse.json({
    org_id: data.id,
    org_name: data.name,
    display_token: data.display_token,
    display_url: `http://localhost:3000/display/${data.display_token}`,
  })
}
