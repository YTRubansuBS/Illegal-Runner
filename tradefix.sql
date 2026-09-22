-- ILLEGAL RUNNER — TRADE FIX
-- À exécuter UNE FOIS dans Supabase SQL Editor.
-- Rend les demandes d'échange visibles automatiquement par les deux joueurs.

create or replace function public.trade_poll_requests()
returns table(
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  status text,
  created_at timestamptz,
  sender_username text,
  receiver_username text,
  session_id uuid
)
language sql
security definer
set search_path=public,auth
set row_security=off
as $$
  select
    r.id,
    r.sender_id,
    r.receiver_id,
    r.status,
    r.created_at,
    coalesce(
      nullif(btrim(ps.username),''),
      nullif(btrim(us.raw_user_meta_data->>'username'),''),
      split_part(coalesce(us.email,''),'@',1),
      'Joueur'
    ) as sender_username,
    coalesce(
      nullif(btrim(pr.username),''),
      nullif(btrim(ur.raw_user_meta_data->>'username'),''),
      split_part(coalesce(ur.email,''),'@',1),
      'Joueur'
    ) as receiver_username,
    s.id as session_id
  from public.trade_requests r
  left join public.trade_sessions s on s.request_id=r.id
  left join public.profiles ps on ps.id=r.sender_id
  left join public.profiles pr on pr.id=r.receiver_id
  left join auth.users us on us.id=r.sender_id
  left join auth.users ur on ur.id=r.receiver_id
  where r.sender_id=auth.uid() or r.receiver_id=auth.uid()
  order by r.created_at desc
  limit 50;
$$;

revoke all on function public.trade_poll_requests() from public,anon;
grant execute on function public.trade_poll_requests() to authenticated;

