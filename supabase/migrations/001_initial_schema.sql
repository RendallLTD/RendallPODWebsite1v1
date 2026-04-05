-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  business_name text,
  plan text default 'free' check (plan in ('free', 'premium', 'enterprise')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Designs
create table public.designs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  name text,
  image_url text,
  design_config jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.designs enable row level security;
create policy "Users can CRUD own designs" on public.designs for all using (auth.uid() = user_id);

-- Cart items
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  design_id uuid references public.designs on delete cascade not null,
  quantity int default 1,
  size text,
  color text,
  created_at timestamptz default now()
);

alter table public.cart_items enable row level security;
create policy "Users can CRUD own cart" on public.cart_items for all using (auth.uid() = user_id);

-- Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'paid', 'printing', 'shipped', 'delivered')),
  total_cents int not null,
  stripe_session_id text,
  shipping_address jsonb,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Users can read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Order items
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  design_id uuid references public.designs on delete set null,
  product_name text not null,
  quantity int not null,
  size text,
  color text,
  unit_price_cents int not null
);

alter table public.order_items enable row level security;
create policy "Users can read own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
create policy "Users can insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
