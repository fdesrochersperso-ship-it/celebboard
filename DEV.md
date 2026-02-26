# CelebBoard - Dev & Deploy Guide

## Test Credentials (local development)

Store your test org credentials here for convenience (this file is gitignored in production):

```
Email: [your test user email]
Password: [your test user password]
Test org: [org name - e.g. "Test Org"]
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
