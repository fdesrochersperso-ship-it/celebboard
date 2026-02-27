# CelebBoard Marketing Site — Copy Reference

> This document maps every translation key in `en.json` / `fr.json` to its component and provides implementation guidance for Cursor.
>
> **How to use this in Cursor:** Reference this file when building any marketing component. Each section below tells you exactly which namespace to use with `useTranslations()`, what keys are available, and how the content should be rendered.

---

## Translation File Locations

```
src/messages/en.json   — English (complete)
src/messages/fr.json   — French (complete)
```

Both files use identical key structures. All keys are organized by page/section namespace.

---

## Global Components

### Navbar (`components/marketing/navbar.tsx`)

**Namespace:** `useTranslations("nav")`

| Key | Usage | Notes |
|-----|-------|-------|
| `features` | Nav link text | Links to `/features` |
| `pricing` | Nav link text | Links to `/pricing` |
| `about` | Nav link text | Links to `/about` |
| `blog` | Nav link text | Links to `/blog` |
| `login` | Login link text | Links to `/app` or auth page |
| `cta` | Primary CTA button | "Get started free" — stands out visually |
| `menuOpen` | Mobile menu aria-label | Accessibility |
| `menuClose` | Mobile menu aria-label | Accessibility |

**Implementation notes:**
- Sticky navbar, transparent on hero → solid on scroll
- Mobile hamburger menu at `md` breakpoint
- Use `Link` from `@/i18n/navigation` for all links
- CTA button should be visually prominent (filled, brand color)
- Include `<LanguageSwitcher />` component

### Footer (`components/marketing/footer.tsx`)

**Namespace:** `useTranslations("footer")`

| Key | Usage |
|-----|-------|
| `tagline` | Brand tagline under logo |
| `product` | Column heading |
| `productLinks.*` | Link texts (features, pricing, integrations, changelog) |
| `company` | Column heading |
| `companyLinks.*` | Link texts (about, blog, contact, careers) |
| `legal` | Column heading |
| `legalLinks.*` | Link texts (terms, privacy) |
| `connect` | Column heading |
| `connectLinks.*` | Link texts (twitter, linkedin, email) |
| `copyright` | Copyright line — uses `{year}` interpolation |
| `builtIn` | "Built in Montréal 🇨🇦" |

**Implementation notes:**
- 4-column layout on desktop, stacked on mobile
- `{year}` in copyright: `t("copyright", { year: new Date().getFullYear() })`
- Include `<LanguageSwitcher />` in footer too

### Language Switcher (`components/marketing/language-switcher.tsx`)

**Namespace:** `useTranslations("languageSwitcher")`

| Key | Usage |
|-----|-------|
| `en` | English label |
| `fr` | French label |
| `switchTo` | Aria-label / tooltip for switching |

**Implementation notes:**
- Toggle button showing current locale, switches to other
- Use `usePathname()` and `useRouter()` from `@/i18n/navigation`
- Preserve current path when switching locale

### Shared CTA Section (`components/marketing/sections/cta.tsx`)

**This component is reused across multiple pages.** Each page has its own `cta` keys within its namespace.

When used on the homepage: `useTranslations("home.cta")`
When used on features page: `useTranslations("features.cta")`
When used on pricing page: `useTranslations("pricing.cta")`
When used on about page: `useTranslations("about.cta")`

All share the same key structure: `title`, `subtitle`, `cta`, and optionally `ctaSecondary` and `noCard`.

---

## Home Page (`app/[locale]/(marketing)/page.tsx`)

### Metadata

