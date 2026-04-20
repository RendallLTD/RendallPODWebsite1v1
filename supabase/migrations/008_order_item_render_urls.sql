-- Rendered asset URLs for the factory XLSX export.
-- print_url_front:  transparent-background PNG at physical print dimensions (column S of CP导入)
-- mockup_url_front: design composited on garment photo (column R of CP导入)
-- Populated lazily by /api/admin/render. NULL means the item has not been
-- rendered yet; the XLSX export still emits the row with blank R/S cells.

alter table public.order_items
  add column if not exists print_url_front text,
  add column if not exists mockup_url_front text;
