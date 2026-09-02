import React, { useState, useMemo } from 'react';
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
  Percent
} from 'lucide-react';

interface StatistikViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
}

type PeriodRange = '7days' | '14days' | '30days' | 'this_month' | 'all';

export const StatistikView: React.FC<StatistikViewProps> = ({
  currentUser,
}) => {
  const [period, setPeriod] = useState<PeriodRange>('7days');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const salesList = StorageService.getSales(currentUser.storeId);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Filter & Period Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-white">Statistik &amp; Analisis Penjualan</span>
            <p className="text-[10px] text-zinc-400">Peringkat Host Live, Omzet, Volume Satuan &amp; Bundling</p>
          </div>
        </div>

        {/* Period Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                period === p.key
                  ? 'bg-gradient-to-r from-[#25F4EE] to-teal-400 text-[#0b0c10] shadow-md shadow-[#25F4EE]/20'
                  : 'bg-[#0b0c10] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Omzet */}
        <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
            <span>Total Omzet Penjualan</span>
            <TrendingUp className="w-4 h-4 text-[#25F4EE]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatRupiah(metrics.totalOmzet)}
          </div>
          <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-400 font-medium">
            <span className="text-[#FE2C55] font-bold">🔴 Live: {formatRupiah(metrics.liveOmzet)}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">🏪 Non-Live: {formatRupiah(metrics.nonLiveOmzet)}</span>
          </div>
        </div>

        {/* Total Pcs Terjual */}
        <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
            <span>Total Pcs Barang Terjual</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatNumber(metrics.totalPcs)} <span className="text-xs font-semibold text-zinc-400">pcs</span>
          </div>
          <div className="text-[10px] text-zinc-400 pt-1">
            Dari <strong className="text-zinc-200">{formatNumber(metrics.totalPackages)}</strong> paket / transaksi
          </div>
        </div>

        {/* Satuan vs Bundling */}
        <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
            <span>Satuan vs Bundling</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-sm font-black text-white mt-1">
            <span className="text-[#25F4EE]">🏷️ Satuan: {formatNumber(metrics.satuanPcs)} pcs</span>
          </div>
          <div className="text-xs font-bold text-amber-300">
            📦 Bundling: {formatNumber(metrics.bundlingPackages)} paket ({formatNumber(metrics.bundlingPcs)} pcs)
          </div>
        </div>

        {/* Produktivitas Live */}
        <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
            <span>Produktivitas Jam Live</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300">
            {formatRupiah(metrics.avgOmzetPerHour)} <span className="text-xs text-zinc-400 font-normal">/ jam</span>
          </div>
          <div className="text-[10px] text-zinc-400 pt-1">
            Rata-rata: <strong className="text-zinc-200">{metrics.avgPcsPerHour} pcs/jam live</strong>
          </div>
        </div>
      </div>

      {/* Main Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Grafik Tren Penjualan Harian</h3>
                <p className="text-[10px] text-zinc-400">Visualisasi omzet &amp; volume pesanan harian</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              {trendDays.length} Titik Data
            </span>
          </div>

          {/* Interactive Visual Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 bg-[#0b0c10] rounded-2xl border border-white/5 overflow-x-auto">
            {trendDays.map((day, idx) => {
              const heightPct = Math.max(12, Math.round((day.omzet / maxOmzet) * 100));
              const isToday = idx === trendDays.length - 1;

              return (
                <div key={day.dateStr} className="flex-1 min-w-[24px] flex flex-col items-center gap-1.5 h-full justify-end group relative">
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

          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
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

        {/* Top Host Leaderboard */}
        <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 flex items-center justify-center text-[#FE2C55]">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white">Peringkat Top Host Live</h3>
                  <p className="text-[10px] text-zinc-400">Total omzet &amp; produktivitas host</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[#25F4EE] border border-[#25F4EE]/30">
                {hostLeaderboard.length} Host Aktif
              </span>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {hostLeaderboard.length > 0 ? (
                hostLeaderboard.map((host, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={host.name}
                      className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between gap-3 hover:border-[#25F4EE]/30 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{medals[idx] || `#${idx + 1}`}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{host.name}</h4>
                          <p className="text-[10px] text-zinc-400">
                            {formatNumber(Math.round(host.pcs))} pcs • {host.sessions} sesi ({Math.round(host.hours)} jam)
                          </p>
                          <div className="text-[9px] text-zinc-500 mt-0.5">
                            Satuan: {formatNumber(Math.round(host.satuanPcs))} pcs | Bundling: {formatNumber(Math.round(host.bundlingPkgs))} paket
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-[#25F4EE]">
                          {formatRupiah(Math.round(host.omzet))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-zinc-500 bg-[#0b0c10] rounded-2xl border border-white/5">
                  Belum ada data penjualan host pada periode ini.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between text-xs mt-2">
            <span className="text-zinc-400">Rata-rata HPP Toko:</span>
            <strong className="text-[#25F4EE] font-black text-sm">
              {formatRupiah(hppInfo.weightedAverageHpp)} / pcs
            </strong>
          </div>
        </div>
      </div>

      {/* Channel Distribution Table & Satuan vs Bundling Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Channel Breakdown Card */}
        <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white">Kontribusi per Channel Penjualan</h3>
          </div>

          <div className="space-y-2 pt-1">
            {channelDistribution.length > 0 ? (
              channelDistribution.map(ch => {
                const pct = metrics.totalOmzet > 0 ? Math.round((ch.omzet / metrics.totalOmzet) * 100) : 0;
                return (
                  <div key={ch.label} className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">{ch.label}</span>
                      <span className="text-[#25F4EE]">{formatRupiah(ch.omzet)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#25F4EE] h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{formatNumber(ch.pcs)} pcs terjual</span>
                      <span>{formatNumber(ch.packages)} transaksi/paket</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-zinc-500">
                Belum ada data channel.
              </div>
            )}
          </div>
        </div>

        {/* Satuan vs Bundling Analysis Card */}
        <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white">Analisis Model Penjualan (Satuan vs Bundling)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Satuan Card */}
            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#25F4EE] bg-[#25F4EE]/10 px-2.5 py-0.5 rounded-full">
                🏷️ Penjualan Satuan
              </div>
              <div className="text-base font-black text-white">
                {formatRupiah(metrics.satuanOmzet)}
              </div>
              <div className="text-[10px] text-zinc-400 space-y-0.5">
                <div>Pcs: <strong className="text-zinc-200">{formatNumber(metrics.satuanPcs)} pcs</strong></div>
                <div>Paket: <strong className="text-zinc-200">{formatNumber(metrics.satuanPackages)} paket</strong></div>
              </div>
            </div>

            {/* Bundling Card */}
            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                📦 Penjualan Bundling
              </div>
              <div className="text-base font-black text-white">
                {formatRupiah(metrics.bundlingOmzet)}
              </div>
              <div className="text-[10px] text-zinc-400 space-y-0.5">
                <div>Paket: <strong className="text-zinc-200">{formatNumber(metrics.bundlingPackages)} paket</strong></div>
                <div>Isi Pcs: <strong className="text-zinc-200">{formatNumber(metrics.bundlingPcs)} pcs</strong></div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 text-[11px] text-zinc-400 leading-relaxed">
            💡 <strong>Rekomendasi Host:</strong> Penjualan bundling mempercepat perputaran volume stok, sedangkan penjualan satuan menjaga margin per pcs tetap tinggi.
          </div>
        </div>
      </div>
    </div>
  );
};
