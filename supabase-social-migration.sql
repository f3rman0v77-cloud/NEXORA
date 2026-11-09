-- NEXORA story reactions and comments
-- Assumption: public.nexora_stories.id is UUID, as in the existing story implementation.

create table if not exists public.nexora_story_likes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.nexora_stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (story_id, user_id)
);

create table if not exists public.nexora_story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.nexora_stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);

alter table public.nexora_story_likes enable row level security;
alter table public.nexora_story_comments enable row level security;

drop policy if exists "Authenticated users can read story likes" on public.nexora_story_likes;
create policy "Authenticated users can read story likes" on public.nexora_story_likes
  for select to authenticated using (true);
drop policy if exists "Users can like stories as themselves" on public.nexora_story_likes;
create policy "Users can like stories as themselves" on public.nexora_story_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can remove their story likes" on public.nexora_story_likes;
create policy "Users can remove their story likes" on public.nexora_story_likes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Authenticated users can read story comments" on public.nexora_story_comments;
create policy "Authenticated users can read story comments" on public.nexora_story_comments
  for select to authenticated using (true);
drop policy if exists "Users can comment as themselves" on public.nexora_story_comments;
create policy "Users can comment as themselves" on public.nexora_story_comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can delete their story comments" on public.nexora_story_comments;
create policy "Users can delete their story comments" on public.nexora_story_comments
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists nexora_story_likes_story_id_idx on public.nexora_story_likes(story_id);
create index if not exists nexora_story_comments_story_id_created_idx on public.nexora_story_comments(story_id, created_at);


-- Public profile discovery and follow-list access (authenticated users only).
alter table public.nexora_profiles enable row level security;
drop policy if exists "Authenticated users can read public profiles" on public.nexora_profiles;
create policy "Authenticated users can read public profiles" on public.nexora_profiles
  for select to authenticated using (true);

alter table public.nexora_follows enable row level security;
drop policy if exists "Authenticated users can read follows" on public.nexora_follows;
create policy "Authenticated users can read follows" on public.nexora_follows
  for select to authenticated using (true);
drop policy if exists "Users can follow as themselves" on public.nexora_follows;
create policy "Users can follow as themselves" on public.nexora_follows
  for insert to authenticated with check (auth.uid() = follower_id and follower_id <> following_id);
drop policy if exists "Users can unfollow as themselves" on public.nexora_follows;
create policy "Users can unfollow as themselves" on public.nexora_follows
  for delete to authenticated using (auth.uid() = follower_id);

-- Stories are visible only to signed-in users at the data layer; the UI filters
-- the strip to the current user and accounts they follow.
alter table public.nexora_stories enable row level security;
drop policy if exists "Authenticated users can read active stories" on public.nexora_stories;
create policy "Authenticated users can read active stories" on public.nexora_stories
  for select to authenticated using (expires_at > now());
drop policy if exists "Users can publish own stories" on public.nexora_stories;
create policy "Users can publish own stories" on public.nexora_stories
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can delete own stories" on public.nexora_stories;
create policy "Users can delete own stories" on public.nexora_stories
  for delete to authenticated using (auth.uid() = user_id);

-- Private stories bucket: signed URLs can be created by authenticated users.
drop policy if exists "Authenticated users can view story media" on storage.objects;
create policy "Authenticated users can view story media" on storage.objects
  for select to authenticated using (bucket_id = 'stories');
drop policy if exists "Users can upload their own story media" on storage.objects;
create policy "Users can upload their own story media" on storage.objects
  for insert to authenticated with check (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete their own story media" on storage.objects;
create policy "Users can delete their own story media" on storage.objects
  for delete to authenticated using (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);
