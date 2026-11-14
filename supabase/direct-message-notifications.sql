-- NEXORA: every new direct message creates a durable notification.
-- Run in Supabase SQL Editor as project owner.
-- Keep existing notification kinds; add 'message' without weakening RLS.
do $$
declare c record; definition text;
begin
 for c in select conname,pg_get_constraintdef(oid) as definition
   from pg_constraint where conrelid='public.nexora_notifications'::regclass and contype='c'
 loop
   if c.definition ilike '%kind%' then
     execute format('alter table public.nexora_notifications drop constraint %I',c.conname);
     definition := substring(c.definition from 8 for char_length(c.definition) - 8);
     if definition is null then raise exception 'Cannot safely extend notification kind constraint %',c.conname;end if;
     execute format('alter table public.nexora_notifications add constraint %I check ((%s) or kind = %L)',c.conname,definition,'message');
   end if;
 end loop;
end $$;

create or replace function public.nexora_notify_direct_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor_name text;
begin
 if new.receiver_id is null or new.sender_id is null or new.receiver_id = new.sender_id then return new; end if;
 select username into actor_name from public.nexora_profiles where id=new.sender_id;
 insert into public.nexora_notifications(recipient_id,actor_id,kind,entity_id,message)
 values(new.receiver_id,new.sender_id,'message',new.id::text,
        '@'||coalesce(actor_name,'istifadəçi')||' sənə mesaj göndərdi.');
 return new;
end;
$$;
revoke all on function public.nexora_notify_direct_message() from public, anon, authenticated;
drop trigger if exists nexora_notify_direct_message_insert on public.nexora_messages;
create trigger nexora_notify_direct_message_insert
after insert on public.nexora_messages
for each row execute function public.nexora_notify_direct_message();
