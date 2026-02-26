# CelebBoard — SaaS Architecture Proposal

> **Working name**: CelebBoard (placeholder — the platform that turns business wins into team moments)
>
> Evolving the helloDarwin internal TV dashboard into a multi-tenant SaaS where any sales/activity-driven company can connect their tools, define celebrations & KPIs, and display a real-time dashboard on their office TVs.

---

## 1. Core Concepts

### Tenant Model
**Shared database, tenant-scoped via `org_id`.**

Every table carries an `org_id` foreign key. Row-Level Security (RLS) policies enforce isolation so Org A never sees Org B's data. This is the simplest multi-tenant pattern and works well up to thousands of tenants.

```
┌─────────────────────────────────────────────┐
│  Organizations                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Org A    │  │ Org B    │  │ Org C    │  │
│  │ (hD)     │  │ (Acme)   │  │ (Foo)    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       │              │              │       │
│  Same Supabase project, same tables,        │
│  isolated by org_id + RLS                   │
└─────────────────────────────────────────────┘
```

### User → Org Relationship
- A **User** belongs to one **Organization** (v1 — multi-org later)
- Roles: `owner`, `admin`, `viewer`
- The dashboard itself is accessed via a **display token** (no login needed on the TV — just a URL with a token)

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | **Next.js 15 (App Router)** + TypeScript + Tailwind + shadcn/ui | SSR for admin pages, client-heavy for the dashboard display. Better routing/auth than plain Vite for a SaaS. |
| Dashboard Display | **React (same Next.js app)** at route `/display/[token]` | TV-optimized, no auth required, token-scoped to org |
| Backend / API | **Next.js API Routes** + **Supabase** (Postgres + Realtime + Storage) | Keeps Supabase's realtime & RLS strengths while giving you full control over API logic |
| Auth | **Supabase Auth** (email/password, later OAuth) | Already battle-tested, integrates with RLS |
| State (Dashboard) | **Zustand** (persisted) + **TanStack Query** | Same proven pattern as the current app |
| Hosting | **Vercel** (frontend) + **Supabase Cloud** (backend) | Simple, scalable, works great together |
| Webhook Ingestion | **Next.js API routes** at `/api/webhooks/[org_id]/[integration]` | Stateless, easy to route per-tenant |

### Why Next.js over plain Vite?
The current Lovable app is a Vite SPA — perfect for a single-purpose dashboard. But for a SaaS you need:
- Admin pages with proper SEO (pricing, docs, onboarding)
- Server-side API routes for webhook processing (replacing Supabase Edge Functions)
- Middleware for auth, tenant resolution, rate limiting
- Better code organization (admin vs. display are very different UX)

---

## 3. Database Schema (Multi-Tenant)

### Core Tables

