-- Run once in Supabase SQL Editor to allow a channel poll's author to delete it.
-- Security definer is required because direct DELETE is revoked for authenticated users.
create or replace function public.nx_channel_delete_poll(p_poll uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Hesaba daxil ol';
  end if;
  delete from public.nexora_channel_polls
  where id = p_poll and author_id = auth.uid();
  if not found then
    raise exception 'Anket tapılmadı və ya silmək icazən yoxdur';
  end if;
end;
$$;
revoke all on function public.nx_channel_delete_poll(uuid) from public, anon;
grant execute on function public.nx_channel_delete_poll(uuid) to authenticated;
notify pgrst, 'reload schema';
