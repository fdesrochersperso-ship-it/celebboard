import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const ToggleSchema = z.object({
  isActive: z.boolean(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: templateId } = await params

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!membership?.org_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      )
    }

    const orgId = membership.org_id

    const { data: template, error: templateError } = await supabase
      .from('celebration_templates')
      .select('id, org_id')
      .eq('id', templateId)
      .eq('org_id', orgId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = ToggleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body: isActive must be boolean' },
        { status: 400 }
      )
    }

    const { isActive } = parsed.data

    const { error: updateTemplateError } = await supabase
      .from('celebration_templates')
      .update({ is_active: isActive })
      .eq('id', templateId)
      .eq('org_id', orgId)

    if (updateTemplateError) {
      return NextResponse.json(
        { error: updateTemplateError.message },
        { status: 500 }
      )
    }

    const { error: updateTriggersError } = await supabase
      .from('celebration_triggers')
      .update({ is_active: isActive })
      .eq('template_id', templateId)
      .eq('org_id', orgId)

    if (updateTriggersError) {
      return NextResponse.json(
        { error: updateTriggersError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Celebrations toggle error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
