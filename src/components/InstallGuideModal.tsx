import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Apple, X, Share, MoreVertical, PlusSquare, Download, Copy, Check, Sparkles } from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      SoundFx.playHologramOpen();
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="holographic-modal w-full max-w-md p-6 text-white relative shadow-2xl">
            {/* Holographic sci-fi reticles */}
            <div className="hologram-corner-tl" />
            <div className="hologram-corner-tr" />
            <div className="hologram-corner-bl" />
            <div className="hologram-corner-br" />

            {/* Top HUD bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#25F4EE] opacity-80 border-b border-white/10 pb-2 mb-3">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#25F4EE]" />
                HOLOGRAPHIC PWA INSTALL INTERFACE
              </span>
              <span className="text-zinc-400">PWA.NATIVE</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 text-[#25F4EE]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Panduan Install di HP</h3>
                  <p className="text-xs text-zinc-400">Pasang di layar utama HP tanpa download APK</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Copy Link Action Bar */}
            <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
              <div className="text-xs text-zinc-300 truncate">
                <span className="font-semibold text-white block">Link Aplikasi:</span>
                <span className="text-[11px] text-zinc-400 truncate block">{window.location.href}</span>
              </div>
              <button
                type="button"
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

            {/* Platform switcher */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => setPlatformTab('android')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  platformTab === 'android'
                    ? 'bg-[#25F4EE] text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android (Chrome)</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatformTab('ios')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  platformTab === 'ios'
                    ? 'bg-[#25F4EE] text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad (Safari)</span>
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {platformTab === 'android' ? (
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Buka di Browser Google Chrome</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Buka link web aplikasi ini pada browser Chrome di HP Android Anda.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1">
                        <span>Tekan Menu Titik Tiga</span>
                        <MoreVertical className="w-3.5 h-3.5 text-zinc-400 inline" />
                        <span>di pojok kanan atas</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Cari tombol titik tiga di browser Chrome.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-white">Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi"</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Ikon aplikasi otomatis muncul di menu HP seperti aplikasi Play Store.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25F4EE] text-[10px] font-black text-black">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Buka di Browser Safari</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Buka link web aplikasi ini di browser bawaan Safari pada iPhone/iPad.</p>
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
                        <span>di bar bawah Safari</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Ikon kotak dengan panah ke atas di bagian tengah bawah layar.</p>
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
                      <p className="text-[11px] text-zinc-400 mt-0.5">Scroll ke bawah sedikit lalu pilih "Tambah ke Layar Utama".</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
