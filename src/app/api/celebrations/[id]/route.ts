import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const ConditionSchema = z.object({
  field: z.string(),
  operator: z.string().optional(),
  op: z.string().optional(),
  value: z.unknown(),
  property_type: z.string().optional(),
  property_label: z.string().optional(),
})

const UpdateCelebrationSchema = z.object({
  name: z.string().min(1).optional(),
  title_pattern: z.string().min(1).optional(),
  subtitle_pattern: z.string().optional(),
  visual_style: z.enum(['confetti', 'fireworks', 'champagne']).optional(),
  sound: z.string().optional(),
  duration_seconds: z.number().min(10).max(60).optional(),
  show_counter: z.boolean().optional(),
  counter_label: z.string().optional(),
  counter_source: z.string().optional(),
  show_photos: z.boolean().optional(),
  photo_fields: z.array(z.string()).optional(),
  integration_id: z.string().uuid().optional(),
  event_type: z.string().optional(),
  conditions: z.array(ConditionSchema).optional(),
  field_mapping: z.record(z.string(), z.string()).optional(),
  is_active: z.boolean().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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
      .single()

    if (templateError || !template || template.org_id !== orgId) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = UpdateCelebrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: String(parsed.error) },
        { status: 400 }
      )
    }

    const payload = parsed.data

    const templateUpdate: Record<string, unknown> = {}
    if (payload.name != null) templateUpdate.name = payload.name
    if (payload.title_pattern != null) templateUpdate.title_pattern = payload.title_pattern
    if (payload.subtitle_pattern != null) templateUpdate.subtitle_pattern = payload.subtitle_pattern
    if (payload.visual_style != null) templateUpdate.visual_style = payload.visual_style
    if (payload.sound != null) templateUpdate.sound = payload.sound
    if (payload.duration_seconds != null) templateUpdate.duration_seconds = payload.duration_seconds
    if (payload.show_counter != null) templateUpdate.show_counter = payload.show_counter
    if (payload.counter_label != null) templateUpdate.counter_label = payload.counter_label
    if (payload.counter_source != null) templateUpdate.counter_source = payload.counter_source
    if (payload.show_photos != null) templateUpdate.show_photos = payload.show_photos
    if (payload.photo_fields != null) templateUpdate.photo_fields = payload.photo_fields
    if (payload.is_active != null) templateUpdate.is_active = payload.is_active

    if (Object.keys(templateUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('celebration_templates')
        .update(templateUpdate)
        .eq('id', templateId)
        .eq('org_id', orgId)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }
    }

    const { data: trigger } = await supabase
      .from('celebration_triggers')
      .select('id')
      .eq('template_id', templateId)
      .eq('org_id', orgId)
      .limit(1)
      .maybeSingle()

    if (trigger) {
      const triggerUpdate: Record<string, unknown> = {}
      if (payload.name != null) triggerUpdate.name = payload.name
      if (payload.integration_id != null) triggerUpdate.integration_id = payload.integration_id
      if (payload.event_type != null) triggerUpdate.event_type = payload.event_type
      if (payload.conditions != null) triggerUpdate.conditions = payload.conditions
      if (payload.field_mapping != null) triggerUpdate.field_mapping = payload.field_mapping
      if (payload.is_active != null) triggerUpdate.is_active = payload.is_active

      if (Object.keys(triggerUpdate).length > 0) {
        await supabase
          .from('celebration_triggers')
          .update(triggerUpdate)
          .eq('id', trigger.id)
          .eq('org_id', orgId)
      }
    }

    return NextResponse.json({
      success: true,
      data: { templateId },
    })
  } catch (err) {
    console.error('Celebrations PUT error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

    const { error: deleteError } = await supabase
      .from('celebration_templates')
      .delete()
      .eq('id', templateId)
      .eq('org_id', orgId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Celebrations DELETE error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
