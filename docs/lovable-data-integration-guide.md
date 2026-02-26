# 11 — Third-Party Data Integrations Deep Dive

> Complete technical reference for every external data flow in the dashboard.
> Covers HubSpot, Slack, and Google Analytics 4 — authentication, payloads, validation, caching, and frontend consumption.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [HubSpot Integration](#2-hubspot-integration)
   - 2.1 [Authentication](#21-authentication)
   - 2.2 [`hubspot-deal-webhook` — Real-Time Celebrations](#22-hubspot-deal-webhook--real-time-celebrations)
   - 2.3 [`hubspot-subscription-webhook` — SaaS Subscription Celebrations](#23-hubspot-subscription-webhook--saas-subscription-celebrations)
   - 2.4 [`hubspot-churn-webhook` — Churn Alerts](#24-hubspot-churn-webhook--churn-alerts)
   - 2.5 [`hubspot-metrics` — Service Team Dashboard KPIs](#25-hubspot-metrics--service-team-dashboard-kpis)
   - 2.6 [`hubspot-dev-metrics` — Dev Team Dashboard KPIs](#26-hubspot-dev-metrics--dev-team-dashboard-kpis)
   - 2.7 [`hubspot-sync-owners` — Employee Sync](#27-hubspot-sync-owners--employee-sync)
3. [Slack Integration](#3-slack-integration)
   - 3.1 [Authentication](#31-authentication)
   - 3.2 [`slack-photo-webhook` — Multi-Purpose Event Handler](#32-slack-photo-webhook--multi-purpose-event-handler)
   - 3.3 [`sync-employee-photos` — Profile Photo Sync](#33-sync-employee-photos--profile-photo-sync)
4. [Google Analytics 4 Integration](#4-google-analytics-4-integration)
   - 4.1 [JWT Service Account Authentication](#41-jwt-service-account-authentication)
   - 4.2 [`google-analytics-realtime` — Live Active Users](#42-google-analytics-realtime--live-active-users)
5. [Lovable AI Integration](#5-lovable-ai-integration)
   - 5.1 [`generate-fun-fact` — AI-Generated Daily Fact](#51-generate-fun-fact--ai-generated-daily-fact)
6. [Direct Submission](#6-direct-submission)
   - 6.1 [`submit-to-feed` — QR Code Submissions](#61-submit-to-feed--qr-code-submissions)
7. [Frontend Data Consumption](#7-frontend-data-consumption)
8. [Realtime Celebration Service](#8-realtime-celebration-service)
9. [Caching Strategy](#9-caching-strategy)
10. [Secrets Reference](#10-secrets-reference)
11. [Database Tables in Integrations](#11-database-tables-in-integrations)

---

## 1. Architecture Overview

Three data-flow patterns power the dashboard:

| Pattern | Direction | Latency | Examples |
|---------|-----------|---------|----------|
| **Push (Webhooks)** | External → Edge Function → DB → Frontend (Realtime) | <3 seconds | Deal wins, Slack reactions, subscription activations |
| **Pull (On-Demand)** | Frontend → Edge Function → External API → Cache → Frontend | ~2-5 seconds | KPI cards, GA4 active users |
| **Sync (Batch)** | Edge Function → External API → DB | Minutes | Employee photos, HubSpot owners |

```text
┌──────────────┐          ┌─────────────────────────┐          ┌────────────────────┐
│              │ webhook  │                         │ INSERT   │                    │
│  HubSpot     ├─────────►│  Edge Functions          ├─────────►│  Supabase DB       │
│  Workflows   │          │  (Deno runtime)          │          │  pending_celebrations│
│              │          │                         │          │  dashboard_feed     │
└──────────────┘          │  • hubspot-deal-webhook  │          │  api_cache          │
                          │  • hubspot-sub-webhook   │          │  employees          │
┌──────────────┐          │  • hubspot-churn-webhook │          │  webhook_logs       │
│              │ event    │  • hubspot-metrics       │          │  slack_spotify_songs │
│  Slack       ├─────────►│  • hubspot-dev-metrics   │          └─────────┬──────────┘
│  Events API  │          │  • hubspot-sync-owners   │                    │
│              │          │  • slack-photo-webhook   │          Realtime  │ INSERT
└──────────────┘          │  • sync-employee-photos  │          Polling   │ SELECT
                          │  • google-analytics-rt   │                    ▼
┌──────────────┐          │  • generate-fun-fact     │          ┌────────────────────┐
│  Google      │◄─────────│  • submit-to-feed        │          │  React Frontend    │
│  Analytics   │  API     └─────────────────────────┘          │  (Dashboard.tsx)   │
│  (GA4)       │  call                                         │                    │
└──────────────┘                                               │  Hooks:            │
                                                               │  • useDashboardData│
┌──────────────┐          ┌─────────────────────────┐          │  • useDevDashboard │
│  Lovable AI  │◄─────────│  generate-fun-fact       │          │  • useRealtime     │
│  Gateway     │  API     └─────────────────────────┘          │    Analytics       │
└──────────────┘                                               │  • useCelebration  │
                                                               │    Realtime        │
                                                               └────────────────────┘
```

---

## 2. HubSpot Integration

### 2.1 Authentication

| Setting | Value |
|---------|-------|
| **Method** | Private App Token |
| **Secret name** | `HUBSPOT_ACCESS_TOKEN` |
| **Header** | `Authorization: Bearer {token}` |
| **Base URL** | `https://api.hubapi.com` |
| **Required scopes** | `crm.objects.deals.read`, `crm.objects.custom.read`, `crm.schemas.custom.read`, `crm.objects.contacts.read`, `crm.objects.owners.read`, `crm.objects.companies.read` |

### Rate Limiting

All HubSpot edge functions use a `rateLimitedFetch()` wrapper:

```typescript
async function rateLimitedFetch(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
      await delay(retryAfter * 1000);
      continue;
    }
    return response;
  }
  throw new Error('HubSpot API error: Too Many Requests - max retries exceeded');
}
```

Pagination requests include a 200ms inter-request delay.

---

### 2.2 `hubspot-deal-webhook` — Real-Time Celebrations

**File**: `supabase/functions/hubspot-deal-webhook/index.ts` (502 lines)
**Config**: `verify_jwt = false`
**Endpoint**: `POST /functions/v1/hubspot-deal-webhook`

This function handles **two distinct payload formats** and **seven celebration event types**.

#### Format A — HubSpot Private App Subscription (Array)

HubSpot Private App subscriptions send events as an array when a deal property changes.

**Listened properties**:
- `program_result_at` → WIN celebration
- `program_applied_at` → APPLICATION celebration

**Example payload** (WIN):
```json
[{
  "subscriptionType": "deal.propertyChange",
  "propertyName": "program_result_at",
  "propertyValue": "2025-06-15T00:00:00.000Z",
  "objectId": 12345678901
}]
```

**Processing flow for WIN** (`program_result_at` change):

1. **Duplicate check**: Query `celebrated_deals` WHERE `deal_id = {objectId}`
2. **Fetch deal**: `GET /crm/v3/objects/deals/{id}?properties=dealname,montant_sub_accepte,program_result_at,hubspot_owner_id,account_manager,company_name__copy___primary_`
3. **Validate amount**: Skip if `montant_sub_accepte <= 0`
4. **Fetch owner name**: `GET /crm/v3/owners/{hubspot_owner_id}` → `"{firstName} {lastName}"`
5. **Fetch account manager**: `GET /crm/v3/owners/{account_manager}` (if set)
6. **Insert** into `pending_celebrations`:

```sql
INSERT INTO pending_celebrations (
  deal_id,              -- "12345678901" (raw deal ID, no prefix)
  deal_name,            -- dealname property
  amount,               -- montant_sub_accepte (float)
  company_name,         -- company_name__copy___primary_
  owner_name,           -- "John Doe"
  hubspot_owner_id,     -- "123456"
  account_manager_name, -- "Jane Smith" (or empty)
  account_manager_owner_id, -- "789012" (or null)
  program_result_at,    -- ISO timestamp
  celebrated,           -- false
  event_type            -- 'win'
) VALUES (...);
```

**Processing flow for APPLICATION** (`program_applied_at` change):

Same as WIN but:
- Validates `pipeline = '84370238'` (specific pipeline)
- Uses `montant_demande___psce` for amount
- Sets `event_type = 'application'`
- Uses `program_applied_at` as the date

#### Format B — HubSpot Workflow POST (Single Object)

Used for celebrations triggered by HubSpot Workflows. The workflow sends deal properties directly in the POST body.

**Supported event types**: `quote_signed`, `renewal_signed`, `pdm_paid`, `pkg_paid`

**Example payload** (quote_signed):
```json
{
  "objectId": "12345678",
  "event_type": "quote_signed",
  "dealname": "Acme Corp - Q2 Grant",
  "hubspot_owner_id": "123456",
  "hs_acv": "50000",
  "roadmap_first_meeting___booked_by": "789012",
  "lead_source___pkg_subs": "Referral",
  "company_name__copy___primary_": "Acme Corp"
}
```

**Event type detection logic**:
```typescript
let eventType = 'quote_signed'; // default
if (payload.event_type && payload.event_type !== 'event_type') {
  eventType = payload.event_type;
} else {
  // Check for workflow pattern where property name equals "event_type"
  for (const [key, value] of Object.entries(payload)) {
    if (value === 'event_type') { eventType = key; break; }
  }
}
```

#### Amount Resolution Per Event Type

| Event Type | Amount Property | Condition |
|---|---|---|
| `quote_signed` | `hs_acv` | — |
| `renewal_signed` | `renewal___potential_contract_value` | — |
| `pdm_paid` | `pdm_value` | — |
| `pkg_paid` | `discovery___contract_value__excl__pdm_` | `first_layer___package_type === 'grants-2'` |
| `pkg_paid` | `hs_acv` | Otherwise |

#### Deal ID Prefixes (Duplicate Prevention)

Each event type uses a prefix to prevent collision when the same deal triggers multiple celebration types:

| Event Type | Prefix | Example deal_id |
|---|---|---|
| `win` | *(none)* | `12345678901` |
| `application` | *(none)* | `12345678901` |
| `quote_signed` | `quote_` | `quote_12345678` |
| `renewal_signed` | `renewal_` | `renewal_12345678` |
| `pdm_paid` | `pdm_` | `pdm_12345678` |
| `pkg_paid` | `pkg_` | `pkg_12345678` |

#### Second Employee Attribution

For `quote_signed`, `pdm_paid`, and `pkg_paid`:
- **Second employee**: `roadmap_first_meeting___booked_by` → stored as `account_manager_owner_id`
- **Lead source label**: `lead_source___pkg_subs` → stored as `lead_source_pkg_subs` (text display, not a photo)

For `win` and `application`:
- **Second employee**: `account_manager` deal property → stored as `account_manager_owner_id`

For `renewal_signed`:
- **No second employee** — owner only

#### Ping / Health Check

```json
POST { "ping": true }
→ { "success": true, "message": "pong" }
```

---

### 2.3 `hubspot-subscription-webhook` — SaaS Subscription Celebrations

**File**: `supabase/functions/hubspot-subscription-webhook/index.ts` (409 lines)
**Config**: `verify_jwt = false`
**Endpoint**: `POST /functions/v1/hubspot-subscription-webhook`

Handles new SaaS subscription activations on the custom `_subscription` object (Object Type ID `2-42092209`).

#### Payload Formats Accepted

**Format A — Private App array**:
```json
[{
  "subscriptionType": "subscription.propertyChange",
  "propertyName": "platform_trial_conversion_at",
  "propertyValue": "2025-07-01T12:00:00.000Z",
  "objectId": 98765432
}]
```

**Format B — Workflow single object**:
```json
{ "hs_object_id": "98765432" }
```
or
```json
{ "objectId": "98765432" }
```

#### 7 Validation Checks

All must pass before a celebration is created:

| # | Check | Property | Condition |
|---|---|---|---|
| 1 | Type | `type` | `=== 'SaaS'` |
| 2 | Status | `package___status_reports` | `=== 'Active'` |
| 3 | Subscription type | `metadata_subscription_type` | `=== 'advanced'` |
| 4 | Source detail | `hs_object_source_detail_1` | `!== 'hD Platform - Set Up Demo SaaS'` (trimmed) |
| 5 | Owner ID | `hubspot_owner_id` | `!== '702756896'` (trimmed) |
| 6 | Stripe ID | `stripe_subscription_id` | Does NOT contain `'demo'` (case-insensitive) |
| 7 | Conversion date | `platform_trial_conversion_at` | Optional — celebrates both trial conversions and direct activations |

**Validation implementation** (returns early on first failure):
```typescript
async function fetchAndValidateSubscription(subscriptionId, hubspotToken): Promise<ValidationResult> {
  // Fetch: GET /crm/v3/objects/2-42092209/{id}?properties=hs_object_id,type,package___status_reports,...
  // Check each condition sequentially
  // Returns { valid: boolean, reason?: string, subscription, checks }
}
```

#### API Calls Made

1. **Fetch subscription**: `GET /crm/v3/objects/2-42092209/{id}?properties=hs_object_id,type,package___status_reports,stripe_subscription_id,platform_trial_conversion_at,interval,monthly_recurring_revenue__accounting_,metadata_closer_owner_id,metadata_subscription_type,hs_object_source_detail_1,hubspot_owner_id`
2. **Fetch company** (via CRM v4 associations): `GET /crm/v4/objects/2-42092209/{id}/associations/companies`
3. **Fetch company name**: `GET /crm/v3/objects/companies/{companyId}?properties=name`
4. **Fetch closer owner**: `GET /crm/v3/owners/{metadata_closer_owner_id}`

#### PLG Detection

If `metadata_closer_owner_id` is empty/null → Product-Led Growth (PLG). Falls back to employee ID `279227992` (Gabriel Dumais Comtois).

```typescript
const isPLG = !closerOwnerId;
const ownerIdToUse = isPLG ? PLG_EMPLOYEE_ID : closerOwnerId;
```

#### What Gets Written

```sql
INSERT INTO pending_celebrations (
  deal_id,                -- "sub_98765432"
  deal_name,              -- "New Platform Subscription"
  amount,                 -- monthly_recurring_revenue__accounting_ (float)
  company_name,           -- From CRM v4 association lookup
  owner_name,             -- Closer name or "Product-Led Growth"
  hubspot_owner_id,       -- metadata_closer_owner_id or PLG fallback
  event_type,             -- 'subscription'
  dashboard_type,         -- 'all' (shows on BOTH dashboards)
  subscription_interval,  -- "monthly" / "yearly"
  subscription_mrr,       -- Same as amount
  is_plg,                 -- true/false
  celebrated              -- false
) VALUES (...);
```

#### Test Mode

```
GET /functions/v1/hubspot-subscription-webhook?subscriptionId=98765432
```

Returns validation results and optionally creates celebration:
```json
{
  "success": true,
  "subscriptionId": "98765432",
  "valid": true,
  "checks": {
    "type": { "passed": true, "value": "SaaS", "expected": "SaaS" },
    "status": { "passed": true, "value": "Active", "expected": "Active" },
    ...
  },
  "celebrationCreated": true,
  "properties": { ... }
}
```

---

### 2.4 `hubspot-churn-webhook` — Churn Alerts

**File**: `supabase/functions/hubspot-churn-webhook/index.ts` (328 lines)
**Config**: `verify_jwt = false`
**Endpoint**: `POST /functions/v1/hubspot-churn-webhook`

Handles canceled SaaS subscriptions to display churn alerts on the dashboard.

#### Payload Formats Accepted

```json
{ "objectId": "98765432" }
// or
{ "object": { "objectId": 98765432 } }
// or
{ "subscriptionId": "98765432" }
// or array format
[{ "objectId": 98765432 }]
```

#### Validation

```typescript
async function validateChurn(subscriptionId): Promise<ChurnValidationResult> {
  // Fetch: GET /crm/v3/objects/2-42092209/{id}?properties=type,package___status_reports,canceled_at,monthly_recurring_revenue__accounting_,...
  // Must be: type === "SaaS"
  // Must be: package___status_reports === "Canceled"
  // Must have: canceled_at
  // Must NOT be: excluded owner (702756896)
}
```

#### API Calls

1. **Fetch subscription**: `GET /crm/v3/objects/2-42092209/{id}?properties=type,package___status_reports,canceled_at,monthly_recurring_revenue__accounting_,hubspot_owner_id,metadata_closer_owner_id,name,hs_object_id`
2. **Fetch owner name**: `GET /crm/v3/owners/{ownerId}`
3. **Fetch company**: `GET /crm/v3/objects/2-42092209/{id}/associations/company` → `GET /crm/v3/objects/companies/{companyId}?properties=name`

#### What Gets Written

```sql
INSERT INTO pending_celebrations (
  deal_id,       -- "churn_98765432"
  deal_name,     -- Subscription name or "SaaS Subscription"
  company_name,  -- From association lookup
  owner_name,    -- Owner full name
  hubspot_owner_id,
  amount,        -- Lost MRR (monthly_recurring_revenue__accounting_)
  subscription_mrr,
  event_type,    -- 'subscription_churn'
  dashboard_type,-- 'all'
  celebrated,    -- false
  program_result_at -- canceled_at timestamp
) VALUES (...);
```

#### Webhook Logging

Every payload is logged to `webhook_logs`:
```typescript
await supabase.from("webhook_logs").insert({
  webhook_name: "hubspot-churn-webhook",
  event_type: "subscription_churn",
  raw_payload: payload,
  processed: boolean,
  error_message: string | null,
});
```

---

### 2.5 `hubspot-metrics` — Service Team Dashboard KPIs

**File**: `supabase/functions/hubspot-metrics/index.ts` (793 lines)
**Config**: `verify_jwt = false`
**Endpoint**: Invoked via `supabase.functions.invoke("hubspot-metrics")`

This is the main KPI aggregation function. Called by the frontend every 60 seconds via React Query.

#### Authentication

Requires the frontend user's auth token (checks `Authorization` header). Uses service role key for HubSpot API and DB cache.

#### Caching

- **Cache key**: `hubspot-metrics`
- **TTL**: 15 minutes
- **Storage**: `api_cache` table

```typescript
const { data: cached } = await supabase
  .from('api_cache')
  .select('data, expires_at')
  .eq('id', CACHE_KEY)
  .single();

if (cached && new Date(cached.expires_at) > new Date()) {
  return cached.data; // Return immediately
}
```

#### Custom Fiscal Quarters

```
Q1: November 1  – January 31
Q2: February 1  – April 30
Q3: May 1       – July 31
Q4: August 1    – October 31
```

Implementation:
```typescript
function getFiscalQuarterDates(date: Date): { start: Date; end: Date; quarter: number } {
  const month = date.getMonth(); // 0-indexed
  if (month >= 10) // Nov-Dec: Q1
    return { start: new Date(year, 10, 1), end: new Date(year+1, 1, 0, 23,59,59,999), quarter: 1 };
  else if (month <= 0) // Jan: Q1
    return { start: new Date(year-1, 10, 1), end: new Date(year, 1, 0, 23,59,59,999), quarter: 1 };
  else if (month <= 3) // Feb-Apr: Q2
    return { start: new Date(year, 1, 1), end: new Date(year, 4, 0, 23,59,59,999), quarter: 2 };
  // ... Q3 (May-Jul), Q4 (Aug-Oct)
}
```

#### KPIs Computed (6+ HubSpot API Search Calls)

##### 1. Accepted This Quarter

```typescript
const acceptedDeals = await searchDeals([
  { propertyName: "montant_sub_accepte", operator: "GT", value: "0" },
  { propertyName: "program_result_at", operator: "GTE", value: currentQuarterStartISO },
  { propertyName: "program_result_at", operator: "LTE", value: currentQuarterEndISO },
  { propertyName: "program_applied_at", operator: "HAS_PROPERTY" },
], ["dealname", "montant_sub_accepte", "program_result_at", "program_applied_at"]);

const total = acceptedDeals.results.reduce((sum, d) =>
  sum + parseFloat(d.properties.montant_sub_accepte || "0"), 0);
```

Key: `program_applied_at HAS_PROPERTY` ensures only deals with a complete application→acceptance journey are counted.

##### 2. Applied This Quarter

```typescript
const appliedDeals = await searchDeals([
  { propertyName: "pipeline", operator: "EQ", value: "84370238" },
  { propertyName: "program_applied_at", operator: "GTE", value: currentQuarterStartISO },
  { propertyName: "program_applied_at", operator: "LTE", value: currentQuarterEndISO },
], ["dealname", "montant_demande___psce", "program_applied_at"]);
```

##### 3. New Clients This Quarter

Count of **unique company IDs** from accepted deals (via deal associations).

##### 4. Active Platform Subscribers

```typescript
const activeSubscriptions = await searchSubscriptions([
  { propertyName: "type", operator: "EQ", value: "SaaS" },
  { propertyName: "package___status_reports", operator: "EQ", value: "Active" },
  { propertyName: "metadata_subscription_type", operator: "EQ", value: "advanced" },
], ["type", "package___status_reports", "stripe_subscription_id",
    "metadata_subscription_type", "hs_object_source_detail_1", "hubspot_owner_id"]);
```

**Post-fetch filtering** (applied to all results):
```typescript
const filtered = activeSubscriptions.results.filter(sub => {
  const sourceDetail = (sub.properties.hs_object_source_detail_1 || '').trim();
  const ownerId = (sub.properties.hubspot_owner_id || '').trim();
  const stripeId = (sub.properties.stripe_subscription_id || '').trim().toLowerCase();

  return sourceDetail !== 'hD Platform - Set Up Demo SaaS'
    && ownerId !== '702756896'
    && !(stripeId && stripeId.includes('demo'));
});
```

##### 5. Quote Signed Count

Deals that entered stage `1048785581` after November 1, 2025:
```typescript
const quoteSignedDeals = await searchDeals([
  { propertyName: "hs_v2_date_entered_1048785581", operator: "GTE", value: nov2025ISO },
], ["dealname", "hs_v2_date_entered_1048785581"]);
```

##### 6. Previous Quarter Comparisons

Same queries repeated for previous fiscal quarter to calculate trend percentages.

##### 7. Recent Wins (Combined)

Combines three deal types into a unified list:
1. **Acceptations**: Top 10 accepted deals by `program_result_at`
2. **Quote signed**: Deals with `hs_v2_date_entered_1048785581 >= Nov 2025`
3. **Renewal signed**: Deals with `renewal_signed >= Nov 2025`

```typescript
const allWins = [...recentWins, ...quoteSignedWins, ...renewalSignedWins]
  .filter(win => !win.clientName.toLowerCase().includes('hellodarwin'))
  .sort((a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime())
  .slice(0, 15);
```

Each win includes employee photos matched from the `employees` table:
```typescript
const employee = employeesMap.get(ownerId);
ownerPhotoUrl = employee?.photo_url;
```

#### Pagination

Both `searchDeals()` and `searchSubscriptions()` implement full pagination:

```typescript
async function searchDeals(filters, properties) {
  let allResults = [];
  let after = undefined;
  do {
    const response = await rateLimitedFetch(`/crm/v3/objects/deals/search`, {
      method: "POST",
      body: JSON.stringify({ filterGroups: [{ filters }], properties, limit: 100, after }),
    });
    const data = await response.json();
    allResults = allResults.concat(data.results);
    after = data.paging?.next?.after;
    if (after) await delay(200); // Rate limit protection
  } while (after);
  return { results: allResults, total: allResults.length };
}
```

#### Response Shape

```typescript
interface DashboardMetrics {
  acceptedThisQuarter: number;        // Sum of montant_sub_accepte
  acceptedLastQuarter: number;
  appliedThisQuarter: number;         // Sum of montant_demande___psce
  appliedLastQuarter: number;
  newClientsThisQuarter: number;      // Unique company count
  newClientsLastQuarter: number;
  activePlatformSubscribers: number;  // Filtered subscription count
  quoteSignedCount: number;
  monthlyChart: {
    month: string;   // "Jan 2025"
    amount: number;  // Rounded integer
  }[];
  recentWins: {
    id: string;
    dealName: string;
    clientName: string;
    amount: number;
    resultDate: string;       // ISO date
    ownerName: string;
    ownerPhotoUrl: string | null;
    accountManagerName: string;
    accountManagerPhotoUrl: string | null;
    winType: 'acceptation' | 'quote_signed' | 'renewal_signed';
  }[];
}
```

#### Frontend Hook

```typescript
// src/hooks/useDashboardData.ts
export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<DashboardMetrics>("hubspot-metrics");
      if (error) throw error;
      return data;
    },
    refetchInterval: 60 * 1000,       // Every 60 seconds
    staleTime: 30 * 1000,             // Stale after 30s
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true, // TV display always refreshes
  });
};
```

---

### 2.6 `hubspot-dev-metrics` — Dev Team Dashboard KPIs

**File**: `supabase/functions/hubspot-dev-metrics/index.ts` (572 lines)
**Config**: `verify_jwt = false`
**Endpoint**: Invoked via `supabase.functions.invoke("hubspot-dev-metrics")`

#### Caching

- **Cache key**: `dev_dashboard_metrics`
- **TTL**: 5 minutes

#### KPIs Computed (3 Parallel API Calls)

All three data sources are fetched in parallel:
```typescript
const [subscriptionMetrics, signupCounts, weeklyNewSubscribers] = await Promise.all([
  fetchActiveSaaSSubscriptions(),
  fetchSignupCounts(),
  fetchWeeklyNewSubscribers(),
]);
```

##### 1. Active Subscribers + MRR

Identical subscription search and filtering as `hubspot-metrics` (with `.trim()` for whitespace parity).

```typescript
const filteredSubscriptions = allSubscriptions.filter(sub => {
  const sourceDetail = (sub.properties.hs_object_source_detail_1 || '').trim();
  const ownerId = (sub.properties.hubspot_owner_id || '').trim();
  const stripeId = (sub.properties.stripe_subscription_id || '').trim().toLowerCase();
  return sourceDetail !== 'hD Platform - Set Up Demo SaaS'
    && ownerId !== '702756896'
    && !(stripeId !== '' && stripeId.includes('demo'));
});

let totalMRR = 0;
for (const sub of filteredSubscriptions) {
  totalMRR += parseFloat(sub.properties?.monthly_recurring_revenue || "0");
}
```

##### 2. Signups This/Last Week

Uses the custom `signedup_at` contact property:
```typescript
// This week: signedup_at >= startOfWeek AND signedup_at <= now
const thisWeekResponse = await fetch("/crm/v3/objects/contacts/search", {
  body: JSON.stringify({
    filterGroups: [{
      filters: [
        { propertyName: "signedup_at", operator: "GTE", value: startOfThisWeek.getTime().toString() },
        { propertyName: "signedup_at", operator: "LTE", value: now.getTime().toString() },
      ],
    }],
    properties: ["signedup_at"],
    limit: 1, // Only need total count
  }),
});
const thisWeekCount = thisWeekData.total;
```

##### 3. Weekly New Subscribers Chart

Fetches subscriptions with `activated_at >= Dec 1, 2025`, groups by ISO week:

```typescript
// Handle both timestamp and ISO date formats for activated_at
if (activatedAt.includes('T') || activatedAt.includes('Z')) {
  activatedDate = new Date(activatedAt);       // ISO string
} else {
  const numValue = parseInt(activatedAt, 10);
  if (numValue > 1000000000000) {
    activatedDate = new Date(numValue);          // Millisecond timestamp
  } else {
    activatedDate = new Date(numValue * 1000);   // Second timestamp
  }
}
```

Week labels formatted as `"Jan 6"`, `"Jan 13"`, etc.

#### 30-Day Trend Snapshots

Daily snapshot saved with 45-day retention:
```typescript
async function saveDailySnapshot(supabase, metrics) {
  const today = new Date().toISOString().split("T")[0];
  const snapshotKey = `dev_metrics_30_day_snapshot_${today}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 45);

  await supabase.from("api_cache").upsert({
    id: snapshotKey,
    data: metrics,
    cached_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  });
}
```

Trend lookup searches for snapshot from ~30 days ago (±1 day window):
```typescript
async function get30DaySnapshot(supabase) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  // Query api_cache with id = "dev_metrics_30_day_snapshot" within window
  // Falls back to oldest available snapshot
}
```

#### Response Shape

```typescript
interface DevDashboardMetrics {
  activeSubscribers: number;
  activeSubscribers30DaysAgo: number;  // From snapshot
  activeSaaSMRR: number;
  activeSaaSMRR30DaysAgo: number;      // From snapshot
  signupsThisWeek: number;
  signupsLastWeek: number;
  weeklyNewSubscribers: { week: string; count: number }[];
}
```

#### Frontend Hook

```typescript
// src/hooks/useDevDashboardData.ts
export const useDevDashboardData = () => {
  return useQuery({
    queryKey: ["dev-dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("hubspot-dev-metrics");
      if (error) throw error;
      return data as DevDashboardMetrics;
    },
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
};
```

---

### 2.7 `hubspot-sync-owners` — Employee Sync

**File**: `supabase/functions/hubspot-sync-owners/index.ts` (100 lines)
**Config**: `verify_jwt = false`
**Endpoint**: Invoked manually or via cron

#### Process

1. `GET /crm/v3/owners` — fetches ALL HubSpot owners
2. For each owner, upserts into `employees`:

```typescript
await supabase.from('employees').upsert({
  hubspot_owner_id: owner.id,
  name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
  email: owner.email,
  id: owner.id,
}, {
  onConflict: 'hubspot_owner_id',
  ignoreDuplicates: false,
});
```

Key: Does NOT overwrite `photo_url` (photos come from Slack sync).

---

## 3. Slack Integration

### 3.1 Authentication

| Setting | Value |
|---------|-------|
| **Bot Token** | `SLACK_BOT_TOKEN` |
| **Signing Secret** | `SLACK_SIGNING_SECRET` |
| **Required scopes** | `channels:history`, `channels:join`, `reactions:read`, `users:read`, `users:read.email`, `files:read`, `chat:write` |

### Signature Verification

```typescript
async function verifySlackSignature(body, timestamp, signature): Promise<boolean> {
  const sigBasestring = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey("raw",
    encoder.encode(SLACK_SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(sigBasestring));
  const computed = `v0=${Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2,"0")).join("")}`;
  return computed === signature;
}
```

---

### 3.2 `slack-photo-webhook` — Multi-Purpose Event Handler

**File**: `supabase/functions/slack-photo-webhook/index.ts` (1135 lines)
**Config**: `verify_jwt = false`
**Endpoint**: `POST /functions/v1/slack-photo-webhook`

This single function handles **6 distinct data flows** from Slack events.

#### URL Verification

```json
POST { "type": "url_verification", "challenge": "abc123" }
→ { "challenge": "abc123" }
```

#### Flow A — Coal Emoji Reaction (`:coal:` → Dashboard Feed)

**Trigger**: `event.type === "reaction_added"` AND `reaction.reaction === "coal"`

**Processing**:
1. **Duplicate check**: Query `dashboard_feed` WHERE `slack_message_ts = {ts}` AND `slack_channel_id = {channel}`
2. **Fetch original message**: `conversations.history?channel={id}&latest={ts}&limit=1&inclusive=true`
   - If `not_in_channel` error → auto-join via `conversations.join`, retry
3. **Fetch author**: `users.info?user={userId}`
   - Handles bot messages: falls back to `message.username` or `message.bot_id` or `"Bot"`
4. **Fetch reactor**: `users.info?user={reactorUserId}`
5. **Download images**: If message has `files[]`, download via bot token auth, upload to `dashboard-images` storage bucket
6. **Fetch reactions**: `reactions.get?channel={id}&timestamp={ts}` → `[{ name: "thumbsup", count: 3 }, ...]`
7. **Fetch channel name**: `conversations.info?channel={id}` → `channelInfo.name`
8. **Convert emoji shortcodes**: 130+ shortcode-to-Unicode mappings + Slack formatting cleanup

```typescript
function convertSlackEmojis(text: string): string {
  let result = text.replace(/:([a-z0-9_+-]+):/gi, (match, emojiName) => {
    return emojiMap[emojiName.toLowerCase()] || match;
  });
  result = result.replace(/<!channel>/g, "@channel");
  result = result.replace(/<@([A-Z0-9]+)>/g, "@user");
  result = result.replace(/<#([A-Z0-9]+)\|([^>]+)>/g, "#$2");
  result = result.replace(/<([^|>]+)\|([^>]+)>/g, "$2");
  return result;
}
```

9. **Insert** into `dashboard_feed`:

```sql
INSERT INTO dashboard_feed (
  content_type,        -- 'text' | 'photo' | 'both'
  text_content,        -- Converted emoji text
  image_url,           -- Supabase storage public URL
  author_name,         -- Slack display name
  submitted_by,        -- Reactor's name
  source,              -- 'slack'
  slack_message_ts,
  slack_channel_id,
  slack_channel_name,  -- "#channel-name"
  reactions            -- JSON array: [{"name":"thumbsup","count":3}]
) VALUES (...);
```

#### Flow B — Plat du Jour Detection

**Trigger**: `event.event.type === "message"` AND `message.user === "U911VV17T"` AND channel name === `"teambureau"` AND `message.files.length > 0`

**Constants**:
```typescript
const PLAT_DU_JOUR_USER_ID = "U911VV17T";
const PLAT_DU_JOUR_CHANNEL_NAME = "teambureau";
const PLAT_DU_JOUR_CHANNEL_ID = "C01B357ELMQ"; // fallback
```

**Processing**:
1. Verify channel name via `fetchChannelInfo(message.channel)`
2. Download food photo from `message.files[0].url_private`
3. Upload to `dashboard-images` storage bucket
4. Extract caption from `message.text` (with emoji conversion)
5. Insert into `pending_celebrations`:

```sql
INSERT INTO pending_celebrations (
  deal_id,     -- "plat_du_jour_{message.ts}"
  deal_name,   -- Caption or "Bon appétit!"
  event_type,  -- 'plat_du_jour'
  image_url,   -- Supabase storage URL
  celebrated   -- false
) VALUES (...);
```

#### Flow C — Notion Task Completion

**Trigger**: `message.channel === "C096FP0NCLA"` AND `message.bot_id === "B02PNHPPZ36"`

**Constants**:
```typescript
const NOTION_BOT_ID = "B02PNHPPZ36";
const NOTION_CHANNEL_ID = "C096FP0NCLA"; // #digital
```

**Message parsing**:
```typescript
function parseNotionTaskMessage(text) {
  const taskMatch = text.match(/la\s+tâche\s*:\s*(.+?)(?:\n|$)/i);
  const projectMatch = text.match(/Projet\s*:\s*(.+?)(?:\n|$)/i);
  const mentionPattern = /<@([A-Z0-9]+)>/g; // Extract @mentions
  return { taskName, projectName, mentionedUserIds };
}
```

**Employee matching**:
1. Get first mentioned user's Slack profile: `users.info?user={id}`
2. Extract email from profile
3. Query `employees` table by email to get `hubspot_owner_id`

**Insert** into `pending_celebrations` with `event_type: 'notion_task'`, `dashboard_type: 'dev'`.

#### Flow D — Spotify Song Extraction

**Trigger**: `message.channel === "C05QK9107PW"` AND message text contains `spotify.com/track/`

**Constants**:
```typescript
const SPOTIFY_CHANNEL_ID = "C05QK9107PW";
```

**Processing**:
1. Extract track ID: `url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)`
2. Fetch metadata from Spotify embed page HTML:
   - `GET https://open.spotify.com/embed/track/{trackId}`
   - Parse `<meta property="og:title">` for `"Track Name - song and lyrics by Artist"`
   - Parse `<meta property="og:image">` for cover art
3. Fallback: `GET https://open.spotify.com/oembed?url={url}` (returns title + thumbnail, no artist split)
4. Insert into `slack_spotify_songs`:

```sql
INSERT INTO slack_spotify_songs (
  spotify_url,      -- Full URL
  track_name,       -- Parsed from og:title
  artist_name,      -- Parsed from og:title (null from oEmbed)
  cover_image_url,  -- og:image URL
  posted_by,        -- Slack user display name
  slack_message_ts
) VALUES (...);
```

#### Flow E — Team Photos (Legacy)

**Trigger**: `event.event.type === "message"` AND `channel_type === "channel"` AND message has `files`

Stores raw Slack image URLs (no re-upload) into `team_photos` table.

#### Flow F — Auto-Join Public Channels

Fires on **every event** (fire-and-forget):

```typescript
joinAllPublicChannels().catch(err => console.error("Error:", err));
```

Paginates through `conversations.list?types=public_channel&exclude_archived=true`, calls `conversations.join` for non-member channels with 1-second delay between joins.

#### Manual Trigger Endpoints (GET)

```
GET ?action=join-channels     → Joins all public channels
GET ?action=test-plat-du-jour → Triggers plat du jour from last image
```

#### Slack API Calls Summary

| API | Method | Purpose |
|---|---|---|
| `conversations.history` | GET | Fetch original message by timestamp |
| `conversations.join` | POST | Join channel |
| `conversations.list` | GET | List all public channels |
| `conversations.info` | GET | Get channel name |
| `users.info` | GET | Get user display name, email |
| `reactions.get` | GET | Fetch all reactions on a message |

---

### 3.3 `sync-employee-photos` — Profile Photo Sync

**File**: `supabase/functions/sync-employee-photos/index.ts` (216 lines)
**Endpoint**: Invoked via admin panel button

#### Request Body

```json
{ "forceRefresh": true }  // Optional, re-syncs all employees
// or empty (only syncs employees without photos)
```

#### Process Per Employee

```typescript
for (const employee of employees) {
  await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit

  // 1. Look up Slack user by email
  const lookupData = await fetch(
    `https://slack.com/api/users.lookupByEmail?email=${employee.email}`,
    { headers: { Authorization: `Bearer ${slackToken}` } }
  );

  // 2. Get best available image
  const imageUrl = lookupData.user.profile.image_512
    || lookupData.user.profile.image_192
    || lookupData.user.profile.image_72;

  // 3. Download image from Slack (requires auth)
  const imageResponse = await fetch(imageUrl, {
    headers: { Authorization: `Bearer ${slackToken}` }
  });

  // 4. Upload to employee-photos storage bucket
  await supabase.storage.from('employee-photos').upload(fileName, imageBlob, {
    upsert: true,
    contentType: contentType,
  });

  // 5. Update employee record with cache-busting URL
  const photoUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
  await supabase.from('employees').update({ photo_url: photoUrlWithCacheBust }).eq('id', employee.id);
}
```

---

## 4. Google Analytics 4 Integration

### 4.1 JWT Service Account Authentication

**File**: `supabase/functions/google-analytics-realtime/index.ts` (195 lines)

Three-step process using Web Crypto API:

**Step 1 — Create JWT (RS256)**:
```typescript
async function createJWT(clientEmail, privateKey) {
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Import private key (handle \\n → \n conversion)
  const normalizedKey = privateKey.replace(/\\n/g, '\n');
  const pemContents = normalizedKey.replace(/-----...-----/g, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey,
    encoder.encode(`${headerB64}.${payloadB64}`));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
```

**Step 2 — Exchange JWT for access token**:
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded
grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion={jwt}
```

**Step 3 — Call GA4 Realtime API**:
```
POST https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY_ID}:runRealtimeReport
Authorization: Bearer {access_token}
Body: { "metrics": [{ "name": "activeUsers" }] }
```

### 4.2 `google-analytics-realtime` — Live Active Users

#### Caching

- **Cache key**: `ga_realtime_active_users`
- **TTL**: 30 seconds

#### Rate Limit Handling

On HTTP 429, returns stale cache even if expired:
```typescript
if (response.status === 429) {
  const { data: staleCache } = await supabase
    .from('api_cache').select('data').eq('id', CACHE_KEY).maybeSingle();
  if (staleCache?.data) {
    return { ...staleCache.data, fromCache: true, rateLimited: true };
  }
}
```

#### Response

```json
{ "activeUsers": 42, "timestamp": 1720000000000 }
// or cached:
{ "activeUsers": 42, "timestamp": 1720000000000, "fromCache": true }
// or rate-limited:
{ "activeUsers": 42, "timestamp": 1719999970000, "fromCache": true, "rateLimited": true }
```

#### Frontend Hook

```typescript
// src/hooks/useRealtimeAnalytics.ts
export const useRealtimeAnalytics = (pollInterval = 30000) => {
  const [data, setData] = useState({ activeUsers: 0, previousValue: 0, isLoading: true, ... });
  const previousValueRef = useRef(0);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      const { data: result } = await supabase.functions.invoke("google-analytics-realtime");
      setData(prev => ({
        activeUsers: result?.activeUsers ?? 0,
        previousValue: previousValueRef.current, // For animation
        isLoading: false,
        lastUpdated: new Date(),
      }));
      previousValueRef.current = result?.activeUsers ?? 0;
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return data;
};
```

The `LiveKPICard` component animates between `previousValue` and `activeUsers` using `setInterval` stepping.

---

## 5. Lovable AI Integration

### 5.1 `generate-fun-fact` — AI-Generated Daily Fact

**File**: `supabase/functions/generate-fun-fact/index.ts` (168 lines)

#### Caching

- **Cache key**: `fun-fact-daily`
- **TTL**: 24 hours

#### Process

1. Check cache — return cached fact if < 24 hours old
2. Fetch last 50 `pending_celebrations` and 50 `celebrated_deals` for context
3. Build statistics summary (total accepted value, application count, unique clients, team members)
4. Call Lovable AI Gateway:

```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'You are a fun facts generator for a sales dashboard at a grant consulting company...' },
      { role: 'user', content: `Generate a fun fact based on this data:\n\n${context}` },
    ],
    max_tokens: 150,
    temperature: 0.9,
  }),
});
```

5. Cache result for 24 hours
6. Fallback fact on any error: *"Government grants are a powerful tool for businesses to innovate, expand, and create jobs."*

---

## 6. Direct Submission

### 6.1 `submit-to-feed` — QR Code Submissions

**File**: `supabase/functions/submit-to-feed/index.ts` (76 lines)

Allows dashboard visitors to submit content via the QR code page (`/submit`).

#### Request

```json
{
  "content_type": "both",           // "text" | "image" | "both"
  "text_content": "Great event!",
  "image_url": "https://...",       // From client-side upload
  "author_name": "John Doe"
}
```

#### Processing

1. Validate: `author_name` required, at least one of `text_content` or `image_url`
2. Extract client IP from headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
3. Insert into `dashboard_feed`:

```sql
INSERT INTO dashboard_feed (
  content_type, text_content, image_url,
  author_name,
  source,          -- 'qr'
  submitter_ip     -- Client IP for moderation
) VALUES (...);
```

---

## 7. Frontend Data Consumption

| Hook / Service | Edge Function | Refresh Mechanism | Cache TTL | Data Displayed |
|---|---|---|---|---|
| `useDashboardData` | `hubspot-metrics` | React Query `refetchInterval: 60s` | 15 min | KPI cards, recent wins, monthly chart |
| `useDevDashboardData` | `hubspot-dev-metrics` | React Query `refetchInterval: 60s` | 5 min | Dev KPIs, weekly subscribers chart |
| `useRealtimeAnalytics` | `google-analytics-realtime` | `setInterval(30s)` | 30 sec | Live active users count |
| `useCelebrationRealtime` | Supabase Realtime (INSERT) | Postgres Changes subscription | N/A | Celebration popups |
| Dashboard Feed component | Supabase query + Realtime | `refetchInterval: 30s` + INSERT events | N/A | Slack content carousel |

---

## 8. Realtime Celebration Service

**File**: `src/services/realtimeCelebrationService.ts` (475 lines)

The `useCelebrationRealtime()` hook is the heart of the celebration display system.

### Connection Management

```typescript
const channel = supabase
  .channel('celebrations-' + Date.now()) // Unique name forces fresh connection
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pending_celebrations',
  }, async (payload) => {
    // Filter by dashboard_type
    const celebDashType = payload.new.dashboard_type || 'service';
    const currentDashType = useDashboardStore.getState().dashboardType;
    if (celebDashType !== currentDashType && celebDashType !== 'all') return;

    if (payload.new.celebrated === false) {
      await triggerCelebration(payload.new);
    }
  })
  .subscribe();
```

### Resilience Features

| Feature | Implementation |
|---|---|
| **Reconnection** | Exponential backoff (3s base, 60s cap), unlimited retries |
| **Health check** | Every 60 seconds, verifies `isSubscribed` flag |
| **Pending check** | Every 30 seconds, queries uncelebrated records as failsafe |
| **Visibility change** | Re-subscribes when tab becomes visible |
| **Token refresh** | Reconnects on `TOKEN_REFRESHED` auth event |
| **Client-side dedup** | `localStorage` tracks shown `deal_id`s for 24 hours |

### Celebration Triggering

```typescript
async function triggerCelebration(celebration) {
  // 1. Check if THIS client already showed it (localStorage)
  if (hasShownCelebration(celebration.deal_id)) return;
  markCelebrationShown(celebration.deal_id);

  // 2. Fetch employee photos from employees table
  const { data: employee } = await supabase.from('employees')
    .select('*').eq('hubspot_owner_id', celebration.hubspot_owner_id).maybeSingle();

  const { data: accountManager } = await supabase.from('employees')
    .select('*').eq('hubspot_owner_id', celebration.account_manager_owner_id).maybeSingle();

  // 3. Build Event object with display_title based on event_type
  const event: Event = {
    id: celebration.deal_id,
    display_title: eventType === 'subscription' ? '🚀 New Subscription!'
      : eventType === 'application' ? '📄 New Application!'
      : eventType === 'quote_signed' ? '✍️ New Signature!'
      : /* ... more types */ '🎉 New Win!',
    display_message: celebration.deal_name,
    montant: formatCurrency(celebration.amount),
    employee,
    account_manager: accountManager,
    event_type: celebration.event_type,
    // ... all other fields
  };

  // 4. Queue or display immediately
  if (showCelebration) {
    queueCelebration(event);     // Zustand queue
  } else {
    setCurrentEvent(event);
    setRandomGifUrl(getRandomGif(gifCategory));
    setShowCelebration(true);
  }

  // 5. Record in celebrated_deals history (non-blocking)
  supabase.from('celebrated_deals').insert({
    deal_id: celebration.deal_id,
    deal_name: celebration.deal_name,
    amount: celebration.amount,
  });
}
```

### GIF Category Mapping

| Event Type | GIF Category |
|---|---|
| `win` | `celebration` |
| `application` | `food` |
| `subscription` | `fastcar` |
| `quote_signed`, `renewal_signed` | `quotesigned` |
| `pdm_paid` | `pdmpaid` |
| `pkg_paid` | `pkgpaid` |
| `subscription_churn` | `churn` |
| `notion_task` | `notiontask` |
| `plat_du_jour` | *(uses `celebration.image_url` directly)* |

---

## 9. Caching Strategy

All caching uses the `api_cache` table:

| Cache Key | TTL | Written By | Read By |
|---|---|---|---|
| `hubspot-metrics` | 15 min | `hubspot-metrics` | Same |
| `dev_dashboard_metrics` | 5 min | `hubspot-dev-metrics` | Same |
| `ga_realtime_active_users` | 30 sec | `google-analytics-realtime` | Same (+ stale fallback on 429) |
| `fun-fact-daily` | 24 hours | `generate-fun-fact` | Same |
| `dev_metrics_30_day_snapshot_{date}` | 45 days | `hubspot-dev-metrics` | Same (trend lookup) |

### Cache Read Pattern

```typescript
const { data: cached } = await supabase
  .from('api_cache')
  .select('data, expires_at')
  .eq('id', CACHE_KEY)
  .single();

if (cached && new Date(cached.expires_at) > new Date()) {
  return cached.data; // Skip all API calls
}
```

### Cache Write Pattern

```typescript
const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
await supabase.from('api_cache').upsert({
  id: CACHE_KEY,
  data: result,
  cached_at: new Date().toISOString(),
  expires_at: expiresAt,
});
```

---

## 10. Secrets Reference

| Secret | Service | Used By |
|---|---|---|
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App | `hubspot-deal-webhook`, `hubspot-subscription-webhook`, `hubspot-churn-webhook`, `hubspot-metrics`, `hubspot-dev-metrics`, `hubspot-sync-owners` |
| `SLACK_BOT_TOKEN` | Slack Bot | `slack-photo-webhook`, `sync-employee-photos` |
| `SLACK_SIGNING_SECRET` | Slack App | `slack-photo-webhook` (HMAC-SHA256 verification) |
| `GA_PROPERTY_ID` | Google Analytics | `google-analytics-realtime` |
| `GA_CLIENT_EMAIL` | Google Service Account | `google-analytics-realtime` |
| `GA_PRIVATE_KEY` | Google Service Account | `google-analytics-realtime` (RSA signing) |
| `LOVABLE_API_KEY` | Lovable AI Gateway | `generate-fun-fact` |

All secrets are stored as Supabase Edge Function secrets and accessed via `Deno.env.get()`.

---

## 11. Database Tables in Integrations

| Table | Written By | Read By | Realtime |
|---|---|---|---|
| `pending_celebrations` | `hubspot-deal-webhook`, `hubspot-subscription-webhook`, `hubspot-churn-webhook`, `slack-photo-webhook` | Frontend (`useCelebrationRealtime`) | ✅ INSERT |
| `celebrated_deals` | Frontend (after popup display) | Webhooks (duplicate check) | — |
| `api_cache` | `hubspot-metrics`, `hubspot-dev-metrics`, `google-analytics-realtime`, `generate-fun-fact` | Same functions (cache read) | — |
| `dashboard_feed` | `slack-photo-webhook` (coal emoji), `submit-to-feed` | Frontend (Dashboard Feed component) | ✅ INSERT |
| `employees` | `hubspot-sync-owners`, `sync-employee-photos` | Frontend (photo lookup), `hubspot-metrics` (recent wins), `slack-photo-webhook` (Notion task matching) | — |
| `webhook_logs` | `hubspot-churn-webhook`, `slack-photo-webhook` | Admin debug panel | — |
| `slack_spotify_songs` | `slack-photo-webhook` (Spotify flow) | Frontend (Spotify widget) | — |
| `team_photos` | `slack-photo-webhook` (message events) | Frontend (team photos feed) | — |
| `celebration_sound_settings` | Admin panel | Frontend (sound engine) | — |
| `celebration_special_modes` | Admin panel | Frontend (epic mode) | — |
