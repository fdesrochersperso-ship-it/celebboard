# CelebBoard — Project Status

**Last updated:** 2026-03-12 (Admin panel validation pass)

## What's Built (Current Capabilities)

### Core Platform

- Multi-tenant org model: `organizations`, `org_members`, RLS
- Auth: Supabase Auth (email/password), middleware for /app routes
- Display token auth for TV dashboards (no login)
- Org setup, invite flow, display token regeneration

### Admin App (/app)

- Integrations: Add/connect HubSpot, Slack, GA4, generic webhook (credentials stored); HubSpot OAuth redirect URI auto-derived from VERCEL_URL on Vercel
- Celebrations: Templates and triggers with field mapping and conditions
- KPIs: Definitions with manual, integration, or celebration_aggregate; leaderboard (top 3), goal/pace (PaceKPICard); **KPI builder redesign** (CELEBRATION-BUILDER-REDESIGN-SPEC Part 3): full-page form at `/app/kpis/new` and `/app/kpis/[id]`; KpiForm with KPI Identity (label, name, format, currency), Data Source cards (Integration/Celebrations/Manual), Display Options, TV preview; PropertySelector for number-only aggregate field; ConditionBuilder for filters; structured query_config JSON; card listing with Active toggle, Refresh Now, Delete; POST/PUT/DELETE/PATCH toggle API routes
- Team: Team member management, bulk upload, external_ids for CRM mapping
- Display: Settings (theme, feed rotation), preview, display URL
- History: Celebration log with status filter (pending/displayed/skipped)
- Seed and simulate endpoints for development

### TV Display (/display/[token])

- **Lovable design system**: Theme tokens (Dark/Light/Vibrant), gradients, shadows, Inter font, animations
- Header: Logo (gradient-primary + Sparkles when no org logo), theme switcher, fullscreen, Replay, Refresh, connection status (green Live)
- KPI carousel: KpiCard, LeaderKPICard (value + top 3 contributors), PaceKPICard (count/goal + progress bar + leaders); Lovable design
- 12-column grid layout: Feed (col-span-4), Chart (col-span-5), Recent Wins (col-span-3), QR (col-span-3)
- Celebration overlay: bg-black/95, gold gradient title, primary-bordered photos, GIF, bouncing dots
- Confetti: 50 pieces, 8 HSL colors, 4 shapes
- Feed submission page (`/submit/[orgId]`): mobile-first, no auth, photo/text modes, localStorage author name
- Supabase Realtime for celebrations and feed_items
- Auto-reconnect, visibility change handling

### Integrations (Implemented)

- **Webhook**: Generic webhook processor at `/api/webhooks/[orgId]/[type]`
  - Supports conditions, field mapping, template rendering
  - Works for hubspot, slack, generic_webhook types (any JSON)
  - No integration-specific verification (HubSpot/Slack signatures)
- **HubSpot connector**: `syncTeamMembers` — sync owners from HubSpot API; schema discovery (`integration_schemas` table) — properties (deals/contacts/companies), pipelines, owners cached from HubSpot; `fetchAndCacheAllSchemas` on OAuth connect; GET/POST `/api/integrations/[id]/schema` for cached schemas and refresh
- **Admin shared components** (CELEBRATION-BUILDER-REDESIGN-SPEC Part 4): `PropertySelector` (searchable combobox), `ConditionRow` + `ConditionBuilder` (type-aware: number `between`, date `within last` with days/weeks/months), `TemplateTextEditor` (Insert Field + `{{field}}`), `VisualStylePicker`, `SoundPicker`, `FieldMappingTable`; `useIntegrationSchema` TanStack Query hook; shadcn Command + Popover
- **Celebration wizard** (CELEBRATION-BUILDER-REDESIGN-SPEC Part 2): `/app/celebrations/new` full-page wizard; Step 1 (trigger): integration + object type dropdowns, flat condition builder, starter templates; Step 2 (design): auto-generated name, TemplateTextEditor, VisualStylePicker, SoundPicker, duration, photos/counter toggles, FieldMappingTable; Step 3 (preview): CelebrationPreview (16:9 TV-style container, confetti/fireworks/champagne CSS animations, sample data resolution, Replay/Unmute, Try different data), summary card, Save & Activate / Save as Draft; POST /api/celebrations unified create; PUT /api/celebrations/[id] update
- **Celebrations list page redesign**: Card grid (not table); Quick Start presets (Deal Won, New Client, Big Deal, Custom) linking to `/new?starter=`; each card: name, Active/Inactive toggle (optimistic, PATCH /api/celebrations/[id]/toggle), trigger conditions in plain English (`conditionsToText`), visual style · sound · duration, stats (last fired, total); Edit → `/celebrations/[id]`, Duplicate → `/new` pre-filled, overflow menu (Delete with AlertDialog, View History); empty/loading states; DELETE /api/celebrations/[id]; edit page `/celebrations/[id]` pre-populates wizard, uses PUT on save
- **Slack connector**: `syncTeamMembers` — sync users from Slack API
- No GA4 connector logic

