-- NEXORA: fix accepting private-account follow requests under RLS.
-- Run this once in Supabase SQL Editor.
create or replace function public.nexora_accept_follow_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.nexora_follow_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_request
  from public.nexora_follow_requests
  where id = p_request_id and target_id = auth.uid()
  for update;

  if not found then
    raise exception 'Follow request not found or not authorized';
  end if;

  insert into public.nexora_follows (follower_id, following_id)
  values (v_request.requester_id, v_request.target_id)
  on conflict do nothing;

  delete from public.nexora_follow_requests where id = v_request.id;
  return true;
end;
$$;

revoke all on function public.nexora_accept_follow_request(uuid) from public;
grant execute on function public.nexora_accept_follow_request(uuid) to authenticated;
