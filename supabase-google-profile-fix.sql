-- NEXORA: allow each signed-in user to create their own social profile row.
-- Required for Google OAuth accounts whose auth.users row exists but
-- public.nexora_profiles row was never created.
alter table public.nexora_profiles enable row level security;

drop policy if exists "NEXORA users insert own profile" on public.nexora_profiles;
create policy "NEXORA users insert own profile"
  on public.nexora_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Keep profile updates restricted to the owner.
drop policy if exists "NEXORA users update own profile" on public.nexora_profiles;
create policy "NEXORA users update own profile"
  on public.nexora_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
