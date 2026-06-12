# GymGrinder Next.js

Gym tracking app — daily calendar, exercise logging, photos, routines, progress charts.

## Stack

- Next.js 16 App Router (all pages are Client Components — no SSR needed)
- TypeScript strict
- Tailwind v4
- Zustand for global state (`store/appStore.ts`)
- `@supabase/supabase-js` for data (personal project `wetwdokwnstjidoceoib`)

## Key conventions

- All interactive components: `'use client'` at the top
- State lives in `useAppStore` — don't create local state for things that need to persist across component mounts
- Supabase calls go through `rpc()` from `lib/supabase.ts` (not direct supabase client)
- Tailwind v4: use `bg-[#hex]` for dynamic colors, `@theme inline` in globals.css for tokens
- No comments unless the WHY is non-obvious

## Project structure

```
app/          — Next.js routes (only page.tsx is real content)
components/   — All React components
  calendar/   — CalendarGrid, DayCard, MonthNav
  day-view/   — DayView (full-screen overlay)
  exercises/  — ExerciseSection, Search, Filters, SetsList
  photos/     — PhotoSection, GalleryModal
  routines/   — RoutinesSheet
  progress/   — ProgressModal, ProgressChart
  ui/         — Toast, StatsPanel, RewardModal
lib/          — types.ts, constants.ts, analytics.ts, supabase.ts
store/        — appStore.ts (Zustand)
```

## Supabase RPC functions

- `gym_load_month(p_year, p_month)` → MonthCache
- `gym_set_day(p_year, p_month, p_day, p_state, p_muscle_group)`
- `gym_log_set(p_year, p_month, p_day, p_exercise, p_weight, p_reps, p_group_id)` → id
- `gym_delete_set(p_id)`
- `gym_day_sets(p_year, p_month, p_day)` → ExerciseSet[]
- `gym_day_photos(p_year, p_month, p_day)` → Photo[]
- `gym_log_photo(p_year, p_month, p_day, p_url, p_thumb_url)` → Photo
- `gym_delete_photo(p_id)`
- `gym_search_exercises(p_query, p_limit, p_muscle, p_equipment)` → ExerciseResult[]
- `gym_exercise_names()` → string[]
- `gym_get_pr(p_exercise)` → PRData
- `gym_get_routines()` → Routine[]
- `gym_save_routine(p_name, p_muscle_group, p_exercises)`
- `gym_delete_routine(p_id)`
- `gym_exercise_history(p_exercise)` → ProgressPoint[]
- `gym_autofail_past_days()`, `gym_check_penalty()`

## Dev

```bash
npm run dev    # localhost:3000
npm run build  # production build
npm run lint   # ESLint
```

## Deployment

- Git remote: https://github.com/jrpindave/GymGrinder  (branch: next-rewrite)
- Vercel: personal account (NOT constructora garcia org)
