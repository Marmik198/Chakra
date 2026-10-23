-- ---------------------------------------------------------------------------
-- 004_streak_partial_mode.sql
-- Lets each clean streak choose what an unmarked day counts as: 'clean' (a partial clean day) or 'slip' (a missed day).
-- Adds one column to the streaks table. Every existing streak keeps today's behaviour ('clean').
-- Additive and alter-only: nothing is dropped or deleted. Safe to run more than once.
-- Run it in Supabase > SQL Editor BEFORE deploying the app version with this setting.
-- ---------------------------------------------------------------------------

begin;

-- 1. The column. Existing rows get 'clean', which is how they behave now.
alter table public.streaks add column if not exists partial_mode text not null default 'clean';

-- 2. Only the two allowed values (added once, skipped if it already exists)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'streaks_partial_mode_check') then
    alter table public.streaks add constraint streaks_partial_mode_check check (partial_mode in ('clean', 'slip'));
  end if;
end $$;

-- 3. Record that this migration ran (no policies on purpose, so the app itself cannot read it)
create table if not exists public.app_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.app_migrations enable row level security;
insert into public.app_migrations (name) values ('004_streak_partial_mode') on conflict (name) do nothing;

commit;

notify pgrst, 'reload schema';

-- Result: your streaks and their setting
select section, name, kind, partial_mode from public.streaks order by section, name;
