'use client';

import { useAppStore, useCalcStats } from '@/store/appStore';
import { WEEK_GOALS } from '@/lib/constants';
import MonthNav from '@/components/calendar/MonthNav';

function Chip({ children, bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 shrink-0 whitespace-nowrap"
      style={{ background: bg ?? 'rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  );
}

export default function StatsPanel() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const setWeeklyGoal = useAppStore((s) => s.setWeeklyGoal);
  const openReward = useAppStore((s) => s.openReward);
  const showToast = useAppStore((s) => s.showToast);
  const {
    streak, completion, weekDone, weeklyGoal,
    done, miss, weekendBonus,
    reward, valuePerDay, earned, rewardPct, penalty,
  } = useCalcStats();

  const cycleGoal = () => {
    const idx = WEEK_GOALS.indexOf(weeklyGoal);
    const next = WEEK_GOALS[(idx + 1) % WEEK_GOALS.length];
    setWeeklyGoal(next);
    showToast(`Meta semanal: ${next} días/semana`, '#ffaa22');
  };

  const streakColor = streak >= 7 ? '#ff5722' : streak >= 5 ? '#ff9800' : streak >= 3 ? '#ffd93d' : '#ededed';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex flex-col"
      style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Row 1: title + core stats */}
      <div className="h-11 flex items-center px-3 gap-2">
        <span className="text-xs font-bold text-[#ededed] shrink-0 tracking-tight">GymGrinder</span>
        <div className="flex-1 flex items-center justify-end gap-1.5 overflow-x-auto scrollbar-none">
          <Chip>
            <span className="text-xs">🔥</span>
            <span className="text-xs font-semibold" style={{ color: streakColor }}>{streak} días</span>
          </Chip>
          <Chip>
            <span className="text-xs">📊</span>
            <span className="text-xs font-semibold" style={{ color: '#7dff9b' }}>{completion}%</span>
          </Chip>
          <button onClick={cycleGoal} className="active:opacity-70">
            <Chip>
              <span className="text-xs">📅</span>
              <span className="text-xs font-semibold" style={{ color: weekDone >= weeklyGoal ? '#7dff9b' : '#ededed' }}>
                {weekDone}/{weeklyGoal}
              </span>
            </Chip>
          </button>
          {syncStatus && (
            <span className="text-[9px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{syncStatus}</span>
          )}
        </div>
      </div>

      {/* Row 2: money / day stats */}
      <div className="flex items-center gap-1.5 px-3 pb-1.5 overflow-x-auto scrollbar-none">
        <Chip><span className="text-xs">💰</span><span className="text-xs font-semibold text-[#ededed]">${valuePerDay}/día</span></Chip>
        <Chip><span className="text-xs">✅</span><span className="text-xs font-semibold text-[#ededed]">{done} gym{weekendBonus ? ` (${weekendBonus}×3)` : ''}</span></Chip>
        <Chip><span className="text-xs">❌</span><span className="text-xs font-semibold" style={{ color: miss ? '#e8553d' : '#ededed' }}>{miss} fallas</span></Chip>
        <Chip bg="rgba(255,217,61,0.12)"><span className="text-xs">🏆</span><span className="text-xs font-bold" style={{ color: '#ffd93d' }}>${earned}</span></Chip>
      </div>

      {/* Row 3: reward goal (tap to manage) */}
      <button onClick={openReward} className="px-3 pb-1.5 text-left active:opacity-80">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold truncate" style={{ color: reward ? '#ededed' : 'rgba(255,255,255,0.5)' }}>
            🎯 {reward ? reward.name : 'Definir recompensa'}
          </span>
          <span className="text-xs font-semibold shrink-0" style={{ color: '#ffd93d' }}>
            {reward ? `$${earned}/$${Math.round(reward.target_amount)} · ${rewardPct}%` : ''}
          </span>
        </div>
        <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, rewardPct)}%`, background: penalty ? '#e8553d' : '#ffd93d' }} />
        </div>
        {penalty && (
          <div className="text-[10px] mt-0.5 font-semibold" style={{ color: '#e8553d' }}>⚠️ {penalty}</div>
        )}
      </button>

      {/* Row 4: month navigation */}
      <MonthNav />
    </div>
  );
}
