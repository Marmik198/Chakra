# Database migrations

Every database change from now on arrives as a numbered file in this folder.

**Rules**
1. Files are additive or alter-only. They never drop a table or column and never delete data.
2. Each file is safe to run more than once.
3. Each file records itself in `public.app_migrations`, so you can always see what has been applied.
4. Run order matters: apply files in number order, and apply the database change BEFORE deploying the app version that needs it.

## 001_office_kanban.sql
**What it changes**
- Adds four tables: `office_columns` (statuses), `office_envs` (environments), `office_tasks` (cards) and `office_task_events` (the history of moves).
- Adds indexes and row level security (each user only sees their own rows).
- Includes the earlier `collection_entries.status` column (Leisure watchlists) as a safe catch-up.
- Touches no existing data.

**Migration plan**
1. (Optional) Take a backup: Supabase dashboard > Database > Backups.
2. Open SQL Editor > New query, paste `001_office_kanban.sql`, click Run. The last query shows the applied migrations.
3. Verify (paste this and run):
   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' and table_name like 'office_%' order by 1;           -- expect 4 rows
   select tablename, policyname from pg_policies where tablename like 'office_%';     -- expect 4 rows
   select column_name from information_schema.columns
   where table_name = 'collection_entries' and column_name = 'status';                -- expect 1 row
   ```
4. Deploy the new app version (push to GitHub for Vercel, or `npm run mobile:sync` for Android).
5. Open Office. The default statuses (Backlog, To do, In progress, In review, Done) and environments (Dev, QA, UAT, Production) are created on first open.

**If something goes wrong**
- Nothing existing is modified, so the rest of the app keeps working.
- If the app is deployed before the migration, only the Office page shows errors. Run the migration and refresh.
- This migration has no rollback script on purpose. To switch the feature off, just stop opening Office. If you ever want the tables removed, ask and I will prepare a separate, reviewed script.

## Fresh installs
For a brand-new Supabase project, run `schema.sql` once instead of the migrations. It already includes everything above.

## 002_money_source.sql
**What it changes**
- Adds the payment source column `money_entries.source` (UPI, Cash, DC, CC) and one index.
- **Every existing entry is set to UPI.** New entries default to UPI too, and the column can no longer be empty.
- Nothing is dropped or deleted. Amounts, dates, tags and notes are not touched.
- Safe to run again, including if you already ran the earlier version of this file.

**Migration plan**
1. Run `001_office_kanban.sql` first if you have not already.
2. (Optional) Take a backup: Supabase dashboard > Database > Backups.
3. Check the starting point (read only):
   ```sql
   select count(*) as total_entries from public.money_entries;
   ```
4. Paste `002_money_source.sql` into SQL Editor and click Run. It runs as one transaction, so it either completes fully or changes nothing. The result table at the end should show a single row: UPI, with your total from step 3.
5. Verify:
   ```sql
   select source, count(*) from public.money_entries group by source;      -- only UPI at first
   select is_nullable, column_default from information_schema.columns
   where table_name = 'money_entries' and column_name = 'source';          -- NO, 'UPI'::text
   select name from public.app_migrations order by applied_at;             -- includes 002_money_source
   ```
6. Deploy the new app version (push to GitHub for Vercel, or `npm run mobile:sync` for Android).
7. After deploying, entries you log with another source (Cash, DC, CC) are saved with it. Old entries stay UPI. To fix an old one, edit it in the app, or ask me for a one-off update for a date range or tag.

**If something goes wrong**
- If the app is deployed first, saving an expense shows an error until the migration is run. Run it and try again.
- The migration is a single transaction, so a failure leaves your data exactly as it was.
- There is no rollback script on purpose. The change only adds a column and fills it with UPI. If you ever want it removed, ask and I will prepare a separate, reviewed script.

## 003_collections_position.sql
**What it changes**
- Adds one column, `collections.position`, so your Leisure and Outings lists keep a fixed order when you rename or move them.
- Fills it in the order you see today (for example Movies, Web series, Books, Hobbies). Your lists, names and entries are not touched.
- Adds one index. Nothing is dropped or deleted.
- Safe to run again. It only fills in sections that have never been ordered, so it cannot undo an order you set in the app.

**Migration plan**
1. Run `001` and `002` first if you have not already.
2. (Optional) Take a backup: Supabase dashboard > Database > Backups.
3. Look at your lists before (read only):
   ```sql
   select section, name from public.collections order by section, name;
   ```
4. Paste `003_collections_position.sql` into SQL Editor and click Run. It runs as one transaction, so it either completes fully or changes nothing. The result table at the end lists your lists with positions 0, 1, 2 and so on for each section.
5. Verify:
   ```sql
   select column_name, is_nullable, column_default from information_schema.columns
   where table_name = 'collections' and column_name = 'position';     -- 1 row, NO, 0
   select name from public.app_migrations order by applied_at;         -- includes 003_collections_position
   ```
6. Deploy the new app version.

**If something goes wrong**
- If the app is deployed first, Leisure and Outings lists show an error until the migration is run. Run it and refresh.
- The migration is a single transaction, so a failure leaves your data exactly as it was.
- Deleting a list in the app also deletes its entries. The app asks you to confirm and shows how many entries are affected.
- There is no rollback script on purpose. The change only adds an ordering column. If you ever want it removed, ask and I will prepare a separate, reviewed script.

## 004_streak_partial_mode.sql
**What it changes**
- Adds one column, `streaks.partial_mode`, so each clean streak can decide what a day you forgot to mark counts as: `clean` (a partial clean day) or `slip` (a missed day).
- Every existing streak is set to `clean`, which is how they already behave. Nothing else is touched.
- Nothing is dropped or deleted. Safe to run again.

**Migration plan**
1. Run `001`, `002` and `003` first if you have not already.
2. (Optional) Take a backup: Supabase dashboard > Database > Backups.
3. Look at your streaks before (read only):
   ```sql
   select section, name, kind from public.streaks order by section, name;
   ```
4. Paste `004_streak_partial_mode.sql` into SQL Editor and click Run. It runs as one transaction, so it either completes fully or changes nothing. The result table lists your streaks with `partial_mode` set to `clean` for all of them.
5. Verify:
   ```sql
   select column_name, is_nullable, column_default from information_schema.columns
   where table_name = 'streaks' and column_name = 'partial_mode';       -- 1 row, NO, 'clean'
   select name from public.app_migrations order by applied_at;           -- includes 004_streak_partial_mode
   ```
6. Deploy the new app version. Then, on a clean streak, use "Unmarked days count as" to switch it to Slip where you want forgotten days to count as failures.

**If something goes wrong**
- If the app is deployed first, changing the setting or adding a clean streak shows an error until the migration is run. Everything else keeps working, and existing streaks behave as before.
- The migration is a single transaction, so a failure leaves your data exactly as it was.
- There is no rollback script on purpose. The change only adds one column with a safe default. If you ever want it removed, ask and I will prepare a separate, reviewed script.
