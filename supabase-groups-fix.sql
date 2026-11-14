-- NEXORA group creation fix. Run AFTER supabase-groups-migration.sql and supabase-group-logos-migration.sql.
-- Atomic, authenticated creation avoids insert().select() RLS visibility errors.
create or replace function public.nx_create_group(p_name text, p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_owner uuid := auth.uid();
 v_group uuid;
 v_member uuid;
begin
 if v_owner is null then raise exception 'Daxil olmaq lazımdır'; end if;
 if length(trim(coalesce(p_name,''))) not between 2 and 60 then
   raise exception 'Qrup adı 2-60 simvol olmalıdır';
 end if;
 if coalesce(array_length(p_members,1),0) < 1 then
   raise exception 'Ən azı bir üzv seçilməlidir';
 end if;
 if coalesce(array_length(p_members,1),0) > 100 then
   raise exception 'Maksimum 100 üzv seçilə bilər';
 end if;
 -- Group owner is automatically added by nx_group_owner_trigger.
 insert into public.nexora_groups(name,owner_id)
 values(trim(p_name),v_owner)
 returning id into v_group;
 for v_member in select distinct unnest(p_members) loop
   if v_member is null or v_member=v_owner then continue; end if;
   if not exists(select 1 from public.nexora_profiles where id=v_member) then
     raise exception 'Seçilmiş istifadəçi mövcud deyil';
   end if;
   insert into public.nexora_group_members(group_id,user_id)
   values(v_group,v_member) on conflict do nothing;
 end loop;
 return v_group;
end; $$;
revoke all on function public.nx_create_group(text,uuid[]) from public, anon;
grant execute on function public.nx_create_group(text,uuid[]) to authenticated;
notify pgrst, 'reload schema';
