-- ===============================================================
-- ILLEGAL RUNNER — MIGRATION UNIQUE AMIS + ÉCHANGE + 1V1
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor.
-- Ce script n'ajoute pas updated_at à profiles.
-- ===============================================================

-- ---------------- AMIS ----------------
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

-- ---------------- ÉCHANGE ----------------
-- ============================================================
-- ILLEGAL RUNNER — ÉCHANGES ENTRE AMIS
-- ============================================================

alter table public.inventory drop constraint if exists inventory_item_type_check;
alter table public.inventory add column if not exists quantity integer not null default 1;
alter table public.inventory add constraint inventory_item_type_check
  check (item_type in ('background','character','obstacle','coin'));
update public.inventory set quantity=1 where quantity is null or quantity < 1;

create table if not exists public.trade_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(sender_id <> receiver_id)
);

create table if not exists public.trade_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.trade_requests(id) on delete cascade,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check(status in ('open','countdown','completed','cancelled')),
  offer_a_coins bigint not null default 0 check(offer_a_coins >= 0),
  offer_b_coins bigint not null default 0 check(offer_b_coins >= 0),
  accepted_a boolean not null default false,
  accepted_b boolean not null default false,
  confirmed_a boolean not null default false,
  confirmed_b boolean not null default false,
  countdown_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(user_a <> user_b)
);

create table if not exists public.trade_items (
  id bigint generated by default as identity primary key,
  session_id uuid not null references public.trade_sessions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check(item_type in ('background','character','obstacle','coin')),
  item_id text not null,
  quantity integer not null check(quantity > 0),
  unique(session_id,owner_id,item_type,item_id)
);

