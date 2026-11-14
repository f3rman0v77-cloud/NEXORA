-- Run after existing group migrations and supabase-groups-fix.sql.
alter table public.nexora_group_messages
 add column if not exists media_path text,
 add column if not exists media_type text,
 add column if not exists share_url text;
alter table public.nexora_group_messages
 drop constraint if exists nexora_group_messages_body_check;
alter table public.nexora_group_messages
 add constraint nx_group_message_content_check
 check (
  (char_length(trim(coalesce(body,''))) between 1 and 4000)
  or media_path is not null or share_url is not null
 );
alter table public.nexora_group_members
 add column if not exists last_read_at timestamptz;
drop policy if exists "nx group members read receipt" on public.nexora_group_members;
create policy "nx group members read receipt" on public.nexora_group_members
 for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nexora-group-media','nexora-group-media',false,20971520,array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'])
on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'];
drop policy if exists "nx group media upload" on storage.objects;
create policy "nx group media upload" on storage.objects for insert to authenticated
with check(bucket_id='nexora-group-media' and public.nx_is_group_member(
case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' then (storage.foldername(name))[1]::uuid else null end,auth.uid()));
drop policy if exists "nx group media read" on storage.objects;
create policy "nx group media read" on storage.objects for select to authenticated
using(bucket_id='nexora-group-media' and public.nx_is_group_member(
case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' then (storage.foldername(name))[1]::uuid else null end,auth.uid()));
-- Owner avatar updates require SELECT on the row under RLS.
drop policy if exists "nx groups select owner" on public.nexora_groups;
create policy "nx groups select owner" on public.nexora_groups for select to authenticated using(owner_id=auth.uid());
notify pgrst,'reload schema';
