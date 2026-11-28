import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { appUpdateService, AppUpdateState } from '../services/appUpdateService';

interface AppUpdatePromptProps {
  variant?: 'light' | 'dark';
}

export const AppUpdatePrompt: React.FC<AppUpdatePromptProps> = ({ variant = 'dark' }) => {
  const [updateState, setUpdateState] = useState<AppUpdateState>(() =>
    appUpdateService.getState()
  );

  useEffect(() => {
    const unsub = appUpdateService.subscribe(setUpdateState);
    return () => unsub();
  }, []);

  if (!updateState.hasUpdate || updateState.dismissed) {
    return null;
  }

  const isLight = variant === 'light';

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Pembaruan aplikasi tersedia"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[390px] z-[10050] animate-fadeIn"
    >
      <div
        className={`rounded-2xl border p-4 shadow-2xl ${
          isLight
            ? 'bg-white border-blue-200 text-slate-900 shadow-slate-900/10'
            : 'bg-[#161823] border-[#25F4EE]/50 text-white shadow-black/70'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isLight
                ? 'bg-blue-50 text-blue-600'
                : 'bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/30'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold leading-snug">
                Pembaruan Aplikasi Tersedia
              </h3>
              <button
                type="button"
                onClick={() => appUpdateService.dismissPrompt()}
                disabled={updateState.isApplying}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title="Tutup sementara"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p
              className={`text-xs mt-1 leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-zinc-300'
              }`}
            >
              Ada perubahan menu atau fitur terbaru. Klik <strong>Update Sekarang</strong> agar
              aplikasi langsung memuat versi terbaru. Data Anda tetap aman.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => appUpdateService.applyInstantUpdate(false)}
                disabled={updateState.isApplying}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap disabled:opacity-60 ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-black'
                }`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${updateState.isApplying ? 'animate-spin' : ''}`}
                />
                <span>
                  {updateState.isApplying ? 'Memperbarui...' : 'Update Sekarang'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => appUpdateService.dismissPrompt()}
                disabled={updateState.isApplying}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
