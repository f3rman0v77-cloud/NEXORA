-- NEXORA: NX balans qaydaları. Supabase Dashboard -> SQL Editor-da BİR DƏFƏ işlədin.
-- (supabase-betting.sql artıq işlədilibsə, bu fayl onu yeniləyir.)
-- Yeni qayda: yeni istifadəçi 50 NX ilə başlayır, hər gün avtomatik +10 NX alır.

alter table public.nexora_bet_wallets alter column balance set default 50;

create or replace function public.nexora_get_wallet()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare w public.nexora_bet_wallets;
begin
  if auth.uid() is null then raise exception 'Daxil olmalısan'; end if;
  -- İlk dəfə: 50 NX (başlanğıc hədiyyə həmin gün sayılır)
  insert into public.nexora_bet_wallets (user_id, balance, last_bonus)
  values (auth.uid(), 50, current_date) on conflict (user_id) do nothing;
  -- Hər yeni gün üçün avtomatik +10 NX
  update public.nexora_bet_wallets
     set balance = balance + 10, last_bonus = current_date, updated_at = now()
   where user_id = auth.uid() and (last_bonus is null or last_bonus < current_date);
  select * into w from public.nexora_bet_wallets where user_id = auth.uid();
  return w;
end $$;

-- Artıq lazım deyil: qaytarılan balans bərpası və əllə bonus götürmə.
drop function if exists public.nexora_reset_wallet();
create or replace function public.nexora_claim_bonus()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
begin
  return public.nexora_get_wallet(); -- gündəlik +10 NX avtomatik verilir
end $$;

grant execute on function public.nexora_get_wallet(), public.nexora_claim_bonus() to authenticated;

-- İSTƏYƏ BAĞLI: artıq mövcud olan BÜTÜN istifadəçilərin balansını 50 NX-ə qaytarmaq üçün aşağıdakı sətrin işarəsini götürün.
-- update public.nexora_bet_wallets set balance = 50, last_bonus = current_date;
