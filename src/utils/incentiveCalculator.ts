import { Employee, SalesRecord } from '../types';
import { formatRupiah } from './formatters';

export interface SingleSaleIncentiveResult {
  totalIncentive: number;
  satuanIncentive: number;
  bundlingIncentive: number;
  satuanPcs: number;
  satuanPkgs: number;
  satuanOmzet: number;
  bundlingPcs: number;
  bundlingPkgs: number;
  bundlingOmzet: number;
  satuanRateUsed: number;
  bundlingRateUsed: number;
  satuanType: string;
  bundlingType: string;
  isTierApplied: boolean;
  desc: string;
}

/**
 * Menghitung insentif Host untuk satu transaksi / sesi live secara presisi
 * Mengikuti konfigurasi pegawai di menu Pendaftaran Pegawai:
 * - Opsi Satuan: menggunakan satuanRate atau config.rate
 * - Opsi Bundling: menggunakan bundlingRate atau config.rate
 * - Opsi Campuran: menghitung porsi Satuan dan Bundling masing-masing
 * - Opsi Tier Rule: bila tercapai, menggunakan tierRateSatuan / tierRateBundling
 */
export function calculateHostIncentiveForSale(
  sale: Partial<SalesRecord>,
  employee: Employee,
  options?: { isTierAchieved?: boolean }
): SingleSaleIncentiveResult {
  const config = employee.incentiveConfigs?.host;
  
  const emptyResult: SingleSaleIncentiveResult = {
    totalIncentive: 0,
    satuanIncentive: 0,
    bundlingIncentive: 0,
    satuanPcs: 0,
    satuanPkgs: 0,
    satuanOmzet: 0,
    bundlingPcs: 0,
    bundlingPkgs: 0,
    bundlingOmzet: 0,
    satuanRateUsed: 0,
    bundlingRateUsed: 0,
    satuanType: 'per_pcs_sold',
    bundlingType: 'per_package_sold',
    isTierApplied: false,
    desc: 'Tanpa insentif host',
  };

  if (!config || config.type === 'none') {
    return emptyResult;
  }

  // Hitung pembagian jika ada lebih dari 1 host bertugas bersamaan
  const hostCount = Math.max(
    1,
    (sale.hostIds && sale.hostIds.length > 0)
      ? sale.hostIds.length
      : (sale.hostNames && sale.hostNames.length > 0 ? sale.hostNames.length : 1)
  );

  const totalPcs = (sale.pcsSold || 0) / hostCount;
  const totalPkgs = (sale.packagesSold || 0) / hostCount;
  const totalOmzet = (sale.omzet || 0) / hostCount;

  const saleFormat = sale.saleFormat || 'satuan';

  let sPcs = 0;
  let sPkgs = 0;
  let sOmzet = 0;
  let bPcs = 0;
  let bPkgs = 0;
  let bOmzet = 0;

  if (saleFormat === 'bundling') {
    bPcs = totalPcs;
    bPkgs = totalPkgs;
    bOmzet = totalOmzet;
  } else if (saleFormat === 'campuran') {
    sPcs = (sale.satuanPcs || 0) / hostCount;
    sPkgs = (sale.satuanPackages || 0) / hostCount;
    sOmzet = (sale.satuanOmzet || 0) / hostCount;
    bPcs = (sale.bundlingPcs || 0) / hostCount;
    bPkgs = (sale.bundlingPackages || 0) / hostCount;
    bOmzet = (sale.bundlingOmzet || 0) / hostCount;
  } else {
    // Default 'satuan'
    sPcs = totalPcs;
    sPkgs = totalPkgs;
    sOmzet = totalOmzet;
  }

  // Evaluasi Tier
  const threshold = config.tierThresholdPackages || 0;
  const isTierAchieved = options?.isTierAchieved ?? (Boolean(config.hasTierRule && threshold > 0 && totalPkgs >= threshold));

  // 1. Tentukan Tarif Satuan
  // Prioritaskan satuanRate bila ada, jika tidak pakai config.rate
  const baseSatuanRate = config.satuanRate !== undefined && config.satuanRate > 0
    ? config.satuanRate
    : (config.rate || 0);
  const tierSatuanRate = config.tierRateSatuan || config.tierRate || baseSatuanRate;
  const effectiveSatuanRate = isTierAchieved ? tierSatuanRate : baseSatuanRate;
  const satuanType = config.satuanIncentiveType || (config.type === 'per_package_sold' ? 'per_package_sold' : 'per_pcs_sold');

  // 2. Tentukan Tarif Bundling
  // Prioritaskan bundlingRate bila ada, jika tidak pakai config.rate
  const baseBundlingRate = config.bundlingRate !== undefined && config.bundlingRate > 0
    ? config.bundlingRate
    : (config.rate || 0);
  const tierBundlingRate = config.tierRateBundling || config.tierRate || baseBundlingRate;
  const effectiveBundlingRate = isTierAchieved ? tierBundlingRate : baseBundlingRate;
  const bundlingType = config.bundlingIncentiveType || (config.type === 'per_pcs_sold' ? 'per_pcs_sold' : 'per_package_sold');

  // 3. Hitung Insentif Satuan
  let satuanIncentive = 0;
  if (sPcs > 0 || sPkgs > 0 || sOmzet > 0) {
    if (satuanType === 'per_pcs_sold') {
      satuanIncentive = Math.round(sPcs * effectiveSatuanRate);
    } else if (satuanType === 'per_package_sold') {
      satuanIncentive = Math.round(sPkgs * effectiveSatuanRate);
    } else if (satuanType === 'percentage') {
      satuanIncentive = Math.round((sOmzet * effectiveSatuanRate) / 100);
    } else {
      satuanIncentive = Math.round(sPcs * effectiveSatuanRate);
    }
  }

  // 4. Hitung Insentif Bundling
  let bundlingIncentive = 0;
  if (bPcs > 0 || bPkgs > 0 || bOmzet > 0) {
    if (bundlingType === 'per_package_sold') {
      bundlingIncentive = Math.round(bPkgs * effectiveBundlingRate);
    } else if (bundlingType === 'per_pcs_sold') {
      bundlingIncentive = Math.round(bPcs * effectiveBundlingRate);
    } else if (bundlingType === 'percentage') {
      bundlingIncentive = Math.round((bOmzet * effectiveBundlingRate) / 100);
    } else {
      bundlingIncentive = Math.round(bPkgs * effectiveBundlingRate);
    }
  }

  const totalIncentive = satuanIncentive + bundlingIncentive;

  // Deskripsi ringkas
  const descs: string[] = [];
  if (satuanIncentive > 0) {
    const unitLabel = satuanType === 'per_pcs_sold' ? 'pcs' : (satuanType === 'per_package_sold' ? 'paket' : '% omzet');
    const qty = satuanType === 'per_pcs_sold' ? sPcs : sPkgs;
    descs.push(`Satuan: ${qty.toFixed(0)} ${unitLabel} @ ${formatRupiah(effectiveSatuanRate)}`);
  }
  if (bundlingIncentive > 0) {
    const unitLabel = bundlingType === 'per_package_sold' ? 'paket' : (bundlingType === 'per_pcs_sold' ? 'pcs' : '% omzet');
    const qty = bundlingType === 'per_package_sold' ? bPkgs : bPcs;
    descs.push(`Bundling: ${qty.toFixed(0)} ${unitLabel} @ ${formatRupiah(effectiveBundlingRate)}`);
  }
  if (isTierAchieved) {
    descs.push('(Target Tier Tercapai)');
  }

  return {
    totalIncentive,
    satuanIncentive,
    bundlingIncentive,
    satuanPcs: sPcs,
    satuanPkgs: sPkgs,
    satuanOmzet: sOmzet,
    bundlingPcs: bPcs,
    bundlingPkgs: bPkgs,
    bundlingOmzet: bOmzet,
    satuanRateUsed: effectiveSatuanRate,
    bundlingRateUsed: effectiveBundlingRate,
    satuanType,
    bundlingType,
    isTierApplied: isTierAchieved,
    desc: descs.join(' • ') || 'Insentif Live Rp 0',
  };
}

