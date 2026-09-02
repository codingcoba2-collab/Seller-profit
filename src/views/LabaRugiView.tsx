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
  ArrowLeft,
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

    // 4. Total Admin Shopee = Promo % x Omzet Kotor
    const adminPromoPct = store?.settings?.adminPromoPercentage ?? 8.5;
    const totalAdminShopee = Math.round((adminPromoPct / 100) * totalOmzetKotor);

    // 5. Total Biaya Layanan = Biaya Layanan per Pesanan x Total Paket Terjual
    const serviceFeePerOrder = store?.settings?.serviceFeePerOrder ?? 1250;
    const totalBiayaLayanan = totalPaketTerjual * serviceFeePerOrder;

    // 6. Total Return (Estimasi vs Detail)
    let totalReturnAmount = 0;
    const isEstimate = store?.settings?.returnMechanism === 'estimate';
    const estimatePct = store?.settings?.estimateReturnPercentage ?? 3.0;

    if (isEstimate) {
      totalReturnAmount = Math.round((estimatePct / 100) * totalOmzetKotor);
    } else {
      totalReturnAmount = filteredReturns.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    }

    // 7. Omzet Bersih = Omzet Kotor - Modal Terjual - Admin Shopee - Biaya Layanan - Iklan - Koin
    const omzetBersih = totalOmzetKotor - modalBarangTerjual - totalAdminShopee - totalBiayaLayanan - totalIklanTerpakai - totalKoinTerpakai;

    // 8. Laba Kotor = Omzet Bersih - Total Return
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
      adminPromoPct,
      totalAdminShopee,
      serviceFeePerOrder,
      totalBiayaLayanan,
      isEstimate,
      estimatePct,
      totalReturnAmount,
      omzetBersih,
      labaKotor,
    };
  }, [inventory, sales, returns, store, period, selectedDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Filter Periode */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161823] p-3 rounded-2xl border border-white/10 shadow-lg">
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
      <div className="p-6 sm:p-8 rounded-3xl bg-[#161823] text-white border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Total Laba Kotor Sesi Live</span>
            </div>
            <div className={`text-3xl sm:text-4xl font-black tracking-tight ${calculation.labaKotor >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(calculation.labaKotor)}
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Dihitung dari Omzet Kotor dikurangi Modal Terjual, Admin Shopee ({calculation.adminPromoPct}%), Biaya Layanan, Ads/Koin, dan Retur.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2 min-w-[200px]">
            <div className="text-[11px] text-zinc-400 font-semibold">Omzet Kotor Live:</div>
            <div className="text-lg font-black text-white">
              {formatRupiah(calculation.totalOmzetKotor)}
            </div>
            <div className="text-[11px] text-zinc-400 pt-2 border-t border-white/10">
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

        {/* Kolom 2: Biaya & Potongan Shopee */}
        <div className="bg-[#161823] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#FE2C55]" />
            <span>2. Potongan Marketplace Shopee &amp; Iklan</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
              <span className="text-zinc-400">Biaya Admin Shopee ({calculation.adminPromoPct}%):</span>
              <strong className="text-[#FE2C55] font-bold">{formatRupiah(calculation.totalAdminShopee)}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
              <span className="text-zinc-400">Biaya Layanan ({formatRupiah(calculation.serviceFeePerOrder)}/paket):</span>
              <strong className="text-[#FE2C55] font-bold">{formatRupiah(calculation.totalBiayaLayanan)}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
              <span className="text-zinc-400">Penggunaan Shopee Ads &amp; Koin:</span>
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
