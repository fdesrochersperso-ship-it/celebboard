'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RotateCcw } from 'lucide-react'

const PAGE_SIZE = 20

type Celebration = {
  id: string
  title: string
  subtitle: string | null
  amount: number | null
  status: string
  created_at: string
  displayed_at: string | null
  celebration_templates: { name: string } | null
}

const STATUS_CONFIG: Record<string, { className: string }> = {
  pending: { className: 'bg-amber-100 text-amber-800 border-amber-200' },
  displayed: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  skipped: { className: 'bg-muted text-muted-foreground' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function HistoryPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchCelebrations = useCallback(
    async (offset = 0) => {
      if (!orgId) return

      if (offset === 0) setLoading(true)
      else setLoadingMore(true)

      const supabase = createClient()
      let query = supabase
        .from('celebrations')
        .select(
          `
          id,
          title,
          subtitle,
          amount,
          status,
          created_at,
          displayed_at,
          celebration_templates ( name )
        `,
          { count: 'exact' }
        )
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
      }

      const { data, error, count } = await query

      if (!error) {
        const rows = (data as Celebration[]) ?? []
        setCelebrations((prev) => (offset === 0 ? rows : [...prev, ...rows]))
        setHasMore(rows.length === PAGE_SIZE && (count ?? 0) > offset + rows.length)
      }

      setLoading(false)
      setLoadingMore(false)
    },
    [orgId, statusFilter, dateFrom, dateTo]
  )

  useEffect(() => {
    if (orgId) {
      fetchCelebrations(0)
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading])

  const handleFilter = () => {
    fetchCelebrations(0)
  }

  const handleReplay = async (c: Celebration) => {
    if (!orgId) return
    const supabase = createClient()
    const externalId = `replay-${c.id}-${Date.now()}`
    await supabase.from('celebrations').insert({
      org_id: orgId,
      title: c.title,
      subtitle: c.subtitle,
      amount: c.amount,
      status: 'pending',
      external_id: externalId,
      metadata: { replayed_from: c.id },
    })
    fetchCelebrations(0)
  }

  if (orgLoading || (!orgId && !orgLoading)) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">History</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">History</h1>
      <p className="mb-6 text-muted-foreground">
        View past celebrations and activity logged on your dashboard.
      </p>

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label>Status</Label>
          <select
            className="border-input flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="displayed">Displayed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label>From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleFilter}>
          Apply
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading celebrations...</p>
      ) : celebrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="mb-2 font-medium">No celebrations yet</p>
          <p className="text-center text-muted-foreground text-sm">
            Celebrations will appear here when they are created from webhooks or the test endpoint.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subtitle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Displayed</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {celebrations.map((c) => {
                  const statusCfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.skipped
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {c.subtitle ?? '—'}
                      </TableCell>
                      <TableCell>
                        {c.amount != null
                          ? `$${Number(c.amount).toLocaleString()}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusCfg?.className ?? ''}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.celebration_templates?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(c.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(c.displayed_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReplay(c)}
                          title="Replay on TV"
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchCelebrations(celebrations.length)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
