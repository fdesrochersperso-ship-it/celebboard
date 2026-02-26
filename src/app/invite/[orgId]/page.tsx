'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, Upload } from 'lucide-react'

type Member = {
  id: string
  name: string
  photoUrl: string | null
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPT = 'image/jpeg,image/png,image/webp'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function InvitePage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [orgName, setOrgName] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!orgId) return
    fetch(`/api/invite/${orgId}/members`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setOrgName(data.orgName ?? '')
        setMembers(data.members ?? [])
      })
      .catch(() => setError('Could not load team members.'))
      .finally(() => setLoading(false))
  }, [orgId])

  const handleCardClick = (id: string) => {
    setSelectedId(id)
    setSuccess(false)
    setError('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    if (!ACCEPT.split(',').some((t) => file.type === t.trim())) {
      setError('Please use JPG, PNG, or WebP.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 5MB.')
      return
    }

    setError('')
    setUploading(true)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orgId', orgId)
      formData.append('memberId', selectedId)
      const res = await fetch('/api/team-photo/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedId ? { ...m, photoUrl: data.photoUrl } : m
        )
      )
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error && members.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 p-4">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {orgName || 'Team Photos'}
          </h1>
          <p className="mt-2 text-zinc-600">
            Add your photo so you appear in celebrations
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="size-5" />
            </div>
            <div>
              <p className="font-medium">Photo uploaded!</p>
              <p className="text-sm opacity-90">You can update it anytime.</p>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-4 text-center text-destructive text-sm">{error}</p>
        )}

        {members.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No team members yet. Ask your admin to add you.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
            <Card
              key={member.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === member.id
                  ? 'ring-2 ring-primary ring-offset-2'
                  : ''
              }`}
              onClick={() => handleCardClick(member.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="size-14">
                  <AvatarImage src={member.photoUrl ?? undefined} alt={member.name} />
                  <AvatarFallback className="bg-zinc-200 text-zinc-600">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">{member.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {member.photoUrl ? 'Click to update photo' : 'Add your photo'}
                  </p>
                </div>
                {selectedId === member.id && (
                  <Button
                    size="sm"
                    disabled={uploading}
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    {uploading ? (
                      'Uploading...'
                    ) : (
                      <>
                        <Upload className="mr-1 size-4" />
                        {member.photoUrl ? 'Change' : 'Upload'}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {selectedId && !success && members.length > 0 && (
          <p className="mt-6 text-center text-muted-foreground text-sm">
            Tap &quot;Upload&quot; or &quot;Change&quot; to select a photo (JPG, PNG, WebP, max 5MB)
          </p>
        )}
      </div>
    </div>
  )
}
