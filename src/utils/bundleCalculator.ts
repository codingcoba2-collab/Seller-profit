// Comprehensive accounting calculator for bundling prices and minimum sales packages
// Includes: HPP, Marketplace Admin, Service Fees, Packing, Return Reserve, Ads, Coins,
// AND Host & Admin salaries + incentives, supporting both Nominal and Percentage profit targets.

export interface BundleCalcParams {
  // Profit Target
  targetProfitType?: 'nominal' | 'percentage';
  targetProfit: number;                 // Target laba bersih nominal harian (e.g. 1.000.000)
  targetProfitPercent?: number;         // Target laba persentase dari omzet (e.g. 25%)

  // Marketing & Fixed Costs
  adsCost: number;                      // Biaya iklan harian (e.g. 60.000)
  coinCost: number;                     // Biaya koin / voucher diskon harian (e.g. 30.000)
  operationalCost?: number;             // Biaya operasional tetap toko lainnya (default: 0)

  // Host & Admin Live Streaming Salary & Incentive
  hostSalary?: number;                  // Gaji pokok / flat shift host harian (e.g. 100.000)
  hostIncentivePerPackage?: number;     // Insentif host per paket terjual (e.g. 2.000)
  hostIncentivePerPcs?: number;         // Insentif host per pcs terjual (e.g. 0)
  adminSalary?: number;                 // Gaji pokok / flat shift admin harian (e.g. 80.000)
  adminIncentivePerPackage?: number;    // Insentif admin per paket terjual (e.g. 1.000)

  // Product & Variable Costs
  pcsPerPackage: number;                // Jumlah pcs dalam 1 paket bundling (input bebas: 1, 2, 3, 5, 10, dll)
  hppPerPcs: number;                    // Modal HPP per pcs (e.g. 20.000)
  packingCost: number;                  // Biaya packing per paket (e.g. 1.500)
  adminPercentage: number;              // Admin promo marketplace % (e.g. 8.5)
  serviceFeePerOrder: number;           // Biaya layanan per pesanan (e.g. 1.250)
  returnPercentage: number;             // Estimasi cadangan retur % (e.g. 3.0)

  // Calculation inputs
  bundlePrice?: number;                 // Harga jual bundling (jika menghitung jumlah paket)
  targetPackages?: number;              // Target paket terjual (jika menghitung rekomendasi harga jual)
}

export interface BundleCalcResult {
  targetProfitType: 'nominal' | 'percentage';
  targetProfit: number;
  targetProfitPercent: number;

  adsCost: number;
  coinCost: number;
  operationalCost: number;
  hostSalary: number;
  adminSalary: number;
  totalFixedOverhead: number;           // Iklan + Koin + Ops + Gaji Pokok Host + Gaji Pokok Admin

  pcsPerPackage: number;
  hppPerPcs: number;
  totalHppPerPackage: number;
  packingCost: number;
  adminPercentage: number;
  serviceFeePerOrder: number;
  returnPercentage: number;

  hostIncentivePerPackage: number;
  adminIncentivePerPackage: number;
  totalIncentivePerPackage: number;     // Host incentive + Admin incentive per package
  totalVariableCostPerPackage: number;  // HPP + Packing + Service Fee + Total Incentive

  bundlePrice: number;
  adminFeePerPackage: number;
  returnReservePerPackage: number;
  netMarginPerPackage: number;          // Margin bersih riil per 1 paket
  marginPercentage: number;             // Margin bersih / Harga Jual (%)

  minimumPackagesNeeded: number;        // Min paket untuk mencapai target laba
  totalPcsNeeded: number;               // Min paket * pcsPerPackage
  bepPackagesNeeded: number;            // Min paket untuk impas (menutup seluruh beban operasional tetap)
  totalOmzetKotor: number;              // minimumPackagesNeeded * bundlePrice

  isPossible: boolean;                  // false jika margin <= 0 atau margin % < target profit %
  impossibleReason?: string;

  financialsAtTarget: {
    grossOmzet: number;
    totalHpp: number;
    totalAdminFee: number;
    totalServiceFee: number;
    totalPackingCost: number;
    totalReturnReserve: number;
    totalHostSalary: number;
    totalHostIncentive: number;
    totalAdminSalary: number;
    totalAdminIncentive: number;
    totalLaborCost: number;
    totalAds: number;
    totalCoins: number;
    totalOperational: number;
    netProfit: number;
    profitPercentage: number;
    achievedTargetProfit: boolean;
  };
}

