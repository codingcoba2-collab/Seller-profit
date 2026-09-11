import React from 'react';
import { 
  Sparkles, 
  LogIn, 
  Store, 
  TrendingUp, 
  Receipt, 
  Boxes, 
  ArrowRight,
  ChevronDown,
  Layers,
  Building2,
  Radio,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import cyberCommerceHero from '../assets/images/cyber_commerce_hero_1789060348954.jpg';

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[360px] bg-[radial-gradient(ellipse_at_top,_rgba(254,44,85,0.18)_0%,_rgba(199,1,1,0.08)_45%,_transparent_75%)] rounded-full pointer-events-none" />

      {/* Top Navigation Bar with Safe Area Top Clearance to avoid mobile notches / poni */}
      <header 
        style={{ 
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 24px) + 14px)',
        }}
        className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 sm:pt-8 flex items-center justify-between gap-4"
      >
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
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-20 flex flex-col items-center text-center">
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-[#25F4EE]/35 text-xs text-zinc-300 backdrop-blur-md mb-5 shadow-sm">
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
        <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-zinc-300 max-w-2xl font-normal leading-relaxed">
          Platform manajemen bisnis terpadu untuk pencatatan transaksi kasir, kalkulasi HPP otomatis, mutasi kas bank, piutang, dan pemantauan multi-cabang tanpa ribet.
        </p>

        {/* CTA Buttons */}
        <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
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

        {/* Large Holographic Command Matrix Showcase Frame */}
        <div 
          onClick={handleLoginClick}
          className="mt-10 sm:mt-12 w-full max-w-5xl spatial-card rounded-3xl p-2.5 sm:p-3.5 border-2 border-[#25F4EE]/40 hover:border-[#25F4EE] shadow-[0_0_40px_rgba(37,244,238,0.22)] relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all"
        >
          {/* Hologram Corner HUD Reticles */}
          <div className="hologram-corner-tl" />
          <div className="hologram-corner-tr" />
          <div className="hologram-corner-bl" />
          <div className="hologram-corner-br" />

          {/* Top Laser Scanline */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent animate-pulse" />

          {/* Hologram Telemetry Header Banner */}
          <div className="relative z-10 flex items-center justify-between px-3 py-2 bg-black/60 rounded-t-2xl border-b border-[#25F4EE]/25 mb-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
              <span className="font-bold text-[#FE2C55] uppercase tracking-wider text-[11px]">
                LIVE COMMAND MATRIX
              </span>
              <span className="hidden sm:inline text-zinc-500">•</span>
              <span className="hidden sm:inline text-zinc-300 text-[11px]">
                SHOPEE LIVE & STORE POS ENGINE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#25F4EE]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-bold">REAL-TIME SYNC</span>
            </div>
          </div>

          {/* Large Hero Image Container */}
          <div className="relative w-full h-56 sm:h-80 md:h-96 lg:h-[420px] rounded-2xl overflow-hidden border border-white/10 bg-black/80">
            <img 
              src={cyberCommerceHero} 
              alt="Cyber Matrix Dashboard Preview" 
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 filter brightness-105"
              referrerPolicy="no-referrer"
            />
            {/* Hologram Scanline Grid Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

            {/* Bottom Floating Telemetry Highlights */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-[#25F4EE]/40 text-[#25F4EE] text-xs font-bold font-mono shadow-md flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Kalkulasi HPP & Laba Otomatis</span>
                </span>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-emerald-400/40 text-emerald-400 text-xs font-bold font-mono shadow-md items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Multi-Toko Cloud Database</span>
                </span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#FE2C55]/30 backdrop-blur-md border border-[#FE2C55]/60 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <span>Klik untuk Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Stats Showcase Deck (Continuous Holographic Cards) */}
        <div className="mt-8 sm:mt-12 w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
          {/* Card 1: Kasir POS */}
          <div className="spatial-card p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-[#FE2C55]/60 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-[#FE2C55]/15 text-[#FE2C55] flex items-center justify-center mb-3 border border-[#FE2C55]/30 shadow-[0_0_12px_rgba(254,44,85,0.2)]">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Kasir POS Kilat</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Scan barcode, cetak struk bluetooth, & kalkulasi kembalian otomatis.
            </p>
          </div>

          {/* Card 2: Laba Rugi */}
          <div className="spatial-card p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-[#25F4EE]/60 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-[#25F4EE]/15 text-[#25F4EE] flex items-center justify-center mb-3 border border-[#25F4EE]/30 shadow-[0_0_12px_rgba(37,244,238,0.2)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Laba Rugi Akurat</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Analisis laba kotor & bersih per produk dan per periode otomatis.
            </p>
          </div>

          {/* Card 3: Manajemen Stok */}
          <div className="spatial-card p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-amber-500/60 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Kontrol Stok & HPP</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Peringatan stok menipis dan pencatatan modal awal terstruktur.
            </p>
          </div>

          {/* Card 4: Multi-Toko & Cloud */}
          <div className="spatial-card p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-emerald-500/60 transition-all backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
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
