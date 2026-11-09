-- NEXORA real mesajlaşma (Supabase)
-- Supabase Dashboard -> SQL Editor bölməsində bir dəfə icra edin.
-- Fərziyyə: public.nexora_profiles.id = auth.users.id (izləmə sistemində olduğu kimi).

-- 1) Mesajlar cədvəli
create table if not exists public.nexora_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint nexora_messages_not_self check (sender_id <> receiver_id),
  constraint nexora_messages_not_empty check (char_length(body) > 0 or media_url is not null)
);

-- Cədvəl əvvəldən köhnə strukturla yaranıbsa, çatışmayan sütunları əlavə et
alter table public.nexora_messages add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.nexora_messages add column if not exists receiver_id uuid references auth.users(id) on delete cascade;
alter table public.nexora_messages add column if not exists body text not null default '';
alter table public.nexora_messages add column if not exists media_url text;
alter table public.nexora_messages add column if not exists media_type text;
alter table public.nexora_messages add column if not exists created_at timestamptz not null default now();
alter table public.nexora_messages add column if not exists read_at timestamptz;

create index if not exists nexora_messages_pair_idx
  on public.nexora_messages (sender_id, receiver_id, created_at desc);
create index if not exists nexora_messages_receiver_idx
  on public.nexora_messages (receiver_id, created_at desc);

-- 2) Təhlükəsizlik: yalnız söhbətin iki tərəfi mesajı görə bilər
alter table public.nexora_messages enable row level security;

drop policy if exists "Participants can read messages" on public.nexora_messages;
create policy "Participants can read messages" on public.nexora_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send messages as themselves" on public.nexora_messages;
create policy "Users can send messages as themselves" on public.nexora_messages
  for insert to authenticated
  with check (auth.uid() = sender_id and sender_id <> receiver_id);

drop policy if exists "Receivers can mark messages as read" on public.nexora_messages;
create policy "Receivers can mark messages as read" on public.nexora_messages
  for update to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Alan yalnız read_at sütununu dəyişə bilər (mesaj mətnini yox)
revoke update on public.nexora_messages from authenticated;
grant update (read_at) on public.nexora_messages to authenticated;

-- 3) Real vaxt (yeni mesaj dərhal çatsın)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'nexora_messages'
  ) then
    alter publication supabase_realtime add table public.nexora_messages;
  end if;
end $$;

-- 4) Mesajdakı foto/video üçün Storage bucket (maksimum 20 MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-media', 'chat-media', true, 20971520)
on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "Users can upload their own chat media" on storage.objects;
create policy "Users can upload their own chat media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own chat media" on storage.objects;
create policy "Users can delete their own chat media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- 5) PostgREST schema cache-i yenilə ("Could not find the 'body' column ... in the schema cache" xətasını aradan qaldırır)
notify pgrst, 'reload schema';
