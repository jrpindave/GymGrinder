'use client';

import { useAppStore } from '@/store/appStore';
import { MUSCLE_COLORS, MUSCLES } from '@/lib/constants';
import type { MonthDay } from '@/lib/types';

interface DayCardProps {
  day: number;
  year: number;
  month: number;
  isToday: boolean;
}

export default function DayCard({ day, year, month, isToday }: DayCardProps) {
  const { monthCache, openDayView } = useAppStore();

  const raw = monthCache?.days?.[String(day)];
  const entry: MonthDay | null =
    raw && typeof raw === 'object' ? (raw as MonthDay) : null;

  const setCount = monthCache?.set_counts?.[String(day)] ?? 0;
  const photoCount = monthCache?.photo_counts?.[String(day)] ?? 0;

  const now = new Date();
  const cardDate = new Date(year, month - 1, day);
  const isPast = cardDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Determine background style
  let bgStyle: React.CSSProperties = {};
  const extraClass = '';
  let borderClass = '';

  if (!entry) {
    if (isPast) {
      // Past empty weekday — subtle autofail indicator
      bgStyle = { backgroundColor: '#1a0a0a' };
    } else {
      // Future / empty
      bgStyle = { backgroundColor: '#111' };
    }
  } else if (entry.state === 'done' || entry.state === 'weekend_bonus') {
    const muscleColor =
      entry.muscle_group && MUSCLE_COLORS[entry.muscle_group as keyof typeof MUSCLE_COLORS]
        ? MUSCLE_COLORS[entry.muscle_group as keyof typeof MUSCLE_COLORS]
        : '#1d9b4a';
    // Parse hex to rgba at 85% opacity
    const hex = muscleColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    bgStyle = { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.85)` };
  } else if (entry.state === 'miss') {
    bgStyle = { backgroundColor: '#3a1a1a' };
    borderClass = 'border-l-2 border-[#e8553d]';
  }

  // Today ring
  const todayClass = isToday ? 'ring-1 ring-[#ffd93d]' : '';

  // Resolve muscle icon for done/weekend_bonus
  let muscleIcon: string | null = null;
  if (entry && (entry.state === 'done' || entry.state === 'weekend_bonus') && entry.muscle_group) {
    const found = MUSCLES.find((m) => m.id === entry.muscle_group);
    if (found) muscleIcon = found.icon;
  }

  return (
    <div
      className={`w-full aspect-square rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform relative flex flex-col justify-between p-1 ${extraClass} ${borderClass} ${todayClass}`}
      style={bgStyle}
      onClick={() => openDayView(day)}
    >
      {/* Top-left: day number */}
      <span className="text-[10px] font-bold text-white/70 leading-none">{day}</span>

      {/* Center: muscle icon */}
      {muscleIcon && (
        <span className="text-xl absolute inset-0 flex items-center justify-center pointer-events-none">
          {muscleIcon}
        </span>
      )}

      {/* Weekend bonus star */}
      {entry?.state === 'weekend_bonus' && (
        <span className="text-[10px] absolute top-0.5 right-0.5 leading-none">⭐</span>
      )}

      {/* Bottom row: set count + photo count */}
      <div className="flex items-end justify-between gap-0.5 z-10">
        {setCount > 0 ? (
          <span className="text-[9px] leading-none px-1 py-0.5 rounded-full bg-black/40 text-white/60">
            {setCount}
          </span>
        ) : (
          <span />
        )}
        {photoCount > 0 && (
          <span className="text-[9px] leading-none px-1 py-0.5 rounded-full bg-black/40 text-white/60">
            📷{photoCount}
          </span>
        )}
      </div>
    </div>
  );
}
