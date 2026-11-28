import {
  AttendanceRecord,
  CashflowRecord,
  CurrentUser,
  Employee,
  SalesRecord,
  SteamSortirRecord,
  UserRole,
} from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah } from './formatters';
import { calculateHostPeriodIncentives } from './incentiveCalculator';

export interface EmployeeSalaryBreakdownItem {
  role: UserRole | 'multi_role' | 'monthly_bonus';
  desc: string;
  amount: number;
}

export interface EmployeeSalarySummary {
  employee: Employee;
  totalBaseSalary: number;
  totalHours: number;
  totalDays: number;
  totalIncentive: number;
  totalGrandSalary: number;
  attendanceCount: number;
  attendanceRecords: AttendanceRecord[];
  incentiveBreakdowns: EmployeeSalaryBreakdownItem[];
  totalPaid: number;
  totalGajiPaid: number;
  totalKasbon: number;
  hasKasbon: boolean;
  remainingUnpaid: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'kasbon_exceeded';
  payments: CashflowRecord[];
}

export function resolveCurrentEmployeeProfile(currentUser: CurrentUser): Employee {
  const empList = StorageService.getEmployees(currentUser.storeId);
  const found = empList.find(
    (e) =>
      e.id === currentUser.id ||
      e.username.toLowerCase() === currentUser.username.toLowerCase() ||
      e.name.toLowerCase() === currentUser.name.toLowerCase()
  );
  if (found) return found;
  if (currentUser.employeeProfile) return currentUser.employeeProfile;
  return {
    id: currentUser.id,
    storeId: currentUser.storeId,
    name: currentUser.name,
    username: currentUser.username,
    roles: currentUser.roles || ['host'],
    salaryType: 'hourly',
    salaryRate: 0,
    incentiveConfigs: {},
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export function calculateSingleEmployeeSalary(
  storeId: string,
  emp: Employee,
  allAttendance: AttendanceRecord[],
  allSales: SalesRecord[],
  steamSortirLogs: SteamSortirRecord[],
  filterByPeriod: (dateStr: string) => boolean
): EmployeeSalarySummary {
  const empAttendance = allAttendance.filter(
    (a) =>
      (a.employeeId === emp.id || a.employeeName?.toLowerCase() === emp.name.toLowerCase()) &&
      filterByPeriod(a.date)
  );

  let totalBaseSalary = 0;
  let totalHours = 0;
  let totalDays = 0;

  empAttendance.forEach((att) => {
    if (att.salaryType === 'hourly') {
      const hrs = att.hoursWorked || 0;
      totalHours += hrs;
      totalBaseSalary += hrs * (emp.salaryRate || 0);
    } else {
      totalDays += 1;
      totalBaseSalary += emp.salaryRate || 0;
    }
  });

  let totalIncentive = 0;
  const incentiveBreakdowns: EmployeeSalaryBreakdownItem[] = [];

  const filteredSales = allSales.filter((s) => filterByPeriod(s.date));
  const totalStoreOmzet = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
  const totalStorePackages = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
  const totalStorePcs = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);

  let empTotalPackages = 0;
  let empTotalPcs = 0;

  emp.roles.forEach((role) => {
    const config = emp.incentiveConfigs?.[role];
    if (!config || config.type === 'none') return;

    if (role === 'host') {
      const hostResult = calculateHostPeriodIncentives(filteredSales, emp);
      empTotalPackages += hostResult.totalPackages;
      empTotalPcs += hostResult.totalPcs;
      totalIncentive += hostResult.totalIncentive;
      hostResult.breakdown.forEach((b) => {
        incentiveBreakdowns.push({
          role: 'host',
          desc: b.desc,
          amount: b.amount,
        });
      });
    } else if (role === 'admin_toko') {
      const adminSales = filteredSales.filter(
        (s) =>
          s.adminIds?.includes(emp.id) ||
          s.adminId === emp.id ||
          s.adminNames?.some((an) => an.toLowerCase().includes(emp.name.toLowerCase())) ||
          (s.adminName && s.adminName.toLowerCase().includes(emp.name.toLowerCase()))
      );

      const adminPkgs = adminSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
      const adminPcs = adminSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
      empTotalPackages += adminPkgs;
      empTotalPcs += adminPcs;

      const threshold = config.tierThresholdPackages || 0;
      const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && adminPkgs >= threshold);
      const tierMode = config.tierCalculationMode || 'excess_only';
      const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : config.rate || 0;

      if (config.type === 'per_package_sold') {
        let amount = 0;
        let desc = '';
        if (isTierAchieved && tierMode === 'excess_only') {
          const basePkgs = Math.min(adminPkgs, threshold);
          const excessPkgs = Math.max(0, adminPkgs - threshold);
          amount = basePkgs * (config.rate || 0) + excessPkgs * (config.tierRate || 0);
          desc = `Tier Progresif (Target ${threshold} paket): ${basePkgs} paket dasar x ${formatRupiah(config.rate)} + ${excessPkgs} paket selisih x ${formatRupiah(config.tierRate)}`;
        } else if (isTierAchieved && tierMode === 'all_units') {
          amount = adminPkgs * effectiveRate;
          desc = `Target Tier Tercapai (≥ ${threshold} paket): ${adminPkgs} paket x ${formatRupiah(effectiveRate)}`;
        } else {
          amount = adminPkgs * (config.rate || 0);
          desc = `${adminPkgs} paket dicatat x ${formatRupiah(config.rate)}`;
        }
        totalIncentive += amount;
        incentiveBreakdowns.push({ role: 'admin_toko', desc, amount });
      } else if (config.type === 'per_pcs_sold') {
        let amount = 0;
        let desc = '';
        if (isTierAchieved && tierMode === 'excess_only') {
          const excessRatio = adminPkgs > 0 ? Math.max(0, adminPkgs - threshold) / adminPkgs : 0;
          const excessPcs = Math.round(adminPcs * excessRatio);
          const basePcs = Math.max(0, adminPcs - excessPcs);
          amount = basePcs * (config.rate || 0) + excessPcs * (config.tierRate || 0);
          desc = `Tier Progresif (Target ${threshold} paket): ${basePcs} pcs dasar x ${formatRupiah(config.rate)} + ${excessPcs} pcs selisih x ${formatRupiah(config.tierRate)}`;
        } else if (isTierAchieved && tierMode === 'all_units') {
          amount = adminPcs * effectiveRate;
          desc = `Target Tier Tercapai (≥ ${threshold} paket): ${adminPcs} pcs x ${formatRupiah(effectiveRate)}`;
        } else {
          amount = adminPcs * (config.rate || 0);
          desc = `${adminPcs} pcs dicatat x ${formatRupiah(config.rate)}`;
        }
        totalIncentive += amount;
        incentiveBreakdowns.push({ role: 'admin_toko', desc, amount });
      } else if (config.type === 'fixed_amount') {
        const amount = effectiveRate;
        totalIncentive += amount;
        incentiveBreakdowns.push({
          role: 'admin_toko',
          desc: isTierAchieved
            ? `Target Tier Tercapai: Insentif Admin Flat ${formatRupiah(effectiveRate)}`
            : 'Insentif Tetap Admin Toko',
          amount,
        });
      }
    } else if (role === 'sortir' || role === 'steam') {
      const workerLogs = steamSortirLogs.filter((log) => {
        const isMatchRole = log.processType === role || log.processType === 'sortir_dan_steam';
        const isMatchEmp =
          log.employeeIds?.includes(emp.id) ||
          log.employeeNames?.some((en) => en.toLowerCase().includes(emp.name.toLowerCase()));
        return isMatchRole && isMatchEmp && filterByPeriod(log.date);
      });

      const totalPcsWorked = workerLogs.reduce((acc, l) => {
        const pcsLayak =
          l.pcsLayakJual !== undefined
            ? l.pcsLayakJual
            : Math.max(0, (l.pcsTotal || 0) - (l.pcsReject || 0));
        return acc + pcsLayak;
      }, 0);

      if (config.type === 'per_ball_pcs') {
        const amount = totalPcsWorked * (config.rate || 0);
        totalIncentive += amount;
        incentiveBreakdowns.push({
          role,
          desc: `${totalPcsWorked} pcs layak jual (${role}) x ${formatRupiah(config.rate)}`,
          amount,
        });
      }
    }
  });

  // Bonus Rangkap Role
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
          desc: `${bonusLabel} (Target ≥ ${rule.thresholdPackages} paket)`,
          amount: bonusAmount,
        });
      }
    }
  }

  // Bonus Bulanan Target Omzet Toko
  if (emp.monthlyOmzetBonusRule?.active) {
    const omzetRule = emp.monthlyOmzetBonusRule;
    if (totalStoreOmzet >= (omzetRule.targetOmzet || 0)) {
      let omzetBonusAmount = 0;
      let bonusDescText = '';
      if (omzetRule.bonusType === 'percentage') {
        omzetBonusAmount = Math.round(((omzetRule.bonusValue || 0) / 100) * totalStoreOmzet);
        bonusDescText = `Bonus Capai Target Omzet Toko (${omzetRule.bonusValue}% dari Omzet ${formatRupiah(totalStoreOmzet)})`;
      } else if (omzetRule.bonusType === 'percentage_laba_bersih') {
        const payrollSummary = StorageService.calculateStorePayroll(storeId, filterByPeriod);
        const employeePayroll = payrollSummary.employeeSalaries.find((e) => e.employee.id === emp.id);
        omzetBonusAmount = employeePayroll?.monthlyOmzetBonus || 0;
        bonusDescText =
          employeePayroll?.monthlyOmzetBonusDesc ||
          `Bonus Capai Target Omzet Toko (${omzetRule.bonusValue}% dari Laba Bersih)`;
      } else {
        omzetBonusAmount = omzetRule.bonusValue || 0;
        bonusDescText = `Bonus Capai Target Omzet Toko (Flat ${formatRupiah(omzetBonusAmount)})`;
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
  const paymentSummary = StorageService.getEmployeeSalaryPaymentSummary(
    storeId,
    emp.id,
    totalGrandSalary,
    filterByPeriod
  );

  return {
    employee: emp,
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
}
