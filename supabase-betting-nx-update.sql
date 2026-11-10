-- NEXORA: NX balans qaydaları. Supabase Dashboard -> SQL Editor-da BİR DƏFƏ işlədin.
-- Qayda: hamı 50 NX ilə başlayır; hər gecə 00:00-dan sonra (Bakı vaxtı) +10 NX əlavə olunur.
-- Qeyd: balans istifadəçi saytı açanda yenilənir. Saytı açmadığı günlərin hər biri üçün də +10 NX əlavə olunur.

alter table public.nexora_bet_wallets alter column balance set default 50;

create or replace function public.nexora_get_wallet()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
declare
  w public.nexora_bet_wallets;
  today date := (now() at time zone 'Asia/Baku')::date;
begin
  if auth.uid() is null then raise exception 'Daxil olmalısan'; end if;
  insert into public.nexora_bet_wallets (user_id, balance, last_bonus)
  values (auth.uid(), 50, today) on conflict (user_id) do nothing;
  -- Keçən hər gecə üçün +10 NX
  update public.nexora_bet_wallets
     set balance = balance + 10 * greatest(today - coalesce(last_bonus, today - 1), 0),
         last_bonus = today, updated_at = now()
   where user_id = auth.uid() and (last_bonus is null or last_bonus < today);
  select * into w from public.nexora_bet_wallets where user_id = auth.uid();
  return w;
end $$;

drop function if exists public.nexora_reset_wallet();
create or replace function public.nexora_claim_bonus()
returns public.nexora_bet_wallets
language plpgsql security definer set search_path = public as $$
begin
  return public.nexora_get_wallet();
end $$;

grant execute on function public.nexora_get_wallet(), public.nexora_claim_bonus() to authenticated;

-- İNDİ bütün mövcud istifadəçilərin balansı 50 NX olur (bu gün üçün bonus verilmiş sayılır).
update public.nexora_bet_wallets
   set balance = 50, last_bonus = (now() at time zone 'Asia/Baku')::date, updated_at = now();
