-- NEXORA group messages: authors can delete only their own messages, for everyone.
-- Run in Supabase SQL Editor once.
drop policy if exists "nx group messages delete own" on public.nexora_group_messages;
create policy "nx group messages delete own"
on public.nexora_group_messages for delete to authenticated
using (sender_id = (select auth.uid()) and public.nx_is_group_member(group_id,(select auth.uid())));
grant delete on public.nexora_group_messages to authenticated;
notify pgrst, 'reload schema';
