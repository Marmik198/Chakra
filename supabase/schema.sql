-- Chakra full schema for a BRAND-NEW Supabase project (create only, nothing is dropped).
-- For an existing database use the numbered files in supabase/migrations instead.
-- PART 2: create tables
create table if not exists public.task_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
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

create table if not exists public.task_log (
  task_id uuid not null references tasks on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  primary key (task_id, date)
);

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  start_time time not null,
  end_time time,
  days int[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_log (
  item_id uuid not null references schedule_items on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  primary key (item_id, date)
);

create table if not exists public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id uuid references schedule_items on delete set null,
  item_title text,
  date date not null default current_date,
  change text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  start_date date not null default current_date,
  best int not null default 0,
  slips int not null default 0,
  section text not null default 'streaks',
  kind text not null default 'abstain',
  partial_mode text not null default 'clean' check (partial_mode in ('clean','slip')),
  created_at timestamptz not null default now()
);

create table if not exists public.streak_days (
  streak_id uuid not null references streaks on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  status text not null check (status in ('clean','slip')),
  note text,
  count int not null default 1,
  primary key (streak_id, date)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  muscle_group text,
  exercise text not null,
  sets jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  unit text,
  section text,
  range_lo numeric,
  range_hi numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.metric_entries (
  metric_id uuid not null references metrics on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  value numeric not null,
  primary key (metric_id, date)
);

create table if not exists public.sleep_logs (
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

create table if not exists public.food_log (
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

create table if not exists public.money_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense','income')),
  color text not null default '#94A3B8',
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

create table if not exists public.money_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('Expense','Income')),
  category text,
  amount numeric not null,
  note text,
  source text not null default 'UPI',
  created_at timestamptz not null default now()
);

create table if not exists public.splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  who text,
  amount numeric,
  direction text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
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

create table if not exists public.investment_txns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  investment_id uuid references investments on delete cascade,
  date date not null default current_date,
  kind text,
  amount numeric,
  pnl numeric
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text,
  body text,
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  section text,
  name text not null,
  position int not null default 0
);

create table if not exists public.collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  collection_id uuid references collections on delete cascade,
  date date not null default current_date,
  title text,
  note text,
  rating int,
  cost numeric,
  progress int not null default 0,
  episodes int not null default 0,
  status text not null default 'done'
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


-- Office kanban

create table if not exists public.office_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color text not null default '#94A3B8',
  position int not null default 0,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.office_envs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color text not null default '#94A3B8',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.office_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  notes text,
  column_id uuid not null references public.office_columns(id) on delete restrict,
  env_id uuid references public.office_envs(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date date,
  position double precision not null default 1000,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.office_task_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  task_id uuid not null references public.office_tasks(id) on delete cascade,
  kind text not null check (kind in ('created','status','environment')),
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

-- Part C: indexes
create index if not exists office_columns_user_idx on public.office_columns (user_id, position);
create index if not exists office_envs_user_idx on public.office_envs (user_id, position);
create index if not exists office_tasks_board_idx on public.office_tasks (user_id, column_id, position);
create index if not exists office_tasks_env_idx on public.office_tasks (user_id, env_id);
create index if not exists office_events_user_idx on public.office_task_events (user_id, created_at desc);
create index if not exists office_events_task_idx on public.office_task_events (task_id, created_at desc);

-- Part D: row level security (each user sees only their own rows)
alter table public.office_columns enable row level security;
alter table public.office_envs enable row level security;
alter table public.office_tasks enable row level security;
alter table public.office_task_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array['office_columns','office_envs','office_tasks','office_task_events'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'own rows') then
      execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    end if;
  end loop;
end $$;

-- Part E: record that this migration ran (no policies on purpose, so the app itself cannot read it)
create table if not exists public.app_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.app_migrations enable row level security;
insert into public.app_migrations (name) values ('001_office_kanban') on conflict (name) do nothing;

notify pgrst, 'reload schema';

-- Result: lists the migrations applied so far
select name, applied_at from public.app_migrations order by applied_at;