### Marketing Site (i18n + Lovable Design)

- **Lovable design system** per `docs/website-lovable-documentation`: 4 themes (dark default), CSS variables, Inter font, gradient-primary/celebration/success, glass-morphism cards, CSS-only animations
- Bilingual marketing pages (EN/FR) with next-intl; all copy from `docs/marketing-copy-reference.md` and `src/messages/{en,fr}.json`
- Routes: `/`, `/features`, `/celebrations`, `/dashboard`, `/engagement`, `/admin`, `/pricing`, `/about`, `/blog`, `/legal/terms`, `/legal/privacy` — French at `/fr/*`
- Navbar (Celebrations, Dashboard, Engagement, Admin, Pricing, About, Blog; Live Demo, Get Started), Footer (3-column Lovable style), LanguageSwitcher
- Home: Hero with FloatingParticles, AnimatedDashboardMockup, integration logos (HubSpot, Slack, GA4, Spotify), 4 FeatureCards, How It Works (3 steps) with employee photos, MarketingAnimatedCounter stats, CTA
- Feature pages: Celebrations, Dashboard, Engagement, Admin — each with Lovable structure; Features hub links to all four
- Pricing: PricingCards (3 plans), PricingComparison table, PricingFaq accordion
- About: Story (4 paragraphs), Values (6 items), Location (lang switch); Blog: MDX-based articles in `src/content/blog/{en,fr}/`, index + article pages, sitemap
- Middleware: i18n for marketing routes only; Supabase auth for `/app`, `/login`, `/signup` unchanged
- **Dev server**: `scripts/pre-dev.js` removes stale `.next/dev/lock` before `next dev` to avoid "Unable to acquire lock" after crash/kill
- **Marketing assets**: Employee face photos in leaderboards, mockups, avatar stacks; integration logos (standalone, larger) in integrations bar and dashboard bottom; plain text in feature descriptions; assets in `public/images/employees/` and `public/images/logos/`
- **On-site SEO** (per `docs/seo-content-plan-website.md`): metadataBase, robots, sitemap.xml, robots.txt; canonical + hreflang on all marketing pages; JSON-LD schema (SoftwareApplication, Product, FAQPage, Organization) on home, features, pricing, about; Open Graph image generation; SEO-optimized metadata (title, description) EN/FR; H1/H2 hierarchy aligned with spec; pricing teaser section on homepage

### Static Website + Dual Vercel

- `website/` — Astro static site (placeholder)
- Two Vercel deployments: root = Next.js, Root Directory `website` = static site
- See [DEPLOYMENT.md](DEPLOYMENT.md) for setup

### Data Flow

- Celebrations: Webhook → conditions + field mapping → insert into celebrations → Realtime
- Feed: QR submission + manual inserts; Realtime for new posts
- KPIs: Manual value or seed; celebration_aggregate computes value + leaders from celebrations; display reads cached_value or computed; leader_overrides for manual KPIs

---

## What's Missing / Pending

- **KPI data fetching**: No code fetches from HubSpot/GA4; integration-sourced KPIs never get `cached_value` updated
- **Webhook verification**: No HubSpot/Slack signature verification
- **GA4**: UI to add GA4 integration exists, no connector or KPI logic
- **Database migrations**: Only storage policies in migrations; core schema may be created elsewhere (e.g. Supabase Dashboard)
- **Setup wizard**: No guided onboarding; ARCHITECTURE mentions `/app/setup`
- **Manual step**: Create Supabase Storage bucket `feed-photos` (public) for QR submission photos

---

## Technical Debt and Liabilities

- **Chart**: [KpiChart](src/components/display/kpi-chart.tsx) uses hardcoded MOCK_DATA
- **Docs mismatch**: data-integration-summary describes Edge Functions; implementation uses API routes
- **Schema source**: No CREATE TABLE migrations in repo; schema defined in ARCHITECTURE.md
- **Realtime type cast**: `(ch as any)` in display-dashboard for Supabase channel

---

## Debt Level (Subjective)

**Low–Medium**: Core flows work; main gaps are integration data (KPI fetch, feed submit) and doc alignment.
