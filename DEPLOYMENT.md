# Dual Vercel Deployment

This repo contains two deployable apps. Each deploys as a separate Vercel project from the same repository.

| Project   | Root Directory | Framework | Purpose                    |
|----------|----------------|-----------|----------------------------|
| CelebBoard | (empty)       | Next.js   | Main app: admin, display, auth |
| Website  | `website`      | Astro     | Static marketing/landing site  |

## Local Development

**CelebBoard app (root):**
```bash
npm install
npm run dev
```

**Static website:**
```bash
cd website
npm install
npm run dev
```

## Vercel Setup

### Project 1: CelebBoard (main app)

1. Import the repo in Vercel (or link via `vercel link`).
2. Root Directory: leave **empty** (or `.`).
3. Framework: Next.js (auto-detected).
4. Deploy.

### Project 2: Website (static site)

1. Create a **new project** from the same repository.
2. Root Directory: `website`.
3. Framework: Astro (auto-detected).
4. Deploy.

Both projects deploy on each push. Vercel skips rebuilds for projects whose files did not change.
