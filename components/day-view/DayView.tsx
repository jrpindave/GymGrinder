'use client';

import { useAppStore } from '@/store/appStore';
import { MUSCLES, MUSCLE_COLORS, MONTHS_SHORT, DAYS_ES } from '@/lib/constants';
import type { MonthDay } from '@/lib/types';
import ExerciseSection from '@/components/exercises/ExerciseSection';
import PhotoSection from '@/components/photos/PhotoSection';
import RoutinesSheet from '@/components/routines/RoutinesSheet';
import ProgressModal from '@/components/progress/ProgressModal';
import GalleryModal from '@/components/photos/GalleryModal';

function formatDayTitle(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  const weekday = DAYS_ES[date.getDay()];
  const monthShort = MONTHS_SHORT[month];
  return `${weekday} ${day} ${monthShort}`;
}

function StateBadge({ state }: { state: string | null }) {
  if (!state) return null;
  if (state === 'done') {
    return (
      <span
        className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: '#1d9b4a', color: '#7dff9b' }}
      >
        Hecho
      </span>
    );
  }
  if (state === 'miss') {
    return (
      <span
        className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: '#3a1a1a', color: '#e8553d' }}
      >
        No fui
      </span>
    );
  }
  if (state === 'weekend_bonus') {
    return (
      <span
        className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: '#3a2e0a', color: '#ffd93d' }}
      >
        Bonus
      </span>
    );
  }
  return null;
}

export default function DayView() {
  const {
    curYear,
    curMonth,
    monthCache,
    dayViewOpen,
    selectedDay,
    selectedMuscle,
    closeDayView,
    setSelectedMuscle,
    markDay,
    openRoutinesSheet,
  } = useAppStore();

  const dayKey = selectedDay !== null ? String(selectedDay) : null;
  const dayData = dayKey && monthCache?.days ? monthCache.days[dayKey] : null;
  const dayState =
    typeof dayData === 'object' && dayData !== null
      ? (dayData as MonthDay).state ?? null
      : null;

  const title =
    selectedDay !== null
      ? formatDayTitle(curYear, curMonth, selectedDay)
      : '';

  return (
    <>
      <div
        className="fixed inset-0 z-[400] flex flex-col"
        style={{
          background: '#0a0a0a',
          transform: dayViewOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0,0.15,1)',
          willChange: 'transform',
        }}
      >
        {/* HEADER */}
        <div
          className="h-14 px-4 flex items-center justify-between border-b shrink-0"
          style={{
            background: '#0a0a0a',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          {/* Close */}
          <button
            onClick={closeDayView}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 text-lg"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Center title */}
          <div className="flex items-center min-w-0">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: '#ededed' }}
            >
              {title}
            </span>
            <StateBadge state={dayState} />
          </div>

          {/* Routines */}
          <button
            onClick={() => openRoutinesSheet()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 text-lg"
            aria-label="Rutinas"
          >
            📋
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* Section 1 — Muscle selector */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {MUSCLES.map((muscle) => {
                const isSelected = selectedMuscle === muscle.id;
                const color = (MUSCLE_COLORS as Record<string, string>)[muscle.id] ?? '#888';
                return (
                  <button
                    key={muscle.id}
                    onClick={() =>
                      setSelectedMuscle(isSelected ? null : muscle.id)
                    }
                    className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                    style={
                      isSelected
                        ? {
                            background: color,
                            color: '#fff',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.3)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.5)',
                          }
                    }
                  >
                    <span>{muscle.icon}</span>
                    <span>{muscle.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2 — Day action buttons */}
          <div className="px-4 pb-4 pt-2 flex gap-2">
            <button
              onClick={() => markDay('done')}
              className="flex-1 font-semibold rounded-xl px-3 py-2.5 text-sm active:opacity-80 transition-opacity"
              style={{ background: '#1d9b4a', color: '#fff' }}
            >
              ✓ Hecho
            </button>
            <button
              onClick={() => markDay('miss')}
              className="flex-1 font-semibold rounded-xl px-3 py-2.5 text-sm active:opacity-80 transition-opacity"
              style={{ background: '#3a1a1a', color: '#e8553d' }}
            >
              ✗ No fui
            </button>
            <button
              onClick={() => markDay(null)}
              className="flex-1 bg-white/5 active:bg-white/10 rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{ color: '#ededed' }}
            >
              Resetear
            </button>
          </div>

          {/* Section 3 — Exercises */}
          <div className="px-4 pb-4">
            <ExerciseSection />
          </div>

          {/* Section 4 — Photos */}
          <div className="px-4 pb-24">
            <PhotoSection />
          </div>
        </div>
      </div>

      {/* Always-mounted modals */}
      <RoutinesSheet />
      <ProgressModal />
      <GalleryModal />
    </>
  );
}
