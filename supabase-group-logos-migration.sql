-- Run AFTER supabase-groups-migration.sql.
alter table public.nexora_groups add column if not exists logo_path text;
drop policy if exists "nx groups update logo" on public.nexora_groups;
create policy "nx groups update logo" on public.nexora_groups
for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('nexora-group-logos','nexora-group-logos',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- Public group logos are visible to anyone with their URL; do not upload private photos.
drop policy if exists "nx group logos upload" on storage.objects;
create policy "nx group logos upload" on storage.objects for insert to authenticated
with check (
 bucket_id='nexora-group-logos'
 and exists (
  select 1 from public.nexora_groups g
  where g.id::text = (storage.foldername(name))[1] and g.owner_id=auth.uid()
 )
);
drop policy if exists "nx group logos update" on storage.objects;
create policy "nx group logos update" on storage.objects for update to authenticated
using (bucket_id='nexora-group-logos' and exists(
 select 1 from public.nexora_groups g where g.id::text=(storage.foldername(name))[1] and g.owner_id=auth.uid()
)) with check (bucket_id='nexora-group-logos' and exists(
 select 1 from public.nexora_groups g where g.id::text=(storage.foldername(name))[1] and g.owner_id=auth.uid()
));
