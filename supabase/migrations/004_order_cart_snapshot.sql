-- Cart snapshot: store the exact cart_items row IDs that a given order
-- was built from. The webhook uses this list to delete only the purchased
-- items when fulfillment completes — NOT the user's entire cart, which
-- would destroy items added after the Stripe session was created.
--
-- Closes Codex adversarial review Finding 2 (2026-04-11): "Completing an
-- old Stripe session can delete newer cart contents."
--
-- Run in Supabase SQL Editor after 003_stripe_checkout.sql.

alter table public.orders
  add column if not exists cart_item_ids uuid[] not null default '{}'::uuid[];

comment on column public.orders.cart_item_ids is
  'Snapshot of cart_items.id values captured when the draft order was created. The Stripe webhook deletes only these rows on fulfillment.';
