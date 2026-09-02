import React, { useState, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, PeriodFilter } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { 
  TrendingUp, 
  ArrowLeft,
  ArrowUpRight, 
  Receipt, 
  Sparkles,
  Wallet,
  Coins,
  Package
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

    // HPP
    const totalIsiBall = filteredInventory.reduce((acc, curr) => acc + (curr.pcsCount || 0), 0);
    const totalHppPool = filteredInventory.reduce((acc, curr) => acc + (curr.hppPerPcs * curr.pcsCount), 0);
    const averageHpp = totalIsiBall > 0 ? Math.round(totalHppPool / totalIsiBall) : 20000;
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

    // 2. Total Pengeluaran Operasional (Cashflow Outflow)
    const pengeluaranOperasional = filteredCashflows
      .filter(c => c.type === 'outflow')
      .reduce((acc, c) => acc + c.amount, 0);

    // 3. Total Beban Gaji & Insentif Pegawai di periode ini
    let totalBebanGaji = 0;
    employees.forEach(emp => {
      const empAtt = filteredAttendance.filter(a => a.employeeId === emp.id || a.employeeName === emp.name);
      empAtt.forEach(att => {
        if (emp.salaryType === 'hourly') {
          totalBebanGaji += (att.hoursWorked || 0) * emp.salaryRate;
        } else {
          totalBebanGaji += emp.salaryRate;
        }
      });

      // Role-specific incentives
      emp.roles.forEach(r => {
        const cfg = emp.incentiveConfigs?.[r];
        if (!cfg || cfg.type === 'none') return;

        if (r === 'host') {
          const hostSales = filteredSales.filter(s => s.hostIds?.includes(emp.id) || s.hostNames?.some(hn => hn.toLowerCase().includes(emp.name.toLowerCase())));
          if (cfg.type === 'per_pcs_sold') {
            const pcs = hostSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
            totalBebanGaji += pcs * (cfg.rate || 0);
          } else if (cfg.type === 'per_package_sold') {
            const pkgs = hostSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
            totalBebanGaji += pkgs * (cfg.rate || 0);
          } else if (cfg.type === 'fixed_amount') {
            totalBebanGaji += cfg.rate || 0;
          }
        } else if (r === 'admin_toko') {
          const adminSales = filteredSales.filter(s => 
            s.adminIds?.includes(emp.id) || 
            s.adminId === emp.id || 
            s.adminNames?.some(an => an.toLowerCase().includes(emp.name.toLowerCase())) ||
            (s.adminName && s.adminName.toLowerCase().includes(emp.name.toLowerCase()))
          );
          if (cfg.type === 'per_package_sold') {
            const pkgs = adminSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
            totalBebanGaji += pkgs * (cfg.rate || 0);
          } else if (cfg.type === 'per_pcs_sold') {
            const pcs = adminSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
            totalBebanGaji += pcs * (cfg.rate || 0);
          } else if (cfg.type === 'fixed_amount') {
            totalBebanGaji += cfg.rate || 0;
          }
        }
      });
    });

    // 4. Laba Bersih Akhir = Laba Kotor - Pengeluaran Operasional - Beban Gaji & Insentif
    const labaBersihAkhir = labaKotor - pengeluaranOperasional - totalBebanGaji;
    const profitMargin = totalOmzetKotor > 0 ? ((labaBersihAkhir / totalOmzetKotor) * 100).toFixed(1) : '0.0';

    return {
      totalOmzetKotor,
      labaKotor,
      pengeluaranOperasional,
      totalBebanGaji,
      labaBersihAkhir,
      profitMargin,
    };
  }, [inventory, sales, returns, cashflows, attendance, employees, store, period, selectedDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header & Filter without stage labels (Requirement 5 & 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-lababersih"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Laporan Laba Bersih Final Toko
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Hasil laba bersih final setelah memotong seluruh beban operasional kas toko dan rekap gaji &amp; insentif tim
            </p>
          </div>
        </div>

        {/* Filter Periode */}
        <div className="flex flex-wrap items-center gap-2 bg-[#161823] p-1.5 rounded-2xl border border-white/10 shadow-lg">
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

          {period !== 'all' && (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-white/10 bg-[#0b0c10] text-white font-medium focus:border-[#25F4EE]"
            />
          )}
        </div>
      </div>

      {/* Laba Bersih Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#161823] text-white border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Net Profit Toko</span>
            </div>
            <div className={`text-3xl sm:text-4xl font-black tracking-tight ${report.labaBersihAkhir >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(report.labaBersihAkhir)}
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Laba Bersih Akhir = Laba Kotor ({formatRupiah(report.labaKotor)}) dikurangi Pengeluaran Operasional Kas ({formatRupiah(report.pengeluaranOperasional)}) dan Total Gaji/Insentif ({formatRupiah(report.totalBebanGaji)}).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2 min-w-[200px]">
            <div className="text-[11px] text-zinc-400 font-semibold">Net Profit Margin:</div>
            <div className="text-2xl font-black text-[#25F4EE]">
              {report.profitMargin}%
            </div>
            <div className="text-[11px] text-zinc-400 pt-2 border-t border-white/10">
              Dari Omzet Kotor: <strong className="text-white">{formatRupiah(report.totalOmzetKotor)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">1. Laba Kotor Penjualan</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#25F4EE]">
            {formatRupiah(report.labaKotor)}
          </div>
          <p className="text-[11px] text-zinc-500">
            Hasil penjualan live bersih dikurangi modal HPP &amp; biaya Shopee
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">2. Beban Operasional Kas</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-[#FE2C55] border border-white/10">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#FE2C55]">
            {formatRupiah(report.pengeluaranOperasional)}
          </div>
          <p className="text-[11px] text-zinc-500">
            Pengeluaran packing, lakban, makan/minum tim, sewa &amp; listrik
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">3. Beban Gaji &amp; Insentif Tim</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-amber-400 border border-white/10">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatRupiah(report.totalBebanGaji)}
          </div>
          <p className="text-[11px] text-zinc-500">
            Akumulasi gaji pokok jam/shift dan komisi host &amp; admin
          </p>
        </div>
      </div>
    </div>
  );
};
