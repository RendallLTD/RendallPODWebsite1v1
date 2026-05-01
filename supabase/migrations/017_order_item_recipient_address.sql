-- Per-item recipient address for bulk orders.
--
-- Until now, an order had ONE shipping address (orders.shipping_address) and
-- N items shipped together. Bulk checkout ships ONE order to N recipients
-- with a single payment, so each item needs its own ship-to.
--
-- recipient_address is nullable for back-compat: legacy single-recipient
-- orders fall back to orders.shipping_address. Renderer + factory XLSX must
-- prefer this column when present.

alter table public.order_items
  add column if not exists recipient_address jsonb;
