# CelebBoard Marketing Site — Architecture Guide

## Overview

The marketing site is bilingual (EN/FR) using `next-intl` with the Next.js App Router. English is the default locale (no URL prefix), French uses `/fr/` prefix.

## i18n Setup

### How it works
- **`next-intl`** handles all translations, locale routing, and navigation
- **Middleware** (`src/middleware.ts`) detects browser language and redirects
- **Translation files** in `src/messages/{en,fr}.json` — flat namespace structure
- **Navigation helpers** in `src/i18n/navigation.ts` — use `Link`, `useRouter`, `usePathname` from here (NOT from `next/link`)

### URL Routing
| English (default) | French |
|---|---|
| `/` | `/fr` |
| `/features` | `/fr/features` |
| `/pricing` | `/fr/pricing` |
| `/about` | `/fr/about` |
| `/blog` | `/fr/blog` |
| `/legal/terms` | `/fr/legal/terms` |
| `/legal/privacy` | `/fr/legal/privacy` |

### Using translations in components

**Server components** (default):
```tsx
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("home.hero");
  return <h1>{t("title")}</h1>;
}
```

**Client components** (`'use client'`):
```tsx
"use client";
import { useTranslations } from "next-intl";
// Same API — next-intl handles both server and client
```

**Metadata** (in page.tsx):
```tsx
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title") };
}
```

**Links** — always use the locale-aware Link:
```tsx
import { Link } from "@/i18n/navigation";
// NOT: import Link from "next/link";

<Link href="/pricing">Pricing</Link>
// → renders /pricing (EN) or /fr/pricing (FR) automatically
```

## File Structure

```
src/
├── app/
│   └── [locale]/                          # Dynamic locale segment
│       ├── layout.tsx                     # Root layout: html lang, NextIntlClientProvider
│       └── (marketing)/                   # Marketing route group
│           ├── layout.tsx                 # Navbar + Footer wrapper
│           ├── page.tsx                   # Home page
│           ├── features/page.tsx          # Features page
│           ├── pricing/page.tsx           # Pricing page
│           ├── about/page.tsx             # About page
│           ├── blog/page.tsx              # Blog index (scaffold)
│           └── legal/
│               ├── terms/page.tsx         # Terms of Service (scaffold)
│               └── privacy/page.tsx       # Privacy Policy (scaffold)
│
├── i18n/
│   ├── routing.ts                         # Locale config (locales, default, prefix mode)
│   ├── request.ts                         # Server-side message loading
│   └── navigation.ts                      # Locale-aware Link, redirect, usePathname, useRouter
│
├── messages/
│   ├── en.json                            # English translations (complete)
│   └── fr.json                            # French translations (complete)
│
├── components/
│   └── marketing/
│       ├── navbar.tsx                     # Sticky navbar with mobile menu
│       ├── footer.tsx                     # Footer with link columns
│       ├── language-switcher.tsx          # EN/FR toggle button
│       └── sections/                      # Page section components
│           ├── hero.tsx                   # Home hero
│           ├── logo-bar.tsx               # Client logos
│           ├── problem.tsx                # Before/After comparison
│           ├── features-grid.tsx          # 6-card feature grid
│           ├── how-it-works.tsx           # 3-step process
│           ├── testimonials.tsx           # Testimonial cards
│           ├── cta.tsx                    # Bottom CTA (reused across pages)
│           ├── features-hero.tsx          # Features page hero
│           ├── celebration-engine.tsx     # Celebration engine detail
│           ├── integrations-detail.tsx    # Integration cards
│           ├── dashboard-features.tsx     # TV dashboard features
│           ├── admin-features.tsx         # Admin dashboard features
│           ├── pricing-hero.tsx           # Pricing page hero
│           ├── pricing-cards.tsx          # 3-tier pricing cards
│           ├── pricing-faq.tsx            # FAQ accordion
│           ├── about-hero.tsx             # About page hero
│           ├── story.tsx                  # Origin story
│           ├── values.tsx                 # Company values grid
│           └── location.tsx               # Built in Montreal
│
└── middleware.ts                           # Locale detection + routing
```

## Dependencies to Install

```bash
pnpm add next-intl
```

That's the only new dependency. Everything else uses your existing stack (Next.js, Tailwind, shadcn/ui).

## Configuration

### next.config.ts
Wrap your config with the `next-intl` plugin:
```ts
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
```

### Middleware matcher
The middleware is configured to ONLY match marketing routes. It excludes:
- `/api/*` — API routes
- `/app/*` — Admin dashboard
- `/display/*` — TV display
- `/submit/*` — QR submission
- `/invite/*` — Team invite
- Static files and Next.js internals

This means the admin app, display page, and API routes are completely unaffected by the i18n middleware.

## Adding New Pages

1. Create `src/app/[locale]/(marketing)/your-page/page.tsx`
2. Add translation keys to both `en.json` and `fr.json`
3. Use `useTranslations()` in the page and section components
4. Use `getTranslations()` for `generateMetadata()`

## Adding New Translation Keys

1. Add the key to `src/messages/en.json`
2. Add the French translation to `src/messages/fr.json`
3. Use the namespace.key pattern: `useTranslations("namespace")` then `t("key")`

## Coexistence with Existing App Routes

The marketing site lives under `src/app/[locale]/(marketing)/`. Your existing routes remain untouched:
- `src/app/app/` — Admin (unchanged, no i18n)
- `src/app/display/` — TV display (unchanged, no i18n)
- `src/app/api/` — API routes (unchanged, no i18n)

The `[locale]` segment + middleware handle all the routing magic. Marketing pages get locale prefixing; everything else stays exactly as-is.