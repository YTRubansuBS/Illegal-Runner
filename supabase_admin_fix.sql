-- ILLEGAL RUNNER — FIX ADMIN PERSONNALISATION
-- À copier-coller dans Supabase SQL Editor puis Run.
-- Correction : le corps PL/pgSQL utilise bien $$ ... $$.

alter table public.inventory drop constraint if exists inventory_item_type_check;
alter table public.inventory
  add constraint inventory_item_type_check
  check (item_type in ('background','character','obstacle','coin'));

create or replace function public.admin_grant_inventory(
  p_target_user uuid,
  p_item_type text,
  p_item_id text
)
returns boolean
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'rubansu1@illegal-runner.local' then
    raise exception 'Admin access denied';
  end if;

  if p_target_user is null then
    raise exception 'Invalid target user';
  end if;

  if p_item_type not in ('background','character','obstacle','coin') then
    raise exception 'Invalid item type';
  end if;

  if nullif(trim(p_item_id),'') is null then
    raise exception 'Invalid item id';
  end if;

  insert into public.inventory(user_id,item_type,item_id)
  values(p_target_user,p_item_type,p_item_id)
  on conflict (user_id,item_type,item_id) do nothing;

  return true;
end;
$$;

revoke all on function public.admin_grant_inventory(uuid,text,text) from public,anon;
grant execute on function public.admin_grant_inventory(uuid,text,text) to authenticated;
