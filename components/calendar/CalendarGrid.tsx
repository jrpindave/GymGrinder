'use client';

import { useAppStore } from '@/store/appStore';
import { DAYS_ES } from '@/lib/constants';
import MonthNav from './MonthNav';
import DayCard from './DayCard';

export default function CalendarGrid() {
  const { curYear, curMonth } = useAppStore();

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const startOffset = new Date(curYear, curMonth, 1).getDay();

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(
      <div key={`empty-${i}`} className="aspect-square" />
    );
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      curYear === todayYear && curMonth === todayMonth && d === todayDay;
    cells.push(
      <DayCard key={`day-${d}`} day={d} year={curYear} month={curMonth + 1} isToday={isToday} />
    );
  }

  return (
    <div className="flex flex-col">
      <MonthNav />
      <div className="grid grid-cols-7 gap-1 px-2 pt-1 pb-0">
        {DAYS_ES.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-medium pb-1"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2">
        {cells}
      </div>
    </div>
  );
}
