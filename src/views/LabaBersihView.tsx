import React, { useState, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, PeriodFilter } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Receipt, 
  Sparkles,
  Wallet,
  Coins,
  Package,
  CheckCircle2,
  ShieldCheck,
  Target
} from 'lucide-react';

interface LabaBersihViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
}

export const LabaBersihView: React.FC<LabaBersihViewProps> = ({
  currentUser,
  onBackToDashboard,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const store = StorageService.getStoreById(currentUser.storeId);
  const inventory = StorageService.getInventory(currentUser.storeId);
  const sales = StorageService.getSales(currentUser.storeId);
  const returns = StorageService.getReturns(currentUser.storeId);
  const cashflows = StorageService.getCashflow(currentUser.storeId);
  const attendance = StorageService.getAttendance(currentUser.storeId);
  const employees = StorageService.getEmployees(currentUser.storeId);

  const filterByPeriod = (recordDate: string): boolean => {
    if (period === 'all') return true;
    if (!recordDate) return false;

    const targetDate = new Date(selectedDate);
    const recDate = new Date(recordDate);

    if (period === 'daily') return recordDate === selectedDate;
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

  const report = useMemo(() => {
    const filteredInventory = inventory.filter(i => filterByPeriod(i.date));
    const filteredSales = sales.filter(s => filterByPeriod(s.date));
    const filteredReturns = returns.filter(r => filterByPeriod(r.date));
    const filteredCashflows = cashflows.filter(c => filterByPeriod(c.date));
    const filteredAttendance = attendance.filter(a => filterByPeriod(a.date));

    // 1. Sales & Revenue
    const totalOmzetKotor = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalIsiTerjual = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
    const totalPaketTerjual = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
    const totalIklanTerpakai = filteredSales.reduce((acc, s) => acc + (s.adsUsed || 0), 0);
    const totalKoinTerpakai = filteredSales.reduce((acc, s) => acc + (s.coinUsed || 0), 0);

    // HPP Final calculation using StorageService.calculateHPP
    const hppData = StorageService.calculateHPP(currentUser.storeId, filterByPeriod);
    const averageHpp = hppData.weightedAverageHpp > 0 
      ? hppData.weightedAverageHpp 
      : 20000;
    const modalBarangTerjual = totalIsiTerjual * averageHpp;

    // Shopee Deductions
    const adminPromoPct = store?.settings?.adminPromoPercentage ?? 8.5;
    const totalAdminShopee = Math.round((adminPromoPct / 100) * totalOmzetKotor);
    const serviceFee = store?.settings?.serviceFeePerOrder ?? 1250;
    const totalBiayaLayanan = totalPaketTerjual * serviceFee;

    // Return
    let totalReturn = 0;
    if (store?.settings?.returnMechanism === 'estimate') {
      totalReturn = Math.round(((store?.settings?.estimateReturnPercentage ?? 3) / 100) * totalOmzetKotor);
    } else {
      totalReturn = filteredReturns.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    }

    // Laba Kotor output
    const omzetBersih = totalOmzetKotor - modalBarangTerjual - totalAdminShopee - totalBiayaLayanan - totalIklanTerpakai - totalKoinTerpakai;
    const labaKotor = omzetBersih - totalReturn;

    // 2. Total Pengeluaran Operasional (Cashflow Outflow murni - tidak termasuk pengeluaran gaji karena gaji dipisahkan / dihitung mandiri di kas gaji)
    const pengeluaranOperasional = filteredCashflows
      .filter(c => c.type === 'outflow' && c.category !== 'gaji_pegawai')
      .reduce((acc, c) => acc + c.amount, 0);

    // Pengeluaran gaji tercatat di kas (hanya untuk info/tracking)
    const pengeluaranGajiDiKas = filteredCashflows
      .filter(c => c.type === 'outflow' && c.category === 'gaji_pegawai')
      .reduce((acc, c) => acc + c.amount, 0);

    // 3. Total Beban Gaji & Insentif Tim (Tidak dimasukkan ke potongan laba bersih toko sesuai instruksi)
    const payrollData = StorageService.calculateStorePayroll(currentUser.storeId, filterByPeriod);
    const totalBebanGaji = payrollData.totalPayroll;
    const totalGajiPokok = payrollData.totalBaseSalary;
    const totalInsentifLive = payrollData.totalIncentives;
    const totalBonusTambahan = payrollData.totalMultiRoleBonus + payrollData.totalMonthlyBonus;

    // 4. Laba Bersih Akhir = Laba Kotor - Pengeluaran Operasional Kas (Tanpa memotong beban gaji di slip maupun kas)
    const labaBersihAkhir = labaKotor - pengeluaranOperasional;
    const profitMargin = totalOmzetKotor > 0 ? ((labaBersihAkhir / totalOmzetKotor) * 100).toFixed(1) : '0.0';

    return {
      totalOmzetKotor,
      labaKotor,
      pengeluaranOperasional,
      pengeluaranGajiDiKas,
      totalBebanGaji,
      totalGajiPokok,
      totalInsentifLive,
      totalBonusTambahan,
      averageHpp,
      modalBarangTerjual,
      labaBersihAkhir,
      profitMargin,
    };
  }, [inventory, sales, returns, cashflows, attendance, employees, store, period, selectedDate, currentUser.storeId]);

  const roi = useMemo(() => {
    return StorageService.calculateReturnOnInvestment(currentUser.storeId);
  }, [currentUser.storeId, inventory, sales, returns, cashflows, store]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
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

      {/* Laba Bersih Hero Banner - Kompak */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] text-white border border-white/10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-[#25F4EE]" />
              <span>Net Profit Toko</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${report.labaBersihAkhir >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(report.labaBersihAkhir)}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-[#0b0c10] border border-white/10 space-y-1 sm:min-w-[190px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-400 font-semibold">Net Profit Margin:</span>
              <span className="text-base sm:text-lg font-black text-[#25F4EE]">
                {report.profitMargin}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 pt-1 border-t border-white/10">
              Dari Omzet Kotor: <strong className="text-white">{formatRupiah(report.totalOmzetKotor)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sisa Balik Modal (ROI & BEP Toko) - Kompak */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>Perhitungan Sisa Balik Modal Toko</span>
                {roi.isBreakEven ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    BEP 100%
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Proses BEP
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-zinc-400">
                Total modal investasi vs akumulasi laba bersih yang dihasilkan.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-zinc-400 block font-semibold">Sisa Belum Balik Modal:</span>
            <span className={`text-base sm:text-lg font-black tracking-tight ${roi.isBreakEven ? 'text-emerald-400' : 'text-amber-400'}`}>
              {formatRupiah(roi.sisaBalikModal)}
            </span>
          </div>
        </div>

        {/* Progress Bar Balik Modal */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-zinc-300">
              Progress: <strong className="text-[#25F4EE]">{roi.progressPercentage}%</strong>
            </span>
            <span className="text-zinc-400">
              Investasi: <strong className="text-white">{formatRupiah(roi.totalModalInvestasi)}</strong>
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#0b0c10] border border-white/10 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                roi.isBreakEven 
                  ? 'bg-gradient-to-r from-emerald-500 to-[#25F4EE]' 
                  : 'bg-gradient-to-r from-amber-500 to-[#25F4EE]'
              }`}
              style={{ width: `${Math.max(3, roi.progressPercentage)}%` }}
            />
          </div>
        </div>

        {/* 4 Detail Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-zinc-400 block">Modal Masuk</span>
            <span className="text-xs sm:text-sm font-black text-white">{formatRupiah(roi.totalModalInvestasi)}</span>
            <span className="text-[9px] text-zinc-500 block truncate">
              {roi.modalSumber === 'pengaturan' ? 'Modal Tetap Awal' : 'Stok Ball Pakaian'}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-zinc-400 block">Akumulasi Net Profit</span>
            <span className={`text-xs sm:text-sm font-black ${roi.totalNetProfit >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(roi.totalNetProfit)}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate">All-Time</span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-zinc-400 block">Sisa Modal</span>
            <span className="text-xs sm:text-sm font-black text-amber-400">{formatRupiah(roi.sisaBalikModal)}</span>
            <span className="text-[9px] text-zinc-500 block truncate">
              {roi.isBreakEven ? 'Lunas' : `${100 - roi.progressPercentage}% ke BEP`}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-zinc-400 block">Surplus Profit</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400">{formatRupiah(roi.surplusProfit)}</span>
            <span className="text-[9px] text-zinc-500 block truncate">Di atas modal</span>
          </div>
        </div>
      </div>

      {/* Summary Cards - Kompak */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">1. Laba Kotor Penjualan</span>
            <div className="p-1.5 rounded-lg bg-[#0b0c10] text-[#25F4EE] border border-white/10">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-[#25F4EE]">
            {formatRupiah(report.labaKotor)}
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            Penjualan live dikurangi modal HPP &amp; biaya admin
          </p>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">2. Beban Operasional Kas</span>
            <div className="p-1.5 rounded-lg bg-[#0b0c10] text-[#FE2C55] border border-white/10">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-[#FE2C55]">
            {formatRupiah(report.pengeluaranOperasional)}
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            Packing, lakban, makan/minum tim, sewa &amp; listrik
          </p>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">3. Beban Gaji &amp; Insentif</span>
            <div className="p-1.5 rounded-lg bg-[#0b0c10] text-amber-400 border border-white/10">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-white">
            {formatRupiah(report.totalBebanGaji)}
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            Gaji pokok shift, insentif live, bonus rangkap &amp; omzet
          </p>
        </div>
      </div>

      {/* Rincian Komponen Beban Gaji & HPP Final - Kompak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        {/* Rincian Payroll */}
        <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Rincian Beban Gaji &amp; Insentif Tim
            </h4>
            <span className="text-[11px] font-bold text-amber-400">
              {formatRupiah(report.totalBebanGaji)}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-zinc-400 text-[11px]">Gaji Pokok Jam / Shift (Semua Tim)</span>
              <span className="font-bold text-white text-[11px]">{formatRupiah(report.totalGajiPokok)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-zinc-400 text-[11px]">Total Insentif Live (Host &amp; Admin)</span>
              <span className="font-bold text-[#25F4EE] text-[11px]">{formatRupiah(report.totalInsentifLive)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-zinc-400 text-[11px]">Bonus Rangkap Role &amp; Target Omzet</span>
              <span className="font-bold text-purple-400 text-[11px]">{formatRupiah(report.totalBonusTambahan)}</span>
            </div>
          </div>
        </div>

        {/* Rincian Modal HPP */}
        <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Rincian Modal HPP Barang Terjual
            </h4>
            <span className="text-[11px] font-bold text-[#25F4EE]">
              {formatRupiah(report.modalBarangTerjual)}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-zinc-400 text-[11px]">HPP Final Rata-Rata</span>
              <span className="font-bold text-white text-[11px]">{formatRupiah(report.averageHpp)} / pcs</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-zinc-400 text-[11px]">Komponen HPP</span>
              <span className="font-semibold text-emerald-400 text-[10px] truncate max-w-[200px]">Modal+Ongkir+Steam+Sortir</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-zinc-400 text-[11px]">Formula Laba Bersih</span>
              <span className="text-[10px] text-zinc-300">Laba Kotor - Beban Kas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
