-- NEXORA: make post likes persist for authenticated users.
-- Run once in Supabase SQL Editor.

alter table public.nexora_post_likes enable row level security;

-- Keep one like per user/post pair.
delete from public.nexora_post_likes a
using public.nexora_post_likes b
where a.post_id = b.post_id
  and a.user_id = b.user_id
  and a.ctid > b.ctid;

create unique index if not exists nexora_post_likes_post_user_unique
  on public.nexora_post_likes (post_id, user_id);

drop policy if exists "NEXORA post likes respect privacy" on public.nexora_post_likes;
create policy "NEXORA post likes respect privacy"
  on public.nexora_post_likes for select to authenticated
  using (exists (
    select 1 from public.nexora_posts p
    where p.id = post_id and public.nexora_can_view_profile(p.user_id)
  ));

drop policy if exists "NEXORA users can add own post likes" on public.nexora_post_likes;
create policy "NEXORA users can add own post likes"
  on public.nexora_post_likes for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.nexora_posts p
    where p.id = post_id and public.nexora_can_view_profile(p.user_id)
  ));

drop policy if exists "NEXORA users can remove own post likes" on public.nexora_post_likes;
create policy "NEXORA users can remove own post likes"
  on public.nexora_post_likes for delete to authenticated
  using (user_id = auth.uid());
