'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { rpc } from '@/lib/supabase';
import type { ProgressPoint } from '@/lib/types';
import ProgressChart from './ProgressChart';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function epley1RM(w: number, r: number): number {
  return r > 1 ? w * (1 + r / 30) : w;
}

function formatDate(p: ProgressPoint): string {
  return `${p.day} ${MONTHS_SHORT[p.month - 1]} ${p.year}`;
}

function formatDateShort(p: ProgressPoint): string {
  return `${p.day} ${MONTHS_SHORT[p.month - 1]}`;
}

export default function ProgressModal() {
  const progressModalOpen = useAppStore((s) => s.progressModalOpen);
  const progressExercise = useAppStore((s) => s.progressExercise);
  const closeProgress = useAppStore((s) => s.closeProgress);

  // Result is keyed by exercise so loading/loaded states derive without
  // synchronous setState in the effect body.
  const [result, setResult] = useState<{ for: string; points: ProgressPoint[] } | null>(null);

  // Fetch data when modal opens or exercise changes
  useEffect(() => {
    if (!progressModalOpen || !progressExercise) return;

    let cancelled = false;
    rpc<ProgressPoint[]>('gym_exercise_history', { p_exercise: progressExercise })
      .then((data) => {
        if (cancelled) return;
        setResult({ for: progressExercise, points: Array.isArray(data) ? data : [] });
      })
      .catch(() => {
        if (cancelled) return;
        setResult({ for: progressExercise, points: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [progressModalOpen, progressExercise]);

  const loaded = result != null && result.for === progressExercise;
  const loading = progressModalOpen && !!progressExercise && !loaded;
  const points = loaded ? result.points : [];

  // Compute derived stats
  const validPoints = points.filter(
    (p) => p.weight_kg != null && p.weight_kg > 0
  );

  const oneRMs = validPoints.map((p) => epley1RM(p.weight_kg!, p.reps ?? 1));

  // PR: point with highest estimated 1RM
  let prSet: ProgressPoint | null = null;
  let prOneRM = 0;
  if (validPoints.length > 0) {
    const prIdx = oneRMs.indexOf(Math.max(...oneRMs));
    prSet = validPoints[prIdx];
    prOneRM = oneRMs[prIdx];
  }

  // Stats strip values
  const sessionCount = validPoints.length;

  // Progression: compare first vs last 1RM
  let progressionDelta: number | null = null;
  if (validPoints.length >= 2) {
    progressionDelta = oneRMs[oneRMs.length - 1] - oneRMs[0];
  }

  // Last session date
  const lastPoint = validPoints.length > 0 ? validPoints[validPoints.length - 1] : null;

  // History list reversed
  const reversedPoints = [...validPoints].reverse();
  const reversedOneRMs = [...oneRMs].reverse();

  const isPR = (p: ProgressPoint) =>
    prSet != null &&
    p.year === prSet.year &&
    p.month === prSet.month &&
    p.day === prSet.day;

  if (!progressModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[450] flex flex-col"
      style={{
        background: '#0a0a0a',
        transform: progressModalOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={closeProgress}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 text-lg flex-shrink-0"
          aria-label="Cerrar"
        >
          ✕
        </button>
        <h2
          className="flex-1 font-semibold text-base truncate"
          style={{ color: '#ededed' }}
        >
          {progressExercise || '—'}
        </h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {loading && (
          <div
            className="flex items-center justify-center py-16 text-base"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            ⏳ Cargando…
          </div>
        )}

        {loaded && validPoints.length === 0 && (
          <div
            className="flex items-center justify-center py-16 text-sm"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Sin datos para {progressExercise}
          </div>
        )}

        {loaded && validPoints.length > 0 && (
          <>
            {/* 1. Stats strip */}
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 w-max">
                {/* PR */}
                {prSet && (
                  <StatPill
                    label="PR"
                    value={`${prSet.weight_kg}kg × ${prSet.reps ?? 1}`}
                    accent="#ffd93d"
                  />
                )}

                {/* Est. 1RM */}
                {prSet && (
                  <StatPill
                    label="Est. 1RM"
                    value={`${prOneRM.toFixed(1)} kg`}
                    accent="#7dff9b"
                  />
                )}

                {/* Sessions */}
                <StatPill
                  label="Sesiones"
                  value={String(sessionCount)}
                  accent="rgba(255,255,255,0.45)"
                />

                {/* Progression */}
                {progressionDelta !== null && (
                  <StatPill
                    label="Progresión"
                    value={
                      progressionDelta >= 0
                        ? `+${progressionDelta.toFixed(1)}kg ↑`
                        : `${progressionDelta.toFixed(1)}kg ↓`
                    }
                    accent={progressionDelta >= 0 ? '#7dff9b' : '#e8553d'}
                  />
                )}

                {/* Last session */}
                {lastPoint && (
                  <StatPill
                    label="Última sesión"
                    value={formatDateShort(lastPoint)}
                    accent="rgba(255,255,255,0.45)"
                  />
                )}
              </div>
            </div>

            {/* 2. Chart */}
            {validPoints.length >= 2 && (
              <div
                className="rounded-2xl p-3"
                style={{ background: '#111' }}
              >
                <p
                  className="text-xs mb-2"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  Est. 1RM por sesión
                </p>
                <ProgressChart points={validPoints} prSet={prSet} />
              </div>
            )}

            {/* 3. History list */}
            <div className="space-y-2">
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Historial
              </p>
              {reversedPoints.map((p, i) => {
                const pr = isPR(p);
                const oneRM = reversedOneRMs[i];
                return (
                  <div
                    key={`${p.year}-${p.month}-${p.day}-${i}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 gap-3"
                    style={{
                      background: pr ? 'rgba(255,217,61,0.07)' : '#111',
                      border: pr
                        ? '1px solid rgba(255,217,61,0.25)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Date */}
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.45)', minWidth: 64 }}
                    >
                      {formatDate(p)}
                    </span>

                    {/* Weight × reps */}
                    <span
                      className="text-sm font-semibold flex-1 text-center"
                      style={{ color: pr ? '#ffd93d' : '#ededed' }}
                    >
                      {p.weight_kg != null ? `${p.weight_kg} kg` : '—'}
                      {p.reps != null && (
                        <span
                          className="font-normal ml-1"
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        >
                          × {p.reps}
                        </span>
                      )}
                    </span>

                    {/* PR badge */}
                    {pr && (
                      <span
                        className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background: 'rgba(255,217,61,0.18)',
                          color: '#ffd93d',
                        }}
                      >
                        🏆 PR
                      </span>
                    )}

                    {/* Est 1RM */}
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.35)', minWidth: 60, textAlign: 'right' }}
                    >
                      {oneRM.toFixed(1)} kg
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat pill sub-component ─────────────────────────────────────────────────

interface StatPillProps {
  label: string;
  value: string;
  accent: string;
}

function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-4 py-2.5 gap-0.5"
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 88,
      }}
    >
      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}
