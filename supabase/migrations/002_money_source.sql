-- ---------------------------------------------------------------------------
-- 002_money_source.sql
-- Adds the payment source (UPI, Cash, DC, CC) to money entries.
-- Every existing entry is set to UPI. New entries default to UPI unless the app sends another source.
-- Additive and alter-only: nothing is dropped or deleted. Safe to run more than once, and safe to run
-- even if you ran an earlier version of this file (it fills any blanks and tightens the column).
-- Run it in Supabase > SQL Editor BEFORE deploying the app version that has the Source dropdown.
-- ---------------------------------------------------------------------------

begin;

-- 1. The column (skipped if it already exists)
alter table public.money_entries add column if not exists source text;

-- 2. Backfill: all existing entries without a source become UPI
update public.money_entries set source = 'UPI' where source is null;

-- 3. From now on a source is always present, and UPI is the default
alter table public.money_entries alter column source set default 'UPI';
alter table public.money_entries alter column source set not null;

-- 4. Speeds up the "by source" charts and reports
create index if not exists money_entries_source_idx on public.money_entries (user_id, source);

-- 5. Record that this migration ran (no policies on purpose, so the app itself cannot read it)
create table if not exists public.app_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.app_migrations enable row level security;
insert into public.app_migrations (name) values ('002_money_source') on conflict (name) do nothing;

commit;

notify pgrst, 'reload schema';

-- Result: how your entries are split by source after the migration
select source, count(*) as entries from public.money_entries group by source order by entries desc;
