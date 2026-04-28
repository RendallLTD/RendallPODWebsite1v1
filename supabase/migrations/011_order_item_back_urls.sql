-- Back-side rendered asset URLs. Mirrors migration 008's pattern.
-- print_url_back:  transparent-background PNG at physical print dimensions (Rendall-only XLSX column W)
-- mockup_url_back: design composited on garment photo (Rendall-only XLSX column V)
-- NULL means the item's back side has not been rendered (or the design has no back layers).
-- Populated by /api/admin/render alongside the front URLs when the design contains back layers.

alter table public.order_items
  add column if not exists print_url_back text,
  add column if not exists mockup_url_back text;
