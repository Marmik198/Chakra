# Chakra

## Setup
1. Create a project at supabase.com.
2. SQL editor: paste and run `supabase/schema.sql`.
3. Authentication > Email Templates > "Magic Link": make the body contain `{{ .Token }}` so the email shows a 6-digit code.
4. Authentication > Providers: keep Email enabled.
5. Copy `.env.local.example` to `.env.local` and fill in your project URL and anon key (Project Settings > API).
6. `npm install` then `npm run dev` and open http://localhost:3000.

## Deploy
Push to GitHub, import the repo in Vercel, and add the same two environment variables.
Supabase's built-in email sender is rate limited, so add your own SMTP provider (Resend, Brevo) before real use.

## Built
Login (email OTP), Today, Tasks (lists, repeats, reminder times, 14-day log), Fitness (exercise logger, body measurements), Health (checkup numbers with normal ranges), Food, Money (with linked split tracker), Investments (holdings, sales, realized P&L), Streaks, Spiritual, Journal, Leisure, Outings, Goals, Tech board, Notes.
BMI calculator (Fitness) and reminder alerts (banner plus browser notification).
Not built: alerts while the app is fully closed. That needs Web Push with a server job, a good next step.

## Logo
`public/logo.svg` is the master mark (also `app/icon.svg`). `components/Logo.js` renders it in the app, with `mono` for use on coloured backgrounds. Colours: violet #6A4DF4, rose #E5457F, spark #FFD36B.

## Streaks update
Streaks now use daily check-ins and a record of slips. If your database already exists, run `supabase/streak_days.sql` once in the Supabase SQL editor. New setups get it from `schema.sql`.

## Email templates (dark, matches the app)
In Supabase go to Authentication > Emails > Templates (custom SMTP must be on):
1. **Confirm sign up**: paste `supabase/email-templates/confirm_signup.html`. Subject: `{{ .Token }} is your Chakra code`
2. **Magic link or OTP**: paste `supabase/email-templates/magic_link.html`. Subject: `{{ .Token }} is your Chakra code`
The templates only need `{{ .Token }}`. Once deployed you can swap the "C" tile for a hosted PNG of `public/logo.svg`.

## Login page video
`public/login-bg.mp4` loops behind the glass sign-in card, with `public/login-poster.jpg` shown while it loads or when the user prefers reduced motion. Replace both files with your own footage any time (keep it short, muted and under ~2 MB).

## Colours
Neutral charcoal and warm-white surfaces, teal for progress and data, amber for streaks, rose for slips. The violet-to-rose gradient is reserved for the logo and primary buttons.

Section colours: each area has its own icon colour in the navigation (teal Today, blue Tasks, amber Streaks, orange Fitness, and so on). The login background is a looping ridge-line video in `public/login-bg.mp4`.

## Sleep
New Sleep section (bedtime, wake time, total hours, 90-minute cycles, consistency). If your database already exists, run `supabase/sleep_logs.sql` once.

## Android app (Capacitor)
Chakra is wrapped as a real Android app from the same code. You need Android Studio (it includes the SDK and Java), Node 20+, and your `.env.local` filled in (the Supabase values are baked into the app at build time).

1. `npm install`
2. `npm run mobile:add` builds the static app, creates the `android/` project and hardens it (backups off, screen privacy on). Run this once.
3. `npm run assets` generates the launcher icons and splash screen from `assets/`.
4. `npm run mobile:sync` after any code change (rebuilds and copies the web app into Android).
5. `npm run mobile:open` opens Android Studio. Plug in a phone with USB debugging, or start an emulator, and press Run.
6. To share an APK: Android Studio > Build > Build APK(s). For the Play Store: Build > Generate Signed Bundle, and keep your signing key safe.

### What the app does on the phone
- **Reminders** are scheduled on the device with local notifications (next 3 weeks, refreshed each time you open the app). They fire when the app is closed. On Android 12+ allow "Alarms & reminders" for exact times. Without it they can be a few minutes late.
- **Login session** is stored in the Android Keystore (not plain storage).
- **App lock** (switch in the menu) asks for fingerprint, face or screen lock on open and after 30 seconds in the background.
- **Privacy**: no cloud backup of app data, hidden in the recent-apps screen, screenshots blocked (remove the FLAG_SECURE line in `MainActivity.java` to allow them).
- Server side, every row is private to its owner through row level security. The phone only holds the public anon key.

## Logo v2
An eight-petal lotus wheel that brightens clockwise (progress), with a golden spark at the centre. Master file: `public/logo.svg`.

## Trackers (Streaks and Spiritual)
Streaks and Spiritual share one tracker. Each tracker is either an **abstain** streak (days clean, slips are recorded) or a **practice** (done daily, with a running count such as the number of Sanvars). Both show current streak, best streak, total days and notes. If your database already exists, run `supabase/trackers_update.sql` once.

## Money tags
Every income and expense has one tag (predefined, and you can add your own with a colour and description). The Money page shows a hollow ring chart by tag with explanatory tooltips. If your database already exists, run `supabase/money_tags.sql` once. Existing entries with old categories (Food, Bills, Fun) are mapped to the new tags automatically.

## Tabs
Each feature page is split into tabs (for example Money: Overview, Graphs, Tags, Splits). `components/Tabs.js` provides `TabBar` and `Pane`; the last tab used on each page is remembered.

## Latest changes
Schedule section, task repeat fixes, streak counters, goal progress, new Fitness workout log and progress, sleep range, eating-out tracking, investment units. On an existing database run `supabase/final_changes.sql` once.

## Database
Use `supabase/reset_and_create.sql` for an old or half-updated database (it drops the Chakra tables, recreates them and sets security). `schema.sql` is the same without the drop step, for new projects. Older migration files were removed because this replaces them.

## Run as a website
Local: `npm install`, then `npm run dev` (http://localhost:3000). Production on your own machine: `npm run build` then `npm start`.
Public website: push to GitHub, import the repo in Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy. Then in Supabase > Authentication > URL Configuration set the Site URL to your Vercel address.

## Performance
Charts and the reminder/native helpers load lazily, package imports are tree-shaken (`optimizePackageImports`), static files are cached for 30 days, the login video loads late and is skipped on slow or data-saver connections, and reminders check the database every 5 minutes instead of every 30 seconds. `npm run analyze` shows what is in each bundle.

## Speed and feel
All data calls go through `lib/dbproxy.js`: identical reads are cached for 60 seconds (cleared on any save), errors show as pop-up messages, and a thin bar shows loading. Ticks and counters update instantly. Deleting shows an Undo for 6 seconds instead of a confirmation box. `public/sw.js` caches the app shell so Chakra opens offline (saving offline is not supported). The + button adds things from anywhere and the search button (Ctrl+K) jumps to any section. `vercel.json` pins hosting to Mumbai.

## Reports and pagination
`/reports` shows income, spending, ring charts and a trend chart for any date range and downloads a structured PDF (summary, charts, full expense and income logs). The PDF library loads only when you press Download. Money now shows one month at a time with arrows to go back. Lists show 20 items per page and the page controls appear only when there are more than 20.
