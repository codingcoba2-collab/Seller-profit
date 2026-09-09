// Multi-channel AI Pricing Consultant & Bundle Calculation Engine
import type { GoogleGenAI } from '@google/genai';

export interface CalculateBundleRequest {
  userQuery?: string;
  channel?: 'dm_instagram' | 'dm_sosmed' | 'live_streaming' | 'marketplace_reguler' | 'offline_toko' | 'auto';
  storeContext?: {
    storeName?: string;
    hppAverage?: number;
    adminPromoPercentage?: number;
    serviceFeePerOrder?: number;
    averagePackingCost?: number;
    estimateReturnPercentage?: number;
  };
  parameters?: {
    targetProfitType?: 'nominal' | 'percentage';
    targetProfit?: number;
    targetProfitPercent?: number;
    adsCost?: number;
    coinCost?: number;
    hostSalary?: number;
    hostIncentivePerPackage?: number;
    adminSalary?: number;
    adminIncentivePerPackage?: number;
    adminPercentage?: number;
    serviceFeePerOrder?: number;
    packingCost?: number;
    returnPercentage?: number;
    hppPerPcs?: number;
  };
  chatHistory?: Array<{ sender: 'user' | 'ai'; text: string }>;
}

export function extractIndoValue(rawText: string, regexList: RegExp[]): number | null {
  for (const re of regexList) {
    const match = rawText.match(re);
    if (match) {
      let numStr = match[1].trim();
      const unit = (match[2] || '').trim().toLowerCase();

      if (/\d+\.\d{3}/.test(numStr)) {
        numStr = numStr.replace(/\./g, '');
      } else {
        numStr = numStr.replace(',', '.');
      }

      const parsedNum = parseFloat(numStr);
      if (!isNaN(parsedNum)) {
        if (unit === 'k' || unit === 'rb' || unit === 'ribu') return Math.round(parsedNum * 1000);
        if (unit === 'jt' || unit === 'juta') return Math.round(parsedNum * 1000000);
        if (parsedNum <= 50 && (unit === 'jt' || unit === 'juta' || rawText.includes('jt') || rawText.includes('juta'))) {
          return Math.round(parsedNum * 1000000);
        }
        if (parsedNum < 1000 && (rawText.includes('ribu') || rawText.includes('rb') || rawText.includes('k'))) {
          return Math.round(parsedNum * 1000);
        }
        return Math.round(parsedNum);
      }
    }
  }
  return null;
}

