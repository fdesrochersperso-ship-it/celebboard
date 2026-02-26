# Storage Setup for Team Photos

If you get **"new row violates row-level security policy"** when uploading team photos:

## 1. Run the Storage RLS policies

In **Supabase Dashboard** → **SQL Editor**, run the migration:

```sql
-- From supabase/migrations/20250215000000_storage_team_photos_policies.sql
-- (Copy the contents of that file and run it)
```

Or run the migration file directly if you use `supabase db push`.

## 2. Verify your service role key

Ensure `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is the **service role** key from Supabase:

- Dashboard → Project Settings → API
- Copy the **service_role** key (secret, starts with `eyJ...` like a JWT)
- **Not** the anon key or a publishable key

The service role bypasses RLS, so if it’s set correctly, uploads should work without these policies.
