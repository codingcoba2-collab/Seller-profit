import React, { useMemo, useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import {
  AttendanceRecord,
  CurrentUser,
  SalesRecord,
  SteamSortirRecord,
} from '../../types';
import {
  calculateSingleEmployeeSalary,
  resolveCurrentEmployeeProfile,
} from '../../utils/employeeSalary';
import {
  formatAttendanceRole,
  formatDateIndo,
  formatNumber,
  formatRupiah,
  formatTrainingSummary,
  getTodayString,
  roleLabels,
} from '../../utils/formatters';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Receipt,
  Wallet,
  X,
} from 'lucide-react';

interface EmployeeGajiViewProps {
  currentUser: CurrentUser;
}

const formatMonthLabel = (ym: string) => {
  if (!ym || !ym.includes('-')) return ym;
  const [y, m] = ym.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${months[parseInt(m, 10) - 1] || m} ${y}`;
};

export const EmployeeGajiView: React.FC<EmployeeGajiViewProps> = ({ currentUser }) => {
  const storeId = currentUser.storeId;
  const todayStr = getTodayString();

  const [period, setPeriod] = useState<'monthly' | 'daily' | 'weekly' | 'all' | 'specific_month'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => todayStr.slice(0, 7));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => StorageService.getAttendance(storeId));
  const [sales, setSales] = useState<SalesRecord[]>(() => StorageService.getSales(storeId));
  const [measurements, setMeasurements] = useState<SteamSortirRecord[]>(() => StorageService.getSteamSortir(storeId));
  const [refreshTick, setRefreshTick] = useState(0);
  const [previewProof, setPreviewProof] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setAttendance(StorageService.getAttendance(storeId));
      setSales(StorageService.getSales(storeId));
      setMeasurements(StorageService.getSteamSortir(storeId));
      setRefreshTick((t) => t + 1);
    };
    const unsub = StorageService.subscribe(refresh);
    return () => unsub();
  }, [storeId]);

  const employee = useMemo(() => resolveCurrentEmployeeProfile(currentUser), [currentUser]);

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const salary = useMemo(() => {
    const filterFn = (recDate: string) => {
      if (period === 'all') return true;
      if (!recDate) return false;
      if (period === 'daily') return recDate === todayStr;
      if (period === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return recDate >= weekAgo && recDate <= todayStr;
      }
      if (period === 'monthly') return recDate.startsWith(todayStr.slice(0, 7));
      if (period === 'specific_month') return recDate.startsWith(selectedMonth);
      return true;
    };

    const targetMonth =
      period === 'monthly'
        ? todayStr.slice(0, 7)
        : period === 'specific_month'
        ? selectedMonth
        : undefined;

    return calculateSingleEmployeeSalary(storeId, employee, attendance, sales, measurements, filterFn, {
      targetMonth,
    });
  }, [storeId, employee, attendance, sales, measurements, period, selectedMonth, todayStr, refreshTick]);

  const getPcsSoldForAttendance = (att: AttendanceRecord): number => {
    const attDate = (att.date || '').slice(0, 10);
    if (!attDate) return 0;

    const daySales = sales.filter((s) => (s.date || '').slice(0, 10) === attDate);
    if (daySales.length === 0) return 0;

    const empNameLower = (employee.name || '').trim().toLowerCase();
    const matchedSales = daySales.filter((s) => {
      const matchHost =
        s.hostIds?.includes(employee.id) ||
        s.hostNames?.some((hn) => hn.trim().toLowerCase() === empNameLower);
      const matchAdmin =
        s.adminIds?.includes(employee.id) ||
        s.adminId === employee.id ||
        s.adminNames?.some((an) => an.trim().toLowerCase() === empNameLower) ||
        (s.adminName && s.adminName.trim().toLowerCase() === empNameLower);
      return Boolean(matchHost || matchAdmin);
    });

    if (matchedSales.length > 0) {
      return Math.round(
        matchedSales.reduce((sum, s) => {
          const isHostMatch =
            s.hostIds?.includes(employee.id) ||
            s.hostNames?.some((hn) => hn.trim().toLowerCase() === empNameLower);
          const hostCount = isHostMatch
            ? Math.max(
                1,
                s.hostIds && s.hostIds.length > 0
                  ? s.hostIds.length
                  : s.hostNames && s.hostNames.length > 0
                  ? s.hostNames.length
                  : 1
              )
            : 1;
          return sum + (s.pcsSold || 0) / hostCount;
        }, 0)
      );
    }

    const hasNoTaggedHosts = daySales.every(
      (s) => (!s.hostIds || s.hostIds.length === 0) && (!s.hostNames || s.hostNames.length === 0)
    );
    if (att.role !== 'host' || hasNoTaggedHosts) {
      return daySales.reduce((sum, s) => sum + (s.pcsSold || 0), 0);
    }

    return 0;
  };

  const sortedAttendanceRecords = useMemo(
    () => [...salary.attendanceRecords].sort((a, b) => b.date.localeCompare(a.date)),
    [salary.attendanceRecords]
  );

  const statusMeta = {
    paid: { label: 'Sudah Lunas', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partial: { label: 'Dibayar Sebagian', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    unpaid: { label: 'Belum Dibayar', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    kasbon_exceeded: { label: 'Kasbon Melebihi Gaji', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[salary.paymentStatus];

  return (
    <div className="space-y-5">
      {/* Period Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'monthly', label: 'Bulan Ini' },
            { key: 'daily', label: 'Hari Ini' },
            { key: 'weekly', label: '7 Hari' },
            { key: 'all', label: 'Semua' },
            { key: 'specific_month', label: 'Pilih Bulan' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriod(opt.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                period === opt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === 'specific_month' && (
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
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
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Total Salary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Total Gaji Anda · {period === 'specific_month' ? formatMonthLabel(selectedMonth) : period === 'monthly' ? formatMonthLabel(todayStr.slice(0, 7)) : period === 'daily' ? 'Hari Ini' : period === 'weekly' ? '7 Hari Terakhir' : 'Semua Periode'}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono-num tracking-tight mt-1">
              {formatRupiah(salary.totalGrandSalary)}
            </div>
            {salary.previousUnpaidCarryover > 0 && (
              <div className="text-[11px] font-semibold text-amber-700 mt-1">
                Gaji Periode Ini: {formatRupiah(salary.currentPeriodSalary)} + Sisa Bulan Lalu: {formatRupiah(salary.previousUnpaidCarryover)}
              </div>
            )}
          </div>

          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold self-start sm:self-center ${statusMeta.cls}`}>
            {statusMeta.label}
          </div>
        </div>

        {salary.previousUnpaidCarryover > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2 font-bold text-amber-900">
              <span>Akumulasi Sisa Gaji Bulan Lalu (Belum Terbayar)</span>
              <span className="font-mono-num text-amber-700">+ {formatRupiah(salary.previousUnpaidCarryover)}</span>
            </div>
            {salary.carryoverBreakdown.length > 0 && (
              <div className="space-y-0.5 text-[11px] text-amber-800">
                {salary.carryoverBreakdown.map((c) => (
                  <div key={c.month} className="flex items-center justify-between gap-2">
                    <span>
                      • {formatMonthLabel(c.month)} (Hak {formatRupiah(c.earned)} - Bayar {formatRupiah(c.paid)})
                    </span>
                    <span className="font-semibold font-mono-num">sisa {formatRupiah(c.unpaidEnd)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Gaji Pokok</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono-num mt-0.5">
              {formatRupiah(salary.totalBaseSalary)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {employee.salaryType === 'hourly'
                ? `${salary.totalHours} jam x ${formatRupiah(employee.salaryRate)}`
                : `${salary.totalDays} hari x ${formatRupiah(employee.salaryRate)}`}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-500">Insentif &amp; Bonus</div>
            <div className="text-base sm:text-lg font-bold text-blue-600 font-mono-num mt-0.5">
              {formatRupiah(salary.totalIncentive)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {salary.incentiveBreakdowns.length} komponen komisi
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-500">Sudah Dibayar / Kasbon</div>
            <div className="text-base sm:text-lg font-bold text-amber-600 font-mono-num mt-0.5">
              {formatRupiah(salary.totalPaid)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {salary.hasKasbon ? `Termasuk kasbon ${formatRupiah(salary.totalKasbon)}` : `${salary.payments.length} transaksi`}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-500">Sisa Gaji Diterima</div>
            <div
              className={`text-base sm:text-lg font-bold font-mono-num mt-0.5 ${
                salary.remainingUnpaid < 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatRupiah(salary.remainingUnpaid)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Saldo hak gaji bersih
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Insentif & Kehadiran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rincian Insentif */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Rincian Insentif &amp; Bonus</h3>
          </div>

          {salary.incentiveBreakdowns.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Belum ada insentif atau bonus yang tercatat pada periode ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {salary.incentiveBreakdowns.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      {roleLabels[item.role] || item.role}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 font-mono-num whitespace-nowrap">
                    {formatRupiah(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rincian Kehadiran */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-3 sm:pr-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Riwayat Kehadiran ({salary.attendanceCount})</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 font-mono-num">
              {formatRupiah(salary.totalBaseSalary)}
            </span>
          </div>

          {sortedAttendanceRecords.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Belum ada absensi kehadiran pada periode ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {sortedAttendanceRecords.map((att) => {
                const pcsSold = getPcsSoldForAttendance(att);
                const trainingInfo = formatTrainingSummary(att);
                return (
                  <div
                    key={att.id}
                    className="py-2.5 pr-4 sm:pr-6 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{formatDateIndo(att.date)}</div>
                      <div className="text-[11px] text-slate-500">{formatAttendanceRole(att.role)}</div>
                      {trainingInfo && (
                        <div className="text-[11px] text-orange-700 font-semibold truncate mt-0.5">
                          {trainingInfo}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="text-right font-mono-num">
                        <div className="font-semibold text-blue-600 whitespace-nowrap">
                          {formatNumber(pcsSold)} pcs
                        </div>
                        <div className="text-[10px] text-slate-400">Terjual</div>
                      </div>
                      <div className="text-right font-mono-num min-w-[54px] pr-1 sm:pr-2">
                        <div className="font-semibold text-slate-700 whitespace-nowrap">
                          {att.salaryType === 'hourly' ? `${att.hoursWorked} jam` : '1 shift'}
                        </div>
                        <div className="text-[10px] text-slate-400">Durasi</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Pembayaran / Kasbon */}
      {salary.payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Riwayat Pembayaran &amp; Kasbon</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {salary.payments.map((pay) => (
              <div key={pay.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{pay.description}</div>
                  <div className="text-[11px] text-slate-500">{formatDateIndo(pay.date)}</div>
                </div>
                <div className="flex items-center gap-2.5">
                  {pay.proofImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewProof(pay.proofImageUrl || null)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Lihat Bukti
                    </button>
                  )}
                  <span className="font-bold text-emerald-600 font-mono-num">
                    {formatRupiah(pay.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewProof && (
        <div
          onClick={() => setPreviewProof(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-3 max-w-md w-full space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Bukti Pembayaran</span>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewProof}
              alt="Bukti pembayaran"
              className="w-full rounded-xl object-contain max-h-[70vh]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
