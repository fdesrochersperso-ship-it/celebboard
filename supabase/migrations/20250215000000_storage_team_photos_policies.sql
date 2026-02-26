-- Storage RLS policies for team-photos bucket
-- Run this in Supabase Dashboard → SQL Editor if you get "new row violates row-level security policy"

DROP POLICY IF EXISTS "Allow insert team-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert team-photos authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow select team-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow select team-photos authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow update team-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow update team-photos authenticated" ON storage.objects;

-- Allow uploads (INSERT) to team-photos bucket
CREATE POLICY "Allow insert team-photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'team-photos');

CREATE POLICY "Allow insert team-photos authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-photos');

-- Allow SELECT and UPDATE (required for upsert)
CREATE POLICY "Allow select team-photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'team-photos');

CREATE POLICY "Allow select team-photos authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'team-photos');

CREATE POLICY "Allow update team-photos"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'team-photos')
WITH CHECK (bucket_id = 'team-photos');

CREATE POLICY "Allow update team-photos authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-photos')
WITH CHECK (bucket_id = 'team-photos');
