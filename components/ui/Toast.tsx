'use client';

import { useAppStore } from '@/store/appStore';

export default function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[600] transition-all duration-300 ease-out ${
        toast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 cursor-pointer select-none shadow-lg"
        onClick={clearToast}
      >
        <p
          className="text-sm font-medium whitespace-nowrap"
          style={{ color: toast?.color ?? '#ededed' }}
        >
          {toast?.message}
        </p>
      </div>
    </div>
  );
}
