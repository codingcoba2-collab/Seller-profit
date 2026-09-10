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
  Calculator,
  Radio,
  MessageSquare
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';
import { MarqueeText } from '../components/MarqueeText';
import { RunningTextBanner } from '../components/RunningTextBanner';
import { NeonCorners } from '../components/NeonCorners';

// Visual Assets for Dashboard Imagery
import sellerCenterLogo from '../assets/images/seller_center_logo_1788971192030.jpg';
import muJerseyImg from '../assets/images/mu_jersey_front_1789001163095.jpg';
import muModelImg from '../assets/images/sophia_mu_front_1789019777467.jpg';

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-5 text-white font-sans overflow-x-hidden">
      {/* 1. Top Quick Status Pill Bar */}
      <div className="spatial-menu flex flex-wrap items-center gap-2 py-2 px-3 select-none rounded-2xl">
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

        {/* Tema Switcher Pill */}
        <button
          type="button"
          id="btn-dashboard-theme-switcher"
          onClick={() => setShowThemeModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-bold transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          title="Pilih Tema Warna Aplikasi"
        >
          <Palette className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Tema</span>
        </button>

        {/* Install HP Pill */}
        <button
          type="button"
          id="btn-pill-install-hp"
          onClick={onOpenInstallGuide}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-black transition cursor-pointer shrink-0 shadow-xs hover:bg-[#25F4EE]/20 active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install HP</span>
        </button>
      </div>

      {/* Visual Showcase Holographic Banner with Store Images */}
      <div className="spatial-card rounded-2xl p-4 sm:p-5 border border-[#25F4EE]/30 relative overflow-hidden group shadow-[0_0_25px_rgba(37,244,238,0.12)]">
        <NeonCorners variant="side-left" color="cyan" />
        {/* Hologram top laser line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent opacity-80 animate-pulse absolute top-0 left-0" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Left: Info & Fast Action Badges */}
          <div className="space-y-3 flex-1 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/40 shadow-[0_0_12px_rgba(254,44,85,0.3)]">
                <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
                STUDIO LIVE SHOPEE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/30">
                <Radio className="w-3 h-3 animate-pulse text-[#25F4EE]" />
                ONLINE DISPATCH
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Seller Profit Cyber Matrix</span>
                <Sparkles className="w-4 h-4 text-[#25F4EE] animate-pulse" />
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl leading-relaxed">
                Pusat kendali operasional live streaming, kalkulasi HPP ball sortir, presensi shift, slip gaji host, dan koordinasi tim real-time.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              <button
                type="button"
                id="btn-beranda-open-live-chat"
                onClick={() => onNavigate('/informasi/live-chat')}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#25F4EE] to-[#00c8e0] hover:from-[#3ffef8] hover:to-[#25F4EE] text-black transition cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(37,244,238,0.3)] active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Buka Live Chat Tim</span>
              </button>

              <button
                type="button"
                id="btn-beranda-open-kalkulator"
                onClick={() => onNavigate('/penjualan/kalkulasi-paket')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs"
              >
                <Calculator className="w-4 h-4 text-[#25F4EE]" />
                <span>Kalkulasi Paket AI</span>
              </button>
            </div>
          </div>

          {/* Right: Rich Visual Image Showcase */}
          <div className="flex items-center gap-3 shrink-0 self-center">
            {/* Visual 1: Model Preview */}
            <div className="relative group/img overflow-hidden rounded-2xl border-2 border-[#25F4EE]/40 shadow-[0_0_20px_rgba(37,244,238,0.25)] w-24 sm:w-32 h-32 sm:h-40 bg-black/60">
              <img
                src={muModelImg}
                alt="Live Host Catalog"
                className="w-full h-full object-cover object-top group-hover/img:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black tracking-wider text-[#25F4EE] uppercase">Host Catalog</span>
              </div>
            </div>

            {/* Visual 2: Jersey Live Stock */}
            <div className="relative group/img overflow-hidden rounded-2xl border-2 border-[#FE2C55]/40 shadow-[0_0_20px_rgba(254,44,85,0.25)] w-24 sm:w-32 h-32 sm:h-40 bg-black/60">
              <img
                src={muJerseyImg}
                alt="Product Showcase"
                className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black tracking-wider text-[#FE2C55] uppercase">Live Stock</span>
              </div>
            </div>

            {/* Visual 3: Seller Center Badge (Hidden on small screens) */}
            <div className="hidden sm:block relative group/img overflow-hidden rounded-2xl border-2 border-white/20 shadow-md w-24 sm:w-32 h-32 sm:h-40 bg-black/60">
              <img
                src={sellerCenterLogo}
                alt="Seller Center"
                className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-black tracking-wider text-zinc-300 uppercase">Center Hub</span>
              </div>
            </div>
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
        {/* Card 1: Omzet Hari Ini - Variasi Kabel Samping Magenta */}
        <div 
          id="card-stat-omzet-hari-ini"
          onClick={() => onNavigate('/penjualan/live')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-[#FE2C55]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="side-left" color="magenta" />
          <div className="flex items-center justify-between gap-1 relative z-10">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Omzet Hari Ini
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55] shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-lg sm:text-xl font-black text-[#FE2C55] tracking-tight truncate">
              {formatRupiah(todayOmzet)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              {formatNumber(todayPcs)} pcs ({formatNumber(todayPackages)} paket)
            </div>
          </div>
        </div>

        {/* Card 2: HPP - Variasi Kabel Samping Cyan */}
        <div 
          id="card-stat-hpp"
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-[#25F4EE]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="side-left" color="cyan" />
          <div className="flex items-center justify-between gap-1 relative z-10">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              HPP
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatRupiah(hppInfo.weightedAverageHpp)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Rata-rata /pcs
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Stok - Variasi Kabel Samping Emerald */}
        <div 
          id="card-stat-sisa-stok"
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-emerald-500/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="side-left" color="emerald" />
          <div className="flex items-center justify-between gap-1 relative z-10">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Sisa Stok Barang
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Terjual: <strong className="text-emerald-400">{formatNumber(stockInfo.totalPcsSold)} pcs</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Saldo Iklan - Variasi Kabel Ujung Atas Cyan */}
        <div 
          id="card-stat-sisa-saldo-iklan"
          onClick={() => onNavigate('/persiapan/saldo-iklan')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-[#25F4EE]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="corner-top-left" color="cyan" />
          <div className="flex items-center justify-between gap-1 relative z-10">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Sisa Saldo Iklan
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatRupiah(adsCoinInfo.remainingAds)}
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              Terpakai: {formatRupiah(adsCoinInfo.totalAdsUsed)}
            </div>
          </div>
        </div>

        {/* Card 5: Sisa Saldo Koin - Variasi Kabel Samping Amber */}
        <div 
          id="card-stat-sisa-saldo-koin"
          onClick={() => onNavigate('/persiapan/saldo-iklan')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-amber-400/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group col-span-2 sm:col-span-1 overflow-hidden"
        >
          <NeonCorners variant="side-left" color="amber" />
          <div className="flex items-center justify-between gap-1 relative z-10">
            <span className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors truncate">
              Sisa Saldo Koin
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10">
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
        className="spatial-card relative p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#121520] to-[#121520] border border-emerald-500/40 hover:border-emerald-500/70 transition-all cursor-pointer shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group active:scale-[0.99] overflow-hidden"
      >
        <NeonCorners variant="side-left" color="emerald" />
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

      {/* 5. MENU UTAMA: TAMPILKAN 4 KATEGORI UTAMA (PERSIAPAN, PENJUALAN, KEUANGAN, INFORMASI) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Kategori Menu
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;

            return (
              <div
                key={cat.key}
                id={`card-main-menu-${cat.key}`}
                onClick={() => onNavigate(cat.path)}
                className={`spatial-card relative group p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99] flex flex-col justify-between gap-3.5 overflow-hidden ${cat.hoverBorder} ${cat.borderAccent}`}
              >
                <NeonCorners 
                  variant={cat.key === 'persiapan' ? 'corner-top-left' : 'side-left'} 
                  color={cat.key === 'persiapan' ? 'cyan' : cat.key === 'penjualan' ? 'magenta' : cat.key === 'informasi' ? 'cyan' : 'emerald'} 
                />
                <div className="flex items-center gap-3 relative z-10">
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
