-- ILLEGAL RUNNER — FRIEND FIX
-- Exécute TOUT ce fichier une seule fois dans Supabase SQL Editor.
-- Ce fichier répare RLS et recrée le système d'amis.

create extension if not exists pgcrypto;

-- ============================================================
-- AMIS — SYSTÈME COMPLET ET SÉCURISÉ
-- ============================================================

alter table public.friends enable row level security;

drop policy if exists friends_select on public.friends;
drop policy if exists friends_insert on public.friends;
drop policy if exists friends_update on public.friends;
drop policy if exists friends_delete on public.friends;

create policy friends_select on public.friends
for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy friends_insert on public.friends
for insert with check (auth.uid() = user_id);

create policy friends_update on public.friends
for update
using (auth.uid() = user_id or auth.uid() = friend_id)
with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy friends_delete on public.friends
for delete using (auth.uid() = user_id or auth.uid() = friend_id);

create or replace function public.friend_send_request(p_username text)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
set row_security=off
as $$
declare
  wanted text := lower(btrim(coalesce(p_username,'')));
  target_id uuid;
  target_username text;
  existing_row public.friends%rowtype;
  new_id bigint;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select p.id, p.username into target_id, target_username
  from public.profiles p
  where lower(btrim(p.username)) = wanted
  limit 1;

  if target_id is null then
    select u.id,
           coalesce(nullif(btrim(u.raw_user_meta_data->>'username'),''),
                    split_part(coalesce(u.email,''),'@',1))
      into target_id, target_username
    from auth.users u
    where lower(btrim(coalesce(
      nullif(btrim(u.raw_user_meta_data->>'username'),''),
      split_part(coalesce(u.email,''),'@',1)
    ))) = wanted
    limit 1;
  end if;

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

  return jsonb_build_object('id',new_id,'friend_id',target_id,'friend_username',target_username);
end;
$$;

create or replace function public.get_my_friends()
returns table(
  id bigint,user_id uuid,friend_id uuid,status text,created_at timestamptz,
  friend_username text,friend_best_distance integer
)
language sql
security definer
set search_path=public,auth
set row_security=off
as $$
  select f.id,f.user_id,f.friend_id,f.status,f.created_at,
         coalesce(nullif(btrim(p.username),''),
                  nullif(btrim(u.raw_user_meta_data->>'username'),''),
                  split_part(coalesce(u.email,''),'@',1),'Joueur'),
         coalesce(p.best_distance,0)
  from public.friends f
  left join public.profiles p
    on p.id=case when f.user_id=auth.uid() then f.friend_id else f.user_id end
  left join auth.users u
    on u.id=case when f.user_id=auth.uid() then f.friend_id else f.user_id end
  where f.user_id=auth.uid() or f.friend_id=auth.uid()
  order by f.created_at desc;
$$;

create or replace function public.friend_respond(p_request_id bigint,p_accept boolean)
returns boolean language plpgsql security definer
set search_path=public,auth set row_security=off as $$
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
returns boolean language plpgsql security definer
set search_path=public,auth set row_security=off as $$
begin
  delete from public.friends
  where id=p_request_id and (user_id=auth.uid() or friend_id=auth.uid());
  if not found then raise exception 'Friend not found'; end if;
  return true;
end;
$$;

revoke all on function public.friend_send_request(text) from public,anon;
revoke all on function public.get_my_friends() from public,anon;
revoke all on function public.friend_respond(bigint,boolean) from public,anon;
revoke all on function public.friend_remove(bigint) from public,anon;

grant execute on function public.friend_send_request(text) to authenticated;
grant execute on function public.get_my_friends() to authenticated;
grant execute on function public.friend_respond(bigint,boolean) to authenticated;
grant execute on function public.friend_remove(bigint) to authenticated;