```sql
-- ============================================
-- ORGANIZATIONS & USERS
-- ============================================

CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,        -- "hellodarwin", used in URLs
  logo_url      text,
  display_token text UNIQUE NOT NULL,        -- secret token for TV display URL
  timezone      text DEFAULT 'America/Montreal',
  settings      jsonb DEFAULT '{}',          -- org-wide preferences
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE org_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text CHECK (role IN ('owner', 'admin', 'viewer')) DEFAULT 'viewer',
  created_at    timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ============================================
-- TEAM MEMBERS (replaces "employees")
-- ============================================

CREATE TABLE team_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  email             text,
  photo_url         text,
  external_ids      jsonb DEFAULT '{}',       -- {"hubspot_owner_id": "123", "slack_user_id": "U..."}
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================
-- INTEGRATIONS (connected services per org)
-- ============================================

CREATE TABLE integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  type            text NOT NULL,              -- 'hubspot', 'slack', 'ga4', 'generic_webhook'
  name            text NOT NULL,              -- display name, e.g. "Our HubSpot"
  credentials     jsonb NOT NULL DEFAULT '{}',-- encrypted: access_token, signing_secret, etc.
  config          jsonb DEFAULT '{}',         -- integration-specific config
  status          text DEFAULT 'active',      -- 'active', 'disconnected', 'error'
  webhook_secret  text,                       -- for verifying incoming webhooks
  last_synced_at  timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(org_id, type, name)
);

-- ============================================
-- CELEBRATION TEMPLATES
-- ============================================

CREATE TABLE celebration_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,              -- "Deal Won", "New Subscriber", etc.
  title_pattern   text NOT NULL,              -- "DEAL WON! 🎉" or "NEW CLIENT: {{company_name}}"
  subtitle_pattern text,                      -- "{{owner_name}} closed {{deal_name}}"
  visual_style    text DEFAULT 'confetti',    -- 'confetti', 'fireworks', 'champagne', 'custom'
  sound           text DEFAULT 'victory',     -- 'victory', 'cash_register', 'bell', 'custom', 'none'
  custom_sound_url text,
  gif_url         text,                       -- optional background GIF
  duration_seconds int DEFAULT 20,
  show_counter    boolean DEFAULT false,
  counter_label   text,                       -- "This Quarter's Revenue"
  counter_source  text,                       -- references a KPI definition ID or 'field:amount'
  show_photos     boolean DEFAULT true,       -- show team member photos
  photo_fields    text[] DEFAULT '{}',        -- which payload fields map to team members
  color_scheme    jsonb DEFAULT '{}',         -- optional custom colors
  sort_order      int DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================
-- CELEBRATION TRIGGERS (connects integrations → templates)
-- ============================================

CREATE TABLE celebration_triggers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id    uuid REFERENCES integrations(id) ON DELETE CASCADE,
  template_id       uuid REFERENCES celebration_templates(id) ON DELETE CASCADE,
  name              text NOT NULL,            -- "HubSpot Deal Won"
  
  -- Trigger conditions (when to fire)
  event_type        text,                     -- integration-specific: 'deal.won', 'deal.created', etc.
  conditions        jsonb DEFAULT '[]',       -- [{"field": "amount", "op": "gt", "value": 1000}]
  
  -- Field mapping (how to extract data from the webhook payload)
  field_mapping     jsonb NOT NULL DEFAULT '{}',
  -- Example for HubSpot:
  -- {
  --   "deal_name": "dealname",
  --   "amount": "montant_sub_accepte",
  --   "company_name": "name",
  --   "owner_id": "hubspot_owner_id",
  --   "account_manager_id": "account_manager"
  -- }
  
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================
-- CELEBRATIONS (pending + history, replaces both tables)
-- ============================================

CREATE TABLE celebrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  template_id     uuid REFERENCES celebration_templates(id),
  trigger_id      uuid REFERENCES celebration_triggers(id),
  
  -- Resolved display data
  title           text NOT NULL,
  subtitle        text,
  amount          numeric,
  metadata        jsonb DEFAULT '{}',         -- all extracted fields from the webhook
  
  -- Team member references
  team_member_ids uuid[] DEFAULT '{}',        -- resolved team_members who get featured
  
  -- Lifecycle
  status          text DEFAULT 'pending',     -- 'pending', 'displayed', 'skipped'
  external_id     text,                       -- dedup key (e.g. HubSpot deal ID)
  displayed_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  
  UNIQUE(org_id, external_id)                 -- prevent duplicate celebrations
);

-- ============================================
-- KPI DEFINITIONS (what metrics to show on dashboard)
-- ============================================

CREATE TABLE kpi_definitions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,              -- "Revenue This Quarter"
  label           text NOT NULL,              -- display label on the card
  
  -- Data source
  source_type     text NOT NULL,              -- 'integration', 'celebration_aggregate', 'manual'
  integration_id  uuid REFERENCES integrations(id),
  
  -- For integration-sourced KPIs
  query_config    jsonb DEFAULT '{}',         
  -- Examples:
  -- HubSpot: {"endpoint": "deals", "filter": {...}, "aggregate": "sum", "field": "amount"}
  -- GA4: {"metric": "activeUsers", "realtime": true}
  -- Celebration aggregate: {"template_ids": [...], "field": "amount", "aggregate": "sum", "period": "quarter"}
  
  -- Display
  format          text DEFAULT 'number',      -- 'number', 'currency', 'percentage'
  currency        text DEFAULT 'CAD',
  show_trend      boolean DEFAULT true,       -- show vs previous period
  trend_period    text DEFAULT 'quarter',     -- 'day', 'week', 'month', 'quarter'
  sort_order      int DEFAULT 0,
  is_active       boolean DEFAULT true,
  
  -- Cache
  cached_value    jsonb,
  cached_at       timestamptz,
  refresh_seconds int DEFAULT 300,            -- how often to refresh
  
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================
-- DASHBOARD FEED (social/content feed)
-- ============================================

CREATE TABLE feed_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  author_name     text NOT NULL,
  content_type    text NOT NULL,              -- 'image', 'text', 'spotify'
  image_url       text,
  text_content    text,
  source          text NOT NULL,              -- 'slack', 'manual', 'webhook'
  metadata        jsonb DEFAULT '{}',         -- source-specific data
  created_at      timestamptz DEFAULT now()
);

-- ============================================
-- DASHBOARD SETTINGS (layout & theme per org)
-- ============================================

CREATE TABLE dashboard_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  theme           text DEFAULT 'dark',
  layout          jsonb DEFAULT '{}',         -- which widgets are shown, positions, etc.
  feed_rotation_seconds int DEFAULT 25,
  quote_enabled   boolean DEFAULT true,
  custom_css      text,                       -- advanced: custom CSS overrides
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

---

## 4. Webhook Routing Architecture

Every org gets deterministic webhook URLs based on their org ID:

```
POST /api/webhooks/{org_id}/hubspot
POST /api/webhooks/{org_id}/slack
POST /api/webhooks/{org_id}/generic
```

### Flow

```
External Service (HubSpot, Slack, etc.)
        │
        ▼
