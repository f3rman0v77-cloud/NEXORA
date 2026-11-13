-- Run in Supabase SQL Editor. Push subscriptions are private per authenticated user.
create table if not exists public.nexora_push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nexora_push_subscriptions_user_id_idx on public.nexora_push_subscriptions(user_id);
alter table public.nexora_push_subscriptions enable row level security;
revoke all on public.nexora_push_subscriptions from anon;
grant select, insert, update, delete on public.nexora_push_subscriptions to authenticated;
drop policy if exists "push subscriptions own rows" on public.nexora_push_subscriptions;
create policy "push subscriptions own rows" on public.nexora_push_subscriptions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- A trusted server must send Web Push using VAPID; never put private VAPID key in browser code.
