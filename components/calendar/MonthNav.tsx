'use client';

import { useAppStore } from '@/store/appStore';
import { MONTHS } from '@/lib/constants';

export default function MonthNav() {
  const curYear = useAppStore((s) => s.curYear);
  const curMonth = useAppStore((s) => s.curMonth);
  const goMonth = useAppStore((s) => s.goMonth);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={() => goMonth(-1)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 text-[#ededed] text-lg"
        aria-label="Mes anterior"
      >
        ‹
      </button>

      <span className="text-lg font-bold text-[#ededed]">
        {MONTHS[curMonth]} {curYear}
      </span>

      <button
        onClick={() => goMonth(1)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 text-[#ededed] text-lg"
        aria-label="Mes siguiente"
      >
        ›
      </button>
    </div>
  );
}
