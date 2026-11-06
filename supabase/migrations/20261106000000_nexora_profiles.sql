-- Supabase username profile index for the Nexora static app.
-- Run this once in Supabase SQL Editor before deploying the username sign-in Edge Function.
create table if not exists public.nexora_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null check (username ~ '^[a-z0-9_.]{3,24}$'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists nexora_profiles_username_lower_key
    on public.nexora_profiles (lower(username));

alter table public.nexora_profiles enable row level security;
revoke all on public.nexora_profiles from anon, authenticated;
grant select, insert, update on public.nexora_profiles to authenticated;

drop policy if exists "Users can read their own Nexora profile" on public.nexora_profiles;
create policy "Users can read their own Nexora profile"
    on public.nexora_profiles for select to authenticated
    using (auth.uid() = id);

drop policy if exists "Users can create their own Nexora profile" on public.nexora_profiles;
create policy "Users can create their own Nexora profile"
    on public.nexora_profiles for insert to authenticated
    with check (auth.uid() = id);

drop policy if exists "Users can update their own Nexora profile" on public.nexora_profiles;
create policy "Users can update their own Nexora profile"
    on public.nexora_profiles for update to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
