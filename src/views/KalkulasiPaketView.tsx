import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  calculateBundleGivenPrice, 
  calculateRequiredPriceGivenPackages, 
  generateStandardScenarios,
  BundleScenario,
  BundleCalcResult
} from '../utils/bundleCalculator';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Package, 
  Coins, 
  Megaphone, 
  ArrowLeft, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  Sliders, 
  MessageSquare, 
  Lightbulb, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Target,
  Users,
  Percent,
  DollarSign,
  ArrowRight,
  FileText,
  BookOpen,
  Award,
  AlertCircle,
  MessageCircle,
  Radio,
  Copy,
  Check
} from 'lucide-react';
import { MarqueeText } from '../components/MarqueeText';
import { NeonCorners } from '../components/NeonCorners';

interface KalkulasiPaketViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface AiResponseData {
  analyzedQuery?: string;
  channelType?: string;
  channelLabel?: string;
  focusPackageId?: string;
  directAnswer: string;
  costStructure?: {
    hppPerPcs?: number;
    adsCost?: number;
    coinCost?: number;
    hostSalary?: number;
    adminSalary?: number;
    adminMarketplacePercent?: number;
    serviceFeePerOrder?: number;
    packingCost?: number;
    targetProfitNominal?: number;
    targetProfitDescription?: string;
  };
  extractedParams?: {
    targetProfit?: number;
    targetProfitPercent?: number;
    adsCost?: number;
    coinCost?: number;
    hostSalary?: number;
    adminSalary?: number;
    totalFixedBurden?: number;
    hppPerPcs?: number;
    adminPercentage?: number;
    serviceFeePerOrder?: number;
  };
  scenarios: BundleScenario[];
  formulaExplanation?: {
    step1: string;
    step2: string;
    step3: string;
  };
  strategicAdvice?: string[];
  suggestedFollowUps?: string[];
  closingScript?: string;
}