export interface BundleScenario {
  id: string;
  name: string;
  badge: string;
  pcsPerPackage: number;
  recommendedPrice: number;
  marginPerPackage: number;
  marginPercentage: number;
  minPackagesNeeded: number;
  totalPcsNeeded: number;
  bepPackagesNeeded: number;
  totalOmzetKotor: number;
  summary: string;
  tagColor: string;
}

/**
 * Calculate bundle performance given a specified bundle sale price
 */
export function calculateBundleGivenPrice(params: BundleCalcParams): BundleCalcResult {
  const targetProfitType = params.targetProfitType || 'nominal';
  const targetProfitNominal = Math.max(0, params.targetProfit || 0);
  const targetProfitPercent = Math.max(0, params.targetProfitPercent || 0);

  const adsCost = Math.max(0, params.adsCost || 0);
  const coinCost = Math.max(0, params.coinCost || 0);
  const operationalCost = Math.max(0, params.operationalCost || 0);
  const hostSalary = Math.max(0, params.hostSalary || 0);
  const adminSalary = Math.max(0, params.adminSalary || 0);

  // Total daily fixed overhead (excluding target profit)
  const totalFixedOverhead = adsCost + coinCost + operationalCost + hostSalary + adminSalary;

  const pcs = Math.max(1, params.pcsPerPackage || 1);
  const hppPerPcs = Math.max(0, params.hppPerPcs || 0);
  const totalHppPerPackage = pcs * hppPerPcs;
  const packingCost = Math.max(0, params.packingCost ?? 1500);
  const adminPct = Math.max(0, params.adminPercentage ?? 8.5);
  const serviceFee = Math.max(0, params.serviceFeePerOrder ?? 1250);
  const returnPct = Math.max(0, params.returnPercentage ?? 3.0);

  const hostIncentivePkg = Math.max(0, params.hostIncentivePerPackage || 0) + (pcs * Math.max(0, params.hostIncentivePerPcs || 0));
  const adminIncentivePkg = Math.max(0, params.adminIncentivePerPackage || 0);
  const totalIncentivePerPackage = hostIncentivePkg + adminIncentivePkg;

  // Direct cash variable cost per package
  const totalVariableCostPerPackage = totalHppPerPackage + packingCost + serviceFee + totalIncentivePerPackage;

  const bundlePrice = Math.max(1000, params.bundlePrice || (totalHppPerPackage * 1.6 + 15000));

  const adminFeePerPackage = Math.round((adminPct / 100) * bundlePrice);
  const returnReservePerPackage = Math.round((returnPct / 100) * bundlePrice);

  // Standard net margin per package before fixed overhead
  const netMarginPerPackage = bundlePrice - adminFeePerPackage - returnReservePerPackage - totalVariableCostPerPackage;
  const marginPercentage = bundlePrice > 0 ? (netMarginPerPackage / bundlePrice) * 100 : 0;

  let minimumPackagesNeeded = 0;
  let bepPackagesNeeded = 0;
  let isPossible = true;
  let impossibleReason: string | undefined;

  // BEP packages needed (to break even on fixed overhead alone)
  if (netMarginPerPackage > 0 && totalFixedOverhead > 0) {
    bepPackagesNeeded = Math.ceil(totalFixedOverhead / netMarginPerPackage);
  } else if (netMarginPerPackage <= 0) {
    bepPackagesNeeded = 999999;
    isPossible = false;
    impossibleReason = 'Harga jual bundling terlalu rendah (margin bersih per paket negatif/minus).';
  }

  // Calculate target packages needed
  if (targetProfitType === 'nominal') {
    const totalFixedBurdenWithProfit = totalFixedOverhead + targetProfitNominal;
    if (netMarginPerPackage > 0) {
      minimumPackagesNeeded = Math.ceil(totalFixedBurdenWithProfit / netMarginPerPackage);
    } else {
      minimumPackagesNeeded = 999999;
    }
  } else {
    // Percentage profit target: Profit = targetProfitPercent% * (Packages * Price)
    // N * [ Price * (1 - admin% - return% - profit%) - VariableCost ] = TotalFixedOverhead
    const retentionFactor = 1 - (adminPct + returnPct + targetProfitPercent) / 100;
    const effectiveMargin = bundlePrice * retentionFactor - totalVariableCostPerPackage;

    if (effectiveMargin > 0) {
      minimumPackagesNeeded = Math.ceil(totalFixedOverhead / effectiveMargin);
    } else {
      minimumPackagesNeeded = 999999;
      isPossible = false;
      impossibleReason = `Dengan harga ${bundlePrice.toLocaleString('id-ID')}, margin setelah potongan dan target laba ${targetProfitPercent}% tidak mencukupi untuk menutup biaya operasional. Naikkan harga bundling.`;
    }
  }

  const totalPcsNeeded = minimumPackagesNeeded * pcs;
  const totalOmzetKotor = minimumPackagesNeeded * bundlePrice;

  // Ledger breakdown
  const grossOmzet = totalOmzetKotor;
  const totalHpp = minimumPackagesNeeded * totalHppPerPackage;
  const totalAdminFee = minimumPackagesNeeded * adminFeePerPackage;
  const totalServiceFee = minimumPackagesNeeded * serviceFee;
  const totalPackingCost = minimumPackagesNeeded * packingCost;
  const totalReturnReserve = minimumPackagesNeeded * returnReservePerPackage;
  const totalHostSalary = hostSalary;
  const totalHostIncentive = minimumPackagesNeeded * hostIncentivePkg;
  const totalAdminSalary = adminSalary;
  const totalAdminIncentive = minimumPackagesNeeded * adminIncentivePkg;
  const totalLaborCost = totalHostSalary + totalHostIncentive + totalAdminSalary + totalAdminIncentive;

  const netProfit = grossOmzet 
    - totalHpp 
    - totalAdminFee 
    - totalServiceFee 
    - totalPackingCost 
    - totalReturnReserve 
    - totalLaborCost 
    - adsCost 
    - coinCost 
    - operationalCost;

  const actualProfitPercentage = grossOmzet > 0 ? (netProfit / grossOmzet) * 100 : 0;
  const achievedTargetProfit = targetProfitType === 'nominal' 
    ? netProfit >= targetProfitNominal - 100 
    : actualProfitPercentage >= targetProfitPercent - 0.5;

  return {
    targetProfitType,
    targetProfit: targetProfitNominal,
    targetProfitPercent,
    adsCost,
    coinCost,
    operationalCost,
    hostSalary,
    adminSalary,
    totalFixedOverhead,
    pcsPerPackage: pcs,
    hppPerPcs,
    totalHppPerPackage,
    packingCost,
    adminPercentage: adminPct,
    serviceFeePerOrder: serviceFee,
    returnPercentage: returnPct,
    hostIncentivePerPackage: hostIncentivePkg,
    adminIncentivePerPackage: adminIncentivePkg,
    totalIncentivePerPackage,
    totalVariableCostPerPackage,
    bundlePrice,
    adminFeePerPackage,
    returnReservePerPackage,
    netMarginPerPackage: Math.round(netMarginPerPackage),
    marginPercentage: Number(marginPercentage.toFixed(1)),
    minimumPackagesNeeded,
    totalPcsNeeded,
    bepPackagesNeeded,
    totalOmzetKotor,
    isPossible,
    impossibleReason,
    financialsAtTarget: {
      grossOmzet,
      totalHpp,
      totalAdminFee,
      totalServiceFee,
      totalPackingCost,
      totalReturnReserve,
      totalHostSalary,
      totalHostIncentive,
      totalAdminSalary,
      totalAdminIncentive,
      totalLaborCost,
      totalAds: adsCost,
      totalCoins: coinCost,
      totalOperational: operationalCost,
      netProfit: Math.round(netProfit),
      profitPercentage: Number(actualProfitPercentage.toFixed(1)),
      achievedTargetProfit,
    },
  };
}

