# CelebBoard — Celebration & KPI Builder Redesign

> UX Specification + Data Architecture + Cursor Agent Prompts
>
> March 2026

---

## Problem Statement

The current celebration and KPI admin UI requires users to manually type HubSpot property internal names, write template patterns with `{{brackets}}` by hand, and configure triggers through cramped dialog modals. This is a developer tool, not a customer-facing product.

**Current pain points:**
1. **Raw text inputs everywhere** — user must know that `montant_sub_accepte` is the HubSpot property for "Accepted Subscription Amount"
2. **No schema awareness** — no dropdowns of available properties, pipelines, stages, or owners
3. **Popup dialogs for complex forms** — template creation and trigger creation happen in small modals that can't show enough context
4. **Two separate creation flows** — create a template first, then separately add triggers — feels disconnected
5. **No preview** — user has no idea what the celebration will look like on the TV until it fires
6. **KPI setup is equally manual** — raw JSON query configs instead of guided field selection
7. **No type-aware inputs** — a date field shows the same text input as a number field or a dropdown field

**Target state:** An admin connects HubSpot, and the system fetches ALL of their account's deal properties, pipelines, stages, and owners. When building a celebration or KPI, every field is a searchable dropdown. Conditions use type-aware inputs (date pickers for dates, number inputs for numbers, multi-select for enumerations). Template patterns are built by clicking "Insert Field" buttons, not typing brackets. A final preview step shows the celebration exactly as it will appear on TV.

---

## Part 1: Schema Discovery Layer (Foundation)

Everything depends on this. Before any UI work, CelebBoard must fetch and cache the customer's actual HubSpot schema.

### 1.1 New Table: `integration_schemas`

```sql
CREATE TABLE integration_schemas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid REFERENCES integrations(id) ON DELETE CASCADE,
  schema_type     text NOT NULL,        -- 'properties', 'pipelines', 'owners', 'stages'
  object_type     text,                 -- 'deals', 'contacts', 'companies', 'tickets' (null for pipelines/owners)
  data            jsonb NOT NULL,       -- the full schema payload
  fetched_at      timestamptz DEFAULT now(),
  expires_at      timestamptz,          -- fetched_at + 24 hours
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(integration_id, schema_type, object_type)
);
```

### 1.2 What to Fetch from HubSpot

After OAuth completes (or on manual "Refresh Schema" button), fetch and cache:

| Schema Type | HubSpot API Endpoint | What It Contains |
|---|---|---|
| `properties` (deals) | `GET /crm/v3/properties/deals` | Every deal property: name, label, type, fieldType, options (for enumerations), groupName, description |
| `properties` (contacts) | `GET /crm/v3/properties/contacts` | Same structure for contacts |
| `properties` (companies) | `GET /crm/v3/properties/companies` | Same structure for companies |
| `pipelines` | `GET /crm/v3/pipelines/deals` | All deal pipelines with their stages (id, label, displayOrder) |
| `owners` | `GET /crm/v3/owners` | All HubSpot owners (id, email, firstName, lastName) |

### 1.3 HubSpot Property Schema Shape

Each property from HubSpot looks like:

```json
{
  "name": "dealstage",                    // internal API name
  "label": "Deal Stage",                  // human-readable label
  "type": "enumeration",                  // data type
  "fieldType": "select",                  // input type
  "groupName": "dealinformation",         // property group
  "description": "The current stage...",  // help text
  "options": [                            // only for enumeration types
    { "label": "Appointment Scheduled", "value": "appointmentscheduled", "displayOrder": 0 },
    { "label": "Qualified to Buy", "value": "qualifiedtobuy", "displayOrder": 1 },
    { "label": "Closed Won", "value": "closedwon", "displayOrder": 5 }
  ],
  "hasUniqueValue": false,
  "calculated": false,
  "externalOptions": false
}
```

**Key property types from HubSpot:**
- `string` — free text (fieldType: text, textarea)
- `number` — numeric value (fieldType: number)
- `date` — date only (fieldType: date)
- `datetime` — date + time (fieldType: date)
- `enumeration` — fixed options (fieldType: select, checkbox, radio)
- `bool` — true/false (fieldType: booleancheckbox)

### 1.4 API Endpoints for Schema Access

```
GET /api/integrations/[integrationId]/schema
  → Returns all cached schemas for this integration
  → If expired (>24h), triggers background refresh and returns stale data
  → Query params: ?type=properties&objectType=deals (optional filters)

POST /api/integrations/[integrationId]/schema/refresh
  → Force-refresh all schemas from HubSpot
  → Returns fresh data

GET /api/integrations/[integrationId]/schema/properties/deals
  → Shortcut: returns deal properties formatted for dropdown consumption
  → Response shape: { properties: PropertyForDropdown[] }

GET /api/integrations/[integrationId]/schema/pipelines
  → Returns pipelines with stages formatted for dropdown consumption
```

### 1.5 Dropdown-Ready Property Format

Transform the raw HubSpot schema into a format optimized for the UI:

```typescript
interface PropertyForDropdown {
  name: string;            // "dealstage" — the internal name (used in field_mapping)
  label: string;           // "Deal Stage" — human-readable (shown in dropdown)
  type: PropertyType;      // "enumeration" | "string" | "number" | "date" | "datetime" | "bool"
  fieldType: string;       // "select" | "text" | "number" | "date" | "booleancheckbox"
  group: string;           // "dealinformation" — for grouping in dropdown
  groupLabel: string;      // "Deal Information" — human-readable group name
  description?: string;    // tooltip/help text
  options?: {              // only for enumerations
    label: string;
    value: string;
  }[];
}

interface PipelineForDropdown {
  id: string;
  label: string;
  stages: {
    id: string;
    label: string;
    displayOrder: number;
  }[];
}

interface OwnerForDropdown {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;        // computed: "firstName lastName"
}
```

### 1.6 Schema Refresh Strategy

