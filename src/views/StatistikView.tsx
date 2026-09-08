import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, SalesRecord, FashionCategory, SalesChannel } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, salesChannelLabels, fashionCategoryLabels } from '../utils/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Layers, 
  Calendar, 
  Award, 
  Package, 
  Video, 
  Store, 
  ShoppingBag, 
  PieChart, 
  ArrowUpRight, 
  Sparkles,
  Users,
  Clock,
  Coins,
  Percent,
  ArrowLeft
} from 'lucide-react';

interface StatistikViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
}

type PeriodRange = '7days' | '14days' | '30days' | 'this_month' | 'all';
type StatistikSubView = 'menu' | 'grafik' | 'top_host' | 'channel' | 'satuan_vs_bundling';

export const StatistikView: React.FC<StatistikViewProps> = ({
  currentUser,
  onBackToDashboard,
}) => {
  const [activeSubView, setActiveSubView] = useState<StatistikSubView>('menu');
  const [period, setPeriod] = useState<PeriodRange>('30days');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [salesList, setSalesList] = useState<SalesRecord[]>(() => StorageService.getSales(currentUser.storeId));

  useEffect(() => {
    setSalesList(StorageService.getSales(currentUser.storeId));
    const unsub = StorageService.subscribe((col) => {
      if (col === 'sales') {
        setSalesList(StorageService.getSales(currentUser.storeId));
      }
    });
    return unsub;
  }, [currentUser.storeId]);

  const employees = StorageService.getEmployees(currentUser.storeId);
  const stockInfo = StorageService.calculateStock(currentUser.storeId);
  const hppInfo = StorageService.calculateHPP(currentUser.storeId);

  // Filter sales based on period, category, channel
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return salesList.filter(s => {
      // Category filter
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

      // Channel filter
      if (channelFilter !== 'all' && s.salesChannel !== channelFilter) return false;

      // Period filter
      if (period === '7days') {
        const d = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return s.date >= d && s.date <= todayStr;
      }
      if (period === '14days') {
        const d = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
        return s.date >= d && s.date <= todayStr;
      }
      if (period === '30days') {
        const d = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        return s.date >= d && s.date <= todayStr;
      }
      if (period === 'this_month') {
        const curMonth = todayStr.slice(0, 7);
        return s.date.startsWith(curMonth);
      }
      return true;
    });
  }, [salesList, period, categoryFilter, channelFilter]);

  // Aggregate Key Metrics
  const metrics = useMemo(() => {
    const totalOmzet = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalPcs = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
    const totalPackages = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
    const totalAds = filteredSales.reduce((acc, s) => acc + (s.adsUsed || 0), 0);
    const totalCoin = filteredSales.reduce((acc, s) => acc + (s.coinUsed || 0), 0);

    const liveSales = filteredSales.filter(s => s.salesType === 'live' || !s.salesType);
    const nonLiveSales = filteredSales.filter(s => s.salesType === 'non_live');

    const liveOmzet = liveSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const livePcs = liveSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
    const livePackages = liveSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
    const liveHours = liveSales.reduce((acc, s) => acc + (s.hoursWorked || 0), 0);

    const nonLiveOmzet = nonLiveSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const nonLivePcs = nonLiveSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
    const nonLivePackages = nonLiveSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);

    // Satuan vs Bundling Breakdown
    let satuanOmzet = 0;
    let satuanPcs = 0;
    let satuanPackages = 0;
    let bundlingOmzet = 0;
    let bundlingPcs = 0;
    let bundlingPackages = 0;

    filteredSales.forEach(s => {
      if (s.saleFormat === 'bundling') {
        bundlingOmzet += (s.omzet || 0);
        bundlingPcs += (s.pcsSold || 0);
        bundlingPackages += (s.packagesSold || 0);
      } else if (s.saleFormat === 'campuran') {
        satuanOmzet += (s.satuanOmzet || 0);
        satuanPcs += (s.satuanPcs || 0);
        satuanPackages += (s.satuanPackages || 0);
        bundlingOmzet += (s.bundlingOmzet || 0);
        bundlingPcs += (s.bundlingPcs || 0);
        bundlingPackages += (s.bundlingPackages || 0);
      } else {
        satuanOmzet += (s.omzet || 0);
        satuanPcs += (s.pcsSold || 0);
        satuanPackages += (s.packagesSold || 0);
      }
    });

    const avgBasketSize = totalPackages > 0 ? Math.round(totalOmzet / totalPackages) : 0;
    const avgOmzetPerHour = liveHours > 0 ? Math.round(liveOmzet / liveHours) : 0;
    const avgPcsPerHour = liveHours > 0 ? (livePcs / liveHours).toFixed(1) : '0';

    return {
      totalOmzet,
      totalPcs,
      totalPackages,
      totalAds,
      totalCoin,
      liveCount: liveSales.length,
      liveOmzet,
      livePcs,
      livePackages,
      liveHours,
      nonLiveCount: nonLiveSales.length,
      nonLiveOmzet,
      nonLivePcs,
      nonLivePackages,
      satuanOmzet,
      satuanPcs,
      satuanPackages,
      bundlingOmzet,
      bundlingPcs,
      bundlingPackages,
      avgBasketSize,
      avgOmzetPerHour,
      avgPcsPerHour,
      totalTransactions: filteredSales.length,
    };
  }, [filteredSales]);

  // Chart data: Day by Day breakdown based on period
  const trendDays = useMemo(() => {
    let daysCount = 7;
    if (period === '14days') daysCount = 14;
    if (period === '30days') daysCount = 30;
    if (period === 'this_month') {
      const now = new Date();
      daysCount = now.getDate();
    }
    if (period === 'all') daysCount = 14; // default sample for all

    const days = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const daySales = filteredSales.filter(s => s.date === dateStr);
      const omzet = daySales.reduce((acc, s) => acc + (s.omzet || 0), 0);
      const pcs = daySales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
      const packages = daySales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
      days.push({ dateStr, dayName, omzet, pcs, packages, count: daySales.length });
    }
    return days;
  }, [filteredSales, period]);

  const maxOmzet = Math.max(...trendDays.map(d => d.omzet), 1000000);

  // Top Host Live Leaderboard
  const hostLeaderboard = useMemo(() => {
    const hostMap: Record<string, { 
      name: string; 
      omzet: number; 
      pcs: number; 
      packages: number; 
      sessions: number; 
      hours: number;
      satuanPcs: number;
      bundlingPkgs: number;
    }> = {};

    filteredSales.forEach(s => {
      if (s.hostNames && s.hostNames.length > 0) {
        const split = s.hostNames.length;
        s.hostNames.forEach(name => {
          if (!hostMap[name]) {
            hostMap[name] = { 
              name, 
              omzet: 0, 
              pcs: 0, 
              packages: 0, 
              sessions: 0, 
              hours: 0,
              satuanPcs: 0,
              bundlingPkgs: 0,
            };
          }
          hostMap[name].omzet += (s.omzet || 0) / split;
          hostMap[name].pcs += (s.pcsSold || 0) / split;
          hostMap[name].packages += (s.packagesSold || 0) / split;
          hostMap[name].sessions += 1;
          hostMap[name].hours += (s.hoursWorked || 4) / split;
          
          if (s.saleFormat === 'bundling') {
            hostMap[name].bundlingPkgs += (s.packagesSold || 0) / split;
          } else if (s.saleFormat === 'campuran') {
            hostMap[name].satuanPcs += (s.satuanPcs || 0) / split;
            hostMap[name].bundlingPkgs += (s.bundlingPackages || 0) / split;
          } else {
            hostMap[name].satuanPcs += (s.pcsSold || 0) / split;
          }
        });
      }
    });

    return Object.values(hostMap).sort((a, b) => b.omzet - a.omzet);
  }, [filteredSales]);

  // Channel Breakdown
  const channelDistribution = useMemo(() => {
    const map: Record<string, { label: string; omzet: number; pcs: number; packages: number }> = {};
    
    filteredSales.forEach(s => {
      const ch = s.salesChannel || 'shopee_live';
      const label = s.channelName || salesChannelLabels[ch as SalesChannel] || ch;
      if (!map[ch]) map[ch] = { label, omzet: 0, pcs: 0, packages: 0 };
      map[ch].omzet += (s.omzet || 0);
      map[ch].pcs += (s.pcsSold || 0);
      map[ch].packages += (s.packagesSold || 0);
    });

    return Object.values(map).sort((a, b) => b.omzet - a.omzet);
  }, [filteredSales]);

  // MENU UTAMA STATISTIK & ANALISIS (Pilihan 4 Menu dalam Grid 2 ke Samping)
  if (activeSubView === 'menu') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-statistik"
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#25F4EE]" />
                <span>Statistik &amp; Analisis Penjualan</span>
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            Total Omzet: <strong className="text-[#25F4EE]">{formatRupiah(metrics.totalOmzet)}</strong>
          </div>
        </div>

        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Omzet</div>
            <div className="text-sm sm:text-base font-black text-white truncate">{formatRupiah(metrics.totalOmzet)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Pcs Terjual</div>
            <div className="text-sm sm:text-base font-black text-[#25F4EE] truncate">{formatNumber(metrics.totalPcs)} pcs</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Paket</div>
            <div className="text-sm sm:text-base font-black text-white truncate">{formatNumber(metrics.totalPackages)} paket</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Omzet/Jam Live</div>
            <div className="text-sm sm:text-base font-black text-amber-300 truncate">{formatRupiah(metrics.avgOmzetPerHour)}/jam</div>
          </div>
        </div>

        {/* Pilihan 4 Menu Output: Grid Kecil 2 Kesamping, Sisanya ke Bawah */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Modul Analisis:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* 1. Grafik Tren Penjualan */}
            <div
              id="menu-stat-grafik"
              onClick={() => setActiveSubView('grafik')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors truncate">
                    Grafik Tren Penjualan
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                    Tren omzet harian &amp; volume pesanan
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Lihat visual grafik →</span>
                <span className="text-[#25F4EE] font-bold">Buka</span>
              </div>
            </div>

            {/* 2. Peringkat Top Host */}
            <div
              id="menu-stat-top-host"
              onClick={() => setActiveSubView('top_host')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors truncate">
                    Peringkat Top Host
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                    Leaderboard omzet, jam &amp; pcs host
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{hostLeaderboard.length} Host aktif →</span>
                <span className="text-[#FE2C55] font-bold">Buka</span>
              </div>
            </div>

            {/* 3. Kontribusi Channel */}
            <div
              id="menu-stat-channel"
              onClick={() => setActiveSubView('channel')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-sky-400/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-sky-300 transition-colors truncate">
                    Kontribusi Channel
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                    Pangsa TikTok, Shopee &amp; Offline
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Pangsa pasar penjualan →</span>
                <span className="text-sky-400 font-bold">Buka</span>
              </div>
            </div>

            {/* 4. Analisis Satuan vs Bundling */}
            <div
              id="menu-stat-satuan-bundling"
              onClick={() => setActiveSubView('satuan_vs_bundling')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-purple-400/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-300 transition-colors truncate">
                    Satuan vs Bundling
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                    Perbandingan paket vs eceran
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Rasio penjualan produk →</span>
                <span className="text-purple-400 font-bold">Buka</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HEADER SUB-VIEW DETAIL DENGAN TOMBOL BACK KE MENU STATISTIK
  const SubHeader = ({ title, icon: Icon, color = 'text-[#25F4EE]' }: { title: string; icon: any; color?: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubView('menu')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          title="Kembali ke Menu Statistik"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Menu Statistik</span>
        </button>
        <span className={`text-xs sm:text-sm font-black text-white flex items-center gap-1.5 px-1`}>
          <Icon className={`w-4 h-4 ${color}`} />
          <span>{title}</span>
        </span>
      </div>

      {/* Period Filter Selector */}
      <div className="flex items-center gap-1 overflow-x-auto self-start sm:self-auto bg-[#0b0c10] p-1 rounded-xl border border-white/10">
        {[
          { key: '7days', label: '7 Hari' },
          { key: '14days', label: '14 Hari' },
          { key: '30days', label: '30 Hari' },
          { key: 'this_month', label: 'Bulan Ini' },
          { key: 'all', label: 'Semua' },
        ].map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key as PeriodRange)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              period === p.key
                ? 'bg-white text-zinc-950 shadow-sm font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* 1. HALAMAN KHUSUS: GRAFIK TREN PENJUALAN */}
      {activeSubView === 'grafik' && (
        <>
          <SubHeader title="Grafik Tren Penjualan Harian" icon={BarChart3} color="text-[#25F4EE]" />

          <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Visualisasi Omzet &amp; Pesanan</h3>
                <p className="text-xs text-zinc-400">Tren penjualan per hari berdasarkan periode yang dipilih</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white/5 text-[#25F4EE] border border-white/10">
                {trendDays.length} Hari Data
              </span>
            </div>

            {/* Interactive Visual Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-2 pt-8 px-3 bg-[#0b0c10] rounded-2xl border border-white/5 overflow-x-auto">
              {trendDays.map((day, idx) => {
                const heightPct = Math.max(12, Math.round((day.omzet / maxOmzet) * 100));
                const isToday = idx === trendDays.length - 1;

                return (
                  <div key={day.dateStr} className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/95 text-white text-[10px] px-2.5 py-1.5 rounded-xl border border-white/20 pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                      <div className="font-extrabold text-[#25F4EE]">{formatRupiah(day.omzet)}</div>
                      <div className="text-zinc-300">{day.pcs} pcs • {day.packages} paket</div>
                      <div className="text-[9px] text-zinc-500">{formatDateIndo(day.dateStr)}</div>
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[36px] rounded-t-xl bg-zinc-800 relative flex items-end overflow-hidden" style={{ height: `${heightPct}%` }}>
                      <div 
                        className={`w-full h-full rounded-t-xl transition-all duration-300 ${
                          isToday 
                            ? 'bg-gradient-to-t from-[#FE2C55] to-[#25F4EE] opacity-100 shadow-[0_0_12px_rgba(37,244,238,0.5)]' 
                            : day.omzet > 0 
                              ? 'bg-[#25F4EE] opacity-80 group-hover:opacity-100' 
                              : 'bg-zinc-800'
                        }`}
                      />
                    </div>

                    {/* Label */}
                    <span className={`text-[10px] font-bold truncate max-w-[32px] text-center ${isToday ? 'text-[#25F4EE]' : 'text-zinc-500'}`}>
                      {isToday ? 'Kini' : day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25F4EE]" />
                <span>Omzet Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55]" />
                <span>Puncak Live Streaming</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. HALAMAN KHUSUS: PERINGKAT TOP HOST */}
      {activeSubView === 'top_host' && (
        <>
          <SubHeader title="Peringkat Top Host Live Streaming" icon={Flame} color="text-[#FE2C55]" />

          <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Leaderboard Kinerja Host</h3>
                <p className="text-xs text-zinc-400">Peringkat berdasarkan omzet penjualan live streaming</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white/5 text-[#FE2C55] border border-white/10">
                {hostLeaderboard.length} Host Tercatat
              </span>
            </div>

            <div className="space-y-2.5">
              {hostLeaderboard.length > 0 ? (
                hostLeaderboard.map((host, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={host.name}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between gap-3 hover:border-[#25F4EE]/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{medals[idx] || `#${idx + 1}`}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{host.name}</h4>
                          <p className="text-xs text-zinc-400">
                            {formatNumber(Math.round(host.pcs))} pcs • {host.sessions} sesi ({Math.round(host.hours)} jam)
                          </p>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Satuan: {formatNumber(Math.round(host.satuanPcs))} pcs | Bundling: {formatNumber(Math.round(host.bundlingPkgs))} paket
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-[#25F4EE]">
                          {formatRupiah(Math.round(host.omzet))}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {host.hours > 0 ? formatRupiah(Math.round(host.omzet / host.hours)) : 0}/jam
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-zinc-500 bg-[#0b0c10] rounded-2xl border border-white/5">
                  Belum ada data penjualan host pada rentang waktu ini.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. HALAMAN KHUSUS: KONTRIBUSI CHANNEL */}
      {activeSubView === 'channel' && (
        <>
          <SubHeader title="Kontribusi per Channel Penjualan" icon={ShoppingBag} color="text-sky-400" />

          <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Distribusi Omzet Kanal Penjualan</h3>
              <p className="text-xs text-zinc-400">Perbandingan kontribusi dari TikTok Shop, Shopee Live, Tokopedia, dan Offline</p>
            </div>

            <div className="space-y-3 pt-1">
              {channelDistribution.length > 0 ? (
                channelDistribution.map(ch => {
                  const pct = metrics.totalOmzet > 0 ? Math.round((ch.omzet / metrics.totalOmzet) * 100) : 0;
                  return (
                    <div key={ch.label} className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-white">{ch.label}</span>
                        <span className="text-[#25F4EE]">{formatRupiah(ch.omzet)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#25F4EE] h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{formatNumber(ch.pcs)} pcs terjual</span>
                        <span>{formatNumber(ch.packages)} transaksi/paket</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-zinc-500 bg-[#0b0c10] rounded-2xl border border-white/5">
                  Belum ada data transaksi channel pada periode ini.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 4. HALAMAN KHUSUS: ANALISIS SATUAN VS BUNDLING */}
      {activeSubView === 'satuan_vs_bundling' && (
        <>
          <SubHeader title="Analisis Format Penjualan (Satuan vs Bundling)" icon={Layers} color="text-purple-400" />

          <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Perbandingan Model Penjualan</h3>
              <p className="text-xs text-zinc-400">Evaluasi efektivitas transaksi bundling paket terhadap eceran satuan</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Satuan Card */}
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2.5">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-[#25F4EE] bg-[#25F4EE]/10 px-3 py-1 rounded-full">
                  🏷️ Penjualan Satuan
                </div>
                <div className="text-xl font-black text-white">
                  {formatRupiah(metrics.satuanOmzet)}
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Volume Terjual: <strong className="text-zinc-200">{formatNumber(metrics.satuanPcs)} pcs</strong></div>
                  <div>Jumlah Transaksi: <strong className="text-zinc-200">{formatNumber(metrics.satuanPackages)} paket</strong></div>
                </div>
              </div>

              {/* Bundling Card */}
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2.5">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full">
                  📦 Penjualan Bundling
                </div>
                <div className="text-xl font-black text-white">
                  {formatRupiah(metrics.bundlingOmzet)}
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Paket Bundling: <strong className="text-zinc-200">{formatNumber(metrics.bundlingPackages)} paket</strong></div>
                  <div>Isi Total Pcs: <strong className="text-zinc-200">{formatNumber(metrics.bundlingPcs)} pcs</strong></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 text-xs text-zinc-400 leading-relaxed">
              💡 <strong>Rekomendasi Host &amp; Toko:</strong> Penjualan bundling mempercepat perputaran volume stok gudang dan menekan ongkir, sedangkan penjualan satuan menjaga margin profit per pcs tetap maksimal.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
