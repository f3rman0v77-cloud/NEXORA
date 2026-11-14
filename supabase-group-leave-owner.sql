-- Owner can leave; ownership is transferred to the longest-standing other member.
-- If the group has no other members, the group is deleted.
create or replace function public.nx_leave_group(p_group uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_next uuid;
begin
 if v_user is null then raise exception 'Daxil olmalısan'; end if;
 select owner_id into v_owner from public.nexora_groups where id=p_group for update;
 if v_owner is null then raise exception 'Qrup mövcud deyil'; end if;
 if not exists(select 1 from public.nexora_group_members where group_id=p_group and user_id=v_user) then raise exception 'Qrup üzvü deyilsən'; end if;
 if v_owner=v_user then
  select user_id into v_next from public.nexora_group_members
  where group_id=p_group and user_id<>v_user order by joined_at,user_id limit 1;
  if v_next is null then delete from public.nexora_groups where id=p_group; return; end if;
  update public.nexora_groups set owner_id=v_next where id=p_group;
 end if;
 delete from public.nexora_group_members where group_id=p_group and user_id=v_user;
end $$;
revoke all on function public.nx_leave_group(uuid) from public,anon;
grant execute on function public.nx_leave_group(uuid) to authenticated;
notify pgrst,'reload schema';