**Namespace:** `getTranslations({ locale, namespace: "metadata.home" })`

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return {
    title: t("title"),
    description: t("description"),
  };
}
```

### Hero Section (`components/marketing/sections/hero.tsx`)

**Namespace:** `useTranslations("home.hero")`

| Key | Element | Notes |
|-----|---------|-------|
| `title` | `<h1>` | Main headline. Large, bold, above the fold. |
| `subtitle` | `<p>` | Supporting paragraph below headline. |
| `cta` | Primary button | "Get started free" |
| `ctaSecondary` | Secondary button/link | "See it in action" — could link to a demo video or scroll to how-it-works |
| `noCard` | Small text below CTAs | Trust signal: "Free 14-day trial · No credit card required" |

**Design notes:**
- Hero should include a visual: TV mockup showing a celebration in action
- Background could be dark with subtle confetti particles
- Headline should be the largest text on the page
- Two CTA buttons side by side: primary (filled) + secondary (outlined)

### Logo Bar (`components/marketing/sections/logo-bar.tsx`)

**Namespace:** `useTranslations("home.logoBar")`

| Key | Element |
|-----|---------|
| `title` | Small heading above logos |

**Design notes:**
- Muted, grayscale client logos
- For pre-launch: use placeholder text or "Trusted by activity-driven teams" without logos
- Simple horizontal row, subtle styling

### Problem Section (`components/marketing/sections/problem.tsx`)

**Namespace:** `useTranslations("home.problem")`

| Key | Element | Notes |
|-----|---------|-------|
| `title` | `<h2>` | Section heading |
| `subtitle` | `<p>` | Supporting context |
| `before.label` | Column heading | "Before CelebBoard" |
| `before.items` | Array of strings | 5 pain points — render as a list with ❌ or red indicators |
| `after.label` | Column heading | "With CelebBoard" |
| `after.items` | Array of strings | 5 solutions — render as a list with ✅ or green indicators |

**Design notes:**
- Two-column layout: Before (muted/negative) vs. After (bright/positive)
- Visual contrast is key — the "after" column should feel energetic
- Could use a card-based or table-based layout
- Items are arrays — access with `t.raw("before.items")` or iterate with index

**Accessing array items in next-intl:**
```tsx
const items = ["item1", "item2", ...]; // from t.raw("before.items")
// Or use: {Array.from({length: 5}, (_, i) => t(`before.items.${i}`))}
```

### Features Grid (`components/marketing/sections/features-grid.tsx`)

**Namespace:** `useTranslations("home.featuresGrid")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` |
| `cards` | Array of 6 objects with `title` and `description` |

**Design notes:**
- 3×2 grid on desktop, stacked on mobile
- Each card: icon + title + description
- Suggested icons per card (use Lucide):
  1. Wins that announce themselves → `PartyPopper` or `Sparkles`
  2. Scoreboard everyone watches → `Trophy` or `BarChart3`
  3. Set it up once → `Zap` or `Infinity`
  4. Team front and center → `Users` or `Camera`
  5. Works on any screen → `Monitor` or `Tv`
  6. Your brand, your vibe → `Palette` or `Paintbrush`

**Accessing card data:**
```tsx
// Option A: Use raw data
const cards = t.raw("cards") as Array<{title: string; description: string}>;

// Option B: Index-based access
{[0,1,2,3,4,5].map(i => (
  <Card key={i}>
    <h3>{t(`cards.${i}.title`)}</h3>
    <p>{t(`cards.${i}.description`)}</p>
  </Card>
))}
```

### How It Works (`components/marketing/sections/how-it-works.tsx`)

**Namespace:** `useTranslations("home.howItWorks")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `steps` | Array of 3 objects: `number`, `title`, `description` |

**Design notes:**
- 3 horizontal steps with connecting lines/arrows
- Each step: large number + title + description
- Visual: could include small illustrations or icons
- Steps should feel sequential and simple

### Testimonials (`components/marketing/sections/testimonials.tsx`)

