-- NEXORA sosial anketlər. Supabase SQL Editor-də bir dəfə icra et.
create table if not exists public.nexora_polls (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 question text not null check (char_length(trim(question)) between 5 and 280),
 description text not null default '' check (char_length(description) <= 500),
 ends_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table if not exists public.nexora_poll_options (
 id uuid primary key default gen_random_uuid(),
 poll_id uuid not null references public.nexora_polls(id) on delete cascade,
 label text not null check (char_length(trim(label)) between 1 and 100),
 position integer not null check (position between 0 and 5),
 unique(poll_id, position),
 unique(poll_id, id)
);
create table if not exists public.nexora_poll_votes (
 poll_id uuid not null references public.nexora_polls(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 option_id uuid not null,
 created_at timestamptz not null default now(),
 primary key (poll_id,user_id),
 foreign key (poll_id,option_id) references public.nexora_poll_options(poll_id,id) on delete cascade
);
create index if not exists nexora_polls_created_idx on public.nexora_polls(created_at desc);
create index if not exists nexora_poll_options_poll_idx on public.nexora_poll_options(poll_id);
create index if not exists nexora_poll_votes_option_idx on public.nexora_poll_votes(option_id);
alter table public.nexora_polls enable row level security;
alter table public.nexora_poll_options enable row level security;
alter table public.nexora_poll_votes enable row level security;
drop policy if exists "nexora_polls_read" on public.nexora_polls;
create policy "nexora_polls_read" on public.nexora_polls for select to authenticated using (true);
drop policy if exists "nexora_polls_create" on public.nexora_polls;
create policy "nexora_polls_create" on public.nexora_polls for insert to authenticated with check (author_id = (select auth.uid()) and ends_at > now() and ends_at <= now() + interval '8 days');
drop policy if exists "nexora_polls_delete" on public.nexora_polls;
create policy "nexora_polls_delete" on public.nexora_polls for delete to authenticated using (author_id = (select auth.uid()));
drop policy if exists "nexora_poll_options_read" on public.nexora_poll_options;
create policy "nexora_poll_options_read" on public.nexora_poll_options for select to authenticated using (true);
drop policy if exists "nexora_poll_options_create" on public.nexora_poll_options;
create policy "nexora_poll_options_create" on public.nexora_poll_options for insert to authenticated
with check (exists (select 1 from public.nexora_polls p where p.id = poll_id and p.author_id = (select auth.uid()) and p.ends_at > now()));
-- Votes are private; public totals are returned by the safe RPC below.
drop policy if exists "nexora_poll_votes_own_read" on public.nexora_poll_votes;
create policy "nexora_poll_votes_own_read" on public.nexora_poll_votes for select to authenticated using (user_id = (select auth.uid()));
create or replace function public.nexora_vote_poll(p_poll_id uuid, p_option_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Hesaba daxil olmalısan'; end if;
 if not exists (select 1 from public.nexora_polls where id=p_poll_id and ends_at > now()) then
   raise exception 'Anket bitib və ya mövcud deyil';
 end if;
 if not exists (select 1 from public.nexora_poll_options where id=p_option_id and poll_id=p_poll_id) then
   raise exception 'Yanlış cavab variantı';
 end if;
 insert into public.nexora_poll_votes(poll_id,user_id,option_id)
 values (p_poll_id,auth.uid(),p_option_id)
 on conflict (poll_id,user_id) do update set option_id=excluded.option_id, created_at=now();
end; $$;
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
 'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'votes',
 (select count(*) from public.nexora_poll_votes v where v.option_id=o.id)) order by o.position),'[]'::jsonb)
 from public.nexora_poll_options o where o.poll_id=p.id)
 ) order by p.created_at desc),'[]'::jsonb)
 from (select * from public.nexora_polls order by created_at desc limit 100) p
 left join public.nexora_profiles pr on pr.id=p.author_id
 where auth.uid() is not null;
$$;
revoke all on function public.nexora_vote_poll(uuid,uuid) from public;
revoke all on function public.nexora_poll_feed() from public;
grant execute on function public.nexora_vote_poll(uuid,uuid) to authenticated;
grant execute on function public.nexora_poll_feed() to authenticated;
grant select,insert,delete on public.nexora_polls to authenticated;
grant select,insert on public.nexora_poll_options to authenticated;
revoke all on public.nexora_poll_votes from anon,authenticated;
grant select on public.nexora_poll_votes to authenticated;
