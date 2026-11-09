-- NEXORA: threaded story comments, comment likes, and owner-only story deletion.
-- Run once in Supabase SQL Editor.
alter table public.nexora_story_comments
  add column if not exists parent_comment_id uuid null
  references public.nexora_story_comments(id) on delete cascade;

create index if not exists nexora_story_comments_parent_idx
  on public.nexora_story_comments(story_id, parent_comment_id, created_at);

create table if not exists public.nexora_story_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.nexora_story_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

alter table public.nexora_story_comment_likes enable row level security;
drop policy if exists "NEXORA story comment likes readable" on public.nexora_story_comment_likes;
create policy "NEXORA story comment likes readable"
  on public.nexora_story_comment_likes for select to authenticated using (
    exists (
      select 1 from public.nexora_story_comments c
      join public.nexora_stories s on s.id = c.story_id
      where c.id = comment_id and s.expires_at > now()
    )
  );
drop policy if exists "NEXORA users like story comments as themselves" on public.nexora_story_comment_likes;
create policy "NEXORA users like story comments as themselves"
  on public.nexora_story_comment_likes for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "NEXORA users remove own story comment likes" on public.nexora_story_comment_likes;
create policy "NEXORA users remove own story comment likes"
  on public.nexora_story_comment_likes for delete to authenticated
  using (auth.uid() = user_id);

-- Keep story deletion restricted to its owner.
drop policy if exists "Users can delete own stories" on public.nexora_stories;
create policy "Users can delete own stories" on public.nexora_stories
  for delete to authenticated using (auth.uid() = user_id);

-- The media object is removable only from the authenticated user's own folder.
drop policy if exists "Users can delete their own story media" on storage.objects;
create policy "Users can delete their own story media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text
  );
