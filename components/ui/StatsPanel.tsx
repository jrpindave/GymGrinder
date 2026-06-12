'use client';

import { useAppStore, useCalcStats } from '@/store/appStore';
import { WEEK_GOALS } from '@/lib/constants';

export default function StatsPanel() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const weeklyGoal = useAppStore((s) => s.weeklyGoal);
  const setWeeklyGoal = useAppStore((s) => s.setWeeklyGoal);
  const reward = useAppStore((s) => s.monthCache.reward);
  const openReward = useAppStore((s) => s.openReward);
  const showToast = useAppStore((s) => s.showToast);
  const { streak, completion, weekDone } = useCalcStats();

  const cycleGoal = () => {
    const idx = WEEK_GOALS.indexOf(weeklyGoal);
    const next = WEEK_GOALS[(idx + 1) % WEEK_GOALS.length];
    setWeeklyGoal(next);
    showToast(`Meta semanal: ${next} días/semana`, '#ffaa22');
  };

  const rewardPct =
    reward && reward.target_amount > 0
      ? Math.round((reward.current_amount / reward.target_amount) * 100)
      : 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex flex-col"
      style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Row 1: title + stats */}
      <div className="h-12 flex items-center px-3 gap-2">
        <span className="text-xs font-bold text-[#ededed] shrink-0 tracking-tight">
          GymGrinder
        </span>

        <div className="flex-1 flex items-center justify-center gap-1.5">
          {/* Streak */}
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span className="text-xs">🔥</span>
            <span className="text-xs font-semibold text-[#ededed]">{streak} días</span>
          </div>

          {/* Completion */}
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span className="text-xs font-semibold" style={{ color: '#7dff9b' }}>
              {completion}%
            </span>
          </div>

          {/* Week (tap to cycle goal) */}
          <button
            onClick={cycleGoal}
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 active:opacity-70"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span className="text-xs">📅</span>
            <span
              className="text-xs font-semibold"
              style={{ color: weekDone >= weeklyGoal ? '#7dff9b' : '#ededed' }}
            >
              {weekDone}/{weeklyGoal}
            </span>
          </button>
        </div>

        {/* Reward button */}
        <button
          onClick={openReward}
          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 shrink-0 active:opacity-70"
          style={{ background: 'rgba(255,217,61,0.12)' }}
        >
          <span className="text-xs">🎯</span>
          {reward && (
            <span className="text-xs font-semibold" style={{ color: '#ffd93d' }}>
              {rewardPct}%
            </span>
          )}
        </button>
      </div>

      {/* Reward progress bar */}
      {reward && (
        <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full"
            style={{ width: `${Math.min(100, rewardPct)}%`, background: '#ffd93d' }}
          />
        </div>
      )}

      {/* Sync status (tiny, absolute) */}
      {syncStatus && (
        <span
          className="absolute right-3 top-12 text-[9px]"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          {syncStatus}
        </span>
      )}
    </div>
  );
}
