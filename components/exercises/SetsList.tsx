'use client';

import { useAppStore } from '@/store/appStore';
import { SUPERSET_COLORS } from '@/lib/constants';
import type { ExerciseSet, PRData } from '@/lib/types';

interface ExerciseGroup {
  name: string;
  sets: ExerciseSet[];
  groupId: string | null;
  supersetColor: string | null;
}

function buildGroups(
  exercises: ExerciseSet[],
): ExerciseGroup[] {
  // Track insertion order of exercise names
  const order: string[] = [];
  const byName: Record<string, ExerciseSet[]> = {};

  for (const set of exercises) {
    if (!byName[set.exercise]) {
      order.push(set.exercise);
      byName[set.exercise] = [];
    }
    byName[set.exercise].push(set);
  }

  // Map group_id values to superset colors (first-seen order)
  const groupColorMap: Record<string, string> = {};
  let colorIdx = 0;

  for (const name of order) {
    for (const set of byName[name]) {
      if (set.group_id && !(set.group_id in groupColorMap)) {
        groupColorMap[set.group_id] =
          SUPERSET_COLORS[colorIdx % SUPERSET_COLORS.length];
        colorIdx++;
      }
    }
  }

  return order.map((name) => {
    const sets = byName[name];
    // Use the first set's group_id as the group's group_id
    const groupId = sets[0]?.group_id ?? null;
    const supersetColor = groupId ? (groupColorMap[groupId] ?? null) : null;
    return { name, sets, groupId, supersetColor };
  });
}

function isPR(set: ExerciseSet, currentPR: PRData | null): boolean {
  if (!currentPR || set.weight_kg === null || set.reps === null) return false;
  return (
    set.weight_kg >= currentPR.weight_kg && set.reps >= currentPR.reps
  );
}

function setDetail(set: ExerciseSet): string {
  const parts: string[] = [];
  if (set.weight_kg !== null) parts.push(`${set.weight_kg} kg`);
  if (set.reps !== null) parts.push(`${set.reps} reps`);
  if (set.rpe !== null) parts.push(`RPE ${set.rpe}`);
  return parts.join(' × ') || '—';
}

export default function SetsList() {
  const dayExercises = useAppStore((s) => s.dayExercises);
  const currentPR = useAppStore((s) => s.currentPR);
  const deleteSet = useAppStore((s) => s.deleteSet);
  const openProgress = useAppStore((s) => s.openProgress);

  if (dayExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <p
          className="text-sm text-center"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Agrega ejercicios arriba 💪
        </p>
      </div>
    );
  }

  const groups = buildGroups(dayExercises);
  const totalSets = dayExercises.length;

  return (
    <div className="px-3 pb-4">
      {/* Exercise count badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(125,255,155,0.12)',
            color: '#7dff9b',
            border: '1px solid rgba(125,255,155,0.2)',
          }}
        >
          {totalSets} {totalSets === 1 ? 'serie' : 'series'} · {groups.length}{' '}
          {groups.length === 1 ? 'ejercicio' : 'ejercicios'}
        </span>
      </div>

      {groups.map((group) => (
        <div
          key={group.name}
          className="rounded-xl p-3 mb-2"
          style={{
            background: '#1a1a1a',
            borderLeft: group.supersetColor
              ? `3px solid ${group.supersetColor}`
              : '3px solid transparent',
          }}
        >
          {/* Biserie label */}
          {group.groupId && group.supersetColor && (
            <div className="mb-1.5">
              <span
                className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: group.supersetColor,
                  background: `${group.supersetColor}1a`,
                  border: `1px solid ${group.supersetColor}33`,
                }}
              >
                BISERIE
              </span>
            </div>
          )}

          {/* Header: exercise name + progress button */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-medium text-sm leading-tight"
              style={{ color: '#ededed' }}
            >
              {group.name}
            </span>
            <button
              onClick={() => openProgress(group.name)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-base"
              style={{
                background: 'rgba(255,255,255,0.05)',
              }}
              aria-label={`Ver progreso de ${group.name}`}
            >
              📈
            </button>
          </div>

          {/* Set rows */}
          <div className="flex flex-col gap-1">
            {group.sets.map((set, idx) => {
              const pr = isPR(set, currentPR);
              return (
                <div
                  key={set.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: pr
                      ? '1px solid rgba(255,217,61,0.3)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Set number */}
                  <span
                    className="text-xs font-bold w-5 text-center shrink-0"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {idx + 1}
                  </span>

                  {/* Detail */}
                  <span
                    className="flex-1 text-sm"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    {setDetail(set)}
                  </span>

                  {/* PR trophy */}
                  {pr && (
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        color: '#ffd93d',
                        background: 'rgba(255,217,61,0.12)',
                      }}
                      title="Personal Record"
                    >
                      🏆
                    </span>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => deleteSet(set.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 text-xs"
                    style={{
                      color: 'rgba(255,255,255,0.3)',
                      background: 'transparent',
                    }}
                    aria-label="Eliminar serie"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
