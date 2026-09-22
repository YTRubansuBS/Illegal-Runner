-- ILLEGAL RUNNER — FRIENDS FIX
-- Permet de rechercher un joueur par pseudo et de l'ajouter malgré la RLS.
-- À exécuter une seule fois dans Supabase > SQL Editor.

create or replace function public.add_friend_by_username(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target_id uuid;
  target_name text;
  already boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  p_username := trim(p_username);
  if p_username = '' then raise exception 'Pseudo vide'; end if;

  select id, username into target_id, target_name
  from public.profiles
  where lower(username) = lower(p_username)
  limit 1;

  if target_id is null then raise exception 'Joueur introuvable'; end if;
  if target_id = uid then raise exception 'Impossible de t''ajouter toi-même'; end if;

  select exists(
    select 1 from public.friends
    where user_id = uid and friend_id = target_id
  ) into already;

  if already then
    return jsonb_build_object('ok',true,'already',true,'username',target_name);
  end if;

  insert into public.friends(user_id,friend_id,status)
  values(uid,target_id,'accepted')
  on conflict (user_id,friend_id) do update set status='accepted';

  return jsonb_build_object('ok',true,'already',false,'username',target_name);
end;
$$;

revoke all on function public.add_friend_by_username(text) from public;
grant execute on function public.add_friend_by_username(text) to authenticated;