/**
 * Calculate required bundle price given a target number of packages
 */
export function calculateRequiredPriceGivenPackages(params: BundleCalcParams): BundleCalcResult {
  const targetProfitType = params.targetProfitType || 'nominal';
  const targetProfitNominal = Math.max(0, params.targetProfit || 0);
  const targetProfitPercent = Math.max(0, params.targetProfitPercent || 0);

  const adsCost = Math.max(0, params.adsCost || 0);
  const coinCost = Math.max(0, params.coinCost || 0);
  const operationalCost = Math.max(0, params.operationalCost || 0);
  const hostSalary = Math.max(0, params.hostSalary || 0);
  const adminSalary = Math.max(0, params.adminSalary || 0);

  const totalFixedOverhead = adsCost + coinCost + operationalCost + hostSalary + adminSalary;

  const pcs = Math.max(1, params.pcsPerPackage || 1);
  const hppPerPcs = Math.max(0, params.hppPerPcs || 0);
  const totalHppPerPackage = pcs * hppPerPcs;
  const packingCost = Math.max(0, params.packingCost ?? 1500);
  const adminPct = Math.max(0, params.adminPercentage ?? 8.5);
  const serviceFee = Math.max(0, params.serviceFeePerOrder ?? 1250);
  const returnPct = Math.max(0, params.returnPercentage ?? 3.0);

  const hostIncentivePkg = Math.max(0, params.hostIncentivePerPackage || 0) + (pcs * Math.max(0, params.hostIncentivePerPcs || 0));
  const adminIncentivePkg = Math.max(0, params.adminIncentivePerPackage || 0);
  const totalIncentivePerPackage = hostIncentivePkg + adminIncentivePkg;
  const directVariableCost = totalHppPerPackage + packingCost + serviceFee + totalIncentivePerPackage;

  const targetPackages = Math.max(1, params.targetPackages || 30);

  let calculatedPrice = 0;

  if (targetProfitType === 'nominal') {
    const totalFixedBurden = totalFixedOverhead + targetProfitNominal;
    const requiredMarginPerPackage = totalFixedBurden / targetPackages;
    const retentionFactor = 1 - (adminPct + returnPct) / 100;
    const rawPrice = (requiredMarginPerPackage + directVariableCost) / retentionFactor;
    calculatedPrice = Math.ceil(rawPrice / 1000) * 1000;
  } else {
    // P * (1 - admin% - return% - profit%) = DirectCost + TotalFixedOverhead / N
    const retentionFactor = 1 - (adminPct + returnPct + targetProfitPercent) / 100;
    if (retentionFactor > 0) {
      const rawPrice = (directVariableCost + totalFixedOverhead / targetPackages) / retentionFactor;
      calculatedPrice = Math.ceil(rawPrice / 1000) * 1000;
    } else {
      calculatedPrice = Math.ceil((directVariableCost * 2) / 1000) * 1000;
    }
  }

  return calculateBundleGivenPrice({
    ...params,
    bundlePrice: Math.max(1000, calculatedPrice),
  });
}

