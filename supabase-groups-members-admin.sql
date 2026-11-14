-- Run after the previous NEXORA group migrations.
-- Group administrators can add/remove members only through these checked RPCs.
create or replace function public.nx_group_manage_member(p_group uuid,p_user uuid,p_action text)
returns void language plpgsql security definer set search_path='' as $$
declare owner_id uuid;
begin
 if auth.uid() is null then raise exception 'Daxil olmalısan'; end if;
 select g.owner_id into owner_id from public.nexora_groups g where g.id=p_group;
 if owner_id is null then raise exception 'Qrup tapılmadı'; end if;
 if owner_id<>auth.uid() then raise exception 'Yalnız qrup yaradıcısı üzvləri idarə edə bilər'; end if;
 if p_user is null or p_user=owner_id then raise exception 'Qrup yaradıcısını dəyişmək olmaz'; end if;
 if p_action='add' then
  if not exists(select 1 from public.nexora_profiles where id=p_user) then raise exception 'İstifadəçi tapılmadı'; end if;
  insert into public.nexora_group_members(group_id,user_id) values(p_group,p_user) on conflict do nothing;
 elsif p_action='remove' then
  delete from public.nexora_group_members where group_id=p_group and user_id=p_user;
 else raise exception 'Naməlum əməliyyat'; end if;
end $$;
revoke all on function public.nx_group_manage_member(uuid,uuid,text) from public,anon;
grant execute on function public.nx_group_manage_member(uuid,uuid,text) to authenticated;
notify pgrst,'reload schema';
