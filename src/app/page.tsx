import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <main className="flex max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">CelebBoard</h1>
        <p className="text-lg text-muted-foreground">
          Celebration dashboard for sales teams. Display KPIs, feed, and wins on your office TV.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/app"
            className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Open App
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            Sign Up
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Display page: /display/[token] — get your token from App → Display Settings
        </p>
      </main>
    </div>
  )
}
