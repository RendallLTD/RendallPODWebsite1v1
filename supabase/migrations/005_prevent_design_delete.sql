-- Prevent deletion of designs that are referenced by order_items.
--
-- Closes Codex adversarial review Finding B (Review #3, 2026-04-12):
-- "Orders keep only a nullable design reference, so a user can delete
-- the printable asset after checkout begins."
--
-- Before: order_items.design_id was ON DELETE SET NULL, meaning a user
-- could delete a paid design and leave a paid order unfulfillable.
--
-- After: ON DELETE RESTRICT blocks the delete at the DB level. The app
-- surfaces a friendly error ("This design is part of an order").
--
-- Also adds checkout_url to orders for Finding A (idempotent checkout
-- reuse — store the Stripe session URL so retries return the same one).
--
-- Run in Supabase SQL Editor after 004_order_cart_snapshot.sql.

-- 1. Change order_items.design_id FK from SET NULL to RESTRICT
ALTER TABLE public.order_items
  DROP CONSTRAINT order_items_design_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_design_id_fkey
    FOREIGN KEY (design_id) REFERENCES public.designs(id)
    ON DELETE RESTRICT;

-- 2. Add checkout_url to orders for idempotent session reuse
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_url text;

COMMENT ON COLUMN public.orders.checkout_url IS
  'Stripe Checkout Session URL stored at draft creation. Returned on retry within 30 min to prevent duplicate drafts (Finding A).';