/**
 * Menghitung akumulasi insentif Host selama satu periode kerja (misal harian/mingguan/bulanan)
 * dengan memperhitungkan Tier Rule akumulasi paket jika diaktifkan.
 */
export function calculateHostPeriodIncentives(
  sales: SalesRecord[],
  employee: Employee
): {
  totalIncentive: number;
  breakdown: { desc: string; amount: number }[];
  totalSatuanIncentive: number;
  totalBundlingIncentive: number;
  totalPackages: number;
  totalPcs: number;
  isTierAchieved: boolean;
} {
  const config = employee.incentiveConfigs?.host;
  if (!config || config.type === 'none') {
    return {
      totalIncentive: 0,
      breakdown: [],
      totalSatuanIncentive: 0,
      totalBundlingIncentive: 0,
      totalPackages: 0,
      totalPcs: 0,
      isTierAchieved: false,
    };
  }

  // Filter sales di mana pegawai ini bertugas sebagai host
  const mySales = sales.filter(s =>
    s.hostIds?.includes(employee.id) ||
    s.hostNames?.some(hn => hn.toLowerCase().includes(employee.name.toLowerCase()))
  );

  let totalPackages = 0;
  let totalPcs = 0;

  let hostSatuanPcs = 0;
  let hostSatuanPkgs = 0;
  let hostSatuanOmzet = 0;
  let hostBundlingPcs = 0;
  let hostBundlingPkgs = 0;
  let hostBundlingOmzet = 0;

  mySales.forEach(s => {
    const hostCount = Math.max(
      1,
      s.hostIds && s.hostIds.length > 0
        ? s.hostIds.length
        : (s.hostNames && s.hostNames.length > 0 ? s.hostNames.length : 1)
    );

    const pcs = (s.pcsSold || 0) / hostCount;
    const pkgs = (s.packagesSold || 0) / hostCount;
    const omzet = (s.omzet || 0) / hostCount;

    totalPackages += pkgs;
    totalPcs += pcs;

    const fmt = s.saleFormat || 'satuan';
    if (fmt === 'bundling') {
      hostBundlingPcs += pcs;
      hostBundlingPkgs += pkgs;
      hostBundlingOmzet += omzet;
    } else if (fmt === 'campuran') {
      hostSatuanPcs += (s.satuanPcs || 0) / hostCount;
      hostSatuanPkgs += (s.satuanPackages || 0) / hostCount;
      hostSatuanOmzet += (s.satuanOmzet || 0) / hostCount;
      hostBundlingPcs += (s.bundlingPcs || 0) / hostCount;
      hostBundlingPkgs += (s.bundlingPackages || 0) / hostCount;
      hostBundlingOmzet += (s.bundlingOmzet || 0) / hostCount;
    } else {
      // Satuan
      hostSatuanPcs += pcs;
      hostSatuanPkgs += pkgs;
      hostSatuanOmzet += omzet;
    }
  });

  const threshold = config.tierThresholdPackages || 0;
  const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && totalPackages >= threshold);
  const tierMode = config.tierCalculationMode || 'excess_only';

  const breakdown: { desc: string; amount: number }[] = [];

  // 1. Hitung Insentif Satuan
  const satuanRate = config.satuanRate !== undefined && config.satuanRate > 0
    ? config.satuanRate
    : (config.rate || 0);
  const satuanTierRate = config.tierRateSatuan || config.tierRate || satuanRate;
  const satuanType = config.satuanIncentiveType || (config.type === 'per_package_sold' ? 'per_package_sold' : 'per_pcs_sold');

  let satuanAmount = 0;

  if (hostSatuanPcs > 0 || hostSatuanPkgs > 0 || hostSatuanOmzet > 0) {
    if (satuanType === 'per_pcs_sold') {
      if (isTierAchieved && tierMode === 'excess_only') {
        const excessRatio = totalPackages > 0 ? Math.max(0, totalPackages - threshold) / totalPackages : 0;
        const excessPcs = Math.round(hostSatuanPcs * excessRatio);
        const basePcs = Math.max(0, hostSatuanPcs - excessPcs);
        satuanAmount = Math.round((basePcs * satuanRate) + (excessPcs * satuanTierRate));
        breakdown.push({
          desc: `🏷️ Penjualan Satuan (${basePcs} pcs x ${formatRupiah(satuanRate)} + ${excessPcs} pcs tier x ${formatRupiah(satuanTierRate)})`,
          amount: satuanAmount,
        });
      } else if (isTierAchieved && tierMode === 'all_units') {
        satuanAmount = Math.round(hostSatuanPcs * satuanTierRate);
        breakdown.push({
          desc: `✨ Penjualan Satuan Target Tier (≥ ${threshold} paket): ${Math.round(hostSatuanPcs)} pcs x ${formatRupiah(satuanTierRate)}`,
          amount: satuanAmount,
        });
      } else {
        satuanAmount = Math.round(hostSatuanPcs * satuanRate);
        breakdown.push({
          desc: `🏷️ Penjualan Satuan Live: ${Math.round(hostSatuanPcs)} pcs x ${formatRupiah(satuanRate)}`,
          amount: satuanAmount,
        });
      }
    } else if (satuanType === 'per_package_sold') {
      if (isTierAchieved && tierMode === 'excess_only') {
        const excessRatio = totalPackages > 0 ? Math.max(0, totalPackages - threshold) / totalPackages : 0;
        const excessPkgs = Math.round(hostSatuanPkgs * excessRatio);
        const basePkgs = Math.max(0, hostSatuanPkgs - excessPkgs);
        satuanAmount = Math.round((basePkgs * satuanRate) + (excessPkgs * satuanTierRate));
        breakdown.push({
          desc: `🏷️ Penjualan Satuan (${basePkgs} paket x ${formatRupiah(satuanRate)} + ${excessPkgs} paket tier x ${formatRupiah(satuanTierRate)})`,
          amount: satuanAmount,
        });
      } else if (isTierAchieved && tierMode === 'all_units') {
        satuanAmount = Math.round(hostSatuanPkgs * satuanTierRate);
        breakdown.push({
          desc: `✨ Penjualan Satuan Target Tier (≥ ${threshold} paket): ${Math.round(hostSatuanPkgs)} paket x ${formatRupiah(satuanTierRate)}`,
          amount: satuanAmount,
        });
      } else {
        satuanAmount = Math.round(hostSatuanPkgs * satuanRate);
        breakdown.push({
          desc: `🏷️ Penjualan Satuan Live: ${Math.round(hostSatuanPkgs)} paket x ${formatRupiah(satuanRate)}`,
          amount: satuanAmount,
        });
      }
    } else if (satuanType === 'percentage') {
      satuanAmount = Math.round((hostSatuanOmzet * satuanRate) / 100);
      breakdown.push({
        desc: `🏷️ Penjualan Satuan (${satuanRate}% dari omzet ${formatRupiah(hostSatuanOmzet)})`,
        amount: satuanAmount,
      });
    }
  }

  // 2. Hitung Insentif Bundling
  const bundlingRate = config.bundlingRate !== undefined && config.bundlingRate > 0
    ? config.bundlingRate
    : (config.rate || 0);
  const bundlingTierRate = config.tierRateBundling || config.tierRate || bundlingRate;
  const bundlingType = config.bundlingIncentiveType || (config.type === 'per_pcs_sold' ? 'per_pcs_sold' : 'per_package_sold');

  let bundlingAmount = 0;

  if (hostBundlingPcs > 0 || hostBundlingPkgs > 0 || hostBundlingOmzet > 0) {
    if (bundlingType === 'per_package_sold') {
      if (isTierAchieved && tierMode === 'excess_only') {
        const excessRatio = totalPackages > 0 ? Math.max(0, totalPackages - threshold) / totalPackages : 0;
        const excessPkgs = Math.round(hostBundlingPkgs * excessRatio);
        const basePkgs = Math.max(0, hostBundlingPkgs - excessPkgs);
        bundlingAmount = Math.round((basePkgs * bundlingRate) + (excessPkgs * bundlingTierRate));
        breakdown.push({
          desc: `📦 Penjualan Bundling (${basePkgs} paket x ${formatRupiah(bundlingRate)} + ${excessPkgs} paket tier x ${formatRupiah(bundlingTierRate)})`,
          amount: bundlingAmount,
        });
      } else if (isTierAchieved && tierMode === 'all_units') {
        bundlingAmount = Math.round(hostBundlingPkgs * bundlingTierRate);
        breakdown.push({
          desc: `✨ Penjualan Bundling Target Tier (≥ ${threshold} paket): ${Math.round(hostBundlingPkgs)} paket x ${formatRupiah(bundlingTierRate)}`,
          amount: bundlingAmount,
        });
      } else {
        bundlingAmount = Math.round(hostBundlingPkgs * bundlingRate);
        breakdown.push({
          desc: `📦 Penjualan Bundling Live: ${Math.round(hostBundlingPkgs)} paket x ${formatRupiah(bundlingRate)}`,
          amount: bundlingAmount,
        });
      }
    } else if (bundlingType === 'per_pcs_sold') {
      if (isTierAchieved && tierMode === 'excess_only') {
        const excessRatio = totalPackages > 0 ? Math.max(0, totalPackages - threshold) / totalPackages : 0;
        const excessPcs = Math.round(hostBundlingPcs * excessRatio);
        const basePcs = Math.max(0, hostBundlingPcs - excessPcs);
        bundlingAmount = Math.round((basePcs * bundlingRate) + (excessPcs * bundlingTierRate));
        breakdown.push({
          desc: `📦 Penjualan Bundling (${basePcs} pcs x ${formatRupiah(bundlingRate)} + ${excessPcs} pcs tier x ${formatRupiah(bundlingTierRate)})`,
          amount: bundlingAmount,
        });
      } else if (isTierAchieved && tierMode === 'all_units') {
        bundlingAmount = Math.round(hostBundlingPcs * bundlingTierRate);
        breakdown.push({
          desc: `✨ Penjualan Bundling Target Tier (≥ ${threshold} paket): ${Math.round(hostBundlingPcs)} pcs x ${formatRupiah(bundlingTierRate)}`,
          amount: bundlingAmount,
        });
      } else {
        bundlingAmount = Math.round(hostBundlingPcs * bundlingRate);
        breakdown.push({
          desc: `📦 Penjualan Bundling Live: ${Math.round(hostBundlingPcs)} pcs x ${formatRupiah(bundlingRate)}`,
          amount: bundlingAmount,
        });
      }
    } else if (bundlingType === 'percentage') {
      bundlingAmount = Math.round((hostBundlingOmzet * bundlingRate) / 100);
      breakdown.push({
        desc: `📦 Penjualan Bundling (${bundlingRate}% dari omzet ${formatRupiah(hostBundlingOmzet)})`,
        amount: bundlingAmount,
      });
    }
  }

  // Jika tidak ada penjualan sama sekali atau jenis fixed amount
  if (config.type === 'fixed_amount') {
    const fixedAmt = config.rate || 0;
    return {
      totalIncentive: fixedAmt,
      breakdown: [{ desc: `Nominal Flat Insentif Host`, amount: fixedAmt }],
      totalSatuanIncentive: 0,
      totalBundlingIncentive: 0,
      totalPackages,
      totalPcs,
      isTierAchieved,
    };
  }

  const totalIncentive = satuanAmount + bundlingAmount;

  return {
    totalIncentive,
    breakdown,
    totalSatuanIncentive: satuanAmount,
    totalBundlingIncentive: bundlingAmount,
    totalPackages,
    totalPcs,
    isTierAchieved,
  };
}
