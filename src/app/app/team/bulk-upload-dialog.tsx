'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, Loader2, X } from 'lucide-react'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

type Member = {
  id: string
  name: string
  email: string | null
  photo_url: string | null
}

function slugToName(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function fuzzyMatchFilename(filename: string, members: Member[]): Member | null {
  const base = filename.replace(/\.[^/.]+$/, '')
  const nameFromFile = slugToName(base).toLowerCase()
  if (!nameFromFile) return null

  for (const m of members) {
    const memberName = m.name.toLowerCase().replace(/\s+/g, ' ')
    if (memberName === nameFromFile) return m
    if (memberName.replace(/\s/g, '') === nameFromFile.replace(/\s/g, '')) return m
    if (memberName.includes(nameFromFile) || nameFromFile.includes(memberName)) return m
  }
  return null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  members: Member[]
  onSuccess: () => void
}

type PendingFile = {
  file: File
  preview: string
  memberId: string | null
  status: 'pending' | 'uploading' | 'done' | 'error'
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  orgId,
  members,
  onSuccess,
}: Props) {
  const [files, setFiles] = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview))
      return []
    })
    setUploading(false)
    setProgress({ done: 0, total: 0 })
    setError('')
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return
      const valid: PendingFile[] = []
      const invalid: string[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (!ACCEPT.split(',').some((t) => file.type === t.trim())) {
          invalid.push(`${file.name}: wrong type`)
          continue
        }
        if (file.size > MAX_SIZE) {
          invalid.push(`${file.name}: too large`)
          continue
        }
        const matched = fuzzyMatchFilename(file.name, members)
        valid.push({
          file,
          preview: URL.createObjectURL(file),
          memberId: matched?.id ?? null,
          status: 'pending',
        })
      }

      if (invalid.length > 0) {
        setError(invalid.slice(0, 3).join('; ') + (invalid.length > 3 ? '...' : ''))
      }
      setFiles((prev) => [...prev, ...valid])
    },
    [members]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    processFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[idx].preview)
      next.splice(idx, 1)
      return next
    })
  }

  const setMemberFor = (idx: number, memberId: string | null) => {
    setFiles((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], memberId }
      return next
    })
  }

  const handleUploadAll = async () => {
    const toUpload = files.filter((f) => f.memberId && f.status === 'pending')
    if (toUpload.length === 0) {
      setError('Assign each photo to a team member before uploading.')
      return
    }

    setError('')
    setUploading(true)
    setProgress({ done: 0, total: toUpload.length })

    let done = 0
    for (let i = 0; i < files.length; i++) {
      const item = files[i]
      if (!item.memberId || item.status !== 'pending') continue

      setFiles((prev) => {
        const next = [...prev]
        next[i] = { ...next[i], status: 'uploading' }
        return next
      })

      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('orgId', orgId)
        formData.append('memberId', item.memberId)
        const res = await fetch('/api/team-photo/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')

        setFiles((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'done' }
          return next
        })
      } catch (err) {
        setFiles((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'error' }
          return next
        })
        setError(err instanceof Error ? err.message : 'Upload failed')
      }

      done++
      setProgress({ done, total: toUpload.length })
    }

    setUploading(false)
    const allDone = files.every(
      (f) => f.status === 'done' || (f.status === 'pending' && !f.memberId)
    )
    if (allDone || done > 0) {
      onSuccess()
      if (done === toUpload.length && !error) {
        handleOpenChange(false)
      }
    }
  }

  const pendingCount = files.filter((f) => f.memberId && f.status === 'pending').length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Photos</DialogTitle>
          <DialogDescription>
            Drag photos here, then assign each to a team member. Names like &quot;francis-dufresne.jpg&quot; are auto-matched.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <Upload className="mb-2 size-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Drop images or click to browse
          </p>
          <p className="text-muted-foreground text-xs">
            JPG, PNG, WebP. Max 5MB each.
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex-1 overflow-auto">
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((item, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col overflow-hidden rounded-lg border bg-card"
                >
                  <div className="relative aspect-square">
                    <img
                      src={item.preview}
                      alt=""
                      className="size-full object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-1 top-1 size-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(idx)
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="size-6 animate-spin text-white" />
                      </div>
                    )}
                    {item.status === 'done' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30">
                        <span className="text-lg font-bold text-white">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <Select
                      value={item.memberId ?? '__none__'}
                      onValueChange={(v) =>
                        setMemberFor(idx, v === '__none__' ? null : v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Assign to…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <p className="text-muted-foreground text-sm">
            {progress.done} of {progress.total} uploaded
          </p>
        )}

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadAll}
            disabled={uploading || pendingCount === 0 || members.length === 0}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Upload All ({pendingCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
