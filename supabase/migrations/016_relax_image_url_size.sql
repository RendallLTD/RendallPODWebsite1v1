-- Replace migration 006's base64-era checks. After moving design uploads to
-- R2 (2026-04-29), designs.image_url stores an HTTPS URL, not a data URL —
-- the 15MB octet_length cap is meaningless and the SVG-data-URL check is
-- moot. Replace with a URL-shape check so nothing weird ends up in the
-- column.

alter table public.designs
  drop constraint if exists designs_image_url_max_size;

alter table public.designs
  drop constraint if exists designs_image_url_no_svg;

-- NOT VALID: only enforce on new inserts/updates. Pre-migration rows that
-- still hold a `data:image/png;base64,...` URL are tolerated; the renderer
-- dual-reads them via lib/render/fetch-image.ts.
alter table public.designs
  add constraint designs_image_url_shape
  check (image_url is null or image_url ~ '^https?://')
  not valid;
