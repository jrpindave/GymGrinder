'use client';

import { MUSCLE_FILTER_OPTIONS, EQUIP_FILTER_OPTIONS } from '@/lib/constants';

interface ExerciseFiltersProps {
  filterMuscle: string;
  filterEquip: string;
  onMuscleChange: (val: string) => void;
  onEquipChange: (val: string) => void;
}

export default function ExerciseFilters({
  filterMuscle,
  filterEquip,
  onMuscleChange,
  onEquipChange,
}: ExerciseFiltersProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Muscle filter row */}
      <div className="flex flex-row gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {MUSCLE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.val}
            onClick={() => onMuscleChange(opt.val)}
            className={
              filterMuscle === opt.val
                ? 'px-3 py-1 rounded-full text-xs bg-white/15 text-[#ededed] whitespace-nowrap'
                : 'px-3 py-1 rounded-full text-xs bg-white/5 text-white/50 whitespace-nowrap'
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Equipment filter row */}
      <div className="flex flex-row gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {EQUIP_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.val}
            onClick={() => onEquipChange(opt.val)}
            className={
              filterEquip === opt.val
                ? 'px-3 py-1 rounded-full text-xs bg-white/15 text-[#ededed] whitespace-nowrap'
                : 'px-3 py-1 rounded-full text-xs bg-white/5 text-white/50 whitespace-nowrap'
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
