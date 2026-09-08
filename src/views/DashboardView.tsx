import React, { useState } from 'react';
import { CurrentUser } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CATEGORIES, RoutePath } from '../services/navigation';
import {
  Package,
  TrendingUp,
  Coins,
  Wallet,
  Smartphone,
  Cloud,
  RefreshCw,
  Palette,
  ShoppingBag,
  Tag,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';

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
            <span>{store?.storeName || 'Fashion Store Official'}</span>
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

      {/* DASHBOARD UTAMA: HANYA TAMPILKAN GRID PERSIAPAN, PENJUALAN, DAN KEUANGAN */}
      <div className="space-y-4">
        {/* 3 Main Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;

            return (
              <div
                key={cat.key}
                id={`card-main-menu-${cat.key}`}
                className={`rounded-2xl border bg-[#161823] transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-lg ${cat.hoverBorder} ${cat.borderAccent}`}
              >
                {/* Category Header Bar */}
                <div
                  onClick={() => onNavigate(cat.path)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-white/5 transition flex items-center justify-between gap-3 border-b border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${cat.iconColor} shrink-0 shadow-inner`}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-white tracking-tight leading-tight truncate">
                        {cat.title}
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-semibold">
                        {cat.items.length} Sub-Menu
                      </span>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Sub Menu Grid: Kecil 2 kesamping, sisanya ke bawah */}
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.path}
                          type="button"
                          id={`btn-dash-sub-${item.path.replace(/\//g, '-')}`}
                          onClick={() => onNavigate(item.path)}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0b0c10] hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group cursor-pointer active:scale-95"
                        >
                          <div className={`w-7 h-7 rounded-lg bg-[#161823] flex items-center justify-center shrink-0 ${item.iconColor}`}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white group-hover:text-[#25F4EE] truncate leading-snug">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              {item.badgeText || 'Fitur'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
