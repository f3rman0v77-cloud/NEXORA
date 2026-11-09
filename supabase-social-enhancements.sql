-- NEXORA: privacy, follow requests, durable notifications and threaded comments.
alter table public.nexora_profiles add column if not exists is_private boolean not null default false;
alter table public.nexora_post_comments add column if not exists parent_comment_id uuid null references public.nexora_post_comments(id) on delete cascade;

create table if not exists public.nexora_follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(requester_id, target_id),
  check(requester_id <> target_id)
);
alter table public.nexora_follow_requests enable row level security;
drop policy if exists "Users can read requests they are part of" on public.nexora_follow_requests;
create policy "Users can read requests they are part of" on public.nexora_follow_requests for select to authenticated using (auth.uid() = requester_id or auth.uid() = target_id);
drop policy if exists "Users can request follows" on public.nexora_follow_requests;
create policy "Users can request follows" on public.nexora_follow_requests for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists "Targets can accept or reject requests" on public.nexora_follow_requests;
create policy "Targets can accept or reject requests" on public.nexora_follow_requests for delete to authenticated using (auth.uid() = target_id or auth.uid() = requester_id);

create table if not exists public.nexora_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('follow','follow_request','like','story_like','comment','story_comment','reply')),
  entity_id text,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists nexora_notifications_recipient_created_idx on public.nexora_notifications(recipient_id, created_at desc);
alter table public.nexora_notifications enable row level security;
drop policy if exists "Users can read own notifications" on public.nexora_notifications;
create policy "Users can read own notifications" on public.nexora_notifications for select to authenticated using (auth.uid() = recipient_id);
drop policy if exists "Users can receive notifications from signed in actors" on public.nexora_notifications;
create policy "Users can receive notifications from signed in actors" on public.nexora_notifications for insert to authenticated with check (auth.uid() = actor_id and auth.uid() <> recipient_id);
drop policy if exists "Users can mark own notifications read" on public.nexora_notifications;
create policy "Users can mark own notifications read" on public.nexora_notifications for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

create table if not exists public.nexora_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.nexora_post_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(comment_id,user_id)
);
alter table public.nexora_comment_likes enable row level security;
drop policy if exists "Authenticated users can read comment likes" on public.nexora_comment_likes;
create policy "Authenticated users can read comment likes" on public.nexora_comment_likes for select to authenticated using (true);
drop policy if exists "Users can like comments as themselves" on public.nexora_comment_likes;
create policy "Users can like comments as themselves" on public.nexora_comment_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can remove own comment likes" on public.nexora_comment_likes;
create policy "Users can remove own comment likes" on public.nexora_comment_likes for delete to authenticated using (auth.uid() = user_id);

-- Central privacy check. SECURITY DEFINER avoids recursive RLS evaluation on follows.
create or replace function public.nexora_can_view_profile(target_user uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.nexora_profiles p
    where p.id = target_user and (
      p.id = auth.uid() or p.is_private = false or exists (
        select 1 from public.nexora_follows f
        where f.follower_id = auth.uid() and f.following_id = p.id
      )
    )
  );
$$;
revoke all on function public.nexora_can_view_profile(uuid) from public;
grant execute on function public.nexora_can_view_profile(uuid) to authenticated;

-- Replace the earlier broad profile/follow read policies with privacy-aware ones.
drop policy if exists "Authenticated users can read public profiles" on public.nexora_profiles;
drop policy if exists "NEXORA profiles respect privacy" on public.nexora_profiles;
create policy "NEXORA profiles basic discovery" on public.nexora_profiles
  for select to authenticated using (true);
drop policy if exists "Authenticated users can read follows" on public.nexora_follows;
drop policy if exists "NEXORA follows respect privacy" on public.nexora_follows;
create policy "NEXORA follows respect privacy" on public.nexora_follows
  for select to authenticated using (
    follower_id = auth.uid() or following_id = auth.uid() or
    (public.nexora_can_view_profile(follower_id) and public.nexora_can_view_profile(following_id))
  );

-- Protect private posts, comments and reactions at the database layer as well as in the UI.
alter table public.nexora_posts enable row level security;
drop policy if exists "NEXORA posts respect privacy" on public.nexora_posts;
create policy "NEXORA posts respect privacy" on public.nexora_posts
  for select to authenticated using (public.nexora_can_view_profile(user_id));
alter table public.nexora_post_likes enable row level security;
drop policy if exists "NEXORA post likes respect privacy" on public.nexora_post_likes;
create policy "NEXORA post likes respect privacy" on public.nexora_post_likes
  for select to authenticated using (exists(select 1 from public.nexora_posts p where p.id = post_id and public.nexora_can_view_profile(p.user_id)));
alter table public.nexora_post_comments enable row level security;
drop policy if exists "NEXORA post comments respect privacy" on public.nexora_post_comments;
create policy "NEXORA post comments respect privacy" on public.nexora_post_comments
  for select to authenticated using (exists(select 1 from public.nexora_posts p where p.id = post_id and public.nexora_can_view_profile(p.user_id)));

-- Stories follow the same private-account visibility rule.
drop policy if exists "Authenticated users can read active stories" on public.nexora_stories;
drop policy if exists "NEXORA stories respect privacy" on public.nexora_stories;
create policy "NEXORA stories respect privacy" on public.nexora_stories
  for select to authenticated using (expires_at > now() and public.nexora_can_view_profile(user_id));
drop policy if exists "Authenticated users can view story media" on storage.objects;
drop policy if exists "NEXORA private story media access" on storage.objects;
create policy "NEXORA private story media access" on storage.objects
  for select to authenticated using (
    bucket_id = 'stories' and exists (
      select 1 from public.nexora_stories s
      where s.media_path = name and s.expires_at > now() and public.nexora_can_view_profile(s.user_id)
    )
  );

drop policy if exists "Authenticated users can read story likes" on public.nexora_story_likes;
drop policy if exists "NEXORA story likes respect privacy" on public.nexora_story_likes;
create policy "NEXORA story likes respect privacy" on public.nexora_story_likes
  for select to authenticated using (exists(select 1 from public.nexora_stories s where s.id = story_id and public.nexora_can_view_profile(s.user_id)));
drop policy if exists "Authenticated users can read story comments" on public.nexora_story_comments;
drop policy if exists "NEXORA story comments respect privacy" on public.nexora_story_comments;
create policy "NEXORA story comments respect privacy" on public.nexora_story_comments
  for select to authenticated using (exists(select 1 from public.nexora_stories s where s.id = story_id and public.nexora_can_view_profile(s.user_id)));
drop policy if exists "Authenticated users can read comment likes" on public.nexora_comment_likes;
drop policy if exists "NEXORA comment likes respect privacy" on public.nexora_comment_likes;
create policy "NEXORA comment likes respect privacy" on public.nexora_comment_likes
  for select to authenticated using (exists(
    select 1 from public.nexora_post_comments c join public.nexora_posts p on p.id = c.post_id
    where c.id = comment_id and public.nexora_can_view_profile(p.user_id)
  ));

-- Private profiles expose aggregate counters, never the underlying relation lists.
create or replace function public.nexora_profile_counts(target_user uuid)
returns table(post_count bigint, follower_count bigint, following_count bigint)
language sql stable security definer set search_path = public
as $$
  select
    (select count(*) from public.nexora_posts p where p.user_id = target_user),
    (select count(*) from public.nexora_follows f where f.following_id = target_user),
    (select count(*) from public.nexora_follows f where f.follower_id = target_user);
$$;
revoke all on function public.nexora_profile_counts(uuid) from public;
grant execute on function public.nexora_profile_counts(uuid) to authenticated;
