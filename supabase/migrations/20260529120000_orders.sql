-- Orders table for cart-based checkout with WhatsApp follow-up
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  whatsapp text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.orders to authenticated;
grant insert on public.orders to anon;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "anyone can insert orders"
on public.orders for insert
to anon, authenticated
with check (true);

create policy "users see own orders or admin sees all"
on public.orders for select
to authenticated
using (
  user_id = auth.uid()
  or (auth.jwt() ->> 'email') = 'guymuzongo1234@gmail.com'
);

create policy "admin updates orders"
on public.orders for update
to authenticated
using ((auth.jwt() ->> 'email') = 'guymuzongo1234@gmail.com')
with check ((auth.jwt() ->> 'email') = 'guymuzongo1234@gmail.com');
