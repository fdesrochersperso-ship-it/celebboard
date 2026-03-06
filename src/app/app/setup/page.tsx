'use client'

import { createClient } from '@/lib/supabase-clients'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupOrgPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membership?.org_id) {
        router.replace('/app')
        return
      }

      setChecking(false)
    }
    check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    try {
      const res = await fetch('/api/setup-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim(), userId: user.id }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to set up organization')
      }

      window.location.href = '/app'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up organization')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Set up your organization</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Set up your organization</h1>
      <p className="mb-6 text-muted-foreground">
        You&apos;re not in any organization yet. Create one to get started.
      </p>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
          <CardDescription>
            Give your organization a name. You can change this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Inc"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
