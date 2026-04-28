-- Airwallex webhook event log. Acts as the idempotency boundary so that
-- replayed events (same event.id) are detected and not re-processed.
-- Service-role only; no user-facing access.

create table if not exists public.airwallex_webhook_events (
  event_id text primary key,
  name text not null,
  order_id uuid references public.orders(id) on delete set null,
  received_at timestamptz not null default now()
);

alter table public.airwallex_webhook_events enable row level security;
-- No policies = service-role only access (anon/authed denied by default).