export const KalkulasiPaketView: React.FC<KalkulasiPaketViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  // Main Mode Toggle: AI vs Interactive Input
  const [mainMode, setMainMode] = useState<'ai' | 'input'>('ai');

  // Sub-tabs for AI Mode: 'input' | 'jawaban' | 'rincian' | 'tips'
  const [aiSubTab, setAiSubTab] = useState<'input' | 'jawaban' | 'rincian' | 'tips'>('input');

  // Sub-tabs for Input Mode: 'form' | 'hasil' | 'rincian'
  const [inputSubTab, setInputSubTab] = useState<'form' | 'hasil' | 'rincian'>('form');

  // Store data & HPP
  const store = useMemo(() => StorageService.getStoreById(currentUser.storeId), [currentUser.storeId]);
  const inventoryBalls = useMemo(() => StorageService.getInventory(currentUser.storeId), [currentUser.storeId]);

  // Average HPP from inventory
  const autoAverageHpp = useMemo(() => {
    if (inventoryBalls.length === 0) return 20000;
    const totalPcs = inventoryBalls.reduce((sum, b) => sum + (b.pcsCount || 0), 0);
    const totalCost = inventoryBalls.reduce((sum, b) => {
      const modal = b.modalPrice || 0;
      const ship = b.shippingCost || 0;
      const steam = b.steamCost || 0;
      const sortir = b.sortirCost || 0;
      return sum + modal + ship + steam + sortir;
    }, 0);
    if (totalPcs <= 0) return 20000;
    return Math.round(totalCost / totalPcs);
  }, [inventoryBalls]);

  // Core Parameters
  // 1. Target Laba
  const [targetProfitType, setTargetProfitType] = useState<'nominal' | 'percentage'>('nominal');
  const [targetProfit, setTargetProfit] = useState<number>(1000000);
  const [targetProfitPercent, setTargetProfitPercent] = useState<number>(20);

  // 2. Marketing & Ads
  const [adsCost, setAdsCost] = useState<number>(60000);
  const [coinCost, setCoinCost] = useState<number>(30000);
  const [operationalCost, setOperationalCost] = useState<number>(0);

  // 3. Host & Admin Salary & Incentive
  const [hostSalary, setHostSalary] = useState<number>(100000);
  const [hostIncentivePerPackage, setHostIncentivePerPackage] = useState<number>(2000);
  const [hostIncentivePerPcs, setHostIncentivePerPcs] = useState<number>(0);
  const [adminSalary, setAdminSalary] = useState<number>(80000);
  const [adminIncentivePerPackage, setAdminIncentivePerPackage] = useState<number>(1000);

  // 4. Product & Costs
  const [pcsPerPackage, setPcsPerPackage] = useState<number>(2); // Input Bebas
  const [customHpp, setCustomHpp] = useState<number>(autoAverageHpp);
  const [packingCost, setPackingCost] = useState<number>(store?.settings?.averagePackingCost || 1500);
  const [adminPercentage, setAdminPercentage] = useState<number>(store?.settings?.adminPromoPercentage || 8.5);
  const [serviceFeePerOrder, setServiceFeePerOrder] = useState<number>(store?.settings?.serviceFeePerOrder || 1250);
  const [returnPercentage, setReturnPercentage] = useState<number>(store?.settings?.estimateReturnPercentage || 3.0);

  // Input Calculation Mode: Price -> Packages OR Packages -> Price
  const [calcDirection, setCalcDirection] = useState<'price_to_packages' | 'packages_to_price'>('price_to_packages');
  const [bundlePriceInput, setBundlePriceInput] = useState<number>(75000);
  const [targetPackagesInput, setTargetPackagesInput] = useState<number>(30);

  // AI Prompt State
  const [selectedChannel, setSelectedChannel] = useState<'auto' | 'dm_sosmed' | 'live_streaming' | 'marketplace_reguler'>('auto');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [aiQuestion, setAiQuestion] = useState<string>(
    'Jika dalam satu hari iklan 60k dan koin 30k berapa harga bundling yang dijual agar keuntungan bisa mencapai 1 jt/hari dan berapa minimum paket terjual?'
  );
  const [activeQuestionQueried, setActiveQuestionQueried] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResponseData | null>(null);

  // Update HPP if inventory changes and user hasn't overridden
  useEffect(() => {
    if (customHpp === 20000 && autoAverageHpp !== 20000) {
      setCustomHpp(autoAverageHpp);
    }
  }, [autoAverageHpp]);

  // Load employee rates automatically from store
  const handleLoadEmployeeDefaults = (notify = true) => {
    const employees = StorageService.getEmployees(currentUser.storeId);
    let foundHost = false;
    let foundAdmin = false;

    for (const emp of employees) {
      if (emp.isActive) {
        if (emp.roles.includes('host') && !foundHost) {
          foundHost = true;
          setHostSalary(emp.salaryRate || 100000);
          const hCfg = emp.incentiveConfigs?.host;
          if (hCfg) {
            setHostIncentivePerPackage(hCfg.bundlingRate || hCfg.rate || 2000);
            setHostIncentivePerPcs(hCfg.satuanRate || 0);
          }
        }
        if (emp.roles.includes('admin_toko') && !foundAdmin) {
          foundAdmin = true;
          setAdminSalary(emp.salaryRate || 80000);
          const aCfg = emp.incentiveConfigs?.admin_toko;
          if (aCfg) {
            setAdminIncentivePerPackage(aCfg.rate || 1000);
          }
        }
      }
    }

    if (notify && onNotify) {
      if (foundHost || foundAdmin) {
        onNotify('Berhasil menerapkan tarif gaji & insentif dari data karyawan toko.', 'success');
      } else {
        onNotify('Aturan standar live 1 Host & 1 Admin aktif diterapkan.', 'info');
      }
    }
  };

  // State untuk skenario aktif yang ditampilkan di tab Rincian Rumus
  const [rincianSelectedScenarioId, setRincianSelectedScenarioId] = useState<string>('bundling_2pcs');

  // Skenario bundling yang menjadi fokus utama pertanyaan user
  const focusScenario = useMemo(() => {
    if (!aiResult || !aiResult.scenarios || aiResult.scenarios.length === 0) return null;
    if (aiResult.focusPackageId) {
      const found = aiResult.scenarios.find(s => s.id === aiResult.focusPackageId);
      if (found) return found;
    }
    return aiResult.scenarios[0];
  }, [aiResult]);

  // Skenario yang sedang dipilih di tab Rincian (default ke focusScenario)
  const activeRincianScenario = useMemo(() => {
    if (!aiResult || !aiResult.scenarios || aiResult.scenarios.length === 0) return null;
    const found = aiResult.scenarios.find(s => s.id === rincianSelectedScenarioId);
    return found || focusScenario || aiResult.scenarios[0];
  }, [aiResult, rincianSelectedScenarioId, focusScenario]);

  // Parameter biaya akuntansi yang disinkronkan secara presisi dengan analisis AI
  const rincianParams = useMemo(() => {
    const cs = aiResult?.costStructure;
    const ep = aiResult?.extractedParams;
    const isDm = aiResult?.channelType === 'dm_sosmed';

    const hpp = cs?.hppPerPcs ?? customHpp;
    const profit = cs?.targetProfitNominal ?? ep?.targetProfit ?? (targetProfit || 500000);
    const ads = cs?.adsCost ?? adsCost;
    const coin = isDm ? 0 : (cs?.coinCost ?? coinCost);
    const host = isDm ? 0 : (cs?.hostSalary ?? hostSalary);
    const admin = cs?.adminSalary ?? (isDm ? (cs?.adminSalary ?? (adminSalary || 50000)) : adminSalary);
    const adminPct = cs?.adminPercentage ?? (isDm ? 0 : adminPercentage);
    const service = cs?.serviceFee ?? (isDm ? 0 : serviceFeePerOrder);
    const packing = cs?.packingCost ?? packingCost;
    const returPct = cs?.returnPercentage ?? (isDm ? 0 : returnPercentage);
    const hostInc = isDm ? 0 : hostIncentivePerPackage;
    const adminInc = isDm ? 0 : adminIncentivePerPackage;
    const opCost = operationalCost || 0;

    const totalBurden = ep?.totalFixedBurden ?? (profit + ads + coin + host + admin + opCost);

    return {
      hpp,
      profit,
      ads,
      coin,
      host,
      admin,
      adminPct,
      service,
      packing,
      returPct,
      hostInc,
      adminInc,
      opCost,
      totalBurden,
      isDm,
    };
  }, [
    aiResult,
    customHpp,
    targetProfit,
    adsCost,
    coinCost,
    hostSalary,
    adminSalary,
    adminPercentage,
    serviceFeePerOrder,
    packingCost,
    returnPercentage,
    hostIncentivePerPackage,
    adminIncentivePerPackage,
    operationalCost,
  ]);

  // Perform Calculation for Interactive Mode
  const calculationResult: BundleCalcResult = useMemo(() => {
    const params = {
      targetProfitType,
      targetProfit,
      targetProfitPercent,
      adsCost,
      coinCost,
      operationalCost,
      hostSalary,
      hostIncentivePerPackage,
      hostIncentivePerPcs,
      adminSalary,
      adminIncentivePerPackage,
      pcsPerPackage,
      hppPerPcs: customHpp,
      packingCost,
      adminPercentage,
      serviceFeePerOrder,
      returnPercentage,
    };

    if (calcDirection === 'price_to_packages') {
      return calculateBundleGivenPrice({
        ...params,
        bundlePrice: bundlePriceInput,
      });
    } else {
      return calculateRequiredPriceGivenPackages({
        ...params,
        targetPackages: targetPackagesInput,
      });
    }
  }, [
    targetProfitType,
    targetProfit,
    targetProfitPercent,
    adsCost,
    coinCost,
    operationalCost,
    hostSalary,
    hostIncentivePerPackage,
    hostIncentivePerPcs,
    adminSalary,
    adminIncentivePerPackage,
    pcsPerPackage,
    customHpp,
    packingCost,
    adminPercentage,
    serviceFeePerOrder,
    returnPercentage,
    calcDirection,
    bundlePriceInput,
    targetPackagesInput,
  ]);

  // Standard Scenarios for Quick Comparison
  const standardScenarios: BundleScenario[] = useMemo(() => {
    return generateStandardScenarios(
      {
        targetProfitType,
        targetProfit,
        targetProfitPercent,
        adsCost,
        coinCost,
        operationalCost,
        hostSalary,
        hostIncentivePerPackage,
        hostIncentivePerPcs,
        adminSalary,
        adminIncentivePerPackage,
        hppPerPcs: customHpp,
        packingCost,
        adminPercentage,
        serviceFeePerOrder,
        returnPercentage,
      },
      customHpp
    );
  }, [
    targetProfitType,
    targetProfit,
    targetProfitPercent,
    adsCost,
    coinCost,
    operationalCost,
    hostSalary,
    hostIncentivePerPackage,
    hostIncentivePerPcs,
    adminSalary,
    adminIncentivePerPackage,
    customHpp,
    packingCost,
    adminPercentage,
    serviceFeePerOrder,
    returnPercentage,
  ]);

  // Handle Asking AI with full multi-channel support
  const handleAskAi = async (customPrompt?: string, forcedChannel?: 'auto' | 'dm_sosmed' | 'live_streaming' | 'marketplace_reguler') => {
    const textToAsk = (customPrompt !== undefined ? customPrompt : aiQuestion).trim();
    if (!textToAsk) {
      if (onNotify) onNotify('Silakan ketik pertanyaan atau keluhan Anda terlebih dahulu.', 'error');
      return;
    }

    const channelToUse = forcedChannel || selectedChannel;

    if (customPrompt !== undefined) {
      setAiQuestion(customPrompt);
    }
    setActiveQuestionQueried(textToAsk);

    setIsAiLoading(true);
    setAiError(null);
    setAiResult(null); // Clear previous result immediately so UI indicates fresh analysis

    try {
      const response = await fetch('/api/ai/calculate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: textToAsk,
          channel: channelToUse,
          storeContext: {
            storeName: store?.storeName || 'Seller Profit Fashion',
            hppAverage: customHpp,
            adminPromoPercentage: adminPercentage,
            serviceFeePerOrder: serviceFeePerOrder,
            estimateReturnPercentage: returnPercentage,
            averagePackingCost: packingCost,
          },
          parameters: {
            targetProfitType,
            targetProfit,
            targetProfitPercent,
            adsCost,
            coinCost,
            operationalCost,
            hostSalary,
            hostIncentivePerPackage,
            hostIncentivePerPcs,
            adminSalary,
            adminIncentivePerPackage,
            hppPerPcs: customHpp,
            adminPercentage,
            serviceFeePerOrder,
            returnPercentage,
            packingCost,
          },
        }),
      });

      const resJson = await response.json();
      if (resJson?.data) {
        const d = resJson.data;
        // Sinkronisasi state lokal dengan data parameter AI agar Rincian dan Input 100% konsisten
        if (d.extractedParams) {
          const ep = d.extractedParams;
          if (typeof ep.targetProfit === 'number' && ep.targetProfit > 0) {
            setTargetProfit(ep.targetProfit);
            setTargetProfitType('nominal');
          }
          if (typeof ep.adsCost === 'number') setAdsCost(ep.adsCost);
          if (typeof ep.coinCost === 'number') setCoinCost(ep.coinCost);
          if (typeof ep.hostSalary === 'number') setHostSalary(ep.hostSalary);
          if (typeof ep.adminSalary === 'number') setAdminSalary(ep.adminSalary);
          if (typeof ep.hppPerPcs === 'number' && ep.hppPerPcs > 0) setCustomHpp(ep.hppPerPcs);
          if (typeof ep.adminPercentage === 'number') setAdminPercentage(ep.adminPercentage);
          if (typeof ep.serviceFeePerOrder === 'number') setServiceFeePerOrder(ep.serviceFeePerOrder);
        } else if (d.costStructure) {
          const cs = d.costStructure;
          if (typeof cs.targetProfitNominal === 'number' && cs.targetProfitNominal > 0) {
            setTargetProfit(cs.targetProfitNominal);
            setTargetProfitType('nominal');
          }
          if (typeof cs.adsCost === 'number') setAdsCost(cs.adsCost);
          if (typeof cs.coinCost === 'number') setCoinCost(cs.coinCost);
          if (typeof cs.hostSalary === 'number') setHostSalary(cs.hostSalary);
          if (typeof cs.adminSalary === 'number') setAdminSalary(cs.adminSalary);
          if (typeof cs.hppPerPcs === 'number' && cs.hppPerPcs > 0) setCustomHpp(cs.hppPerPcs);
        }

        setAiResult(d);
        setAiSubTab('jawaban');
        if (onNotify) {
          onNotify(`Rekomendasi harga ${d.channelLabel || ''} berhasil dihitung.`, 'success');
        }
        return;
      }

      throw new Error(resJson?.error || 'Gagal menerima data kalkulasi');
    } catch (err: any) {
      console.warn('Network or AI service timeout, utilizing robust local calculation engine:', err);
      // Multi-channel local calculation fallback
      const lowerQ = textToAsk.toLowerCase();
      const isDm = channelToUse === 'dm_sosmed' ||
        lowerQ.includes('dm') ||
        lowerQ.includes('instagram') ||
        lowerQ.includes('ig') ||
        lowerQ.includes('wa') ||
        lowerQ.includes('whatsapp') ||
        lowerQ.includes('chat') ||
        lowerQ.includes('sosmed') ||
        lowerQ.includes('pesan langsung') ||
        lowerQ.includes('direct');

      if (isDm) {
        // DM selling: 0% admin marketplace, 0 service fee, 0 coin, 0 host live!
        const dmAdminSalary = adminSalary > 0 ? adminSalary : 50000;
        const dmAdsCost = adsCost > 0 ? adsCost : 30000;
        const dmTotalOverhead = dmAdminSalary + dmAdsCost + operationalCost;
        const dmTargetProfit = targetProfit > 0 ? targetProfit : 500000;
        const dmTotalBurden = dmTotalOverhead + dmTargetProfit;

        const calcDmScenario = (id: string, name: string, badge: string, pcs: number, factor: number, add: number, freeOngkirSubsidi: number, sum: string) => {
          const totalHpp = pcs * customHpp;
          const rawPrice = Math.round(((totalHpp * factor) + add) / 1000) * 1000;
          const packing = packingCost * (pcs > 1 ? 1.2 : 1);
          const variable = totalHpp + packing + freeOngkirSubsidi;
          const price = Math.max(Math.ceil((variable + 15000) / 1000) * 1000, rawPrice);
          const margin = Math.max(2000, price - variable);
          const minPkgs = Math.max(1, Math.ceil(dmTotalBurden / margin));
          const bep = dmTotalOverhead > 0 ? Math.max(1, Math.ceil(dmTotalOverhead / margin)) : 0;
          return {
            id,
            name,
            badge,
            pcsPerPackage: pcs,
            recommendedPrice: price,
            marginPerPackage: Math.round(margin),
            marginPercentage: Number(((margin / price) * 100).toFixed(1)),
            minPackagesNeeded: minPkgs,
            totalPcsNeeded: minPkgs * pcs,
            bepPackagesNeeded: bep,
            totalOmzetKotor: minPkgs * price,
            summary: sum,
          };
        };

        const dmSc1 = calcDmScenario('bundling_1pcs', 'Satuan DM (1 Pcs)', 'Harga Normal / Teaser', 1, 2.0, 15000, 0, 'Harga satuan normal untuk customer DM baru, ongkos kirim ditanggung pembeli sepenuhnya.');
        const dmSc2 = calcDmScenario('bundling_2pcs', 'Paket Hemat DM (2 Pcs)', 'Paling Laris di DM (Free Ongkir)', 2, 1.75, 18000, 10000, 'Best Seller transaksi chat DM: gratis subsidi ongkir Rp 10.000 memicu closing instan tanpa tawar-menawar!');
        const dmSc3 = calcDmScenario('bundling_3pcs', 'Paket Borong Fashion (3 Pcs)', 'Margin Profit Tertinggi', 3, 1.65, 20000, 15000, 'Sangat efektif ditawarkan saat customer minta diskon ("Tambah 1 pcs lagi langsung dapat potongan spesial").');
        const dmSc5 = calcDmScenario('bundling_5pcs', 'Paket Reseller / Sahabat (5 Pcs)', 'Volume Grosir DM', 5, 1.50, 25000, 20000, 'Pilihan bagi langganan atau reseller yang ingin membeli serian warna atau cuci ball persediaan.');

        let dmDirectAnswer = '';
        if (lowerQ.includes('script') || lowerQ.includes('balas') || lowerQ.includes('closing') || lowerQ.includes('chat')) {
          dmDirectAnswer = `Strategi Script Fast-Closing DM Instagram & WhatsApp: Untuk modal HPP Rp ${customHpp.toLocaleString('id-ID')}/pcs, pasang harga satuan di Rp ${dmSc1.recommendedPrice.toLocaleString('id-ID')} (+ongkir), namun langsung tawarkan Paket Hemat 2 Pcs Rp ${dmSc2.recommendedPrice.toLocaleString('id-ID')} dengan 'GRATIS SUBSIDI ONGKIR 10RB'. Karena tanpa potongan admin marketplace (${adminPercentage}%), margin bersih per paket 2 pcs mencapai Rp ${dmSc2.marginPerPackage.toLocaleString('id-ID')} (${dmSc2.marginPercentage}%), dan Anda hanya butuh closing ${dmSc2.minPackagesNeeded} paket/hari untuk untung bersih Rp ${dmTargetProfit.toLocaleString('id-ID')}!`;
        } else if (lowerQ.includes('diskon') || lowerQ.includes('tawar') || lowerQ.includes('nego') || lowerQ.includes('murah')) {
          dmDirectAnswer = `Trik Menghadapi Customer Nego Diskon di DM: Jangan pernah menurunkan harga satuan Rp ${dmSc1.recommendedPrice.toLocaleString('id-ID')}. Alihkan dengan jurus upselling: "Kalau ambil 1 pcs kena ongkir kak, mending ambil Paket Hemat 2 Pcs Rp ${dmSc2.recommendedPrice.toLocaleString('id-ID')} langsung kami gratiskan ongkir 10rb!". Dengan strategi ini, Anda tetap mengantongi laba bersih Rp ${dmSc2.marginPerPackage.toLocaleString('id-ID')} per chat dan perputaran modal HPP 2x lebih cepat.`;
        } else {
          dmDirectAnswer = `Kalkulasi Harga Jual DM Instagram & WhatsApp: Di channel DM, Anda bebas dari potongan admin marketplace (${adminPercentage}%) ataupun biaya koin live streaming. Dengan modal HPP Rp ${customHpp.toLocaleString('id-ID')}/pcs dan target laba bersih Rp ${dmTargetProfit.toLocaleString('id-ID')}/hari (beban harian Rp ${dmTotalBurden.toLocaleString('id-ID')}), harga ideal di DM adalah Rp ${dmSc1.recommendedPrice.toLocaleString('id-ID')} (satuan) dan Rp ${dmSc2.recommendedPrice.toLocaleString('id-ID')} (Paket 2 Pcs Hemat Ongkir). Anda cukup closing ${dmSc2.minPackagesNeeded} paket per hari untuk mencapai target laba bersih! Titik impas (BEP) beban harian hanya ${dmSc2.bepPackagesNeeded} paket.`;
        }

        const dmClosingScript = `Halo kak! Untuk baju ini harga satuan Rp ${dmSc1.recommendedPrice.toLocaleString('id-ID')} (belum termasuk ongkir). Tapi KHUSUS ORDER HARI INI kami ada PROMO BUNDLING HEMAT:
✨ Ambil 2 Pcs hanya Rp ${dmSc2.recommendedPrice.toLocaleString('id-ID')} + GRATIS SUBSIDI ONGKIR 10RB!
✨ Boleh mix model & warna bebas!
Kakak mau keep warna apa saja sebelum slot pengiriman hari ini penuh? Silakan balas dengan Format Order ya kak:
Nama:
No HP:
Alamat Lengkap:`;

        const dmAdvice = [
          'Balas pesan DM dalam waktu kurang dari 3 menit pertama saat calon pembeli masih aktif memegang smartphone.',
          'Gunakan teknik "Choice Architecture": Berikan pilihan opsi Paket 2 pcs vs 3 pcs, jangan beri pilihan "Beli atau Tidak".',
          'Karena transfer langsung via BCA/Mandiri/QRIS (0% admin fee), alihkan keuntungan tanpa potongan itu sebagai daya pikat Subsidi Ongkir.',
          'Kirim format order dan foto real picture resolusi tinggi dengan pencahayaan natural agar customer tidak ragu transfer.'
        ];

        setAiResult({
          analyzedQuery: textToAsk,
          channelType: 'dm_sosmed',
          channelLabel: 'DM Instagram / WhatsApp (Direct Order)',
          directAnswer: dmDirectAnswer,
          costStructure: {
            hppPerPcs: customHpp,
            adsCost: dmAdsCost,
            coinCost: 0,
            hostSalary: 0,
            adminSalary: dmAdminSalary,
            adminMarketplacePercent: 0,
            serviceFeePerOrder: 0,
            packingCost,
            targetProfitNominal: dmTargetProfit,
            targetProfitDescription: `Target Laba Rp ${dmTargetProfit.toLocaleString('id-ID')}`
          },
          extractedParams: {
            targetProfit: dmTargetProfit,
            targetProfitPercent,
            adsCost: dmAdsCost,
            coinCost: 0,
            hostSalary: 0,
            adminSalary: dmAdminSalary,
            totalFixedBurden: dmTotalBurden,
            hppPerPcs: customHpp,
            adminPercentage: 0,
            serviceFeePerOrder: 0
          },
          scenarios: [dmSc2, dmSc3, dmSc1, dmSc5],
          formulaExplanation: {
            step1: `Total Beban Harian DM = Target Laba (Rp ${dmTargetProfit.toLocaleString('id-ID')}) + Iklan IG/Sosmed (Rp ${dmAdsCost.toLocaleString('id-ID')}) + Gaji CS Admin (Rp ${dmAdminSalary.toLocaleString('id-ID')}) = Rp ${dmTotalBurden.toLocaleString('id-ID')}. (Tanpa Gaji Host & Koin).`,
            step2: `Margin Bersih per Paket DM = Harga Jual - Modal HPP - Biaya Packing - Subsidi Ongkir. (Hemat 100% potongan fee admin marketplace!).`,
            step3: `Target Closing DM = Total Beban Harian dibagi Margin Bersih per Paket. BEP Beban Toko = Beban Pokok dibagi Margin Bersih.`
          },
          strategicAdvice: dmAdvice,
          suggestedFollowUps: [
            'Bagaimana cara follow up customer DM yang sudah tanya tapi belum transfer?',
            'Berapa budget iklan Instagram Ads yang ideal untuk mendatangkan chat DM?',
            'Bagaimana cara membuat format order otomatis di WhatsApp Business?'
          ],
          closingScript: dmClosingScript
        });
        setAiSubTab('jawaban');
        if (onNotify) onNotify('Kalkulasi harga DM siap ditampilkan.', 'success');
        return;
      }

      // Live Streaming / General Marketplace Fallback
      const totalOverhead = adsCost + coinCost + operationalCost + hostSalary + adminSalary;
      const totalBurden = totalOverhead + targetProfit;
      
      const calcScenario = (id: string, name: string, badge: string, pcs: number, factor: number, add: number, sum: string) => {
        const totalHpp = pcs * customHpp;
        const rawP = Math.round(((totalHpp * factor) + add) / 1000) * 1000;
        const totalInc = hostIncentivePerPackage + adminIncentivePerPackage + (pcs * hostIncentivePerPcs);
        const variable = totalHpp + packingCost + serviceFeePerOrder + totalInc;
        const p = Math.max(Math.ceil((variable + 10000) / 0.85 / 1000) * 1000, rawP);
        const adminFee = Math.round((adminPercentage / 100) * p);
        const returnFee = Math.round((returnPercentage / 100) * p);
        const margin = Math.max(1000, p - adminFee - returnFee - variable);
        const minPkgs = Math.max(1, Math.ceil(totalBurden / margin));
        const bep = totalOverhead > 0 ? Math.max(1, Math.ceil(totalOverhead / margin)) : 0;
        return {
          id,
          name,
          badge,
          pcsPerPackage: pcs,
          recommendedPrice: p,
          marginPerPackage: Math.round(margin),
          marginPercentage: Number(((margin / p) * 100).toFixed(1)),
          minPackagesNeeded: minPkgs,
          totalPcsNeeded: minPkgs * pcs,
          bepPackagesNeeded: bep,
          totalOmzetKotor: minPkgs * p,
          summary: sum,
        };
      };

      const sc2 = calcScenario('bundling_2pcs', 'Bundling Hemat (Isi 2 Pcs)', 'Paling Populer & Seimbang', 2, 1.55, 15000, 'Sangat direkomendasikan saat sesi live streaming, menghemat ongkir pelanggan dan mempercepat perputaran barang.');
      const sc3 = calcScenario('bundling_3pcs', 'Bundling Best Seller (Isi 3 Pcs)', 'Rekomendasi Margin Profit', 3, 1.50, 18000, 'Margin profit per transaksi tinggi, hanya membutuhkan lebih sedikit pesanan untuk mencapai target laba.');
      const sc1 = calcScenario('bundling_1pcs', 'Satuan (Single 1 Pcs)', 'Penjualan Satuan Normal', 1, 1.80, 12000, 'Pilihan bagi pembeli yang baru pertama kali coba berbelanja di toko Anda.');
      const sc5 = calcScenario('bundling_5pcs', 'Bundling Jumbo / Grosir (Isi 5 Pcs)', 'Volume Cepat Habis', 5, 1.45, 22000, 'Paling efektif untuk cuci gudang / menghabiskan sisa persediaan stok.');

      let tailoredDiagnosis = '';
      let adviceItems: string[] = [];

      if (lowerQ.includes('boncos') || lowerQ.includes('rugi') || lowerQ.includes('bakar')) {
        tailoredDiagnosis = `Diagnosis Keluhan Iklan Boncos: Menghadapi beban iklan Rp ${adsCost.toLocaleString('id-ID')} dan koin Rp ${coinCost.toLocaleString('id-ID')} bersama gaji 1 host (Rp ${hostSalary.toLocaleString('id-ID')}) & 1 admin (Rp ${adminSalary.toLocaleString('id-ID')}) dengan total beban Rp ${totalBurden.toLocaleString('id-ID')}, hentikan jual eceran tipis. Pasang Bundling 2 Pcs di harga Rp ${sc2.recommendedPrice.toLocaleString('id-ID')} (target ${sc2.minPackagesNeeded} paket) atau Bundling 3 Pcs Rp ${sc3.recommendedPrice.toLocaleString('id-ID')} (hanya butuh ${sc3.minPackagesNeeded} paket) untuk langsung menutup beban di sesi live ini! Titik impas (BEP) Anda hanya ${sc2.bepPackagesNeeded} paket terjual.`;
        adviceItems = [
          `Matikan campaign iklan berbiaya tinggi yang menghasilkan ROAS di bawah 2.5x, fokuskan ke etalase bundling 2 pcs.`,
          `Sebar koin Rp ${coinCost.toLocaleString('id-ID')} hanya saat penonton mencapai puncak agar konversi checkout langsung naik.`,
          `Cukup capai ${sc2.bepPackagesNeeded} paket bundling 2 pcs untuk BEP, paket berikutnya murni menjadi laba bersih Anda.`,
          `Gunakan gimmick 'Beli 2 Lebih Hemat Ongkir' agar penonton terdorong ambil paket ganda.`
        ];
      } else if (lowerQ.includes('sepi') || lowerQ.includes('anjlok') || lowerQ.includes('turun') || lowerQ.includes('penonton') || lowerQ.includes('view')) {
        tailoredDiagnosis = `Diagnosis Trafik/Penjualan Sepi: Saat trafik sesi live sedang turun, memaksa jual satuan akan membuat biaya iklan dan gaji host/admin merugi. Terapkan strategi 'Price Anchoring': tampilkan satuan seharga Rp ${sc1.recommendedPrice.toLocaleString('id-ID')}, namun tawarkan Paket Bundling 2 Pcs di Rp ${sc2.recommendedPrice.toLocaleString('id-ID')} (target ${sc2.minPackagesNeeded} paket). Penonton akan merasa bundling jauh lebih murah dan segera checkout.`;
        adviceItems = [
          `Buat flash sale 15 menit pertama dengan Bundling 2 Pcs untuk memicu interaksi awal algoritma marketplace.`,
          `Tingkatkan ritme host berbicara dan gunakan visualisasi produk berpasangan (mix & match).`,
          `Hanya butuh ${sc3.minPackagesNeeded} paket jika host berhasil mengarahkan penonton ke Bundling 3 Pcs.`,
          `Berikan bonus souvenir kecil/voucher koin khusus penonton yang checkout dalam 5 menit pertama.`
        ];
      } else if (lowerQ.includes('retur') || lowerQ.includes('tolak') || lowerQ.includes('cod')) {
        tailoredDiagnosis = `Diagnosis Proteksi Retur COD: Dengan estimasi retur ${returnPercentage}%, paket bundling meminimalisir persentase ongkir yang hangus dibanding menjual satuan. Rekomendasi aman: Tetapkan harga Bundling 2 Pcs di Rp ${sc2.recommendedPrice.toLocaleString('id-ID')} (target ${sc2.minPackagesNeeded} paket) untuk mengamankan margin bersih per paket dan target laba harian Rp ${targetProfit.toLocaleString('id-ID')}.`;
        adviceItems = [
          `Pastikan admin toko melakukan konfirmasi alamat dan pesanan COD lewat chat sebelum barang dipacking.`,
          `Alokasikan cadangan retur ${returnPercentage}% ke dalam harga bundling sehingga modal toko tetap aman saat ada retur.`,
          `Gunakan packing berkualitas tinggi untuk meminimalisir kerusakan barang saat perjalanan bolak-balik COD.`,
          `Arahkan pembeli COD ke metode pembayaran digital non-tunai dengan iming-iming diskon koin tambahan.`
        ];
      } else if (lowerQ.includes('host') || lowerQ.includes('gaji') || lowerQ.includes('admin') || lowerQ.includes('karyawan')) {
        tailoredDiagnosis = `Diagnosis Beban Tenaga Kerja (Host & Admin): Standar sesi live mengasumsikan 1 Host (gaji pokok Rp ${hostSalary.toLocaleString('id-ID')}) dan 1 Admin Toko (gaji pokok Rp ${adminSalary.toLocaleString('id-ID')}). Untuk melunasi seluruh gaji dan biaya tetap, host cukup menjual minimal ${sc2.bepPackagesNeeded} paket Bundling 2 Pcs seharga Rp ${sc2.recommendedPrice.toLocaleString('id-ID')}. Untuk mencapai target laba Rp ${targetProfit.toLocaleString('id-ID')}, targetkan penjualan ${sc2.minPackagesNeeded} paket per sesi.`;
        adviceItems = [
          `Berikan insentif Rp ${hostIncentivePerPackage.toLocaleString('id-ID')}/paket ke host dan Rp ${adminIncentivePerPackage.toLocaleString('id-ID')}/paket ke admin agar keduanya berkolaborasi aktif.`,
          `Jadikan kuota ${sc2.bepPackagesNeeded} paket sebagai target minimal sebelum sesi live berakhir.`,
          `Gunakan etalase Bundling 3 Pcs (target ${sc3.minPackagesNeeded} paket) untuk host yang mahir upselling.`,
          `Evaluasi performa host live mingguan berdasarkan rasio paket bundling terjual dibanding produk satuan.`
        ];
      } else if (lowerQ.includes('jam') || lowerQ.includes('waktu') || lowerQ.includes('durasi') || lowerQ.includes('kapan')) {
        tailoredDiagnosis = `Strategi Jadwal Live & Bundling: Waktu live streaming paling efektif untuk produk fashion/lifestyle adalah sesi Siang (12:00 - 14:00 WIB) dan sesi Malam (19:30 - 22:30 WIB). Selama durasi sesi 2.5 - 3.5 jam ini, targetkan host menjual ${sc2.minPackagesNeeded} paket Bundling 2 Pcs seharga Rp ${sc2.recommendedPrice.toLocaleString('id-ID')} (rata-rata 8-10 paket per jam) untuk mencapai target laba bersih Rp ${targetProfit.toLocaleString('id-ID')}/hari.`;
        adviceItems = [
          `Fokuskan pembagian koin di menit ke-20 sampai ke-45 saat penonton mulai membanjiri room live.`,
          `Pin etalase Bundling 2 Pcs di keranjang nomor 1 dan 2 sebagai produk anchor utama.`,
          `Lakukan pergantian host jika durasi live melebihi 3 jam agar energi dan performa presentasi tetap maksimal.`,
          `Percepat respon admin di kolom komentar untuk menjawab pertanyaan ukuran dan warna baju.`
        ];
      } else if (lowerQ.includes('satuan') || lowerQ.includes('eceran') || lowerQ.includes('paket') || lowerQ.includes('banding')) {
        tailoredDiagnosis = `Analisis Komparasi Satuan vs Bundling: Menjual 1 pcs satuan seharga Rp ${sc1.recommendedPrice.toLocaleString('id-ID')} menyerap biaya admin dan packing yang relatif besar per item. Sebaliknya, Paket Bundling 2 Pcs seharga Rp ${sc2.recommendedPrice.toLocaleString('id-ID')} hanya butuh ${sc2.minPackagesNeeded} paket untuk menutup beban harian Rp ${totalBurden.toLocaleString('id-ID')}, menghemat biaya packing hingga 50% dan mempercepat perputaran modal HPP toko Anda.`;
        adviceItems = [
          `Gunakan produk satuan hanya sebagai pemancing harga awal (teaser), bukan produk promosi utama.`,
          `Bundling 2 & 3 pcs adalah etalase paling menguntungkan bagi toko dan paling disukai pembeli.`,
          `Titik impas (BEP) Bundling 2 Pcs tercapai pada penjualan ${sc2.bepPackagesNeeded} paket saja.`,
          `Berikan variasi pilihan warna dalam 1 paket bundling agar pembeli lebih tertarik membeli lebih banyak.`
        ];
      } else {
        tailoredDiagnosis = `Rekomendasi Analisis Skenario "${textToAsk}": Dengan memperhitungkan biaya iklan Rp ${adsCost.toLocaleString('id-ID')}, koin Rp ${coinCost.toLocaleString('id-ID')}, serta kehadiran 1 Host (Rp ${hostSalary.toLocaleString('id-ID')}) dan 1 Admin Toko (Rp ${adminSalary.toLocaleString('id-ID')}) dengan total beban harian Rp ${totalBurden.toLocaleString('id-ID')}, Anda disarankan memprioritaskan Paket Bundling 2 Pcs seharga Rp ${sc2.recommendedPrice.toLocaleString('id-ID')} (target ${sc2.minPackagesNeeded} paket/hari) atau Bundling 3 Pcs seharga Rp ${sc3.recommendedPrice.toLocaleString('id-ID')} (target ${sc3.minPackagesNeeded} paket/hari). Titik impas (BEP) beban toko Anda adalah ${sc2.bepPackagesNeeded} paket.`;
        adviceItems = [
          `Fokuskan host live mempromosikan Bundling 2 & 3 pcs sebagai etalase utama keranjang kuning.`,
          `Sebar koin pada peak traffic (menit ke-20 sampai ke-45) saat penonton ramai agar memicu tombol checkout.`,
          `Titik impas (BEP) beban toko Anda adalah ${sc2.bepPackagesNeeded} paket bundling 2 pcs; lewati titik ini untuk mengamankan 100% laba bersih.`,
          `Terapkan skema insentif host per paket bundling terjual agar host lebih agresif melakukan upselling.`
        ];
      }

      setAiResult({
        analyzedQuery: textToAsk,
        channelType: 'live_streaming',
        channelLabel: 'Shopee & TikTok Live Streaming',
        directAnswer: tailoredDiagnosis,
        extractedParams: {
          targetProfit,
          targetProfitPercent,
          adsCost,
          coinCost,
          hostSalary,
          adminSalary,
          totalFixedBurden: totalBurden,
          hppPerPcs: customHpp,
        },
        scenarios: [sc2, sc3, sc1, sc5],
        formulaExplanation: {
          step1: `Total Beban Harian Wajib Ditutup = Target Laba + Biaya Iklan + Biaya Koin + Gaji Host + Gaji Admin = Rp ${totalBurden.toLocaleString('id-ID')}/hari.`,
          step2: `Margin Bersih per Paket = Harga Jual - Modal HPP - Admin Marketplace (${adminPercentage}%) - Biaya Layanan (Rp ${serviceFeePerOrder.toLocaleString('id-ID')}) - Packing (Rp ${packingCost.toLocaleString('id-ID')}) - Cadangan Retur (${returnPercentage}%) - Insentif.`,
          step3: `Minimum Kuota Penjualan = Total Beban Harian dibagi Margin Bersih per Paket.`
        },
        strategicAdvice: adviceItems
      });
      setAiSubTab('jawaban');
      if (onNotify) {
        onNotify('Kalkulasi skenario bundling siap ditampilkan.', 'success');
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run initial AI analysis on mount and synchronize employee defaults
  useEffect(() => {
    handleLoadEmployeeDefaults(false);
    if (!aiResult && !isAiLoading) {
      handleAskAi(aiQuestion);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1015] text-zinc-100 pb-24 font-sans selection:bg-[#25F4EE] selection:text-black">
      {/* Top Sticky Header - Clean, Uncluttered, No Horizontal Truncation */}
      <div className="sticky top-0 z-30 bg-[#0E1015]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="btn-back-to-dashboard"
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10 active:scale-95 shrink-0 cursor-pointer"
              title="Kembali ke Penjualan"
            >
              <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#25F4EE] animate-pulse shrink-0" />
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate">
                  Kalkulasi Harga & Paket Terjual
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 truncate hidden sm:block">
                Simulasi cerdas titik impas, kuota bundling harian, dan alokasi laba bersih
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer shrink-0 hidden sm:flex items-center gap-1.5"
          >
            <span>Tutup</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        
        {/* PRIMARY MODE SWITCHER: Prominent, Full-Width, Never Squeezed */}
        <div className="p-1.5 bg-[#14161F] border border-white/10 rounded-2xl grid grid-cols-2 gap-2 shadow-lg">
          <button
            id="btn-switch-mode-ai"
            type="button"
            onClick={() => setMainMode('ai')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              mainMode === 'ai'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">Mode AI Cerdas</span>
            <span className={`hidden md:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              mainMode === 'ai' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
            }`}>
              Konsultasi Otomatis
            </span>
          </button>

          <button
            id="btn-switch-mode-input"
            type="button"
            onClick={() => setMainMode('input')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              mainMode === 'input'
                ? 'bg-[#25F4EE] text-black shadow-md shadow-[#25F4EE]/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">Mode Input Manual</span>
            <span className={`hidden md:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              mainMode === 'input' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
            }`}>
              Simulasi Mandiri
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ======================== MODE AI CONSULTATION =========================== */}
        {/* ========================================================================= */}
        {mainMode === 'ai' && (
          <div className="space-y-4">
            {/* SUB-MENU CARDS: Rapi, Terstruktur, Format Kartu Sub Menu dengan Lengkung Neon Bersebrangan */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Sub-menu 1: Input Pertanyaan */}
              <div
                id="menu-card-ai-input"
                onClick={() => setAiSubTab('input')}
                className={`relative overflow-hidden group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-2.5 border cursor-pointer ${
                  aiSubTab === 'input'
                    ? 'bg-[#181C28] border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tl-br" color={aiSubTab === 'input' ? 'emerald' : 'dual'} size="sm" />
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      aiSubTab === 'input'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText
                      text="Menu Input Pertanyaan"
                      className={`text-xs sm:text-sm font-black transition-colors ${
                        aiSubTab === 'input' ? 'text-emerald-300' : 'text-white group-hover:text-emerald-300'
                      }`}
                    />
                    <MarqueeText
                      text="Ketik target laba, modal HPP & iklan"
                      className="text-[10px] sm:text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Langkah 1</span>
                  <span className={`font-bold ${aiSubTab === 'input' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {aiSubTab === 'input' ? 'Sedang Dibuka' : 'Buka Menu'}
                  </span>
                </div>
              </div>

              {/* Sub-menu 2: Saran & Rekomendasi */}
              <div
                id="menu-card-ai-jawaban"
                onClick={() => setAiSubTab('jawaban')}
                className={`relative overflow-hidden group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-2.5 border cursor-pointer ${
                  aiSubTab === 'jawaban'
                    ? 'bg-[#181C28] border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tr-bl" color={aiSubTab === 'jawaban' ? 'cyan' : 'dual'} size="sm" />
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      aiSubTab === 'jawaban'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MarqueeText
                        text="Saran & Rekomendasi"
                        className={`text-xs sm:text-sm font-black transition-colors ${
                          aiSubTab === 'jawaban' ? 'text-emerald-300' : 'text-white group-hover:text-emerald-300'
                        }`}
                      />
                      {aiResult && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                    </div>
                    <MarqueeText
                      text="Hasil target harga & paket terjual"
                      className="text-[10px] sm:text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Langkah 2</span>
                  <span className={`font-bold ${aiSubTab === 'jawaban' ? 'text-emerald-400' : aiResult ? 'text-teal-400' : 'text-zinc-500'}`}>
                    {aiSubTab === 'jawaban' ? 'Sedang Dibuka' : aiResult ? 'Hasil Siap' : 'Buka Menu'}
                  </span>
                </div>
              </div>

              {/* Sub-menu 3: Rincian Rumus Akuntansi */}
              <div
                id="menu-card-ai-rincian"
                onClick={() => setAiSubTab('rincian')}
                className={`relative overflow-hidden group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-2.5 border cursor-pointer ${
                  aiSubTab === 'rincian'
                    ? 'bg-[#181C28] border-cyan-500 shadow-lg ring-1 ring-cyan-500/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tl-br" color={aiSubTab === 'rincian' ? 'cyan' : 'dual'} size="sm" />
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      aiSubTab === 'rincian'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText
                      text="Rincian Rumus Akuntansi"
                      className={`text-xs sm:text-sm font-black transition-colors ${
                        aiSubTab === 'rincian' ? 'text-cyan-300' : 'text-white group-hover:text-cyan-300'
                      }`}
                    />
                    <MarqueeText
                      text="Formula margin & kuota BEP toko"
                      className="text-[10px] sm:text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Rincian</span>
                  <span className={`font-bold ${aiSubTab === 'rincian' ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    {aiSubTab === 'rincian' ? 'Sedang Dibuka' : 'Buka Menu'}
                  </span>
                </div>
              </div>

              {/* Sub-menu 4: Tips Live & Closing */}
              <div
                id="menu-card-ai-tips"
                onClick={() => setAiSubTab('tips')}
                className={`relative overflow-hidden group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-2.5 border cursor-pointer ${
                  aiSubTab === 'tips'
                    ? 'bg-[#181C28] border-amber-500 shadow-lg ring-1 ring-amber-500/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tr-bl" color={aiSubTab === 'tips' ? 'amber' : 'dual'} size="sm" />
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      aiSubTab === 'tips'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText
                      text="Tips Live & Closing"
                      className={`text-xs sm:text-sm font-black transition-colors ${
                        aiSubTab === 'tips' ? 'text-amber-300' : 'text-white group-hover:text-amber-300'
                      }`}
                    />
                    <MarqueeText
                      text="Strategi upselling & host live"
                      className="text-[10px] sm:text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Strategi</span>
                  <span className={`font-bold ${aiSubTab === 'tips' ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {aiSubTab === 'tips' ? 'Sedang Dibuka' : 'Buka Menu'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI SUB-TAB 1: INPUT PERTANYAAN */}
            {aiSubTab === 'input' && (
              <div className="space-y-4">
                <div className="p-4 sm:p-6 rounded-2xl bg-[#14161F] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                          Tanyakan Skenario Finansial ke AI
                        </h2>
                        <p className="text-xs text-zinc-400">
                          AI mengalkulasi laba bersih, beban harian, biaya admin, packing, retur, serta gaji/insentif.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoadEmployeeDefaults}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                      title="Gunakan tarif gaji karyawan aktif dari pengaturan toko"
                    >
                      <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
                      <span>Terapkan Gaji Toko</span>
                    </button>
                  </div>

                  {/* Channel Selector Bar */}
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block px-1">
                      Pilih Channel Penjualan (Memengaruhi Rumus & Biaya):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'auto', label: '⚡ Deteksi Otomatis', desc: 'Sesuai kata kunci pertanyaan' },
                        { id: 'dm_sosmed', label: '💬 DM Instagram / WA', desc: '0% Admin Marketplace, Tanpa Host' },
                        { id: 'live_streaming', label: '🎥 Shopee & TikTok Live', desc: 'Ada Host Live, Koin, Admin' },
                        { id: 'marketplace_reguler', label: '🛒 Marketplace Katalog', desc: 'Potongan Admin, Iklan Search' },
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            setSelectedChannel(ch.id as any);
                            if (ch.id === 'dm_sosmed') {
                              setAiQuestion('Kalkulasi harga jual baju di DM Instagram modal 25rb biar untung 500rb/hari dan berapa paket terjual?');
                            } else if (ch.id === 'live_streaming') {
                              setAiQuestion('Jika dalam satu hari iklan 60k dan koin 30k berapa harga bundling 2 pcs yang dijual agar keuntungan mencapai 1 jt/hari?');
                            }
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            selectedChannel === ch.id
                              ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-xs font-black block truncate ${selectedChannel === ch.id ? 'text-emerald-300' : 'text-zinc-300'}`}>
                            {ch.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                            {ch.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clean Textarea with Dedicated Action Bar Below (Tidak Menumpuk/Berantakan) */}
                  <div className="rounded-2xl bg-black/60 border border-white/15 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all overflow-hidden">
                    <textarea
                      id="input-ai-prompt"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAskAi();
                        }
                      }}
                      rows={3}
                      placeholder={
                        selectedChannel === 'dm_sosmed'
                          ? "Contoh: Berapa harga jual baju di DM Instagram modal 25rb biar untung 500rb/hari dan buatkan script balas DM fast closing?"
                          : "Contoh: Jika dalam satu hari iklan 60k dan koin 30k berapa harga bundling 2 pcs yang dijual agar keuntungan mencapai 1 jt/hari dan berapa minimum paket terjual?"
                      }
                      className="w-full p-4 bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none resize-none leading-relaxed block"
                    />

                    {/* Dedicated Bottom Bar for Shortcut and Send Button */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.03] border-t border-white/10 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          Tekan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 font-mono text-[10px] border border-white/15">Enter ↵</kbd> untuk kirim
                        </span>
                        <span className="text-zinc-600 hidden sm:inline">•</span>
                        <span className="text-[11px] text-zinc-500 hidden sm:inline">
                          Shift + Enter untuk baris baru
                        </span>
                      </div>

                      <button
                        id="btn-submit-ai-question"
                        type="button"
                        onClick={() => handleAskAi()}
                        disabled={isAiLoading || !aiQuestion.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95 cursor-pointer ml-auto"
                      >
                        {isAiLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menganalisis...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Kirim Pertanyaan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preset Quick Chips - Pertanyaan & Keluhan Populer Seller (DM & Live) */}
                  <div className="space-y-2 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Contoh Pertanyaan Populer:
                      </span>
                      <span className="text-[10px] text-zinc-500">Klik untuk langsung tanyakan ke AI</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { tag: '💬 DM', ch: 'dm_sosmed' as const, q: 'Kalkulasi harga jual baju di DM Instagram modal 25rb biar untung 500rb/hari dan berapa paket terjual?' },
                        { tag: '💬 DM', ch: 'dm_sosmed' as const, q: 'Script balas DM Instagram agar customer langsung transfer beli bundling 2 pcs hemat ongkir?' },
                        { tag: '💬 DM', ch: 'dm_sosmed' as const, q: 'Customer di DM minta diskon, gimana cara upselling bundling hemat ongkir biar tetap untung?' },
                        { tag: '🎥 Live', ch: 'live_streaming' as const, q: 'Iklan 60k koin 30k target laba 1 jt/hari berapa harga bundling 2 pcs dan kuota terjual?' },
                        { tag: '🎥 Live', ch: 'live_streaming' as const, q: 'Iklan boncos 100k penjualan sepi, gimana cara bundling biar tetap untung 500rb?' },
                        { tag: '🎥 Live', ch: 'live_streaming' as const, q: 'Host live minta gaji 100k, berapa paket bundling yang harus terjual per sesi?' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedChannel(preset.ch);
                            setAiQuestion(preset.q);
                            handleAskAi(preset.q, preset.ch);
                          }}
                          className="text-left text-xs p-2.5 rounded-xl bg-black/40 hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer flex items-start gap-2 group"
                        >
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            preset.tag.includes('DM') ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {preset.tag}
                          </span>
                          <span className="line-clamp-2 leading-snug group-hover:text-white">
                            "{preset.q}"
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parameter Toko yang Digunakan AI */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      Parameter Toko Tersimpan:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Modal HPP (Avg)</span>
                        <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">{formatRupiah(customHpp)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Admin Toko</span>
                        <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">{adminPercentage}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Gaji Pokok Host</span>
                        <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">{formatRupiah(hostSalary)}/hr</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Gaji Pokok Admin</span>
                        <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">{formatRupiah(adminSalary)}/hr</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* If result already exists, show quick banner to view */}
                {aiResult && (
                  <div 
                    onClick={() => setAiSubTab('jawaban')}
                    className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-300 block">Jawaban AI Sudah Tersedia!</span>
                        <span className="text-xs text-zinc-300 truncate block">{aiResult.directAnswer}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1 shrink-0 ml-2">
                      Lihat Hasil <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* AI SUB-TAB 2: JAWABAN & REKOMENDASI STRATEGIS BUNDLING */}
            {aiSubTab === 'jawaban' && (
              <div className="space-y-5">
                {isAiLoading && (
                  <div className="p-12 rounded-2xl bg-[#14161F] border border-white/10 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                    <h3 className="text-base font-bold text-white">AI Sedang Mengalkulasi Skenario Bundling Optimal...</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Menghitung margin per paket setelah potongan admin marketplace, biaya retur, biaya packing, beban iklan & koin, serta alokasi gaji host dan admin.
                    </p>
                  </div>
                )}

                {!isAiLoading && aiError && (
                  <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                      <AlertCircle className="w-5 h-5" />
                      <span>Terjadi Kesalahan Analisis AI</span>
                    </div>
                    <p className="text-xs text-zinc-300">{aiError}</p>
                    <button
                      onClick={() => handleAskAi()}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold uppercase"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                {!isAiLoading && aiResult && (
                  <>
                    {/* Active Question Banner & Quick Question Switcher */}
                    <div className="p-4 rounded-2xl bg-[#14161F] border border-white/10 space-y-3 shadow-lg">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] uppercase font-black text-zinc-400">Pertanyaan Dianalisis:</span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                {aiResult.channelLabel || (aiResult.channelType === 'dm_sosmed' ? '💬 DM Instagram / WA (Direct)' : '🎥 Shopee & TikTok Live')}
                              </span>
                              {aiResult.channelType === 'dm_sosmed' ? (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  0% Admin Marketplace
                                </span>
                              ) : (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
                                  1 Host + 1 Admin Bertugas
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Realtime AI
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-white mt-1 break-words leading-relaxed">
                              "{aiResult.analyzedQuery || activeQuestionQueried || aiQuestion}"
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAiSubTab('input')}
                          className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ketik Pertanyaan Baru</span>
                        </button>
                      </div>

                      {/* Quick Question Switcher Chips */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Ganti Pertanyaan Cepat (Jawaban Langsung Berubah Sesuai Channel):
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                          {[
                            { label: '💬 DM Modal 25rb', ch: 'dm_sosmed' as const, q: 'Kalkulasi harga jual baju di DM Instagram modal 25rb biar untung 500rb/hari dan berapa paket terjual?' },
                            { label: '💬 Script Fast Closing DM', ch: 'dm_sosmed' as const, q: 'Script balas DM Instagram agar customer langsung transfer beli bundling 2 pcs hemat ongkir?' },
                            { label: '💬 Customer Nego DM', ch: 'dm_sosmed' as const, q: 'Customer di DM minta diskon, gimana cara upselling bundling hemat ongkir biar tetap untung?' },
                            { label: '🔥 Iklan Boncos Live', ch: 'live_streaming' as const, q: 'Iklan boncos 100k penjualan sepi, gimana cara bundling biar tetap untung 500rb?' },
                            { label: '📦 Retur COD 8%', ch: 'live_streaming' as const, q: 'Retur pembeli tinggi sampai 8%, berapa harga bundling 2 & 3 pcs yang aman?' },
                            { label: '👥 Gaji Host Live', ch: 'live_streaming' as const, q: 'Beban gaji host 100k dan admin 80k per live, berapa paket bundling minimum harus laku?' },
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedChannel(item.ch);
                                setAiQuestion(item.q);
                                handleAskAi(item.q, item.ch);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-black/50 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 shrink-0 transition-all font-medium text-xs cursor-pointer flex items-center gap-1"
                            >
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Primary Highlight Answer Box dengan Neon Lengkung Bersebrangan */}
                    <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#14161F] border border-emerald-500/40 shadow-xl space-y-4">
                      <NeonCorners variant="opposite-tl-br" color="emerald" size="md" />
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                            Rekomendasi Utama AI ({aiResult.channelLabel || 'Kalkulasi Cerdas'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAiSubTab('input')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
                          >
                            Tanya Ulang
                          </button>
                          <button
                            onClick={() => setAiSubTab('rincian')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors font-bold flex items-center gap-1"
                          >
                            Lihat Rumus <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-black/50 border border-emerald-500/20 text-sm sm:text-base font-medium text-emerald-100 leading-relaxed whitespace-pre-line">
                        {aiResult.directAnswer}
                      </div>

                      {/* 4 KOTAK METRIK UTAMA: Sesuai Persis dengan Pertanyaan User */}
                      {focusScenario && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                          {/* Kotak 1: Rekomendasi Harga Jual Paket */}
                          <div className="relative overflow-hidden p-4 rounded-2xl bg-[#121520] border border-cyan-500/40 shadow-md space-y-1.5">
                            <NeonCorners variant="opposite-tl-br" color="cyan" size="sm" />
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Rekomendasi Harga
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {focusScenario.name}
                              </span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-[#25F4EE] tracking-tight">
                              {formatRupiah(focusScenario.recommendedPrice)}
                            </div>
                            <MarqueeText
                              text={`Margin Bersih: ${formatRupiah(focusScenario.marginPerPackage)}/paket (${focusScenario.marginPercentage}%)`}
                              className="text-[11px] text-zinc-400"
                            />
                          </div>

                          {/* Kotak 2: Target Kuota Terjual (Berapa Paket Terjual) */}
                          <div className="relative overflow-hidden p-4 rounded-2xl bg-[#121520] border border-emerald-500/40 shadow-md space-y-1.5">
                            <NeonCorners variant="opposite-tr-bl" color="emerald" size="sm" />
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Target Terjual
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Wajib Capai
                              </span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                              {formatNumber(focusScenario.minPackagesNeeded)} <span className="text-xs font-bold text-zinc-300">Paket</span>
                            </div>
                            <MarqueeText
                              text={`Total Volume: ${focusScenario.totalPcsNeeded} Pcs baju per hari`}
                              className="text-[11px] text-zinc-400"
                            />
                          </div>

                          {/* Kotak 3: Target Laba Bersih Toko */}
                          <div className="relative overflow-hidden p-4 rounded-2xl bg-[#121520] border border-amber-500/40 shadow-md space-y-1.5">
                            <NeonCorners variant="opposite-tl-br" color="amber" size="sm" />
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Target Laba Bersih
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Laba Toko
                              </span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                              {formatRupiah(
                                aiResult.costStructure?.targetProfitNominal ??
                                aiResult.extractedParams?.targetProfit ??
                                (targetProfit || 500000)
                              )}
                            </div>
                            <MarqueeText
                              text="Laba bersih murni masuk kas setelah semua beban lunas"
                              className="text-[11px] text-zinc-400"
                            />
                          </div>

                          {/* Kotak 4: Titik Impas (BEP Beban Toko) */}
                          <div className="relative overflow-hidden p-4 rounded-2xl bg-[#121520] border border-rose-500/40 shadow-md space-y-1.5">
                            <NeonCorners variant="opposite-tr-bl" color="magenta" size="sm" />
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Titik Impas (BEP)
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Batas Aman
                              </span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
                              {focusScenario.bepPackagesNeeded} <span className="text-xs font-bold text-zinc-300">Paket</span>
                            </div>
                            <MarqueeText
                              text={`Lunas beban harian ${formatRupiah(aiResult.extractedParams?.totalFixedBurden ?? (targetProfit + adsCost + coinCost + hostSalary + adminSalary))}`}
                              className="text-[11px] text-zinc-400"
                            />
                          </div>
                        </div>
                      )}

                      {/* Detail Ringkasan Beban & Parameter yang Dianalisis */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/5 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 min-w-0">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Modal HPP</span>
                          <span className="font-bold text-white mt-0.5 block truncate">
                            {formatRupiah(aiResult.costStructure?.hppPerPcs ?? customHpp)} / pcs
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 min-w-0">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Iklan & Promosi</span>
                          <span className="font-bold text-amber-400 mt-0.5 block truncate">
                            {formatRupiah(
                              (aiResult.costStructure?.adsCost ?? adsCost) +
                              (aiResult.costStructure?.coinCost ?? (aiResult.channelType === 'dm_sosmed' ? 0 : coinCost))
                            )}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 min-w-0">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                            {aiResult.channelType === 'dm_sosmed' ? 'Admin Chat / CS' : 'Host & Admin'}
                          </span>
                          <span className="font-bold text-cyan-400 mt-0.5 block truncate">
                            {formatRupiah(
                              aiResult.channelType === 'dm_sosmed'
                                ? (aiResult.costStructure?.adminSalary ?? (adminSalary || 50000))
                                : ((aiResult.costStructure?.hostSalary ?? hostSalary) + (aiResult.costStructure?.adminSalary ?? adminSalary))
                            )}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 min-w-0">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total Beban Harian</span>
                          <span className="font-bold text-emerald-400 mt-0.5 block truncate">
                            {formatRupiah(
                              aiResult.extractedParams?.totalFixedBurden ||
                              ((aiResult.costStructure?.targetProfitNominal ?? targetProfit) +
                               (aiResult.costStructure?.adsCost ?? adsCost) +
                               (aiResult.costStructure?.coinCost ?? (aiResult.channelType === 'dm_sosmed' ? 0 : coinCost)) +
                               (aiResult.channelType === 'dm_sosmed' ? 0 : (aiResult.costStructure?.hostSalary ?? hostSalary)) +
                               (aiResult.costStructure?.adminSalary ?? adminSalary))
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4 Tier Bundling Cards dengan Neon Lengkung Bersebrangan & Marquee */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          Pilihan Skenario Paket Bundling Lengkap:
                        </h3>
                        <span className="text-xs text-zinc-500">Klik kartu untuk menguji langsung di Mode Input</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(aiResult?.scenarios || []).map((sc, scIdx) => {
                          const isFocus = focusScenario?.id === sc.id;
                          const neonVariant = scIdx % 2 === 0 ? 'opposite-tl-br' : 'opposite-tr-bl';

                          return (
                            <div
                              key={sc.id}
                              onClick={() => {
                                setMainMode('input');
                                setPcsPerPackage(sc.pcsPerPackage);
                                setBundlePriceInput(sc.recommendedPrice);
                                setInputSubTab('hasil');
                                if (onNotify) onNotify(`Parameter ${sc.name} diterapkan ke Mode Input.`, 'info');
                              }}
                              className={`relative overflow-hidden p-5 rounded-2xl transition-all cursor-pointer shadow-lg group active:scale-[0.99] flex flex-col justify-between gap-4 border ${
                                isFocus
                                  ? 'bg-[#161B28] border-emerald-500/80 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                                  : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-emerald-500/40'
                              }`}
                            >
                              <NeonCorners
                                variant={neonVariant}
                                color={isFocus ? 'emerald' : 'dual'}
                                size="sm"
                              />

                              <div className="space-y-2.5 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                                      {sc.badge}
                                    </span>
                                    {isFocus && (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse shrink-0">
                                        🎯 Fokus Pertanyaan
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-zinc-400 font-semibold shrink-0">
                                    {sc.pcsPerPackage} Pcs / Paket
                                  </span>
                                </div>

                                <div className="min-w-0 overflow-hidden">
                                  <MarqueeText
                                    text={sc.name}
                                    className="text-base font-black text-white group-hover:text-emerald-300 transition-colors"
                                  />
                                  <MarqueeText
                                    text={sc.summary}
                                    className="text-xs text-zinc-400 mt-1"
                                  />
                                </div>
                              </div>

                              {/* Main Metrics for this bundle */}
                              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/5">
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 min-w-0">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Rekomendasi Harga</span>
                                  <span className="text-base font-black text-[#25F4EE] block mt-0.5 truncate">
                                    {formatRupiah(sc.recommendedPrice)}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 mt-0.5 block truncate">
                                    Margin: {formatRupiah(sc.marginPerPackage)} ({sc.marginPercentage}%)
                                  </span>
                                </div>

                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 min-w-0">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Min. Target Terjual</span>
                                  <span className="text-base font-black text-emerald-400 block mt-0.5 truncate">
                                    {formatNumber(sc.minPackagesNeeded)} Paket
                                  </span>
                                  <span className="text-[10px] text-zinc-400 mt-0.5 block truncate">
                                    BEP Beban: {sc.bepPackagesNeeded} Paket
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 text-zinc-400">
                                <span>Total Omzet: <strong className="text-white">{formatRupiah(sc.totalOmzetKotor)}</strong></span>
                                <span className="font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                  Simulasi di Input →
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Script Closing Chat DM / Live Selling */}
                    {(aiResult.closingScript || aiResult.channelType === 'dm_sosmed') && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-[#14161F] to-[#14161F] border border-cyan-500/30 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 block">
                                {aiResult.channelType === 'dm_sosmed' ? 'Script Balas Chat DM & Fast Closing' : 'Script Closing & Call-To-Action'}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {aiResult.channelType === 'dm_sosmed' ? 'Tinggal salin dan kirim ke calon pembeli di DM Instagram / WhatsApp' : 'Gunakan saat host live mempromosikan bundling di keranjang'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const scriptText = aiResult.closingScript || 
                                `Halo Kak! Beli 1 pcs Rp 49.000, tapi khusus hari ini ada Promo Bundling 2 pcs cuma Rp 79.000 (Hemat Rp 19.000 + Subsidi Ongkir!). Mau saya keep warna apa Kak sebelum promonya habis hari ini?`;
                              navigator.clipboard.writeText(scriptText);
                              setCopiedScript(true);
                              setTimeout(() => setCopiedScript(false), 2500);
                              if (onNotify) onNotify('Script balas chat berhasil disalin ke clipboard!', 'success');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          >
                            {copiedScript ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Script</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/20 text-xs sm:text-sm text-cyan-100 font-mono whitespace-pre-line leading-relaxed">
                          {aiResult.closingScript ||
                            `Halo Kak! Beli 1 pcs Rp 49.000, tapi khusus hari ini ada Promo Bundling 2 pcs cuma Rp 79.000 (Hemat Rp 19.000 + Subsidi Ongkir!). Mau saya keep warna apa Kak sebelum promonya habis hari ini?`}
                        </div>

                        {aiResult.channelType === 'dm_sosmed' && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Tips Praktis: Balas calon pembeli dalam kurun waktu &lt; 5 menit saat minat beli masih hangat.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Follow-Ups */}
                    {aiResult.suggestedFollowUps && aiResult.suggestedFollowUps.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#14161F] border border-white/10 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                          Pertanyaan Lanjutan Terkait:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.suggestedFollowUps.map((fu, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setAiQuestion(fu);
                                handleAskAi(fu);
                              }}
                              className="text-xs px-3 py-1.5 rounded-xl bg-black/40 hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-colors text-left cursor-pointer"
                            >
                              "{fu}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick navigation to other subtabs */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <button
                        onClick={() => setAiSubTab('rincian')}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 py-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Buka Rincian Rumus Akuntansi Lengkap →</span>
                      </button>
                      <button
                        onClick={() => setAiSubTab('tips')}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 py-2"
                      >
                        <Award className="w-4 h-4" />
                        <span>Buka Tips Live Streaming & Closing →</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* AI SUB-TAB 3: RINCIAN RUMUS AKUNTANSI PERSIS DENGAN JAWABAN AI */}
            {aiSubTab === 'rincian' && (
              <div className="relative overflow-hidden p-6 rounded-2xl bg-[#14161F] border border-cyan-500/30 space-y-6 shadow-xl">
                <NeonCorners variant="opposite-tl-br" color="cyan" size="md" />

                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        Rincian Logika & Rumus Akuntansi Toko
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Perhitungan matematika persis yang disinkronkan dengan jawaban AI
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAiSubTab('jawaban')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors cursor-pointer"
                  >
                    ← Kembali ke Jawaban
                  </button>
                </div>

                {/* Skenario Selector Tab di dalam Rincian */}
                {aiResult?.scenarios && aiResult.scenarios.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                      Pilih Paket Bundling untuk Dilihat Rincian Rumusnya:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {aiResult.scenarios.map((sc) => {
                        const isSelected = activeRincianScenario?.id === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => setRincianSelectedScenarioId(sc.id)}
                            className={`text-xs px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                                : 'bg-black/40 text-zinc-400 hover:text-white border-white/5 hover:border-white/20'
                            }`}
                          >
                            <span>{sc.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">({formatRupiah(sc.recommendedPrice)})</span>
                            {sc.id === focusScenario?.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Step 1: Beban Harian Wajib Ditutup */}
                  <div className="relative overflow-hidden p-4 rounded-xl bg-black/40 border border-white/5 space-y-2.5">
                    <NeonCorners variant="opposite-tl-br" color="cyan" size="sm" />
                    <div className="flex items-center gap-2 font-bold text-cyan-400 uppercase tracking-wider text-xs">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs">1</span>
                      <MarqueeText text="Total Beban Harian Toko yang Wajib Ditutup (Fixed Burden)" className="font-bold text-cyan-400 uppercase tracking-wider text-xs" />
                    </div>
                    <p className="text-zinc-300 leading-relaxed pl-8 text-xs">
                      Total beban tetap harian adalah penjumlahan seluruh biaya operasional, pemasaran, tenaga kerja, dan target laba bersih toko.
                    </p>
                    <div className="ml-8 p-3 rounded-lg bg-black/60 font-mono text-xs text-zinc-300 space-y-1.5 border border-white/5">
                      <div className="flex justify-between">
                        <span>• Target Laba Bersih Toko:</span>
                        <span className="text-emerald-400 font-bold">{formatRupiah(rincianParams.profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Biaya Iklan Harian:</span>
                        <span className="text-amber-400 font-bold">{formatRupiah(rincianParams.ads)}</span>
                      </div>
                      {!rincianParams.isDm && (
                        <div className="flex justify-between">
                          <span>• Biaya Koin Promosi:</span>
                          <span className="text-amber-400 font-bold">{formatRupiah(rincianParams.coin)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>• Gaji Tenaga Kerja ({rincianParams.isDm ? 'Admin CS' : 'Host + Admin'}):</span>
                        <span className="text-cyan-400 font-bold">{formatRupiah(rincianParams.host + rincianParams.admin)}</span>
                      </div>
                      {rincianParams.opCost > 0 && (
                        <div className="flex justify-between">
                          <span>• Biaya Operasional Lainnya:</span>
                          <span className="text-zinc-300 font-bold">{formatRupiah(rincianParams.opCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1.5 text-sm">
                        <span>= Total Beban Wajib Ditutup Harian:</span>
                        <span className="text-[#25F4EE]">{formatRupiah(rincianParams.totalBurden)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Margin Bersih per Paket Terpilih */}
                  {activeRincianScenario && (
                    <div className="relative overflow-hidden p-4 rounded-xl bg-black/40 border border-white/5 space-y-2.5">
                      <NeonCorners variant="opposite-tr-bl" color="emerald" size="sm" />
                      <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase tracking-wider text-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs">2</span>
                        <MarqueeText
                          text={`Margin Bersih per Paket: ${activeRincianScenario.name} (${formatRupiah(activeRincianScenario.recommendedPrice)})`}
                          className="font-bold text-emerald-400 uppercase tracking-wider text-xs"
                        />
                      </div>
                      <p className="text-zinc-300 leading-relaxed pl-8 text-xs">
                        Margin bersih per paket adalah harga jual dikurangi modal HPP bahan ({activeRincianScenario.pcsPerPackage} pcs), potongan marketplace/layanan, biaya packing, cadangan retur, dan komisi.
                      </p>
                      <div className="ml-8 p-3 rounded-lg bg-black/60 font-mono text-xs text-zinc-300 space-y-1.5 border border-white/5">
                        <div className="flex justify-between">
                          <span>• Harga Jual Paket:</span>
                          <span className="text-white font-bold">{formatRupiah(activeRincianScenario.recommendedPrice)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>• Modal HPP ({activeRincianScenario.pcsPerPackage} pcs × {formatRupiah(rincianParams.hpp)}):</span>
                          <span>- {formatRupiah(activeRincianScenario.pcsPerPackage * rincianParams.hpp)}</span>
                        </div>
                        {rincianParams.adminPct > 0 && (
                          <div className="flex justify-between text-rose-400">
                            <span>• Admin Marketplace ({rincianParams.adminPct}%):</span>
                            <span>- {formatRupiah(Math.round(activeRincianScenario.recommendedPrice * (rincianParams.adminPct / 100)))}</span>
                          </div>
                        )}
                        {rincianParams.service > 0 && (
                          <div className="flex justify-between text-rose-400">
                            <span>• Biaya Layanan Transaksi:</span>
                            <span>- {formatRupiah(rincianParams.service)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-rose-400">
                          <span>• Biaya Packing ({rincianParams.packing > 0 ? formatRupiah(rincianParams.packing) : 'Standar Toko'}):</span>
                          <span>- {formatRupiah(rincianParams.packing)}</span>
                        </div>
                        {rincianParams.returPct > 0 && (
                          <div className="flex justify-between text-rose-400">
                            <span>• Cadangan Proteksi Retur ({rincianParams.returPct}%):</span>
                            <span>- {formatRupiah(Math.round(activeRincianScenario.recommendedPrice * (rincianParams.returPct / 100)))}</span>
                          </div>
                        )}
                        {(rincianParams.hostInc + rincianParams.adminInc) > 0 && (
                          <div className="flex justify-between text-rose-400">
                            <span>• Insentif Host & Admin:</span>
                            <span>- {formatRupiah(rincianParams.hostInc + rincianParams.adminInc)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1.5 text-sm">
                          <span>= Margin Bersih per Paket:</span>
                          <span className="text-emerald-400">
                            {formatRupiah(activeRincianScenario.marginPerPackage)} ({activeRincianScenario.marginPercentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Target Kuota Terjual & Titik Impas (BEP) */}
                  {activeRincianScenario && (
                    <div className="relative overflow-hidden p-4 rounded-xl bg-black/40 border border-white/5 space-y-2.5">
                      <NeonCorners variant="opposite-tl-br" color="cyan" size="sm" />
                      <div className="flex items-center gap-2 font-bold text-cyan-400 uppercase tracking-wider text-xs">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs">3</span>
                        <MarqueeText
                          text={`Target Kuota & Titik Impas (BEP) untuk ${activeRincianScenario.name}`}
                          className="font-bold text-cyan-400 uppercase tracking-wider text-xs"
                        />
                      </div>
                      <p className="text-zinc-300 leading-relaxed pl-8 text-xs">
                        Jumlah paket yang wajib laku dihitung dengan membagi total beban dengan margin bersih per paket.
                      </p>
                      <div className="ml-8 p-3 rounded-lg bg-black/60 font-mono text-xs text-zinc-300 space-y-2 border border-white/5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <div>
                            <span className="font-bold text-emerald-400 block">Target Minimum Terjual:</span>
                            <span className="text-[10px] text-zinc-400">
                              {formatRupiah(rincianParams.totalBurden)} ÷ {formatRupiah(activeRincianScenario.marginPerPackage)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-emerald-400 block">
                              {formatNumber(activeRincianScenario.minPackagesNeeded)} Paket
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              (Setara {activeRincianScenario.totalPcsNeeded} Pcs baju)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <div>
                            <span className="font-bold text-rose-400 block">Titik Impas (BEP Beban Toko):</span>
                            <span className="text-[10px] text-zinc-400">
                              Beban Operasional & Iklan lunas (tanpa laba)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-rose-400 block">
                              {activeRincianScenario.bepPackagesNeeded} Paket
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              (Batas aman tidak merugi)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <div>
                            <span className="font-bold text-cyan-300 block">Total Omzet Kotor Tercipta:</span>
                            <span className="text-[10px] text-zinc-400">
                              {activeRincianScenario.minPackagesNeeded} Paket × {formatRupiah(activeRincianScenario.recommendedPrice)}
                            </span>
                          </div>
                          <div className="text-right font-black text-white text-base">
                            {formatRupiah(activeRincianScenario.totalOmzetKotor)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI SUB-TAB 4: TIPS LIVE STREAMING & CLOSING */}
            {aiSubTab === 'tips' && (
              <div className="p-6 rounded-2xl bg-[#14161F] border border-white/10 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        Tips Strategis Live Streaming & Host
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Panduan praktis tim penjualan untuk mencapai kuota bundling harian
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAiSubTab('jawaban')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
                  >
                    ← Kembali ke Jawaban
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(aiResult?.strategicAdvice || [
                    'Fokuskan host mempromosikan Bundling 2 & 3 pcs sebagai menu utama etalase untuk menghemat biaya packing dan layanan.',
                    'Alokasikan koin diskon pada menit ke-20 sampai ke-45 saat traffic penonton sedang berada di puncaknya.',
                    'Berikan insentif Rp 2.000 per paket untuk host live agar termotivasi melakukan upselling dari 1 pcs menjadi 2-3 pcs.',
                    'Begitu penjualan mencapai titik impas (BEP), prioritaskan paket margin tertinggi untuk mendongkrak laba bersih.'
                  ]).map((tip, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                        <Lightbulb className="w-4 h-4" />
                        <span>Strategi #{idx + 1}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======================== MODE INTERACTIVE INPUT ========================= */}
        {/* ========================================================================= */}
        {mainMode === 'input' && (
          <div className="space-y-4">
            {/* SUB-MENU CARDS: Rapi, Terstruktur, Format Kartu Sub Menu dengan Lengkung Neon Bersebrangan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Sub-menu 1: Input Parameter */}
              <div
                id="menu-card-input-form"
                onClick={() => setInputSubTab('form')}
                className={`relative overflow-hidden group p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-3 border cursor-pointer ${
                  inputSubTab === 'form'
                    ? 'bg-[#181C28] border-[#25F4EE] shadow-lg ring-1 ring-[#25F4EE]/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tl-br" color={inputSubTab === 'form' ? 'cyan' : 'dual'} size="sm" />
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      inputSubTab === 'form'
                        ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText
                      text="Menu Input Parameter"
                      className={`text-xs sm:text-sm font-black transition-colors ${
                        inputSubTab === 'form' ? 'text-[#25F4EE]' : 'text-white group-hover:text-[#25F4EE]'
                      }`}
                    />
                    <MarqueeText
                      text="Atur modal, biaya & target laba"
                      className="text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Langkah 1</span>
                  <span className={`font-bold ${inputSubTab === 'form' ? 'text-[#25F4EE]' : 'text-zinc-500'}`}>
                    {inputSubTab === 'form' ? 'Sedang Dibuka' : 'Buka Menu'}
                  </span>
                </div>
              </div>

              {/* Sub-menu 2: Hasil & Rekomendasi */}
              <div
                id="menu-card-input-hasil"
                onClick={() => setInputSubTab('hasil')}
                className={`relative overflow-hidden group p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-3 border cursor-pointer ${
                  inputSubTab === 'hasil'
                    ? 'bg-[#181C28] border-[#25F4EE] shadow-lg ring-1 ring-[#25F4EE]/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tr-bl" color={inputSubTab === 'hasil' ? 'cyan' : 'dual'} size="sm" />
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      inputSubTab === 'hasil'
                        ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MarqueeText
                        text="Saran & Rekomendasi"
                        className={`text-xs sm:text-sm font-black transition-colors ${
                          inputSubTab === 'hasil' ? 'text-[#25F4EE]' : 'text-white group-hover:text-[#25F4EE]'
                        }`}
                      />
                      <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-pulse shrink-0" />
                    </div>
                    <MarqueeText
                      text="Target kuota & harga bundling"
                      className="text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Langkah 2</span>
                  <span className={`font-bold ${inputSubTab === 'hasil' ? 'text-[#25F4EE]' : 'text-zinc-500'}`}>
                    {inputSubTab === 'hasil' ? 'Sedang Dibuka' : 'Buka Menu'}
                  </span>
                </div>
              </div>

              {/* Sub-menu 3: Rincian Simulasi Keuangan */}
              <div
                id="menu-card-input-rincian"
                onClick={() => setInputSubTab('rincian')}
                className={`relative overflow-hidden group p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-3 border cursor-pointer ${
                  inputSubTab === 'rincian'
                    ? 'bg-[#181C28] border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                    : 'bg-[#14161F] hover:bg-[#181a24] border-white/10 hover:border-white/20'
                }`}
              >
                <NeonCorners variant="opposite-tl-br" color={inputSubTab === 'rincian' ? 'emerald' : 'dual'} size="sm" />
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      inputSubTab === 'rincian'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-black/40 text-zinc-400 border border-white/5'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText
                      text="Rincian Simulasi Keuangan"
                      className={`text-xs sm:text-sm font-black transition-colors ${
                        inputSubTab === 'rincian' ? 'text-emerald-300' : 'text-white group-hover:text-emerald-300'
                      }`}
                    />
                    <MarqueeText
                      text="Buku kas harian & margin bersih"
                      className="text-[11px] text-zinc-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-zinc-400">
                  <span>Rincian</span>
                  <span className={`font-bold ${inputSubTab === 'rincian' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {inputSubTab === 'rincian' ? 'Sedang Dibuka' : 'Buka Menu'}
                  </span>
                </div>
              </div>
            </div>

            {/* INPUT SUB-TAB 1: FORM PARAMETER INPUT */}
            {inputSubTab === 'form' && (
              <div className="space-y-5">
                <div className="p-5 sm:p-6 rounded-2xl bg-[#14161F] border border-white/10 shadow-xl space-y-6">
                  
                  {/* Header & Quick Action */}
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#25F4EE]" />
                        Konfigurasi Parameter Finansial
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Sesuaikan target laba, beban iklan, gaji host/admin, dan biaya per paket
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoadEmployeeDefaults}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
                      <span>Ambil Gaji dari Karyawan Toko</span>
                    </button>
                  </div>

                  {/* 1. Target Laba: Nominal vs Persentase */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        Target Keuntungan Harian
                      </label>
                      <div className="flex items-center p-0.5 bg-black/60 rounded-lg border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => setTargetProfitType('nominal')}
                          className={`px-3 py-1 rounded-md font-bold transition-colors ${
                            targetProfitType === 'nominal'
                              ? 'bg-emerald-500 text-black'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Nominal (Rp)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetProfitType('percentage')}
                          className={`px-3 py-1 rounded-md font-bold transition-colors ${
                            targetProfitType === 'percentage'
                              ? 'bg-emerald-500 text-black'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Persentase (%)
                        </button>
                      </div>
                    </div>

                    {targetProfitType === 'nominal' ? (
                      <div>
                        <CommaNumberInput
                          id="input-target-profit-nominal"
                          value={targetProfit}
                          onChange={(val) => setTargetProfit(val)}
                          placeholder="1.000.000"
                          className="w-full p-3.5 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[11px] text-zinc-500 mt-1 block">
                          Target laba bersih riil yang ingin dicapai toko per hari (bersih setelah semua potongan).
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="80"
                            value={targetProfitPercent}
                            onChange={(e) => setTargetProfitPercent(Number(e.target.value))}
                            className="w-32 p-3.5 rounded-xl bg-black/50 border border-white/15 text-white font-black text-base text-center focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-sm font-bold text-white">% dari Total Omzet Penjualan</span>
                        </div>
                        <div className="flex gap-2">
                          {[15, 20, 25, 30, 35].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setTargetProfitPercent(pct)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                targetProfitPercent === pct
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Beban Pemasaran (Iklan & Koin) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                        Biaya Iklan Harian (Rp)
                      </label>
                      <CommaNumberInput
                        id="input-ads-cost"
                        value={adsCost}
                        onChange={(val) => setAdsCost(val)}
                        placeholder="60.000"
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        Biaya Koin / Voucher Diskon (Rp)
                      </label>
                      <CommaNumberInput
                        id="input-coin-cost"
                        value={coinCost}
                        onChange={(val) => setCoinCost(val)}
                        placeholder="30.000"
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* 3. Beban Tenaga Kerja Sesi Live (Standar: 1 Host + 1 Admin Bertugas) */}
                  <div className="p-4 rounded-xl bg-black/40 border border-[#25F4EE]/30 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-white block">
                            Beban Tenaga Kerja Live Streaming (1 Host + 1 Admin)
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            Kalkulasi otomatis mengasumsikan 1 Host Live dan 1 Admin Toko bertugas sesuai aturan baku toko.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Aturan Baku Toko
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLoadEmployeeDefaults(true)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Sinkronkan kembali dengan data karyawan toko"
                        >
                          <RefreshCw className="w-3 h-3 text-[#25F4EE]" />
                          <span>Sinkron Aturan Toko</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Host Live Card */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-black/60 border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#25F4EE]" />
                            Host Live Streaming (1 Orang)
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">Shift Live</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 font-semibold block">Gaji Pokok / Sesi</label>
                            <CommaNumberInput
                              value={hostSalary}
                              onChange={(val) => setHostSalary(val)}
                              className="w-full p-2 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-bold focus:border-[#25F4EE]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 font-semibold block">Insentif / Paket</label>
                            <CommaNumberInput
                              value={hostIncentivePerPackage}
                              onChange={(val) => setHostIncentivePerPackage(val)}
                              className="w-full p-2 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-bold focus:border-[#25F4EE]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Admin Toko Card */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-black/60 border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Admin Toko / Kasir (1 Orang)
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">Shift Live</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 font-semibold block">Gaji Pokok / Sesi</label>
                            <CommaNumberInput
                              value={adminSalary}
                              onChange={(val) => setAdminSalary(val)}
                              className="w-full p-2 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-bold focus:border-emerald-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 font-semibold block">Insentif / Paket</label>
                            <CommaNumberInput
                              value={adminIncentivePerPackage}
                              onChange={(val) => setAdminIncentivePerPackage(val)}
                              className="w-full p-2 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-bold focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 text-zinc-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex-wrap gap-2">
                      <span>Total Gaji Pokok Sesi: <strong className="text-white font-bold">{formatRupiah(hostSalary + adminSalary)}</strong></span>
                      <span>Total Beban Insentif: <strong className="text-[#25F4EE] font-bold">{formatRupiah(hostIncentivePerPackage + adminIncentivePerPackage)}/paket</strong></span>
                    </div>
                  </div>

                  {/* 4. Produk & Isi Pcs per Paket (Bebas Input) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    {/* Input Bebas Isi Pcs */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#25F4EE]" />
                        Isi Produk per Paket Bundling (Pcs)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPcsPerPackage(Math.max(1, pcsPerPackage - 1))}
                          className="w-10 h-10 rounded-xl bg-black/60 border border-white/15 text-white font-black text-base hover:bg-white/10 active:scale-95"
                        >
                          -
                        </button>
                        <input
                          id="input-pcs-per-package"
                          type="number"
                          min="1"
                          max="100"
                          value={pcsPerPackage}
                          onChange={(e) => setPcsPerPackage(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 p-2.5 rounded-xl bg-black/50 border border-white/15 text-white font-black text-base text-center focus:outline-none focus:border-[#25F4EE]"
                        />
                        <button
                          type="button"
                          onClick={() => setPcsPerPackage(pcsPerPackage + 1)}
                          className="w-10 h-10 rounded-xl bg-black/60 border border-white/15 text-white font-black text-base hover:bg-white/10 active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Chips Preset */}
                      <div className="flex gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5, 10].map((presetPcs) => (
                          <button
                            key={presetPcs}
                            type="button"
                            onClick={() => setPcsPerPackage(presetPcs)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              pcsPerPackage === presetPcs
                                ? 'bg-[#25F4EE]/20 text-[#25F4EE] border-[#25F4EE]/40'
                                : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                            }`}
                          >
                            {presetPcs} pcs
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modal HPP */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-300">
                          Modal HPP per Pcs (Rp)
                        </label>
                        {autoAverageHpp !== customHpp && (
                          <button
                            type="button"
                            onClick={() => setCustomHpp(autoAverageHpp)}
                            className="text-[10px] text-[#25F4EE] hover:underline"
                          >
                            Reset ke Rata-rata ({formatRupiah(autoAverageHpp)})
                          </button>
                        )}
                      </div>
                      <CommaNumberInput
                        id="input-hpp-per-pcs"
                        value={customHpp}
                        onChange={(val) => setCustomHpp(val)}
                        placeholder="20.000"
                        className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-[#25F4EE]"
                      />
                      <span className="text-[11px] text-zinc-500 block">
                        Total modal barang untuk {pcsPerPackage} pcs = <strong>{formatRupiah(pcsPerPackage * customHpp)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 5. Parameter Marketplace (Admin, Layanan, Packing, Retur) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400">Admin Promo (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={adminPercentage}
                        onChange={(e) => setAdminPercentage(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400">Biaya Layanan (Rp)</label>
                      <CommaNumberInput
                        value={serviceFeePerOrder}
                        onChange={(val) => setServiceFeePerOrder(val)}
                        className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400">Biaya Packing (Rp)</label>
                      <CommaNumberInput
                        value={packingCost}
                        onChange={(val) => setPackingCost(val)}
                        className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400">Cadangan Retur (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={returnPercentage}
                        onChange={(e) => setReturnPercentage(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* 6. Pilihan Arah Perhitungan: Tentukan Harga vs Tentukan Target Paket */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                      Metode Simulasi:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCalcDirection('price_to_packages')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          calcDirection === 'price_to_packages'
                            ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white'
                            : 'bg-black/20 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">Opsi A: Tentukan Harga Bundling</span>
                        <span className="text-[11px] text-zinc-500 mt-0.5 block">
                          Sistem akan menghitung berapa paket yang wajib laku terjual.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalcDirection('packages_to_price')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          calcDirection === 'packages_to_price'
                            ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white'
                            : 'bg-black/20 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">Opsi B: Tentukan Target Paket</span>
                        <span className="text-[11px] text-zinc-500 mt-0.5 block">
                          Sistem akan menghitung rekomendasi harga jual per paket.
                        </span>
                      </button>
                    </div>

                    {calcDirection === 'price_to_packages' ? (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold text-zinc-300">
                          Masukkan Rencana Harga Jual Bundling (Rp):
                        </label>
                        <CommaNumberInput
                          id="input-bundle-price-plan"
                          value={bundlePriceInput}
                          onChange={(val) => setBundlePriceInput(val)}
                          placeholder="75.000"
                          className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white font-black text-base focus:outline-none focus:border-[#25F4EE]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold text-zinc-300">
                          Masukkan Target Jumlah Paket Terjual per Hari:
                        </label>
                        <input
                          id="input-target-packages-plan"
                          type="number"
                          min="1"
                          max="10000"
                          value={targetPackagesInput}
                          onChange={(e) => setTargetPackagesInput(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white font-black text-base focus:outline-none focus:border-[#25F4EE]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button to View Results */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setInputSubTab('hasil')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#25F4EE] to-teal-400 hover:from-[#20ded8] hover:to-teal-300 text-black font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#25F4EE]/20 flex items-center justify-center gap-2 active:scale-98"
                    >
                      <span>Lihat Hasil Kalkulasi & Skenario</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* INPUT SUB-TAB 2: HASIL KALKULASI */}
            {inputSubTab === 'hasil' && (
              <div className="space-y-5">
                {/* Hero Results Cards */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121926] via-[#14161F] to-[#14161F] border border-[#25F4EE]/30 shadow-xl space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                          Hasil Simulasi Bundling ({pcsPerPackage} Pcs / Paket)
                        </h3>
                        <span className="text-xs text-zinc-400">
                          Target Laba: {targetProfitType === 'nominal' ? formatRupiah(targetProfit) : `${targetProfitPercent}% Omzet`} + Iklan {formatRupiah(adsCost)} + Koin {formatRupiah(coinCost)} + Gaji Host & Admin {formatRupiah(hostSalary + adminSalary)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInputSubTab('form')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
                      >
                        ← Ubah Input
                      </button>
                      <button
                        onClick={() => setInputSubTab('rincian')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
                      >
                        Buku Kas Simulasi <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Main KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Min Paket Terjual */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                        Minimum Paket Wajib Terjual
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-[#25F4EE]">
                          {formatNumber(calculationResult.minimumPackagesNeeded)}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">Paket/hari</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block">
                        Setara {formatNumber(calculationResult.totalPcsNeeded)} pcs pakaian
                      </span>
                    </div>

                    {/* KPI 2: Harga Jual Bundling */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                        Harga Jual per Paket
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          {formatRupiah(calculationResult.bundlePrice)}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block">
                        Isi {pcsPerPackage} pcs (@{formatRupiah(Math.round(calculationResult.bundlePrice / pcsPerPackage))})
                      </span>
                    </div>

                    {/* KPI 3: Margin Bersih per Paket */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                        Margin Bersih per Paket
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                          {formatRupiah(calculationResult.netMarginPerPackage)}
                        </span>
                        <span className="text-xs font-bold text-emerald-300">
                          ({calculationResult.marginPercentage}%)
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block">
                        Setelah modal, admin, packing, retur & insentif
                      </span>
                    </div>

                    {/* KPI 4: Titik Impas (BEP) */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                        Titik Impas (BEP Operasional)
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-amber-400">
                          {formatNumber(calculationResult.bepPackagesNeeded)}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">Paket</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block">
                        Menutup iklan, koin & gaji flat harian
                      </span>
                    </div>
                  </div>

                  {/* Summary Callout Banner */}
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-white block">
                        Target Omzet Kotor Penjualan: <strong className="text-[#25F4EE]">{formatRupiah(calculationResult.totalOmzetKotor)}</strong>
                      </span>
                      <span className="text-zinc-400 mt-0.5 block">
                        Estimasi Laba Bersih yang Terealisasi: <strong className="text-emerald-400">{formatRupiah(calculationResult.financialsAtTarget.netProfit)}</strong> ({calculationResult.financialsAtTarget.profitPercentage}% dari Omzet)
                      </span>
                    </div>

                    <button
                      onClick={() => setInputSubTab('rincian')}
                      className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <span>Lihat Rincian Pengeluaran</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Comparison with Other Bundling Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Perbandingan dengan Skenario Ukuran Paket Lain:
                    </h4>
                    <span className="text-xs text-zinc-500">Berdasarkan beban harian Anda yang sama</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {standardScenarios.map((sc) => (
                      <div
                        key={sc.id}
                        onClick={() => {
                          setPcsPerPackage(sc.pcsPerPackage);
                          setBundlePriceInput(sc.recommendedPrice);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          pcsPerPackage === sc.pcsPerPackage
                            ? 'bg-[#25F4EE]/10 border-[#25F4EE]'
                            : 'bg-[#14161F] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-300">
                            {sc.pcsPerPackage} Pcs
                          </span>
                          <span className="text-xs font-bold text-[#25F4EE]">
                            {formatRupiah(sc.recommendedPrice)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white block truncate">{sc.name}</span>
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                          <span>Target Min:</span>
                          <span className="font-bold text-emerald-400">{formatNumber(sc.minPackagesNeeded)} Paket</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INPUT SUB-TAB 3: RINCIAN SIMULASI KEUANGAN */}
            {inputSubTab === 'rincian' && (
              <div className="p-6 rounded-2xl bg-[#14161F] border border-white/10 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        Buku Kas Simulasi Harian (Income Statement)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Proyeksi buku kas harian saat target penjualan {formatNumber(calculationResult.minimumPackagesNeeded)} paket tercapai
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInputSubTab('hasil')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
                    >
                      ← Kembali ke Hasil
                    </button>
                    <button
                      onClick={() => {
                        setMainMode('ai');
                        setAiSubTab('input');
                        setAiQuestion(
                          `Saya ingin target laba ${targetProfitType === 'nominal' ? formatRupiah(targetProfit) : `${targetProfitPercent}%`} dengan iklan ${formatRupiah(adsCost)}, koin ${formatRupiah(coinCost)}, gaji host ${formatRupiah(hostSalary)}, dan admin ${formatRupiah(adminSalary)}. Bagaimana strategi live streaming untuk menjual ${calculationResult.minimumPackagesNeeded} paket bundling ${pcsPerPackage} pcs seharga ${formatRupiah(calculationResult.bundlePrice)}?`
                        );
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Konsultasikan ke AI</span>
                    </button>
                  </div>
                </div>

                {/* Ledger Breakdown Table */}
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-zinc-500 uppercase font-black tracking-wider">
                          <th className="py-2.5 px-3">Komponen Keuangan</th>
                          <th className="py-2.5 px-3 text-right">Per 1 Paket Bundling</th>
                          <th className="py-2.5 px-3 text-right">Total Harian ({calculationResult.minimumPackagesNeeded} Paket)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300 font-mono">
                        {/* Omzet */}
                        <tr className="bg-white/5 font-bold text-white">
                          <td className="py-3 px-3">(+) Omzet Penjualan Kotor</td>
                          <td className="py-3 px-3 text-right text-[#25F4EE]">{formatRupiah(calculationResult.bundlePrice)}</td>
                          <td className="py-3 px-3 text-right text-[#25F4EE]">{formatRupiah(calculationResult.financialsAtTarget.grossOmzet)}</td>
                        </tr>

                        {/* HPP Modal */}
                        <tr>
                          <td className="py-2.5 px-3">(-) Modal HPP Barang ({pcsPerPackage} pcs @{formatRupiah(customHpp)})</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.totalHppPerPackage)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalHpp)}</td>
                        </tr>

                        {/* Potongan Marketplace */}
                        <tr>
                          <td className="py-2.5 px-3">(-) Potongan Admin Marketplace ({adminPercentage}%)</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.adminFeePerPackage)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalAdminFee)}</td>
                        </tr>

                        <tr>
                          <td className="py-2.5 px-3">(-) Biaya Layanan Pesanan</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(serviceFeePerOrder)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalServiceFee)}</td>
                        </tr>

                        <tr>
                          <td className="py-2.5 px-3">(-) Biaya Lakban & Plastik Packing</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(packingCost)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalPackingCost)}</td>
                        </tr>

                        <tr>
                          <td className="py-2.5 px-3">(-) Cadangan Risiko Retur ({returnPercentage}%)</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.returnReservePerPackage)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalReturnReserve)}</td>
                        </tr>

                        {/* Tenaga Kerja: Gaji & Insentif */}
                        <tr className="bg-cyan-950/20">
                          <td className="py-2.5 px-3 text-cyan-300">(-) Gaji Pokok Host Live (Harian)</td>
                          <td className="py-2.5 px-3 text-right text-zinc-500">-</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalHostSalary)}</td>
                        </tr>

                        <tr className="bg-cyan-950/20">
                          <td className="py-2.5 px-3 text-cyan-300">(-) Insentif Host Live ({formatRupiah(calculationResult.hostIncentivePerPackage)} / paket)</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.hostIncentivePerPackage)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalHostIncentive)}</td>
                        </tr>

                        <tr className="bg-cyan-950/20">
                          <td className="py-2.5 px-3 text-cyan-300">(-) Gaji Pokok Admin Toko (Harian)</td>
                          <td className="py-2.5 px-3 text-right text-zinc-500">-</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalAdminSalary)}</td>
                        </tr>

                        <tr className="bg-cyan-950/20">
                          <td className="py-2.5 px-3 text-cyan-300">(-) Insentif Admin Toko ({formatRupiah(calculationResult.adminIncentivePerPackage)} / paket)</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.adminIncentivePerPackage)}</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(calculationResult.financialsAtTarget.totalAdminIncentive)}</td>
                        </tr>

                        {/* Iklan & Koin */}
                        <tr className="bg-amber-950/20">
                          <td className="py-2.5 px-3 text-amber-300">(-) Biaya Iklan Harian</td>
                          <td className="py-2.5 px-3 text-right text-zinc-500">-</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(adsCost)}</td>
                        </tr>

                        <tr className="bg-amber-950/20">
                          <td className="py-2.5 px-3 text-amber-300">(-) Biaya Koin & Voucher Diskon Harian</td>
                          <td className="py-2.5 px-3 text-right text-zinc-500">-</td>
                          <td className="py-2.5 px-3 text-right text-red-400">-{formatRupiah(coinCost)}</td>
                        </tr>

                        {/* Net Profit */}
                        <tr className="bg-emerald-950/40 font-black text-sm text-white border-t-2 border-emerald-500/50">
                          <td className="py-3.5 px-3 text-emerald-300">(=) Laba Bersih Riil Tercapai</td>
                          <td className="py-3.5 px-3 text-right text-emerald-400">
                            {formatRupiah(calculationResult.netMarginPerPackage)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-emerald-400">
                            {formatRupiah(calculationResult.financialsAtTarget.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      Status Target: <strong className="text-emerald-400">{calculationResult.financialsAtTarget.achievedTargetProfit ? '✓ Target Laba Tercapai' : 'Belum Mencapai Target'}</strong>
                    </span>
                    <span>
                      Margin Profit Bersih Riil: <strong className="text-white">{calculationResult.financialsAtTarget.profitPercentage}%</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
