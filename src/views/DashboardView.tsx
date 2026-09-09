import React, { useState } from 'react';
import { CurrentUser } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CATEGORIES, RoutePath } from '../services/navigation';
import {
  TrendingUp,
  Coins,
  Megaphone,
  Package,
  Layers,
  Smartphone,
  Cloud,
  RefreshCw,
  Palette,
  ShoppingBag,
  Sparkles,
  Flame,
  Calculator
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';
import { MarqueeText } from '../components/MarqueeText';
import { RunningTextBanner } from '../components/RunningTextBanner';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onOpenInstallGuide: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenInstallGuide,
  onNotify,
}) => {
  const store = StorageService.getStoreById(currentUser.storeId);
  const stockInfo = StorageService.calculateStock(currentUser.storeId);
  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);
  const hppInfo = StorageService.calculateHPP(currentUser.storeId);
  const salesList = StorageService.getSales(currentUser.storeId);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = salesList.filter((s) => s.date === todayStr);
  const todayOmzet = todaySales.reduce((acc, curr) => acc + (curr.omzet || 0), 0);
  const todayPcs = todaySales.reduce((acc, curr) => acc + (curr.pcsSold || 0), 0);
  const todayPackages = todaySales.reduce((acc, curr) => acc + (curr.packagesSold || 0), 0);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const ok = await StorageService.syncAllFromCloud(currentUser.storeId);
      if (ok) {
        onNotify?.('Data berhasil disinkronkan dengan Cloud Firestore.', 'success');
      } else {
        onNotify?.('Koneksi sinkronisasi lokal aktif.', 'info');
      }
    } catch {
      onNotify?.('Gagal menyinkronkan data cloud.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Running text ticker items
  const runningMessages = [
    `🔥 Omzet Hari Ini: ${formatRupiah(todayOmzet)} (${formatNumber(todayPcs)} pcs / ${formatNumber(todayPackages)} paket)`,
    `📊 HPP Rata-rata: ${formatRupiah(hppInfo.weightedAverageHpp)} /pcs`,
    `📦 Sisa Stok Tersedia: ${formatNumber(stockInfo.remainingStock)} pcs (Terjual: ${formatNumber(stockInfo.totalPcsSold)} pcs)`,
    `📢 Sisa Saldo Iklan: ${formatRupiah(adsCoinInfo.remainingAds)} (Terpakai: ${formatRupiah(adsCoinInfo.totalAdsUsed)})`,
    `🪙 Sisa Saldo Koin: ${formatRupiah(adsCoinInfo.remainingCoin)} (Terpakai: ${formatRupiah(adsCoinInfo.totalCoinUsed)})`,
    `⚡ Seller Profit - Sistem Akuntansi Marketplace, Shopee Live, & Manajemen HPP Terpadu`,
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-5 sm:py-6 space-y-5 sm:space-y-6 text-white font-sans">
      {/* 1. Top Quick Status Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
        {/* Nama Toko Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161823] text-xs font-bold text-zinc-200 border border-white/10 shrink-0 shadow-xs">
          <ShoppingBag className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>{store?.storeName || 'Nano'}</span>
        </div>

        {/* Cloud Sync Button */}
        <button
          type="button"
          id="btn-pill-cloud-sync"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#161823] text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          title="Sinkronisasi Cloud"
        >
          <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Sisa Stok Pill */}
        <div 
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161823] text-xs font-bold text-zinc-200 border border-white/10 shrink-0 cursor-pointer hover:border-[#25F4EE]/40 transition shadow-xs"
        >
          <Package className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>{formatNumber(stockInfo.remainingStock)} pcs</span>
        </div>

        {/* Iklan Pill */}
        <div 
          onClick={() => onNavigate('/persiapan/saldo-iklan')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161823] text-xs font-bold text-[#FE2C55] border border-[#FE2C55]/30 shrink-0 cursor-pointer hover:bg-[#FE2C55]/10 transition shadow-xs"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>{formatRupiah(adsCoinInfo.remainingAds)}</span>
        </div>

        {/* Koin Pill */}
        <div 
          onClick={() => onNavigate('/persiapan/saldo-iklan')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161823] text-xs font-bold text-amber-400 border border-amber-400/30 shrink-0 cursor-pointer hover:bg-amber-400/10 transition shadow-xs"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>{formatRupiah(adsCoinInfo.remainingCoin)}</span>
        </div>

        {/* Install HP Pill */}
        <button
          type="button"
          id="btn-pill-install-hp"
          onClick={onOpenInstallGuide}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-black transition cursor-pointer shrink-0 shadow-xs hover:bg-[#25F4EE]/20 active:scale-95 ml-auto"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install HP</span>
        </button>
      </div>

      {/* 2. Compact Header Intro Card */}
      <div className="rounded-2xl bg-[#161823] p-4 border border-white/10 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Halo, {currentUser.name}</span>
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Dashboard sistem akuntansi Shopee Live, HPP modal ball, gaji shift host, komisi admin, dan laba rugi real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="btn-dashboard-theme-switcher"
              type="button"
              onClick={() => setShowThemeModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-xs"
              title="Pilih Tema Warna Aplikasi"
            >
              <Palette className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Tema</span>
            </button>

            <button
              id="btn-dashboard-install-guide"
              type="button"
              onClick={onOpenInstallGuide}
              className="inline-flex items-center gap-1.5 bg-[#25F4EE]/10 hover:bg-[#25F4EE]/20 text-[#25F4EE] font-bold px-3 py-1.5 rounded-xl text-xs border border-[#25F4EE]/30 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install di HP</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tulisan Berjalan (Running Marquee Banner Ticker) */}
      <RunningTextBanner messages={runningMessages} speed={20} iconType="volume" badgeText="LIVE INFO" />

      {/* 4. METRIK UTAMA DASHBOARD (5 KARTU SESUAI PERMINTAAN USER & SCREENSHOT):
          - Omzet Hari Ini
          - HPP
          - Sisa Stok
          - Sisa Saldo Iklan
          - Sisa Saldo Koin
          Layout: 2 kolom pada mobile (grid-cols-2), responsif 3-5 kolom pada layar besar
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Card 1: Omzet Hari Ini */}
        <div 
          id="card-stat-omzet-hari-ini"
          onClick={() => onNavigate('/penjualan/live')}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-[#FE2C55]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Omzet Hari Ini
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55] shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-[#FE2C55] tracking-tight truncate">
              {formatRupiah(todayOmzet)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              {formatNumber(todayPcs)} pcs ({formatNumber(todayPackages)} paket)
            </div>
          </div>
        </div>

        {/* Card 2: HPP */}
        <div 
          id="card-stat-hpp"
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-[#25F4EE]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              HPP
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatRupiah(hppInfo.weightedAverageHpp)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Rata-rata /pcs
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Stok (Sisa Stok Barang) */}
        <div 
          id="card-stat-sisa-stok"
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Sisa Stok Barang
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Terjual: <strong className="text-emerald-400">{formatNumber(stockInfo.totalPcsSold)} pcs</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Saldo Iklan */}
        <div 
          id="card-stat-sisa-saldo-iklan"
          onClick={() => onNavigate('/persiapan/saldo-iklan')}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-[#25F4EE]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Sisa Saldo Iklan
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatRupiah(adsCoinInfo.remainingAds)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Terpakai: {formatRupiah(adsCoinInfo.totalAdsUsed)}
            </div>
          </div>
        </div>

        {/* Card 5: Sisa Saldo Koin */}
        <div 
          id="card-stat-sisa-saldo-koin"
          onClick={() => onNavigate('/persiapan/saldo-iklan')}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Sisa Saldo Koin
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatRupiah(adsCoinInfo.remainingCoin)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Terpakai: {formatRupiah(adsCoinInfo.totalCoinUsed)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick AI Feature Banner: Kalkulasi Harga & Paket Terjual */}
      <div 
        id="banner-kalkulasi-paket-ai"
        onClick={() => onNavigate('/penjualan/kalkulasi-paket')}
        className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#161823] to-[#161823] border border-emerald-500/40 hover:border-emerald-500/70 transition-all cursor-pointer shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                Kalkulasi Harga & Paket Terjual
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                Fitur AI Baru
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
              Tanya AI: berapa harga bundling dan minimum paket terjual jika iklan 60k & koin 30k untuk untung 1 jt/hari? Lengkap dengan mode input interaktif.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform self-start sm:self-auto shrink-0 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
          <span>Buka Kalkulator AI</span>
          <span>→</span>
        </div>
      </div>

      {/* 5. MENU UTAMA: HANYA TAMPILKAN 3 KATEGORI UTAMA (PERSIAPAN, PENJUALAN, KEUANGAN) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Kategori Menu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;

            return (
              <div
                key={cat.key}
                id={`card-main-menu-${cat.key}`}
                onClick={() => onNavigate(cat.path)}
                className={`group p-4 sm:p-4.5 rounded-2xl border bg-[#161823] hover:bg-[#1c1f2e] transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99] flex flex-col justify-between gap-3.5 ${cat.hoverBorder} ${cat.borderAccent}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${cat.iconColor} shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
                  >
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight truncate">
                      {cat.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-snug line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-semibold group-hover:text-zinc-400 transition-colors">
                    {cat.items.length} Sub-Menu
                  </span>
                  <span className="font-bold text-[#25F4EE] group-hover:translate-x-0.5 transition-transform">
                    Buka →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onNotify={onNotify || (() => {})}
      />
    </div>
  );
};
