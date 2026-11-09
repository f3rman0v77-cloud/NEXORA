-- NEXORA: allow an authenticated user to delete only their own posts.
-- Run once in Supabase SQL Editor.
alter table public.nexora_posts enable row level security;

drop policy if exists "Users can delete own posts" on public.nexora_posts;
create policy "Users can delete own posts"
  on public.nexora_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Optional media cleanup: a user may remove files only from their own folder.
drop policy if exists "Users can delete their own post media" on storage.objects;
create policy "Users can delete their own post media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
