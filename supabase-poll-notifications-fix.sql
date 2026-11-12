-- NEXORA: səs və şərh trigger-ində NEW sahələrinin təhlükəsiz oxunması
create or replace function public.nexora_poll_event_notice()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; actor_id uuid; actor_name text; comment_body text;
begin
  -- NEW qeydi cədvələ görə fərqlidir: votes.user_id, comments.author_id.
  if tg_table_name = 'nexora_poll_votes' then
    actor_id := new.user_id;
  elsif tg_table_name = 'nexora_poll_comments' then
    actor_id := new.author_id;
    comment_body := new.body;
  else
    return new;
  end if;

  select p.author_id into owner_id
  from public.nexora_polls p where p.id = new.poll_id;
  if owner_id is null or owner_id = actor_id then return new; end if;

  select p.username into actor_name
  from public.nexora_profiles p where p.id = actor_id;

  insert into public.nexora_notifications
    (recipient_id, actor_id, kind, entity_id, message)
  values
    (owner_id, actor_id,
     case when tg_table_name = 'nexora_poll_votes' then 'poll_vote' else 'poll_comment' end,
     'poll:' || new.poll_id::text,
     case when tg_table_name = 'nexora_poll_votes'
       then '@' || coalesce(actor_name, 'istifadeci') || ' anketinə səs verdi.'
       else '@' || coalesce(actor_name, 'istifadeci') || ' anketinə şərh yazdı: ' || left(coalesce(comment_body,''),160)
     end);
  return new;
end; $$;
