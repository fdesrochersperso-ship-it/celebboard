import { createServiceClient } from '@/lib/supabase-server'
import DisplayDashboard from './display-dashboard'

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function DisplayPage({ params }: PageProps) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, display_token, logo_url')
    .eq('display_token', token)
    .single()

  if (error || !org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-400">Invalid display token</h1>
          <p className="mt-2 text-zinc-400">
            The display link is invalid or has expired. Please check the URL.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DisplayDashboard
      org={{
        id: org.id,
        name: org.name,
        display_token: org.display_token,
        logo_url: org.logo_url ?? null,
      }}
    />
  )
}
