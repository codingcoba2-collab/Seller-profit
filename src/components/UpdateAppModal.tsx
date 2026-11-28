import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Smartphone,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import { appUpdateService } from '../services/appUpdateService';

interface UpdateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UpdateAppModal: React.FC<UpdateAppModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [isDone, setIsDone] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      SoundFx.playHologramOpen();
      setIsDone(false);
      setIsUpdating(false);
      setStatusMessage('');
      setStep(0);
      setCountdown(null);
      appUpdateService.checkForUpdates(true).then((found) => {
        setHasRemoteUpdate(found);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: number;
    if (isDone && countdown !== null && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isDone && countdown === 0) {
      triggerReload();
    }
    return () => clearTimeout(timer);
  }, [isDone, countdown]);

  if (!isOpen) return null;

  const triggerReload = () => {
    SoundFx.playRobotButtonClick();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('_appv', Date.now().toString());
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  };

  const performFullUpdate = async (isHardReset: boolean = false) => {
    SoundFx.playRobotButtonClick();
    setIsUpdating(true);
    setIsDone(false);
    setStep(1);
    setStatusMessage('1/3: Membersihkan cache lama & memeriksa versi terbaru...');

    try {
      await new Promise((r) => setTimeout(r, 200));
      setStep(2);
      setStatusMessage('2/3: Memperbarui Service Worker & aset aplikasi...');

      await new Promise((r) => setTimeout(r, 200));
      setStep(3);
      setStatusMessage('3/3: Memuat ulang ke versi terbaru sekarang...');

      if (onNotify) {
        onNotify('Memperbarui aplikasi ke versi terbaru...', 'info');
      }

      await appUpdateService.applyInstantUpdate(isHardReset);
    } catch (err) {
      console.error('Update app error:', err);
      setStep(3);
      setIsUpdating(false);
      setIsDone(true);
      setStatusMessage('Pembaruan selesai! Silakan klik untuk membuka versi terbaru.');
      setCountdown(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="holographic-modal relative w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 text-white">
        {/* Hologram Corner Reticles */}
        <div className="hologram-corner-tl" />
        <div className="hologram-corner-tr" />
        <div className="hologram-corner-bl" />
        <div className="hologram-corner-br" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Update Aplikasi</h3>
              <p className="text-xs text-zinc-400">Pembaruan instan langsung tanpa harus uninstall aplikasi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner: Update Tanpa Uninstall */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#25F4EE]/10 to-emerald-500/10 border border-[#25F4EE]/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#25F4EE] shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-200 leading-relaxed">
            <span className="font-bold text-white block mb-0.5">Update 1-Klik Tanpa Hapus/Uninstall:</span>
            Tombol update ini secara otomatis membersihkan cache lama dan mengunduh seluruh file fitur terbaru. Data toko, password, dan catatan akun Anda <strong>tetap aman 100%</strong>.
          </div>
        </div>

        {hasRemoteUpdate && !statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Versi terbaru terdeteksi! Klik Update Sekarang untuk langsung menerapkannya.</span>
          </div>
        )}

        {/* What's New List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Fitur &amp; Perubahan di Versi Ini:</span>
          </h4>

          <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2 text-xs text-zinc-300 max-h-48 overflow-y-auto">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#25F4EE] shrink-0 mt-0.5" />
              <span><strong>Notifikasi Update Otomatis:</strong> Mendeteksi perubahan menu &amp; kode secara otomatis agar langsung bisa diperbarui.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Portal Khusus Pegawai:</strong> Tampilan terang modern dengan menu Input, Data, dan Gaji terpisah untuk selain Owner.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Presensi Sortir &amp; Steam ke HPP:</strong> Masuk ke modal HPP barang jadi dan tidak menduplikasi beban laba bersih.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Pengeluaran Gaji di Keluar Masuk Kas:</strong> Catatan pembayaran gaji pegawai dengan bukti transfer/foto dan sisa gaji.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>Privasi Gaji Personal:</strong> Role selain Owner hanya dapat melihat data gaji miliknya sendiri.</span>
            </div>
          </div>
        </div>

        {/* Status Message & Progress */}
        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/40 text-[#25F4EE] text-xs font-bold text-center space-y-1.5 animate-pulse">
            <div>{statusMessage}</div>
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#25F4EE] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (step / 3) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {isDone ? (
            <button
              type="button"
              onClick={triggerReload}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-[#25F4EE] hover:opacity-95 text-black font-black text-sm transition shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 active:scale-98 animate-pulse"
            >
              <CheckCircle2 className="w-5 h-5 text-black" />
              <span>
                {countdown !== null && countdown > 0 
                  ? `Muat Ulang Otomatis (${countdown}d) — Klik Untuk Segera Buka`
                  : 'Buka Versi Terbaru Sekarang'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => performFullUpdate(false)}
              disabled={isUpdating}
              className="w-full py-3.5 rounded-2xl bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-black font-black text-sm transition shadow-lg shadow-[#25F4EE]/20 cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Sedang Memperbarui Versi...' : 'Update Sekarang (Tanpa Uninstall)'}</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating && !isDone}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>

            {!isDone && (
              <button
                type="button"
                onClick={() => performFullUpdate(true)}
                disabled={isUpdating}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-[11px] transition cursor-pointer flex items-center gap-1.5 border border-rose-500/20"
                title="Jika masih ada tampilan lama yang tersangkut di HP"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Paksa Bersihkan Cache &amp; Reload</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
