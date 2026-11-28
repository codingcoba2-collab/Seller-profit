import React, { useState, useMemo, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import {
  AttendanceRecord,
  BallInventory,
  CurrentUser,
  SalesChannel,
  SalesRecord,
  SteamSortirRecord,
} from '../../types';
import {
  formatAttendanceRole,
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayString,
  inventoryUnitLabels,
  salesChannelLabels,
} from '../../utils/formatters';
import { EmployeeConfirmModal } from './EmployeeConfirmModal';
import { resolveCurrentEmployeeProfile } from '../../utils/employeeSalary';
import { getEmployeePermissions, isOwnEmployeeRecord } from '../../utils/employeePermissions';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

export type EmployeeDataSubTab = 'kehadiran' | 'penjualan' | 'stok' | 'pengukuran';

interface EmployeeDataViewsProps {
  activeSubTab: EmployeeDataSubTab;
  onChangeSubTab?: (tab: EmployeeDataSubTab) => void;
  currentUser: CurrentUser;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onGoToInput: (tab: EmployeeDataSubTab) => void;
  onEditAttendance: (att: AttendanceRecord) => void;
  onEditSale: (sale: SalesRecord) => void;
  onEditInventory: (inv: BallInventory) => void;
  onEditMeasurement: (rec: SteamSortirRecord) => void;
}

const DATA_TITLES: Record<EmployeeDataSubTab, string> = {
  kehadiran: 'Data Kehadiran',
  penjualan: 'Data Omzet & Pcs Terjual',
  stok: 'Data Stok Masuk, Keluar & Sisa',
  pengukuran: 'Data Total Barang Diukur',
};

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const idx = parseInt(parts[1], 10) - 1;
  return `${parseInt(parts[2], 10)} ${months[idx] || parts[1]} '${parts[0].slice(-2)}`;
};

