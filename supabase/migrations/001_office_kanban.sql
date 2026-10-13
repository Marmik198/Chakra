-- ---------------------------------------------------------------------------
-- 001_office_kanban.sql
-- Adds the Office kanban board. ADDITIVE ONLY: nothing existing is dropped, renamed or rewritten.
-- Safe to run more than once. Run it in Supabase > SQL Editor BEFORE deploying the new app version.
-- ---------------------------------------------------------------------------

-- Part A: catch-up for a change delivered earlier (Leisure watchlists). No effect if you already ran it.
alter table public.collection_entries add column if not exists status text not null default 'done';

-- Part B: Office tables
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
