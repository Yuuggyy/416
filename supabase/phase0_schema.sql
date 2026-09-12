-- =====================================================================
-- 416 RECORDS — PHASE 0 : casting digital, quicks, écoutes fan, fidélité
-- À exécuter dans le SQL Editor du projet Supabase (ugwsvksozygdzgqeiddc)
-- Idempotent : peut être relancé sans casse (drop si existe)
-- =====================================================================

-- ---------- 0) Fonction admin (même logique que ADMIN_EMAILS côté app)
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = any (array['guymuzongo1234@gmail.com']),
    false
  );
$$;

-- ---------- 1) Candidatures Phase 0
drop table if exists public.jury_scores cascade;
drop table if exists public.casting_votes cascade;
drop table if exists public.casting_applications cascade;

create table public.casting_applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  artist_name text not null,
  track_title text not null,
  video_url   text not null,
  description text,
  -- pending = en attente de validation admin
  -- approved = visible et likable
  -- rejected = écartée
  -- selected = retenue pour l'émission (36 par composite)
  -- repeche  = sauvée par les likes (4 meilleurs likes hors sélection)
  status      text not null default 'pending'
              check (status in ('pending','approved','rejected','selected','repeche')),
  created_at  timestamptz not null default now()
);

-- ---------- 2) Votes (likes) : 1 abonné = 1 vote par candidature
create table public.casting_votes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.casting_applications(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (application_id, user_id)
);

-- ---------- 3) Notes du jury (grille sur 10 : 3+2+3+2)
create table public.jury_scores (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.casting_applications(id) on delete cascade,
  jury_user_id   uuid not null references auth.users(id) on delete cascade,
  ecriture       int not null check (ecriture between 0 and 3),       -- écriture /3
  choix_prod     int not null check (choix_prod between 0 and 2),     -- choix de prod /2
  prestance      int not null check (prestance between 0 and 3),      -- prestance /3
  potentiel_video int not null check (potentiel_video between 0 and 2), -- potentiel vidéo /2
  comment        text,
  created_at     timestamptz not null default now(),
  unique (application_id, jury_user_id)
);

-- ---------- 4) Quicks (vertical feed ≤ 60s)
create table public.quicks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  application_id  uuid references public.casting_applications(id) on delete set null,
  title           text not null,
  video_url       text not null,
  views           int not null default 0,
  featured        boolean not null default false,
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  created_at      timestamptz not null default now()
);

-- ---------- 5) Écoutes fan / super fan
create table public.fan_listens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  track_id   text not null,
  listen_type text not null check (listen_type in ('fan','super_fan')),
  paid       boolean not null default false, -- true = super fan payé, false = via pubs
  created_at timestamptz not null default now()
);
-- une écoute comptabilisée par titre et par jour (anti-farm)
create unique index if not exists fan_listens_once_per_day
  on public.fan_listens (user_id, track_id, listen_type, (date(created_at)));

-- ---------- 6) Points de fidélité (registre)
create table public.loyalty_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  points     int not null,
  reason     text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.casting_applications enable row level security;
alter table public.casting_votes      enable row level security;
alter table public.jury_scores        enable row level security;
alter table public.quicks             enable row level security;
alter table public.fan_listens        enable row level security;
alter table public.loyalty_ledger     enable row level security;

-- Candidatures : lecture publique (le filtrage par statut se fait côté app),
-- insertion par son propriétaire, MAJ par admin (validation, sélection)
create policy "casting_select" on public.casting_applications
  for select using (true);
create policy "casting_insert" on public.casting_applications
  for insert with check (auth.uid() = user_id);
create policy "casting_update" on public.casting_applications
  for update using (public.is_admin() or auth.uid() = user_id);

-- Votes : lecture publique (compteur), insertion : abonné connecté, 1 seul
create policy "votes_select" on public.casting_votes
  for select using (true);
create policy "votes_insert" on public.casting_votes
  for insert with check (auth.uid() = user_id);

-- Notes jury : admin uniquement
create policy "jury_select" on public.jury_scores
  for select using (public.is_admin());
create policy "jury_insert" on public.jury_scores
  for insert with check (public.is_admin());
create policy "jury_update" on public.jury_scores
  for update using (public.is_admin());

-- Quicks : lecture publique, insertion par utilisateur connecté (pending),
-- validation / modification par admin
create policy "quicks_select" on public.quicks
  for select using (true);
create policy "quicks_insert" on public.quicks
  for insert with check (auth.uid() is not null);
create policy "quicks_update" on public.quicks
  for update using (public.is_admin());
create policy "quicks_delete" on public.quicks
  for delete using (public.is_admin());

-- Écoutes : visibles par leur auteur uniquement
create policy "listens_select" on public.fan_listens
  for select using (auth.uid() = user_id or public.is_admin());
create policy "listens_insert" on public.fan_listens
  for insert with check (auth.uid() = user_id);

-- Fidélité : lecture de son propre solde, écriture de ses lignes
create policy "loyalty_select" on public.loyalty_ledger
  for select using (auth.uid() = user_id or public.is_admin());
create policy "loyalty_insert" on public.loyalty_ledger
  for insert with check (auth.uid() = user_id);

-- =====================================================================
-- Storage : upload authentifié vers les préfixes casting/ et quicks/
-- (le bucket "media" existe déjà — ces règles n'ouvrent que ces dossiers)
-- =====================================================================
drop policy if exists "phase0_casting_upload" on storage.objects;
create policy "phase0_casting_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and name like 'casting/%');

drop policy if exists "phase0_quicks_upload" on storage.objects;
create policy "phase0_quicks_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and name like 'quicks/%');
