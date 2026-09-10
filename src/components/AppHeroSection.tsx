import React from 'react';
import { 
  Sparkles, 
  LogIn, 
  Store, 
  TrendingUp, 
  ShieldCheck, 
  Receipt, 
  Boxes, 
  ArrowRight,
  ChevronDown,
  Layers,
  Zap,
  Building2
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface AppHeroSectionProps {
  onOpenLoginModal: () => void;
}

export const AppHeroSection: React.FC<AppHeroSectionProps> = ({ onOpenLoginModal }) => {
  const handleLoginClick = () => {
    SoundFx.unlockAudio();
    SoundFx.playRobotButtonClick();
    onOpenLoginModal();
  };

  const handleScrollToFeatures = () => {
    SoundFx.unlockAudio();
    SoundFx.playRobotButtonClick();
    const target = document.getElementById('education-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#06070B] via-[#0B0D14] to-[#07080B] text-white">
      {/* Background Ambient Glow & Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#FE2C55]/15 via-[#C70101]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-2xl bg-black/70 border border-[#FE2C55]/50 text-[#FE2C55] shadow-[0_0_20px_rgba(254,44,85,0.35)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#25F4EE] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FE2C55] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                Seller Profit
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#25F4EE]/15 border border-[#25F4EE]/30 text-[#25F4EE] text-[10px] font-mono font-bold tracking-wide">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Sistem Kasir POS & Akuntansi Bisnis Ritel Terpadu
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleScrollToFeatures}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <span>Fitur Utama</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            id="btn-login-header"
            onClick={handleLoginClick}
            className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#ff476d] hover:from-[#ff3d66] hover:to-[#FE2C55] text-white text-xs sm:text-sm font-black tracking-wide uppercase flex items-center gap-2 shadow-[0_0_25px_rgba(254,44,85,0.45)] transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>Masuk</span>
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-14 sm:pb-20 flex flex-col items-center text-center">
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-[#25F4EE]/35 text-xs text-zinc-300 backdrop-blur-md mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Sistem Kasir & Akuntansi Pintar</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[#25F4EE] font-mono">Multi-Toko Cloud</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl leading-[1.18] sm:leading-[1.15]">
          Kelola Penjualan, Stok Toko & Laba Rugi{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FE2C55] via-[#ff6b8b] to-[#25F4EE]">
            Secara Real-Time
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-zinc-300 max-w-2xl font-normal leading-relaxed">
          Platform manajemen bisnis terpadu untuk pencatatan transaksi kasir, kalkulasi HPP otomatis, mutasi kas bank, piutang, dan pemantauan multi-cabang tanpa ribet.
        </p>

        {/* CTA Buttons */}
        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
          <button
            type="button"
            id="btn-login-hero-main"
            onClick={handleLoginClick}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#FE2C55] via-[#C70101] to-[#FE2C55] hover:from-[#ff3d66] hover:to-[#FE2C55] text-white text-sm sm:text-base font-black tracking-wide uppercase flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(254,44,85,0.5)] transition active:scale-95 cursor-pointer"
          >
            <Store className="w-5 h-5 text-white" />
            <span>Buka Toko / Masuk</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <button
            type="button"
            onClick={handleScrollToFeatures}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#25F4EE]" />
            <span>Pelajari Keunggulan</span>
          </button>
        </div>

        {/* Interactive Stats Showcase Deck */}
        <div className="mt-12 sm:mt-16 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
          {/* Card 1: Kasir POS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#FE2C55]/40 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-[#FE2C55]/15 text-[#FE2C55] flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Kasir POS Kilat</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Scan barcode, cetak struk bluetooth, & kalkulasi kembalian otomatis.
            </p>
          </div>

          {/* Card 2: Laba Rugi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#25F4EE]/40 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-[#25F4EE]/15 text-[#25F4EE] flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Laba Rugi Akurat</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Analisis laba kotor & bersih per produk dan per periode otomatis.
            </p>
          </div>

          {/* Card 3: Manajemen Stok */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Kontrol Stok & HPP</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Peringatan stok menipis dan pencatatan modal awal terstruktur.
            </p>
          </div>

          {/* Card 4: Multi-Toko & Cloud */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Multi-Toko Cloud</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Akses dari berbagai HP dan cabang toko dengan izin owner & staf.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
