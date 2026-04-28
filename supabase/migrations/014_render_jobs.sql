-- Durable render queue. One row per order_item that needs rendering. Replaces
-- the previous fire-and-forget detached promise from markOrderPaid: enqueue is
-- a single insert (fast, transactional), and the actual sharp+upload work is
-- driven by the admin /api/admin/render worker route. A failed job persists
-- with status='failed' + last_error so the admin can re-trigger.

create table if not exists public.render_jobs (
  order_item_id uuid primary key references public.order_items(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','running','done','failed')),
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists render_jobs_status_idx on public.render_jobs (status, created_at);

alter table public.render_jobs enable row level security;
-- No policies = service-role only access.
