'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { ExerciseResult, PRData } from '@/lib/types';
import ExerciseSearch from './ExerciseSearch';
import ExerciseFilters from './ExerciseFilters';
import SetsList from './SetsList';
import { EQUIP_ES, MUSCLE_ES, DIFF_ES, DIFF_COLOR } from '@/lib/constants';
import { rpc } from '@/lib/supabase';

export default function ExerciseSection() {
  const {
    currentPR,
    supersetId,
    supersetCount,
    addSet,
    toggleSuperset,
    bumpSuperset,
  } = useAppStore();

  const [exName, setExName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [setsCount, setSetsCount] = useState('1');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterEquip, setFilterEquip] = useState('');
  const [exInfoCard, setExInfoCard] = useState<ExerciseResult | null>(null);
  const [localPR, setLocalPR] = useState<PRData | null>(null);

  const handleSelectExercise = useCallback(async (ex: ExerciseResult) => {
    setExName(ex.name);
    setExInfoCard(ex);

    try {
      const data = await rpc<PRData | null>('gym_get_pr', { p_exercise: ex.name });
      if (data && data.weight_kg != null) {
        setLocalPR({ weight_kg: data.weight_kg, reps: data.reps });
      } else {
        setLocalPR(null);
      }
    } catch {
      setLocalPR(null);
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (!exName.trim()) return;

    const w = weight !== '' ? parseFloat(weight) : null;
    const r = reps !== '' ? parseInt(reps, 10) : null;
    const count = Math.max(1, Math.min(10, parseInt(setsCount, 10) || 1));

    for (let i = 0; i < count; i++) {
      addSet(exName.trim(), w, r, supersetId);
    }

    if (supersetId) {
      bumpSuperset();
    }

    setWeight('');
    setReps('');
    setSetsCount('1');
  }, [exName, weight, reps, setsCount, supersetId, addSet, bumpSuperset]);

  const handleRepsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  const supersetLabel = (() => {
    if (!supersetId) return '⟳ Biserie';
    if (supersetCount === 0) return '⟳ Biserie — 1er ejercicio';
    return `⟳ Biserie — ${supersetCount + 1}° ejercicio`;
  })();

  const pr = localPR ?? currentPR;

  const muscleLabel = exInfoCard?.target_muscle
    ? (MUSCLE_ES as Record<string, string>)[exInfoCard.target_muscle] ?? exInfoCard.target_muscle
    : null;

  const equipLabel = exInfoCard?.equipment
    ? (EQUIP_ES as Record<string, string>)[exInfoCard.equipment] ?? exInfoCard.equipment
    : null;

  const diffLabel = exInfoCard?.difficulty
    ? (DIFF_ES as Record<string, string>)[exInfoCard.difficulty] ?? exInfoCard.difficulty
    : null;

  const diffColor = exInfoCard?.difficulty
    ? (DIFF_COLOR as Record<string, string>)[exInfoCard.difficulty] ?? '#ededed'
    : '#ededed';

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <ExerciseSearch
        filterMuscle={filterMuscle}
        filterEquip={filterEquip}
        onSelect={handleSelectExercise}
        value={exName}
        onInputChange={setExName}
      />

      {/* Filters */}
      <ExerciseFilters
        filterMuscle={filterMuscle}
        filterEquip={filterEquip}
        onMuscleChange={setFilterMuscle}
        onEquipChange={setFilterEquip}
      />

      {/* Exercise info badges */}
      {exInfoCard && (muscleLabel || equipLabel || diffLabel) && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {muscleLabel && (
            <span
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#ededed',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {muscleLabel}
            </span>
          )}
          {exInfoCard.secondary_muscle && (
            <span
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {(MUSCLE_ES as Record<string, string>)[exInfoCard.secondary_muscle] ?? exInfoCard.secondary_muscle}
            </span>
          )}
          {diffLabel && (
            <span
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: `${diffColor}18`,
                color: diffColor,
                border: `1px solid ${diffColor}40`,
              }}
            >
              {diffLabel}
            </span>
          )}
          {equipLabel && (
            <span
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(61,136,232,0.12)',
                color: '#3d88e8',
                border: '1px solid rgba(61,136,232,0.25)',
              }}
            >
              {equipLabel}
            </span>
          )}
          {exInfoCard.movement_pattern && (
            <span
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {exInfoCard.movement_pattern}
            </span>
          )}
        </div>
      )}

      {/* PR hint */}
      {pr && (
        <p className="text-xs font-semibold" style={{ color: '#ffd93d' }}>
          🏆 PR: {pr.weight_kg}kg × {pr.reps} reps
        </p>
      )}

      {/* Form inputs row */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          inputMode="decimal"
          step={0.5}
          min={0}
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="flex-[2] min-w-0 rounded-xl px-3 py-2.5 text-sm text-[#ededed] outline-none"
          style={{
            background: '#222',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onKeyDown={handleRepsKeyDown}
          className="flex-[2] min-w-0 rounded-xl px-3 py-2.5 text-sm text-[#ededed] outline-none"
          style={{
            background: '#222',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          placeholder="Series"
          value={setsCount}
          onChange={(e) => setSetsCount(e.target.value)}
          className="flex-[1] min-w-0 rounded-xl px-3 py-2.5 text-sm text-[#ededed] outline-none"
          style={{
            background: '#222',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>

      {/* Superset + Add row */}
      <div className="flex gap-2">
        <button
          onClick={toggleSuperset}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          style={
            supersetId
              ? { background: '#3d3d1a', color: '#ffd93d', border: '1px solid rgba(255,217,61,0.25)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
          }
        >
          {supersetLabel}
        </button>
        <button
          onClick={handleAdd}
          className="bg-[#1d9b4a] active:bg-[#22b355] text-white font-semibold rounded-xl px-5 py-2.5 text-sm"
        >
          Agregar
        </button>
      </div>

      {/* Sets list */}
      <SetsList />
    </div>
  );
}
