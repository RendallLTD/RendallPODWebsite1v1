-- Stripe checkout: enforce one order per Stripe Checkout Session for webhook idempotency.
-- Run in Supabase SQL Editor after 002_security_hardening.sql.
--
-- Stripe retries webhook delivery on non-2xx responses and can deliver the same
-- event more than once even on success. The webhook handler catches unique
-- violations (Postgres 23505) and returns success — this constraint is what
-- makes that safe. NULL values are allowed multiple times in Postgres UNIQUE,
-- which is fine: every Stripe-created order will have this column set.

alter table public.orders
  add constraint orders_stripe_session_id_unique
  unique (stripe_session_id);
