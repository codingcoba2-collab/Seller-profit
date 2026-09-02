import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Employee, AttendanceRecord, SalesRecord, BallInventory, CurrentUser, PeriodFilter, UserRole, CashflowRecord } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString, roleLabels, roleBadgeColors } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
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
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Image as ImageIcon,
  Upload,
  ShieldAlert,
  Plus
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
  const [cashflows, setCashflows] = useState<CashflowRecord[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState<Employee | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Quick Pay Modal State (for Owner)
  const [quickPayEmp, setQuickPayEmp] = useState<{ emp: Employee; unpaidAmount: number } | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(getTodayString());
  const [payType, setPayType] = useState<'gaji_insentif' | 'kasbon'>('gaji_insentif');
  const [payDescription, setPayDescription] = useState('');
  const [payProofImage, setPayProofImage] = useState('');
  const quickPayFileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const empList = StorageService.getEmployees(currentUser.storeId);
    
    // Non-owner role restriction: Only allow viewing personal employee data
    if (!currentUser.isOwner) {
      const myEmp = empList.filter(e => 
        e.id === currentUser.id || 
        e.username.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (myEmp.length > 0) {
        setEmployees(myEmp);
      } else if (currentUser.employeeProfile) {
        setEmployees([currentUser.employeeProfile]);
      } else {
        setEmployees([]);
      }
    } else {
      setEmployees(empList);
    }

    const attList = StorageService.getAttendance(currentUser.storeId);
    setAllAttendance(attList);

    const salesList = StorageService.getSales(currentUser.storeId);
    setAllSales(salesList);

    const invList = StorageService.getInventory(currentUser.storeId);
    setAllInventory(invList);

    const cfList = StorageService.getCashflow(currentUser.storeId);
    setCashflows(cfList);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId, currentUser.id, currentUser.isOwner, currentUser.username]);

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

  // Calculate salary for each employee + Cashflow Payment status
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

          const threshold = config.tierThresholdPackages || 0;
          const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && hostPkgs >= threshold);
          const tierMode = config.tierCalculationMode || 'excess_only';
          const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : (config.rate || 0);

          if (config.type === 'per_pcs_sold') {
            let amount = 0;
            let desc = '';
            if (isTierAchieved && tierMode === 'excess_only') {
              const excessRatio = hostPkgs > 0 ? Math.max(0, hostPkgs - threshold) / hostPkgs : 0;
              const excessPcs = Math.round(hostPcs * excessRatio);
              const basePcs = Math.max(0, hostPcs - excessPcs);
              amount = (basePcs * (config.rate || 0)) + (excessPcs * (config.tierRate || 0));
              desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePcs} pcs dasar x ${formatRupiah(config.rate)} + ${excessPcs} pcs selisih x ${formatRupiah(config.tierRate)}`;
            } else if (isTierAchieved && tierMode === 'all_units') {
              amount = hostPcs * effectiveRate;
              desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${hostPcs} pcs x ${formatRupiah(effectiveRate)}`;
            } else {
              amount = hostPcs * (config.rate || 0);
              desc = `${hostPcs} pcs terjual live x ${formatRupiah(config.rate)}`;
            }
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'host',
              desc,
              amount,
            });
          } else if (config.type === 'per_package_sold') {
            let amount = 0;
            let desc = '';
            if (isTierAchieved && tierMode === 'excess_only') {
              const basePkgs = Math.min(hostPkgs, threshold);
              const excessPkgs = Math.max(0, hostPkgs - threshold);
              amount = (basePkgs * (config.rate || 0)) + (excessPkgs * (config.tierRate || 0));
              desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePkgs} paket dasar x ${formatRupiah(config.rate)} + ${excessPkgs} paket selisih x ${formatRupiah(config.tierRate)}`;
            } else if (isTierAchieved && tierMode === 'all_units') {
              amount = hostPkgs * effectiveRate;
              desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${hostPkgs} paket x ${formatRupiah(effectiveRate)}`;
            } else {
              amount = hostPkgs * (config.rate || 0);
              desc = `${hostPkgs} paket live x ${formatRupiah(config.rate)}`;
            }
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'host',
              desc,
              amount,
            });
          } else if (config.type === 'fixed_amount') {
            const amount = effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'host',
              desc: isTierAchieved ? `✨ Target Tier Tercapai: Insentif Host Flat ${formatRupiah(effectiveRate)}` : `Insentif Tetap Host`,
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

          const threshold = config.tierThresholdPackages || 0;
          const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && adminPkgs >= threshold);
          const tierMode = config.tierCalculationMode || 'excess_only';
          const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : (config.rate || 0);

          if (config.type === 'per_package_sold') {
            let amount = 0;
            let desc = '';
            if (isTierAchieved && tierMode === 'excess_only') {
              const basePkgs = Math.min(adminPkgs, threshold);
              const excessPkgs = Math.max(0, adminPkgs - threshold);
              amount = (basePkgs * (config.rate || 0)) + (excessPkgs * (config.tierRate || 0));
              desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePkgs} paket dasar x ${formatRupiah(config.rate)} + ${excessPkgs} paket selisih x ${formatRupiah(config.tierRate)}`;
            } else if (isTierAchieved && tierMode === 'all_units') {
              amount = adminPkgs * effectiveRate;
              desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${adminPkgs} paket dicatat x ${formatRupiah(effectiveRate)}`;
            } else {
              amount = adminPkgs * (config.rate || 0);
              desc = `${adminPkgs} paket dicatat & dipacking saat live x ${formatRupiah(config.rate)}`;
            }
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc,
              amount,
            });
          } else if (config.type === 'per_pcs_sold') {
            let amount = 0;
            let desc = '';
            if (isTierAchieved && tierMode === 'excess_only') {
              const excessRatio = adminPkgs > 0 ? Math.max(0, adminPkgs - threshold) / adminPkgs : 0;
              const excessPcs = Math.round(adminPcs * excessRatio);
              const basePcs = Math.max(0, adminPcs - excessPcs);
              amount = (basePcs * (config.rate || 0)) + (excessPcs * (config.tierRate || 0));
              desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePcs} pcs dasar x ${formatRupiah(config.rate)} + ${excessPcs} pcs selisih x ${formatRupiah(config.tierRate)}`;
            } else if (isTierAchieved && tierMode === 'all_units') {
              amount = adminPcs * effectiveRate;
              desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${adminPcs} pcs dicatat x ${formatRupiah(effectiveRate)}`;
            } else {
              amount = adminPcs * (config.rate || 0);
              desc = `${adminPcs} pcs dicatat x ${formatRupiah(config.rate)}`;
            }
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc,
              amount,
            });
          } else if (config.type === 'fixed_amount') {
            const amount = effectiveRate;
            totalIncentive += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc: isTierAchieved ? `✨ Target Tier Tercapai: Insentif Admin Flat ${formatRupiah(effectiveRate)}` : `Insentif Tetap Admin Toko`,
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

      // 3. Bonus Rangkap Role Penjualan Paket
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
              desc: `🎁 ${bonusLabel} (Target: ≥ ${rule.thresholdPackages} paket)`,
              amount: bonusAmount,
            });
          }
        }
      }

      // 4. Bonus Bulanan Pencapaian Target Omzet Toko
      if (emp.monthlyOmzetBonusRule?.active) {
        const omzetRule = emp.monthlyOmzetBonusRule;
        if (totalStoreOmzet >= (omzetRule.targetOmzet || 0)) {
          let omzetBonusAmount = 0;
          let bonusDescText = '';
          if (omzetRule.bonusType === 'percentage') {
            omzetBonusAmount = Math.round(((omzetRule.bonusValue || 0) / 100) * totalStoreOmzet);
            bonusDescText = `🏆 Bonus Capai Target Omzet Toko (${omzetRule.bonusValue}% dari Omzet ${formatRupiah(totalStoreOmzet)})`;
          } else if (omzetRule.bonusType === 'percentage_laba_bersih') {
            const payrollSummary = StorageService.calculateStorePayroll(currentUser.storeId, filterByPeriod);
            const employeePayroll = payrollSummary.employeeSalaries.find(e => e.employee.id === emp.id);
            omzetBonusAmount = employeePayroll?.monthlyOmzetBonus || 0;
            bonusDescText = employeePayroll?.monthlyOmzetBonusDesc || `🏆 Bonus Capai Target Omzet Toko (${omzetRule.bonusValue}% dari Laba Bersih Toko)`;
          } else {
            omzetBonusAmount = omzetRule.bonusValue || 0;
            bonusDescText = `🏆 Bonus Capai Target Omzet Toko (Flat ${formatRupiah(omzetBonusAmount)})`;
          }

          if (omzetBonusAmount > 0) {
            totalIncentive += omzetBonusAmount;
            incentiveBreakdowns.push({
              role: 'monthly_bonus',
              desc: bonusDescText,
              amount: omzetBonusAmount,
            });
          }
        }
      }

      const totalGrandSalary = totalBaseSalary + totalIncentive;

      // 5. Payment Summary from Cashflow Records (Paid vs Unpaid + Proof Images + Kasbon)
      const paymentSummary = StorageService.getEmployeeSalaryPaymentSummary(
        currentUser.storeId,
        emp.id,
        totalGrandSalary,
        filterByPeriod
      );

      return {
        emp,
        totalBaseSalary,
        totalHours,
        totalDays,
        totalIncentive,
        totalGrandSalary,
        attendanceCount: empAttendance.length,
        attendanceRecords: empAttendance,
        incentiveBreakdowns,
        totalPaid: paymentSummary.totalPaid,
        totalGajiPaid: paymentSummary.totalGajiPaid,
        totalKasbon: paymentSummary.totalKasbon,
        hasKasbon: paymentSummary.hasKasbon,
        remainingUnpaid: paymentSummary.remainingUnpaid,
        paymentStatus: paymentSummary.status,
        payments: paymentSummary.payments,
      };
    });
  }, [employees, allAttendance, allSales, allInventory, cashflows, period, selectedDate, currentUser.storeId]);

  // Handle Quick Pay for Owner
  const handleOpenQuickPay = (emp: Employee, unpaid: number, initialType: 'gaji_insentif' | 'kasbon' = 'gaji_insentif') => {
    setQuickPayEmp({ emp, unpaidAmount: unpaid });
    setPayType(initialType);
    if (initialType === 'gaji_insentif') {
      setPayAmount(unpaid > 0 ? unpaid : 0);
      setPayDescription(`Pembayaran Gaji & Insentif - ${emp.name}`);
    } else {
      setPayAmount(0);
      setPayDescription(`Kasbon - ${emp.name}`);
    }
    setPayDate(getTodayString());
    setPayProofImage('');
  };

  const handlePayTypeChange = (newType: 'gaji_insentif' | 'kasbon') => {
    setPayType(newType);
    if (!quickPayEmp) return;
    if (newType === 'gaji_insentif') {
      if (payAmount === 0 && quickPayEmp.unpaidAmount > 0) {
        setPayAmount(quickPayEmp.unpaidAmount);
      }
      setPayDescription(`Pembayaran Gaji & Insentif - ${quickPayEmp.emp.name}`);
    } else {
      setPayDescription(`Kasbon - ${quickPayEmp.emp.name}`);
    }
  };

  const handleQuickPayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onNotify?.('Ukuran file foto maksimal 5MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPayProofImage(reader.result);
        onNotify?.('Foto bukti transfer berhasil diunggah!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayEmp) return;
    if (payAmount <= 0) {
      onNotify?.('Nominal pembayaran / kasbon harus lebih dari 0!', 'error');
      return;
    }

    const defaultDesc = payType === 'kasbon' 
      ? `Kasbon - ${quickPayEmp.emp.name}` 
      : `Pembayaran Gaji & Insentif - ${quickPayEmp.emp.name}`;

    const newCashflow: CashflowRecord = {
      id: 'cf-' + Date.now(),
      storeId: currentUser.storeId,
      date: payDate,
      type: 'outflow',
      amount: payAmount,
      category: 'gaji_pegawai',
      paymentType: payType,
      description: payDescription || defaultDesc,
      employeeId: quickPayEmp.emp.id,
      employeeName: quickPayEmp.emp.name,
      periodMonth: payDate.slice(0, 7),
      proofImageUrl: payProofImage || undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.addCashflow(newCashflow);
    const successMsg = payType === 'kasbon'
      ? `Kasbon sebesar ${formatRupiah(payAmount)} untuk ${quickPayEmp.emp.name} berhasil dicatat di Kas!`
      : `Pembayaran gaji sebesar ${formatRupiah(payAmount)} untuk ${quickPayEmp.emp.name} berhasil dicatat di Kas!`;
    onNotify?.(successMsg, 'success');
    setQuickPayEmp(null);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header & Period Filters */}
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
                {currentUser.isOwner ? 'Rekap Gaji &amp; Insentif Seluruh Tim' : 'Slip Gaji &amp; Insentif Personal'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                currentUser.isOwner 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                  : 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/30'
              }`}>
                {currentUser.isOwner ? '👑 Mode Owner (Akses Penuh)' : '🔒 Data Personal Privat'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {!currentUser.isOwner
                ? 'Slip gaji, komisi insentif, status pembayaran transfer kas, dan bukti struk pribadi Anda'
                : 'Rekapitulasi seluruh gaji pokok shift/jam, insentif live, status pembayaran kas & bukti foto'}
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

      {/* Non-Owner Privacy Notice */}
      {!currentUser.isOwner && (
        <div className="p-4 rounded-2xl bg-[#161823] border border-[#25F4EE]/30 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#0b0c10] text-[#25F4EE]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Privasi Gaji Karyawan</h4>
            <p className="text-[11px] text-zinc-400">
              Sesuai kebijakan keamanan, hanya Owner yang dapat melihat seluruh rekap gaji toko. Anda hanya dapat melihat rincian slip dan bukti transfer gaji personal milik Anda.
            </p>
          </div>
        </div>
      )}

      {/* Salary Cards Grid */}
      {calculatedSalaryData.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#161823] border border-white/10 text-zinc-400 text-xs">
          Tidak ada data gaji pada filter periode ini.
        </div>
      ) : (
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

                  {/* Status Pembayaran Badge */}
                  <div className="text-right">
                    {item.paymentStatus === 'kasbon_exceeded' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        <span>Kasbon Minus ({formatRupiah(item.remainingUnpaid)})</span>
                      </span>
                    ) : item.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Lunas</span>
                      </span>
                    ) : item.paymentStatus === 'partial' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock3 className="w-3 h-3" />
                        <span>Sebagian</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" />
                        <span>Belum Dibayar</span>
                      </span>
                    )}
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

                  {/* Status Pembayaran Kas & Sisa Gaji */}
                  <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Total Hak Gaji:</span>
                      <strong className="text-white">{formatRupiah(item.totalGrandSalary)}</strong>
                    </div>

                    {item.totalGajiPaid > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-medium">Terbayar (Gaji):</span>
                        <strong className="text-emerald-400 font-bold">{formatRupiah(item.totalGajiPaid)}</strong>
                      </div>
                    )}

                    {item.hasKasbon && (
                      <div className="flex items-center justify-between text-[11px] text-amber-400">
                        <span className="font-medium flex items-center gap-1">
                          <span>💳 Kasbon Pegawai:</span>
                        </span>
                        <strong className="font-bold">{formatRupiah(item.totalKasbon)}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                      <span className={item.remainingUnpaid < 0 ? 'text-rose-400 font-bold' : item.remainingUnpaid > 0 ? 'text-[#FE2C55] font-bold' : 'text-zinc-400'}>
                        {item.remainingUnpaid < 0 ? 'Sisa Gaji (Kasbon Melebihi):' : 'Sisa Belum Terbayar:'}
                      </span>
                      <strong className={item.remainingUnpaid < 0 ? 'text-rose-400 font-black' : item.remainingUnpaid > 0 ? 'text-[#FE2C55] font-black' : 'text-emerald-400 font-bold'}>
                        {formatRupiah(item.remainingUnpaid)} {item.remainingUnpaid < 0 ? '(Minus)' : ''}
                      </strong>
                    </div>
                  </div>

                  {/* Keterangan Kasbon di bawah ringkasan jika memang ada kasbon */}
                  {item.hasKasbon && (
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-0.5">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Keterangan Kasbon: {formatRupiah(item.totalKasbon)}</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-300 leading-snug">
                        {item.remainingUnpaid < 0
                          ? `Kasbon melebihi sisa gaji belum dibayar (${formatRupiah(item.remainingUnpaid)}). Total gaji bersih menjadi minus.`
                          : `Total gaji bersih setelah dikurangi kasbon: ${formatRupiah(item.remainingUnpaid)}.`}
                      </p>
                    </div>
                  )}

                  {/* Proof photo count if any */}
                  {item.payments.some(p => p.proofImageUrl) && (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#25F4EE] font-bold">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{item.payments.filter(p => p.proofImageUrl).length} Bukti Foto Transfer Terlampir</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Gaji & Action Buttons */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-zinc-400">
                    {item.hasKasbon ? 'Total Gaji Bersih (Sisa):' : 'Total Gaji Bersih:'}
                  </span>
                  <span className={`text-xl font-black ${item.remainingUnpaid < 0 ? 'text-rose-400' : 'text-[#25F4EE]'}`}>
                    {formatRupiah(item.hasKasbon ? item.remainingUnpaid : item.totalGrandSalary)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id={`btn-detail-gaji-${item.emp.id}`}
                    onClick={() => setSelectedEmpForDetail(item.emp)}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#25F4EE]" />
                    <span>Slip Gaji &amp; Bukti</span>
                  </button>

                  {currentUser.isOwner && (
                    <button
                      onClick={() => handleOpenQuickPay(item.emp, item.remainingUnpaid > 0 ? item.remainingUnpaid : 0)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 text-[#FE2C55] hover:text-white font-bold text-xs border border-[#FE2C55]/30 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Bayar / Kasbon</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slip Gaji Modal Detail */}
      {selectedEmpForDetail && (() => {
        const detailData = calculatedSalaryData.find(d => d.emp.id === selectedEmpForDetail.id);
        if (!detailData) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl bg-[#161823] p-6 sm:p-7 shadow-2xl border border-white/15 space-y-5 max-h-[92vh] overflow-y-auto text-white">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Slip Gaji &amp; Rincian Pembayaran</h3>
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
              <div className="space-y-4 text-xs">
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
                  <h4 className="font-bold text-white mb-2 flex items-center justify-between">
                    <span>Riwayat Presensi &amp; Jam Kerja:</span>
                    <span className="text-zinc-400 text-[10px]">{detailData.attendanceRecords.length} catatan</span>
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {detailData.attendanceRecords.length === 0 ? (
                      <p className="text-zinc-500 text-[11px] p-2 bg-[#0b0c10] rounded-xl">Tidak ada catatan presensi di periode ini.</p>
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
                  <div>
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

                {/* STATUS PEMBAYARAN & SISA GAJI */}
                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#25F4EE]" />
                      <span>Status Pembayaran Gaji &amp; Kasbon (Catatan Kas)</span>
                    </h4>
                    {detailData.paymentStatus === 'kasbon_exceeded' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                        ⚠️ Kasbon Minus ({formatRupiah(detailData.remainingUnpaid)})
                      </span>
                    ) : detailData.paymentStatus === 'paid' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ Lunas Terbayar
                      </span>
                    ) : detailData.paymentStatus === 'partial' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        ⏳ Terbayar Sebagian
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ⚠️ Belum Dibayar
                      </span>
                    )}
                  </div>

                  <div className={`grid ${detailData.hasKasbon ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 text-center pt-1`}>
                    <div className="p-2 rounded-xl bg-[#161823] border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">Total Hak Gaji</span>
                      <strong className="text-xs text-white block mt-0.5">{formatRupiah(detailData.totalGrandSalary)}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-[#161823] border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block">Terbayar (Gaji)</span>
                      <strong className="text-xs text-emerald-400 block mt-0.5">{formatRupiah(detailData.totalGajiPaid)}</strong>
                    </div>

                    {detailData.hasKasbon && (
                      <div className="p-2 rounded-xl bg-[#161823] border border-amber-500/30">
                        <span className="text-[10px] text-amber-400 block">Kasbon Diambil</span>
                        <strong className="text-xs text-amber-400 block mt-0.5">{formatRupiah(detailData.totalKasbon)}</strong>
                      </div>
                    )}

                    <div className="p-2 rounded-xl bg-[#161823] border border-rose-500/20">
                      <span className="text-[10px] text-rose-400 block">
                        {detailData.remainingUnpaid < 0 ? 'Sisa (Kasbon Minus)' : 'Sisa Bersih'}
                      </span>
                      <strong className={`text-xs block mt-0.5 ${detailData.remainingUnpaid < 0 ? 'text-rose-400 font-black' : detailData.remainingUnpaid === 0 ? 'text-emerald-400' : 'text-[#FE2C55]'}`}>
                        {formatRupiah(detailData.remainingUnpaid)} {detailData.remainingUnpaid < 0 ? '(Minus)' : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* BUKTI FOTO TRANSFER & RIWAYAT PEMBAYARAN */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Bukti Foto Transfer &amp; Riwayat Kas ({detailData.payments.length})</span>
                    </h4>
                    {currentUser.isOwner && (
                      <button
                        onClick={() => {
                          setSelectedEmpForDetail(null);
                          handleOpenQuickPay(selectedEmpForDetail, detailData.remainingUnpaid > 0 ? detailData.remainingUnpaid : 0);
                        }}
                        className="text-[11px] font-bold text-[#25F4EE] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Catat Pembayaran / Kasbon</span>
                      </button>
                    )}
                  </div>

                  {detailData.payments.length === 0 ? (
                    <div className="p-3 bg-[#0b0c10] rounded-xl border border-white/5 text-center text-zinc-500 text-[11px]">
                      Belum ada mutasi kas pengeluaran gaji atau kasbon untuk pegawai ini di periode tersebut.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {detailData.payments.map((p, idx) => {
                        const isKasbon = p.paymentType === 'kasbon' || p.description.toLowerCase().includes('kasbon');
                        return (
                          <div key={p.id || idx} className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5 flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{formatDateIndo(p.date)}</span>
                                <span className={`text-xs font-black ${isKasbon ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {formatRupiah(p.amount)}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isKasbon ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                                  {isKasbon ? '💳 Kasbon' : '💼 Gaji & Insentif'}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400">{p.description}</p>
                            </div>

                            {p.proofImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewPhotoUrl(p.proofImageUrl!)}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition"
                              >
                                <img
                                  src={p.proofImageUrl}
                                  alt="Bukti"
                                  className="w-5 h-5 rounded-md object-cover border border-emerald-500/30"
                                />
                                <span>Lihat Bukti</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500 italic shrink-0">Tanpa Foto</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Gaji Pokok:</span>
                    <span className="text-white">{formatRupiah(detailData.totalBaseSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Total Insentif:</span>
                    <span className="text-white">{formatRupiah(detailData.totalIncentive)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-300 pt-1 border-t border-white/5">
                    <span>Subtotal Hak Gaji:</span>
                    <span className="text-white font-bold">{formatRupiah(detailData.totalGrandSalary)}</span>
                  </div>

                  {detailData.hasKasbon && (
                    <div className="flex items-center justify-between text-xs text-amber-400">
                      <span>Potongan / Penarikan Kasbon:</span>
                      <span className="font-bold">- {formatRupiah(detailData.totalKasbon)}</span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                    <span className="font-bold text-sm text-white">
                      {detailData.hasKasbon ? 'Total Gaji Bersih (Setelah Kasbon):' : 'Total Gaji Bersih:'}
                    </span>
                    <span className={`font-black text-xl ${detailData.remainingUnpaid < 0 ? 'text-rose-400' : 'text-[#25F4EE]'}`}>
                      {formatRupiah(detailData.hasKasbon ? detailData.remainingUnpaid : detailData.totalGrandSalary)}
                    </span>
                  </div>

                  {/* Keterangan Kasbon di bawahnya jika memang ada kasbon */}
                  {detailData.hasKasbon && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Keterangan Kasbon Karyawan</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Tercatat penarikan kasbon sebesar <strong>{formatRupiah(detailData.totalKasbon)}</strong> di periode ini.
                        {detailData.remainingUnpaid < 0 
                          ? ` Karena kasbon melebihi sisa hak gaji, total gaji bersih menjadi minus (${formatRupiah(detailData.remainingUnpaid)}) dan tercatat sebagai tanggungan kasbon karyawan ke kas toko.`
                          : ` Total gaji bersih yang akan diterima setelah dipotong kasbon adalah ${formatRupiah(detailData.remainingUnpaid)}.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-[#25F4EE]" />
                  <span>Cetak Slip</span>
                </button>
                <button
                  onClick={() => setSelectedEmpForDetail(null)}
                  className="py-2.5 rounded-xl bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-bold text-xs transition cursor-pointer"
                >
                  Tutup Slip Gaji
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Pay Modal for Owner */}
      {quickPayEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#161823] p-6 sm:p-7 shadow-2xl border border-white/20 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0b0c10] text-[#FE2C55]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Catat Pembayaran Gaji / Kasbon</h3>
                  <p className="text-xs text-zinc-400">{quickPayEmp.emp.name}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickPayEmp(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickPay} className="space-y-4 text-xs">
              {/* Opsi Keterangan / Jenis Pembayaran: 2 Pilihan */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  Pilih Jenis Pembayaran <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handlePayTypeChange('gaji_insentif')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                      payType === 'gaji_insentif'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        💼 Gaji &amp; Insentif
                      </span>
                      {payType === 'gaji_insentif' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Pembayaran gaji pokok dan insentif kerja pegawai
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePayTypeChange('kasbon')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                      payType === 'kasbon'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                        💳 Kasbon
                      </span>
                      {payType === 'kasbon' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Pinjaman / penarikan kasbon di muka oleh pegawai
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Transaksi <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    Nominal {payType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji'} (Rp) <span className="text-[#FE2C55]">*</span>
                  </label>
                  {payType === 'gaji_insentif' && quickPayEmp.unpaidAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(quickPayEmp.unpaidAmount)}
                      className="text-[11px] text-[#25F4EE] hover:underline font-bold cursor-pointer"
                    >
                      Isi Sisa Gaji: {formatRupiah(quickPayEmp.unpaidAmount)}
                    </button>
                  )}
                </div>
                <CommaNumberInput
                  value={payAmount}
                  onChange={setPayAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
                {payType === 'kasbon' && (
                  <p className="text-[10.5px] text-amber-400 mt-1 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Jika kasbon melebihi sisa belum dibayar, total gaji bersih pegawai akan menjadi minus dan tercatat sebagai tanggungan kasbon.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={payDescription}
                  onChange={e => setPayDescription(e.target.value)}
                  placeholder={payType === 'kasbon' ? `Contoh: Kasbon pinjaman - ${quickPayEmp.emp.name}` : `Contoh: Pembayaran Gaji & Insentif - ${quickPayEmp.emp.name}`}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              {/* Upload Foto Bukti Transfer */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#25F4EE]" />
                    <span>Upload Foto Bukti Transfer / Struk Kas</span>
                  </span>
                  {payProofImage && (
                    <button
                      type="button"
                      onClick={() => setPayProofImage('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </label>

                {payProofImage ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#0b0c10] p-3 flex items-center gap-3">
                    <img
                      src={payProofImage}
                      alt="Bukti Transfer"
                      className="w-16 h-16 object-cover rounded-xl border border-white/10"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-400">✓ Bukti Foto Terlampir</p>
                      <p className="text-[10px] text-zinc-400">Akan tersimpan ke slip gaji pegawai</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => quickPayFileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-[#25F4EE]/50 bg-[#0b0c10] p-4 rounded-2xl text-center cursor-pointer transition group"
                  >
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[#25F4EE] mx-auto mb-1 transition" />
                    <p className="text-xs font-bold text-zinc-300 group-hover:text-white">
                      Klik untuk upload foto struk / screenshot transfer
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Format PNG, JPG, JPEG (Maks. 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={quickPayFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickPayImageUpload}
                  className="hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickPayEmp(null)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-bold transition cursor-pointer shadow-lg shadow-[#FE2C55]/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{payType === 'kasbon' ? 'Simpan Kasbon' : 'Simpan Pembayaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Bukti Foto Penuh */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-[#161823] rounded-3xl border border-white/20 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#25F4EE]" />
                <span>Foto Bukti Transfer &amp; Struk Pembayaran Gaji</span>
              </h4>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-2xl bg-[#0b0c10] p-2 border border-white/10">
              <img
                src={previewPhotoUrl}
                alt="Foto Bukti"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

