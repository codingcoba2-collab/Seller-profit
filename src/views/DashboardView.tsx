import React, { useState } from 'react';
import { CurrentUser } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CATEGORIES, RoutePath } from '../services/navigation';
import {
  TrendingUp,
  Coins,
  Wallet,
  Smartphone,
  Cloud,
  RefreshCw,
  Palette,
  ShoppingBag,
  Layers,
  Sparkles
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';
import { MarqueeText } from '../components/MarqueeText';

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 text-white font-sans">
      {/* Compact Top Header & Quick Actions */}
      <div className="rounded-2xl bg-[#161823] p-4 border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-[11px] font-semibold text-zinc-300 border border-white/10">
            <ShoppingBag className="w-3 h-3 text-[#25F4EE]" />
            <MarqueeText text={store?.storeName || 'Fashion Store Official'} className="max-w-[200px] sm:max-w-[300px]" />
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>Halo, {currentUser.name}</span>
          </h2>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-halo-cloud-sync"
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer active:scale-95 shadow-xs"
            title="Sinkronisasi Cloud Firestore"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>Cloud</span>
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-halo-theme-switcher"
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
            <span>Install HP</span>
          </button>
        </div>
      </div>

      {/* METRIK UTAMA DASHBOARD: OMZET HARI INI, HPP SISA STOK, DAN SALDO IKLAN & KOIN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Metric 1: Omzet Hari Ini */}
        <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-md flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#FE2C55]" />
              <span>Omzet Hari Ini</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatRupiah(todayOmzet)}
            </div>
            <div className="text-[11px] text-zinc-400">
              <strong className="text-emerald-400">{formatNumber(todayPcs)} pcs</strong> • <strong className="text-amber-300">{formatNumber(todayPackages)} paket</strong>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55] shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: HPP & Sisa Stok */}
        <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-md flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>HPP &amp; Sisa Stok</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatRupiah(hppInfo.weightedAverageHpp)} <span className="text-xs font-normal text-zinc-400">/pcs</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Sisa: <strong className="text-[#25F4EE]">{formatNumber(stockInfo.remainingStock)} pcs</strong> ({formatRupiah(Math.max(0, stockInfo.remainingStock) * hppInfo.weightedAverageHpp)})
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Saldo Iklan & Koin */}
        <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-md flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-1">
          <div className="space-y-1 min-w-0">
            <div className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Saldo Iklan &amp; Koin</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatRupiah(adsCoinInfo.remainingAds)}
            </div>
            <div className="text-[11px] text-zinc-400">
              Sisa Saldo Koin: <strong className="text-amber-400">{formatRupiah(adsCoinInfo.remainingCoin)}</strong>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DASHBOARD UTAMA: HANYA TAMPILKAN 3 MENU UTAMA (PERSIAPAN, PENJUALAN, KEUANGAN) TANPA TULISAN SUB MENU DAN TANPA TANDA PANAH */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;

            return (
              <div
                key={cat.key}
                id={`card-main-menu-${cat.key}`}
                onClick={() => onNavigate(cat.path)}
                className={`group p-4 sm:p-5 rounded-3xl border bg-[#161823] hover:bg-[#1c1f2e] transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99] flex flex-col justify-between gap-4 ${cat.hoverBorder} ${cat.borderAccent}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${cat.iconColor} shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
                  >
                    <CatIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <MarqueeText
                      text={cat.title}
                      as="h3"
                      className="text-base sm:text-lg font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                    />
                    <MarqueeText
                      text={cat.description}
                      as="p"
                      speed={14}
                      className="text-xs text-zinc-400 mt-1 leading-snug"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-semibold group-hover:text-zinc-400 transition-colors">
                    Akses Menu
                  </span>
                  <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">
                    Buka
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
