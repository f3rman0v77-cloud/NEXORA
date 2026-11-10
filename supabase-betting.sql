-- NEXORA: virtual (pulsuz) mərc sistemi. Supabase Dashboard -> SQL Editor-da BİR DƏFƏ işlədin.
-- Yalnız virtual NX xalı; real pul yoxdur.

create table if not exists public.nexora_bet_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 1000 check (balance >= 0),
  last_bonus date,
  updated_at timestamptz not null default now()
);

create table if not exists public.nexora_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('single','express')),
  stake numeric(14,2) not null check (stake >= 1),
  status text not null default 'pending' check (status in ('pending','won','lost','void')),
  payout numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.nexora_bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.nexora_bets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fixture_key text not null,
  league_slug text not null,
  event_id text not null,
  home text not null,
  away text not null,
  league_name text not null default '',
  kickoff timestamptz not null,
  market_id text not null,
  selection_id text not null,
  market_name text not null,
  selection_name text not null,
  odd numeric(8,2) not null check (odd >= 1.01 and odd <= 150),
  result text not null default 'pending' check (result in ('pending','won','lost','void')),
  score text
);

create index if not exists nexora_bets_user_idx on public.nexora_bets (user_id, created_at desc);
create index if not exists nexora_bet_legs_bet_idx on public.nexora_bet_legs (bet_id);

alter table public.nexora_bet_wallets enable row level security;
alter table public.nexora_bets enable row level security;
alter table public.nexora_bet_legs enable row level security;

-- Yalnız oxumaq olar; yazma YALNIZ aşağıdakı funksiyalarla (balansı əllə dəyişmək olmasın).
drop policy if exists "NEXORA read own wallet" on public.nexora_bet_wallets;
create policy "NEXORA read own wallet" on public.nexora_bet_wallets for select to authenticated using (user_id = auth.uid());
drop policy if exists "NEXORA read own bets" on public.nexora_bets;
create policy "NEXORA read own bets" on public.nexora_bets for select to authenticated using (user_id = auth.uid());
drop policy if exists "NEXORA read own legs" on public.nexora_bet_legs;
create policy "NEXORA read own legs" on public.nexora_bet_legs for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.nexora_bet_wallets, public.nexora_bets, public.nexora_bet_legs from anon, authenticated;