- **On OAuth connect:** Fetch all schemas immediately after tokens are stored
- **On admin page load:** Check `expires_at`. If expired, trigger background refresh; serve stale data immediately (don't block the UI)
- **Manual refresh button:** On the integration detail page, a "Refresh Schema" button triggers `POST /schema/refresh`
- **Cache TTL:** 24 hours. HubSpot schemas rarely change, but properties can be added/renamed
- **Error handling:** If HubSpot API fails on refresh, keep stale data and show a warning badge on the integration

---

## Part 2: Celebration Builder — UX Flow

### 2.1 Page Structure Change

**Current:** `/app/celebrations` page with popup dialogs for template + trigger creation
**New:** `/app/celebrations` remains the listing page, but creation/editing happens on a **dedicated full page** with a wizard flow.

```
/app/celebrations                     → List of all celebration templates (cards view)
/app/celebrations/new                 → Wizard: create new celebration (3 steps)
/app/celebrations/[id]                → Wizard: edit existing celebration (same 3 steps, pre-filled)
/app/celebrations/[id]/triggers       → (Optional) manage additional triggers for an existing template
```

### 2.2 Wizard Flow — Three Steps

The wizard creates a **template + its first trigger** in one unified flow. The user no longer thinks in terms of "templates" and "triggers" separately — they think: "I'm setting up a celebration."

#### Step 1: "When should we celebrate?" (Trigger Configuration)

This is the "source" step — which integration, which object type, and what conditions on the incoming data should fire a celebration.

**Critical design principle:** There is no special "stage change" trigger. Deal stage, pipeline, amount, owner — they're ALL just properties. The user builds any combination of conditions they want. A celebration fires when a webhook arrives and the enriched object matches ALL conditions. "Stage = Closed Won" is just a condition like any other.

**Layout:** Single column, full page width, clean sections.

**Section A: Source**
- **Integration selector** — Dropdown of connected integrations (e.g., "HubSpot (hubspot)"). If only one integration exists, pre-select it.
- **Object type selector** — Dropdown: Deals, Contacts, Companies, Tickets. Default: Deals. This determines which property schema to load for the condition builder.
- **Event type** (optional, collapsed by default) — Text input for integration-specific event routing (e.g., `deal.propertyChange`, `deal.creation`). For HubSpot, this maps to the subscription type in the webhook payload. Most users can ignore this — conditions alone are sufficient. Show via "Advanced: filter by event type" expandable link.

**Section B: Conditions — "Celebrate when..."**

This is the core of Step 1. A visual condition builder where the user defines what the data must look like for a celebration to fire. No conditions are "special" — every property is equal.

- The section header reads: **"Celebrate when all of these are true:"**
- The first condition row is shown by default (not empty state — start with one blank row to invite interaction).
- Each condition row has three parts:
  1. **Property dropdown** — Searchable dropdown of ALL properties from the schema, grouped by property group (Deal Information, Deal Activity, Custom Properties, etc.). Shows `label` (human-readable), stores `name` (internal). Includes search/filter. Type icon prefix (📝🔢📅📋✅).
  2. **Operator dropdown** — Options change dynamically based on the selected property's type:
     - `string`: equals, does not equal, contains, does not contain, starts with, ends with, is known, is unknown
     - `number`: equals, does not equal, greater than, less than, greater than or equal, less than or equal, between, is known, is unknown
     - `date`/`datetime`: equals, is before, is after, is between, within last (N days), is known, is unknown
     - `enumeration`: is any of, is none of, is known, is unknown
     - `bool`: is true, is false
  3. **Value input** — Changes dynamically based on property type AND operator:
     - `string` + text operators → text input
     - `number` + comparison → number input (with optional $ prefix if property group suggests currency)
     - `number` + `between` → two number inputs with "and" between them
     - `date` + `is before`/`is after` → date picker
     - `date` + `is between` → two date pickers
     - `date` + `within last` → number input + dropdown (days/weeks/months)
     - `enumeration` + `is any of`/`is none of` → multi-select dropdown populated from the property's actual `options` from the schema
     - `bool` operators → no value input needed (operator is sufficient)
     - `is known` / `is unknown` → no value input needed
- **"AND" label** displayed between condition rows
- Each row has a **trash icon** to remove it
- **"+ Add condition" button** at the bottom adds another row

**Section C: Starter Templates**

Below the condition builder, show clickable shortcut cards for common celebration patterns. These pre-fill the condition builder (and optionally pre-fill Step 2 defaults too):

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🎉 Deal Won     │  │ 🤝 New Client   │  │ ⭐ Subscription  │  │ ✏️ Start blank   │
│ Stage = Closed   │  │ Stage = Closed   │  │ Type = Recurring │  │                 │
│ Won + Amount > 0 │  │ Won (new co.)    │  │ + Amount > 0     │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

Clicking a starter template:
- Pre-fills conditions in the builder (e.g., "Deal Won" adds: Deal Stage is any of [Closed Won] AND Amount greater than 0)
- Pre-fills Step 2 defaults (title pattern, visual style, sound)
- User can modify any pre-filled values
- The "Start blank" card is just the default empty state

**Section D: Navigation**
- "Next: Design your celebration →" button (bottom right)
- "Cancel" link (bottom left)

**Validation before proceeding:**
- Integration must be selected
- At least one complete condition must be set (property + operator + value where applicable)

---

#### Step 2: "Design your celebration" (Template Configuration)

This is the "how it looks" step — visual design, text patterns, sounds.

**Layout:** Single column, clean sections, with inline mini-previews where helpful.

**Section A: Celebration Name**
- **Name input** — Auto-generated from Step 1 conditions (e.g., if conditions include Deal Stage = Closed Won → "Deal Won"; if conditions include Amount > 10000 → "Big Deal Won"). Editable by the user. This is the internal label for admins.
- Auto-generation logic: scan conditions for recognizable patterns (stage values, amount thresholds, owner names) and compose a readable name. If no recognizable pattern, default to "New Celebration".

**Section B: Display Text**
- **Title Pattern** — Rich text input with an **"Insert Field" button** next to it.
  - Clicking "Insert Field" opens a small popover/dropdown showing all available fields (from the integration schema + fields resolved during trigger like `owner_name`, `company_name`).
  - Selecting a field inserts a **pill/chip** into the input: `🎉 DEAL WON: [Company Name]`
  - The pill is rendered visually (colored background, rounded) but stores `{{company_name}}` underneath.
  - User can also type plain text around the pills.
  - Preset quick-start buttons: "🎉 DEAL WON!", "🤝 NEW CLIENT!", "⭐ NEW SUBSCRIBER!", "🏆 MILESTONE!"
- **Subtitle Pattern** — Same "Insert Field" mechanic.
  - Default suggestion: `[Owner Name] closed [Deal Name]`
  - User can customize freely.

**Section C: Visual Style**
- **Style picker** — Three visual cards showing thumbnail previews of each style:
  - 🎊 **Confetti** — Colorful paper pieces falling (default)
  - 🎆 **Fireworks** — Bursting light explosions
  - 🍾 **Champagne** — Rising bubbles and golden shower
- Clicking a card selects it (outlined/highlighted state).

**Section D: Sound**
- **Sound picker** — Grid of sound options with small "▶ Play" preview buttons:
  - 🎺 Victory Fanfare
  - 💰 Cash Register
  - 🔔 Bell
  - 👏 Applause
  - 🥁 Drumroll
  - 🔇 No Sound
- Each has a 2-3 second preview. Clicking "▶" plays the sample. Selection is indicated by highlighted border.

**Section E: Duration & Options**
- **Duration** — Slider or number input: 10–60 seconds. Default: 20. Show "20 seconds" label.
- **Show team photos** — Toggle switch. Default: on.
  - If on, show a sub-option: **"Match team member by"** — Dropdown of properties that reference people (filtered to properties of type that could contain an owner ID or email: `hubspot_owner_id`, any property the user mapped as an owner field). Default: "Deal Owner (hubspot_owner_id)".
- **Show running counter** — Toggle switch. Default: off.
  - If on, show sub-options:
    - **Counter label** — Text input (e.g., "Revenue This Quarter")
    - **Counter source** — Dropdown: "Sum from this celebration's amount field" or link to a KPI definition.

**Section F: Field Mapping**

This is critical — it defines how webhook payload fields map to the display fields used in title/subtitle patterns.

Instead of the current raw key→value pairs, this should be **auto-generated** from the fields used in Section B (title/subtitle patterns) plus any photo/counter fields from Section E.

- Show a table:
  | Display Field | HubSpot Property | Status |
  |---|---|---|
  | deal_name | `dealname` (Deal Name) ← auto-mapped | ✅ Mapped |
  | amount | [Select property ▼] | ⚠️ Needs mapping |
  | company_name | `associatedcompanyname` (Company Name) ← auto-mapped | ✅ Mapped |
  | owner_name | `hubspot_owner_id` (Deal Owner) ← auto-mapped | ✅ Mapped |

- Auto-mapping logic: if the display field name closely matches a HubSpot property name/label, pre-select it.
- Unmapped fields show a dropdown to select the correct HubSpot property.
- Each row has an edit icon to change the mapping.
- **"Add custom field" button** at the bottom for fields not used in title/subtitle but needed in metadata.

**Section G: Navigation**
- "← Back" (returns to Step 1)
- "Next: Preview →"
- "Cancel"

---

#### Step 3: "Preview & Activate" (Preview + Save)

This is the payoff — the user sees exactly what will appear on their TV.

**Layout:** Full-width preview area, then action buttons below.

**Section A: TV Preview**
- A large (16:9 aspect ratio) preview container styled to look like a TV screen (dark background, rounded corners, maybe a subtle bezel/shadow).
- Inside: render the **actual CelebrationOverlay component** with sample data populated from the field mappings.
  - If the user has real HubSpot data, pull a recent deal to use as sample data.
  - If no real data available, use realistic placeholder data: "Marie-Ève Tremblay closed Acme Corp — $24,500"
- The preview plays the full celebration: confetti/fireworks/champagne animation, sound (muted by default with "🔊 Unmute" button), team photo, title/subtitle, counter animation.
- **"Replay" button** to re-trigger the preview animation.
- **"Try with different data" button** — opens a small form where the user can type sample values for each mapped field to see how different data looks.

**Section B: Summary**
Below the preview, a clean summary card:
- **Trigger:** Human-readable summary of ALL conditions, e.g.:
  - "When Deal Stage is Closed Won AND Amount > $1,000"
  - "When Deal Owner is Marie-Ève Tremblay AND Pipeline is Enterprise"
  - Each condition rendered as: "[Property Label] [operator in words] [value(s)]"
- **Celebration:** "[Template Name]" — [Visual Style] · [Sound] · [Duration]s
- **Field mappings:** Quick reference table
- **Status toggle:** Active / Inactive. Default: Active.

**Section C: Actions**
- **"Save & Activate"** — Saves the template + trigger, sets `is_active: true`. Redirects to `/app/celebrations`.
- **"Save as Draft"** — Saves but sets `is_active: false`.
- **"← Back"** — Returns to Step 2.
- **"Cancel"** — Discards and returns to celebrations list.

---

### 2.3 Celebrations List Page Redesign

The listing page at `/app/celebrations` also needs updating:

**Current:** Template cards with a separate "Triggers" sub-section and "+ Add Trigger" button.
**New:** Each celebration is shown as a single card combining template + trigger info.

**Card layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  🎉 Deal Won                                    Active ● ◯  │
│                                                              │
│  When: Deal Stage is Closed Won · Amount > $1,000            │
│  Shows: "🎉 DEAL WON!" — Confetti · Victory Fanfare · 20s   │
│                                                              │
│  Last fired: 2 hours ago · 47 total celebrations             │
│                                                              │
│  [Edit]  [Duplicate]  [⋮ More]                              │
└──────────────────────────────────────────────────────────────┘
```

- Each card shows all conditions as a single "When:" line, with conditions joined by " · "
- If more than 3 conditions, show first 2 + "and 2 more conditions"

- **Quick Start presets** remain at the top (Deal Won, New Client, Subscription) — clicking one opens the wizard pre-filled with sensible defaults.
- **"+ Create Celebration"** button opens the wizard at Step 1 (blank).
- **Active/Inactive toggle** directly on each card (no need to open the editor).
- **"⋮ More" menu:** Delete, View History, Add Another Trigger (for power users who want multiple triggers on one template).

---

## Part 3: KPI Builder — UX Flow

### 3.1 Page Structure Change

**Current:** `/app/kpis` with presumably similar raw-input forms
**New:** KPI creation also gets a **dedicated full page** — simpler than celebrations (no wizard needed, but same design language).

```
/app/kpis                             → List of KPI cards
/app/kpis/new                         → Create new KPI (full page form)
/app/kpis/[id]                        → Edit existing KPI
```

### 3.2 KPI Builder Form

Single full-page form (not a wizard — KPIs are simpler than celebrations).

**Section A: KPI Identity**
- **Label** — What appears on the TV card (e.g., "Revenue This Quarter"). Text input.
- **Internal name** — Auto-generated from label (e.g., "revenue_this_quarter"), editable.
- **Format** — Dropdown: Number, Currency, Percentage. If Currency, show currency selector (CAD, USD, EUR, etc.).

**Section B: Data Source**
- **Source type** — Three card options:
  - 📊 **From Integration** — Query live data from HubSpot/GA4
  - 🎉 **From Celebrations** — Aggregate from celebration history (sum of amounts, count of celebrations)
  - ✏️ **Manual** — Enter a value manually (for metrics not connected to any integration)

**If "From Integration" selected:**
- **Integration** — Dropdown of connected integrations
- **Object type** — Dropdown: Deals, Contacts, Companies
- **Aggregation** — Dropdown: Sum, Count, Average
- **Aggregate field** (for Sum/Average) — Searchable property dropdown from schema (e.g., "Amount", "Subscription Value"). Only shows number-type properties.
- **Filters** — Same condition builder as celebrations Step 1:
  - Pipeline filter (dropdown from schema)
  - Stage filter (multi-select dropdown: e.g., "Closed Won")
  - Date range (dropdown: This Quarter, This Month, This Year, Last 30 Days, Last 90 Days, Custom)
  - Additional property conditions (same type-aware condition rows)

**If "From Celebrations" selected:**
- **Templates** — Multi-select of celebration templates
- **Aggregation** — Sum or Count
- **Field** (for Sum) — Dropdown of fields available on those templates (e.g., "amount")
- **Time period** — Same date range dropdown

**If "Manual" selected:**
- **Value** — Number input
- **Last updated** — Shows timestamp, with "Update" button

**Section C: Display Options**
- **Show trend** — Toggle. If on:
  - **Compare to** — Dropdown: Previous Period, Same Period Last Year
- **Refresh interval** — Dropdown: Every 1 minute, 5 minutes, 15 minutes, 30 minutes, 1 hour
- **Position** — Dropdown: 1st, 2nd, 3rd, 4th (order on dashboard)

**Section D: Preview**
- Inline preview of the KPI card as it will appear on the TV (dark/light based on current theme)
- Shows the current value (fetched live if integration is connected) or placeholder

**Section E: Actions**
- "Save" / "Save & Activate" / "Cancel"

---

## Part 4: Shared UI Components

### 4.1 Property Selector (Searchable Dropdown)

The most-used component in the entire redesign. A combobox/command palette that:

- Shows all properties grouped by property group (Deal Information, Deal Activity, Custom Properties, etc.)
- Searchable by label OR internal name
- Shows property type icon (📝 text, 🔢 number, 📅 date, 📋 dropdown, ✅ boolean)
- Shows internal name in small muted text below the label
- Keyboard navigable
- Loads from the cached schema API

```
┌─────────────────────────────────────────────┐
│ 🔍 Search properties...                     │
├─────────────────────────────────────────────┤
│ Deal Information                             │
│   📋 Deal Stage          dealstage           │
│   📝 Deal Name           dealname            │
│   🔢 Amount              amount              │
│   📅 Close Date          closedate           │
│   📋 Pipeline            pipeline            │
│ Deal Activity                                │
│   📅 Last Activity Date  notes_last_updated  │
│   🔢 Number of Contacts  num_associated...   │
│ Custom Properties                            │
│   🔢 Accepted Sub Amount montant_sub_ac...   │
│   📋 Account Manager     account_manager     │
└─────────────────────────────────────────────┘
```

Implementation: shadcn/ui `Command` (cmdk) component with custom grouping.

### 4.2 Condition Row

Reusable component for both celebrations and KPIs:

```
┌─────────────────┐  ┌──────────────┐  ┌───────────────────┐  [🗑]
│ [Property ▼]    │  │ [Operator ▼] │  │ [Value input]     │
│ Deal Stage      │  │ is any of    │  │ Closed Won ×      │
│                 │  │              │  │ Contract Signed ×  │
└─────────────────┘  └──────────────┘  └───────────────────┘
```

- Property dropdown: uses PropertySelector component
- Operator dropdown: options change based on selected property's type
- Value input: changes based on property type + operator:
  - `enumeration` + `is any of` → multi-select with options from property
  - `number` + `greater than` → number input
  - `date` + `between` → two date pickers
  - `bool` + `is true` → no value input (operator is sufficient)
  - `string` + `contains` → text input
  - `*` + `is known` / `is unknown` → no value input

### 4.3 Template Text Editor (with Field Insertion)

A specialized input for title/subtitle patterns:

- Renders as a standard text input but with inline **pills/chips** for field references
- Toolbar or inline button: "📎 Insert Field" opens PropertySelector
- When a property is selected, it inserts a pill showing the human-readable label
- Under the hood, the stored value is still `{{internal_name}}`
- Backspace through a pill deletes the whole pill
- User can type plain text around pills
- Shows a "quick insert" row of commonly used fields below the input

Visual example:
```
┌──────────────────────────────────────────────────────────────────┐
│ 🎉 DEAL WON:  [Company Name]  — $[Amount]      [📎 Insert]     │
└──────────────────────────────────────────────────────────────────┘
  Quick insert: [Deal Name]  [Owner Name]  [Amount]  [Company]
```

### 4.4 Sound Picker

Grid of sound options with inline preview:

```
┌──────────────────────────────────────────────────────────────────┐
│ 🔊 Celebration Sound                                             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 🎺          │  │ 💰          │  │ 🔔          │              │
│  │ Victory     │  │ Cash        │  │ Bell        │              │
│  │ Fanfare     │  │ Register    │  │             │              │
│  │    ▶ Play   │  │    ▶ Play   │  │    ▶ Play   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 👏          │  │ 🥁          │  │ 🔇          │              │
│  │ Applause    │  │ Drumroll    │  │ No Sound    │              │
│  │    ▶ Play   │  │    ▶ Play   │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### 4.5 Visual Style Picker

Three cards with animated thumbnail previews (CSS-only mini animations):

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎨 Celebration Style                                             │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │   ✦ ✦ ✦ ✦ ✦      │  │    ✦     ✦       │  │   ○  ○  ○     │ │
│  │  ✦  ✦   ✦  ✦     │  │   ✦✦✦  ✦✦✦      │  │  ○ ○  ○  ○   │ │
│  │ ✦ ✦  ✦ ✦  ✦      │  │  ✦  ✦ ✦  ✦      │  │ ○  ○ ○  ○    │ │
│  │                   │  │                   │  │               │ │
│  │    🎊 Confetti     │  │    🎆 Fireworks    │  │  🍾 Champagne │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 4.6 Step Progress Indicator

Top of the wizard page, shows current step:

```
  ① When to celebrate  ——————  ② Design  ——————  ③ Preview & Save
       (active)                 (upcoming)          (upcoming)
```

- Completed steps show a checkmark ✓
- Current step is highlighted
- Upcoming steps are muted
- Clicking a completed step navigates back

---

## Part 5: Data Flow Changes

### 5.1 How Schema Data Flows Through the Wizard

```
User opens /celebrations/new
  → Page loads → fetch integration list for this org
  → User selects integration (e.g., HubSpot)
  → GET /api/integrations/[id]/schema/properties/deals
  → GET /api/integrations/[id]/schema/pipelines
  → GET /api/integrations/[id]/schema/owners
  → All dropdowns now populated from live schema
  → User configures trigger conditions using type-aware inputs
  → User builds title/subtitle using Insert Field
  → System auto-generates field_mapping from used fields
  → User reviews preview with sample data
  → Save → POST creates celebration_template + celebration_trigger in a single transaction
```

### 5.2 Unified Save Payload

Instead of separate template and trigger creation, the wizard saves everything in one API call:

```typescript
// POST /api/celebrations
interface CreateCelebrationPayload {
  // Template fields
  name: string;
  title_pattern: string;        // "🎉 DEAL WON: {{company_name}}"
  subtitle_pattern: string;     // "{{owner_name}} closed {{deal_name}}"
  visual_style: 'confetti' | 'fireworks' | 'champagne';
  sound: string;
  duration_seconds: number;
  show_counter: boolean;
  counter_label?: string;
  counter_source?: string;
  show_photos: boolean;
  photo_fields: string[];

  // Trigger fields
  integration_id: string;
  event_type?: string;
  conditions: Condition[];
  field_mapping: Record<string, string>;

  // State
  is_active: boolean;
}

interface Condition {
  field: string;         // HubSpot property internal name
  operator: string;      // "equals", "contains", "gt", "is_any_of", etc.
  value: any;            // string, number, string[], depends on type
  property_type: string; // "string", "number", "enumeration", etc. (for the UI to render correctly on edit)
}
```

### 5.3 Auto-Mapping Logic

When the user inserts `{{company_name}}` into the title pattern, the system:
1. Scans all field references in title_pattern + subtitle_pattern
2. For each field reference, attempts to find a matching HubSpot property:
   - Exact match on internal name: `company_name` → `company_name` property
   - Fuzzy match on label: "Company Name" → `associatedcompanyname` property
   - Known aliases: `owner_name` → resolve from `hubspot_owner_id` via team_members
   - `deal_name` → `dealname`
   - `amount` → `amount` or first currency-type property
3. Pre-fills the field mapping table with auto-matches
4. Flags any unmapped fields for manual selection

### 5.4 Conditions Storage Format

Update the conditions jsonb to include property type info (needed to render the correct input on edit):

```json
[
  {
    "field": "dealstage",
    "operator": "is_any_of",
    "value": ["closedwon", "contractsigned"],
    "property_type": "enumeration",
    "property_label": "Deal Stage"
  },
  {
    "field": "amount",
    "operator": "gt",
    "value": 1000,
    "property_type": "number",
    "property_label": "Amount"
  }
]
```

---

## Part 6: React Hook Architecture

### 6.1 `useIntegrationSchema` Hook

```typescript
// src/lib/hooks/useIntegrationSchema.ts
function useIntegrationSchema(integrationId: string | null) {
  // TanStack Query-based hook
  // Returns: { properties, pipelines, owners, isLoading, error, refresh }
  // Caches aggressively, refreshes on stale
}
```

### 6.2 `useCelebrationWizard` Hook / Zustand Store

```typescript
// src/stores/celebration-wizard.ts
interface CelebrationWizardState {
  currentStep: 1 | 2 | 3;

  // Step 1
  integrationId: string | null;
  objectType: string;        // 'deals' | 'contacts' | 'companies'
  eventType: string | null;  // optional event type filter (advanced)
  conditions: Condition[];   // ALL trigger conditions — stage, amount, owner, etc. are all just conditions

  // Step 2
  name: string;
  titlePattern: string;
  subtitlePattern: string;
  visualStyle: string;
  sound: string;
  durationSeconds: number;
  showPhotos: boolean;
  photoFields: string[];
  showCounter: boolean;
  counterLabel: string;
  counterSource: string | null;
  fieldMapping: Record<string, string>;

  // Actions
  setStep: (step: 1 | 2 | 3) => void;
  updateStep1: (data: Partial<Step1>) => void;
  updateStep2: (data: Partial<Step2>) => void;
  applyStarterTemplate: (template: StarterTemplate) => void; // pre-fills conditions + Step 2 defaults
  reset: () => void;
  toPayload: () => CreateCelebrationPayload;
}
```

---

## Part 7: Files to Create / Modify

### New Files

```
src/app/app/celebrations/new/page.tsx              — Wizard page (new celebration)
src/app/app/celebrations/[id]/page.tsx             — Wizard page (edit celebration)
src/app/app/kpis/new/page.tsx                      — KPI builder page
src/app/app/kpis/[id]/page.tsx                     — KPI editor page

src/components/admin/celebration-wizard/
  ├── wizard-layout.tsx                            — Step indicator + navigation
  ├── step-trigger.tsx                             — Step 1: trigger configuration
  ├── step-design.tsx                              — Step 2: template design
  ├── step-preview.tsx                             — Step 3: preview & save
  └── celebration-preview.tsx                      — TV preview renderer

src/components/admin/shared/
  ├── property-selector.tsx                        — Searchable property dropdown (cmdk)
  ├── condition-row.tsx                            — Type-aware condition builder row
  ├── condition-builder.tsx                        — Multiple condition rows with add/remove
  ├── template-text-editor.tsx                     — Text input with field pill insertion
  ├── visual-style-picker.tsx                      — 3-card style selector
  ├── sound-picker.tsx                             — Sound grid with preview
  └── field-mapping-table.tsx                      — Auto-generated field mapping

src/components/admin/kpi-builder/
  ├── kpi-form.tsx                                 — Full KPI builder form
  ├── source-integration.tsx                       — Integration-sourced KPI config
  ├── source-celebration.tsx                       — Celebration-aggregate KPI config
  └── source-manual.tsx                            — Manual value KPI config

src/lib/hooks/useIntegrationSchema.ts              — Schema data fetching hook
src/stores/celebration-wizard.ts                   — Wizard state management

src/app/api/integrations/[integrationId]/schema/
  ├── route.ts                                     — GET all schemas
  └── refresh/route.ts                             — POST force refresh

src/app/api/celebrations/route.ts                  — POST unified create
src/app/api/celebrations/[id]/route.ts             — PUT update, DELETE
```

### Modified Files

```
src/app/app/celebrations/page.tsx                  — Redesign listing to card view
src/app/app/kpis/page.tsx                          — Redesign listing
src/lib/connectors/hubspot.ts                      — Add schema fetch functions
```

---

## Part 8: Cursor Agent Prompt Sequence

### Prompt 0: Schema Discovery — Database + API

```
CONTEXT: CelebBoard admin panel redesign. We need to fetch and cache HubSpot account schemas (properties, pipelines, owners) so the UI can render dynamic dropdowns instead of raw text inputs.

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 1 for the full schema design
- Read src/lib/connectors/hubspot.ts for existing HubSpot connector code
- Read src/lib/db/ for Supabase client patterns

TASK:
1. Create the `integration_schemas` table migration in supabase/migrations/
   - Columns: id, org_id, integration_id, schema_type, object_type, data (jsonb), fetched_at, expires_at, created_at, updated_at
   - Unique constraint on (integration_id, schema_type, object_type)
   - RLS policy: users can read schemas for their org's integrations

2. Add schema fetch functions to src/lib/connectors/hubspot.ts:
   - fetchDealProperties(accessToken) → GET /crm/v3/properties/deals
   - fetchContactProperties(accessToken) → GET /crm/v3/properties/contacts
   - fetchCompanyProperties(accessToken) → GET /crm/v3/properties/companies
   - fetchPipelines(accessToken) → GET /crm/v3/pipelines/deals
   - fetchOwners(accessToken) → GET /crm/v3/owners
   - fetchAndCacheAllSchemas(integrationId, orgId, supabase) → orchestrator that calls all of the above and upserts into integration_schemas

3. Create API routes:
   - GET /api/integrations/[integrationId]/schema/route.ts
     - Validates user has access to this integration's org
     - Returns cached schemas
     - If expired (>24h), triggers background refresh and returns stale data
     - Query params: ?type=properties&objectType=deals
   - POST /api/integrations/[integrationId]/schema/refresh/route.ts
     - Force-refreshes all schemas from HubSpot
     - Uses the integration's stored access token (handle token refresh if expired)

4. Hook into OAuth callback: after successfully storing HubSpot tokens, call fetchAndCacheAllSchemas() to populate schemas immediately.

VERIFY:
- After connecting HubSpot, check integration_schemas table has rows for properties (deals, contacts, companies), pipelines, and owners
- GET /api/integrations/[id]/schema returns the cached data
- The properties data includes: name, label, type, fieldType, options (for enumerations), groupName
```

### Prompt 1: Shared UI Components

```
CONTEXT: CelebBoard admin panel redesign. Building reusable components that both the celebration wizard and KPI builder will use. These components consume data from the integration_schemas cache built in Prompt 0.

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 4 for component specs
- Read src/components/ui/ for existing shadcn components available

TASK: Create these components in src/components/admin/shared/:

1. property-selector.tsx
   - A searchable combobox (shadcn Command/cmdk) that shows all properties from integration schema
   - Props: integrationId, objectType (deals/contacts/companies), onSelect, value, placeholder
   - Groups properties by groupName/groupLabel
   - Each option shows: type icon (📝🔢📅📋✅) + label + muted internal name
   - Searchable by both label and internal name
   - Returns the full PropertyForDropdown object on select
   - Uses the useIntegrationSchema hook to load data

2. condition-row.tsx
   - A single condition row: [Property dropdown] [Operator dropdown] [Value input]
   - Props: condition (field, operator, value, property_type), integrationId, objectType, onChange, onRemove
   - Operator dropdown options change based on the selected property's type:
     - string: equals, not_equals, contains, not_contains, is_known, is_unknown
     - number: eq, neq, gt, lt, gte, lte, is_known, is_unknown
     - date/datetime: eq, before, after, between, is_known, is_unknown
     - enumeration: is_any_of, is_none_of, is_known, is_unknown
     - bool: is_true, is_false
   - Value input changes based on property type + operator:
     - enumeration + is_any_of → multi-select from property options
     - number + gt → number input
     - date + between → two date pickers
     - bool operators → no value input
     - is_known / is_unknown → no value input
   - Trash icon button calls onRemove

3. condition-builder.tsx
   - Multiple condition rows with "AND" labels between them
   - Props: conditions[], integrationId, objectType, onChange
   - "+ Add condition" button at bottom
   - Handles adding/removing/updating individual conditions

4. template-text-editor.tsx
   - A text input that supports inline field pills/chips
   - Props: value (string with {{field}} syntax), onChange, integrationId, objectType, availableFields
   - "Insert Field" button opens property selector popover
   - Inserting a field adds a visual pill (colored chip showing label)
   - Stores {{internal_name}} in the actual value
   - User can type plain text around pills
   - Quick-insert row below showing commonly used fields

5. visual-style-picker.tsx
   - Three card options: Confetti, Fireworks, Champagne
   - Props: value, onChange
   - Cards show emoji + name + small decorative preview
   - Selected card has highlighted border

6. sound-picker.tsx
   - Grid of sound options with play preview buttons
   - Props: value, onChange
   - Options: victory, cash_register, bell, applause, drumroll, none
   - Each card has ▶ button that plays a 2-3s sample (use existing sound URLs from the display's sound system)
   - Selected option has highlighted border

7. field-mapping-table.tsx
   - Table showing display field → HubSpot property mappings
   - Props: mappings (Record<string, string>), integrationId, objectType, onChange
   - Each row: display field name | mapped property (shown as label, stored as internal name) | status badge
   - Unmapped fields have a property selector dropdown
   - Auto-mapping suggestions based on name similarity

Also create src/lib/hooks/useIntegrationSchema.ts:
   - TanStack Query hook wrapping GET /api/integrations/[integrationId]/schema
   - Returns: { properties, pipelines, owners, isLoading, error, refresh }
   - Transforms raw schema into PropertyForDropdown[], PipelineForDropdown[], OwnerForDropdown[]
   - Accepts objectType parameter to filter properties

VERIFY:
- PropertySelector renders grouped, searchable dropdown from real schema data
- Condition builder correctly changes operator options and value inputs based on property type
- Template text editor correctly inserts/removes field pills and stores {{field}} syntax
- All components use shadcn/ui and match existing admin styling
```

### Prompt 2: Celebration Wizard — Step 1 (Trigger)

```
CONTEXT: CelebBoard celebration wizard redesign. Building Step 1 of the 3-step wizard: "When should we celebrate?" This configures the trigger conditions. CRITICAL: there is no special "stage change" trigger. Deal stage, pipeline, amount, owner — they are ALL just properties in a flat condition builder. A celebration fires when an incoming webhook's enriched data matches ALL conditions.

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 2, section "Step 1"
- Read src/components/admin/shared/ for the reusable components built in Prompt 1
- Read src/stores/ for existing Zustand patterns

TASK:

1. Create src/stores/celebration-wizard.ts
   - Zustand store managing all wizard state across 3 steps
   - Step 1 fields: integrationId, objectType, eventType (optional), conditions[] — NO special pipelineId or stageIds
   - Step 2 fields: name, titlePattern, subtitlePattern, visualStyle, sound, durationSeconds, showPhotos, photoFields, showCounter, counterLabel, counterSource, fieldMapping
   - Actions: setStep, updateStep1, updateStep2, applyStarterTemplate, reset, toPayload
   - applyStarterTemplate(template) pre-fills conditions AND Step 2 defaults (title, style, sound)
   - reset() clears everything back to defaults

2. Create src/components/admin/celebration-wizard/wizard-layout.tsx
   - Step progress indicator at top: ① When to celebrate — ② Design — ③ Preview & Save
   - Shows current step highlighted, completed steps with checkmark
   - Clicking completed step navigates back
   - Wraps children (the current step content)

3. Create src/components/admin/celebration-wizard/step-trigger.tsx
   - Section A: Source — Integration dropdown + Object type dropdown
   - Section B: Conditions — header reads "Celebrate when all of these are true:"
     - One blank condition row shown by default
     - Uses the ConditionBuilder component from shared/
     - ALL conditions are equal — deal stage is just another property dropdown option (it's type enumeration with the actual stage values from the schema as options)
     - No special pipeline/stage selectors — those are just properties the user picks in the condition builder like anything else
   - Section C: Starter Templates — clickable preset cards that pre-fill conditions:
     - "🎉 Deal Won" → adds conditions: Deal Stage is_any_of [Closed Won], Amount gt 0
     - "🤝 New Client" → adds conditions: Deal Stage is_any_of [Closed Won]
     - "⭐ Subscription" → adds conditions: Deal Stage is_any_of [Closed Won], (user customizes)
     - "✏️ Start blank" → clears conditions
     - Clicking a starter calls applyStarterTemplate() which also pre-fills Step 2 defaults
   - Section D: Optional "Advanced: filter by event type" expandable section with text input
   - Section E: "Next: Design your celebration →" button
   - All dropdowns populated from useIntegrationSchema hook
   - Validation: integration must be selected, at least one complete condition (property + operator + value)
   - Reads/writes from celebration-wizard Zustand store

4. Create src/app/app/celebrations/new/page.tsx
   - Full page (not dialog/modal)
   - Renders WizardLayout with the current step's component
   - Step 1 → StepTrigger, Step 2 → StepDesign (placeholder for now), Step 3 → StepPreview (placeholder)
   - Reset wizard store on mount

VERIFY:
- Navigate to /app/celebrations/new
- Integration dropdown shows connected integrations
- Selecting HubSpot loads deal properties from cached schema
- Condition builder shows ONE blank row by default
- Picking "Deal Stage" in the property dropdown shows type-aware operator "is any of" with the actual stage values (Closed Won, Closed Lost, etc.) from the schema as multi-select options
- Picking "Amount" shows number operators (greater than, less than, etc.) with a number input
- Picking "Deal Owner" shows enumeration operators with owner names from schema
- Clicking "Deal Won" starter template pre-fills conditions: Deal Stage = Closed Won, Amount > 0
- "Next" button is disabled until at least one complete condition is set
- Clicking "Next" advances to Step 2
```

### Prompt 3: Celebration Wizard — Step 2 (Design)

```
CONTEXT: CelebBoard celebration wizard. Building Step 2: "Design your celebration." This configures the celebration template — what it looks like and how data maps.

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 2, section "Step 2"
- Read the shared components in src/components/admin/shared/
- Read src/stores/celebration-wizard.ts for the wizard state

TASK:

1. Create src/components/admin/celebration-wizard/step-design.tsx
   - Section A: Celebration Name — auto-generated from Step 1 conditions (scan for stage values, amount thresholds, etc. to compose a readable name like "Deal Won — Closed Won" or "Big Deal > $10K"). Editable.
   - Section B: Display Text
     - Title Pattern using TemplateTextEditor component
     - Subtitle Pattern using TemplateTextEditor component
     - Quick-start preset buttons above the title: "🎉 DEAL WON!", "🤝 NEW CLIENT!", "⭐ SUBSCRIBER!", "🏆 MILESTONE!" — clicking one fills the title
   - Section C: Visual Style using VisualStylePicker component
   - Section D: Sound using SoundPicker component
   - Section E: Duration & Options
     - Duration: number input with slider (10-60 seconds, default 20)
     - Show team photos: toggle
       - If on: "Match team member by" — dropdown of properties that could reference people (owner IDs, emails). Default: hubspot_owner_id
     - Show running counter: toggle
       - If on: counter label (text) + counter source (dropdown of KPIs or "From this celebration's amount")
   - Section F: Field Mapping Table
     - Auto-populated from fields used in title + subtitle patterns
     - Uses FieldMappingTable component
     - Shows auto-mapped fields with green status, unmapped with yellow warning
     - Each unmapped field has a property selector to choose the correct HubSpot property
   - Navigation: "← Back" (to Step 1) | "Next: Preview →"
   - All data reads/writes from celebration-wizard Zustand store

2. Wire up the auto-mapping logic:
   - When title/subtitle patterns change, scan for {{field}} references
   - For each reference, attempt to auto-map to a HubSpot property
   - Update fieldMapping in the store
   - Flag unmapped fields

VERIFY:
- Navigate to Step 2 (requires completing Step 1)
- Name is auto-generated from Step 1 conditions (e.g., "Deal Won — Closed Won" if stage condition exists)
- Clicking "Insert Field" in title shows searchable property dropdown with real properties
- Inserting a field shows as a colored pill in the input
- Preset buttons fill the title pattern
- Visual style cards are selectable
- Sound options play preview audio
- Duration slider works
- Field mapping table auto-generates from used fields
- Auto-mapped fields show green, unmapped show yellow
- "Back" returns to Step 1 with all data preserved
- "Next" advances to Step 3
```

### Prompt 4: Celebration Wizard — Step 3 (Preview + Save)

```
CONTEXT: CelebBoard celebration wizard. Building Step 3: "Preview & Activate." Shows the celebration as it will appear on TV, plus summary and save actions.

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 2, section "Step 3"
- Read src/components/display/celebration-overlay.tsx for the existing TV overlay component
- Read src/stores/celebration-wizard.ts for the wizard state

TASK:

1. Create src/components/admin/celebration-wizard/celebration-preview.tsx
   - A 16:9 container styled like a TV screen (dark background, subtle bezel shadow, rounded corners)
   - Inside: render the actual CelebrationOverlay component (or a simplified version) with sample data
   - Sample data: generate from the field mappings — use realistic names/amounts if possible, or pull a recent celebration from the DB
   - Play the full animation: confetti/fireworks/champagne + sound (muted by default)
   - "🔊 Unmute" toggle button
   - "↻ Replay" button to re-trigger the animation
   - "Try with different data" button → opens a small inline form where user can type sample values for each mapped field

2. Create src/components/admin/celebration-wizard/step-preview.tsx
   - Section A: TV Preview — uses CelebrationPreview component, taking up ~60% of the page width, centered
   - Section B: Summary card below the preview:
     - Trigger: human-readable summary of ALL conditions, e.g. "When Deal Stage is Closed Won AND Amount > $1,000 AND Deal Owner is Marie-Ève Tremblay"
     - Celebration: "[Name]" — [Style] · [Sound] · [Duration]s
     - Field mappings: compact table
     - Active/Inactive toggle
   - Section C: Actions
     - "Save & Activate" → POST /api/celebrations → redirect to /app/celebrations
     - "Save as Draft" → POST with is_active: false
     - "← Back" → returns to Step 2
     - "Cancel" → redirects to /app/celebrations (confirm if dirty)

3. Create or update POST /api/celebrations/route.ts
   - Accepts the unified CreateCelebrationPayload
   - In a single transaction (or sequential inserts):
     a. INSERT into celebration_templates
     b. INSERT into celebration_triggers (referencing the new template)
   - Returns the created template + trigger IDs
   - Validates with Zod schema

4. Update src/app/app/celebrations/new/page.tsx to render Step 3 when currentStep === 3

VERIFY:
- Navigate to Step 3 (requires completing Steps 1 + 2)
- TV preview shows the celebration with correct title/subtitle (with sample data filled in)
- Confetti/fireworks/champagne animation plays
- Sound plays when unmuted
- Replay button works
- Summary card shows accurate trigger + template info
- "Save & Activate" creates both template + trigger in DB
- Redirect to /app/celebrations shows the new celebration card
- "Save as Draft" creates with is_active: false
```

### Prompt 5: Celebrations List Page Redesign

```
CONTEXT: The celebrations listing page at /app/celebrations needs redesigning to match the new wizard flow.

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 2, section "Celebrations List Page Redesign"
- Read the current src/app/app/celebrations/page.tsx

TASK:

1. Redesign src/app/app/celebrations/page.tsx
   - Quick Start section at top: preset buttons (Deal Won, New Client, Subscription, Custom)
     - Clicking a preset navigates to /celebrations/new and calls applyStarterTemplate() to pre-fill conditions + Step 2 defaults
   - "+ Create Celebration" button → navigates to /celebrations/new
   - Celebrations list: card view (not table)
   - Each card shows:
     - Name + Active/Inactive toggle (directly toggleable)
     - Trigger summary: all conditions as readable text, e.g. "When: Deal Stage is Closed Won · Amount > $1,000"
     - Template summary: "[Style] · [Sound] · [Duration]s"
     - Stats: "Last fired: X ago · Y total celebrations"
     - Action buttons: Edit (→ /celebrations/[id]), Duplicate, More (Delete, View History)
   - Active toggle updates the template's is_active via API call
   - Delete shows confirmation dialog

2. Create src/app/app/celebrations/[id]/page.tsx
   - Same wizard as /new but pre-populates the store from the existing template + trigger
   - Fetch the template + its triggers on mount
   - Save updates existing records (PUT) instead of creating new ones

VERIFY:
- /app/celebrations shows all templates as cards with trigger info
- Active toggle works inline
- Edit opens the wizard pre-filled with existing data
- Quick Start presets navigate to /new with defaults
- Create new celebration and verify it appears in the list
```

### Prompt 6: KPI Builder

```
CONTEXT: CelebBoard KPI builder redesign. Same dynamic dropdown treatment as celebrations, but simpler form (no wizard needed).

REFERENCE FILES:
- Read CELEBRATION-BUILDER-REDESIGN-SPEC.md Part 3 for full KPI builder spec
- Read the shared components in src/components/admin/shared/
- Read the current src/app/app/kpis/page.tsx

TASK:

1. Create src/components/admin/kpi-builder/kpi-form.tsx
   - Section A: KPI Identity — label, internal name (auto-generated), format (number/currency/percentage), currency selector
   - Section B: Data Source — three card options:
     - From Integration: integration selector + object type + aggregation (sum/count/avg) + aggregate field (property selector, number-type only) + filters (condition builder + pipeline/stage/date range)
     - From Celebrations: template multi-select + aggregation + field + time period
     - Manual: number input
   - Section C: Display Options — show trend toggle, compare period, refresh interval, position
   - Section D: Inline KPI card preview (how it will look on TV)
   - Section E: Save / Cancel

2. Create src/app/app/kpis/new/page.tsx — full page form
3. Create src/app/app/kpis/[id]/page.tsx — edit page (pre-filled)

4. Redesign src/app/app/kpis/page.tsx listing:
   - Cards showing: label, current value, source type, refresh interval, active status
   - "+ Create KPI" button → /kpis/new
   - Edit → /kpis/[id]
   - Active/inactive toggle inline

5. Update POST/PUT /api/kpis endpoints to handle the new structured query_config format (instead of raw JSON)

VERIFY:
- /app/kpis/new shows the full form
- Selecting "From Integration" shows property dropdowns from real schema
- Aggregate field only shows number-type properties
- Condition builder works with type-aware inputs
- KPI preview card renders correctly
- Save creates the KPI definition
- /app/kpis list shows all KPIs as cards
```

---

## Part 9: Implementation Priority

Execute the prompts in order — each builds on the previous:

| Order | Prompt | What It Builds | Blocks |
|---|---|---|---|
| 1 | Prompt 0 | Schema discovery (DB + API + HubSpot fetch) | Everything else |
| 2 | Prompt 1 | Shared UI components | Wizard + KPI builder |
| 3 | Prompt 2 | Wizard Step 1 (trigger) | Steps 2-3 |
| 4 | Prompt 3 | Wizard Step 2 (design) | Step 3 |
| 5 | Prompt 4 | Wizard Step 3 (preview + save) | List page |
| 6 | Prompt 5 | Celebrations list page | — |
| 7 | Prompt 6 | KPI builder | — |

Prompts 5 and 6 can run in parallel since they don't depend on each other.

---

## Part 10: Edge Cases & Error Handling

- **No integration connected:** Step 1 shows empty integration dropdown with CTA: "Connect your first integration → (link to /app/integrations)"
- **Schema fetch fails:** Show warning "Could not load properties from HubSpot. Check your connection." with retry button. Allow manual text input as fallback.
- **Token expired during schema fetch:** Auto-refresh the HubSpot token, retry once, surface error if still failing.
- **Property removed from HubSpot:** On edit, if a mapped property no longer exists in schema, show ⚠️ warning on that field mapping row.
- **Duplicate celebration name:** Allow it — names are for admin reference only.
- **No photo match:** If show_photos is on but the photo field doesn't match any team member, the celebration renders without a photo (graceful degradation, no error).
- **Empty pipeline/stages:** If HubSpot has no deal pipelines (rare), the Deal Stage property will have no options. The condition builder will show an empty multi-select. User can still create conditions on other properties.
- **Condition evaluation order:** All conditions use AND logic. The webhook processor must match ALL conditions for the celebration to fire. If zero conditions are set (should be blocked by validation), the trigger matches everything.
