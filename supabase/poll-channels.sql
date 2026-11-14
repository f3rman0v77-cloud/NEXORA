-- NEXORA poll channels. Run AFTER supabase-betting.sql and supabase/poll-duration-nx-fees.sql.
create table if not exists public.nexora_poll_channels(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 editor_id uuid references auth.users(id) on delete set null,
 name text not null check(length(trim(name)) between 3 and 70),
 description text not null default '' check(length(description)<=500),
 created_at timestamptz not null default now(),
 check(editor_id is distinct from owner_id)
);
create table if not exists public.nexora_poll_channel_follows(
 channel_id uuid not null references public.nexora_poll_channels(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(channel_id,user_id)
);
create table if not exists public.nexora_channel_polls(
 id uuid primary key default gen_random_uuid(),
 channel_id uuid not null references public.nexora_poll_channels(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 question text not null check(length(trim(question)) between 5 and 280),
 ends_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table if not exists public.nexora_channel_poll_options(
 id uuid primary key default gen_random_uuid(),
 poll_id uuid not null references public.nexora_channel_polls(id) on delete cascade,
 label text not null check(length(trim(label)) between 1 and 100),
 position int not null check(position between 0 and 5),
 unique(poll_id,position),unique(poll_id,id)
);
create table if not exists public.nexora_channel_poll_votes(
 poll_id uuid not null references public.nexora_channel_polls(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 option_id uuid not null,
 primary key(poll_id,user_id),
 foreign key(poll_id,option_id) references public.nexora_channel_poll_options(poll_id,id) on delete cascade
);
create table if not exists public.nexora_channel_poll_likes(
 poll_id uuid not null references public.nexora_channel_polls(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(poll_id,user_id)
);
create table if not exists public.nexora_channel_poll_comments(
 id uuid primary key default gen_random_uuid(),
 poll_id uuid not null references public.nexora_channel_polls(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists nx_channel_polls_idx on public.nexora_channel_polls(channel_id,created_at desc);
create index if not exists nx_channel_comments_idx on public.nexora_channel_poll_comments(poll_id,created_at);
alter table public.nexora_poll_channels enable row level security;
alter table public.nexora_poll_channel_follows enable row level security;
alter table public.nexora_channel_polls enable row level security;
alter table public.nexora_channel_poll_options enable row level security;
alter table public.nexora_channel_poll_votes enable row level security;
alter table public.nexora_channel_poll_likes enable row level security;
alter table public.nexora_channel_poll_comments enable row level security;
revoke insert,update,delete on public.nexora_poll_channels,public.nexora_channel_polls,public.nexora_channel_poll_options,public.nexora_channel_poll_votes from authenticated,anon;
revoke insert,update,delete on public.nexora_poll_channel_follows,public.nexora_channel_poll_likes,public.nexora_channel_poll_comments from authenticated,anon;
grant select on public.nexora_poll_channels,public.nexora_poll_channel_follows,public.nexora_channel_polls,public.nexora_channel_poll_options,public.nexora_channel_poll_votes,public.nexora_channel_poll_likes,public.nexora_channel_poll_comments to authenticated;
create policy nx_pc_read on public.nexora_poll_channels for select to authenticated using(true);
create policy nx_pcf_read on public.nexora_poll_channel_follows for select to authenticated using(true);
create policy nx_cp_read on public.nexora_channel_polls for select to authenticated using(true);
create policy nx_cpo_read on public.nexora_channel_poll_options for select to authenticated using(true);
create policy nx_cpv_read on public.nexora_channel_poll_votes for select to authenticated using(user_id=auth.uid());
create policy nx_cpl_read on public.nexora_channel_poll_likes for select to authenticated using(user_id=auth.uid());
create policy nx_cpc_read on public.nexora_channel_poll_comments for select to authenticated using(true);

create or replace function public.nx_channel_create(p_name text,p_description text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; is_admin boolean;
begin
 if auth.uid() is null then raise exception 'Giriş tələb olunur';end if;
 if length(trim(coalesce(p_name,''))) not between 3 and 70 or length(coalesce(p_description,''))>500 then raise exception 'Kanal adı və ya təsviri yanlışdır';end if;
 select exists(select 1 from public.nexora_admins where user_id=auth.uid()) into is_admin;
 if not is_admin then
  insert into public.nexora_bet_wallets(user_id,balance,last_bonus) values(auth.uid(),50,(now() at time zone 'Asia/Baku')::date) on conflict(user_id) do nothing;
  update public.nexora_bet_wallets set balance=balance-100,updated_at=now() where user_id=auth.uid() and balance>=100;
  if not found then raise exception 'Kanal yaratmaq üçün 100 NX lazımdır';end if;
 end if;
 insert into public.nexora_poll_channels(owner_id,name,description) values(auth.uid(),trim(p_name),coalesce(p_description,'')) returning id into cid;
 insert into public.nexora_poll_channel_follows(channel_id,user_id) values(cid,auth.uid());
 return cid;
end $$;
create or replace function public.nx_channel_follow(p_channel uuid,p_follow boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Giriş tələb olunur';end if;
 if p_follow then
  insert into public.nexora_poll_channel_follows(channel_id,user_id) values(p_channel,auth.uid()) on conflict do nothing;
 else
  if exists(select 1 from public.nexora_poll_channels where id=p_channel and owner_id=auth.uid()) then raise exception 'Kanal sahibi izləmədən çıxa bilməz';end if;
  delete from public.nexora_poll_channel_follows where channel_id=p_channel and user_id=auth.uid();
 end if;
end $$;
create or replace function public.nx_channel_set_editor(p_channel uuid,p_editor uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.nexora_poll_channels where id=p_channel and owner_id=auth.uid()) then raise exception 'Yalnız kanal sahibi idarəçi seçə bilər';end if;
 if p_editor=auth.uid() then raise exception 'Özünü əlavə idarəçi seçə bilməzsən';end if;
 if p_editor is not null and not exists(select 1 from public.nexora_poll_channel_follows where channel_id=p_channel and user_id=p_editor) then raise exception 'İdarəçi kanalı izləməlidir';end if;
 update public.nexora_poll_channels set editor_id=p_editor where id=p_channel;
end $$;
create or replace function public.nx_channel_create_poll(p_channel uuid,p_question text,p_options text[],p_hours int)
returns uuid language plpgsql security definer set search_path='' as $$
declare pid uuid; opt text; idx int:=0;
begin
 if not exists(select 1 from public.nexora_poll_channels where id=p_channel and (owner_id=auth.uid() or editor_id=auth.uid())) then raise exception 'Bu kanalda anket paylaşmaq icazən yoxdur';end if;
 if p_hours<1 or p_hours>720 then raise exception 'Müddət 1–720 saat olmalıdır';end if;
 if length(trim(coalesce(p_question,''))) not between 5 and 280 then raise exception 'Sual 5–280 simvol olmalıdır';end if;
 if array_length(p_options,1) not between 2 and 6 or exists(select 1 from unnest(p_options) x where length(trim(coalesce(x,''))) not between 1 and 100) or (select count(distinct lower(trim(x))) from unnest(p_options) x)<>array_length(p_options,1) then raise exception '2–6 fərqli cavab variantı lazımdır';end if;
 insert into public.nexora_channel_polls(channel_id,author_id,question,ends_at) values(p_channel,auth.uid(),trim(p_question),now()+make_interval(hours=>p_hours)) returning id into pid;
 foreach opt in array p_options loop
  insert into public.nexora_channel_poll_options(poll_id,label,position) values(pid,trim(opt),idx);idx:=idx+1;
 end loop;
 return pid;
end $$;
create or replace function public.nx_channel_vote(p_poll uuid,p_option uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.nexora_channel_polls p join public.nexora_poll_channel_follows f on f.channel_id=p.channel_id and f.user_id=auth.uid() where p.id=p_poll and p.ends_at>now()) then raise exception 'Anket bitib və ya kanalı izləmirsən';end if;
 if not exists(select 1 from public.nexora_channel_poll_options where poll_id=p_poll and id=p_option) then raise exception 'Yanlış cavab';end if;
 insert into public.nexora_channel_poll_votes(poll_id,user_id,option_id) values(p_poll,auth.uid(),p_option) on conflict(poll_id,user_id) do update set option_id=excluded.option_id;
end $$;
create or replace function public.nx_channel_like(p_poll uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.nexora_channel_polls p join public.nexora_poll_channel_follows f on f.channel_id=p.channel_id and f.user_id=auth.uid() where p.id=p_poll) then raise exception 'Əvvəl kanalı izlə';end if;
 if exists(select 1 from public.nexora_channel_poll_likes where poll_id=p_poll and user_id=auth.uid()) then
  delete from public.nexora_channel_poll_likes where poll_id=p_poll and user_id=auth.uid();return false;
 end if;
 insert into public.nexora_channel_poll_likes(poll_id,user_id) values(p_poll,auth.uid());return true;
end $$;
create or replace function public.nx_channel_comment(p_poll uuid,p_body text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.nexora_channel_polls p join public.nexora_poll_channel_follows f on f.channel_id=p.channel_id and f.user_id=auth.uid() where p.id=p_poll) then raise exception 'Əvvəl kanalı izlə';end if;
 if length(trim(coalesce(p_body,''))) not between 1 and 1000 then raise exception 'Şərh 1–1000 simvol olmalıdır';end if;
 insert into public.nexora_channel_poll_comments(poll_id,author_id,body) values(p_poll,auth.uid(),trim(p_body));
end $$;
create or replace function public.nx_channel_feed(p_channel uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'channels',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'description',c.description,'owner_id',c.owner_id,'editor_id',c.editor_id,'owner_name',coalesce(pr.username,'istifadəçi'),'followers',(select count(*) from public.nexora_poll_channel_follows f where f.channel_id=c.id),'following',exists(select 1 from public.nexora_poll_channel_follows f where f.channel_id=c.id and f.user_id=auth.uid())) order by c.created_at desc),'[]'::jsonb) from public.nexora_poll_channels c left join public.nexora_profiles pr on pr.id=c.owner_id),
 'polls',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'channel_id',p.channel_id,'question',p.question,'ends_at',p.ends_at,'created_at',p.created_at,'author_id',p.author_id,'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'votes',(select count(*) from public.nexora_channel_poll_votes v where v.option_id=o.id)) order by o.position),'[]'::jsonb) from public.nexora_channel_poll_options o where o.poll_id=p.id),'my_vote',(select v.option_id from public.nexora_channel_poll_votes v where v.poll_id=p.id and v.user_id=auth.uid()),'likes',(select count(*) from public.nexora_channel_poll_likes l where l.poll_id=p.id),'liked',exists(select 1 from public.nexora_channel_poll_likes l where l.poll_id=p.id and l.user_id=auth.uid()),'comments',(select count(*) from public.nexora_channel_poll_comments m where m.poll_id=p.id)) order by p.created_at desc),'[]'::jsonb) from (select * from public.nexora_channel_polls where p_channel is null or channel_id=p_channel order by created_at desc limit 100) p)
 ) where auth.uid() is not null;
$$;
revoke all on function public.nx_channel_create(text,text),public.nx_channel_follow(uuid,boolean),public.nx_channel_set_editor(uuid,uuid),public.nx_channel_create_poll(uuid,text,text[],int),public.nx_channel_vote(uuid,uuid),public.nx_channel_like(uuid),public.nx_channel_comment(uuid,text),public.nx_channel_feed(uuid) from public,anon;
grant execute on function public.nx_channel_create(text,text),public.nx_channel_follow(uuid,boolean),public.nx_channel_set_editor(uuid,uuid),public.nx_channel_create_poll(uuid,text,text[],int),public.nx_channel_vote(uuid,uuid),public.nx_channel_like(uuid),public.nx_channel_comment(uuid,text),public.nx_channel_feed(uuid) to authenticated;
notify pgrst,'reload schema';
