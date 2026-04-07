-- Security hardening: block plan self-upgrade and client-side order creation.
-- Run in Supabase SQL Editor after 001_initial_schema.sql.

-- ============================================================
-- Fix: profiles.plan must not be self-upgradable
-- ============================================================
-- The existing "Users can update own profile" policy lets users edit their own
-- row, including the `plan` column. We keep the policy (so display_name etc.
-- still work) but add a BEFORE UPDATE trigger that forces plan back to its old
-- value on any user-initiated update. Service-role writes bypass triggers that
-- check auth.uid(), so admin changes via service key still work.

create or replace function public.prevent_plan_self_change()
returns trigger as $$
begin
  if new.plan is distinct from old.plan then
    -- Only allow when there is no authenticated user (i.e. service role / SQL editor)
    if auth.uid() is not null then
      new.plan := old.plan;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_prevent_plan_self_change on public.profiles;
create trigger profiles_prevent_plan_self_change
  before update on public.profiles
  for each row execute function public.prevent_plan_self_change();

-- ============================================================
-- Fix: orders / order_items must not be insertable by clients
-- ============================================================
-- Client can currently INSERT an order with any total_cents they want.
-- Revoke the INSERT policies. Orders will be created exclusively by the
-- Stripe webhook handler using the SUPABASE_SERVICE_ROLE_KEY, which bypasses
-- RLS. Users keep SELECT access so their order history still works.

drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can insert own order items" on public.order_items;
