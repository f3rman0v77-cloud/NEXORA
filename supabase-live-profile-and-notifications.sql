-- NEXORA: realtime notifications + live profile photo updates.
-- Run once in Supabase SQL Editor while signed in as the project owner.

-- Allow a signed-in user to update only their own profile row.
alter table public.nexora_profiles enable row level security;
drop policy if exists "NEXORA users update own profile" on public.nexora_profiles;
create policy "NEXORA users update own profile"
  on public.nexora_profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public avatar bucket. Upload paths are scoped to the authenticated user's UUID.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "NEXORA users upload own avatars" on storage.objects;
create policy "NEXORA users upload own avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "NEXORA users update own avatars" on storage.objects;
create policy "NEXORA users update own avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "NEXORA users delete own avatars" on storage.objects;
create policy "NEXORA users delete own avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Enable Supabase Realtime for notification inserts and profile updates.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nexora_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.nexora_notifications';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nexora_profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.nexora_profiles';
  end if;
end $$;

alter table public.nexora_profiles replica identity full;
