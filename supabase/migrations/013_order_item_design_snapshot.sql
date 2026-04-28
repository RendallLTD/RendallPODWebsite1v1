-- Snapshot fulfillment-critical fields onto order_items at order creation.
-- Users retain UPDATE on their own designs row, so without a snapshot a
-- paid order can be silently rendered with different artwork than was paid
-- for. After this migration, render + XLSX read from the immutable snapshot.

alter table public.order_items
  add column if not exists design_snapshot jsonb,
  add column if not exists image_url_snapshot text,
  add column if not exists product_id_snapshot text;

-- Backfill existing rows from the live designs join. Migration 005 prevents
-- delete of referenced designs, so all order_items should resolve.
update public.order_items oi
set
  design_snapshot = d.design_config,
  image_url_snapshot = d.image_url,
  product_id_snapshot = d.product_id
from public.designs d
where oi.design_id = d.id
  and oi.design_snapshot is null;

-- Fail loudly if any rows are still un-backfilled before we lock NOT NULL.
do $$
declare orphan_count int;
begin
  select count(*) into orphan_count from public.order_items
    where design_snapshot is null or product_id_snapshot is null;
  if orphan_count > 0 then
    raise exception 'Backfill incomplete: % rows have null snapshot — investigate before re-running', orphan_count;
  end if;
end $$;

alter table public.order_items
  alter column design_snapshot set not null,
  alter column product_id_snapshot set not null;
