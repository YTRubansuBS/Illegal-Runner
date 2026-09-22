create extension if not exists pgcrypto;

-- Migration amis sécurisée pour Illegal Runner.
-- À exécuter une seule fois dans Supabase SQL Editor.

-- ============================================================
-- AMIS — recherche / demandes sécurisées malgré la RLS
-- ============================================================

create or replace function public.friend_send_request(p_username text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  target_id uuid;
  existing_row public.friends%rowtype;
  new_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select p.id into target_id
  from public.profiles p
  where lower(trim(p.username)) = lower(trim(coalesce(p_username,'')))
  limit 1;

  if target_id is null then raise exception 'PLAYER_NOT_FOUND'; end if;
  if target_id = auth.uid() then raise exception 'SELF_FRIEND'; end if;

  select * into existing_row
  from public.friends f
  where (f.user_id=auth.uid() and f.friend_id=target_id)
     or (f.user_id=target_id and f.friend_id=auth.uid())
  order by f.id desc
  limit 1;

  if found then
    if existing_row.status='accepted' then raise exception 'ALREADY_FRIENDS'; end if;
    if existing_row.status='pending' and existing_row.user_id=auth.uid() then raise exception 'REQUEST_ALREADY_SENT'; end if;
    if existing_row.status='pending' and existing_row.friend_id=auth.uid() then raise exception 'REQUEST_ALREADY_RECEIVED'; end if;
    if existing_row.status='blocked' then raise exception 'BLOCKED'; end if;
    delete from public.friends where id=existing_row.id;
  end if;

  insert into public.friends(user_id,friend_id,status)
  values(auth.uid(),target_id,'pending')
  returning id into new_id;

  return jsonb_build_object('id',new_id,'friend_id',target_id);
end;
$$;

create or replace function public.get_my_friends()
returns table(
  id bigint,
  user_id uuid,
  friend_id uuid,
  status text,
  created_at timestamptz,
  friend_username text,
  friend_best_distance integer
)
language sql
security definer
set search_path=public
as $$
  select f.id,f.user_id,f.friend_id,f.status,f.created_at,
         p.username as friend_username,p.best_distance as friend_best_distance
  from public.friends f
  join public.profiles p
    on p.id = case when f.user_id=auth.uid() then f.friend_id else f.user_id end
  where f.user_id=auth.uid() or f.friend_id=auth.uid()
  order by f.created_at desc;
$$;

create or replace function public.friend_respond(p_request_id bigint,p_accept boolean)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  if p_accept then
    update public.friends set status='accepted'
    where id=p_request_id and friend_id=auth.uid() and status='pending';
  else
    delete from public.friends
    where id=p_request_id and friend_id=auth.uid() and status='pending';
  end if;

  if not found then raise exception 'Friend request not found'; end if;
  return true;
end;
$$;

create or replace function public.friend_remove(p_request_id bigint)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  delete from public.friends
  where id=p_request_id and (user_id=auth.uid() or friend_id=auth.uid());
  if not found then raise exception 'Friend not found'; end if;
  return true;
end;
$$;

revoke all on function public.friend_send_request(text) from public;
revoke all on function public.get_my_friends() from public;
revoke all on function public.friend_respond(bigint,boolean) from public;
revoke all on function public.friend_remove(bigint) from public;

grant execute on function public.friend_send_request(text) to authenticated;
grant execute on function public.get_my_friends() to authenticated;
grant execute on function public.friend_respond(bigint,boolean) to authenticated;
grant execute on function public.friend_remove(bigint) to authenticated;