/api/webhooks/{org_id}/{type}
        │
        ├── 1. Validate org_id exists
        ├── 2. Find matching integration (org_id + type)
        ├── 3. Verify webhook signature (if applicable)
        ├── 4. Find active triggers for this integration
        ├── 5. Evaluate trigger conditions against payload
        ├── 6. For each matching trigger:
        │       ├── Apply field_mapping to extract data
        │       ├── Resolve team_member references
        │       ├── Render title/subtitle from template patterns
        │       └── INSERT into celebrations (status: 'pending')
        │
        └── 7. Supabase Realtime broadcasts to connected dashboards
```

### Generic Webhook (the "just send us JSON" option)

```
POST /api/webhooks/{org_id}/generic
Headers: X-Webhook-Secret: {integration.webhook_secret}
Body: any JSON

// The trigger's field_mapping tells us what to extract:
// field_mapping: { "deal_name": "data.deal.name", "amount": "data.deal.value" }
// supports dot-notation for nested fields
```

This is great for customers who have their own systems or use tools you haven't built a native connector for.

---

## 5. Integration Connectors

### Connector Interface

Each integration type implements a standard interface:

```typescript
interface IntegrationConnector {
  type: string;                           // 'hubspot', 'slack', 'ga4'
  
  // Webhook handling
  verifyWebhook(req: Request, integration: Integration): boolean;
  parsePayload(req: Request): Record<string, any>;
  
  // KPI data fetching
  fetchKPIData(integration: Integration, queryConfig: any): Promise<KPIResult>;
  
  // Team member sync
  syncTeamMembers?(integration: Integration, org_id: string): Promise<void>;
  
