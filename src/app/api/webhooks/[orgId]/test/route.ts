import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ orgId: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { orgId } = await params

    if (!orgId) {
      return NextResponse.json({ error: 'Missing org ID' }, { status: 400 })
    }

    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const title = typeof body.title === 'string' ? body.title : 'Test Celebration!'
    const subtitle =
      typeof body.subtitle === 'string' ? body.subtitle : 'Created via test webhook'
    const amountRaw = body.amount
    const amount =
      typeof amountRaw === 'number' ? amountRaw : typeof amountRaw === 'string' ? parseFloat(amountRaw) : null

    const supabase = createServiceClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const externalId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const { data: celebration, error: insertError } = await supabase
      .from('celebrations')
      .insert({
        org_id: orgId,
        title,
        subtitle,
        amount: amount != null && !isNaN(amount) ? amount : null,
        status: 'pending',
        external_id: externalId,
        metadata: body,
      })
      .select('id, title, subtitle, amount')
      .single()

    if (insertError) {
      console.error('Test webhook insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      celebration: {
        id: celebration.id,
        title: celebration.title,
        subtitle: celebration.subtitle,
        amount: celebration.amount,
      },
    })
  } catch (err) {
    console.error('Test webhook error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
