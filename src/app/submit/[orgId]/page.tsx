'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ImageIcon, MessageSquare, Upload } from 'lucide-react'

const AUTHOR_STORAGE_KEY = 'celebboard_author_name'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPT = 'image/jpeg,image/png,image/webp'

type Mode = 'photo' | 'text'

type OrgInfo = {
  name: string
  logo_url: string | null
}

export default function SubmitPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('photo')
  const [authorName, setAuthorName] = useState('')
  const [textContent, setTextContent] = useState('')
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      setError('Invalid link. Check the URL.')
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    fetch(`/api/submit/${encodeURIComponent(orgId)}/info`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setOrgInfo({ name: data.name ?? '', logo_url: data.logo_url ?? null })
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setError('Request timed out. Check your connection.')
        } else {
          setError('Could not load organization.')
        }
      })
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
  }, [orgId])

  useEffect(() => {
    const stored = localStorage.getItem(AUTHOR_STORAGE_KEY)
    if (stored) setAuthorName(stored)
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError('')
    if (!file) {
      setImageFile(null)
      return
    }
    if (!ACCEPT.split(',').some((t) => file.type === t.trim())) {
      setError('Please use JPG, PNG, or WebP.')
      setImageFile(null)
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Photo must be under 5MB.')
      setImageFile(null)
      return
    }
    setImageFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = authorName.trim()
    if (!trimmed) {
      setError('Please enter your name.')
      return
    }

    if (mode === 'photo' && !imageFile) {
      setError('Please select a photo.')
      return
    }

    if (mode === 'text' && !textContent.trim()) {
      setError('Please enter a message.')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('author_name', trimmed)
      formData.append('content_type', mode)
      if (mode === 'photo') {
        formData.append('image', imageFile!)
        if (caption.trim()) formData.append('text_content', caption.trim())
      } else {
        formData.append('text_content', textContent.trim())
      }

      const res = await fetch(`/api/submit/${encodeURIComponent(orgId)}`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Failed to post')

      localStorage.setItem(AUTHOR_STORAGE_KEY, trimmed)
      setSuccess(true)
      setImageFile(null)
      setImagePreview(null)
      setTextContent('')
      setCaption('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePostAnother = () => {
    setSuccess(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error && !orgInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 p-6 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">Check the link and try again.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-zinc-50 px-6 py-12">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Check className="size-10" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Posted!</h2>
        <p className="mt-2 text-center text-zinc-600">Look up at the TV 📺</p>
        <Button
          size="lg"
          onClick={handlePostAnother}
          className="mt-10 min-h-14 min-w-[200px] text-base"
        >
          Post Another
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* Org header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {orgInfo?.logo_url && (
            <div className="relative size-16 overflow-hidden rounded-xl bg-white shadow-sm">
              <Image
                src={orgInfo.logo_url}
                alt=""
                fill
                className="object-contain"
                sizes="64px"
                unoptimized
              />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {orgInfo?.name ?? 'Share with the Team'}
          </h1>
          <p className="text-muted-foreground">Post to the dashboard</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode('photo')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-base font-medium transition-colors ${
              mode === 'photo'
                ? 'bg-primary text-primary-foreground'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <ImageIcon className="size-5" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-base font-medium transition-colors ${
              mode === 'text'
                ? 'bg-primary text-primary-foreground'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="size-5" />
            Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo mode */}
          {mode === 'photo' && (
            <>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-white py-12 transition-colors hover:border-primary hover:bg-zinc-50 active:bg-zinc-100"
                >
                  {imagePreview ? (
                    <div className="relative aspect-square w-32 overflow-hidden rounded-lg">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  ) : (
                    <Upload className="size-12 text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-600">
                    {imageFile ? 'Tap to change photo' : 'Tap to add a photo'}
                  </span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WebP · max 5MB</span>
                </button>
              </div>
              <div>
                <Label htmlFor="caption">Caption (optional)</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a short caption..."
                  className="mt-2 min-h-12 text-base"
                />
              </div>
            </>
          )}

          {/* Text mode */}
          {mode === 'text' && (
            <div>
              <Label htmlFor="message">Your message</Label>
              <textarea
                id="message"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Share something with the team..."
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-input bg-transparent px-3 py-3 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
            </div>
          )}

          {/* Author name */}
          <div>
            <Label htmlFor="author">Your name (required)</Label>
            <Input
              id="author"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Alex"
              className="mt-2 min-h-12 text-base"
              autoComplete="name"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full min-h-14 text-base"
          >
            {submitting ? 'Posting...' : 'Post to Dashboard'}
          </Button>
        </form>
      </div>
    </div>
  )
}
