-- Run once in Supabase SQL Editor. Client-side checks alone cannot enforce limits.
-- A private recipient accepts one introductory message from a sender who does not follow them.
create or replace function public.nexora_private_message_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recipient_private boolean;
  sender_follows boolean;
begin
  -- Serialize sends by the same sender to the same recipient to prevent concurrent bypass.
  perform pg_advisory_xact_lock(hashtextextended(new.sender_id::text || ':' || new.receiver_id::text, 0));
  select coalesce(p.is_private,false) into recipient_private
  from public.nexora_profiles p where p.id = new.receiver_id;
  if not coalesce(recipient_private,false) then return new; end if;
  select exists (
    select 1 from public.nexora_follows f
    where f.follower_id = new.sender_id and f.following_id = new.receiver_id
  ) into sender_follows;
  if sender_follows then return new; end if;
  if exists (
    select 1 from public.nexora_messages m
    where m.sender_id = new.sender_id and m.receiver_id = new.receiver_id
  ) then
    raise exception 'NX_PRIVATE_LIMIT: Gizli hesaba ikinci mesaj göndərilmir'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists nexora_private_message_guard_trigger on public.nexora_messages;
create trigger nexora_private_message_guard_trigger
before insert on public.nexora_messages
for each row execute function public.nexora_private_message_guard();
