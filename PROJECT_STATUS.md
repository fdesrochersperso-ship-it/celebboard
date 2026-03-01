# CelebBoard — Project Status

**Last updated:** 2026-03-01 (Lovable design system revamp)

## What's Built (Current Capabilities)

### Core Platform

- Multi-tenant org model: `organizations`, `org_members`, RLS
- Auth: Supabase Auth (email/password), middleware for /app routes
- Display token auth for TV dashboards (no login)
- Org setup, invite flow, display token regeneration

### Admin App (/app)

- Integrations: Add/connect HubSpot, Slack, GA4, generic webhook (credentials stored)
- Celebrations: Templates and triggers with field mapping and conditions
- KPIs: Definitions with manual or integration source type (presets for HubSpot)
- Team: Team member management, bulk upload, external_ids for CRM mapping
- Display: Settings (theme, feed rotation), preview, display URL
- History: Celebration log with status filter (pending/displayed/skipped)
- Seed and simulate endpoints for development

### TV Display (/display/[token])

- **Lovable design system**: Theme tokens (Dark/Light/Vibrant), gradients, shadows, Inter font, animations
- Header: Logo (gradient-primary + Sparkles when no org logo), theme switcher, fullscreen, Replay, Refresh, connection status (green Live)
- KPI carousel: Auto-rotates every 5s, pause on hover; gradient-primary/success/celebration icon variants; shadow-card
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
- **HubSpot connector**: `syncTeamMembers` — sync owners from HubSpot API
- **Slack connector**: `syncTeamMembers` — sync users from Slack API
- No GA4 connector logic

### Marketing Site (i18n + Design System)

- **Cinematic Split** design system per `docs/design-system-website`: true black (#0A0A0A) dark sections, warm cream (#FAF9F7) light sections, amber (#F59E0B) accents, 0px border radius, Sora font, overline pattern, asymmetric splits
- Bilingual marketing pages (EN/FR) with next-intl; all copy from `docs/marketing-copy-reference.md` and `src/messages/{en,fr}.json`
- Routes: `/`, `/features`, `/pricing`, `/about`, `/blog`, `/legal/terms`, `/legal/privacy` — French at `/fr/*`
- Navbar (cta, menu labels), Footer (4-column: product, company, legal, connect), LanguageSwitcher (aria-label)
- Home: Hero, LogoBar, Problem (before/after), FeaturesGrid (6 cards), HowItWorks, Testimonials, Verticals, CTA
- Features: CelebrationEngine, IntegrationsDetail, DashboardFeatures, AdminFeatures; page-specific CTA
- Pricing: PricingCards (3 plans), PricingComparison table, PricingFaq accordion
- About: Story (4 paragraphs), Values (6 items), Location (lang switch); Blog scaffold with CTA
- Middleware: i18n for marketing routes only; Supabase auth for `/app`, `/login`, `/signup` unchanged
- **On-site SEO** (per `docs/seo-content-plan-website`): metadataBase, robots, sitemap.xml, robots.txt; canonical + hreflang on all marketing pages; JSON-LD schema (SoftwareApplication, Product, FAQPage, Organization) on home, features, pricing, about; Open Graph image generation; SEO-optimized metadata (title, description) EN/FR; H1/H2 hierarchy aligned with spec; pricing teaser section on homepage

### Static Website + Dual Vercel

- `website/` — Astro static site (placeholder)
- Two Vercel deployments: root = Next.js, Root Directory `website` = static site
- See [DEPLOYMENT.md](DEPLOYMENT.md) for setup

### Data Flow

- Celebrations: Webhook → conditions + field mapping → insert into celebrations → Realtime
- Feed: QR submission + manual inserts; Realtime for new posts
- KPIs: Manual value or seed; display reads cached_value

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
