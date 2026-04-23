-- Airwallex PaymentIntent correlation.
--
-- `airwallex_intent_id` ties an order to its Airwallex PaymentIntent. Populated
-- by `POST /api/payments/create-intent` once the customer enters the payment
-- page; consumed by `POST /api/webhooks/airwallex` to look up which order a
-- `payment_intent.succeeded` event belongs to.
--
-- Note: `orders.stripe_session_id` (migration 003) is a dead column kept to
-- avoid a rename migration. `airwallex_intent_id` is its functional successor.

alter table public.orders
  add column if not exists airwallex_intent_id text;

-- Partial unique index: NULLs allowed (orders without an intent yet) but once
-- populated, one intent id maps to exactly one order.
create unique index if not exists orders_airwallex_intent_id_key
  on public.orders (airwallex_intent_id)
  where airwallex_intent_id is not null;

comment on column public.orders.airwallex_intent_id is
  'Airwallex PaymentIntent id. Populated by /api/payments/create-intent; referenced by the webhook handler.';
