# GymGrinder Next.js

Gym tracking app — 3D cube calendar, exercise logging, photos, routines, progress charts, savings-goal reward system.

## Stack

- Next.js 16 App Router, **static export** (`output: 'export'`) — served as static files on GitHub Pages
- TypeScript strict
- Tailwind v4
- Zustand for global state (`store/appStore.ts`)
- `@supabase/supabase-js` for data (personal project `wetwdokwnstjidoceoib`)
- **React Three Fiber** (`@react-three/fiber` + `@react-three/drei` + `three`) for the 3D calendar

## Rendering model

- Every component is a Client Component (`'use client'`). There is no server data fetching.
- The 3D calendar uses WebGL, which only exists in the browser, so it is loaded via
  `next/dynamic` with `ssr: false` in `app/page.tsx`. Everything else prerenders fine as static HTML.

## Key conventions

- All interactive components: `'use client'` at the top
- State lives in `useAppStore` — don't create local state for things that persist across mounts
- Supabase RPCs go through `rpc()` from `lib/supabase.ts`; per-day rows are read with the
  supabase client directly (`supabase.from('gym_sets'|'gym_photos')`), mirroring the original app
- Tailwind v4: use `bg-[#hex]`/inline `style` for dynamic colors
- No comments unless the WHY is non-obvious

## Project structure

```
app/
  page.tsx        — root client component; loads Calendar3D via dynamic ssr:false
components/
  calendar/       — Calendar3D (R3F scene), MonthNav. CalendarGrid/DayCard = old 2D, UNUSED
  day-view/       — DayView (full-screen overlay)
  exercises/      — ExerciseSection, ExerciseSearch, ExerciseFilters, SetsList
  photos/         — PhotoSection, GalleryModal
  routines/       — RoutinesSheet
  progress/       — ProgressModal, ProgressChart (SVG)
  ui/             — Toast, StatsPanel (4-row header), RewardModal
lib/
  types.ts, constants.ts, analytics.ts (pure calc), supabase.ts, cube-textures.ts (canvas textures)
store/
  appStore.ts     — Zustand store + all actions; useCalcStats() derives header stats
```

## Data layer (Supabase)

RPCs via `rpc()`:
- `gym_load_month(p_year, p_month)` → MonthCache `{ days, photo_counts, set_counts, reward, value_per_day }`
- `gym_set_day(p_year, p_month, p_day, p_state, p_muscle_group)`
- `gym_log_set(p_year, p_month, p_day, p_exercise, p_weight, p_reps, p_group_id)` → id
- `gym_delete_set(p_id)`
- `gym_search_exercises(p_query, p_limit, p_muscle, p_equipment)` → ExerciseResult[]
- `gym_get_pr(p_exercise)` → PRData
- `gym_get_routines()` / `gym_save_routine(p_name, p_muscle_group, p_exercises)` / `gym_delete_routine(p_id)`
- `gym_exercise_history(p_exercise)` → ProgressPoint[]
- `gym_save_photo(p_year, p_month, p_day, p_path)` / `gym_delete_photo(p_id)` → storage_path
- `gym_complete_reward(p_name, p_amount)`
- `gym_autofail_past_days()`, `gym_check_penalty()`

Direct table/storage access:
- Day sets/photos: `supabase.from('gym_sets'|'gym_photos').select().eq(year,month,day)`
- Reward create: `supabase.from('gym_reward').insert({ name, target_amount })`
- Photos stored in storage bucket **`gym-photos`** (path `{year}/{month}/{day}/{ts}.{ext}`), column `storage_path`; public URL via `photoPublicUrl()`

## Env vars

- `NEXT_PUBLIC_SUPA_URL`, `NEXT_PUBLIC_SUPA_KEY` (anon/publishable key — safe to expose)
- Local: `.env.local` (gitignored). See `.env.example`.
- CI/Pages: GitHub repo **variables** of the same name, referenced in the deploy workflow.

## Dev

```bash
npm run dev    # localhost:3000
npm run build  # static export → out/
npm run lint   # ESLint
```

## Deployment — GitHub Pages (NOT Vercel)

- Repo: https://github.com/jrpindave/GymGrinder — branch **`next-rewrite`** (HTML legacy app lives on `main`)
- Live: **https://jrpindave.github.io/GymGrinder/**
- `.github/workflows/deploy.yml` builds the static export and deploys to Pages on every push to `next-rewrite`
- Pages is in `workflow` (GitHub Actions) mode; the `github-pages` environment allows branches `main` and `next-rewrite`
- `basePath: '/GymGrinder'` in production (project page lives under `/GymGrinder/`)

> Account ownership: this is a **personal** project. Per the owner's instruction it must NOT live under the
> Constructora Garcia org accounts (Supabase/Vercel). See README "Account migration" before moving anything.
