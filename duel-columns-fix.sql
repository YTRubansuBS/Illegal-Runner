-- CORRECTION 1V1 : colonnes manquantes dans les tables existantes
-- A executer UNE FOIS avant de relancer duelfix.sql.

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.duel_sessions
  add column if not exists updated_at timestamptz not null default now();

create index if not exists duel_sessions_participants_idx
  on public.duel_sessions(user_a,user_b,status,updated_at desc);
