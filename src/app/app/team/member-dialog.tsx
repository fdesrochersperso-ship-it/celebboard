'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-clients'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Upload, X } from 'lucide-react'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPT = 'image/jpeg,image/png,image/webp'

type ExternalIdRow = { key: string; value: string }

type MemberRow = {
  id: string
  name: string
  email: string | null
  photo_url: string | null
  external_ids: Record<string, string>
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess: () => void
  member?: MemberRow | null
}

export function MemberDialog({ open, onOpenChange, orgId, onSuccess, member }: Props) {
  const isEdit = !!member

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoUrlManual, setPhotoUrlManual] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [externalIds, setExternalIds] = useState<ExternalIdRow[]>([{ key: '', value: '' }])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (member) {
        setName(member.name)
        setEmail(member.email ?? '')
        setPhotoUrl(member.photo_url ?? '')
        setPhotoUrlManual('')
        setSelectedFile(null)
        const ids = (member.external_ids ?? {}) as Record<string, string>
        setExternalIds(
          Object.entries(ids).length > 0
            ? Object.entries(ids).map(([k, v]) => ({ key: k, value: String(v) }))
            : [{ key: '', value: '' }]
        )
      } else {
        setName('')
        setEmail('')
        setPhotoUrl('')
        setPhotoUrlManual('')
        setSelectedFile(null)
        setExternalIds([{ key: '', value: '' }])
      }
      setShowUrlInput(false)
      setError('')
    }
  }, [open, member])

  const [previewUrl, setPreviewUrl] = useState<string>('')
  useEffect(() => {
    if (photoUrl) {
      setPreviewUrl(photoUrl)
      return
    }
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl('')
  }, [photoUrl, selectedFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPT.split(',').some((t) => file.type === t.trim())) {
      setError('Please use JPG, PNG, or WebP.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 5MB.')
      return
    }
    setError('')
    setSelectedFile(file)
    setPhotoUrl('')
    setPhotoUrlManual('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    setPhotoUrl('')
    setPhotoUrlManual('')
    setError('')
  }

  const addExternalId = () => {
    setExternalIds((prev) => [...prev, { key: '', value: '' }])
  }

  const removeExternalId = (i: number) => {
    setExternalIds((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateExternalId = (i: number, field: keyof ExternalIdRow, value: string) => {
    setExternalIds((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const buildExternalIds = (): Record<string, string> => {
    const obj: Record<string, string> = {}
    for (const row of externalIds) {
      if (row.key.trim()) {
        obj[row.key.trim()] = row.value.trim()
      }
    }
    return obj
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const finalPhotoUrl = showUrlInput
      ? (photoUrlManual.trim() || null)
      : selectedFile
        ? null
        : (photoUrl || null)

    setLoading(true)
    try {
      const supabase = createClient()
      let memberIdToUse = member?.id

      if (isEdit) {
        if (selectedFile) {
          setUploading(true)
          const formData = new FormData()
          formData.append('file', selectedFile)
          formData.append('orgId', orgId)
          formData.append('memberId', member!.id)
          const res = await fetch('/api/team-photo/upload', {
            method: 'POST',
            body: formData,
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Upload failed')
          const payload = {
            name: name.trim(),
            email: email.trim() || null,
            photo_url: data.photoUrl,
            external_ids: buildExternalIds(),
          }
          const { error: updateError } = await supabase
            .from('team_members')
            .update(payload)
            .eq('id', member!.id)
          if (updateError) throw updateError
        } else {
          const payload = {
            name: name.trim(),
            email: email.trim() || null,
            photo_url: finalPhotoUrl,
            external_ids: buildExternalIds(),
          }
          const { error: updateError } = await supabase
            .from('team_members')
            .update(payload)
            .eq('id', member!.id)
          if (updateError) throw updateError
        }
      } else {
        const insertPayload = {
          org_id: orgId,
          name: name.trim(),
          email: email.trim() || null,
          photo_url: finalPhotoUrl,
          external_ids: buildExternalIds(),
        }
        const { data: inserted, error: insertError } = await supabase
          .from('team_members')
          .insert(insertPayload)
          .select('id')
          .single()

        if (insertError) throw insertError
        memberIdToUse = inserted?.id

        if (selectedFile && memberIdToUse) {
          setUploading(true)
          const formData = new FormData()
          formData.append('file', selectedFile)
          formData.append('orgId', orgId)
          formData.append('memberId', memberIdToUse)
          const res = await fetch('/api/team-photo/upload', {
            method: 'POST',
            body: formData,
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Upload failed')
          await supabase
            .from('team_members')
            .update({ photo_url: data.photoUrl })
            .eq('id', memberIdToUse)
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team member')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member' : 'Add Member'}</DialogTitle>
          <DialogDescription>
            Team members appear in celebrations when their external IDs match webhook payloads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Jane Smith"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
            {showUrlInput ? (
              <div className="space-y-2">
                <Input
                  placeholder="https://..."
                  value={photoUrlManual}
                  onChange={(e) => setPhotoUrlManual(e.target.value)}
                />
                <button
                  type="button"
                  className="text-muted-foreground text-xs underline hover:text-foreground"
                  onClick={() => {
                    setShowUrlInput(false)
                    setPhotoUrlManual('')
                  }}
                >
                  Upload file instead
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex items-center gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-muted-foreground/40 bg-muted/30 hover:border-muted-foreground/60"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Upload className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? 'Change photo' : 'Choose image'}
                    </Button>
                    <p className="text-muted-foreground text-xs">
                      JPG, PNG, or WebP. Max 5MB.
                    </p>
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={handleRemovePhoto}
                      >
                        <X className="mr-1 size-3" />
                        Remove
                      </Button>
                    )}
                    <button
                      type="button"
                      className="block text-muted-foreground text-xs underline hover:text-foreground"
                      onClick={() => setShowUrlInput(true)}
                    >
                      Paste URL instead
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>External IDs</Label>
            <p className="text-muted-foreground text-xs">
              Map to IDs from integrations (e.g. hubspot_owner_id, slack_user_id)
            </p>
            <div className="space-y-2">
              {externalIds.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="hubspot_owner_id"
                    value={row.key}
                    onChange={(e) => updateExternalId(i, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="12345678"
                    value={row.value}
                    onChange={(e) => updateExternalId(i, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExternalId(i)}
                    disabled={externalIds.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addExternalId}>
                <Plus className="mr-1 size-3.5" />
                Add external ID
              </Button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || uploading}>
            {uploading ? 'Uploading...' : loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
