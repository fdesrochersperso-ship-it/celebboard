'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MemberDialog } from './member-dialog'
import { BulkUploadDialog } from './bulk-upload-dialog'
import { Plus, Pencil, Trash2, Users, Link2, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Member = {
  id: string
  name: string
  email: string | null
  photo_url: string | null
  external_ids: Record<string, string>
  created_at: string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

type Integration = {
  id: string
  type: string
}

export default function TeamPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [members, setMembers] = useState<Member[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('team_members')
      .select('id, name, email, photo_url, external_ids, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    setMembers((data as Member[]) ?? [])
    setLoading(false)
  }, [orgId])

  const fetchIntegrations = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('integrations')
      .select('id, type')
      .eq('org_id', orgId)
    setIntegrations((data as Integration[]) ?? [])
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchMembers()
      fetchIntegrations()
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading, fetchMembers, fetchIntegrations])

  const hubspotIntegration = integrations.find((i) => i.type === 'hubspot')
  const slackIntegration = integrations.find((i) => i.type === 'slack')

  const handleSync = async (integrationId: string) => {
    setSyncingId(integrationId)
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      toast.success(`Synced: ${data.created ?? 0} created, ${data.updated ?? 0} updated`)
      fetchMembers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      m.name.toLowerCase().includes(q) ||
      (m.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team member?')) return
    const supabase = createClient()
    await supabase.from('team_members').delete().eq('id', id)
    fetchMembers()
  }

  const handleEdit = (m: Member) => {
    setEditingMember(m)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setEditingMember(null)
  }

  if (orgLoading || (!orgId && !orgLoading)) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Team</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Team</h1>
      <p className="mb-6 text-muted-foreground">
        Manage team members and sync photos from your connected integrations.
      </p>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {hubspotIntegration && (
            <Button
              variant="outline"
              size="sm"
              disabled={!!syncingId}
              onClick={() => handleSync(hubspotIntegration.id)}
            >
              {syncingId === hubspotIntegration.id ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Sync from HubSpot
            </Button>
          )}
          {slackIntegration && (
            <Button
              variant="outline"
              size="sm"
              disabled={!!syncingId}
              onClick={() => handleSync(slackIntegration.id)}
            >
              {syncingId === slackIntegration.id ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Sync from Slack
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkUploadOpen(true)}
            disabled={members.length === 0}
          >
            <Upload className="mr-1 size-4" />
            Bulk Upload Photos
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!orgId) return
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${orgId}`
                  navigator.clipboard.writeText(url)
                  toast.success('Team photo link copied to clipboard')
                }}
              >
                <Link2 className="mr-1 size-4" />
                Team Photo Link
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Share this link with your team so they can upload their own photos
            </TooltipContent>
          </Tooltip>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-1 size-4" />
          Add Member
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading team members...</p>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="mb-2 size-12 text-muted-foreground" />
          <p className="mb-2 font-medium">No team members yet</p>
          <p className="mb-4 text-center text-muted-foreground text-sm">
            Add team members manually or sync from HubSpot/Slack when available.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-1 size-4" />
            Add Member
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>External IDs</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No members match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Avatar className="size-9">
                        <AvatarImage src={member.photo_url ?? undefined} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(member.external_ids ?? {}).map(([k, v]) => (
                          <Badge key={k} variant="secondary" className="font-mono text-xs">
                            {k}: {String(v).slice(0, 12)}
                            {String(v).length > 12 ? '…' : ''}
                          </Badge>
                        ))}
                        {(!member.external_ids || Object.keys(member.external_ids).length === 0) && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(member.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <MemberDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        orgId={orgId ?? ''}
        onSuccess={fetchMembers}
        member={editingMember}
      />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        orgId={orgId ?? ''}
        members={members}
        onSuccess={fetchMembers}
      />
    </div>
  )
}
