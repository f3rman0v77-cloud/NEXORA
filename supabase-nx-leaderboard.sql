-- NEXORA: NX leaderboard (top 100 + current user's global position).
-- Run once in Supabase Dashboard -> SQL Editor.
-- Uses all auth.users so accounts without an initialized wallet are included at the
-- current starting balance (50 NX). No email or auth tokens are exposed.

create or replace function public.nexora_get_leaderboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top_users jsonb;
  v_my_rank bigint;
  v_my_balance numeric(14,2);
  v_total_users bigint;
begin
  if auth.uid() is null then
    raise exception 'Sıralamanı görmək üçün hesaba daxil olmalısan';
  end if;

  with ranked_users as (
    select
      u.id as user_id,
      coalesce(w.balance, 50)::numeric(14,2) as balance,
      coalesce(
        nullif(p.username, ''),
        nullif(u.raw_user_meta_data ->> 'username', ''),
        'istifadəçi'
      ) as username,
      row_number() over (
        order by coalesce(w.balance, 50) desc, u.created_at asc, u.id asc
      ) as position
    from auth.users u
    left join public.nexora_bet_wallets w on w.user_id = u.id
    left join public.nexora_profiles p on p.id = u.id
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'position', position,
          'username', username,
          'balance', balance
        )
        order by position
      ) filter (where position <= 100),
      '[]'::jsonb
    ),
    max(position) filter (where user_id = auth.uid()),
    max(balance) filter (where user_id = auth.uid()),
    count(*)
  into v_top_users, v_my_rank, v_my_balance, v_total_users
  from ranked_users;

  return jsonb_build_object(
    'top_users', v_top_users,
    'my_rank', v_my_rank,
    'my_balance', v_my_balance,
    'total_users', v_total_users
  );
end;
$$;

revoke all on function public.nexora_get_leaderboard() from public, anon;
grant execute on function public.nexora_get_leaderboard() to authenticated;
