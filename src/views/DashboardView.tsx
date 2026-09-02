import React, { useState } from 'react';
import { CurrentUser, ViewState, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatNumber } from '../utils/formatters';
import {
  Users,
  Package,
  Settings,
  Clock,
  TrendingUp,
  RotateCcw,
  Coins,
  Receipt,
  PieChart,
  Wallet,
  Calculator,
  Award,
  Sparkles,
  Smartphone,
  ChevronRight,
  Lock,
  Scissors,
  BarChart3,
  Activity,
  Cloud,
  RefreshCw,
  Palette,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onNavigate: (tab: ViewState) => void;
  onOpenInstallGuide: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface MenuItem {
  tab: ViewState;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badgeColor?: string;
  badgeText?: string;
  allowedRoles: UserRole[];
  allEmployeesCanView?: boolean;
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
  const todaySales = salesList.filter(s => s.date === todayStr);
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

  // Clean Menu Modules without stage numbers
  const menuItems: MenuItem[] = [
    {
      tab: 'role_management',
      title: 'Manajemen Pegawai & Role',
      subtitle: 'Akun Tim, Gaji & Skema Insentif Bundling/Satuan',
      icon: Users,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Tim & Akses',
      allowedRoles: ['owner'],
    },
    {
      tab: 'modal_stok',
      title: 'Modal & Stok Fashion (HPP)',
      subtitle: 'Input Ball/Grosir, Ongkir & HPP Otomatis',
      icon: Package,
      iconColor: 'text-emerald-400',
      badgeText: 'Modal Stok',
      allowedRoles: ['owner'],
    },
    {
      tab: 'steam_sortir',
      title: 'Sortir, QC & Finishing',
      subtitle: 'Pencatatan Pcs, Reject & Jasa Sortir',
      icon: Scissors,
      iconColor: 'text-teal-400',
      badgeText: 'Produksi',
      allowedRoles: ['owner', 'sortir', 'steam'],
    },
    {
      tab: 'admin_shopee',
      title: 'Biaya Admin Marketplace & Layanan',
      subtitle: 'Persentase Admin Platform & Biaya per Order',
      icon: Settings,
      iconColor: 'text-sky-400',
      badgeText: 'Biaya Platform',
      allowedRoles: ['owner'],
    },
    {
      tab: 'kehadiran',
      title: 'Presensi & Kehadiran Shift',
      subtitle: 'Absensi Shift & Jam Kerja Karyawan',
      icon: Clock,
      iconColor: 'text-blue-400',
      badgeText: 'Presensi',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'penjualan',
      title: 'Data Penjualan (Live & Non-Live)',
      subtitle: 'Input Satuan/Bundling, Marketplace & Toko',
      icon: TrendingUp,
      iconColor: 'text-[#FE2C55]',
      badgeText: 'Penjualan',
      allowedRoles: ['owner', 'admin_toko'],
    },
    {
      tab: 'statistik',
      title: 'Statistik & Analisis Penjualan',
      subtitle: 'Tren 7-30 Hari, Peringkat Top Host & Analisis',
      icon: BarChart3,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Visual Analytics',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'return',
      title: 'Data Retur / Paket Return',
      subtitle: 'Catatan & Estimasi Pengurangan Paket Retur',
      icon: RotateCcw,
      iconColor: 'text-rose-400',
      badgeText: 'Retur',
      allowedRoles: ['owner', 'admin_toko'],
    },
    {
      tab: 'iklan_koin',
      title: 'Saldo Biaya Iklan & Koin Live',
      subtitle: 'Topup, Pemakaian & Sisa Saldo Marketing',
      icon: Coins,
      iconColor: 'text-amber-400',
      badgeText: 'Marketing',
      allowedRoles: ['owner'],
    },
    {
      tab: 'gaji',
      title: 'Slip Gaji & Insentif Tim',
      subtitle: 'Rekap Gaji Pokok, Shift, Satuan & Bundling',
      icon: Receipt,
      iconColor: 'text-cyan-400',
      badgeText: 'Payroll',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'laba_rugi',
      title: 'Laporan Laba & Rugi Sesi',
      subtitle: 'Evaluasi Margin & Profit Bersih Tiap Sesi',
      icon: PieChart,
      iconColor: 'text-violet-400',
      badgeText: 'Analisis Sesi',
      allowedRoles: ['owner'],
    },
    {
      tab: 'cashflow',
      title: 'Cashflow & Arus Kas',
      subtitle: 'Pencatatan Penarikan Saldo & Pengeluaran Kas',
      icon: Wallet,
      iconColor: 'text-emerald-400',
      badgeText: 'Arus Kas',
      allowedRoles: ['owner'],
    },
    {
      tab: 'laba_bersih',
      title: 'Laporan Laba Bersih Toko',
      subtitle: 'Rekapitulasi Profit Akhir Setelah Beban',
      icon: Calculator,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Laba Akhir',
      allowedRoles: ['owner'],
    },
    {
      tab: 'index_performa',
      title: 'Indeks Performa & Efektivitas AI',
      subtitle: 'Penilaian Kinerja Pegawai dengan Kecerdasan AI',
      icon: Award,
      iconColor: 'text-amber-400',
      badgeText: 'AI Insights',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
  ];

  // Helper check permission
  const canAccess = (item: MenuItem) => {
    if (currentUser.isOwner) return true;
    if (item.allEmployeesCanView) return true;
    return currentUser.roles.some(r => item.allowedRoles.includes(r));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Top Banner / Store Overview */}
      <div className="rounded-3xl bg-[#161823] p-6 sm:p-7 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-semibold backdrop-blur-xs text-zinc-300 border border-white/10">
              <ShoppingBag className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>{store?.storeName || 'Fashion Store Official'}</span>
            </div>

            {/* Requirement 1: Greeting + Theme and Cloud icons adjacent to Halo Owner */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Halo, {currentUser.name}</span>
              </h2>

              {/* Theme & Cloud Quick Action Pills */}
              <div className="flex items-center gap-2">
                {/* Cloud Sync Button */}
                <button
                  id="btn-halo-cloud-sync"
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer shadow-xs active:scale-95"
                  title="Sinkronisasi Cloud Firestore"
                >
                  <Cloud className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span className="text-[11px]">Cloud</span>
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                </button>

                {/* Theme Palette Switcher */}
                <button
                  id="btn-halo-theme-switcher"
                  type="button"
                  onClick={() => setShowThemeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-xs"
                  title="Pilih Tema Warna Aplikasi"
                >
                  <Palette className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span className="text-[11px]">Tema Warna</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Sistem manajemen toko fashion, live streaming, multi-channel marketplace &amp; offline, HPP otomatis, serta penggajian host &amp; staf terintegrasi.
            </p>
          </div>

          <button
            id="btn-dashboard-install-guide"
            onClick={onOpenInstallGuide}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-[#25F4EE]/15 hover:bg-[#25F4EE]/25 text-[#25F4EE] font-bold px-4 py-2.5 rounded-2xl text-xs border border-[#25F4EE]/40 shadow-lg shadow-[#25F4EE]/10 transition active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#25F4EE]" />
            <span>Install di HP</span>
          </button>
        </div>

        {/* Live Key Metrics Grid (Requirement 2: Rata-rata HPP is placed right next to Omzet Hari Ini) */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Sisa Stok Layak Jual */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Stok Layak Jual</span>
              <Package className="w-3.5 h-3.5 text-[#25F4EE]" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-semibold text-zinc-400">pcs</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Terjual: {formatNumber(stockInfo.totalPcsSold)} pcs {stockInfo.totalPcsReject > 0 && `• Reject: ${formatNumber(stockInfo.totalPcsReject)}`}
            </div>
          </div>

          {/* 2. Sisa Saldo Iklan */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Saldo Iklan</span>
              <Coins className="w-3.5 h-3.5 text-[#25F4EE]" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
              Rp {formatNumber(adsCoinInfo.remainingAds)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Terpakai: Rp {formatNumber(adsCoinInfo.totalAdsUsed)}
            </div>
          </div>

          {/* 3. Sisa Saldo Koin Live */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Saldo Koin Live</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
              Rp {formatNumber(adsCoinInfo.remainingCoin)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Terpakai: Rp {formatNumber(adsCoinInfo.totalCoinUsed)}
            </div>
          </div>

          {/* 4. Omzet Hari Ini */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Omzet Hari Ini</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#FE2C55]" />
            </div>
            <div className="text-base sm:text-lg font-black text-[#FE2C55] mt-1 truncate">
              {formatRupiah(todayOmzet)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              {formatNumber(todayPcs)} pcs ({formatNumber(todayPackages)} paket)
            </div>
          </div>

          {/* 5. Rata-rata HPP Toko (Req 2: right next to Omzet Hari Ini) */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Rata-rata HPP</span>
              <Tag className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-[#25F4EE] mt-1 truncate">
              {formatRupiah(hppInfo.weightedAverageHpp)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Modal / pcs fashion
            </div>
          </div>
        </div>
      </div>

      {/* Main Integrated Modules Grid - Kotak-kotak kecil (Compact Square Grid) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#25F4EE]" />
            <span>Pusat Modul &amp; Menu Toko</span>
          </h3>
          <span className="text-[11px] font-bold text-zinc-300 bg-[#161823] px-3 py-1 rounded-full border border-white/10">
            {menuItems.length} Modul
          </span>
        </div>

        {/* Kotak-kotak kecil grid: 2 cols on mobile, 3 on tablet, 4 on md, 6 on lg/xl */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {menuItems.map((item) => {
            const accessible = canAccess(item);
            const Icon = item.icon;

            return (
              <button
                key={item.tab}
                id={`menu-card-${item.tab}`}
                type="button"
                onClick={() => {
                  if (accessible) {
                    onNavigate(item.tab);
                  } else {
                    onNotify?.('Akses menu ini dibatasi untuk peran Anda.', 'error');
                  }
                }}
                className={`text-center p-3.5 sm:p-4 rounded-2xl transition-all duration-200 relative overflow-hidden flex flex-col items-center justify-between gap-2.5 group border cursor-pointer min-h-[135px] sm:min-h-[145px] ${
                  accessible
                    ? 'bg-[#161823] hover:bg-[#1f2232] border-white/10 hover:border-[#25F4EE]/50 shadow-md hover:shadow-lg hover:shadow-[#25F4EE]/10 active:scale-95'
                    : 'bg-[#12141c]/60 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Top Badge or Lock */}
                <div className="w-full flex items-center justify-between">
                  {item.badgeText ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate max-w-[85%] ${
                        accessible
                          ? 'bg-white/5 text-zinc-300 border-white/10'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      {item.badgeText}
                    </span>
                  ) : <span />}

                  {!accessible && <Lock className="w-3 h-3 text-zinc-500 shrink-0" />}
                </div>

                {/* Centered Icon */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-[#0b0c10] border border-white/10 group-hover:scale-110 group-hover:border-[#25F4EE]/40 transition-transform shadow-inner ${
                    accessible ? item.iconColor : 'text-zinc-500'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Title */}
                <div className="w-full">
                  <h4 className="text-xs sm:text-xs font-bold text-white group-hover:text-[#25F4EE] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                </div>
              </button>
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
