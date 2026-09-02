import React, { useMemo } from 'react';
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
  Flame,
  ArrowUpRight,
  TrendingDown,
  BarChart3,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onNavigate: (tab: ViewState) => void;
  onOpenInstallGuide: () => void;
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
}) => {
  const store = StorageService.getStoreById(currentUser.storeId);
  const stockInfo = StorageService.calculateStock(currentUser.storeId);
  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);
  const hppInfo = StorageService.calculateHPP(currentUser.storeId);
  const salesList = StorageService.getSales(currentUser.storeId);
  const employees = StorageService.getEmployees(currentUser.storeId);
  const cashflowList = StorageService.getCashflow(currentUser.storeId);

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = salesList.filter(s => s.date === todayStr);
  const todayOmzet = todaySales.reduce((acc, curr) => acc + (curr.omzet || 0), 0);
  const todayPcs = todaySales.reduce((acc, curr) => acc + (curr.pcsSold || 0), 0);
  const todayPackages = todaySales.reduce((acc, curr) => acc + (curr.packagesSold || 0), 0);

  // 7-day revenue trend data for Visual Statistics (Requirement 11)
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const daySales = salesList.filter(s => s.date === dateStr);
      const omzet = daySales.reduce((acc, s) => acc + (s.omzet || 0), 0);
      const pcs = daySales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
      days.push({ dateStr, dayName, omzet, pcs });
    }
    return days;
  }, [salesList]);

  const maxOmzet = Math.max(...last7DaysData.map(d => d.omzet), 1000000);

  // Top Host Leaderboard for Visual Statistics (Requirement 11)
  const topHosts = useMemo(() => {
    const hostMap: Record<string, { name: string; omzet: number; pcs: number; sessions: number }> = {};
    
    salesList.forEach(s => {
      if (s.hostNames && s.hostNames.length > 0) {
        s.hostNames.forEach(name => {
          if (!hostMap[name]) hostMap[name] = { name, omzet: 0, pcs: 0, sessions: 0 };
          hostMap[name].omzet += (s.omzet || 0) / s.hostNames.length;
          hostMap[name].pcs += (s.pcsSold || 0) / s.hostNames.length;
          hostMap[name].sessions += 1;
        });
      }
    });

    return Object.values(hostMap)
      .sort((a, b) => b.omzet - a.omzet)
      .slice(0, 3);
  }, [salesList]);

  // Clean Menu Modules without stage numbers (Requirement 5)
  const menuItems: MenuItem[] = [
    {
      tab: 'role_management',
      title: 'Manajemen Pegawai & Role',
      subtitle: 'Akun Tim, Gaji & Skema Insentif',
      icon: Users,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Tim & Akses',
      allowedRoles: ['owner'],
    },
    {
      tab: 'modal_stok',
      title: 'Modal & Stok Ball (HPP)',
      subtitle: 'Input Ball, Ongkir & HPP Otomatis',
      icon: Package,
      iconColor: 'text-emerald-400',
      badgeText: 'Modal Stok',
      allowedRoles: ['owner'],
    },
    {
      tab: 'steam_sortir',
      title: 'Sortir & Steam Ball',
      subtitle: 'Pencatatan Pcs, Reject & Jasa Sortir',
      icon: Scissors,
      iconColor: 'text-teal-400',
      badgeText: 'Produksi',
      allowedRoles: ['owner', 'sortir', 'steam'],
    },
    {
      tab: 'admin_shopee',
      title: 'Biaya Admin Shopee & Layanan',
      subtitle: 'Persentase Admin & Biaya per Order',
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
      title: 'Penjualan Host Live',
      subtitle: 'Input Omzet, Pcs, Paket & Admin Live',
      icon: TrendingUp,
      iconColor: 'text-[#FE2C55]',
      badgeText: 'Shopee Live',
      allowedRoles: ['owner', 'admin_toko'],
    },
    {
      tab: 'return',
      title: 'Data Retur / Paket Return',
      subtitle: 'Catatan & Estimasi Paket Retur',
      icon: RotateCcw,
      iconColor: 'text-rose-400',
      badgeText: 'Retur',
      allowedRoles: ['owner', 'admin_toko'],
    },
    {
      tab: 'iklan_koin',
      title: 'Saldo Iklan & Koin Shopee',
      subtitle: 'Topup, Pemakaian & Sisa Saldo Ads',
      icon: Coins,
      iconColor: 'text-amber-400',
      badgeText: 'Marketing',
      allowedRoles: ['owner'],
    },
    {
      tab: 'gaji',
      title: 'Slip Gaji & Insentif Tim',
      subtitle: 'Rekap Gaji Pokok, Shift & Komisi Live',
      icon: Receipt,
      iconColor: 'text-cyan-400',
      badgeText: 'Payroll',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'laba_rugi',
      title: 'Laporan Laba & Rugi Live',
      subtitle: 'Evaluasi Profit Bersih Tiap Sesi',
      icon: PieChart,
      iconColor: 'text-violet-400',
      badgeText: 'Analisis Sesi',
      allowedRoles: ['owner'],
    },
    {
      tab: 'cashflow',
      title: 'Cashflow & Arus Kas',
      subtitle: 'Pencatatan Penarikan Saldo & Beban Kas',
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
      title: 'Indeks Performa Tim',
      subtitle: 'Peringkat KPI & Evaluasi Kinerja',
      icon: Award,
      iconColor: 'text-amber-400',
      badgeText: 'Leaderboard',
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
      {/* Top Banner / Store Overview (TikTok Dark Style) */}
      <div className="rounded-3xl bg-[#161823] p-6 sm:p-7 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* TikTok Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-semibold backdrop-blur-xs text-zinc-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>{store?.storeName || 'Fashion Thrift Official'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Halo, {currentUser.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Dashboard sistem akuntansi Shopee Live, HPP modal ball, gaji shift host, komisi admin, dan laba rugi real-time.
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

        {/* Live Key Metrics Grid */}
        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Stok Barang</span>
              <Package className="w-3.5 h-3.5 text-[#25F4EE]" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-semibold text-zinc-400">pcs</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Terjual: {formatNumber(stockInfo.totalPcsSold)} pcs
            </div>
          </div>

          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Saldo Iklan</span>
              <Coins className="w-3.5 h-3.5 text-[#25F4EE]" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              Rp {formatNumber(adsCoinInfo.remainingAds)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Terpakai: Rp {formatNumber(adsCoinInfo.totalAdsUsed)}
            </div>
          </div>

          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Saldo Koin</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              Rp {formatNumber(adsCoinInfo.remainingCoin)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Terpakai: Rp {formatNumber(adsCoinInfo.totalCoinUsed)}
            </div>
          </div>

          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Omzet Hari Ini</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#FE2C55]" />
            </div>
            <div className="text-base sm:text-lg font-black text-[#FE2C55] mt-1">
              {formatRupiah(todayOmzet)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {formatNumber(todayPcs)} pcs ({formatNumber(todayPackages)} paket)
            </div>
          </div>
        </div>
      </div>

      {/* Visual Statistics Dashboard Section (Requirement 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 7-Days Revenue & Sales Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Statistik Tren Penjualan 7 Hari Terakhir</h3>
                <p className="text-[10px] text-zinc-400">Omzet live & volume pcs barang terjual</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              Live Tracker
            </span>
          </div>

          {/* Interactive Visual Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 bg-[#0b0c10] rounded-2xl border border-white/5">
            {last7DaysData.map((day, idx) => {
              const heightPct = Math.max(12, Math.round((day.omzet / maxOmzet) * 100));
              const isToday = idx === 6;

              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded-lg border border-white/20 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    <div className="font-bold text-[#25F4EE]">{formatRupiah(day.omzet)}</div>
                    <div className="text-zinc-400">{day.pcs} pcs terjual</div>
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[32px] rounded-t-lg bg-zinc-800 relative flex items-end overflow-hidden" style={{ height: `${heightPct}%` }}>
                    <div 
                      className={`w-full h-full rounded-t-lg transition-all duration-300 ${
                        isToday 
                          ? 'bg-gradient-to-t from-[#FE2C55] to-[#25F4EE] opacity-100 shadow-[0_0_12px_rgba(37,244,238,0.5)]' 
                          : day.omzet > 0 
                            ? 'bg-[#25F4EE] opacity-80 group-hover:opacity-100' 
                            : 'bg-zinc-800'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span className={`text-[10px] font-bold ${isToday ? 'text-[#25F4EE]' : 'text-zinc-500'}`}>
                    {isToday ? 'Hari ini' : day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25F4EE]" />
              <span>Omzet Terverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55]" />
              <span>Puncak Live</span>
            </div>
          </div>
        </div>

        {/* Top Host Leaderboard Widget */}
        <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 flex items-center justify-center text-[#FE2C55]">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white">Top Host Live</h3>
                  <p className="text-[10px] text-zinc-400">Peringkat penjualan tertinggi</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('index_performa')}
                className="text-[10px] font-bold text-[#25F4EE] hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5">
              {topHosts.length > 0 ? (
                topHosts.map((host, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={host.name}
                      className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between gap-3 hover:border-[#25F4EE]/30 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{medals[idx]}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{host.name}</h4>
                          <p className="text-[10px] text-zinc-400">
                            {formatNumber(host.pcs)} pcs • {host.sessions} sesi
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-[#25F4EE]">
                          {formatRupiah(host.omzet)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-zinc-500 bg-[#0b0c10] rounded-2xl border border-white/5">
                  Belum ada data penjualan host.
                </div>
              )}
            </div>
          </div>

          {/* Quick HPP Summary */}
          <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between text-xs mt-2">
            <span className="text-zinc-400">Rata-rata HPP per Pcs:</span>
            <strong className="text-white font-black text-sm text-[#25F4EE]">
              {formatRupiah(hppInfo.weightedAverageHpp)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Integrated Modules Grid (Requirement 5 & 10) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#25F4EE]" />
            <span>Modul Akuntansi &amp; Toko</span>
          </h3>
          <span className="text-[11px] font-bold text-zinc-300 bg-[#161823] px-3 py-1 rounded-full border border-white/10">
            {menuItems.length} Modul Terintegrasi
          </span>
        </div>

        {/* 4 columns on lg, 3 on md, 2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {menuItems.map(item => {
            const accessible = canAccess(item);
            const isReturnDisabled = item.tab === 'return' && store?.settings?.returnMechanism === 'estimate';

            return (
              <button
                key={item.tab}
                id={`btn-menu-${item.tab}`}
                disabled={!accessible || isReturnDisabled}
                onClick={() => onNavigate(item.tab)}
                className={`group text-left p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between tiktok-card-hover ${
                  accessible && !isReturnDisabled
                    ? 'bg-[#161823] border-white/10 hover:border-[#25F4EE]/40 shadow-lg cursor-pointer'
                    : 'bg-[#161823]/40 border-white/5 opacity-40 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-white/10 shrink-0 group-hover:border-[#25F4EE]/50 transition">
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    {item.badgeText && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 group-hover:text-[#25F4EE] group-hover:border-[#25F4EE]/30 transition">
                        {item.badgeText}
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-xs sm:text-sm text-white leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-1 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{accessible ? 'Buka Modul' : 'Terkunci'}</span>
                  {accessible ? (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#25F4EE] group-hover:translate-x-0.5 transition" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
