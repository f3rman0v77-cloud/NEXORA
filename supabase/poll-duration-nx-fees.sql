-- NEXORA poll duration fees (virtual NX only). Run once in Supabase SQL Editor.
-- Admin IDs are assigned later by a trusted database administrator, never from client input.
create table if not exists public.nexora_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.nexora_admins enable row level security;
revoke all on public.nexora_admins from anon, authenticated;
-- No client-facing policy: only service_role / SQL administrator may assign admins.

create or replace function public.nexora_charge_poll_creation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  duration_seconds numeric;
  fee numeric := 0;
  admin_user boolean := false;
  wallet_balance numeric;
begin
  if auth.uid() is null or new.author_id is distinct from auth.uid() then
    raise exception 'Anket yalnız öz hesabından yaradıla bilər';
  end if;
  duration_seconds := extract(epoch from (new.ends_at - now()));
  -- Allow 90 seconds of clock/network drift, not arbitrary custom durations.
  if abs(duration_seconds - 3600) <= 90 then fee := 0;
  elsif abs(duration_seconds - 86400) <= 90 then fee := 100;
  elsif abs(duration_seconds - 259200) <= 90 then fee := 250;
  elsif abs(duration_seconds - 604800) <= 90 then fee := 500;
  else raise exception 'Anket müddəti 1 saat, 1 gün, 3 gün və ya 7 gün olmalıdır';
  end if;
  select exists(select 1 from public.nexora_admins where user_id = auth.uid()) into admin_user;
  if admin_user then return new; end if;
  if fee = 0 then return new; end if;
  -- Wallet row may not exist until user opens the NX section.
  insert into public.nexora_bet_wallets(user_id,balance,last_bonus)
  values(auth.uid(),50,(now() at time zone 'Asia/Baku')::date)
  on conflict (user_id) do nothing;
  update public.nexora_bet_wallets
     set balance = balance - fee, updated_at = now()
   where user_id = auth.uid() and balance >= fee
   returning balance into wallet_balance;
  if not found then raise exception 'NX balansın kifayət etmir. Bu anket üçün % NX lazımdır', fee; end if;
  return new;
end;
$$;
drop trigger if exists nexora_charge_poll_creation_trigger on public.nexora_polls;
create trigger nexora_charge_poll_creation_trigger
before insert on public.nexora_polls
for each row execute function public.nexora_charge_poll_creation();

-- Ensure deleting/recreating a poll cannot circumvent a charged duration by editing it.
revoke update on public.nexora_polls from authenticated;
-- Do not allow clients to modify wallet balance directly.
revoke insert, update, delete on public.nexora_bet_wallets from authenticated;