-- Cüzdanı qaytarır (yoxdursa 1000 NX ilə yaradır).
create or replace function public.nexora_get_wallet()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare w public.nexora_bet_wallets;
begin
  if auth.uid() is null then raise exception 'Daxil olmalısan'; end if;
  insert into public.nexora_bet_wallets (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into w from public.nexora_bet_wallets where user_id = auth.uid();
  return w;
end $$;

-- Mərc qoyur. p_legs: [{key,slug,eid,home,away,league,kickoff,sid,mname,sname,odd}]
create or replace function public.nexora_place_bets(p_mode text, p_stake numeric, p_legs jsonb)
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare
  w public.nexora_bet_wallets; leg jsonb; n int; cost numeric; bid uuid; distinct_keys int;
begin
  if auth.uid() is null then raise exception 'Daxil olmalısan'; end if;
  perform public.nexora_get_wallet();
  n := coalesce(jsonb_array_length(p_legs), 0);
  if p_mode not in ('single','express') then raise exception 'Mərc növü səhvdir'; end if;
  if n < 1 or n > 20 then raise exception 'Kuponda 1-20 seçim olmalıdır'; end if;
  if p_stake is null or p_stake < 1 or p_stake > 100000 then raise exception 'Məbləğ 1 – 100000 NX olmalıdır'; end if;
  if p_mode = 'express' and n < 2 then raise exception 'Express üçün ən az 2 seçim lazımdır'; end if;
  for leg in select * from jsonb_array_elements(p_legs) loop
    if (leg->>'kickoff')::timestamptz <= now() then raise exception 'Oyun artıq başlayıb: % – %', leg->>'home', leg->>'away'; end if;
    if (leg->>'odd')::numeric < 1.01 or (leg->>'odd')::numeric > 150 then raise exception 'Əmsal səhvdir'; end if;
  end loop;
  select count(distinct l->>'key') into distinct_keys from jsonb_array_elements(p_legs) l;
  if p_mode = 'express' and distinct_keys < n then raise exception 'Express üçün hər oyundan yalnız bir seçim ola bilər'; end if;
  cost := case when p_mode = 'express' then p_stake else p_stake * n end;
  select * into w from public.nexora_bet_wallets where user_id = auth.uid() for update;
  if w.balance < cost then raise exception 'Balans kifayət etmir'; end if;
  update public.nexora_bet_wallets set balance = balance - cost, updated_at = now() where user_id = auth.uid();
  if p_mode = 'express' then
    insert into public.nexora_bets (user_id, mode, stake) values (auth.uid(), 'express', p_stake) returning id into bid;
    for leg in select * from jsonb_array_elements(p_legs) loop
      insert into public.nexora_bet_legs (bet_id,user_id,fixture_key,league_slug,event_id,home,away,league_name,kickoff,market_id,selection_id,market_name,selection_name,odd)
      values (bid,auth.uid(),leg->>'key',leg->>'slug',leg->>'eid',leg->>'home',leg->>'away',coalesce(leg->>'league',''),(leg->>'kickoff')::timestamptz,split_part(leg->>'sid',':',1),leg->>'sid',leg->>'mname',leg->>'sname',(leg->>'odd')::numeric);
    end loop;
  else
    for leg in select * from jsonb_array_elements(p_legs) loop
      insert into public.nexora_bets (user_id, mode, stake) values (auth.uid(), 'single', p_stake) returning id into bid;
      insert into public.nexora_bet_legs (bet_id,user_id,fixture_key,league_slug,event_id,home,away,league_name,kickoff,market_id,selection_id,market_name,selection_name,odd)
      values (bid,auth.uid(),leg->>'key',leg->>'slug',leg->>'eid',leg->>'home',leg->>'away',coalesce(leg->>'league',''),(leg->>'kickoff')::timestamptz,split_part(leg->>'sid',':',1),leg->>'sid',leg->>'mname',leg->>'sname',(leg->>'odd')::numeric);
    end loop;
  end if;
  select * into w from public.nexora_bet_wallets where user_id = auth.uid();
  return w;
end $$;

-- Mərci yekunlaşdırır. p_results: [{leg_id, result: won|lost|void, score}]
create or replace function public.nexora_settle_bet(p_bet_id uuid, p_results jsonb)
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare
  b public.nexora_bets; r jsonb; w public.nexora_bet_wallets; pending_left int; lost_any boolean; won_any boolean; mult numeric; pay numeric;
begin
  if auth.uid() is null then raise exception 'Daxil olmalısan'; end if;
  select * into b from public.nexora_bets where id = p_bet_id and user_id = auth.uid() for update;
  if not found then raise exception 'Mərc tapılmadı'; end if;
  if b.status <> 'pending' then return public.nexora_get_wallet(); end if;
  for r in select * from jsonb_array_elements(p_results) loop
    if (r->>'result') not in ('won','lost','void') then raise exception 'Nəticə səhvdir'; end if;
    update public.nexora_bet_legs
       set result = r->>'result', score = r->>'score'
     where id = (r->>'leg_id')::uuid and bet_id = b.id and result = 'pending' and kickoff < now();
  end loop;
  select count(*) filter (where result = 'pending'),
         bool_or(result = 'lost'),
         bool_or(result = 'won')
    into pending_left, lost_any, won_any
    from public.nexora_bet_legs where bet_id = b.id;
  if lost_any then
    update public.nexora_bets set status = 'lost' where id = b.id;
  elsif pending_left = 0 then
    select coalesce(exp(sum(ln(odd)) filter (where result = 'won')), 1) into mult from public.nexora_bet_legs where bet_id = b.id;
    pay := round(b.stake * mult, 2);
    update public.nexora_bets set status = case when won_any then 'won' else 'void' end, payout = pay where id = b.id;
    update public.nexora_bet_wallets set balance = balance + pay, updated_at = now() where user_id = auth.uid();
  end if;
  return public.nexora_get_wallet();
end $$;

-- Gündəlik +500 NX bonus.
create or replace function public.nexora_claim_bonus()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare w public.nexora_bet_wallets;
begin
  w := public.nexora_get_wallet();
  if w.last_bonus = current_date then raise exception 'Bu gün bonus artıq alınıb'; end if;
  update public.nexora_bet_wallets set balance = balance + 500, last_bonus = current_date, updated_at = now() where user_id = auth.uid();
  return public.nexora_get_wallet();
end $$;

-- Balans bitibsə və gözləyən mərc yoxdursa 1000 NX-ə bərpa edir.
create or replace function public.nexora_reset_wallet()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare w public.nexora_bet_wallets;
begin
  w := public.nexora_get_wallet();
  if w.balance >= 1 then raise exception 'Balans hələ bitməyib'; end if;
  if exists (select 1 from public.nexora_bets where user_id = auth.uid() and status = 'pending') then raise exception 'Gözləyən mərcin var'; end if;
  update public.nexora_bet_wallets set balance = 1000, updated_at = now() where user_id = auth.uid();
  return public.nexora_get_wallet();
end $$;

revoke all on function public.nexora_get_wallet(), public.nexora_place_bets(text,numeric,jsonb), public.nexora_settle_bet(uuid,jsonb), public.nexora_claim_bonus(), public.nexora_reset_wallet() from public, anon;
grant execute on function public.nexora_get_wallet(), public.nexora_place_bets(text,numeric,jsonb), public.nexora_settle_bet(uuid,jsonb), public.nexora_claim_bonus(), public.nexora_reset_wallet() to authenticated;
