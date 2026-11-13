-- Execute in Supabase SQL Editor before enabling user blocking in production.
create table if not exists public.nexora_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 constraint nexora_blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists nexora_blocks_blocked_idx on public.nexora_blocks(blocked_id);
alter table public.nexora_blocks enable row level security;
drop policy if exists "Block participants may read" on public.nexora_blocks;
create policy "Block participants may read" on public.nexora_blocks for select to authenticated
 using (auth.uid() = blocker_id or auth.uid() = blocked_id);
drop policy if exists "Users may block" on public.nexora_blocks;
create policy "Users may block" on public.nexora_blocks for insert to authenticated
 with check (auth.uid() = blocker_id);
drop policy if exists "Users may unblock" on public.nexora_blocks;
create policy "Users may unblock" on public.nexora_blocks for delete to authenticated
 using (auth.uid() = blocker_id);

-- Database-level enforcement: blocked users cannot send new messages to each other.
create or replace function public.nexora_block_message_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if exists (
   select 1 from public.nexora_blocks b
   where (b.blocker_id=new.sender_id and b.blocked_id=new.receiver_id)
      or (b.blocker_id=new.receiver_id and b.blocked_id=new.sender_id)
 ) then
   raise exception 'Message blocked' using errcode='42501';
 end if;
 return new;
end; $$;
drop trigger if exists nexora_block_message_guard_trigger on public.nexora_messages;
create trigger nexora_block_message_guard_trigger before insert on public.nexora_messages
 for each row execute function public.nexora_block_message_guard();

-- Blocked relationships cannot be newly followed.
create or replace function public.nexora_block_follow_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from public.nexora_blocks b
  where (b.blocker_id=new.follower_id and b.blocked_id=new.following_id)
     or (b.blocker_id=new.following_id and b.blocked_id=new.follower_id)) then
   raise exception 'Follow blocked' using errcode='42501';
 end if;
 return new;
end; $$;
drop trigger if exists nexora_block_follow_guard_trigger on public.nexora_follows;
create trigger nexora_block_follow_guard_trigger before insert on public.nexora_follows
 for each row execute function public.nexora_block_follow_guard();
