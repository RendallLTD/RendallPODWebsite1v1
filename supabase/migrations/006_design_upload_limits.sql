-- Hard-cap designs.image_url storage at ~15MB raw text (≈11MB binary after
-- base64 decode). Defense-in-depth against attackers who bypass the 10MB
-- client-side limit by hitting Supabase REST directly with the anon key.
-- Real fix is to move uploads off base64-in-DB to Supabase Storage; this
-- constraint is the floor until that migration happens.
alter table public.designs
  add constraint designs_image_url_max_size
  check (image_url is null or octet_length(image_url) <= 15728640);

-- Reject SVG data URLs. SVG can contain inline <script> tags and event
-- handlers — when rendered in <img src="data:image/svg+xml;..."> the JS
-- runs in the page's origin, giving an attacker XSS that steals the
-- viewer's session cookies. PNG and JPEG cannot execute code.
alter table public.designs
  add constraint designs_image_url_no_svg
  check (image_url is null or image_url not ilike 'data:image/svg%');
