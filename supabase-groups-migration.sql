-- Run in Supabase SQL Editor before enabling NEXORA group chat.
create table if not exists public.nexora_groups (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 2 and 60),
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.nexora_group_members (
 group_id uuid not null references public.nexora_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create table if not exists public.nexora_group_messages (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.nexora_groups(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index if not exists nx_group_members_user_idx on public.nexora_group_members(user_id);
create index if not exists nx_group_messages_recent_idx on public.nexora_group_messages(group_id,created_at desc);
alter table public.nexora_groups enable row level security;
alter table public.nexora_group_members enable row level security;
alter table public.nexora_group_messages enable row level security;

-- SECURITY DEFINER avoids recursive RLS when checking group membership.
create or replace function public.nx_is_group_member(g uuid, u uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.nexora_group_members m where m.group_id=g and m.user_id=u)
$$;
revoke all on function public.nx_is_group_member(uuid,uuid) from public;
grant execute on function public.nx_is_group_member(uuid,uuid) to authenticated;

create or replace function public.nx_group_add_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.nexora_group_members(group_id,user_id) values(new.id,new.owner_id);
 return new;
end; $$;
drop trigger if exists nx_group_owner_trigger on public.nexora_groups;
create trigger nx_group_owner_trigger after insert on public.nexora_groups
for each row execute function public.nx_group_add_owner();

drop policy if exists "nx groups read" on public.nexora_groups;
create policy "nx groups read" on public.nexora_groups for select to authenticated
using (public.nx_is_group_member(id,auth.uid()));
drop policy if exists "nx groups create" on public.nexora_groups;
create policy "nx groups create" on public.nexora_groups for insert to authenticated
with check (owner_id=auth.uid());
drop policy if exists "nx groups delete" on public.nexora_groups;
create policy "nx groups delete" on public.nexora_groups for delete to authenticated
using (owner_id=auth.uid());

drop policy if exists "nx members read" on public.nexora_group_members;
create policy "nx members read" on public.nexora_group_members for select to authenticated
using (public.nx_is_group_member(group_id,auth.uid()));
drop policy if exists "nx members add" on public.nexora_group_members;
create policy "nx members add" on public.nexora_group_members for insert to authenticated
with check (exists(select 1 from public.nexora_groups g where g.id=group_id and g.owner_id=auth.uid()));
drop policy if exists "nx members remove" on public.nexora_group_members;
create policy "nx members remove" on public.nexora_group_members for delete to authenticated
using (
 (user_id=auth.uid() and not exists(select 1 from public.nexora_groups g where g.id=group_id and g.owner_id=user_id))
 or exists(select 1 from public.nexora_groups g where g.id=group_id and g.owner_id=auth.uid() and g.owner_id<>user_id)
);

drop policy if exists "nx group messages read" on public.nexora_group_messages;
create policy "nx group messages read" on public.nexora_group_messages for select to authenticated
using (public.nx_is_group_member(group_id,auth.uid()));
drop policy if exists "nx group messages send" on public.nexora_group_messages;
create policy "nx group messages send" on public.nexora_group_messages for insert to authenticated
with check (sender_id=auth.uid() and public.nx_is_group_member(group_id,auth.uid()));
