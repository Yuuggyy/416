alter table public.tracks add column if not exists spotify_url text;

create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read" on public.app_settings;
create policy "app_settings_public_read" on public.app_settings for select using (true);

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value) values ('app_name', '416 Records'), ('logo_url', '')
on conflict (key) do nothing;
