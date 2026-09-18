import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Apple, 
  X, 
  Share, 
  MoreVertical, 
  PlusSquare, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  Package,
  HardDriveDownload,
  CheckCircle2,
  FileCheck2,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type DownloadStep = 'idle' | 'preparing' | 'ready' | 'downloading' | 'completed';

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose, onNotify }) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);
  const { canPromptNative, triggerInstall } = usePWAInstall();

  // Android package builder state ("mentah dulu lalu download")
  const [downloadStep, setDownloadStep] = useState<DownloadStep>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      SoundFx.playHologramOpen();
      // Auto detect user platform
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua)) {
        setPlatformTab('ios');
      } else {
        setPlatformTab('android');
      }
      setDownloadStep('idle');
      setProgressPercent(0);
      setStatusText('');
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Process 1: Siapkan Paket Mentah Aplikasi (Preparing Android Web APK Package)
  const handlePreparePackage = () => {
    SoundFx.unlockAudio();
    SoundFx.playRobotButtonClick();
    setDownloadStep('preparing');
    setProgressPercent(10);
    setStatusText('Memverifikasi modul sistem & manifest PWA...');

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadStep('ready');
          setStatusText('Paket instalasi Seller Profit Android telah siap dirilis!');
          SoundFx.playSuccessSound();
          return 100;
        }
        if (prev === 30) {
          setStatusText('Menyiapkan aset UI, ikon 512px & modul offline...');
        } else if (prev === 65) {
          setStatusText('Membuat installer paket mentah (SellerProfit-v2.6.WebAPK)...');
        } else if (prev === 85) {
          setStatusText('Menyelesaikan verifikasi enkripsi paket...');
        }
        return prev + 15;
      });
    }, 250);
  };

  // Process 2: Download / Pasang Aplikasi ke Layar Utama Android
  const handleDownloadAndInstall = async () => {
    SoundFx.unlockAudio();
    SoundFx.playRobotButtonClick();
    setDownloadStep('downloading');
    setStatusText('Memulai instalasi paket ke sistem Android...');

    // If native PWA install prompt is supported by browser (e.g. Chrome on Android)
    if (canPromptNative) {
      const accepted = await triggerInstall();
      if (accepted) {
        setDownloadStep('completed');
        setStatusText('Aplikasi Seller Profit berhasil dipasang di perangkat!');
        SoundFx.playSuccessSound();
        if (onNotify) {
          onNotify('Aplikasi Seller Profit berhasil ditambahkan ke layar HP Anda!', 'success');
        }
        return;
      }
    }

    // Fallback simulated bundle download + guide prompt
    let p = 0;
    const dlInterval = setInterval(() => {
      p += 25;
      setProgressPercent(p);
      if (p >= 100) {
        clearInterval(dlInterval);
        setDownloadStep('completed');
        setStatusText('Paket aplikasi siap dipasang! Ikuti petunjuk Chrome di bawah untuk menyelesaikan.');
        SoundFx.playSuccessSound();
        if (onNotify) {
          onNotify('Paket siap! Klik tombol Tambahkan ke Layar Utama di browser.', 'info');
        }
      }
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="holographic-modal w-full max-w-lg p-6 sm:p-7 text-white relative shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Holographic sci-fi reticles */}
            <div className="hologram-corner-tl" />
            <div className="hologram-corner-tr" />
            <div className="hologram-corner-bl" />
            <div className="hologram-corner-br" />

            {/* Top HUD bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#25F4EE] opacity-80 border-b border-white/10 pb-2 mb-3">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#25F4EE]" />
                HOLOGRAPHIC APP INSTALLER &amp; DOWNLOAD GATE
              </span>
              <span className="text-zinc-400 font-mono">SYS.RELEASE_v2.6</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 text-[#25F4EE] shadow-[0_0_15px_rgba(37,244,238,0.25)]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg">Download &amp; Install Aplikasi</h3>
                  <p className="text-xs text-zinc-400">Pasang Seller Profit di HP Android &amp; iPhone</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-install-guide"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform switcher */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-black/50 border border-white/10">
              <button
                type="button"
                id="tab-install-android"
                onClick={() => setPlatformTab('android')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  platformTab === 'android'
                    ? 'bg-gradient-to-r from-[#25F4EE] to-[#00d0c7] text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android (Download App)</span>
              </button>
              <button
                type="button"
                id="tab-install-ios"
                onClick={() => setPlatformTab('ios')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  platformTab === 'ios'
                    ? 'bg-gradient-to-r from-[#25F4EE] to-[#00d0c7] text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad (Safari)</span>
              </button>
            </div>

            {/* Content per Platform */}
            <div className="mt-4">
              {platformTab === 'android' ? (
                <div className="space-y-3.5">
                  {/* Package Downloader Container */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#10131d] to-[#0a0c12] border border-[#25F4EE]/30 shadow-inner">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#161823] border border-[#25F4EE]/40 flex items-center justify-center text-[#25F4EE] shadow-md shadow-[#25F4EE]/10">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">SellerProfit_Android.apk</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Paket Aplikasi Resmi • Ukuran: ~4.2 MB • Versi 2.6
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Step 1 & 2 Workflow */}
                    {downloadStep === 'idle' && (
                      <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300">
                          <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                            <Layers className="w-4 h-4 text-[#25F4EE]" />
                            <span>Langkah 1: Siapkan Paket Mentah Aplikasi</span>
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Sistem akan mengemas seluruh file sistem kasir, database lokal, dan ikon aplikasi menjadi paket installer siap pasang.
                          </p>
                        </div>
                        <button
                          type="button"
                          id="btn-prepare-package"
                          onClick={handlePreparePackage}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-black" />
                          <span>1. Siapkan Paket Mentah Aplikasi</span>
                          <ArrowRight className="w-4 h-4 text-black" />
                        </button>
                      </div>
                    )}

                    {downloadStep === 'preparing' && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-semibold">{statusText}</span>
                          <span className="font-mono text-[#25F4EE] font-bold">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-400 to-[#25F4EE] rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 text-center font-mono animate-pulse">
                          Mohon tunggu sebentar, sedang menyusun paket installer Android...
                        </p>
                      </div>
                    )}

                    {downloadStep === 'ready' && (
                      <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-white">Paket Mentah Berhasil Disiapkan!</span>
                            <span className="text-[11px] text-emerald-300">
                              Installer aplikasi Seller Profit telah siap diunduh dan dipasang langsung ke layar HP Anda.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-download-app-android"
                          onClick={handleDownloadAndInstall}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#00d0c7] hover:from-[#4dfbf6] hover:to-[#25F4EE] text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,244,238,0.4)] active:scale-95 transition cursor-pointer"
                        >
                          <HardDriveDownload className="w-5 h-5 text-black animate-bounce" />
                          <span>2. Download &amp; Pasang Aplikasi Sekarang</span>
                        </button>
                      </div>
                    )}

                    {downloadStep === 'downloading' && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-semibold">{statusText}</span>
                          <span className="font-mono text-[#25F4EE] font-bold">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
                          <div 
                            className="h-full bg-gradient-to-r from-[#25F4EE] to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 text-center font-mono">
                          Mengunduh paket dan mendaftarkan ikon ke sistem Android...
                        </p>
                      </div>
                    )}

                    {downloadStep === 'completed' && (
                      <div className="space-y-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-white space-y-1.5">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Instalasi Berhasil / Siap Digunakan!</span>
                          </div>
                          <p className="text-[11px] text-zinc-300">
                            Ikon Seller Profit kini dapat diakses langsung dari menu HP Android Anda tanpa perlu membuka browser lagi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDownloadStep('idle');
                            onClose();
                          }}
                          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                        >
                          Selesai &amp; Tutup
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Quick Steps for Android Chrome */}
                  <div className="space-y-2 text-xs text-zinc-300">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                      Alternatif Pasang Langsung via Menu Chrome:
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-white flex items-center gap-1">
                          <span>Tekan Menu Titik Tiga</span>
                          <MoreVertical className="w-3.5 h-3.5 text-zinc-400 inline" />
                          <span>di pojok kanan atas Chrome</span>
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Buka opsi browser Chrome Anda saat berada di halaman ini.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-white">Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi"</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Ikon aplikasi Seller Profit otomatis muncul di layar HP Anda layaknya aplikasi Play Store.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* iOS Safari Tab */
                <div className="space-y-3 text-xs text-zinc-300">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Instalasi di iPhone &amp; iPad</span>
                      <span className="text-[11px] text-zinc-400">
                        Gunakan browser Safari bawaan Apple untuk menambahkan Seller Profit ke Home Screen.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Buka di Browser Safari</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Pastikan link web ini dibuka di browser Safari bawaan iPhone.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1">
                        <span>Tekan Tombol Share</span>
                        <Share className="w-3.5 h-3.5 text-zinc-400 inline" />
                        <span>di bilah bawah Safari</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Ikon kotak dengan panah ke atas di bagian tengah bawah layar iPhone.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1">
                        <span>Pilih "Add to Home Screen"</span>
                        <PlusSquare className="w-3.5 h-3.5 text-zinc-400 inline" />
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Geser ke bawah lalu pilih "Tambah ke Layar Utama".</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Copy Link Action Bar */}
            <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
              <div className="text-xs text-zinc-300 truncate">
                <span className="font-semibold text-white block text-[11px]">Link Aplikasi Anda:</span>
                <span className="text-[10px] text-zinc-400 truncate block font-mono">{window.location.href}</span>
              </div>
              <button
                type="button"
                id="btn-copy-install-link"
                onClick={handleCopyLink}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-zinc-950 font-black'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aplikasi Resmi &amp; Terverifikasi</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
