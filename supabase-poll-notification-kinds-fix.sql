-- Mövcud bildiriş növlərini saxlayaraq anket növlərini əlavə et.
-- CHECK şərtini kataloqdan götürürük; digər məhdudiyyətlərə toxunmuruq.
do $$
declare definition text;
begin
 select pg_get_constraintdef(c.oid) into definition
 from pg_constraint c
 where c.conrelid='public.nexora_notifications'::regclass
   and c.conname='nexora_notifications_kind_check'
   and c.contype='c';
 if definition is null then
   raise exception 'nexora_notifications_kind_check tapılmadı; mövcud cədvəli yoxlayın';
 end if;
 execute 'alter table public.nexora_notifications drop constraint nexora_notifications_kind_check';
 execute 'alter table public.nexora_notifications add constraint nexora_notifications_kind_check check ((' ||
   substring(definition from '^CHECK \((.*)\)$') ||
   ') or kind in (''poll_vote'',''poll_comment'',''poll_result''))';
end $$;
