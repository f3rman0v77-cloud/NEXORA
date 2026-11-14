-- Run once in Supabase SQL Editor. Enables notifications for all group members except sender.
-- Existing direct-message notifications remain unchanged.
do $$
declare c record; expr text;
begin
 for c in select conname,pg_get_constraintdef(oid) as definition
   from pg_constraint where conrelid='public.nexora_notifications'::regclass and contype='c'
 loop
   if c.definition ilike '%kind%' then
     expr := substring(c.definition from 8 for char_length(c.definition)-8);
     if expr is null or expr = '' then raise exception 'Cannot extend constraint %', c.conname; end if;
     execute format('alter table public.nexora_notifications drop constraint %I',c.conname);
     execute format('alter table public.nexora_notifications add constraint %I check ((%s) or kind = %L)',c.conname,expr,'group_message');
   end if;
 end loop;
end $$;

create or replace function public.nexora_notify_group_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare group_name text; sender_name text;
begin
 select name into group_name from public.nexora_groups where id=new.group_id;
 select username into sender_name from public.nexora_profiles where id=new.sender_id;
 insert into public.nexora_notifications(recipient_id,actor_id,kind,entity_id,message)
 select m.user_id,new.sender_id,'group_message','group:'||new.group_id::text,
        coalesce(group_name,'Qrup')||': @'||coalesce(sender_name,'istifadəçi')||' yeni mesaj göndərdi.'
 from public.nexora_group_members m
 where m.group_id=new.group_id and m.user_id<>new.sender_id;
 return new;
end;
$$;
revoke all on function public.nexora_notify_group_message() from public,anon,authenticated;
drop trigger if exists nexora_notify_group_message_insert on public.nexora_group_messages;
create trigger nexora_notify_group_message_insert
after insert on public.nexora_group_messages
for each row execute function public.nexora_notify_group_message();
