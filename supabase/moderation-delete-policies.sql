-- NEXORA moderation: execute in Supabase SQL Editor after poll-duration-nx-fees.sql.
-- Admin membership is stored in nexora_admins and cannot be changed by normal users.
create or replace function public.nexora_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.nexora_admins where user_id = (select auth.uid())); $$;
revoke all on function public.nexora_is_admin() from public;
grant execute on function public.nexora_is_admin() to authenticated;

alter table public.nexora_messages enable row level security;
drop policy if exists "nexora_messages_delete_own_or_admin" on public.nexora_messages;
create policy "nexora_messages_delete_own_or_admin" on public.nexora_messages
for delete to authenticated using (sender_id = (select auth.uid()) or public.nexora_is_admin());
grant delete on public.nexora_messages to authenticated;

alter table public.nexora_post_comments enable row level security;
drop policy if exists "nexora_post_comments_delete_own_or_admin" on public.nexora_post_comments;
create policy "nexora_post_comments_delete_own_or_admin" on public.nexora_post_comments
for delete to authenticated using (user_id = (select auth.uid()) or public.nexora_is_admin());
grant delete on public.nexora_post_comments to authenticated;

alter table public.nexora_poll_comments enable row level security;
drop policy if exists "nexora_poll_comments_delete_own_or_admin" on public.nexora_poll_comments;
create policy "nexora_poll_comments_delete_own_or_admin" on public.nexora_poll_comments
for delete to authenticated using (author_id = (select auth.uid()) or public.nexora_is_admin());
grant delete on public.nexora_poll_comments to authenticated;

alter table public.nexora_polls enable row level security;
drop policy if exists "nexora_polls_delete" on public.nexora_polls;
create policy "nexora_polls_delete" on public.nexora_polls
for delete to authenticated using (author_id = (select auth.uid()) or public.nexora_is_admin());

alter table public.nexora_posts enable row level security;
drop policy if exists "nexora_posts_delete_own_or_admin" on public.nexora_posts;
create policy "nexora_posts_delete_own_or_admin" on public.nexora_posts
for delete to authenticated using (user_id = (select auth.uid()) or public.nexora_is_admin());
grant delete on public.nexora_posts to authenticated;

alter table public.nexora_story_comments enable row level security;
drop policy if exists "nexora_story_comments_delete_own_or_admin" on public.nexora_story_comments;
create policy "nexora_story_comments_delete_own_or_admin" on public.nexora_story_comments
for delete to authenticated using (user_id = (select auth.uid()) or public.nexora_is_admin());
grant delete on public.nexora_story_comments to authenticated;

alter table public.nexora_stories enable row level security;
drop policy if exists "nexora_stories_delete_own_or_admin" on public.nexora_stories;
create policy "nexora_stories_delete_own_or_admin" on public.nexora_stories
for delete to authenticated using (user_id = (select auth.uid()) or public.nexora_is_admin());
grant delete on public.nexora_stories to authenticated;
