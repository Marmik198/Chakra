-- ---------------------------------------------------------------------------
-- 003_collections_position.sql
-- Lets Leisure and Outings lists be reordered and renamed without losing their place.
-- Adds one column, `position`, to the lists table and fills it in the current order.
-- Additive and alter-only: nothing is dropped or deleted. Safe to run more than once.
-- Run it in Supabase > SQL Editor BEFORE deploying the app version with "Manage lists".
-- ---------------------------------------------------------------------------

begin;

-- 1. The column (skipped if it already exists)
alter table public.collections add column if not exists position int not null default 0;

-- 2. Fill it in the order you see today. Only sections whose lists have never been ordered are touched,
--    so running this again later cannot undo an order you set in the app.
with ranked as (
  select c.id,
         (row_number() over (
            partition by c.user_id, c.section
            order by case c.name
              when 'Wins' then 1 when 'Learnings' then 2
              when 'Goals' then 1 when 'Future plans' then 2
              when 'Movies' then 1 when 'Web series' then 2 when 'Books' then 3 when 'Hobbies' then 4
              when 'Plans' then 1 when 'Dates' then 1 when 'Trips' then 2
              else 99 end, c.name) - 1)::int as pos
  from public.collections c)
update public.collections c
set position = r.pos
from ranked r
where c.id = r.id
  and not exists (select 1 from public.collections x
                  where x.user_id = c.user_id and x.section = c.section and x.position <> 0);

-- 3. Keeps the lists quick to load in order
create index if not exists collections_user_section_idx on public.collections (user_id, section, position);

-- 4. Record that this migration ran (no policies on purpose, so the app itself cannot read it)
create table if not exists public.app_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.app_migrations enable row level security;
insert into public.app_migrations (name) values ('003_collections_position') on conflict (name) do nothing;

commit;

notify pgrst, 'reload schema';

-- Result: your lists in their saved order
select section, name, position from public.collections order by section, position;
