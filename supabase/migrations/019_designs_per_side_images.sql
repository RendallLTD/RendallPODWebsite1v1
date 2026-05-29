-- Per-side preview image URLs on the designs row.
--
-- Pre-2026-05-29 the designer wrote a single `image_url` — the URL of the
-- first layer's uploaded image, taken from whichever side existed first
-- (front preferred). Bulk-start thumbnails overlay this on the front mockup
-- tile AND the back mockup tile, which is wrong when the seller uploaded a
-- different design for the back.
--
-- These two columns let bulk-start (and any other previewer) show the
-- correct image per side. Both nullable: a design can have front-only,
-- back-only, or both.
--
-- The legacy `image_url` column stays — it remains the canonical "show me
-- one preview" column for places that don't care about sides (admin cart
-- thumbnail, dashboard list). The designer keeps it populated to whichever
-- of front/back exists.
alter table public.designs
  add column if not exists image_url_front text,
  add column if not exists image_url_back text;
