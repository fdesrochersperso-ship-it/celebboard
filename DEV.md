# CelebBoard - Dev & Deploy Guide

## How to Use CelebBoard (Step by Step)

### 1. Create an account (or sign in)

**If you don't have an account yet:**
- Go to http://localhost:3000/signup (or your Vercel URL + /signup)
- Fill in:
  - **Organization:** e.g. `Test Org` or `hellodarwin`
  - **Email:** e.g. `test@example.com` (use a real email if Supabase requires confirmation)
  - **Password:** e.g. `CelebBoard123!` (min 6 chars)
- Click **Sign up**

**If you already have an account:**
- Go to http://localhost:3000/login
- Sign in with your email and password

### 2. Test credentials

```
Email: fdesrochers.perso@gmail.com
Password: celebboard
Org: hellodarwin
```

### 3. Seed the dashboard (populate with sample data)

1. After logging in, you'll be at **/app** (Dashboard)
2. Scroll down to **Developer Tools**
3. Click **Seed Test Data**
4. This creates: 5 team members, integrations (HubSpot, Slack, Generic), 4 celebration templates, triggers, and 4 KPI cards

### 4. Trigger a test celebration

1. Still on **/app**, in **Developer Tools**
2. Click one of: **Deal Won**, **New Client**, **Contract Signed**, **Renewal**, or **Random**
3. A celebration is created and, if the display is open, it will show as an overlay
4. Or click **Rapid Fire** to send 5 celebrations with 3-second delays

### 5. Open the TV display

1. Go to **App → Display** (or /app/display)
2. Copy your **Display URL** (e.g. `http://localhost:3000/display/abc123...`)
3. Open that URL in a browser (or on a TV)
4. Display shortcuts:
   - **T** – Trigger a test celebration overlay
   - **Escape** – Dismiss the overlay

### 6. See it all together

- Open the **display URL** in one tab/window
- Open **/app** in another tab
- From /app, click **Simulate → Deal Won** (or another scenario)
- The celebration should appear on the display overlay

---

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
