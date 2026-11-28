import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, X } from 'lucide-react';
import { appUpdateService, AppUpdateState } from '../services/appUpdateService';

interface AppUpdatePromptProps {
  variant?: 'light' | 'dark';
}

const AUTO_UPDATE_SECONDS = 4;

export const AppUpdatePrompt: React.FC<AppUpdatePromptProps> = ({ variant = 'dark' }) => {
  const [updateState, setUpdateState] = useState<AppUpdateState>(() =>
    appUpdateService.getState()
  );
  const [countdown, setCountdown] = useState<number>(AUTO_UPDATE_SECONDS);
  const [autoPaused, setAutoPaused] = useState<boolean>(false);

  useEffect(() => {
    const unsub = appUpdateService.subscribe(setUpdateState);
    return () => unsub();
  }, []);

  // Reset countdown when a new update arrives
  useEffect(() => {
    if (updateState.hasUpdate && !updateState.dismissed) {
      setCountdown(AUTO_UPDATE_SECONDS);
      setAutoPaused(false);
    }
  }, [updateState.hasUpdate, updateState.dismissed, updateState.remoteBuildId]);

  // Automatic update countdown when pop-up is visible
  useEffect(() => {
    if (!updateState.hasUpdate || updateState.dismissed || updateState.isApplying || autoPaused) {
      return;
    }

    if (countdown <= 0) {
      appUpdateService.applyInstantUpdate(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    updateState.hasUpdate,
    updateState.dismissed,
    updateState.isApplying,
    autoPaused,
    countdown,
  ]);

  // Auto-hide "Berhasil Diperbarui" confirmation pop-up after 4.5 seconds
  useEffect(() => {
    if (!updateState.justUpdated || updateState.hasUpdate) return;
    const timer = window.setTimeout(() => {
      appUpdateService.dismissJustUpdated();
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [updateState.justUpdated, updateState.hasUpdate]);

  const isLight = variant === 'light';

  // 1. Pop-up Update Tersedia (dengan auto-update countdown dalam hitungan detik)
  if (updateState.hasUpdate && !updateState.dismissed) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        aria-label="Pembaruan aplikasi tersedia"
        className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-fadeIn"
      >
        <div
          className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${
            isLight
              ? 'bg-white border-blue-200 text-slate-900 shadow-slate-900/20'
              : 'bg-[#161823] border-[#25F4EE]/50 text-white shadow-black/80'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/30'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold leading-snug">
                  Update Aplikasi Tersedia
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAutoPaused(true);
                    appUpdateService.dismissPrompt();
                  }}
                  disabled={updateState.isApplying}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isLight
                      ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Tunda update"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p
                className={`text-xs mt-1.5 leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-zinc-300'
                }`}
              >
                Versi terbaru dari GitHub sudah siap. Aplikasi akan diperbarui otomatis agar menu dan fitur terbaru langsung aktif.
              </p>

              {!autoPaused && !updateState.isApplying && (
                <div
                  className={`mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/25'
                  }`}
                >
                  <span>Otomatis memperbarui dalam</span>
                  <span className="font-mono font-bold">{countdown} detik</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => appUpdateService.applyInstantUpdate(true)}
                  disabled={updateState.isApplying}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap disabled:opacity-60 ${
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
                  onClick={() => {
                    setAutoPaused(true);
                    appUpdateService.dismissPrompt();
                  }}
                  disabled={updateState.isApplying}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    isLight
                      ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Tunda
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pop-up Konfirmasi setelah berhasil update ke versi terbaru
  if (updateState.justUpdated) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[10050] w-[calc(100%-2rem)] max-w-sm animate-fadeIn"
      >
        <div
          className={`rounded-2xl border px-4 py-3.5 shadow-2xl flex items-center gap-3 ${
            isLight
              ? 'bg-white border-emerald-200 text-slate-900 shadow-slate-900/15'
              : 'bg-[#161823] border-emerald-400/50 text-white shadow-black/75'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isLight
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold">Aplikasi Berhasil Diperbarui</div>
            <div
              className={`text-[11px] ${
                isLight ? 'text-slate-600' : 'text-zinc-300'
              }`}
            >
              Anda sudah menggunakan versi terbaru.
            </div>
          </div>
          <button
            type="button"
            onClick={() => appUpdateService.dismissJustUpdated()}
            className={`p-1 rounded-lg cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-700'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