create table if not exists public.trade_messages (
  id bigint generated by default as identity primary key,
  session_id uuid not null references public.trade_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check(char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.trade_requests enable row level security;
alter table public.trade_sessions enable row level security;
alter table public.trade_items enable row level security;
alter table public.trade_messages enable row level security;

drop policy if exists trade_requests_select on public.trade_requests;
drop policy if exists trade_sessions_select on public.trade_sessions;
drop policy if exists trade_items_select on public.trade_items;
drop policy if exists trade_messages_select on public.trade_messages;

create policy trade_requests_select on public.trade_requests
for select using (auth.uid()=sender_id or auth.uid()=receiver_id);

create policy trade_sessions_select on public.trade_sessions
for select using (auth.uid()=user_a or auth.uid()=user_b);

create policy trade_items_select on public.trade_items
for select using (
  exists(select 1 from public.trade_sessions s
    where s.id=trade_items.session_id and (s.user_a=auth.uid() or s.user_b=auth.uid()))
);

create policy trade_messages_select on public.trade_messages
for select using (
  exists(select 1 from public.trade_sessions s
    where s.id=trade_messages.session_id and (s.user_a=auth.uid() or s.user_b=auth.uid()))
);



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

create index if not exists trade_requests_participants_idx on public.trade_requests(sender_id,receiver_id,status);
create index if not exists trade_sessions_participants_idx on public.trade_sessions(user_a,user_b,status);
create index if not exists trade_items_session_idx on public.trade_items(session_id,owner_id);
create index if not exists trade_messages_session_idx on public.trade_messages(session_id,created_at);

create or replace function public.trade_create_request(p_friend_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare rid uuid;
begin
  if p_friend_id is null or p_friend_id=auth.uid() then raise exception 'Invalid friend'; end if;
  if not exists (
    select 1 from public.friends f
    where f.status='accepted' and
      ((f.user_id=auth.uid() and f.friend_id=p_friend_id)
       or (f.user_id=p_friend_id and f.friend_id=auth.uid()))
  ) then raise exception 'You are not friends'; end if;
  select id into rid from public.trade_requests
  where status='pending' and
    ((sender_id=auth.uid() and receiver_id=p_friend_id)
     or (sender_id=p_friend_id and receiver_id=auth.uid()))
  order by created_at desc limit 1;
  if rid is not null then return rid; end if;
  insert into public.trade_requests(sender_id,receiver_id) values(auth.uid(),p_friend_id) returning id into rid;
  return rid;
end;
$$;

create or replace function public.trade_respond_request(p_request_id uuid,p_accept boolean)
returns uuid language plpgsql security definer set search_path=public as $$
declare req public.trade_requests%rowtype; sid uuid;
begin
  select * into req from public.trade_requests
  where id=p_request_id and receiver_id=auth.uid() and status='pending' for update;
  if not found then raise exception 'Trade request not found'; end if;
  if not p_accept then
    update public.trade_requests set status='declined',updated_at=now() where id=req.id;
    return null;
  end if;
  insert into public.trade_sessions(request_id,user_a,user_b) values(req.id,req.sender_id,req.receiver_id) returning id into sid;
  update public.trade_requests set status='accepted',updated_at=now() where id=req.id;
  return sid;
end;
$$;

create or replace function public.trade_cancel_request(p_request_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.trade_requests set status='cancelled',updated_at=now()
  where id=p_request_id and sender_id=auth.uid() and status='pending';
  return found;
end;
$$;

create or replace function public.trade_set_offer(p_session_id uuid,p_coins bigint,p_items jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare s public.trade_sessions%rowtype; x jsonb; t text; iid text; qty integer; owned integer;
begin
  if p_coins is null or p_coins < 0 then raise exception 'Invalid coins'; end if;
  select * into s from public.trade_sessions where id=p_session_id and status='open' for update;
  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Trade not available'; end if;
  if (select coins from public.profiles where id=auth.uid()) < p_coins then raise exception 'Not enough coins'; end if;
  if jsonb_typeof(coalesce(p_items,'[]'::jsonb)) <> 'array' then raise exception 'Invalid items'; end if;

  delete from public.trade_items where session_id=p_session_id and owner_id=auth.uid();
  for x in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    t:=x->>'item_type'; iid:=x->>'item_id'; qty:=greatest(0,(x->>'quantity')::integer);
    if qty>0 then
      if t not in ('background','character','obstacle','coin') then raise exception 'Invalid item type'; end if;
      select quantity into owned from public.inventory
      where user_id=auth.uid() and item_type=t and item_id=iid;
      if coalesce(owned,0)<qty then raise exception 'Item quantity not owned'; end if;
      insert into public.trade_items(session_id,owner_id,item_type,item_id,quantity)
      values(p_session_id,auth.uid(),t,iid,qty);
    end if;
  end loop;

  if s.user_a=auth.uid() then
    update public.trade_sessions set offer_a_coins=p_coins,accepted_a=false,accepted_b=false,
      confirmed_a=false,confirmed_b=false,status='open',countdown_started_at=null,updated_at=now()
    where id=p_session_id;
  else
    update public.trade_sessions set offer_b_coins=p_coins,accepted_a=false,accepted_b=false,
      confirmed_a=false,confirmed_b=false,status='open',countdown_started_at=null,updated_at=now()
    where id=p_session_id;
  end if;
  return true;
end;
$$;

create or replace function public.trade_set_accepted(p_session_id uuid,p_accept boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare s public.trade_sessions%rowtype;
begin
  select * into s from public.trade_sessions where id=p_session_id and status='open' for update;
  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Trade not available'; end if;
  if s.user_a=auth.uid() then
    update public.trade_sessions set accepted_a=p_accept,confirmed_a=false,confirmed_b=false,updated_at=now() where id=p_session_id;
  else
    update public.trade_sessions set accepted_b=p_accept,confirmed_a=false,confirmed_b=false,updated_at=now() where id=p_session_id;
  end if;
  return true;
end;
$$;

create or replace function public.trade_set_confirmed(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare s public.trade_sessions%rowtype;
begin
  select * into s from public.trade_sessions where id=p_session_id and status='open' for update;
  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Trade not available'; end if;
  if not (s.accepted_a and s.accepted_b) then raise exception 'Both players must accept first'; end if;
  if s.user_a=auth.uid() then
    update public.trade_sessions set confirmed_a=true,
      status=case when confirmed_b then 'countdown' else 'open' end,
      countdown_started_at=case when confirmed_b then coalesce(countdown_started_at,now()) else null end,updated_at=now()
    where id=p_session_id;
  else
    update public.trade_sessions set confirmed_b=true,
      status=case when confirmed_a then 'countdown' else 'open' end,
      countdown_started_at=case when confirmed_a then coalesce(countdown_started_at,now()) else null end,updated_at=now()
    where id=p_session_id;
  end if;
  return true;
end;
$$;

create or replace function public.trade_cancel(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.trade_sessions set status='cancelled',updated_at=now()
  where id=p_session_id and (user_a=auth.uid() or user_b=auth.uid()) and status in ('open','countdown');
  return found;
end;
$$;

create or replace function public.trade_send_message(p_session_id uuid,p_message text)
returns bigint language plpgsql security definer set search_path=public as $$
declare mid bigint;
begin
  if char_length(trim(coalesce(p_message,'')))<1 or char_length(p_message)>500 then raise exception 'Invalid message'; end if;
  if not exists(select 1 from public.trade_sessions where id=p_session_id and
    (user_a=auth.uid() or user_b=auth.uid()) and status in ('open','countdown')) then
    raise exception 'Trade not available';
  end if;
  insert into public.trade_messages(session_id,sender_id,message)
  values(p_session_id,auth.uid(),trim(p_message)) returning id into mid;
  return mid;
end;
$$;

create or replace function public.trade_finalize(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare s public.trade_sessions%rowtype; it record;
begin
  select * into s from public.trade_sessions where id=p_session_id for update;
  if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Trade not found'; end if;
  if s.status='completed' then return true; end if;
  if s.status<>'countdown' or s.countdown_started_at is null or now()<s.countdown_started_at+interval '5 seconds' then
    raise exception 'Countdown not finished';
  end if;

  perform 1 from public.profiles where id=s.user_a and coins>=s.offer_a_coins for update;
  if not found then raise exception 'Player A no longer has enough coins'; end if;
  perform 1 from public.profiles where id=s.user_b and coins>=s.offer_b_coins for update;
  if not found then raise exception 'Player B no longer has enough coins'; end if;

  update public.profiles set coins=coins-s.offer_a_coins+s.offer_b_coins where id=s.user_a;
  update public.profiles set coins=coins-s.offer_b_coins+s.offer_a_coins where id=s.user_b;

  for it in select * from public.trade_items where session_id=s.id order by id loop
    update public.inventory set quantity=quantity-it.quantity
    where user_id=it.owner_id and item_type=it.item_type and item_id=it.item_id and quantity>=it.quantity;
    if not found then raise exception 'Inventory changed during trade'; end if;

    insert into public.inventory(user_id,item_type,item_id,quantity)
    values(case when it.owner_id=s.user_a then s.user_b else s.user_a end,it.item_type,it.item_id,it.quantity)
    on conflict(user_id,item_type,item_id)
    do update set quantity=public.inventory.quantity+excluded.quantity;
  end loop;

  delete from public.inventory where quantity<=0;
  update public.trade_sessions set status='completed',updated_at=now() where id=s.id;
  update public.trade_requests set status='completed',updated_at=now() where id=s.request_id;
  return true;
end;
$$;

grant execute on function public.trade_create_request(uuid) to authenticated;
grant execute on function public.trade_respond_request(uuid,boolean) to authenticated;
grant execute on function public.trade_cancel_request(uuid) to authenticated;
grant execute on function public.trade_set_offer(uuid,bigint,jsonb) to authenticated;
grant execute on function public.trade_set_accepted(uuid,boolean) to authenticated;
grant execute on function public.trade_set_confirmed(uuid) to authenticated;
grant execute on function public.trade_cancel(uuid) to authenticated;
grant execute on function public.trade_send_message(uuid,text) to authenticated;
grant execute on function public.trade_finalize(uuid) to authenticated;

-- ---------------- 1V1 ----------------
create extension if not exists pgcrypto;

create table if not exists public.duel_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '30 seconds'),
  check(sender_id<>receiver_id)
);

create table if not exists public.duel_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.duel_requests(id) on delete cascade,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'lobby' check(status in ('lobby','bet_amount','final_vote','randomizing','countdown','playing','completed','cancelled')),
  choice_a text check(choice_a is null or choice_a in ('ready','bet')),
  choice_b text check(choice_b is null or choice_b in ('ready','bet')),
  bet_a bigint not null default 0 check(bet_a>=0),
  bet_b bigint not null default 0 check(bet_b>=0),
  final_vote_a text check(final_vote_a is null or final_vote_a in ('bet','nobet','exit')),
  final_vote_b text check(final_vote_b is null or final_vote_b in ('bet','nobet','exit')),
  bet_mode boolean not null default false,
  stakes_locked boolean not null default false,
  phase_deadline timestamptz,
  random_source text,
  started_at timestamptz,
  ended_at timestamptz,
  winner_id uuid references public.profiles(id) on delete set null,
  result_reason text,
  payout bigint not null default 0,
  lives_a integer not null default 0,
  lives_b integer not null default 0,
  distance_a bigint not null default 0,
  distance_b bigint not null default 0,
  heartbeat_a timestamptz,
  heartbeat_b timestamptz,
  action_a text not null default 'run',
  action_b text not null default 'run',
  y_a double precision,
  y_b double precision,
  action_until_a timestamptz,
  action_until_b timestamptz,
  random_seed bigint,
  updated_at timestamptz not null default now(),
  check(user_a<>user_b)
);

alter table public.duel_requests enable row level security;
alter table public.duel_sessions enable row level security;

drop policy if exists duel_requests_select on public.duel_requests;
drop policy if exists duel_sessions_select on public.duel_sessions;
create policy duel_requests_select on public.duel_requests for select using(auth.uid()=sender_id or auth.uid()=receiver_id);
create policy duel_sessions_select on public.duel_sessions for select using(auth.uid()=user_a or auth.uid()=user_b);

alter table public.duel_sessions add column if not exists updated_at timestamptz not null default now();
alter table public.duel_sessions add column if not exists action_a text not null default 'run';
alter table public.duel_sessions add column if not exists action_b text not null default 'run';
alter table public.duel_sessions add column if not exists y_a double precision;
alter table public.duel_sessions add column if not exists y_b double precision;
alter table public.duel_sessions add column if not exists action_until_a timestamptz;
alter table public.duel_sessions add column if not exists action_until_b timestamptz;
alter table public.duel_sessions add column if not exists random_seed bigint;


create index if not exists duel_requests_participants_idx on public.duel_requests(sender_id,receiver_id,status,created_at desc);
create index if not exists duel_sessions_participants_idx on public.duel_sessions(user_a,user_b,status,updated_at desc);

drop function if exists public.duel_tick(uuid,bigint,integer);

create or replace function public.duel_create_request(p_friend_id uuid)
returns uuid language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare rid uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if p_friend_id is null or p_friend_id=auth.uid() then raise exception 'Invalid friend'; end if;
 if not exists(select 1 from public.friends f where f.status='accepted' and ((f.user_id=auth.uid() and f.friend_id=p_friend_id) or (f.user_id=p_friend_id and f.friend_id=auth.uid()))) then raise exception 'You are not friends'; end if;
 update public.duel_requests set status='cancelled',updated_at=now() where status='pending' and expires_at<=now() and (sender_id=auth.uid() or receiver_id=auth.uid());
 select id into rid from public.duel_requests where status='pending' and expires_at>now()
   and ((sender_id=auth.uid() and receiver_id=p_friend_id) or (sender_id=p_friend_id and receiver_id=auth.uid()))
   order by created_at desc limit 1;
 if rid is not null then return rid; end if;
 insert into public.duel_requests(sender_id,receiver_id,expires_at) values(auth.uid(),p_friend_id,now()+interval '30 seconds') returning id into rid;
 return rid;
end;
$$;

create or replace function public.duel_cancel_request(p_request_id uuid)
returns boolean language plpgsql security definer set search_path=public,auth set row_security=off as $$
begin
 update public.duel_requests set status='cancelled',updated_at=now()
 where id=p_request_id and sender_id=auth.uid() and status='pending';
 return found;
end;
$$;

create or replace function public.duel_respond_request(p_request_id uuid,p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path=public,auth
set row_security=off
AS $$
declare
  r public.duel_requests%rowtype;
  sid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into r
  from public.duel_requests
  where id=p_request_id
    and receiver_id=auth.uid()
  for update;

  if not found then
    raise exception 'Duel request not found';
  end if;

  -- Acceptation idempotente : si une première requête a déjà accepté,
  -- on renvoie simplement la session existante.
  if r.status='accepted' then
    select s.id into sid
    from public.duel_sessions s
    where s.request_id=r.id
    limit 1;
    if sid is not null then
      return sid;
    end if;
  end if;

  if r.status<>'pending' then
    raise exception 'Duel request not found';
  end if;

  if r.expires_at<=now() then
    update public.duel_requests
    set status='cancelled',updated_at=now()
    where id=r.id and status='pending';
    raise exception 'Duel request expired';
  end if;

  if not p_accept then
    update public.duel_requests
    set status='declined',updated_at=now()
    where id=r.id;
    return null;
  end if;

  insert into public.duel_sessions(
    request_id,user_a,user_b,status,phase_deadline,heartbeat_a,heartbeat_b
  )
  values(
    r.id,r.sender_id,r.receiver_id,'lobby',
    now()+interval '30 seconds',now(),now()
  )
  on conflict (request_id) do nothing
  returning id into sid;

  if sid is null then
    select s.id into sid
    from public.duel_sessions s
    where s.request_id=r.id
    limit 1;
  end if;

  update public.duel_requests
  set status='accepted',updated_at=now()
  where id=r.id;

  return sid;
end;
$$;

create or replace function public.duel_poll_requests()
returns table(id uuid,sender_id uuid,receiver_id uuid,status text,created_at timestamptz,expires_at timestamptz,sender_username text,receiver_username text,session_id uuid)
language plpgsql security definer set search_path=public,auth set row_security=off as $$
begin
 update public.duel_requests set status='cancelled',updated_at=now() where status='pending' and expires_at<=now() and (sender_id=auth.uid() or receiver_id=auth.uid());
 return query
 select r.id,r.sender_id,r.receiver_id,r.status,r.created_at,r.expires_at,
   coalesce(nullif(btrim(ps.username),''),nullif(btrim(us.raw_user_meta_data->>'username'),''),split_part(coalesce(us.email,''),'@',1),'Joueur'),
   coalesce(nullif(btrim(pr.username),''),nullif(btrim(ur.raw_user_meta_data->>'username'),''),split_part(coalesce(ur.email,''),'@',1),'Joueur'),
   s.id
 from public.duel_requests r
 left join public.duel_sessions s on s.request_id=r.id
 left join public.profiles ps on ps.id=r.sender_id
 left join public.profiles pr on pr.id=r.receiver_id
 left join auth.users us on us.id=r.sender_id
 left join auth.users ur on ur.id=r.receiver_id
 where r.sender_id=auth.uid() or r.receiver_id=auth.uid()
 order by r.created_at desc limit 30;
end;
$$;

create or replace function public.duel_set_choice(p_session_id uuid,p_choice text)
returns boolean language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare s public.duel_sessions%rowtype;
begin
 if p_choice not in ('ready','bet') then raise exception 'Invalid choice'; end if;
 select * into s from public.duel_sessions where id=p_session_id and status='lobby' for update;
 if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not available'; end if;
 if s.user_a=auth.uid() then update public.duel_sessions set choice_a=p_choice,updated_at=now() where id=s.id;
 else update public.duel_sessions set choice_b=p_choice,updated_at=now() where id=s.id; end if;
 return true;
end;
$$;

create or replace function public.duel_set_bet(p_session_id uuid,p_amount bigint)
returns boolean language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare s public.duel_sessions%rowtype; bal bigint;
begin
 if p_amount is null or p_amount<=0 then raise exception 'Invalid bet'; end if;
 select * into s from public.duel_sessions where id=p_session_id and status='bet_amount' for update;
 if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not available'; end if;
 select coins into bal from public.profiles where id=auth.uid();
 if coalesce(bal,0)<p_amount then raise exception 'Not enough coins'; end if;
 if s.user_a=auth.uid() then update public.duel_sessions set bet_a=p_amount,updated_at=now() where id=s.id;
 else update public.duel_sessions set bet_b=p_amount,updated_at=now() where id=s.id; end if;
 return true;
end;
$$;

create or replace function public.duel_set_final_vote(p_session_id uuid,p_vote text)
returns boolean language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare s public.duel_sessions%rowtype;
begin
 if p_vote not in ('bet','nobet','exit') then raise exception 'Invalid vote'; end if;
 select * into s from public.duel_sessions where id=p_session_id and status='final_vote' for update;
 if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not available'; end if;
 if s.user_a=auth.uid() then update public.duel_sessions set final_vote_a=p_vote,updated_at=now() where id=s.id;
 else update public.duel_sessions set final_vote_b=p_vote,updated_at=now() where id=s.id; end if;
 return true;
end;
$$;

create or replace function public.duel_leave(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare s public.duel_sessions%rowtype; winner uuid; lost_bet bigint; winner_bet bigint; prize bigint:=0;
begin
 select * into s from public.duel_sessions where id=p_session_id for update;
 if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not found'; end if;
 if s.status in ('lobby','bet_amount','final_vote','randomizing','countdown') then
   update public.duel_sessions set status='cancelled',ended_at=now(),result_reason='left_before_start',updated_at=now() where id=s.id; return true;
 end if;
 if s.status='playing' then
   winner:=case when s.user_a=auth.uid() then s.user_b else s.user_a end;
   if s.stakes_locked and s.bet_mode then
     if s.user_a=auth.uid() then lost_bet:=s.bet_a; winner_bet:=s.bet_b; else lost_bet:=s.bet_b; winner_bet:=s.bet_a; end if;
     prize:=winner_bet+(lost_bet*2);
     update public.profiles set coins=coins+prize where id=winner;
   end if;
   update public.duel_sessions set status='completed',winner_id=winner,result_reason='forfeit',payout=prize,ended_at=now(),updated_at=now() where id=s.id;
   update public.duel_requests set status='completed',updated_at=now() where id=s.request_id;
 end if;
 return true;
end;
$$;

create or replace function public.duel_tick(p_session_id uuid,p_distance bigint,p_lives integer,p_y double precision default null,p_action text default 'run')
returns jsonb language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare
 s public.duel_sessions%rowtype; now_ts timestamptz:=now(); winner uuid; prize bigint:=0; bal_a bigint; bal_b bigint; clean_action text:=case when p_action in ('run','jump','dash') then p_action else 'run' end;
begin
 select * into s from public.duel_sessions where id=p_session_id for update;
 if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not found'; end if;

 if s.user_a=auth.uid() then
   update public.duel_sessions set distance_a=greatest(0,coalesce(p_distance,0)),lives_a=greatest(0,coalesce(p_lives,0)),heartbeat_a=now_ts,y_a=p_y,action_a=clean_action,action_until_a=case when clean_action='dash' then now_ts+interval '0.65 seconds' else null end,updated_at=now_ts where id=s.id;
 else
   update public.duel_sessions set distance_b=greatest(0,coalesce(p_distance,0)),lives_b=greatest(0,coalesce(p_lives,0)),heartbeat_b=now_ts,y_b=p_y,action_b=clean_action,action_until_b=case when clean_action='dash' then now_ts+interval '0.65 seconds' else null end,updated_at=now_ts where id=s.id;
 end if;
 select * into s from public.duel_sessions where id=s.id for update;

 if s.status='lobby' and s.phase_deadline<=now_ts then
   if s.choice_a is null or s.choice_b is null then
     update public.duel_sessions set status='cancelled',result_reason='lobby_timeout',ended_at=now(),updated_at=now() where id=s.id;
   elsif s.choice_a=s.choice_b and s.choice_a='ready' then
     update public.duel_sessions set status='countdown',bet_mode=false,phase_deadline=now_ts+interval '3 seconds',updated_at=now() where id=s.id;
   elsif s.choice_a=s.choice_b and s.choice_a='bet' then
     update public.duel_sessions set status='bet_amount',phase_deadline=now_ts+interval '30 seconds',updated_at=now() where id=s.id;
   else
     update public.duel_sessions set status='randomizing',random_source='lobby',phase_deadline=now_ts+interval '5 seconds',updated_at=now() where id=s.id;
   end if;
 end if;

 select * into s from public.duel_sessions where id=s.id for update;
 if s.status='randomizing' and s.phase_deadline<=now_ts then
   if s.choice_a is null or s.choice_b is null or (s.random_source='final' and (s.final_vote_a is null or s.final_vote_b is null)) then
     update public.duel_sessions set status='cancelled',result_reason='vote_timeout',ended_at=now(),updated_at=now() where id=s.id;
   elsif random()<0.5 then
     if s.random_source='lobby' then
       update public.duel_sessions set status='bet_amount',random_source=null,phase_deadline=now_ts+interval '30 seconds',updated_at=now() where id=s.id;
     else
       update public.duel_sessions set status='countdown',bet_mode=true,random_source=null,phase_deadline=now_ts+interval '3 seconds',updated_at=now() where id=s.id;
     end if;
   else
     update public.duel_sessions set status='countdown',bet_mode=false,random_source=null,phase_deadline=now_ts+interval '3 seconds',updated_at=now() where id=s.id;
   end if;
 end if;

 select * into s from public.duel_sessions where id=s.id for update;
 if s.status='bet_amount' then
   if s.bet_a>0 and s.bet_b>0 and s.bet_a=s.bet_b then
     update public.duel_sessions set status='final_vote',phase_deadline=now_ts+interval '30 seconds',updated_at=now() where id=s.id;
   elsif s.phase_deadline<=now_ts then
     update public.duel_sessions set status='cancelled',result_reason='bet_timeout',ended_at=now(),updated_at=now() where id=s.id;
   end if;
 end if;

 select * into s from public.duel_sessions where id=s.id for update;
 if s.status='final_vote' then
   if s.final_vote_a='exit' or s.final_vote_b='exit' then
     update public.duel_sessions set status='cancelled',result_reason='vote_exit',ended_at=now(),updated_at=now() where id=s.id;
   elsif s.final_vote_a is not null and s.final_vote_b is not null and s.final_vote_a=s.final_vote_b then
     if s.final_vote_a='bet' and s.bet_a>0 and s.bet_a=s.bet_b then
       update public.duel_sessions set status='countdown',bet_mode=true,phase_deadline=now_ts+interval '3 seconds',updated_at=now() where id=s.id;
     elsif s.final_vote_a='nobet' then
       update public.duel_sessions set status='countdown',bet_mode=false,phase_deadline=now_ts+interval '3 seconds',updated_at=now() where id=s.id;
     end if;
   elsif s.final_vote_a is not null and s.final_vote_b is not null and s.final_vote_a<>s.final_vote_b then
     update public.duel_sessions set status='randomizing',random_source='final',phase_deadline=now_ts+interval '5 seconds',updated_at=now() where id=s.id;
   elsif s.phase_deadline<=now_ts then
     update public.duel_sessions set status='cancelled',result_reason='vote_timeout',ended_at=now(),updated_at=now() where id=s.id;
   end if;
 end if;

 select * into s from public.duel_sessions where id=s.id for update;
 if s.status='countdown' and s.phase_deadline<=now_ts then
   if s.bet_mode and not s.stakes_locked then
     select coins into bal_a from public.profiles where id=s.user_a for update;
     select coins into bal_b from public.profiles where id=s.user_b for update;
     if coalesce(bal_a,0)<s.bet_a or coalesce(bal_b,0)<s.bet_b or s.bet_a<=0 or s.bet_a<>s.bet_b then
       update public.duel_sessions set status='cancelled',result_reason='not_enough_coins',ended_at=now(),updated_at=now() where id=s.id;
     else
       update public.profiles set coins=coins-s.bet_a where id=s.user_a;
       update public.profiles set coins=coins-s.bet_b where id=s.user_b;
       update public.duel_sessions set stakes_locked=true,status='playing',started_at=now(),phase_deadline=null,lives_a=greatest(1,(select lives_level+1 from public.profiles where id=s.user_a)),lives_b=greatest(1,(select lives_level+1 from public.profiles where id=s.user_b)),heartbeat_a=now(),heartbeat_b=now(),updated_at=now() where id=s.id;
     end if;
   elsif not s.bet_mode then
     update public.duel_sessions set status='playing',started_at=now(),phase_deadline=null,lives_a=greatest(1,(select lives_level+1 from public.profiles where id=s.user_a)),lives_b=greatest(1,(select lives_level+1 from public.profiles where id=s.user_b)),heartbeat_a=now(),heartbeat_b=now(),updated_at=now() where id=s.id;
   end if;
 end if;

 select * into s from public.duel_sessions where id=s.id for update;
 if s.status='playing' then
   if s.lives_a<=0 and s.lives_b<=0 then winner:=case when s.distance_a>=s.distance_b then s.user_a else s.user_b end;
   elsif s.lives_a<=0 then winner:=s.user_b;
   elsif s.lives_b<=0 then winner:=s.user_a;
   elsif s.user_a=auth.uid() and s.heartbeat_b<now_ts-interval '10 seconds' then winner:=s.user_a;
   elsif s.user_b=auth.uid() and s.heartbeat_a<now_ts-interval '10 seconds' then winner:=s.user_b;
   else winner:=null;
   end if;
   if winner is not null then
     if s.stakes_locked and s.bet_mode then
       if (s.heartbeat_a is not null and s.heartbeat_a<now_ts-interval '10 seconds') or (s.heartbeat_b is not null and s.heartbeat_b<now_ts-interval '10 seconds') then
         prize:=case when winner=s.user_a then s.bet_a+(s.bet_b*2) else s.bet_b+(s.bet_a*2) end;
       else
         prize:=s.bet_a+s.bet_b;
       end if;
       update public.profiles set coins=coins+prize where id=winner;
     end if;
     update public.duel_sessions set status='completed',winner_id=winner,result_reason=case when s.heartbeat_a<now_ts-interval '10 seconds' or s.heartbeat_b<now_ts-interval '10 seconds' then 'disconnect' else 'defeat' end,payout=prize,ended_at=now(),updated_at=now() where id=s.id;
     update public.duel_requests set status='completed',updated_at=now() where id=s.request_id;
   end if;
 end if;

 select * into s from public.duel_sessions where id=s.id;
 return jsonb_build_object(
   'id',s.id,'request_id',s.request_id,'user_a',s.user_a,'user_b',s.user_b,'status',s.status,
   'choice_a',s.choice_a,'choice_b',s.choice_b,'bet_a',s.bet_a,'bet_b',s.bet_b,
   'final_vote_a',s.final_vote_a,'final_vote_b',s.final_vote_b,'bet_mode',s.bet_mode,
   'stakes_locked',s.stakes_locked,'phase_deadline',s.phase_deadline,'started_at',s.started_at,
   'winner_id',s.winner_id,'result_reason',s.result_reason,'payout',s.payout,
   'lives_a',s.lives_a,'lives_b',s.lives_b,'distance_a',s.distance_a,'distance_b',s.distance_b,
   'character_a',(select coalesce(nullif(btrim(selected_character),''),'runner') from public.profiles where id=s.user_a),
   'character_b',(select coalesce(nullif(btrim(selected_character),''),'runner') from public.profiles where id=s.user_b),
   'random_seed',s.random_seed,
   'action_a',s.action_a,'action_b',s.action_b,'y_a',s.y_a,'y_b',s.y_b,
   'action_until_a',s.action_until_a,'action_until_b',s.action_until_b
 );
end;
$$;

revoke all on function public.duel_create_request(uuid) from public,anon;
revoke all on function public.duel_cancel_request(uuid) from public,anon;
revoke all on function public.duel_respond_request(uuid,boolean) from public,anon;
revoke all on function public.duel_poll_requests() from public,anon;
revoke all on function public.duel_set_choice(uuid,text) from public,anon;
revoke all on function public.duel_set_bet(uuid,bigint) from public,anon;
revoke all on function public.duel_set_final_vote(uuid,text) from public,anon;
revoke all on function public.duel_tick(uuid,bigint,integer,double precision,text) from public,anon;
revoke all on function public.duel_leave(uuid) from public,anon;

grant execute on function public.duel_create_request(uuid) to authenticated;
grant execute on function public.duel_cancel_request(uuid) to authenticated;
grant execute on function public.duel_respond_request(uuid,boolean) to authenticated;
grant execute on function public.duel_poll_requests() to authenticated;
grant execute on function public.duel_set_choice(uuid,text) to authenticated;
grant execute on function public.duel_set_bet(uuid,bigint) to authenticated;
grant execute on function public.duel_set_final_vote(uuid,text) to authenticated;
grant execute on function public.duel_tick(uuid,bigint,integer,double precision,text) to authenticated;
grant execute on function public.duel_leave(uuid) to authenticated;

NOTIFY pgrst, 'reload schema';

NOTIFY pgrst, 'reload schema';
