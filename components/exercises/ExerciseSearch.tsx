'use client';

import { useRef, useState } from 'react';
import { rpc } from '@/lib/supabase';
import { EQUIP_ES, MUSCLE_ES } from '@/lib/constants';
import type { ExerciseResult } from '@/lib/types';

interface ExerciseSearchProps {
  onSelect: (ex: ExerciseResult) => void;
  filterMuscle: string;
  filterEquip: string;
  onInputChange: (val: string) => void;
  value: string;
}

export default function ExerciseSearch({
  onSelect,
  filterMuscle,
  filterEquip,
  onInputChange,
  value,
}: ExerciseSearchProps) {
  const [inputVal, setInputVal] = useState(value);
  const [dropdownResults, setDropdownResults] = useState<ExerciseResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dbSearchTimer = useRef<NodeJS.Timeout | null>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputVal(val);
    onInputChange(val);

    if (dbSearchTimer.current) {
      clearTimeout(dbSearchTimer.current);
    }

    if (!val.trim()) {
      setDropdownResults([]);
      setShowDropdown(false);
      return;
    }

    dbSearchTimer.current = setTimeout(async () => {
      try {
        const results = await rpc('gym_search_exercises', {
          p_query: val,
          p_limit: 12,
          p_muscle: filterMuscle || null,
          p_equipment: filterEquip || null,
        });
        setDropdownResults((results as ExerciseResult[]) ?? []);
        setShowDropdown(true);
      } catch {
        setDropdownResults([]);
        setShowDropdown(false);
      }
    }, 260);
  }

  function handleSelect(ex: ExerciseResult) {
    onSelect(ex);
    setShowDropdown(false);
    setInputVal('');
    onInputChange('');
  }

  function handleBlur() {
    // Delay to allow click events on dropdown items to fire first
    setTimeout(() => setShowDropdown(false), 150);
  }

  function handleFocus() {
    if (dropdownResults.length > 0 && inputVal.trim()) {
      setShowDropdown(true);
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={inputVal}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="Buscar ejercicio..."
        className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#ededed] w-full placeholder:text-white/30 focus:outline-none focus:border-white/25"
      />

      {showDropdown && dropdownResults.length > 0 && (
        <div className="absolute z-50 bg-[#1a1a1a] border border-white/10 rounded-xl mt-1 max-h-64 overflow-y-auto shadow-2xl w-full">
          {dropdownResults.map((ex, i) => {
            const muscleLabel =
              ex.target_muscle
                ? (MUSCLE_ES as Record<string, string>)[ex.target_muscle] ?? ex.target_muscle
                : null;
            const equipLabel =
              ex.equipment
                ? (EQUIP_ES as Record<string, string>)[ex.equipment] ?? ex.equipment
                : null;

            return (
              <button
                key={`${ex.name}-${i}`}
                type="button"
                onMouseDown={() => handleSelect(ex)}
                className="w-full text-left px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="font-semibold text-sm text-[#ededed] leading-tight">
                  {ex.name}
                </div>
                {(muscleLabel || equipLabel) && (
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {[muscleLabel, equipLabel].filter(Boolean).join(' · ')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
