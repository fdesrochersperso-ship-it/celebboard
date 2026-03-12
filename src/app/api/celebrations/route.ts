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

const CreateCelebrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title_pattern: z.string().min(1, 'Title pattern is required'),
  subtitle_pattern: z.string().optional(),
  visual_style: z.enum(['confetti', 'fireworks', 'champagne']),
  sound: z.string().min(1),
  duration_seconds: z.number().min(10).max(60),
  show_counter: z.boolean(),
  counter_label: z.string().optional(),
  counter_source: z.string().optional(),
  show_photos: z.boolean(),
  photo_fields: z.array(z.string()),
  integration_id: z.string().uuid(),
  event_type: z.string().optional(),
  conditions: z.array(ConditionSchema),
  field_mapping: z.record(z.string(), z.string()),
  is_active: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
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
        { error: 'No organization found. Complete setup first.' },
        { status: 403 }
      )
    }

    const orgId = membership.org_id

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateCelebrationSchema.safeParse(body)
    if (!parsed.success) {
      const msg = String(parsed.error)
      return NextResponse.json({ error: msg || 'Validation failed' }, { status: 400 })
    }

    const payload = parsed.data

    const { data: integration } = await supabase
      .from('integrations')
      .select('id, org_id')
      .eq('id', payload.integration_id)
      .eq('org_id', orgId)
      .single()

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found or access denied' },
        { status: 404 }
      )
    }

    const { data: template, error: templateError } = await supabase
      .from('celebration_templates')
      .insert({
        org_id: orgId,
        name: payload.name,
        title_pattern: payload.title_pattern,
        subtitle_pattern: payload.subtitle_pattern ?? null,
        visual_style: payload.visual_style,
        sound: payload.sound,
        duration_seconds: payload.duration_seconds,
        show_counter: payload.show_counter,
        counter_label: payload.counter_label ?? null,
        counter_source: payload.counter_source ?? null,
        show_photos: payload.show_photos,
        photo_fields: payload.photo_fields,
        is_active: payload.is_active,
      })
      .select('id')
      .single()

    if (templateError || !template) {
      console.error('Template insert error:', templateError)
      return NextResponse.json(
        { error: templateError?.message ?? 'Failed to create template' },
        { status: 500 }
      )
    }

    const { data: trigger, error: triggerError } = await supabase
      .from('celebration_triggers')
      .insert({
        org_id: orgId,
        integration_id: payload.integration_id,
        template_id: template.id,
        name: payload.name,
        event_type: payload.event_type ?? null,
        conditions: payload.conditions,
        field_mapping: payload.field_mapping,
        is_active: payload.is_active,
      })
      .select('id')
      .single()

    if (triggerError || !trigger) {
      console.error('Trigger insert error:', triggerError)
      await supabase.from('celebration_templates').delete().eq('id', template.id)
      return NextResponse.json(
        { error: triggerError?.message ?? 'Failed to create trigger' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { templateId: template.id, triggerId: trigger.id },
    })
  } catch (err) {
    console.error('Celebrations POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
