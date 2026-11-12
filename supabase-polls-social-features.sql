-- NEXORA polls social features: run once in Supabase SQL Editor
create table if not exists public.nexora_poll_likes (
 poll_id uuid not null references public.nexora_polls(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(poll_id,user_id)
);
create table if not exists public.nexora_poll_comments (
 id uuid primary key default gen_random_uuid(),
 poll_id uuid not null references public.nexora_polls(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists nexora_poll_comments_poll_idx on public.nexora_poll_comments(poll_id,created_at);
alter table public.nexora_poll_likes enable row level security;
alter table public.nexora_poll_comments enable row level security;
drop policy if exists nx_poll_likes_read on public.nexora_poll_likes;
create policy nx_poll_likes_read on public.nexora_poll_likes for select to authenticated using(true);
drop policy if exists nx_poll_likes_insert on public.nexora_poll_likes;
create policy nx_poll_likes_insert on public.nexora_poll_likes for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists nx_poll_likes_delete on public.nexora_poll_likes;
create policy nx_poll_likes_delete on public.nexora_poll_likes for delete to authenticated using(user_id=(select auth.uid()));
drop policy if exists nx_poll_comments_read on public.nexora_poll_comments;
create policy nx_poll_comments_read on public.nexora_poll_comments for select to authenticated using(true);
drop policy if exists nx_poll_comments_insert on public.nexora_poll_comments;
create policy nx_poll_comments_insert on public.nexora_poll_comments for insert to authenticated with check(author_id=(select auth.uid()));
drop policy if exists nx_poll_comments_delete on public.nexora_poll_comments;
create policy nx_poll_comments_delete on public.nexora_poll_comments for delete to authenticated using(author_id=(select auth.uid()));
grant select,insert,delete on public.nexora_poll_likes to authenticated;
grant select,insert,delete on public.nexora_poll_comments to authenticated;
-- Recreate feed with social counts; keep votes private
create or replace function public.nexora_poll_feed()
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(
 jsonb_build_object(
 'id',p.id,'author_id',p.author_id,
 'username',coalesce(pr.username,'istifadeci'),
 'name',coalesce(pr.name,pr.username,'İstifadəçi'),
 'question',p.question,'description',p.description,
 'created_at',p.created_at,'ends_at',p.ends_at,
 'my_option_id',(select v.option_id from public.nexora_poll_votes v where v.poll_id=p.id and v.user_id=auth.uid()),
 'like_count',(select count(*) from public.nexora_poll_likes l where l.poll_id=p.id),
 'liked_by_me',exists(select 1 from public.nexora_poll_likes l where l.poll_id=p.id and l.user_id=auth.uid()),
 'comment_count',(select count(*) from public.nexora_poll_comments c where c.poll_id=p.id),
 'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'votes',
 (select count(*) from public.nexora_poll_votes v where v.option_id=o.id)) order by o.position),'[]'::jsonb)
 from public.nexora_poll_options o where o.poll_id=p.id)
 ) order by p.created_at desc),'[]'::jsonb)
 from (select * from public.nexora_polls order by created_at desc limit 100) p
 left join public.nexora_profiles pr on pr.id=p.author_id
 where auth.uid() is not null;
$$;
revoke all on function public.nexora_poll_feed() from public;
grant execute on function public.nexora_poll_feed() to authenticated;
