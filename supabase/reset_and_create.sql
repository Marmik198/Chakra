-- ============================================================================
-- Chakra: final Supabase schema
-- Run the whole file in Supabase > SQL Editor > New query > Run.
--
-- PART 1 deletes every Chakra table (and ALL data in them) so you start clean.
-- Your login accounts (auth.users) are NOT touched.
-- If this is a brand-new project, PART 1 does nothing harmful and can stay.
-- ============================================================================

-- PART 1: remove old tables
drop table if exists public.collection_entries cascade;
drop table if exists public.collections cascade;
drop table if exists public.notes cascade;
drop table if exists public.investment_txns cascade;
drop table if exists public.investments cascade;
drop table if exists public.splits cascade;
drop table if exists public.money_entries cascade;
drop table if exists public.money_tags cascade;
drop table if exists public.food_log cascade;
drop table if exists public.sleep_logs cascade;
drop table if exists public.metric_entries cascade;
drop table if exists public.metrics cascade;
drop table if exists public.workouts cascade;
drop table if exists public.streak_days cascade;
drop table if exists public.streaks cascade;
drop table if exists public.schedule_changes cascade;
drop table if exists public.schedule_log cascade;
drop table if exists public.schedule_items cascade;
drop table if exists public.task_log cascade;
drop table if exists public.tasks cascade;
drop table if exists public.task_lists cascade;

-- PART 2: create tables
create table public.task_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  list_id uuid references task_lists on delete cascade,
  title text not null,
  cycle text not null default 'daily',
  interval_n int not null default 1,
  weekdays int[] not null default '{}',
  month_day int not null default 1,
  start_date date not null default current_date,
  remind boolean not null default false,
  remind_time time,
  created_at timestamptz not null default now()
);

create table public.task_log (
  task_id uuid not null references tasks on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  primary key (task_id, date)
);

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  start_time time not null,
  end_time time,
  days int[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now()
);

create table public.schedule_log (
  item_id uuid not null references schedule_items on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  primary key (item_id, date)
);

create table public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id uuid references schedule_items on delete set null,
  item_title text,
  date date not null default current_date,
  change text not null,
  created_at timestamptz not null default now()
);

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  start_date date not null default current_date,
  best int not null default 0,
  slips int not null default 0,
  section text not null default 'streaks',
  kind text not null default 'abstain',
  created_at timestamptz not null default now()
);

create table public.streak_days (
  streak_id uuid not null references streaks on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  status text not null check (status in ('clean','slip')),
  note text,
  count int not null default 1,
  primary key (streak_id, date)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  muscle_group text,
  exercise text not null,
  sets jsonb not null,
  created_at timestamptz not null default now()
);

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  unit text,
  section text,
  range_lo numeric,
  range_hi numeric,
  created_at timestamptz not null default now()
);

create table public.metric_entries (
  metric_id uuid not null references metrics on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  value numeric not null,
  primary key (metric_id, date)
);

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  bedtime time not null,
  wake_time time not null,
  minutes int not null,
  quality int,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  meal text,
  item text,
  kcal numeric,
  protein numeric,
  eaten_out boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.money_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense','income')),
  color text not null default '#94A3B8',
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

create table public.money_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('Expense','Income')),
  category text,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  who text,
  amount numeric,
  direction text,
  note text,
  created_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  source text,
  cost numeric not null default 0,
  value numeric not null default 0,
  realized numeric not null default 0,
  units numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.investment_txns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  investment_id uuid references investments on delete cascade,
  date date not null default current_date,
  kind text,
  amount numeric,
  pnl numeric
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text,
  body text,
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  section text,
  name text not null
);

create table public.collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  collection_id uuid references collections on delete cascade,
  date date not null default current_date,
  title text,
  note text,
  rating int,
  cost numeric,
  progress int not null default 0,
  episodes int not null default 0
);

-- PART 3: indexes
create index on public.task_log (user_id, date);
create index on public.schedule_log (user_id, date);
create index on public.streak_days (user_id, date);
create index on public.workouts (user_id, date);
create index on public.metric_entries (user_id, date);
create index on public.food_log (user_id, date);
create index on public.money_entries (user_id, date);
create index on public.collection_entries (collection_id, date);
create index on public.tasks (list_id);
create index on public.streaks (user_id, section);
create index on public.collections (user_id, section);

-- PART 4: row level security. Every row is private to the signed-in user who owns it.
do $$
declare t text;
begin
  foreach t in array array['task_lists','tasks','task_log','schedule_items','schedule_log','schedule_changes','streaks','streak_days','workouts','metrics','metric_entries','sleep_logs','food_log','money_tags','money_entries','splits','investments','investment_txns','notes','collections','collection_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- PART 5: refresh the API so the new tables are visible straight away
notify pgrst, 'reload schema';
