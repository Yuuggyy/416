-- =====================================================================
-- 416 RECORDS — PHASE 1 : comptes (free / premium / artiste)
-- À exécuter dans le SQL Editor du projet Supabase (ugwsvksozygdzgqeiddc)
-- Idempotent : peut être relancé sans casse
-- =====================================================================

-- ---------- 1) Table profils : source de vérité du type de compte
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  artist_name  text,
  account_type text not null default 'free'
    check (account_type in ('free','premium','artist')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Backfill : un profil par utilisateur existant
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- Profil créé automatiquement à chaque inscription
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();

-- updated_at automatique
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- 2) Quicks : type de post (quick ≤60s ou clip musical)
alter table public.quicks
  add column if not exists kind text not null default 'quick'
    check (kind in ('quick','clip'));

-- ---------- 3) Garde-fou : on ne peut pas changer SOI-MÊME son type
-- (seul l'admin peut basculer free / premium / artiste)
create or replace function public.guard_account_type()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.account_type is distinct from old.account_type
     and auth.uid() = new.id
     and not public.is_admin() then
    raise exception 'Seul l''administration peut changer le type d''un compte';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_type on public.profiles;
create trigger profiles_guard_type
  before update on public.profiles
  for each row execute function public.guard_account_type();

-- ---------- 4) Synchronisation abonnements → profils
-- Un abonnement actif passe le compte en premium ; expiration → free
-- (sans toucher aux comptes artistes)
create or replace function public.sync_subscription_to_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'active' then
    update public.profiles
      set account_type = 'premium'
      where id = new.user_id and account_type = 'free';
  elsif new.status in ('expired','cancelled') then
    update public.profiles
      set account_type = 'free'
      where id = new.user_id and account_type = 'premium';
  end if;
  return new;
end;
$$;

drop trigger if exists subscriptions_sync_profile on public.subscriptions;
create trigger subscriptions_sync_profile
  after insert or update of status on public.subscriptions
  for each row execute function public.sync_subscription_to_profile();

-- ---------- 5) Vue publique (badges vérifiés) : SANS emails
-- Le feed quicks a besoin du type de compte et du nom d'artiste pour afficher
-- le badge « Artiste vérifié » — mais l'email ne doit jamais fuiter.
drop view if exists public.public_profiles;
create view public.public_profiles as
  select id, display_name, artist_name, account_type, created_at
  from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ---------- 6) RLS profils
alter table public.profiles enable row level security;

-- Lecture : son propre profil ou l'admin (emails protégés)
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Le propriétaire peut éditer son profil (nom, nom d'artiste) ;
-- le changement de type est bloqué par le garde-fou ci-dessus
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