**Namespace:** `useTranslations("home.testimonials")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `items` | Array of 3 objects: `quote`, `author`, `company`, `role` |

**Design notes:**
- Card carousel or 3-column grid
- Each card: large quote text + author name + role + company
- Use quotation marks or a quote icon
- Note: these are placeholder testimonials for pre-launch — replace with real ones ASAP
- Keep attribution vague until you have permission ("VP Sales, SaaS company")

### Verticals Section (`components/marketing/sections/verticals.tsx`)

**Namespace:** `useTranslations("home.verticals")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` |
| `cards` | Array of 4 objects: `title`, `description`, `link` |

**Design notes:**
- 4 cards in a row on desktop, 2×2 on tablet, stacked on mobile
- Each card could have an illustration or icon representing the vertical
- `link` text could link to vertical landing pages (future: `/for/sales`, `/for/production`, etc.)
- For now, links can scroll to features or go to a contact/demo page

### Bottom CTA (`components/marketing/sections/cta.tsx`)

**Namespace:** `useTranslations("home.cta")`

See shared CTA section above.

---

## Features Page (`app/[locale]/(marketing)/features/page.tsx`)

### Metadata

**Namespace:** `getTranslations({ locale, namespace: "metadata.features" })`

### Features Hero (`components/marketing/sections/features-hero.tsx`)

**Namespace:** `useTranslations("features.hero")`

| Key | Element |
|-----|---------|
| `title` | `<h1>` |
| `subtitle` | `<p>` |

**Design notes:**
- Simpler hero than homepage — text-focused
- Could include a product screenshot below the text

### Celebration Engine (`components/marketing/sections/celebration-engine.tsx`)

**Namespace:** `useTranslations("features.celebrationEngine")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` — this is the "story" paragraph |
| `features` | Array of 6 objects: `title`, `description` |

**Design notes:**
- This is the hero feature section — give it visual weight
- The subtitle tells a micro-story (deal closes at 3:47 PM)
- Feature items in a 2×3 or 3×2 grid below
- Could include a mockup of a celebration overlay alongside the features

### Integrations Detail (`components/marketing/sections/integrations-detail.tsx`)

**Namespace:** `useTranslations("features.integrations")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` |
| `cards` | Array of 6 objects: `name`, `description` |

**Design notes:**
- Each card should show the integration logo/icon + name + description
- Use official logos (HubSpot orange, Slack colors, etc.)
- "More coming" card can be styled differently (dashed border, muted)

### Dashboard Features (`components/marketing/sections/dashboard-features.tsx`)

**Namespace:** `useTranslations("features.dashboard")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` |
| `features` | Array of 6 objects: `title`, `description` |

**Design notes:**
- Alternating layout: feature text + screenshot, then screenshot + feature text
- Or: 2×3 grid with icons
- Emphasis on "built for TVs" — show that the design is intentional

### Admin Features (`components/marketing/sections/admin-features.tsx`)

**Namespace:** `useTranslations("features.admin")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` |
| `features` | Array of 6 objects: `title`, `description` |

**Design notes:**
- Can be a simpler layout than celebration/dashboard sections
- Admin features are important but secondary to the "wow" features
- Grid or list layout with icons

### Features CTA

**Namespace:** `useTranslations("features.cta")`

---

## Pricing Page (`app/[locale]/(marketing)/pricing/page.tsx`)

### Metadata

**Namespace:** `getTranslations({ locale, namespace: "metadata.pricing" })`

### Pricing Hero (`components/marketing/sections/pricing-hero.tsx`)

**Namespace:** `useTranslations("pricing.hero")`

| Key | Element |
|-----|---------|
| `title` | `<h1>` |
| `subtitle` | `<p>` |

### Pricing Cards (`components/marketing/sections/pricing-cards.tsx`)

**Namespace:** `useTranslations("pricing.plans")`

Three plan objects: `starter`, `growth`, `enterprise`

Each plan has:
| Key | Element |
|-----|---------|
| `name` | Plan name heading |
| `price` | Large price display |
| `period` | Price period suffix ("/mo") |
| `annualPrice` | Small text below price |
| `description` | Plan description |
| `badge` | Optional badge (Growth only: "Most popular") |
| `cta` | Button text |
| `features` | Array of feature strings (render as checkmark list) |

**Design notes:**
- 3 cards side by side on desktop
- Growth (middle) card should be visually emphasized (raised, bordered, badge)
- Each feature line prefixed with a ✓ checkmark icon
- Toggle for monthly/annual pricing (update `price` display accordingly)
- Enterprise card should feel premium but approachable

**Implementation pattern:**
```tsx
const t = useTranslations("pricing.plans");

// For each plan:
const planKeys = ["starter", "growth", "enterprise"] as const;
planKeys.map(plan => ({
  name: t(`${plan}.name`),
  price: t(`${plan}.price`),
  features: t.raw(`${plan}.features`) as string[],
  // etc.
}));
```

### Competitor Comparison (`components/marketing/sections/pricing-comparison.tsx`)

**Namespace:** `useTranslations("pricing.comparison")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `subtitle` | `<p>` |
| `headers` | Array of 5 column headers |
| `rows` | Array of 5 row objects with `label` and `values` array |

**Design notes:**
- Render as a comparison table
- CelebBoard column highlighted (brand color background or bold)
- Use ✅/❌ icons where appropriate instead of "Yes"/"No"
- This table is a powerful sales tool — make it scannable

### Pricing FAQ (`components/marketing/sections/pricing-faq.tsx`)

**Namespace:** `useTranslations("pricing.faq")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `items` | Array of 8 objects: `question`, `answer` |

**Design notes:**
- Accordion/collapsible pattern (use shadcn Accordion)
- All collapsed by default
- Clean typography, generous spacing

### Pricing CTA

**Namespace:** `useTranslations("pricing.cta")`

---

## About Page (`app/[locale]/(marketing)/about/page.tsx`)

### Metadata

**Namespace:** `getTranslations({ locale, namespace: "metadata.about" })`

### About Hero (`components/marketing/sections/about-hero.tsx`)

**Namespace:** `useTranslations("about.hero")`

| Key | Element |
|-----|---------|
| `title` | `<h1>` |
| `subtitle` | `<p>` |

### Origin Story (`components/marketing/sections/story.tsx`)

**Namespace:** `useTranslations("about.story")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `paragraphs` | Array of 4 paragraph strings |

**Design notes:**
- Long-form text section — clean reading experience
- Wide but not full-width (max-w-3xl centered)
- Each paragraph as its own `<p>` tag
- Could include a photo of the original office TV alongside