export async function processAiCalculateBundle(
  body: CalculateBundleRequest,
  generateJsonFn: (prompt: string, systemInstruction?: string, temp?: number) => Promise<any>
) {
  const { userQuery, channel, storeContext, parameters, chatHistory } = body || {};
  const cleanedUserQuery = typeof userQuery === 'string' ? userQuery.trim() : '';
  const lowerQ = cleanedUserQuery.toLowerCase();

  // 1. Channel Detection
  let detectedChannel: 'dm_sosmed' | 'live_streaming' | 'marketplace_reguler' | 'offline_toko' | 'general' = 'live_streaming';

  if (channel === 'dm_instagram' || channel === 'dm_sosmed') {
    detectedChannel = 'dm_sosmed';
  } else if (channel === 'live_streaming') {
    detectedChannel = 'live_streaming';
  } else if (channel === 'marketplace_reguler') {
    detectedChannel = 'marketplace_reguler';
  } else if (channel === 'offline_toko') {
    detectedChannel = 'offline_toko';
  } else {
    if (
      lowerQ.includes('dm') ||
      lowerQ.includes('instagram') ||
      lowerQ.includes('ig') ||
      lowerQ.includes('wa') ||
      lowerQ.includes('whatsapp') ||
      lowerQ.includes('chat') ||
      lowerQ.includes('sosmed') ||
      lowerQ.includes('pesan langsung') ||
      lowerQ.includes('non live') ||
      lowerQ.includes('tanpa live') ||
      lowerQ.includes('transfer')
    ) {
      detectedChannel = 'dm_sosmed';
    } else if (lowerQ.includes('katalog') || lowerQ.includes('reguler') || lowerQ.includes('etalase')) {
      detectedChannel = 'marketplace_reguler';
    } else if (lowerQ.includes('offline') || lowerQ.includes('toko fisik') || lowerQ.includes('bazar') || lowerQ.includes('butik')) {
      detectedChannel = 'offline_toko';
    } else if (lowerQ.includes('live') || lowerQ.includes('host') || lowerQ.includes('sawer') || lowerQ.includes('koin')) {
      detectedChannel = 'live_streaming';
    } else {
      detectedChannel = 'general';
    }
  }

  const channelLabels: Record<string, string> = {
    dm_sosmed: 'DM Instagram / WhatsApp / Sosmed (Direct Order)',
    live_streaming: 'Shopee & TikTok Live Streaming',
    marketplace_reguler: 'Marketplace Reguler / Katalog',
    offline_toko: 'Toko Offline / Thrift Shop Fisik',
    general: 'Strategi Penjualan & Penetapan Harga Multichannel'
  };

  // 2. Base Parameter Defaults according to Channel
  let targetProfitType: 'nominal' | 'percentage' = parameters?.targetProfitType === 'percentage' ? 'percentage' : 'nominal';
  let targetProfit = Math.max(0, Number(parameters?.targetProfit ?? (detectedChannel === 'dm_sosmed' ? 500000 : 1000000)) || 500000);
  let targetProfitPercent = Math.max(1, Math.min(90, Number(parameters?.targetProfitPercent ?? 25) || 25));

  let adsCost = 0;
  let coinCost = 0;
  let hostSalary = 0;
  let hostIncentivePerPackage = 0;
  let adminSalary = 0;
  let adminIncentivePerPackage = 0;
  let adminPercentage = 0;
  let serviceFeePerOrder = 0;
  let returnPercentage = 1.0;
  let packingCost = 1500;
  let hppPerPcs = Math.max(1000, Number(parameters?.hppPerPcs ?? (storeContext?.hppAverage || 25000)) || 25000);

  if (detectedChannel === 'dm_sosmed') {
    // DM: no host live, no marketplace admin fees (transfer bank/QRIS), no coins
    adsCost = parameters?.adsCost !== undefined ? Number(parameters.adsCost) : 0;
    coinCost = 0;
    hostSalary = 0;
    hostIncentivePerPackage = 0;
    adminSalary = parameters?.adminSalary !== undefined ? Number(parameters.adminSalary) : 0;
    adminIncentivePerPackage = parameters?.adminIncentivePerPackage !== undefined ? Number(parameters.adminIncentivePerPackage) : 0;
    adminPercentage = 0;
    serviceFeePerOrder = 0;
    returnPercentage = 1.0;
    packingCost = 1500;
  } else if (detectedChannel === 'live_streaming') {
    adsCost = parameters?.adsCost !== undefined ? Number(parameters.adsCost) : 60000;
    coinCost = parameters?.coinCost !== undefined ? Number(parameters.coinCost) : 30000;
    hostSalary = parameters?.hostSalary !== undefined ? Number(parameters.hostSalary) : 100000;
    hostIncentivePerPackage = parameters?.hostIncentivePerPackage !== undefined ? Number(parameters.hostIncentivePerPackage) : 2000;
    adminSalary = parameters?.adminSalary !== undefined ? Number(parameters.adminSalary) : 80000;
    adminIncentivePerPackage = parameters?.adminIncentivePerPackage !== undefined ? Number(parameters.adminIncentivePerPackage) : 1000;
    adminPercentage = parameters?.adminPercentage !== undefined ? Number(parameters.adminPercentage) : (storeContext?.adminPromoPercentage || 8.5);
    serviceFeePerOrder = parameters?.serviceFeePerOrder !== undefined ? Number(parameters.serviceFeePerOrder) : 1250;
    returnPercentage = 3.0;
    packingCost = 1500;
  } else if (detectedChannel === 'marketplace_reguler') {
    adsCost = parameters?.adsCost !== undefined ? Number(parameters.adsCost) : 30000;
    coinCost = 0;
    hostSalary = 0;
    adminSalary = parameters?.adminSalary !== undefined ? Number(parameters.adminSalary) : 40000;
    adminPercentage = parameters?.adminPercentage !== undefined ? Number(parameters.adminPercentage) : 8.5;
    serviceFeePerOrder = 1250;
    returnPercentage = 2.5;
    packingCost = 1500;
  } else if (detectedChannel === 'offline_toko') {
    adsCost = 0;
    coinCost = 0;
    hostSalary = 0;
    adminSalary = parameters?.adminSalary !== undefined ? Number(parameters.adminSalary) : 70000;
    adminPercentage = 0;
    serviceFeePerOrder = 0;
    returnPercentage = 0.5;
    packingCost = 500;
  } else {
    adsCost = parameters?.adsCost !== undefined ? Number(parameters.adsCost) : 40000;
    coinCost = parameters?.coinCost !== undefined ? Number(parameters.coinCost) : 15000;
    hostSalary = parameters?.hostSalary !== undefined ? Number(parameters.hostSalary) : 80000;
    adminSalary = parameters?.adminSalary !== undefined ? Number(parameters.adminSalary) : 60000;
    adminPercentage = 6.0;
    serviceFeePerOrder = 1000;
    returnPercentage = 2.0;
  }

  // 3. Extract parameters directly from question
  if (cleanedUserQuery.length > 0) {
    const extractedHpp = extractIndoValue(lowerQ, [
      /(?:modal|hpp|beli|pokok|kulak|kulakan)\s*(?:sebesar|seharga|sebanyak|rp|saya)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
      /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\s*(?:modal|hpp|per pcs)/i,
    ]);
    if (extractedHpp !== null && extractedHpp >= 1000) hppPerPcs = extractedHpp;

    const extractedProfit = extractIndoValue(lowerQ, [
      /(?:untung|laba|profit|target laba|keuntungan|margin)\s*(?:sebesar|seharga|sebanyak|rp|saya)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
      /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\s*(?:untung|laba|profit|target)/i,
    ]);
    if (extractedProfit !== null && extractedProfit > 0) {
      targetProfit = extractedProfit;
      targetProfitType = 'nominal';
    }

    const extractedAds = extractIndoValue(lowerQ, [
      /(?:iklan|ads|biaya iklan|budget iklan|bakar iklan)\s*(?:sebesar|seharga|sebanyak|rp|saya)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
      /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\s*(?:buat|untuk)\s*iklan/i,
    ]);
    if (extractedAds !== null) adsCost = extractedAds;
    if (lowerQ.includes('tanpa iklan') || lowerQ.includes('ga pake iklan') || lowerQ.includes('gak pake iklan') || lowerQ.includes('0 iklan')) {
      adsCost = 0;
    }

    const extractedCoin = extractIndoValue(lowerQ, [
      /(?:koin|voucher|diskon koin)\s*(?:sebesar|seharga|sebanyak|rp|saya)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
    ]);
    if (extractedCoin !== null) coinCost = extractedCoin;
    if (lowerQ.includes('tanpa koin') || lowerQ.includes('ga pake koin') || lowerQ.includes('gak pake koin')) {
      coinCost = 0;
    }

    if (lowerQ.includes('tanpa host') || lowerQ.includes('ga ada host') || lowerQ.includes('jual sendiri')) {
      hostSalary = 0;
      hostIncentivePerPackage = 0;
    }
  }

  const totalFixedBurden = targetProfit + adsCost + coinCost + hostSalary + adminSalary;

  // 4. Try Gemini AI
  if (cleanedUserQuery.length > 0) {
    try {
      const systemInstruction = `Anda adalah Chief Financial Officer (CFO), Konsultan Bisnis E-Commerce, dan Ahli Strategi Penetapan Harga (Pricing Consultant) untuk toko ritel & fashion Indonesia.
Anda menguasai karakteristik penjualan di berbagai channel:
1. DM Instagram / WhatsApp / Social Commerce:
   - Tidak ada biaya admin marketplace (karena transfer langsung BCA/Mandiri/QRIS).
   - Tidak ada biaya host live streaming (dikelola owner atau admin chat).
   - Ongkir ditanggung pembeli, atau seller memberi promo "Beli 2 Free Ongkir" / "Bundling Hemat Ongkir".
   - Fokus ke respon cepat, keramahan, format order instan, dan closing rate yang tinggi.
2. Shopee Live & TikTok Live Streaming:
   - Ada host live (gaji pokok + insentif), admin toko/kasir, biaya iklan live, koin sawer/voucher, serta potongan admin marketplace (8-12%) & biaya layanan.
   - Fokus ke anchor pricing (satuan mahal vs bundling murah), urgensi keranjang kuning/orange, dan cuci gudang volume.
3. Marketplace Reguler (Katalog non-live).
4. Toko Fisik / Thrift Shop Offline.

PETUNJUK UTAMA:
- Jawab pertanyaan seller secara CERDAS, RAMAH, FLEKSIBEL, MATEMATIS, dan SANGAT SPESIFIK sesuai pertanyaan mereka.
- JANGAN PERNAH mengulang template jawaban default yang sama! Jawab pertanyaan seller secara personal seolah-olah Anda adalah konsultan bisnis yang sedang berdiskusi langsung.
- Jika seller bertanya tentang jualan di DM Instagram / WhatsApp (atau "dm", "wa", "ig", "sosmed", "tanpa live"), analisa biaya dan harga secara khusus untuk DM (tanpa potongan admin marketplace, tanpa biaya host live, rekomendasi harga satuan DM dan paket bundling 2-3 pcs hemat ongkir, serta script atau trik closing DM).
- Jika seller menyebut modal HPP tertentu atau target untung tertentu, gunakan angka persis dari pertanyaan seller dalam kalkulasi.
- Format JSON murni tanpa markdown wrapping.`;

      const aiPrompt = `DATA KONTEN & PERTANYAAN SELLER:
Nama Toko: ${storeContext?.storeName || 'Fashion Store'}
Channel Terdeteksi: ${channelLabels[detectedChannel]} (${detectedChannel})
Pertanyaan/Keluhan Seller: "${cleanedUserQuery}"

RIWAYAT PERCAKAPAN SEBELUMNYA:
${Array.isArray(chatHistory) && chatHistory.length > 0 ? JSON.stringify(chatHistory.slice(-4)) : 'Percakapan baru'}

PARAMETER KEUANGAN:
- Channel: ${detectedChannel}
- Modal HPP per Pcs: Rp ${hppPerPcs.toLocaleString('id-ID')}
- Target Keuntungan: Rp ${targetProfit.toLocaleString('id-ID')} (${targetProfitType})
- Biaya Iklan: Rp ${adsCost.toLocaleString('id-ID')}
- Biaya Koin/Diskon: Rp ${coinCost.toLocaleString('id-ID')}
- Gaji Host Live: Rp ${hostSalary.toLocaleString('id-ID')} (Insentif: Rp ${hostIncentivePerPackage.toLocaleString('id-ID')}/paket)
- Gaji Admin/CS: Rp ${adminSalary.toLocaleString('id-ID')} (Insentif: Rp ${adminIncentivePerPackage.toLocaleString('id-ID')}/paket)
- Potongan Admin Marketplace: ${adminPercentage}%
- Biaya Layanan Pesanan: Rp ${serviceFeePerOrder.toLocaleString('id-ID')}
- Biaya Packing: Rp ${packingCost.toLocaleString('id-ID')}
- Cadangan Retur: ${returnPercentage}%

TUGAS ANDA:
1. Analisis pertanyaan seller. Berikan "directAnswer" (3-5 kalimat mendalam, solutif, menghitung angka riil, menjelaskan kenapa harga tersebut dipasang, dan bagaimana cara menjualnya di channel terkait).
2. Buat 4 skenario harga paket yang relevan dengan channel (${detectedChannel}):
   - Jika DM: Satuan DM (1 pcs), Paket Hemat DM (2 pcs hemat ongkir), Paket Bundling DM (3 pcs best deal), Paket Reseller/Grosir DM (5 pcs).
   - Jika Live: Satuan (1 pcs anchor), Bundling Hemat (2 pcs populer), Bundling Best Seller (3 pcs margin tinggi), Bundling Jumbo (5 pcs cuci gudang).
   - Jika Marketplace / Offline: sesuaikan nama dan tujuannya.
   Hitung harga jual yang masuk akal, margin per paket, persentase margin, minimum paket yang harus terjual untuk capai target, dan kuota BEP impas beban.
3. Berikan rincian rumus perhitungan singkat di "formulaExplanation" (step1, step2, step3).
4. Berikan 4-5 "strategicAdvice" praktis terapan untuk pertanyaan & channel tersebut (misal script balas chat DM yang cepat closing, cara mengatasi customer minta diskon, atau strategi live).
5. Berikan 3 "suggestedFollowUps" (pertanyaan lanjutan cerdas yang bisa diklik seller).

BERIKAN OUTPUT DALAM JSON MURNI:
{
  "channelType": "${detectedChannel}",
  "channelLabel": "${channelLabels[detectedChannel]}",
  "directAnswer": string,
  "costStructure": {
    "hppPerPcs": number,
    "adsCost": number,
    "coinCost": number,
    "hostSalary": number,
    "adminSalary": number,
    "adminMarketplacePercent": number,
    "serviceFeePerOrder": number,
    "packingCost": number,
    "targetProfitNominal": number,
    "targetProfitDescription": string
  },
  "scenarios": [
    {
      "id": string ("bundling_1pcs" | "bundling_2pcs" | "bundling_3pcs" | "bundling_5pcs"),
      "name": string,
      "badge": string,
      "pcsPerPackage": number,
      "recommendedPrice": number,
      "marginPerPackage": number,
      "marginPercentage": number,
      "minPackagesNeeded": number,
      "totalPcsNeeded": number,
      "bepPackagesNeeded": number,
      "totalOmzetKotor": number,
      "summary": string
    }
  ],
  "formulaExplanation": {
    "step1": string,
    "step2": string,
    "step3": string
  },
  "strategicAdvice": string[],
  "suggestedFollowUps": string[]
}`;

      const parsed = await generateJsonFn(aiPrompt, systemInstruction, 0.4);

      if (parsed && typeof parsed === 'object' && parsed.directAnswer) {
        return {
          success: true,
          isAiGenerated: true,
          data: {
            analyzedQuery: cleanedUserQuery,
            channelType: parsed.channelType || detectedChannel,
            channelLabel: parsed.channelLabel || channelLabels[detectedChannel],
            directAnswer: parsed.directAnswer,
            costStructure: parsed.costStructure || {
              hppPerPcs,
              adsCost,
              coinCost,
              hostSalary,
              adminSalary,
              adminMarketplacePercent: adminPercentage,
              serviceFeePerOrder,
              packingCost,
              targetProfitNominal: targetProfit,
              targetProfitDescription: `Target Laba Rp ${targetProfit.toLocaleString('id-ID')}`
            },
            extractedParams: {
              targetProfit,
              targetProfitPercent,
              adsCost,
              coinCost,
              hostSalary,
              adminSalary,
              totalFixedBurden,
              hppPerPcs,
              adminPercentage,
              serviceFeePerOrder
            },
            scenarios: Array.isArray(parsed.scenarios) && parsed.scenarios.length > 0 ? parsed.scenarios : [],
            formulaExplanation: parsed.formulaExplanation || {
              step1: `Total Beban Harian = Rp ${totalFixedBurden.toLocaleString('id-ID')}`,
              step2: `Margin Bersih = Harga Jual - Modal HPP - Biaya Operasional`,
              step3: `Target Kuota = Total Beban dibagi Margin Bersih per Paket`
            },
            strategicAdvice: Array.isArray(parsed.strategicAdvice) && parsed.strategicAdvice.length > 0 ? parsed.strategicAdvice : [],
            suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0 ? parsed.suggestedFollowUps : []
          }
        };
      }
    } catch (apiErr: any) {
      console.warn('Gemini model call failed or timeout, generating dynamic tailored calculation:', apiErr?.message || apiErr);
    }
  }

  // 5. Intelligent Dynamic Fallback
  function buildHeuristicScenario(id: string, name: string, badge: string, pcs: number, priceMultiplier: number, extraMargin = 0, summaryText = '') {
    const totalHpp = pcs * hppPerPcs;
    const basePrice = Math.round((totalHpp * priceMultiplier + extraMargin) / 1000) * 1000;
    const adminCut = Math.round((adminPercentage / 100) * basePrice);
    const returCut = Math.round((returnPercentage / 100) * basePrice);
    const incentives = hostIncentivePerPackage + adminIncentivePerPackage;
    const netMargin = Math.max(1000, basePrice - totalHpp - adminCut - returCut - serviceFeePerOrder - packingCost - incentives);
    const marginPct = Number(((netMargin / basePrice) * 100).toFixed(1));
    const minPkgs = Math.max(1, Math.ceil(totalFixedBurden / netMargin));
    const bepPkgs = Math.max(0, Math.ceil((adsCost + coinCost + hostSalary + adminSalary) / netMargin));

    return {
      id,
      name,
      badge,
      pcsPerPackage: pcs,
      recommendedPrice: basePrice,
      marginPerPackage: netMargin,
      marginPercentage: marginPct,
      minPackagesNeeded: minPkgs,
      totalPcsNeeded: minPkgs * pcs,
      bepPackagesNeeded: bepPkgs,
      totalOmzetKotor: minPkgs * basePrice,
      summary: summaryText,
      tagColor: pcs === 2 ? 'emerald' : pcs === 3 ? 'cyan' : 'zinc'
    };
  }

  let fallbackScenarios = [];
  let fallbackDirectAnswer = '';
  let fallbackAdvice: string[] = [];
  let fallbackFollowUps: string[] = [];

  if (detectedChannel === 'dm_sosmed') {
    const p1 = Math.round((hppPerPcs * 1.6 + targetProfit * 0.05) / 1000) * 1000;
    const p2 = Math.round((hppPerPcs * 2 * 1.5 + 5000) / 1000) * 1000;
    const p3 = Math.round((hppPerPcs * 3 * 1.45 + 5000) / 1000) * 1000;
    const p5 = Math.round((hppPerPcs * 5 * 1.35) / 1000) * 1000;

    fallbackScenarios = [
      buildHeuristicScenario('bundling_2pcs', 'Paket Hemat DM (Isi 2 Pcs)', 'Paling Laris di DM', 2, 1.5, 5000, 'Best seller via DM Instagram/WA. Menghemat ongkos kirim pembeli dan menaikkan nilai rata-rata transaksi.'),
      buildHeuristicScenario('bundling_3pcs', 'Paket Value Deal DM (Isi 3 Pcs)', 'Rekomendasi Margin Tinggi', 3, 1.45, 5000, 'Pilihan pelanggan setia atau untuk penawaran Free Ongkir bersyarat.'),
      buildHeuristicScenario('bundling_1pcs', 'Satuan DM (Single 1 Pcs)', 'Penjualan Satuan Chat', 1, 1.6, 5000, 'Harga satuan etalase untuk customer yang baru pertama kali coba membeli via DM.'),
      buildHeuristicScenario('bundling_5pcs', 'Paket Mini Grosir / Reseller DM (5 Pcs)', 'Volume Cepat Habis', 5, 1.35, 0, 'Cocok untuk penawaran reseller, sahabat arisan, atau cuci sisa stok ball.'),
    ];

    fallbackDirectAnswer = `Penjualan via DM Instagram & WhatsApp memiliki keunggulan tanpa potongan biaya admin marketplace (0%) dan tanpa beban host live. Dengan modal HPP Rp ${hppPerPcs.toLocaleString('id-ID')}, Anda disarankan mematok harga satuan Rp ${p1.toLocaleString('id-ID')}, dan fokus menawarkan Paket Hemat 2 Pcs Rp ${p2.toLocaleString('id-ID')}. Anda hanya butuh menjual ${fallbackScenarios[0].minPackagesNeeded} paket per hari untuk mengantongi keuntungan bersih Rp ${targetProfit.toLocaleString('id-ID')}.`;

    fallbackAdvice = [
      'Gunakan format auto-reply atau quick reply keyboard di Instagram DM / WhatsApp Business agar calon pembeli langsung mendapat detail ukuran, stok, dan nomor rekening.',
      'Dorong upselling dari 1 pcs ke 2 pcs dengan tawaran subsidi ongkir: "Kak kalau ambil 2 pcs sekaligus, dapet potongan subsidi ongkir Rp 10.000 lho!"',
      'Sediakan pembayaran instan via QRIS Dinamis atau Transfer Bank (BCA/Mandiri) untuk menghindari pembeli batal beli (ghosting).',
      'Terapkan batas keep maksimal 2 jam: "Stok tinggal 1 pcs kak, kami simpan 2 jam ya kak sebelum dilepas ke antrean lain."',
      'Unggah bukti resi pengiriman dan testimoni pembeli setiap sore di Instagram Story untuk membangun rasa percaya.'
    ];

    fallbackFollowUps = [
      'Bagaimana script balas DM Instagram agar calon pembeli langsung transfer tanpa banyak tanya?',
      'Berapa minimal belanja di DM agar toko saya tetap untung jika memberikan subsidi gratis ongkir?',
      'Bagaimana cara mempromosikan foto katalog baju di Instagram agar DM ramai yang tanya harga?'
    ];
  } else {
    const p2 = Math.round((hppPerPcs * 2 * 1.55 + 15000) / 1000) * 1000;
    const p3 = Math.round((hppPerPcs * 3 * 1.5 + 20000) / 1000) * 1000;

    fallbackScenarios = [
      buildHeuristicScenario('bundling_2pcs', 'Bundling Hemat (Isi 2 Pcs)', 'Paling Populer & Seimbang', 2, 1.55, 15000, 'Sangat direkomendasikan saat sesi live streaming, menghemat ongkir pelanggan dan mempercepat perputaran barang.'),
      buildHeuristicScenario('bundling_3pcs', 'Bundling Best Seller (Isi 3 Pcs)', 'Rekomendasi Margin Profit', 3, 1.5, 20000, 'Margin profit per transaksi tinggi, hanya membutuhkan lebih sedikit pesanan untuk mencapai target laba.'),
      buildHeuristicScenario('bundling_1pcs', 'Satuan (Single 1 Pcs)', 'Penjualan Satuan Normal', 1, 1.7, 10000, 'Pilihan bagi pembeli yang baru pertama kali coba berbelanja di toko Anda.'),
      buildHeuristicScenario('bundling_5pcs', 'Bundling Jumbo / Grosir (Isi 5 Pcs)', 'Volume Cepat Habis', 5, 1.4, 25000, 'Paling efektif untuk cuci gudang / menghabiskan sisa ball persediaan stok.'),
    ];

    fallbackDirectAnswer = `Kalkulasi Live Streaming: Dengan total beban harian Rp ${totalFixedBurden.toLocaleString('id-ID')} (termasuk Iklan Rp ${adsCost.toLocaleString('id-ID')}, Koin Rp ${coinCost.toLocaleString('id-ID')}, Host Rp ${hostSalary.toLocaleString('id-ID')}, Admin Rp ${adminSalary.toLocaleString('id-ID')}) serta HPP Rp ${hppPerPcs.toLocaleString('id-ID')}, Anda disarankan fokus mempromosikan Bundling 2 Pcs seharga Rp ${p2.toLocaleString('id-ID')}. Anda membutuhkan penjualan sekitar ${fallbackScenarios[0].minPackagesNeeded} paket/hari untuk menutup seluruh beban dan mengamankan target laba.`;

    fallbackAdvice = [
      'Fokuskan host mempromosikan Bundling 2 & 3 pcs sebagai menu utama etalase untuk menekan rasio biaya packing dan potongan layanan per resi.',
      'Tebar koin diskon pada menit ke-20 sampai ke-45 saat traffic penonton sedang berada di puncaknya.',
      'Gunakan produk satuan dengan harga sedikit lebih tinggi sebagai "anchor price" agar penawaran paket bundling terlihat jauh lebih hemat.',
      'Berikan insentif Rp 2.000 per paket untuk host live agar termotivasi aktif melakukan upselling dari 1 pcs ke 2-3 pcs.'
    ];

    fallbackFollowUps = [
      'Bagaimana cara setting iklan Shopee/TikTok Live yang efektif agar tidak boncos?',
      'Berapa rasio ideal biaya koin terhadap omzet harian sesi live streaming?',
      'Bagaimana trik host live melakukan pitching produk bundling agar penonton langsung checkout?'
    ];
  }

  return {
    success: true,
    isAiGenerated: false,
    data: {
      analyzedQuery: cleanedUserQuery,
      channelType: detectedChannel,
      channelLabel: channelLabels[detectedChannel],
      directAnswer: fallbackDirectAnswer,
      costStructure: {
        hppPerPcs,
        adsCost,
        coinCost,
        hostSalary,
        adminSalary,
        adminMarketplacePercent: adminPercentage,
        serviceFeePerOrder,
        packingCost,
        targetProfitNominal: targetProfit,
        targetProfitDescription: `Target Laba Rp ${targetProfit.toLocaleString('id-ID')}`
      },
      extractedParams: {
        targetProfit,
        targetProfitPercent,
        adsCost,
        coinCost,
        hostSalary,
        adminSalary,
        totalFixedBurden,
        hppPerPcs,
        adminPercentage,
        serviceFeePerOrder
      },
      scenarios: fallbackScenarios,
      formulaExplanation: {
        step1: `Total Beban Harian Wajib Ditutup = Target Laba (Rp ${targetProfit.toLocaleString('id-ID')}) + Biaya Iklan (Rp ${adsCost.toLocaleString('id-ID')}) + Biaya Koin (Rp ${coinCost.toLocaleString('id-ID')}) + Gaji Host (Rp ${hostSalary.toLocaleString('id-ID')}) + Gaji Admin (Rp ${adminSalary.toLocaleString('id-ID')}) = Rp ${totalFixedBurden.toLocaleString('id-ID')}.`,
        step2: `Margin Bersih per Paket = Harga Jual - Modal HPP - Potongan Admin Marketplace (${adminPercentage}%) - Layanan (Rp ${serviceFeePerOrder.toLocaleString('id-ID')}) - Packing (Rp ${packingCost.toLocaleString('id-ID')}) - Retur (${returnPercentage}%) - Insentif Tenaga Kerja.`,
        step3: `Target Paket Terjual = Total Beban Harian dibagi Margin Bersih per Paket. BEP Impas Beban = Beban Operasional Pokok dibagi Margin Bersih per Paket.`
      },
      strategicAdvice: fallbackAdvice,
      suggestedFollowUps: fallbackFollowUps
    }
  };
}
