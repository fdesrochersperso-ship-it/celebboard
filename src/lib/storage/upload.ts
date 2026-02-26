import { createServiceClient } from '@/lib/supabase-server'

const BUCKET = 'team-photos'
// Create the bucket in Supabase Dashboard: Storage → New bucket → "team-photos" → Public
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export class UploadError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TYPE' | 'TOO_LARGE' | 'UPLOAD_FAILED'
  ) {
    super(message)
    this.name = 'UploadError'
  }
}

/**
 * Upload a team photo to Supabase Storage.
 * Returns the public URL of the uploaded file.
 * Requires the team-photos bucket to exist and be public.
 */
export async function uploadTeamPhoto(
  file: File | Blob | { buffer: ArrayBuffer; name: string; type: string; size: number },
  orgId: string,
  memberId: string
): Promise<string> {
  let buffer: ArrayBuffer
  try {
    buffer =
      file instanceof Blob
        ? await file.arrayBuffer()
        : 'buffer' in file
          ? (file as { buffer: ArrayBuffer }).buffer
          : await (file as File).arrayBuffer()
  } catch (e) {
    console.error('Failed to read file:', e)
    throw new UploadError('Could not read file. Try a smaller image.', 'UPLOAD_FAILED')
  }
  const type =
    file instanceof Blob
      ? file.type
      : 'type' in file
        ? (file as { type: string }).type
        : (file as File).type
  const size =
    file instanceof Blob
      ? file.size
      : 'size' in file
        ? (file as { size: number }).size
        : (file as File).size

  if (!ALLOWED_TYPES.includes(type)) {
    throw new UploadError(
      'Invalid file type. Use JPG, PNG, or WebP.',
      'INVALID_TYPE'
    )
  }

  if (size > MAX_SIZE_BYTES) {
    throw new UploadError(
      `File too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024}MB.`,
      'TOO_LARGE'
    )
  }

  const ext = EXT_MAP[type] ?? 'jpg'
  const path = `${orgId}/${memberId}.${ext}`

  const supabase = createServiceClient()

  // Ensure bucket exists (idempotent)
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }).catch(() => {}) // Ignore if bucket already exists

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: type,
    upsert: true,
  })

  if (error) {
    console.error('Storage upload error:', error)
    const msg =
      error.message?.includes('Bucket not found') || error.message?.includes('does not exist')
        ? 'Storage bucket "team-photos" not found. Create it in Supabase Dashboard → Storage.'
        : error.message ?? 'Upload failed.'
    throw new UploadError(msg, 'UPLOAD_FAILED')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
