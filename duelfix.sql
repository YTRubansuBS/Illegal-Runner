-- Exécute tout ce fichier une seule fois dans Supabase SQL Editor.

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
  check(user_a<>user_b)
);

alter table public.duel_requests enable row level security;
alter table public.duel_sessions enable row level security;

drop policy if exists duel_requests_select on public.duel_requests;
drop policy if exists duel_sessions_select on public.duel_sessions;
create policy duel_requests_select on public.duel_requests for select using(auth.uid()=sender_id or auth.uid()=receiver_id);
create policy duel_sessions_select on public.duel_sessions for select using(auth.uid()=user_a or auth.uid()=user_b);

create index if not exists duel_requests_participants_idx on public.duel_requests(sender_id,receiver_id,status,created_at desc);
create index if not exists duel_sessions_participants_idx on public.duel_sessions(user_a,user_b,status,updated_at desc);

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
returns uuid language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare r public.duel_requests%rowtype; sid uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select * into r from public.duel_requests where id=p_request_id and receiver_id=auth.uid() and status='pending' and expires_at>now() for update;
 if not found then raise exception 'Duel request not found'; end if;
 if not p_accept then update public.duel_requests set status='declined',updated_at=now() where id=r.id; return null; end if;
 insert into public.duel_sessions(request_id,user_a,user_b,status,phase_deadline,heartbeat_a,heartbeat_b)
 values(r.id,r.sender_id,r.receiver_id,'lobby',now()+interval '30 seconds',now(),now()) returning id into sid;
 update public.duel_requests set status='accepted',updated_at=now() where id=r.id;
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
 if p_amount is null or p_amount<0 then raise exception 'Invalid bet'; end if;
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
     update public.profiles set coins=coins+prize,updated_at=now() where id=winner;
   end if;
   update public.duel_sessions set status='completed',winner_id=winner,result_reason='forfeit',payout=prize,ended_at=now(),updated_at=now() where id=s.id;
   update public.duel_requests set status='completed',updated_at=now() where id=s.request_id;
 end if;
 return true;
end;
$$;

create or replace function public.duel_tick(p_session_id uuid,p_distance bigint,p_lives integer)
returns jsonb language plpgsql security definer set search_path=public,auth set row_security=off as $$
declare
 s public.duel_sessions%rowtype; now_ts timestamptz:=now(); winner uuid; prize bigint:=0; bal_a bigint; bal_b bigint;
begin
 select * into s from public.duel_sessions where id=p_session_id for update;
 if not found or (s.user_a<>auth.uid() and s.user_b<>auth.uid()) then raise exception 'Duel not found'; end if;

 if s.user_a=auth.uid() then
   update public.duel_sessions set distance_a=greatest(0,coalesce(p_distance,0)),lives_a=greatest(0,coalesce(p_lives,0)),heartbeat_a=now_ts,updated_at=now_ts where id=s.id;
 else
   update public.duel_sessions set distance_b=greatest(0,coalesce(p_distance,0)),lives_b=greatest(0,coalesce(p_lives,0)),heartbeat_b=now_ts,updated_at=now_ts where id=s.id;
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
       update public.profiles set coins=coins-s.bet_a,updated_at=now() where id=s.user_a;
       update public.profiles set coins=coins-s.bet_b,updated_at=now() where id=s.user_b;
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
       prize:=s.bet_a+s.bet_b;
       update public.profiles set coins=coins+prize,updated_at=now() where id=winner;
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
   'lives_a',s.lives_a,'lives_b',s.lives_b,'distance_a',s.distance_a,'distance_b',s.distance_b
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
revoke all on function public.duel_tick(uuid,bigint,integer) from public,anon;
revoke all on function public.duel_leave(uuid) from public,anon;

grant execute on function public.duel_create_request(uuid) to authenticated;
grant execute on function public.duel_cancel_request(uuid) to authenticated;
grant execute on function public.duel_respond_request(uuid,boolean) to authenticated;
grant execute on function public.duel_poll_requests() to authenticated;
grant execute on function public.duel_set_choice(uuid,text) to authenticated;
grant execute on function public.duel_set_bet(uuid,bigint) to authenticated;
grant execute on function public.duel_set_final_vote(uuid,text) to authenticated;
grant execute on function public.duel_tick(uuid,bigint,integer) to authenticated;
grant execute on function public.duel_leave(uuid) to authenticated;

NOTIFY pgrst, 'reload schema';
