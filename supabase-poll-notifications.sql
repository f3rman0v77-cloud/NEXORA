-- NEXORA anket bildirişləri. Supabase SQL Editor-də icra et.
-- Bütün hadisələr serverdə işlənir; brauzerin açıq qalmasına ehtiyac yoxdur.
create or replace function public.nexora_poll_event_notice()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; actor_name text;
begin
 select p.author_id into owner_id from public.nexora_polls p where p.id=new.poll_id;
 if owner_id is null or owner_id = (case when tg_table_name='nexora_poll_votes' then new.user_id else new.author_id end) then return new; end if;
 select coalesce(username,'istifadeci') into actor_name from public.nexora_profiles where id=(case when tg_table_name='nexora_poll_votes' then new.user_id else new.author_id end);
 insert into public.nexora_notifications(recipient_id,actor_id,kind,entity_id,message)
 values(owner_id,case when tg_table_name='nexora_poll_votes' then new.user_id else new.author_id end,
 case when tg_table_name='nexora_poll_votes' then 'poll_vote' else 'poll_comment' end,
 'poll:'||new.poll_id::text,
 case when tg_table_name='nexora_poll_votes' then '@'||coalesce(actor_name,'istifadeci')||' anketinə səs verdi.'
 else '@'||coalesce(actor_name,'istifadeci')||' anketinə şərh yazdı: '||left(new.body,160) end);
 return new;
end; $$;
drop trigger if exists nx_poll_vote_notice on public.nexora_poll_votes;
create trigger nx_poll_vote_notice after insert or update of option_id on public.nexora_poll_votes
for each row execute function public.nexora_poll_event_notice();
drop trigger if exists nx_poll_comment_notice on public.nexora_poll_comments;
create trigger nx_poll_comment_notice after insert on public.nexora_poll_comments
for each row execute function public.nexora_poll_event_notice();

-- Nəticə hər anket üçün yalnız bir dəfə göndərilir.
alter table public.nexora_polls add column if not exists result_notified_at timestamptz;
create or replace function public.nexora_notify_finished_polls()
returns integer language plpgsql security definer set search_path = '' as $$
declare p record; summary text; total_votes bigint; notified integer:=0;
begin
 for p in select id,author_id,question from public.nexora_polls
   where ends_at<=now() and result_notified_at is null
   order by ends_at limit 100 for update skip locked
 loop
   select count(*) into total_votes from public.nexora_poll_votes where poll_id=p.id;
   select string_agg(o.label||' — '||coalesce(v.cnt,0)||' səs ('||
       case when total_votes=0 then '0' else round(100.0*coalesce(v.cnt,0)/total_votes)::text end||'%)', '; ' order by o.position)
   into summary
   from public.nexora_poll_options o
   left join (select option_id,count(*) cnt from public.nexora_poll_votes where poll_id=p.id group by option_id) v on v.option_id=o.id
   where o.poll_id=p.id;
   insert into public.nexora_notifications(recipient_id,actor_id,kind,entity_id,message)
   select distinct v.user_id,p.author_id,'poll_result','poll:'||p.id::text,
      'Anket bitdi: '||left(p.question,120)||'. Nəticə: '||left(coalesce(summary,'Nəticə yoxdur'),850)
   from public.nexora_poll_votes v where v.poll_id=p.id;
   update public.nexora_polls set result_notified_at=now() where id=p.id;
   notified:=notified+1;
 end loop;
 return notified;
end; $$;
revoke all on function public.nexora_notify_finished_polls() from public,anon,authenticated;
-- Supabase-də pg_cron aktiv olmalıdır. İcra hər dəqiqədir.
create extension if not exists pg_cron with schema pg_catalog;
do $$
begin
 if not exists(select 1 from cron.job where jobname='nexora-poll-results-minute') then
  perform cron.schedule('nexora-poll-results-minute','* * * * *','select public.nexora_notify_finished_polls();');
 end if;
end $$;
