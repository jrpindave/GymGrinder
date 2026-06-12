'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function RoutinesSheet() {
  const {
    routinesSheetOpen,
    routinesTab,
    allRoutines,
    dayExercises,
    closeRoutinesSheet,
    switchRoutinesTab,
    applyRoutine,
    deleteRoutine,
    saveRoutine,
  } = useAppStore();

  const [routineName, setRoutineName] = useState('');

  function handleSave() {
    const trimmed = routineName.trim();
    if (!trimmed) return;
    saveRoutine(trimmed);
    setRoutineName('');
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[419] bg-black/60"
        style={{ display: routinesSheetOpen ? 'block' : 'none' }}
        onClick={closeRoutinesSheet}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[420] bg-[#111] rounded-t-2xl flex flex-col"
        style={{
          maxHeight: '80vh',
          transform: routinesSheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle + Header */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <span className="text-[#ededed] text-lg font-semibold">Rutinas</span>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 text-lg"
              onClick={closeRoutinesSheet}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex gap-1 bg-white/5 rounded-full p-1">
            <button
              className="flex-1 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: routinesTab === 'apply' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: routinesTab === 'apply' ? '#ededed' : 'rgba(255,255,255,0.45)',
              }}
              onClick={() => switchRoutinesTab('apply')}
            >
              Aplicar
            </button>
            <button
              className="flex-1 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: routinesTab === 'save' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: routinesTab === 'save' ? '#ededed' : 'rgba(255,255,255,0.45)',
              }}
              onClick={() => switchRoutinesTab('save')}
            >
              Guardar
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="flex-shrink-0" />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {routinesTab === 'apply' ? (
            <ApplyTab
              allRoutines={allRoutines}
              onApply={applyRoutine}
              onDelete={deleteRoutine}
            />
          ) : (
            <SaveTab
              dayExercises={dayExercises}
              routineName={routineName}
              setRoutineName={setRoutineName}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Apply Tab ─────────────────────────────────────────── */

import type { Routine } from '@/lib/types';

interface ApplyTabProps {
  allRoutines: Routine[];
  onApply: (r: Routine) => void;
  onDelete: (id: string) => void;
}

function ApplyTab({ allRoutines, onApply, onDelete }: ApplyTabProps) {
  if (allRoutines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <span className="text-4xl">📋</span>
        <p className="text-[rgba(255,255,255,0.45)] text-sm text-center">
          No tienes rutinas guardadas aún.{'\n'}Guarda una desde la pestaña &quot;Guardar&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {allRoutines.map((routine) => {
        const preview = routine.exercises.slice(0, 3);
        const remaining = routine.exercises.length - 3;
        return (
          <div
            key={routine.id}
            className="rounded-xl bg-[#1a1a1a] p-3"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Row: name + actions */}
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[#ededed] text-sm font-semibold truncate">{routine.name}</p>
                <p className="text-[rgba(255,255,255,0.45)] text-xs mt-0.5">
                  {routine.exercises.length} ejercicio{routine.exercises.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 text-sm"
                  onClick={() => onDelete(routine.id)}
                  aria-label="Eliminar rutina"
                >
                  🗑
                </button>
                <button
                  className="bg-[#1d9b4a] active:bg-[#22b355] text-white font-semibold rounded-xl px-3 py-2 text-sm"
                  onClick={() => onApply(routine)}
                >
                  Aplicar
                </button>
              </div>
            </div>

            {/* Exercise preview */}
            {preview.length > 0 && (
              <div className="flex flex-col gap-1">
                {preview.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.25)' }}
                    />
                    <span className="text-[rgba(255,255,255,0.55)] text-xs truncate">
                      {ex.exercise}
                      {ex.weight_kg != null && (
                        <span className="text-[rgba(255,255,255,0.35)]"> · {ex.weight_kg} kg</span>
                      )}
                      {ex.reps != null && (
                        <span className="text-[rgba(255,255,255,0.35)]"> × {ex.reps}</span>
                      )}
                    </span>
                  </div>
                ))}
                {remaining > 0 && (
                  <span className="text-[rgba(255,255,255,0.3)] text-xs pl-3.5">
                    +{remaining} más…
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Save Tab ──────────────────────────────────────────── */

import type { ExerciseSet } from '@/lib/types';

interface SaveTabProps {
  dayExercises: ExerciseSet[];
  routineName: string;
  setRoutineName: (v: string) => void;
  onSave: () => void;
}

function SaveTab({ dayExercises, routineName, setRoutineName, onSave }: SaveTabProps) {
  const count = dayExercises.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Info */}
      <div
        className="rounded-xl bg-[#1a1a1a] px-3 py-2.5"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-[rgba(255,255,255,0.45)] text-xs">
          Ejercicios en la sesión actual
        </p>
        <p className="text-[#ededed] text-sm font-semibold mt-0.5">
          {count > 0
            ? `${count} set${count !== 1 ? 's' : ''} registrado${count !== 1 ? 's' : ''}`
            : 'Sin ejercicios registrados aún'}
        </p>
      </div>

      {/* Name input */}
      <div className="flex flex-col gap-2">
        <label className="text-[rgba(255,255,255,0.45)] text-xs font-medium uppercase tracking-wide">
          Nombre de la rutina
        </label>
        <input
          type="text"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          placeholder="Ej: Pecho y tríceps"
          maxLength={60}
          className="w-full rounded-xl bg-[#222] text-[#ededed] placeholder-[rgba(255,255,255,0.25)] text-sm px-3 py-2.5 outline-none"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
          }}
        />
      </div>

      {/* Save button */}
      <button
        className="bg-[#1d9b4a] active:bg-[#22b355] text-white font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none"
        disabled={!routineName.trim() || count === 0}
        onClick={onSave}
      >
        Guardar rutina actual
      </button>

      {count === 0 && (
        <p className="text-[rgba(255,255,255,0.3)] text-xs text-center -mt-2">
          Registra ejercicios antes de guardar una rutina.
        </p>
      )}
    </div>
  );
}
