'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function RewardModal() {
  const rewardModalOpen = useAppStore((s) => s.rewardModalOpen);
  const reward = useAppStore((s) => s.monthCache.reward);
  const closeReward = useAppStore((s) => s.closeReward);
  const saveReward = useAppStore((s) => s.saveReward);

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');

  if (!rewardModalOpen) return null;

  const hasActive = reward !== null;
  const pct =
    reward && reward.target_amount > 0
      ? Math.round((reward.current_amount / reward.target_amount) * 100)
      : 0;

  const handleSave = () => {
    const c = Number(cost || 0);
    saveReward(name.trim(), c);
    setName('');
    setCost('');
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-[500] p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}
      onClick={closeReward}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#ededed]">🎯 Recompensa</h2>
          <button
            onClick={closeReward}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 active:bg-white/10 text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {hasActive && reward ? (
          <div
            className="rounded-xl p-3 flex flex-col gap-2"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#ededed]">{reward.name}</span>
              <span className="text-xs" style={{ color: '#7dff9b' }}>
                ${Math.round(reward.current_amount)} / ${Math.round(reward.target_amount)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, pct)}%`, background: '#1d9b4a' }}
              />
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Al guardar una nueva, se cierra la actual ({pct}%).
            </p>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Si no la cumplís en 30 días, se penaliza un 25%. Los fines de semana cuentan 3×.
          </p>
        )}

        <input
          type="text"
          placeholder="Nombre de la recompensa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm text-[#ededed] outline-none"
          style={{ background: '#222', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <input
          type="number"
          inputMode="numeric"
          placeholder="Valor objetivo ($)"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          className="rounded-xl px-3 py-2.5 text-sm text-[#ededed] outline-none"
          style={{ background: '#222', border: '1px solid rgba(255,255,255,0.08)' }}
        />

        <button
          onClick={handleSave}
          className="bg-[#1d9b4a] active:bg-[#22b355] text-white font-semibold rounded-xl px-4 py-2.5 text-sm"
        >
          {hasActive ? 'Completar y crear nueva' : 'Crear recompensa'}
        </button>
      </div>
    </div>
  );
}
