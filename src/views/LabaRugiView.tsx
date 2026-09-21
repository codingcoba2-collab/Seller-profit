import React, { useState, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, PeriodFilter } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  Percent, 
  ShoppingCart, 
  RotateCcw, 
  Megaphone, 
  Coins, 
  Package, 
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';

interface LabaRugiViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
}

export const LabaRugiView: React.FC<LabaRugiViewProps> = ({
  currentUser,
  onBackToDashboard,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const store = StorageService.getStoreById(currentUser.storeId);
  const inventory = StorageService.getInventory(currentUser.storeId);
  const sales = StorageService.getSales(currentUser.storeId);
  const returns = StorageService.getReturns(currentUser.storeId);

  // Filter helper
  const filterByPeriod = (recordDate: string): boolean => {
    if (period === 'all') return true;
    if (!recordDate) return false;

    const targetDate = new Date(selectedDate);
    const recDate = new Date(recordDate);

    if (period === 'daily') {
      return recordDate === selectedDate;
    }
    if (period === 'weekly') {
      const diffTime = Math.abs(targetDate.getTime() - recDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (period === 'monthly') {
      return targetDate.getFullYear() === recDate.getFullYear() && targetDate.getMonth() === recDate.getMonth();
    }
    return true;
  };

  const calculation = useMemo(() => {
    const filteredInventory = inventory.filter(i => filterByPeriod(i.date));
    const filteredSales = sales.filter(s => filterByPeriod(s.date));
    const filteredReturns = returns.filter(r => filterByPeriod(r.date));

    // 1. Total Modal Ball & Keterangan
    const totalModalBall = filteredInventory.reduce((acc, curr) => acc + (curr.modalPrice || 0), 0);
    const totalIsiBall = filteredInventory.reduce((acc, curr) => acc + (curr.pcsCount || 0), 0);
    const ballDescriptions = filteredInventory.map(i => `${i.ballType} (${formatRupiah(i.modalPrice)})`).join(', ') || '-';

    // Rata-rata HPP terhitung dari inventory
    const totalHppPool = filteredInventory.reduce((acc, curr) => acc + (curr.hppPerPcs * curr.pcsCount), 0);
    const averageHpp = totalIsiBall > 0 ? Math.round(totalHppPool / totalIsiBall) : 20000;

    // 2. Data Penjualan Live
    const totalOmzetKotor = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalIsiTerjual = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
    const totalPaketTerjual = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
    const totalIklanTerpakai = filteredSales.reduce((acc, s) => acc + (s.adsUsed || 0), 0);
    const totalKoinTerpakai = filteredSales.reduce((acc, s) => acc + (s.coinUsed || 0), 0);

    // 3. Modal Barang Terjual = HPP x Isi Terjual
    const modalBarangTerjual = totalIsiTerjual * averageHpp;

    // 4. Biaya Admin & Layanan Dinamis per Channel
    const { totalAdminFee, totalServiceFee, channelBreakdown } = StorageService.calculateSalesAdminFees(currentUser.storeId, filteredSales);
    const channelList = Object.values(channelBreakdown);
    const effectiveAdminPct = totalOmzetKotor > 0 ? ((totalAdminFee / totalOmzetKotor) * 100).toFixed(1) : '0.0';

    // 5. Total Return (Estimasi vs Detail)
    let totalReturnAmount = 0;
    const isEstimate = store?.settings?.returnMechanism === 'estimate';
    const estimatePct = store?.settings?.estimateReturnPercentage ?? 3.0;

    if (isEstimate) {
      totalReturnAmount = Math.round((estimatePct / 100) * totalOmzetKotor);
    } else {
      totalReturnAmount = filteredReturns.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    }

    // 6. Omzet Bersih = Omzet Kotor - Modal Terjual - Admin Channel - Biaya Layanan - Iklan - Koin
    const omzetBersih = totalOmzetKotor - modalBarangTerjual - totalAdminFee - totalServiceFee - totalIklanTerpakai - totalKoinTerpakai;

    // 7. Laba Kotor = Omzet Bersih - Total Return
    const labaKotor = omzetBersih - totalReturnAmount;

    return {
      filteredInventory,
      totalModalBall,
      totalIsiBall,
      ballDescriptions,
      averageHpp,
      totalOmzetKotor,
      totalIsiTerjual,
      totalPaketTerjual,
      totalIklanTerpakai,
      totalKoinTerpakai,
      modalBarangTerjual,
      totalAdminFee,
      totalServiceFee,
      channelList,
      effectiveAdminPct,
      isEstimate,
      estimatePct,
      totalReturnAmount,
      omzetBersih,
      labaKotor,
    };
  }, [inventory, sales, returns, store, period, selectedDate, currentUser.storeId]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* Filter Periode */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#161823] p-3 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-300">Periode:</span>
          <div className="flex items-center gap-1">
            {(['daily', 'weekly', 'monthly', 'all'] as PeriodFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  period === p
                    ? 'bg-[#25F4EE] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p === 'daily' ? 'Per Hari' : p === 'weekly' ? '7 Hari' : p === 'monthly' ? 'Bulan Ini' : 'Semua'}
              </button>
            ))}
          </div>
        </div>

        {period !== 'all' && (
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-[#0b0c10] text-white font-medium focus:border-[#25F4EE]"
          />
        )}
      </div>

      {/* Laba Kotor Hero Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#161823] text-white border border-white/10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Total Laba Kotor Sesi Live</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${calculation.labaKotor >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(calculation.labaKotor)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/10 space-y-1.5 min-w-[180px]">
            <div className="text-[10px] text-zinc-400 font-semibold">Omzet Kotor Live:</div>
            <div className="text-base font-black text-white">
              {formatRupiah(calculation.totalOmzetKotor)}
            </div>
            <div className="text-[10px] text-zinc-400 pt-1.5 border-t border-white/10">
              Volume: <strong className="text-white">{formatNumber(calculation.totalIsiTerjual)} pcs</strong> ({formatNumber(calculation.totalPaketTerjual)} paket)
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Komponen Laba Rugi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Kolom 1: Pendapatan & Modal */}
        <div className="bg-[#161823] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-[#25F4EE]" />
            <span>1. Pendapatan &amp; Modal Barang Terjual</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
              <span className="text-zinc-400">Total Omzet Kotor Penjualan:</span>
              <strong className="text-white font-black text-sm">{formatRupiah(calculation.totalOmzetKotor)}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Modal Barang Terjual (HPP):</span>
                <strong className="text-[#FE2C55] font-bold">{formatRupiah(calculation.modalBarangTerjual)}</strong>
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                <span>Rata-rata HPP per pcs:</span>
                <span>{formatRupiah(calculation.averageHpp)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Modal Ball Terdaftar:</span>
                <strong className="text-zinc-200">{formatRupiah(calculation.totalModalBall)}</strong>
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Ball: {calculation.ballDescriptions}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Biaya & Potongan Channel Marketplace */}
        <div className="bg-[#161823] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#FE2C55]" />
              <span>2. Potongan Biaya Admin Channel &amp; Promosi</span>
            </h3>
            <span className="text-[10px] text-[#25F4EE] font-bold px-2 py-0.5 rounded-md bg-[#25F4EE]/10 border border-[#25F4EE]/20">
              Rata-rata: {calculation.effectiveAdminPct}%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Potongan Admin Channel:</span>
                <strong className="text-[#FE2C55] font-bold">{formatRupiah(calculation.totalAdminFee)}</strong>
              </div>

              {/* Rincian per Channel (Shopee, TikTok, Offline, dll) */}
              {calculation.channelList.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                    Rincian Channel Terpakai:
                  </span>
                  {calculation.channelList.map(ch => (
                    <div key={ch.channelKey} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300 font-medium">
                        {ch.name} <span className="text-zinc-500">({ch.adminPercentage}%)</span>:
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-rose-400">{formatRupiah(ch.adminFee)}</span>
                        <span className="text-[10px] text-zinc-500 ml-1.5">(Omzet: {formatRupiah(ch.omzet)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Biaya Layanan Pesanan:</span>
                <strong className="text-[#FE2C55] font-bold">{formatRupiah(calculation.totalServiceFee)}</strong>
              </div>
              {calculation.channelList.length > 0 && (
                <div className="pt-1.5 border-t border-white/5 space-y-1 text-[11px]">
                  {calculation.channelList.map(ch => (
                    <div key={ch.channelKey} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">{ch.name} ({ch.serviceFeePerOrder === 0 ? 'Rp 0' : `${formatRupiah(ch.serviceFeePerOrder)}/paket`}):</span>
                      <span className="text-zinc-300 font-semibold">{formatRupiah(ch.serviceFee)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
              <span className="text-zinc-400">Penggunaan Iklan (Ads) &amp; Koin:</span>
              <strong className="text-[#FE2C55] font-bold">
                {formatRupiah(calculation.totalIklanTerpakai + calculation.totalKoinTerpakai)}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
              <span className="text-zinc-400">
                Pengurangan Retur Paket ({calculation.isEstimate ? `Estimasi ${calculation.estimatePct}%` : 'Riwayat Aktual'}):
              </span>
              <strong className="text-[#FE2C55] font-bold">{formatRupiah(calculation.totalReturnAmount)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
