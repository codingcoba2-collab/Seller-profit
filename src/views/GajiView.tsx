import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { Employee, AttendanceRecord, SalesRecord, BallInventory, CurrentUser, PeriodFilter, UserRole } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString, roleLabels, roleBadgeColors } from '../utils/formatters';
import { 
  Receipt, 
  Calendar, 
  Clock, 
  Coins, 
  Eye, 
  UserCheck, 
  FileText, 
  Sparkles,
  ArrowLeft,
  X,
  Printer
} from 'lucide-react';

interface GajiViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GajiView: React.FC<GajiViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allSales, setAllSales] = useState<SalesRecord[]>([]);
  const [allInventory, setAllInventory] = useState<BallInventory[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState<Employee | null>(null);

  useEffect(() => {
    const empList = StorageService.getEmployees(currentUser.storeId);
    setEmployees(empList);

    const attList = StorageService.getAttendance(currentUser.storeId);
    setAllAttendance(attList);

    const salesList = StorageService.getSales(currentUser.storeId);
    setAllSales(salesList);

    const invList = StorageService.getInventory(currentUser.storeId);
    setAllInventory(invList);
  }, [currentUser.storeId]);

  // Filter helper based on date
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

  // Calculate salary for each employee
  const calculatedSalaryData = useMemo(() => {
    const steamSortirLogs = StorageService.getSteamSortir(currentUser.storeId);

    return employees.map(emp => {
      // 1. Attendance & Base Salary
      const empAttendance = allAttendance.filter(a => 
        (a.employeeId === emp.id || a.employeeName === emp.name) && filterByPeriod(a.date)
      );

      let totalBaseSalary = 0;
      let totalHours = 0;
      let totalDays = 0;

      empAttendance.forEach(att => {
        if (att.salaryType === 'hourly') {
          const hrs = att.hoursWorked || 0;
          totalHours += hrs;
          totalBaseSalary += hrs * (emp.salaryRate || 0);
        } else {
          totalDays += 1;
          totalBaseSalary += (emp.salaryRate || 0);
        }
      });

      // 2. Insentif Per Role (Host, Admin Toko, Sortir, Steam)
      let totalIncentive = 0;
      const incentiveBreakdowns: { role: UserRole | 'multi_role' | 'monthly_bonus'; desc: string; amount: number }[] = [];

      const filteredSales = allSales.filter(s => filterByPeriod(s.date));
      const totalStoreOmzet = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
      const totalStorePackages = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
      const totalStorePcs = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);

      // Track total packages & pcs for this employee
      let empTotalPackages = 0;
      let empTotalPcs = 0;

      emp.roles.forEach(role => {
        const config = emp.incentiveConfigs?.[role];
        if (!config || config.type === 'none') return;

        if (role === 'host') {
          const mySales = filteredSales.filter(s => 
            s.hostIds?.includes(emp.id) || 
            s.hostNames?.some(hn => hn.toLowerCase().includes(emp.name.toLowerCase()))
          );

          const hostPkgs = mySales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
          const hostPcs = mySales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
          empTotalPackages += hostPkgs;
          empTotalPcs += hostPcs;

          // Check Tier Rule (Requirement 1 & 7)
          const isTierAchieved = Boolean(config.hasTierRule && config.tierThresholdPackages && hostPkgs >= config.tierThresholdPackages);
          const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : (config.rate || 0);

          if (config.type === 'per_pcs_sold') {
            const amount = hostPcs * effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'host',
              desc: isTierAchieved 
                ? `✨ Target Tier Tercapai (≥ ${config.tierThresholdPackages} paket): ${hostPcs} pcs x ${formatRupiah(effectiveRate)}`
                : `${hostPcs} pcs terjual live x ${formatRupiah(effectiveRate)}`,
              amount,
            });
          } else if (config.type === 'per_package_sold') {
            const amount = hostPkgs * effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'host',
              desc: isTierAchieved 
                ? `✨ Target Tier Tercapai (≥ ${config.tierThresholdPackages} paket): ${hostPkgs} paket x ${formatRupiah(effectiveRate)}`
                : `${hostPkgs} paket live x ${formatRupiah(effectiveRate)}`,
              amount,
            });
          } else if (config.type === 'fixed_amount') {
            const amount = effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'host',
              desc: isTierAchieved ? `✨ Target Tier Tercapai: Insentif Host Flat` : `Insentif Tetap Host`,
              amount,
            });
          }
        } else if (role === 'admin_toko') {
          const adminSales = filteredSales.filter(s => 
            s.adminIds?.includes(emp.id) || 
            s.adminId === emp.id || 
            s.adminNames?.some(an => an.toLowerCase().includes(emp.name.toLowerCase())) ||
            (s.adminName && s.adminName.toLowerCase().includes(emp.name.toLowerCase()))
          );

          const adminPkgs = adminSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
          const adminPcs = adminSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
          empTotalPackages += adminPkgs;
          empTotalPcs += adminPcs;

          // Check Tier Rule for Admin Toko
          const isTierAchieved = Boolean(config.hasTierRule && config.tierThresholdPackages && adminPkgs >= config.tierThresholdPackages);
          const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : (config.rate || 0);

          if (config.type === 'per_package_sold') {
            const amount = adminPkgs * effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc: isTierAchieved
                ? `✨ Target Tier Tercapai (≥ ${config.tierThresholdPackages} paket): ${adminPkgs} paket dicatat x ${formatRupiah(effectiveRate)}`
                : `${adminPkgs} paket dicatat & dipacking saat live x ${formatRupiah(effectiveRate)}`,
              amount,
            });
          } else if (config.type === 'per_pcs_sold') {
            const amount = adminPcs * effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc: isTierAchieved
                ? `✨ Target Tier Tercapai (≥ ${config.tierThresholdPackages} paket): ${adminPcs} pcs dicatat x ${formatRupiah(effectiveRate)}`
                : `${adminPcs} pcs dicatat x ${formatRupiah(effectiveRate)}`,
              amount,
            });
          } else if (config.type === 'fixed_amount') {
            const amount = effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc: isTierAchieved ? `✨ Target Tier Tercapai: Insentif Admin Flat` : `Insentif Tetap Admin Toko`,
              amount,
            });
          }
        } else if (role === 'sortir' || role === 'steam') {
          const workerLogs = steamSortirLogs.filter(log => {
            const isMatchRole = log.processType === role || log.processType === 'sortir_dan_steam';
            const isMatchEmp = log.employeeIds?.includes(emp.id) || 
              log.employeeNames?.some(en => en.toLowerCase().includes(emp.name.toLowerCase()));
            return isMatchRole && isMatchEmp && filterByPeriod(log.date);
          });

          const totalPcsWorked = workerLogs.reduce((acc, l) => acc + (l.pcsTotal || 0), 0);
          if (config.type === 'per_ball_pcs') {
            const amount = totalPcsWorked * (config.rate || 0);
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role,
              desc: `${totalPcsWorked} pcs ${role} ball x ${formatRupiah(config.rate)}`,
              amount,
            });
          }
        }
      });

      // 3. Req 2 & 8: Bonus Rangkap Role Penjualan Paket
      if (emp.roles.length > 1 && emp.multiRoleSalesRule?.active) {
        const rule = emp.multiRoleSalesRule;
        const evaluatedPackages = empTotalPackages > 0 ? empTotalPackages : totalStorePackages;
        const evaluatedPcs = empTotalPcs > 0 ? empTotalPcs : totalStorePcs;

        if (evaluatedPackages >= (rule.thresholdPackages || 0)) {
          let bonusAmount = 0;
          let bonusLabel = '';

          if (rule.benefitType === 'bonus_per_package') {
            bonusAmount = evaluatedPackages * (rule.benefitValue || 0);
            bonusLabel = `Bonus Rangkap Role (${evaluatedPackages} paket x ${formatRupiah(rule.benefitValue)})`;
          } else if (rule.benefitType === 'bonus_per_pcs') {
            bonusAmount = evaluatedPcs * (rule.benefitValue || 0);
            bonusLabel = `Bonus Rangkap Role (${evaluatedPcs} pcs x ${formatRupiah(rule.benefitValue)})`;
          } else if (rule.benefitType === 'hourly_rate_override') {
            bonusAmount = totalHours * (rule.benefitValue || 0);
            bonusLabel = `Kenaikan Gaji Pokok Rangkap Role (${totalHours} jam x ${formatRupiah(rule.benefitValue)})`;
          } else {
            bonusAmount = rule.benefitValue || 0;
            bonusLabel = `Bonus Tetap Rangkap Role (Tembus ${rule.thresholdPackages} paket)`;
          }

          if (bonusAmount > 0) {
            totalIncentive += bonusAmount;
            incentiveBreakdowns.push({
              role: 'multi_role',
              desc: `🎁 ${bonusLabel} (Target: $\ge$ ${rule.thresholdPackages} paket)`,
              amount: bonusAmount,
            });
          }
        }
      }

      // 4. Req 4 & 9: Bonus Bulanan Pencapaian Target Omzet Toko
      if (emp.monthlyOmzetBonusRule?.active) {
        const omzetRule = emp.monthlyOmzetBonusRule;
        if (totalStoreOmzet >= (omzetRule.targetOmzet || 0)) {
          let omzetBonusAmount = 0;
          if (omzetRule.bonusType === 'percentage') {
            omzetBonusAmount = Math.round(((omzetRule.bonusValue || 0) / 100) * totalStoreOmzet);
          } else {
            omzetBonusAmount = omzetRule.bonusValue || 0;
          }

          if (omzetBonusAmount > 0) {
            totalIncentive += omzetBonusAmount;
            incentiveBreakdowns.push({
              role: 'monthly_bonus',
              desc: `🏆 Bonus Capai Target Omzet Toko (Omzet ${formatRupiah(totalStoreOmzet)} ≥ Target ${formatRupiah(omzetRule.targetOmzet)}) - ${omzetRule.bonusType === 'percentage' ? `${omzetRule.bonusValue}%` : 'Flat'}`,
              amount: omzetBonusAmount,
            });
          }
        }
      }

      return {
        emp,
        totalBaseSalary,
        totalHours,
        totalDays,
        totalIncentive,
        totalGrandSalary: totalBaseSalary + totalIncentive,
        attendanceCount: empAttendance.length,
        attendanceRecords: empAttendance,
        incentiveBreakdowns,
      };
    });
  }, [employees, allAttendance, allSales, allInventory, period, selectedDate, currentUser.storeId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header & Period Filters without stage labels (Requirement 5 & 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-gaji"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Rekap Gaji &amp; Insentif Pegawai / Host
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {!currentUser.isOwner
                ? 'Slip gaji dan komisi insentif pribadi Anda sesuai kehadiran dan performa live'
                : 'Rekapitulasi seluruh gaji pokok shift/jam dan insentif pegawai toko'}
            </p>
          </div>
        </div>

        {/* Filter Periode */}
        <div className="flex flex-wrap items-center gap-2 bg-[#161823] p-1.5 rounded-2xl border border-white/10 shadow-lg">
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

      {/* Salary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {calculatedSalaryData.map(item => (
          <div
            key={item.emp.id}
            className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-white text-base">
                    {item.emp.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.emp.roles.map(r => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30"
                      >
                        {roleLabels[r]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              {/* Gaji Breakdown Cards */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between">
                  <span className="text-zinc-400">
                    Gaji Pokok ({item.emp.salaryType === 'hourly' ? `${item.totalHours} jam` : `${item.totalDays} hari`}):
                  </span>
                  <strong className="text-white font-bold">
                    {formatRupiah(item.totalBaseSalary)}
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-[#0b0c10] border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-emerald-400 font-medium">
                    Total Insentif:
                  </span>
                  <strong className="text-emerald-400 font-bold">
                    {formatRupiah(item.totalIncentive)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Total Gaji & Detail Button */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total Diterima:</span>
                <span className="text-xl font-black text-[#25F4EE]">
                  {formatRupiah(item.totalGrandSalary)}
                </span>
              </div>

              <button
                id={`btn-detail-gaji-${item.emp.id}`}
                onClick={() => setSelectedEmpForDetail(item.emp)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#25F4EE]" />
                <span>Rincian Slip Gaji</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slip Gaji Modal Detail */}
      {selectedEmpForDetail && (() => {
        const detailData = calculatedSalaryData.find(d => d.emp.id === selectedEmpForDetail.id);
        if (!detailData) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-[#161823] p-6 sm:p-7 shadow-2xl border border-white/10 space-y-5 max-h-[90vh] overflow-y-auto text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Slip Gaji &amp; Insentif</h3>
                    <p className="text-xs text-zinc-400">{selectedEmpForDetail.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmpForDetail(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rincian Slip */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Nama Pegawai:</span>
                    <strong className="text-white text-xs">{selectedEmpForDetail.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Role:</span>
                    <strong className="text-white text-xs">
                      {selectedEmpForDetail.roles.map(r => roleLabels[r]).join(', ')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Tarif Gaji Pokok:</span>
                    <strong className="text-white text-xs">
                      {formatRupiah(selectedEmpForDetail.salaryRate)} / {selectedEmpForDetail.salaryType === 'hourly' ? 'jam' : 'hari'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Total Kehadiran:</span>
                    <strong className="text-white text-xs">
                      {detailData.attendanceCount} Shift ({detailData.totalHours} Jam)
                    </strong>
                  </div>
                </div>

                {/* Rincian Tanggal Masuk */}
                <div>
                  <h4 className="font-bold text-white mb-2">Riwayat Presensi &amp; Jam Kerja:</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {detailData.attendanceRecords.length === 0 ? (
                      <p className="text-zinc-500 text-[11px]">Tidak ada catatan presensi di periode ini.</p>
                    ) : (
                      detailData.attendanceRecords.map(att => (
                        <div key={att.id} className="p-2 rounded-xl bg-[#0b0c10] border border-white/5 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-300">{formatDateIndo(att.date)}</span>
                          <span className="font-semibold text-[#25F4EE]">
                            {att.salaryType === 'hourly' ? `${att.hoursWorked} Jam` : '1 Hari'} ({formatRupiah(att.salaryType === 'hourly' ? att.hoursWorked * selectedEmpForDetail.salaryRate : selectedEmpForDetail.salaryRate)})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Rincian Insentif */}
                {detailData.incentiveBreakdowns.length > 0 && (
                  <div className="pt-2">
                    <h4 className="font-bold text-white mb-2">Rincian Komisi Insentif:</h4>
                    <div className="space-y-1.5">
                      {detailData.incentiveBreakdowns.map((inc, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#0b0c10] border border-emerald-500/30 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-emerald-400 block">{roleLabels[inc.role]}</span>
                            <span className="text-zinc-400">{inc.desc}</span>
                          </div>
                          <strong className="text-emerald-400 text-xs font-extrabold">
                            {formatRupiah(inc.amount)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Gaji Pokok:</span>
                    <span className="text-white">{formatRupiah(detailData.totalBaseSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Total Insentif:</span>
                    <span className="text-white">{formatRupiah(detailData.totalIncentive)}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                    <span className="font-bold text-sm text-white">Total Gaji Bersih:</span>
                    <span className="font-black text-xl text-[#25F4EE]">{formatRupiah(detailData.totalGrandSalary)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmpForDetail(null)}
                className="w-full py-2.5 rounded-xl bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup Slip Gaji
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
