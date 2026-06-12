'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/appStore';
import StatsPanel from '@/components/ui/StatsPanel';
import DayView from '@/components/day-view/DayView';
import Toast from '@/components/ui/Toast';
import RewardModal from '@/components/ui/RewardModal';

// WebGL only exists in the browser — skip prerender for the 3D calendar.
const Calendar3D = dynamic(() => import('@/components/calendar/Calendar3D'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
      Cargando calendario 3D…
    </div>
  ),
});

export default function GymApp() {
  useEffect(() => {
    const { loadMonth, curYear, curMonth } = useAppStore.getState();
    loadMonth(curYear, curMonth);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden">
      <StatsPanel />
      <main className="absolute inset-0">
        <Calendar3D />
      </main>
      <DayView />
      <Toast />
      <RewardModal />
    </div>
  );
}
