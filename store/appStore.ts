'use client';
import { create } from 'zustand';
import { rpc, supabase } from '@/lib/supabase';
import {
  calcStreak, calcCompletion, calcWeekDone,
  getMotivationalMsg, isWeekend,
} from '@/lib/analytics';
import { WEEK_GOALS } from '@/lib/constants';
import type {
  MonthCache, ExerciseSet, Photo, Routine,
  PRData, Toast,
} from '@/lib/types';

function safeLocalStorage(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

const today = new Date();

interface AppState {
  curYear: number;
  curMonth: number;
  monthCache: MonthCache;
  weeklyGoal: number;

  dayViewOpen: boolean;
  selectedDay: number | null;
  selectedMuscle: string | null;
  dayExercises: ExerciseSet[];
  dayPhotos: Photo[];
  currentPR: PRData | null;
  supersetId: string | null;
  supersetCount: number;

  allRoutines: Routine[];
  routinesSheetOpen: boolean;
  routinesTab: 'apply' | 'save';

  progressModalOpen: boolean;
  progressExercise: string;

  galleryOpen: boolean;
  galleryIndex: number;

  rewardModalOpen: boolean;

  syncStatus: string;
  toast: Toast | null;
}

interface AppActions {
  setWeeklyGoal: (g: number) => void;
  goMonth: (dir: 1 | -1) => void;
  loadMonth: (year: number, month: number) => Promise<void>;

  openDayView: (day: number) => void;
  closeDayView: () => void;
  setSelectedMuscle: (muscle: string | null) => void;
  markDay: (state: 'done' | 'miss' | null) => Promise<void>;

  loadDayData: (year: number, month: number, day: number) => Promise<void>;
  addSet: (exercise: string, weight: number | null, reps: number | null, groupId: string | null) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  toggleSuperset: () => void;
  bumpSuperset: () => void;

  loadRoutines: () => Promise<void>;
  applyRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  saveRoutine: (name: string) => Promise<void>;
  openRoutinesSheet: (tab?: 'apply' | 'save') => void;
  closeRoutinesSheet: () => void;
  switchRoutinesTab: (tab: 'apply' | 'save') => void;

  openProgress: (exercise: string) => void;
  closeProgress: () => void;

  openGallery: (index: number) => void;
  closeGallery: () => void;
  setGalleryIndex: (i: number) => void;
  uploadPhoto: (file: File) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  openReward: () => void;
  closeReward: () => void;
  saveReward: (name: string, cost: number) => Promise<void>;

  showToast: (message: string, color?: string) => void;
  clearToast: () => void;
  setSyncStatus: (s: string) => void;
}

const emptyCache: MonthCache = {
  days: {}, photo_counts: {}, set_counts: {}, reward: null, value_per_day: 0,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  curYear: today.getFullYear(),
  curMonth: today.getMonth(),
  monthCache: emptyCache,
  weeklyGoal: (() => {
    const v = parseInt(safeLocalStorage('gymWeeklyGoal', '4'));
    return WEEK_GOALS.includes(v) ? v : 4;
  })(),

  dayViewOpen: false,
  selectedDay: null,
  selectedMuscle: null,
  dayExercises: [],
  dayPhotos: [],
  currentPR: null,
  supersetId: null,
  supersetCount: 0,

  allRoutines: [],
  routinesSheetOpen: false,
  routinesTab: 'apply',

  progressModalOpen: false,
  progressExercise: '',

  galleryOpen: false,
  galleryIndex: 0,

  rewardModalOpen: false,

  syncStatus: '',
  toast: null,

  setWeeklyGoal: (g) => {
    set({ weeklyGoal: g });
    try { localStorage.setItem('gymWeeklyGoal', String(g)); } catch { /* noop */ }
  },

  goMonth: (dir) => {
    const { curYear, curMonth, loadMonth } = get();
    let y = curYear, m = curMonth + dir;
    if (m > 11) { y++; m = 0; }
    if (m < 0)  { y--; m = 11; }
    loadMonth(y, m);
  },

  loadMonth: async (year, month) => {
    set({ curYear: year, curMonth: month, syncStatus: '⏳ Cargando…' });
    try {
      const data = await rpc<MonthCache>('gym_load_month', { p_year: year, p_month: month + 1 });
      const cache: MonthCache = {
        days:          data?.days          ?? {},
        photo_counts:  data?.photo_counts  ?? {},
        set_counts:    data?.set_counts    ?? {},
        reward:        data?.reward        ?? null,
        value_per_day: data?.value_per_day ?? 0,
      };
      set({ monthCache: cache, syncStatus: '✅ Sincronizado' });

      Promise.all([
        rpc('gym_autofail_past_days'),
        rpc('gym_check_penalty'),
      ]).then(async () => {
        const fresh = await rpc<MonthCache>('gym_load_month', { p_year: year, p_month: month + 1 });
        set({
          monthCache: {
            days:          fresh?.days          ?? {},
            photo_counts:  fresh?.photo_counts  ?? {},
            set_counts:    fresh?.set_counts    ?? {},
            reward:        fresh?.reward        ?? null,
            value_per_day: fresh?.value_per_day ?? 0,
          },
        });
      }).catch(e => console.warn('autofail bg:', e));
    } catch (e) {
      set({ syncStatus: '❌ Sin conexión' });
      get().showToast('Sin conexión — mostrando datos locales', '#ffaa22');
      console.error('loadMonth:', e);
    }
  },

  openDayView: (day) => {
    const { curYear, curMonth, monthCache } = get();
    const v = monthCache.days[String(day)];
    const muscle = (!v || typeof v === 'string') ? null : v.muscle_group;
    set({ dayViewOpen: true, selectedDay: day, selectedMuscle: muscle, dayExercises: [], dayPhotos: [] });
    get().loadDayData(curYear, curMonth, day);
  },

  closeDayView: () => {
    set({
      dayViewOpen: false,
      selectedDay: null,
      selectedMuscle: null,
      dayExercises: [],
      dayPhotos: [],
      currentPR: null,
      supersetId: null,
      supersetCount: 0,
    });
  },

  setSelectedMuscle: (muscle) => set({ selectedMuscle: muscle }),

  markDay: async (state) => {
    const { curYear, curMonth, selectedDay, selectedMuscle, monthCache, weeklyGoal } = get();
    if (!selectedDay) return;
    get().setSyncStatus('⏳ Guardando…');
    try {
      await rpc('gym_set_day', {
        p_year: curYear, p_month: curMonth + 1, p_day: selectedDay,
        p_state: state, p_muscle_group: selectedMuscle || null,
      });
      const days = { ...monthCache.days };
      if (state === null) {
        delete days[String(selectedDay)];
      } else {
        const cacheState = (state === 'done' && isWeekend(curYear, curMonth, selectedDay))
          ? 'weekend_bonus' : state;
        days[String(selectedDay)] = { state: cacheState as 'done' | 'miss' | 'weekend_bonus', muscle_group: selectedMuscle };
      }
      set({ monthCache: { ...monthCache, days } });
      await get().loadMonth(curYear, curMonth);
      get().setSyncStatus('✅ Guardado');
      if (state === 'done') {
        const { monthCache: fresh } = get();
        const streak = calcStreak(fresh, curYear, curMonth, today);
        const { done } = calcWeekDone(fresh, curYear, curMonth, today, weeklyGoal);
        get().showToast(getMotivationalMsg(streak, done, weeklyGoal));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      get().setSyncStatus('❌ ' + msg);
      console.error('markDay:', e);
    }
  },

  loadDayData: async (year, month, day) => {
    const m = month + 1;
    try {
      const [exRes, phRes] = await Promise.all([
        supabase.from('gym_sets').select('*')
          .eq('year', year).eq('month', m).eq('day', day)
          .order('created_at', { ascending: true }),
        supabase.from('gym_photos').select('*')
          .eq('year', year).eq('month', m).eq('day', day)
          .order('created_at', { ascending: true }),
      ]);
      set({
        dayExercises: (exRes.data as ExerciseSet[]) ?? [],
        dayPhotos: (phRes.data as Photo[]) ?? [],
      });
    } catch (e) {
      console.warn('loadDayData:', e);
      set({ dayExercises: [], dayPhotos: [] });
    }
  },

  addSet: async (exercise, weight, reps, groupId) => {
    const { curYear, curMonth, selectedDay, dayExercises, monthCache } = get();
    if (!selectedDay) return;
    try {
      const id = await rpc<string>('gym_log_set', {
        p_year: curYear, p_month: curMonth + 1, p_day: selectedDay,
        p_exercise: exercise, p_weight: weight, p_reps: reps,
        p_group_id: groupId,
      });
      const newSet: ExerciseSet = {
        id, year: curYear, month: curMonth + 1, day: selectedDay,
        exercise, weight_kg: weight, reps, rpe: null, group_id: groupId,
      };
      const dk = String(selectedDay);
      set({
        dayExercises: [...dayExercises, newSet],
        monthCache: {
          ...monthCache,
          set_counts: { ...monthCache.set_counts, [dk]: (monthCache.set_counts[dk] ?? 0) + 1 },
        },
      });
      const pr = await rpc<PRData>('gym_get_pr', { p_exercise: exercise });
      set({ currentPR: pr });
    } catch (e) {
      get().showToast('Error al guardar', '#ff6b6b');
      console.error('addSet:', e);
    }
  },

  deleteSet: async (id) => {
    const { dayExercises, selectedDay, monthCache } = get();
    try {
      await rpc('gym_delete_set', { p_id: id });
      const dk = String(selectedDay);
      const newCount = Math.max(0, (monthCache.set_counts[dk] ?? 1) - 1);
      const newCounts = { ...monthCache.set_counts };
      if (newCount === 0) delete newCounts[dk]; else newCounts[dk] = newCount;
      set({
        dayExercises: dayExercises.filter(s => s.id !== id),
        monthCache: { ...monthCache, set_counts: newCounts },
      });
    } catch (e) {
      get().showToast('Error al borrar', '#ff6b6b');
      console.error('deleteSet:', e);
    }
  },

  toggleSuperset: () => {
    const { supersetId } = get();
    if (supersetId) {
      set({ supersetId: null, supersetCount: 0 });
    } else {
      set({ supersetId: crypto.randomUUID(), supersetCount: 0 });
    }
  },

  bumpSuperset: () => set(s => ({ supersetCount: s.supersetCount + 1 })),

  loadRoutines: async () => {
    try {
      const routines = await rpc<Routine[]>('gym_get_routines');
      set({ allRoutines: routines ?? [] });
    } catch (e) { console.warn('loadRoutines:', e); set({ allRoutines: [] }); }
  },

  applyRoutine: async (routine) => {
    const { curYear, curMonth, selectedDay, selectedMuscle } = get();
    if (!selectedDay) return;
    const exercises = Array.isArray(routine.exercises) ? routine.exercises : [];
    if (!exercises.length) { get().showToast('Rutina vacía', '#ff6b6b'); return; }

    if (routine.muscle_group && !selectedMuscle) {
      get().setSelectedMuscle(routine.muscle_group);
    }
    get().closeRoutinesSheet();
    get().showToast('Aplicando rutina…', '#ffaa22');

    let added = 0;
    for (const ex of exercises) {
      try {
        await get().addSet(ex.exercise, ex.weight_kg, ex.reps, null);
        added++;
      } catch { /* skip failed ex */ }
    }
    await get().loadMonth(curYear, curMonth);
    get().showToast(`✅ ${routine.name}: ${added} ejercicios`);
  },

  deleteRoutine: async (id) => {
    try {
      await rpc('gym_delete_routine', { p_id: id });
      const { allRoutines } = get();
      set({ allRoutines: allRoutines.filter(r => r.id !== id) });
      get().showToast('Rutina eliminada');
    } catch (e) {
      get().showToast('Error al eliminar', '#ff6b6b');
      console.error(e);
    }
  },

  saveRoutine: async (name) => {
    const { dayExercises, selectedMuscle } = get();
    if (!dayExercises.length) { get().showToast('No hay ejercicios que guardar', '#ff6b6b'); return; }
    const best: Record<string, ExerciseSet> = {};
    dayExercises.forEach(s => {
      if (!best[s.exercise] || (s.weight_kg ?? 0) > (best[s.exercise].weight_kg ?? 0)) {
        best[s.exercise] = s;
      }
    });
    const exercises = Object.values(best).map(s => ({
      exercise: s.exercise, weight_kg: s.weight_kg, reps: s.reps,
    }));
    try {
      await rpc('gym_save_routine', {
        p_name: name, p_muscle_group: selectedMuscle || null, p_exercises: exercises,
      });
      await get().loadRoutines();
      get().closeRoutinesSheet();
      get().showToast(`💾 "${name}" guardada`, '#7dff9b');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      get().showToast('Error: ' + msg, '#ff6b6b');
    }
  },

  openRoutinesSheet: (tab = 'apply') => {
    get().loadRoutines();
    set({ routinesSheetOpen: true, routinesTab: tab });
  },
  closeRoutinesSheet: () => set({ routinesSheetOpen: false }),
  switchRoutinesTab: (tab) => set({ routinesTab: tab }),

  openProgress: (exercise) => set({ progressModalOpen: true, progressExercise: exercise }),
  closeProgress: () => set({ progressModalOpen: false }),

  openGallery: (index) => set({ galleryOpen: true, galleryIndex: index }),
  closeGallery: () => set({ galleryOpen: false }),
  setGalleryIndex: (i) => set({ galleryIndex: i }),

  uploadPhoto: async (file) => {
    const { curYear, curMonth, selectedDay, monthCache } = get();
    if (!selectedDay) return;
    const m = curMonth + 1;
    const ext = (file.name || 'photo').split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'jpg';
    const path = `${curYear}/${m}/${selectedDay}/${Date.now()}.${ext}`;
    get().setSyncStatus('⏳ Subiendo foto…');
    try {
      const { error: upErr } = await supabase.storage
        .from('gym-photos').upload(path, file, { contentType: file.type || 'image/jpeg' });
      if (upErr) throw upErr;
      await rpc('gym_save_photo', { p_year: curYear, p_month: m, p_day: selectedDay, p_path: path });
      const dk = String(selectedDay);
      set({
        monthCache: {
          ...monthCache,
          photo_counts: { ...monthCache.photo_counts, [dk]: (monthCache.photo_counts[dk] ?? 0) + 1 },
        },
      });
      await get().loadDayData(curYear, curMonth, selectedDay);
      get().setSyncStatus('✅ Foto guardada');
      get().showToast('📸 Foto guardada', '#ffcc44');
    } catch (e) {
      get().showToast('Error al subir foto', '#ff6b6b');
      console.error('uploadPhoto:', e);
    }
  },

  deletePhoto: async (id) => {
    const { dayPhotos, selectedDay, monthCache } = get();
    try {
      const path = await rpc<string>('gym_delete_photo', { p_id: id });
      if (path) await supabase.storage.from('gym-photos').remove([path]);
      const dk = String(selectedDay);
      const newCount = Math.max(0, (monthCache.photo_counts[dk] ?? 1) - 1);
      const newCounts = { ...monthCache.photo_counts };
      if (newCount === 0) delete newCounts[dk]; else newCounts[dk] = newCount;
      const remaining = dayPhotos.filter(p => p.id !== id);
      set({
        dayPhotos: remaining,
        monthCache: { ...monthCache, photo_counts: newCounts },
        galleryOpen: remaining.length > 0 ? get().galleryOpen : false,
        galleryIndex: Math.min(get().galleryIndex, Math.max(0, remaining.length - 1)),
      });
      get().showToast('Foto borrada');
    } catch (e) {
      get().showToast('Error al borrar foto', '#ff6b6b');
      console.error(e);
    }
  },

  openReward: () => set({ rewardModalOpen: true }),
  closeReward: () => set({ rewardModalOpen: false }),

  saveReward: async (name, cost) => {
    const { curYear, curMonth, monthCache } = get();
    if (!name || !cost) { get().showToast('Completá nombre y valor', '#ff6b6b'); return; }
    const hasActive = monthCache.reward !== null;
    get().setSyncStatus('⏳ Guardando recompensa…');
    try {
      if (hasActive) {
        await rpc('gym_complete_reward', { p_name: name, p_amount: cost });
      } else {
        const { error } = await supabase.from('gym_reward').insert({ name, target_amount: cost });
        if (error) throw error;
      }
      set({ rewardModalOpen: false });
      await get().loadMonth(curYear, curMonth);
      get().showToast('✓ Recompensa guardada');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      get().setSyncStatus('❌ ' + msg);
      get().showToast('Error al guardar recompensa', '#ff6b6b');
    }
  },

  showToast: (message, color) => {
    set({ toast: { message, color } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
  setSyncStatus: (s) => set({ syncStatus: s }),
}));

export function useToday() { return today; }

export function useCalcStats() {
  const { monthCache, curYear, curMonth, weeklyGoal } = useAppStore();
  const streak = calcStreak(monthCache, curYear, curMonth, today);
  const completion = calcCompletion(monthCache, curYear, curMonth, today);
  const { done: weekDone } = calcWeekDone(monthCache, curYear, curMonth, today, weeklyGoal);
  return { streak, completion, weekDone };
}
