-- ============================================================
-- 416 Records — Phase 2 : Chat communautaire
-- Messages texte + vocaux, tags @, notifications de mention,
-- publication Realtime pour le temps réel.
-- Idempotent : peut être ré-exécuté sans risque.
-- ============================================================

-- ---------- 1) Messages de chat ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room text not null default 'community',
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text,
  audio_url text,
  audio_seconds int,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint chat_content_check
    check (content is not null or audio_url is not null)
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room, created_at desc);
create index if not exists chat_messages_mentions_idx
  on public.chat_messages using gin (mentions);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_select" on public.chat_messages;
create policy "chat_select" on public.chat_messages
  for select to authenticated using (true);

drop policy if exists "chat_insert" on public.chat_messages;
create policy "chat_insert" on public.chat_messages
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists "chat_delete_own" on public.chat_messages;
create policy "chat_delete_own" on public.chat_messages
  for delete to authenticated using (sender_id = auth.uid() or public.is_admin());

-- ---------- 2) Notifications (mentions/tags) ----------
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'mention',
  actor_id uuid references auth.users (id) on delete set null,
  message_id uuid references public.chat_messages (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_unread_idx
  on public.user_notifications (user_id, read, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "notif_select" on public.user_notifications;
create policy "notif_select" on public.user_notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notif_update" on public.user_notifications;
create policy "notif_update" on public.user_notifications
  for update to authenticated using (user_id = auth.uid());

-- trigger : notifier chaque utilisateur tagué (sauf l'auteur)
create or replace function public.notify_mentions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_notifications (user_id, type, actor_id, message_id)
  select m, 'mention', new.sender_id, new.id
  from unnest(new.mentions) as m
  where m <> new.sender_id
    and not exists (
      select 1 from public.user_notifications n
      where n.user_id = m and n.message_id = new.id
    );
  return new;
end;
$$;

drop trigger if exists chat_notify_mentions on public.chat_messages;
create trigger chat_notify_mentions
  after insert on public.chat_messages
  for each row execute function public.notify_mentions();

-- ---------- 3) Realtime (messages en direct) ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- ---------- 4) Storage : vocaux du chat ----------
drop policy if exists "phase2_chat_upload" on storage.objects;
create policy "phase2_chat_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and name like 'chat/%');
