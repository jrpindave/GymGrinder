import type { MonthCache } from './types';
import { MUSCLES } from './constants';

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function isWeekend(y: number, m: number, d: number): boolean {
  const dw = new Date(y, m, d).getDay();
  return dw === 0 || dw === 6;
}

function getDayState(cache: MonthCache, d: number): string | undefined {
  const v = cache.days[String(d)];
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.state;
}

function getDayMuscle(cache: MonthCache, d: number): string | null {
  const v = cache.days[String(d)];
  if (!v || typeof v === 'string') return null;
  return v.muscle_group || null;
}

export function calcStreak(
  cache: MonthCache,
  curYear: number,
  curMonth: number,
  today: Date
): number {
  if (curMonth !== today.getMonth() || curYear !== today.getFullYear()) return 0;
  const todayD = today.getDate();
  let streak = 0;
  for (let d = todayD; d >= 1; d--) {
    const dw = new Date(curYear, curMonth, d).getDay();
    const wknd = dw === 0 || dw === 6;
    const s = getDayState(cache, d);
    if (s === 'done' || s === 'weekend_bonus') { streak++; continue; }
    if (wknd) continue;
    if (d === todayD && !s) continue;
    break;
  }
  return streak;
}

export function calcCompletion(
  cache: MonthCache,
  curYear: number,
  curMonth: number,
  today: Date
): number {
  const todayD = (curMonth === today.getMonth() && curYear === today.getFullYear())
    ? today.getDate()
    : daysInMonth(curYear, curMonth);
  let weekdays = 0, done = 0;
  for (let d = 1; d <= todayD; d++) {
    const dw = new Date(curYear, curMonth, d).getDay();
    if (dw === 0 || dw === 6) continue;
    weekdays++;
    const s = getDayState(cache, d);
    if (s === 'done' || s === 'weekend_bonus') done++;
  }
  return weekdays > 0 ? Math.round((done / weekdays) * 100) : 0;
}

export function calcWeekDone(
  cache: MonthCache,
  curYear: number,
  curMonth: number,
  today: Date,
  weeklyGoal: number
): { done: number; goal: number } {
  if (curMonth !== today.getMonth() || curYear !== today.getFullYear()) {
    return { done: 0, goal: weeklyGoal };
  }
  const todayD = today.getDate();
  const dw = today.getDay();
  const mondayOff = dw === 0 ? -6 : 1 - dw;
  const weekStart = todayD + mondayOff;
  let done = 0;
  for (let d = Math.max(1, weekStart); d <= todayD; d++) {
    const s = getDayState(cache, d);
    if (s === 'done' || s === 'weekend_bonus') done++;
  }
  return { done, goal: weeklyGoal };
}

export function calcMonthCounts(
  cache: MonthCache,
  curYear: number,
  curMonth: number
): { done: number; miss: number; weekendBonus: number } {
  const total = daysInMonth(curYear, curMonth);
  let done = 0, miss = 0, weekendBonus = 0;
  for (let d = 1; d <= total; d++) {
    const s = getDayState(cache, d);
    if (s === 'done' || s === 'weekend_bonus') done++;
    if (s === 'miss') miss++;
    if (s === 'weekend_bonus') weekendBonus++;
  }
  return { done, miss, weekendBonus };
}

export function calcMuscleStats(
  cache: MonthCache,
  curYear: number,
  curMonth: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  MUSCLES.forEach(m => (counts[m.id] = 0));
  const total = daysInMonth(curYear, curMonth);
  for (let d = 1; d <= total; d++) {
    const s = getDayState(cache, d);
    if (s === 'done' || s === 'weekend_bonus') {
      const muscle = getDayMuscle(cache, d);
      if (muscle && counts[muscle] !== undefined) counts[muscle]++;
    }
  }
  return counts;
}

export function epley1RM(w: number | null, r: number | null): number | null {
  if (!w || !r || r <= 0) return null;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
}

export function getMotivationalMsg(streak: number, weekDone: number, weeklyGoal: number): string {
  if (streak === 10) return '¡10 EN RACHA! 🏆🔥';
  if (streak === 7)  return '¡SEMANA PERFECTA! 👑';
  if (streak === 5)  return '¡5 días seguidos! 🔥🔥';
  if (streak === 3)  return '¡3 en racha! 🔥';
  if (streak === 1)  return '¡Empezaste la racha! 💪';
  if (weekDone === weeklyGoal) return '¡Meta semanal cumplida! 🎯';
  const misc = ['¡Bien hecho! 💪','¡Un día más! 🙌','¡A romperla! 🔥','¡Constancia! ✅','¡Eso es! 💎'];
  return misc[Math.floor(Math.random() * misc.length)];
}

export function getCacheDayState(cache: MonthCache, d: number) {
  return getDayState(cache, d);
}

export function getCacheDayMuscle(cache: MonthCache, d: number) {
  return getDayMuscle(cache, d);
}