  // Setup helpers (for onboarding)
  getRequiredCredentials(): CredentialSchema[];
  getAvailableEventTypes(): EventType[];
  getAvailableFields(): FieldSchema[];       // what fields are available for mapping
}
```

### V1 Connectors

| Connector | Webhook Events | KPI Queries | Team Sync |
|-----------|---------------|-------------|-----------|
| **HubSpot** | Deal stage changes, custom object events | Deal aggregations (sum, count, filter by date/pipeline/stage) | Owner sync |
| **Slack** | Emoji reactions, channel messages, specific user posts | — | User photo sync |
| **GA4** | — | Real-time active users, pageviews | — |
| **Generic Webhook** | Any JSON payload | — | — |

### HubSpot Connector — Field Mapping Example

During onboarding/setup, the admin maps their HubSpot fields:

```
┌──────────────────────────────────────────────────────┐
│  Configure "Deal Won" Trigger                        │
│                                                      │
│  When: Deal stage changes to "Closed Won"            │
│                                                      │
│  Map Fields:                                         │
│  ┌────────────────────┐    ┌──────────────────────┐  │
│  │ Display Field       │    │ HubSpot Property     │  │
│  ├────────────────────┤    ├──────────────────────┤  │
│  │ Deal Name          │ ←  │ dealname             │  │
│  │ Amount             │ ←  │ amount               │  │
│  │ Company            │ ←  │ associations.company  │  │
│  │ Owner              │ ←  │ hubspot_owner_id     │  │
│  │ Account Manager    │ ←  │ account_manager      │  │
│  └────────────────────┘    └──────────────────────┘  │
│                                                      │
│  Conditions (optional):                              │
│  • amount > 0                                        │
│  • company_name does not contain "internal"          │
└──────────────────────────────────────────────────────┘
```

---

## 6. Dashboard Display Architecture

### Access Model

The TV displays a URL like:
```
https://app.celebboard.com/display/{display_token}
```

No login required. The `display_token` is a long random string that maps to an org. The dashboard:
1. Resolves the token → org_id
2. Subscribes to Supabase Realtime channels scoped to that org_id
3. Fetches KPI data, feed items, recent celebrations
4. Runs autonomously forever (same auto-recovery logic you already built)

### Display Page Architecture

```
/display/[token]
    │
    ├── TokenResolver (validates token → org context)
    │
    ├── RealtimeProvider (subscribes to org's channels)
    │   ├── celebrations:org_id (INSERT events)
    │   └── feed_items:org_id (INSERT events)
    │
    ├── DashboardLayout (configurable per org)
    │   ├── KPI Cards (from kpi_definitions)
    │   ├── Feed (from feed_items)
    │   ├── Recent Wins (from celebrations)
    │   └── Optional widgets (quote, GA live counter, etc.)
    │
    └── CelebrationOverlay (full-screen popup system)
        ├── Queue (Zustand, same pattern as current)
        ├── Template renderer (visual style from template)
        └── Sound player
```

### TV Display Constraints (carried over)
- Zero scrolling
- Zero interaction required
- Auto-reconnect with exponential backoff
- Visibility change detection
- Session auto-recovery

---

## 7. Admin / Setup Pages

```
/app                          → Org dashboard / home
/app/setup                    → Onboarding wizard
/app/integrations             → Manage connected services
/app/integrations/[id]/setup  → Configure specific integration
/app/celebrations             → Celebration templates
/app/celebrations/[id]        → Edit template + triggers
/app/kpis                     → KPI card definitions
/app/team                     → Team member management
/app/display                  → Display settings (theme, layout, preview)
/app/display/preview          → Live preview of the dashboard
/app/history                  → Celebration history log
```

### Onboarding Wizard (White-Glove v1)

Since onboarding is white-glove initially, the admin pages don't need to be fully self-serve on day 1. But they should be functional enough that you (or a support person) can configure a new customer in ~30 minutes:

1. Create org → get display token
2. Connect integrations (paste API keys for now, OAuth later)
3. Sync team members from CRM
4. Set up celebration templates (start with presets)
5. Configure triggers + field mappings
6. Define KPI cards
7. Set theme + layout
8. Generate TV display URL → done

---

## 8. Presets & Quick Start

To make setup faster, ship pre-built "starter packs":

### Celebration Presets
| Preset | Title Pattern | Visual | Sound |
|--------|--------------|--------|-------|
| Deal Won | `🎉 DEAL WON!` | Confetti | Victory fanfare |
| New Client | `🤝 NEW CLIENT!` | Fireworks | Applause |
| Subscription | `⭐ NEW SUBSCRIBER!` | Champagne | Cash register |
| Quote Signed | `✍️ CONTRACT SIGNED!` | Pen animation | Acceptance |
| Renewal | `🔄 RENEWAL SIGNED!` | Confetti | Cash register |
| Custom Milestone | `🏆 {{title}}` | Confetti | Bell |

### KPI Presets (for HubSpot)
| Preset | Query |
|--------|-------|
| Revenue This Quarter | Sum of deal amounts, closed-won, current quarter |
| Deals Closed | Count of deals, closed-won, current quarter |
| New Clients | Count of new companies, current quarter |
| Pipeline Value | Sum of deal amounts, open stages |

---

## 9. Project Structure

```
celebboard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Public pages (landing, pricing)
│   │   ├── (auth)/                   # Login, signup
│   │   ├── app/                      # Admin pages (authed)
│   │   │   ├── integrations/
│   │   │   ├── celebrations/
│   │   │   ├── kpis/
│   │   │   ├── team/
│   │   │   └── display/
│   │   ├── display/[token]/          # TV dashboard (public, token-authed)
│   │   └── api/
│   │       ├── webhooks/[orgId]/[type]/route.ts
│   │       ├── kpi/[definitionId]/route.ts
│   │       └── internal/             # Admin API endpoints
│   │
│   ├── lib/
│   │   ├── connectors/               # Integration connectors
│   │   │   ├── hubspot.ts
│   │   │   ├── slack.ts
│   │   │   ├── ga4.ts
│   │   │   └── generic.ts
│   │   ├── db/                       # Supabase client, queries
│   │   ├── celebrations/             # Template rendering, queue logic
│   │   └── kpi/                      # KPI fetching, caching
│   │
│   ├── components/
│   │   ├── admin/                    # Admin UI components
│   │   ├── display/                  # Dashboard display components
│   │   │   ├── CelebrationOverlay.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── FeedCarousel.tsx
│   │   │   ├── RecentWins.tsx
│   │   │   └── DashboardLayout.tsx
│   │   └── ui/                       # shadcn/ui components
│   │
│   └── stores/                       # Zustand stores
│       ├── celebration-queue.ts
│       └── display-store.ts
│
├── supabase/
│   ├── migrations/                   # SQL migrations
│   └── seed.sql                      # Preset data
│
└── public/
    └── sounds/                       # Celebration sounds
```

---

## 10. Key Differences from Current App

| Aspect | Current (helloDarwin) | SaaS (CelebBoard) |
|--------|----------------------|-------------------|
| Tenancy | Single-tenant, no org concept | Multi-tenant, org_id everywhere |
| Integrations | Hardcoded to hD's HubSpot fields | Configurable field mapping per org |
| Celebrations | 8 hardcoded types | Template builder with presets |
| KPIs | 4 fixed HubSpot metrics | Configurable KPI definitions |
| Edge Functions | Supabase Edge Functions | Next.js API routes |
| Webhook URLs | Single endpoint | Per-org routed endpoints |
| Auth (display) | Email/password login | Token-based (no login on TV) |
| Auth (admin) | Same login | Supabase Auth + org membership |
| Theme | 4 hardcoded themes | Theme picker + custom CSS |
| Employees | Synced from HubSpot only | Multi-source via integrations |
| Feed | Slack-only | Multi-source (Slack, manual, webhook) |

---

## 11. Migration Path for helloDarwin

helloDarwin becomes the first customer ("Org #1"). Their existing setup maps directly:

| Current | Maps To |
|---------|---------|
| 8 event types | 8 celebration templates |
| HubSpot field references | Field mappings on triggers |
| HubSpot metrics edge function | 4 KPI definitions |
| Slack photo webhook | Slack integration + feed trigger |
| GA4 realtime | GA4 integration + KPI definition |
| employees table | team_members (with external_ids) |
| display_token | Auto-generated for the org |

---

## 12. What to Build First (Phased)

### Phase 1 — Foundation (Weeks 1-3)
- [ ] Next.js project scaffold + Supabase setup
- [ ] Database schema + migrations
- [ ] Auth (signup, login, org creation)
- [ ] Org membership + display token generation
- [ ] Basic admin layout (navigation, settings)

### Phase 2 — Display Engine (Weeks 3-5)
- [ ] Display page (`/display/[token]`)
- [ ] Celebration overlay (queue, animations, sounds)
- [ ] KPI card renderer (from definitions)
- [ ] Feed carousel
- [ ] Recent wins panel
- [ ] Theme system (dark, light + custom)
- [ ] Realtime subscriptions (scoped to org)
- [ ] Auto-recovery (reconnect, visibility change)

### Phase 3 — Integration Layer (Weeks 5-8)
- [ ] Connector interface + generic webhook
- [ ] HubSpot connector (webhook + KPI queries)
- [ ] Slack connector (events + photo sync)
- [ ] GA4 connector (realtime metrics)
- [ ] Trigger evaluation engine
- [ ] Field mapping system
- [ ] Team member sync

### Phase 4 — Admin UI (Weeks 8-10)
- [ ] Integration management (connect, configure, test)
- [ ] Celebration template builder
- [ ] Trigger configuration (conditions + field mapping)
- [ ] KPI definition builder
- [ ] Team member management
- [ ] Display preview + theme picker
- [ ] Celebration history

### Phase 5 — Polish & Launch (Weeks 10-12)
- [ ] Migrate helloDarwin as Org #1
- [ ] Onboard 2-3 beta customers
- [ ] Error handling, logging, monitoring
- [ ] Rate limiting on webhook endpoints
- [ ] Landing page
