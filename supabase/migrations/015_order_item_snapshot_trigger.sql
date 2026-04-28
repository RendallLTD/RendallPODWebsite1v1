-- Auto-populate design_snapshot + image_url_snapshot from the referenced
-- designs row on insert into order_items.
--
-- Why this exists:
-- 1. Performance: design_config can be multi-MB jsonb. Round-tripping it
--    through Node during checkout was hitting the Supabase statement
--    timeout. Filling it via a trigger keeps the bytes server-side.
-- 2. Immutability at order time: this is the snapshot that closes the
--    Codex finding "paid orders render from mutable user-owned designs".
--    Renderer + XLSX read from these columns, never from the live designs
--    row, so post-checkout edits cannot alter what the factory prints.
--
-- Idempotency: the NULL guard means manual inserts that already specify a
-- snapshot (e.g. data migrations, tests) are not overwritten.

create or replace function public.copy_design_snapshot_to_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.design_snapshot is null and NEW.design_id is not null then
    select d.design_config, d.image_url
      into NEW.design_snapshot, NEW.image_url_snapshot
    from public.designs d
    where d.id = NEW.design_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists order_items_copy_design_snapshot on public.order_items;
create trigger order_items_copy_design_snapshot
  before insert on public.order_items
  for each row
  execute function public.copy_design_snapshot_to_order_item();
