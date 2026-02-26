# CelebBoard

Multi-tenant celebration dashboard for sales teams. Display KPIs, feed items, and celebration overlays on office TVs.

## Quick Start

```bash
pnpm install
cp .env.example .env.local   # Add your Supabase keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

- **App** (login required): `/app` — manage org, display, celebrations
- **Display** (TV mode): `/display/[token]` — get token from App → Display Settings

### Display shortcuts
- **T** — Trigger test celebration overlay
- **Escape** — Dismiss overlay

## Deploy to Vercel

1. Push to GitHub
2. [Import on Vercel](https://vercel.com/new)
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Configure Supabase Auth redirect URLs with your Vercel domain

## Tech

Next.js 16, Supabase, Tailwind, shadcn/ui
