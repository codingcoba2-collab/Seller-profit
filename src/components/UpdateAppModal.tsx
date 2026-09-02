import React, { useState } from 'react';
import { 
  DownloadCloud, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Layers, 
  ShieldCheck, 
  Smartphone,
  HardDrive
} from 'lucide-react';

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    setStatusMessage('Memeriksa berkas & membersihkan cache aplikasi...');

    try {
      // 1. Clear all service worker caches
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }

      // 2. Unregister or update active service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }

      setStatusMessage('Pembaruan selesai! Memuat versi terbaru...');
      if (onNotify) {
        onNotify('Aplikasi berhasil diperbarui ke versi terbaru!', 'success');
      }

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Update app error:', err);
      setIsUpdating(false);
      setStatusMessage('Gagal memperbarui secara otomatis. Silakan refresh halaman browser.');
      if (onNotify) {
        onNotify('Pembaruan selesai dengan refresh biasa.', 'info');
      }
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-[#161823] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Pembaruan Aplikasi</h3>
              <p className="text-xs text-zinc-400">Pembaruan instan tanpa uninstall aplikasi</p>
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

        {/* Version Badge & Info */}
        <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400">Versi Saat Ini:</div>
            <div className="text-sm font-black text-[#25F4EE] flex items-center gap-1.5">
              <span>v2.5.0 - Live Shop Edition</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Terbaru
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-zinc-400">Status PWA:</div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <span>Offline Ready</span>
            </div>
          </div>
        </div>

        {/* What's New List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#25F4EE]" />
            <span>Pembaruan Fitur Terbaru:</span>
          </h4>

          <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2 text-xs text-zinc-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#25F4EE] shrink-0 mt-0.5" />
              <span><strong>Skema Insentif Berjenjang:</strong> Tarif insentif host/admin toko otomatis meningkat saat mencapai target penjualan paket.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Bonus Rangkap Role:</strong> Kompensasi bonus khusus saat pegawai merangkap beberapa role dan tembus target paket.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Bonus Target Omzet Bulanan:</strong> Bonus omzet kotor toko berbasis persentase atau flat nominal.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Presensi Sortir &amp; Steam ke HPP:</strong> Biaya kehadiran langsung menambah HPP final barang tanpa menduplikasi beban operasional gaji.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Proteksi Estimasi Return:</strong> Form input retur manual otomatis terkunci saat mode estimasi return aktif.</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 text-[#25F4EE] text-xs font-semibold text-center animate-pulse">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="w-full sm:w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs transition cursor-pointer text-center"
          >
            Tutup
          </button>
          
          <button
            type="button"
            onClick={handleUpdateApp}
            disabled={isUpdating}
            className="w-full sm:w-2/3 py-3 rounded-xl bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-black font-black text-xs transition shadow-lg shadow-[#25F4EE]/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Sedang Memperbarui...' : 'Perbarui & Muat Ulang Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
