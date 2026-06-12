'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import StatsPanel from '@/components/ui/StatsPanel';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import DayView from '@/components/day-view/DayView';
import Toast from '@/components/ui/Toast';
import RewardModal from '@/components/ui/RewardModal';

export default function GymApp() {
  useEffect(() => {
    const { loadMonth, curYear, curMonth } = useAppStore.getState();
    loadMonth(curYear, curMonth);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      <StatsPanel />
      <main className="flex-1 overflow-y-auto pt-12">
        <CalendarGrid />
      </main>
      <DayView />
      <Toast />
      <RewardModal />
    </div>
  );
}