### Company Values (`components/marketing/sections/values.tsx`)

**Namespace:** `useTranslations("about.values")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `items` | Array of 6 objects: `title`, `description` |

**Design notes:**
- 2×3 or 3×2 grid of value cards
- Each card: icon + bold title + description
- Clean, not flashy — values should feel genuine
- Suggested icons (Lucide):
  1. Celebration over competition → `Heart` or `Sparkles`
  2. Simplicity → `Zap` or `CheckCircle`
  3. People not data → `Users` or `Smile`
  4. Visibility drives momentum → `Eye` or `TrendingUp`
  5. Zero maintenance → `Infinity` or `Clock`
  6. Every team deserves this → `Globe` or `Building2`

### Location Section (`components/marketing/sections/location.tsx`)

**Namespace:** `useTranslations("about.location")`

| Key | Element |
|-----|---------|
| `title` | `<h2>` |
| `description` | `<p>` |
| `cta` | Language switch prompt |

**Design notes:**
- Could include a subtle map or Montreal skyline illustration
- The `cta` is a language-switch link ("Voir en français" / "Switch to English")

### About CTA

**Namespace:** `useTranslations("about.cta")`

---

## Blog Page (`app/[locale]/(marketing)/blog/page.tsx`)

### Metadata

**Namespace:** `getTranslations({ locale, namespace: "metadata.blog" })`

### Blog Content

**Namespace:** `useTranslations("blog")`

| Key | Element |
|-----|---------|
| `hero.title` | `<h1>` |
| `hero.subtitle` | `<p>` |
| `comingSoon` | Placeholder text |
| `cta` | Button text |

**Design notes:**
- Scaffold page for now — blog posts will come from a CMS or markdown files later
- Show a clean "coming soon" state with the CTA to get started

---

## Legal Pages

### Terms of Service (`app/[locale]/(marketing)/legal/terms/page.tsx`)

**Namespace:** `useTranslations("legal.terms")`

| Key | Element | Notes |
|-----|---------|-------|
| `title` | `<h1>` | |
| `lastUpdated` | Date line | Uses `{date}` interpolation: `t("lastUpdated", { date: "2025-01-01" })` |
| `content` | Placeholder | Replace with actual legal content |

### Privacy Policy (`app/[locale]/(marketing)/legal/privacy/page.tsx`)

**Namespace:** `useTranslations("legal.privacy")`

Same structure as terms.

---

## Common Strings

**Namespace:** `useTranslations("common")`

These are shared strings used across multiple components:

| Key | Usage |
|-----|-------|
| `getStarted` | Universal CTA text |
| `bookDemo` | Alternative CTA |
| `learnMore` | Link text |
| `seeItInAction` | Secondary CTA |
| `backToHome` | Navigation |
| `readMore` | Blog/content links |
| `comingSoon` | Placeholder badge |
| `unlimited` | Pricing feature text |
| `included` | Pricing feature text |
| `perMonth` | Price suffix |
| `annually` | Billing text |
| `yes` / `no` | Comparison table |

---

## Working with Arrays in next-intl

Several sections use arrays (features, testimonials, FAQ items, etc.). Here's how to handle them:

```tsx
// Method 1: Use t.raw() to get the array
const cards = t.raw("cards") as Array<{ title: string; description: string }>;

// Method 2: Index-based access (type-safe)
{Array.from({ length: 6 }, (_, i) => (
  <Card key={i}>
    <h3>{t(`cards.${i}.title`)}</h3>
    <p>{t(`cards.${i}.description`)}</p>
  </Card>
))}

// Method 3: For simple string arrays (like pricing features)
const features = t.raw("features") as string[];
```

---

## Page Assembly Pattern

Each page in `app/[locale]/(marketing)/` should follow this pattern:

```tsx
// page.tsx (server component)
import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/marketing/sections/hero";
import { LogoBar } from "@/components/marketing/sections/logo-bar";
// ... more section imports

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoBar />
      <Problem />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <Verticals />
      <CTA />
    </>
  );
}
```

Each section component handles its own translations internally via `useTranslations()`.

---

## Messaging Principles (for reference when writing new copy)

1. **Lead with outcome, not feature.** "Wins that announce themselves" > "Webhook-triggered overlays"
2. **Be specific.** "10 minutes" > "quick setup"
3. **Celebrate without cringe.** Warm, not corporate motivational poster
4. **Never say "gamification."** We celebrate. Different word, different market.
5. **Activity-driven, not sales-only.** Copy should work for production teams, advisory firms, any metric-driven team
6. **Hierarchy:** Outcome → Emotion → Simplicity → Features → Price → Tech