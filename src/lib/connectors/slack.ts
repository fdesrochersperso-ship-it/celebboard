import type { SupabaseClient } from '@supabase/supabase-js'

type Integration = {
  id: string
  credentials: Record<string, unknown>
}

type SlackUser = {
  id: string
  name?: string
  real_name?: string
  profile?: {
    email?: string
    image_512?: string
    image_192?: string
    image_72?: string
    image_48?: string
  }
  is_bot?: boolean
  deleted?: boolean
}

type SlackUsersResponse = {
  ok: boolean
  members?: SlackUser[]
  response_metadata?: { next_cursor?: string }
}

export async function syncTeamMembers(
  integration: Integration,
  orgId: string,
  supabase: SupabaseClient
): Promise<{ created: number; updated: number }> {
  const botToken = (integration.credentials as { bot_token?: string }).bot_token
  if (!botToken) {
    throw new Error('Slack integration missing bot_token')
  }

  const allUsers: SlackUser[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(
      `https://slack.com/api/users.list?${params}`,
      {
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = (await res.json()) as SlackUsersResponse
    if (!data.ok) {
      throw new Error((data as { error?: string }).error ?? 'Slack API error')
    }

    const members = data.members ?? []
    const validUsers = members.filter(
      (u) => !u.is_bot && !u.deleted
    )
    allUsers.push(...validUsers)
    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  let created = 0
  let updated = 0

  const { data: existingMembers } = await supabase
    .from('team_members')
    .select('id, name, email, photo_url, external_ids')
    .eq('org_id', orgId)

  const bySlackId = new Map(
    (existingMembers ?? []).filter((m) => (m.external_ids as Record<string, string>)?.slack_user_id).map((m) => [
      (m.external_ids as Record<string, string>).slack_user_id,
      m,
    ])
  )
  const byEmail = new Map(
    (existingMembers ?? [])
      .filter((m) => m.email)
      .map((m) => [m.email!.toLowerCase().trim(), m])
  )

  for (const user of allUsers) {
    const slackUserId = user.id
    const email = user.profile?.email?.trim() || null
    const photoUrl = user.profile?.image_512 ?? user.profile?.image_192 ?? user.profile?.image_72 ?? user.profile?.image_48 ?? null
    const name = user.real_name?.trim() || user.name || 'Unknown'

    // Match existing by slack_user_id first, then by email
    let existing = bySlackId.get(slackUserId)
    if (!existing && email) {
      existing = byEmail.get(email.toLowerCase()) ?? undefined
    }

    const existingIds = (existing?.external_ids ?? {}) as Record<string, string>
    const externalIds: Record<string, string> = {
      ...existingIds,
      slack_user_id: slackUserId,
    }
    const payload = {
      name,
      email,
      photo_url: photoUrl,
      external_ids: externalIds,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', existing.id)
      if (!error) {
        updated++
        bySlackId.set(slackUserId, { ...existing, external_ids: externalIds })
        if (email) byEmail.set(email.toLowerCase(), { ...existing, external_ids: externalIds })
      }
    } else {
      const { error } = await supabase
        .from('team_members')
        .insert({ org_id: orgId, ...payload })
      if (!error) {
        created++
        const newMember = { id: '', ...payload }
        bySlackId.set(slackUserId, newMember)
        if (email) byEmail.set(email.toLowerCase(), newMember)
      }
    }
  }

  return { created, updated }
}
