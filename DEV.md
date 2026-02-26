# CelebBoard - Dev & Deploy Guide

## Test Credentials (local development)

Add your test credentials below for quick reference:

```
Email: [add your test user email]
Password: [add your test user password]
Test org: [org name]
```

Display URL (after login, get from App → Display Settings):
```
http://localhost:3000/display/[your-display-token]
```

Quick links:
- App: http://localhost:3000/app
- Display (need token): http://localhost:3000/display/[token]
- Dev token API: http://localhost:3000/api/dev/display-token (dev only)

---

## GitHub

Repo: https://github.com/fdesrochersperso-ship-it/celebboard

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the `celebboard` repository
4. Add environment variables (from `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

After deploy, add your Vercel URL to Supabase Auth → URL Configuration → Site URL and Redirect URLs.
