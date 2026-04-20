-- Factory exports storage bucket.
--
-- Hosts the generated print PNGs and mockup PNGs that are referenced from the
-- factory XLSX export (columns R and S of CP导入.xlsx). Public-read so the
-- factory can fetch URLs from the XLSX without auth; writes are gated by the
-- service-role key used from `/api/admin/render`.
--
-- NOTE: Storage buckets are normally created via the Supabase Dashboard or
-- the JS admin API. This SQL is committed for reproducibility and documents
-- the expected configuration. If the bucket already exists with matching
-- settings this script is a no-op.

-- Upsert the bucket row directly. `storage.buckets` is managed by Supabase
-- but writes are permitted with the service-role key / SQL editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'factory-exports',
  'factory-exports',
  true,                    -- public-read: factory pulls URLs out of the XLSX
  52428800,                -- 50MB: headroom for 3543×4724 PNG at 300 DPI
  array['image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public-read policy: anyone can SELECT (download) objects in this bucket.
-- Writes remain restricted to service-role (default behavior) — the admin
-- render route uses the service-role key so it bypasses RLS.
drop policy if exists "Public read factory-exports" on storage.objects;
create policy "Public read factory-exports" on storage.objects
  for select using (bucket_id = 'factory-exports');