const formatMonthLabel = (ym: string) => {
  if (!ym || !ym.includes('-')) return ym;
  const [y, m] = ym.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${months[parseInt(m, 10) - 1] || m} ${y}`;
};

export const EmployeeDataViews: React.FC<EmployeeDataViewsProps> = ({
  activeSubTab,
  currentUser,
  onNotify,
  onGoToInput,
  onEditAttendance,
  onEditSale,
  onEditInventory,
  onEditMeasurement,
}) => {
  const storeId = currentUser.storeId;
  const todayStr = getTodayString();
  const permissions = useMemo(() => getEmployeePermissions(currentUser), [currentUser]);
  const myEmployee = useMemo(() => resolveCurrentEmployeeProfile(currentUser), [currentUser]);

  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() => StorageService.getAttendance(storeId));
  const [salesList, setSalesList] = useState<SalesRecord[]>(() => StorageService.getSales(storeId));
  const [inventoryList, setInventoryList] = useState<BallInventory[]>(() => StorageService.getInventory(storeId));
  const [measurementList, setMeasurementList] = useState<SteamSortirRecord[]>(() => StorageService.getSteamSortir(storeId));
  const [stockSummary, setStockSummary] = useState(() => StorageService.calculateStock(storeId));

  useEffect(() => {
    const refresh = () => {
      setAttendanceList(StorageService.getAttendance(storeId));
      setSalesList(StorageService.getSales(storeId));
      setInventoryList(StorageService.getInventory(storeId));
      setMeasurementList(StorageService.getSteamSortir(storeId));
      setStockSummary(StorageService.calculateStock(storeId));
    };
    const unsub = StorageService.subscribe(refresh);
    return () => unsub();
  }, [storeId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'specific_month'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => todayStr.slice(0, 7));
  const [showMonthlySales, setShowMonthlySales] = useState(false);

  const [detailSale, setDetailSale] = useState<SalesRecord | null>(null);
  const [detailMeasurement, setDetailMeasurement] = useState<SteamSortirRecord | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const matchPeriod = (dateStr: string) => {
    if (periodFilter === 'all') return true;
    if (!dateStr) return false;
    if (periodFilter === 'today') return dateStr === todayStr;
    if (periodFilter === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      return dateStr >= weekAgo && dateStr <= todayStr;
    }
    if (periodFilter === 'monthly') return dateStr.startsWith(todayStr.slice(0, 7));
    if (periodFilter === 'specific_month') return dateStr.startsWith(selectedMonth);
    return true;
  };

  // =========================================================================
  // FILTERED DATASETS
  // =========================================================================
  const filteredAttendance = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attendanceList
      .filter((a) => matchPeriod(a.date))
      .filter((a) => !q || a.employeeName.toLowerCase().includes(q) || (a.notes || '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceList, searchQuery, periodFilter, selectedMonth, todayStr]);

  const attTotalHours = filteredAttendance.reduce((sum, a) => sum + (a.salaryType === 'hourly' ? a.hoursWorked || 0 : 0), 0);
  const attDailyShifts = filteredAttendance.filter((a) => a.salaryType !== 'hourly').length;

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return salesList
      .filter((s) => matchPeriod(s.date))
      .filter((s) => {
        if (!q) return true;
        const ch = (s.channelName || s.salesChannel || '').toLowerCase();
        return ch.includes(q) || (s.notes || '').toLowerCase().includes(q) || (s.hostNames || []).join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [salesList, searchQuery, periodFilter, selectedMonth, todayStr]);

  const salesTotalOmzet = filteredSales.reduce((sum, s) => sum + (s.omzet || 0), 0);
  const salesTotalPcs = filteredSales.reduce((sum, s) => sum + (s.pcsSold || 0), 0);
  const salesTotalPackages = filteredSales.reduce((sum, s) => sum + (s.packagesSold || 0), 0);

  const monthlySalesSummary = useMemo(() => {
    const map = new Map<string, { month: string; omzet: number; pcs: number; packages: number; count: number }>();
    salesList.forEach((s) => {
      const ym = s.date ? s.date.slice(0, 7) : '';
      if (!ym) return;
      const cur = map.get(ym) || { month: ym, omzet: 0, pcs: 0, packages: 0, count: 0 };
      cur.omzet += s.omzet || 0;
      cur.pcs += s.pcsSold || 0;
      cur.packages += s.packagesSold || 0;
      cur.count += 1;
      map.set(ym, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [salesList]);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inventoryList
      .filter((i) => matchPeriod(i.date))
      .filter((i) => !q || i.ballType.toLowerCase().includes(q) || (i.notes || '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [inventoryList, searchQuery, periodFilter, selectedMonth, todayStr]);

  const filteredMeasurements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return measurementList
      .filter((m) => matchPeriod(m.date))
      .filter((m) => !q || (m.ballName || '').toLowerCase().includes(q) || (m.notes || '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [measurementList, searchQuery, periodFilter, selectedMonth, todayStr]);

  const measTotalPcs = filteredMeasurements.reduce((sum, m) => sum + (m.pcsTotal || m.totalPcsProcessed || 0), 0);
  const measLayakPcs = filteredMeasurements.reduce((sum, m) => sum + (m.pcsLayakJual || 0), 0);
  const measRejectPcs = filteredMeasurements.reduce((sum, m) => sum + (m.pcsReject || 0), 0);

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          {DATA_TITLES[activeSubTab]}
        </h2>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'today', label: 'Hari Ini' },
            { key: 'weekly', label: '7 Hari' },
            { key: 'monthly', label: 'Bulan Ini' },
            { key: 'specific_month', label: 'Pilih Bulan' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriodFilter(opt.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                periodFilter === opt.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {periodFilter === 'specific_month' && (
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="text-xs font-semibold border-none bg-transparent !border-0 !shadow-none px-1 py-0.5"
            />
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari data..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
          />
        </div>

        {permissions.allowedInputTabs.includes(activeSubTab) && (
          <button
            type="button"
            onClick={() => onGoToInput(activeSubTab)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Baru</span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: DATA KEHADIRAN */}
      {/* ===================================================================== */}
      {activeSubTab === 'kehadiran' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Total Kehadiran</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono-num mt-0.5">
                {formatNumber(filteredAttendance.length)} sesi
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Total Jam Kerja</div>
              <div className="text-lg sm:text-xl font-bold text-blue-600 font-mono-num mt-0.5">
                {attTotalHours} jam
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Shift Harian</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 font-mono-num mt-0.5">
                {formatNumber(attDailyShifts)} hari
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-2.5 w-[20%]">Tanggal</th>
                  <th className="py-2.5 px-2.5 w-[26%]">Pegawai</th>
                  <th className="py-2.5 px-2.5 w-[24%]">Role</th>
                  <th className="py-2.5 px-2.5 w-[15%]">Durasi</th>
                  <th className="py-2.5 px-2 text-center w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px] sm:text-xs">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data kehadiran pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((att) => {
                    const canModifyAtt =
                      !permissions.canOnlySelfAttendance ||
                      isOwnEmployeeRecord(currentUser, myEmployee, att.employeeId, att.employeeName);
                    return (
                      <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                          {formatShortDate(att.date)}
                        </td>
                        <td className="py-2.5 px-2.5 font-semibold text-slate-900 truncate">
                          {att.employeeName}
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-600 truncate">
                          {formatAttendanceRole(att.role)}
                        </td>
                        <td className="py-2.5 px-2.5 font-semibold text-blue-600 font-mono-num whitespace-nowrap">
                          {att.salaryType === 'hourly' ? `${att.hoursWorked} jam` : '1 shift'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {canModifyAtt ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditAttendance(att)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDelete({
                                    isOpen: true,
                                    title: 'Hapus Data Kehadiran',
                                    message: `Hapus absensi ${att.employeeName} tanggal ${formatDateIndo(att.date)}?`,
                                    onConfirm: () => {
                                      setConfirmDelete((p) => ({ ...p, isOpen: false }));
                                      StorageService.deleteAttendance(att.id);
                                      onNotify('Data kehadiran dihapus.', 'info');
                                    },
                                  })
                                }
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: DATA OMZET & PCS TERJUAL */}
      {/* ===================================================================== */}
      {activeSubTab === 'penjualan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-slate-500">Total Omzet</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 font-mono-num mt-0.5 whitespace-nowrap">
                {formatRupiah(salesTotalOmzet)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-slate-500">Pcs Terjual</div>
              <div className="text-base sm:text-xl font-bold text-blue-600 font-mono-num mt-0.5 whitespace-nowrap">
                {formatNumber(salesTotalPcs)} pcs
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-slate-500">Total Paket</div>
              <div className="text-base sm:text-xl font-bold text-slate-900 font-mono-num mt-0.5 whitespace-nowrap">
                {formatNumber(salesTotalPackages)} pkt
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMonthlySales((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                showMonthlySales
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{showMonthlySales ? 'Tutup Rekap Per Bulan' : 'Lihat Rekap Per Bulan'}</span>
            </button>
          </div>

          {showMonthlySales && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                Ringkasan Omzet &amp; Pcs Per Bulan (Ketuk bulan untuk memfilter)
              </div>
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-500">
                    <th className="py-2 px-3 w-[34%]">Bulan</th>
                    <th className="py-2 px-2 w-[16%]">Sesi</th>
                    <th className="py-2 px-2 w-[20%]">Pcs</th>
                    <th className="py-2 px-3 text-right w-[30%]">Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px] sm:text-xs">
                  {monthlySalesSummary.map((row) => (
                    <tr
                      key={row.month}
                      onClick={() => {
                        setSelectedMonth(row.month);
                        setPeriodFilter('specific_month');
                      }}
                      className="hover:bg-blue-50/50 cursor-pointer"
                    >
                      <td className="py-2 px-3 font-semibold text-slate-900 truncate">{formatMonthLabel(row.month)}</td>
                      <td className="py-2 px-2 text-slate-600 font-mono-num">{row.count}x</td>
                      <td className="py-2 px-2 text-blue-600 font-semibold font-mono-num">{formatNumber(row.pcs)} pcs</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-bold font-mono-num">{formatRupiah(row.omzet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] min-[375px]:text-[10px] sm:text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-1.5 sm:px-3 w-[17%]">Tanggal</th>
                  <th className="py-2.5 px-1.5 sm:px-3 w-[20%]">Nama Host</th>
                  <th className="py-2.5 px-1.5 sm:px-3 w-[13%]">Pcs</th>
                  <th className="py-2.5 px-1.5 sm:px-3 w-[13%]">Paket</th>
                  <th className="py-2.5 px-1.5 sm:px-3 w-[22%]">Omzet</th>
                  <th className="py-2.5 px-1 sm:px-2 text-center w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[8.5px] min-[375px]:text-[9.5px] sm:text-xs">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada riwayat penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const cleanName = StorageService.getCleanChannelName(sale.salesChannel || sale.channelName);
                    const chLabel = salesChannelLabels[sale.salesChannel as SalesChannel]?.label || cleanName;
                    const hostDisplay =
                      sale.hostNames && sale.hostNames.length > 0
                        ? sale.hostNames.join(', ')
                        : sale.salesType === 'non_live'
                        ? 'Non-Live'
                        : '-';
                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setDetailSale(sale)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-1.5 sm:px-3 text-slate-600 whitespace-nowrap">
                          {formatShortDate(sale.date)}
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 font-semibold text-slate-900 truncate" title={hostDisplay}>
                          {hostDisplay}
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 font-semibold text-blue-600 font-mono-num whitespace-nowrap">
                          {formatNumber(sale.pcsSold)} pcs
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 text-slate-700 font-mono-num whitespace-nowrap">
                          {formatNumber(sale.packagesSold)} pkt
                        </td>
                        <td className="py-2 px-1.5 sm:px-3 font-bold text-emerald-600 font-mono-num whitespace-nowrap">
                          {formatRupiah(sale.omzet)}
                        </td>
                        <td className="py-2 px-1 sm:px-2 text-center">
                          {permissions.canEditSales ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSale(sale);
                                }}
                                className="p-1 sm:p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete({
                                    isOpen: true,
                                    title: 'Hapus Transaksi Penjualan',
                                    message: `Hapus penjualan ${chLabel} tanggal ${formatDateIndo(sale.date)} senilai ${formatRupiah(sale.omzet)}?`,
                                    onConfirm: () => {
                                      setConfirmDelete((p) => ({ ...p, isOpen: false }));
                                      StorageService.deleteSale(sale.id);
                                      onNotify('Data penjualan dihapus.', 'info');
                                    },
                                  });
                                }}
                                className="p-1 sm:p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DATA STOK MASUK, STOK KELUAR, SISA STOK */}
      {/* ===================================================================== */}
      {activeSubTab === 'stok' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Stok Masuk</div>
              <div className="text-base sm:text-xl font-bold text-blue-600 font-mono-num mt-0.5">
                {formatNumber(stockSummary.totalPcsIn)} pcs
              </div>
              {stockSummary.totalPcsReject > 0 && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Reject: {formatNumber(stockSummary.totalPcsReject)} pcs
                </div>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Stok Keluar</div>
              <div className="text-base sm:text-xl font-bold text-amber-600 font-mono-num mt-0.5">
                {formatNumber(stockSummary.totalPcsSold)} pcs
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Sisa Stok</div>
              <div
                className={`text-base sm:text-xl font-bold font-mono-num mt-0.5 ${
                  stockSummary.remainingStock < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatNumber(stockSummary.remainingStock)} pcs
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-2.5 w-[20%]">Tanggal</th>
                  <th className="py-2.5 px-2.5 w-[34%]">Nama Barang / Ball</th>
                  <th className="py-2.5 px-2.5 w-[18%]">Satuan</th>
                  <th className="py-2.5 px-2.5 w-[13%]">Masuk</th>
                  <th className="py-2.5 px-2 text-center w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px] sm:text-xs">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data stok masuk pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        {formatShortDate(inv.date)}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900 truncate">
                        {inv.ballType}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 truncate">
                        {inventoryUnitLabels[inv.unitType || 'ball_karung']?.split('(')[0].trim() || 'Ball'}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-blue-600 font-mono-num whitespace-nowrap">
                        {formatNumber(inv.pcsCount)} pcs
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {permissions.canEditStock ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditInventory(inv)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({
                                  isOpen: true,
                                  title: 'Hapus Data Stok',
                                  message: `Hapus stok masuk "${inv.ballType}" (${formatNumber(inv.pcsCount)} pcs)?`,
                                  onConfirm: () => {
                                    setConfirmDelete((p) => ({ ...p, isOpen: false }));
                                    StorageService.deleteInventory(inv.id);
                                    onNotify('Data stok dihapus.', 'info');
                                  },
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: DATA TOTAL BARANG YANG DIUKUR */}
      {/* ===================================================================== */}
      {activeSubTab === 'pengukuran' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Total Diukur</div>
              <div className="text-base sm:text-xl font-bold text-slate-900 font-mono-num mt-0.5">
                {formatNumber(measTotalPcs)} pcs
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Layak Jual</div>
              <div className="text-base sm:text-xl font-bold text-emerald-600 font-mono-num mt-0.5">
                {formatNumber(measLayakPcs)} pcs
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Reject</div>
              <div className="text-base sm:text-xl font-bold text-rose-600 font-mono-num mt-0.5">
                {formatNumber(measRejectPcs)} pcs
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-2.5 w-[20%]">Tanggal</th>
                  <th className="py-2.5 px-2.5 w-[30%]">Barang / Ball</th>
                  <th className="py-2.5 px-2.5 w-[18%]">Diukur</th>
                  <th className="py-2.5 px-2.5 w-[17%]">Layak</th>
                  <th className="py-2.5 px-2 text-center w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px] sm:text-xs">
                {filteredMeasurements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data pengukuran barang pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredMeasurements.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setDetailMeasurement(rec)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        {formatShortDate(rec.date)}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900 truncate">
                        {rec.ballName}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-blue-600 font-mono-num whitespace-nowrap">
                        {formatNumber(rec.pcsTotal || rec.totalPcsProcessed || 0)} pcs
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-emerald-600 font-mono-num whitespace-nowrap">
                        {formatNumber(rec.pcsLayakJual || 0)} pcs
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {permissions.canEditMeasurement ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditMeasurement(rec);
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({
                                  isOpen: true,
                                  title: 'Hapus Data Pengukuran',
                                  message: `Hapus pengukuran "${rec.ballName}" (${formatNumber(rec.pcsTotal || 0)} pcs)?`,
                                  onConfirm: () => {
                                    setConfirmDelete((p) => ({ ...p, isOpen: false }));
                                    StorageService.deleteSteamSortir(rec.id);
                                    onNotify('Data pengukuran dihapus.', 'info');
                                  },
                                });
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: PENJUALAN */}
      {detailSale && (
        <div
          onClick={() => setDetailSale(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[88vh] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Detail Transaksi Penjualan</h3>
                <p className="text-xs text-slate-500">{formatDateIndo(detailSale.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailSale(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs overflow-y-auto flex-1">
              {(() => {
                const feeInfo = StorageService.getFeeForChannel(storeId, detailSale.salesChannel || detailSale.channelName);
                const adminCut = Math.round(((feeInfo.adminPercentage || 0) / 100) * (detailSale.omzet || 0));
                const serviceCut = (detailSale.packagesSold || 0) * (feeInfo.serviceFeePerOrder || 0);
                const sameDayOmzet = salesList
                  .filter((s) => s.date === detailSale.date)
                  .reduce((sum, s) => sum + (s.omzet || 0), 0);

                return (
                  <>
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700 uppercase">Omzet Hari Itu</div>
                        <div className="text-lg font-bold text-emerald-700 font-mono-num">
                          {formatRupiah(detailSale.omzet)}
                        </div>
                        {sameDayOmzet > detailSale.omzet && (
                          <div className="text-[10px] text-emerald-600">
                            Total tanggal sama: {formatRupiah(sameDayOmzet)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">Channel</div>
                        <div className="text-xs font-bold text-slate-900">
                          {StorageService.getCleanChannelName(detailSale.salesChannel || detailSale.channelName)}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Biaya Channel ({feeInfo.channelName})</span>
                        <span>Admin {feeInfo.adminPercentage}%</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Potongan Admin</span>
                        <span className="font-mono-num text-rose-600">- {formatRupiah(adminCut)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Biaya Layanan</span>
                        <span className="font-mono-num text-rose-600">- {formatRupiah(serviceCut)}</span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Pcs Terjual</span>
                  <span className="font-semibold text-slate-900 font-mono-num">{formatNumber(detailSale.pcsSold)} pcs</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Paket / Order</span>
                  <span className="font-semibold text-slate-900 font-mono-num">{formatNumber(detailSale.packagesSold)} pkt</span>
                </div>
                {detailSale.salesType !== 'non_live' && (
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Durasi Live
                    </span>
                    <span className="font-semibold text-blue-600 font-mono-num">
                      {detailSale.hoursWorked ? `${detailSale.hoursWorked} jam` : '-'}
                    </span>
                  </div>
                )}
                {detailSale.hostNames && detailSale.hostNames.length > 0 && (
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Host Live</span>
                    <span className="font-semibold text-slate-900">{detailSale.hostNames.join(', ')}</span>
                  </div>
                )}
                {detailSale.notes && (
                  <div className="py-2">
                    <span className="text-slate-500 block mb-1">Catatan</span>
                    <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {detailSale.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setDetailSale(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              {permissions.canEditSales && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailSale;
                    setDetailSale(null);
                    onEditSale(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Penjualan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: PENGUKURAN */}
      {detailMeasurement && (
        <div
          onClick={() => setDetailMeasurement(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{detailMeasurement.ballName}</h3>
                <p className="text-xs text-slate-500">{formatDateIndo(detailMeasurement.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailMeasurement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500">Diukur</div>
                  <div className="text-sm font-bold text-slate-900 font-mono-num">
                    {formatNumber(detailMeasurement.pcsTotal || 0)} pcs
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700">Layak Jual</div>
                  <div className="text-sm font-bold text-emerald-700 font-mono-num">
                    {formatNumber(detailMeasurement.pcsLayakJual || 0)} pcs
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[10px] text-rose-700">Reject</div>
                  <div className="text-sm font-bold text-rose-700 font-mono-num">
                    {formatNumber(detailMeasurement.pcsReject || 0)} pcs
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Berat</span>
                  <span className="font-semibold text-slate-900 font-mono-num">{detailMeasurement.ballWeightKg || 45} kg</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Kelas (Kepala / Badan / Kaki)</span>
                  <span className="font-semibold text-slate-900 font-mono-num">
                    {detailMeasurement.pcsKepala || 0} / {detailMeasurement.pcsBadan || 0} / {detailMeasurement.pcsKaki || 0}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Petugas</span>
                  <span className="font-semibold text-slate-900">
                    {(detailMeasurement.employeeNames || []).join(', ') || detailMeasurement.recordedBy || '-'}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-between">
              <button
                type="button"
                onClick={() => setDetailMeasurement(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              {permissions.canEditMeasurement && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailMeasurement;
                    setDetailMeasurement(null);
                    onEditMeasurement(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Pengukuran</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <EmployeeConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        variant="danger"
        confirmLabel="Ya, Hapus"
        onConfirm={confirmDelete.onConfirm}
        onCancel={() => setConfirmDelete((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};