/**
 * Generate standard 4-tier bundling strategy scenarios (Satuan 1 pcs, Bundling 2 pcs, Bundling 3 pcs, Bundling 5 pcs)
 */
export function generateStandardScenarios(
  baseParams: Omit<BundleCalcParams, 'pcsPerPackage' | 'bundlePrice' | 'targetPackages'>,
  customHpp?: number
): BundleScenario[] {
  const hpp = customHpp ?? baseParams.hppPerPcs ?? 20000;

  const price1Pcs = Math.round((hpp * 1.8 + 10000) / 1000) * 1000;
  const price2Pcs = Math.round(((hpp * 2) * 1.55 + 12000) / 1000) * 1000;
  const price3Pcs = Math.round(((hpp * 3) * 1.5 + 15000) / 1000) * 1000;
  const price5Pcs = Math.round(((hpp * 5) * 1.45 + 18000) / 1000) * 1000;

  const tiers = [
    {
      id: 'tier-1',
      name: 'Satuan (Single 1 Pcs)',
      badge: 'Penjualan Satuan',
      pcs: 1,
      price: price1Pcs,
      summary: 'Cocok untuk pembeli baru (entry level) atau tester toko.',
      tagColor: 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10',
    },
    {
      id: 'tier-2',
      name: 'Bundling Hemat (Isi 2 Pcs)',
      badge: 'Paling Populer',
      pcs: 2,
      price: price2Pcs,
      summary: 'Format paling seimbang saat live streaming, hemat ongkir & packing.',
      tagColor: 'text-[#25F4EE] border-[#25F4EE]/30 bg-[#25F4EE]/10',
    },
    {
      id: 'tier-3',
      name: 'Bundling Best Seller (Isi 3 Pcs)',
      badge: 'Rekomendasi Profit',
      pcs: 3,
      price: price3Pcs,
      summary: 'Margin profit tinggi, kuota paket harian yang harus dipacking lebih sedikit.',
      tagColor: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    },
    {
      id: 'tier-4',
      name: 'Bundling Jumbo (Isi 5 Pcs)',
      badge: 'Cepat Habiskan Stok',
      pcs: 5,
      price: price5Pcs,
      summary: 'Sangat efektif menghabiskan sisa ball persediaan dan cuci gudang.',
      tagColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    },
  ];

  return tiers.map(t => {
    const res = calculateBundleGivenPrice({
      ...baseParams,
      pcsPerPackage: t.pcs,
      hppPerPcs: hpp,
      bundlePrice: t.price,
    });

    return {
      id: t.id,
      name: t.name,
      badge: t.badge,
      pcsPerPackage: t.pcs,
      recommendedPrice: res.bundlePrice,
      marginPerPackage: res.netMarginPerPackage,
      marginPercentage: res.marginPercentage,
      minPackagesNeeded: res.minimumPackagesNeeded,
      totalPcsNeeded: res.totalPcsNeeded,
      bepPackagesNeeded: res.bepPackagesNeeded,
      totalOmzetKotor: res.totalOmzetKotor,
      summary: t.summary,
      tagColor: t.tagColor,
    };
  });
}
