import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Apple, X, Share, MoreVertical, PlusSquare, Download, Copy, Check } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Download className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Panduan Install di HP</h3>
                  <p className="text-xs text-slate-500">Pasang di layar utama HP tanpa download APK</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Copy Link Action Bar */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-600 truncate">
                <span className="font-semibold text-slate-800 block">Link Aplikasi:</span>
                <span className="text-[11px] text-slate-500 truncate block">{window.location.href}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
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
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-slate-100">
              <button
                type="button"
                onClick={() => setPlatformTab('android')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  platformTab === 'android'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Android (Chrome)</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatformTab('ios')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  platformTab === 'ios'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Apple className="w-4 h-4 text-slate-700" />
                <span>iPhone / iPad (Safari)</span>
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {platformTab === 'android' ? (
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">Buka di Browser Google Chrome</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Buka link web aplikasi ini pada browser Chrome di HP Android Anda.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <span>Tekan Menu Titik Tiga</span>
                        <MoreVertical className="w-3.5 h-3.5 text-slate-500 inline" />
                        <span>di pojok kanan atas</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Cari tombol titik tiga di browser Chrome.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi"</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Ikon aplikasi otomatis muncul di menu HP seperti aplikasi Play Store.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">Buka di Browser Safari</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Buka link web aplikasi ini di browser bawaan Safari pada iPhone/iPad.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <span>Tekan Tombol Share</span>
                        <Share className="w-3.5 h-3.5 text-slate-600 inline" />
                        <span>di bar bawah Safari</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Ikon kotak dengan panah ke atas di bagian tengah bawah layar.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <span>Pilih "Add to Home Screen"</span>
                        <PlusSquare className="w-3.5 h-3.5 text-slate-600 inline" />
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Scroll ke bawah sedikit lalu pilih "Tambah ke Layar Utama".</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
