import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { uploadFeedPhoto, UploadError } from '@/lib/storage/upload'
import type { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ orgId: string }>
}

const ALLOWED_CONTENT_TYPES = ['image', 'text'] as const

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgId } = await params
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const authorName = (formData.get('author_name') as string | null)?.trim()
    const contentType = formData.get('content_type') as string | null
    const textContent = (formData.get('text_content') as string | null)?.trim() || null
    const imageFile = formData.get('image') as File | null

    if (!authorName) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    let imageUrl: string | null = null

    if (contentType === 'image') {
      if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
        return NextResponse.json(
          { error: 'Please select a photo to upload' },
          { status: 400 }
        )
      }
      imageUrl = await uploadFeedPhoto(imageFile, orgId)
    }

    const { data: item, error } = await supabase
      .from('feed_items')
      .insert({
        org_id: orgId,
        author_name: authorName,
        content_type: contentType,
        image_url: imageUrl,
        text_content: textContent,
        source: 'qr_submission',
        metadata: {},
      })
      .select('id, author_name, content_type, image_url, text_content, created_at')
      .single()

    if (error) {
      console.error('Feed insert error:', error)
      return NextResponse.json(
        { error: 'Failed to post. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ item })
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('Submit feed error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
