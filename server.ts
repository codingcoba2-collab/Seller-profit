import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini client lazily/safely
  let genAI: GoogleGenAI | null = null;
  function getAI() {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not configured');
      }
      genAI = new GoogleGenAI({ apiKey });
    }
    return genAI;
  }

  // Resilient JSON generator with automatic fallback across model aliases for 503/high-demand
  async function generateJsonWithAi(prompt: string, temperature = 0.2) {
    const aiClient = getAI();
    // Prioritized model fallback list (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-flash-latest)
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature,
          },
        });

        const rawText = response.text?.trim() || '{}';
        let cleanedText = rawText;
        if (cleanedText.includes('```')) {
          cleanedText = cleanedText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        }
        const sIdx = cleanedText.indexOf('{');
        const eIdx = cleanedText.lastIndexOf('}');
        if (sIdx !== -1 && eIdx !== -1) {
          cleanedText = cleanedText.substring(sIdx, eIdx + 1);
        }

        return JSON.parse(cleanedText);
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTemporaryBusy = msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED');
        if (isTemporaryBusy) {
          console.info(`Model ${model} is experiencing temporary high demand (503). Retrying with alternate model...`);
          continue;
        }
        console.info(`Model ${model} call encountered error:`, msg);
      }
    }
    throw lastError || new Error('All AI models unavailable');
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Employee Performance Evaluation endpoint
  app.post('/api/ai/evaluate-employee', async (req, res) => {
    try {
      const { employeeData, storeContext } = req.body;

      if (!employeeData) {
        return res.status(400).json({ error: 'Data pegawai dibutuhkan untuk evaluasi AI' });
      }

      let apiKeyAvailable = Boolean(process.env.GEMINI_API_KEY);

      if (apiKeyAvailable) {
        try {
          const aiClient = getAI();
          const prompt = `Anda adalah seorang konsultan HR, Chief Operational Officer (COO), dan pakar efisiensi bisnis ritel & live fashion (Thrift, Baju Baru, Gamis/Muslim, Distro, Sepatu & Tas, Marketplace Live & Offline).

Tugas Anda adalah menilai efektivitas dan kinerja pegawai secara objektif, mendalam, konstruktif, dan memberikan insight terapan (actionable) untuk pemilik toko fashion.

DATA TOKO:
Nama Toko: ${storeContext?.storeName || 'Fashion Store'}
Periode: ${storeContext?.period || 'Bulan Berjalan'}

DATA PEGAWAI:
${JSON.stringify(employeeData, null, 2)}

Harap berikan hasil evaluasi dalam format JSON murni tanpa markdown wrapping dengan struktur berikut:
{
  "employeeId": "${employeeData.id || ''}",
  "employeeName": "${employeeData.name || ''}",
  "overallScore": number (0-100, skor efektivitas keseluruhan),
  "performanceGrade": string ("Sangat Efektif (A+)" | "Efektif (A)" | "Cukup Baik (B)" | "Perlu Peningkatan (C)" | "Kritis / Perlu Evaluasi (D)"),
  "efficiencyRating": {
    "productivity": number (0-100, produktivitas output/jam/shift),
    "salesContribution": number (0-100, kontribusi omzet & paket),
    "discipline": number (0-100, kehadiran & konsistensi),
    "qualityControl": number (0-100, minim reject / minim retur / kerapihan)
  },
  "summary": string (ringkasan eksekutif 2-3 kalimat mengenai performa pegawai ini),
  "strengths": string[] (3 poin kelebihan dan kontribusi terbaik pegawai),
  "areasForImprovement": string[] (2-3 area spesifik yang perlu ditingkatkan),
  "actionableRecommendations": string[] (3 rekomendasi konkret untuk pemilik toko, misal penugasan shift optimal, strategi peningkatan penjualan/packing, bonus/insentif yang tepat),
  "suggestedShiftStrategy": string (saran waktu/shift penugasan paling optimal untuk pegawai ini)
}`;

          const parsed = await generateJsonWithAi(prompt, 0.2);
          return res.json({ success: true, data: parsed, isAiGenerated: true });
        } catch (apiError: any) {
          console.info('Gemini models unavailable, using heuristic fallback for employee evaluation:', apiError?.message || apiError);
        }
      }

      // Heuristic Fallback Analysis if API key unavailable or rate limited
      const emp = employeeData;
      const shifts = emp.totalShifts || 1;
      const hours = emp.totalHours || (shifts * 7);
      const omzet = emp.totalOmzet || 0;
      const pcs = emp.totalPcs || 0;
      const isHost = (emp.roles || []).includes('host');
      const isSortir = (emp.roles || []).includes('sortir');
      const isSteam = (emp.roles || []).includes('steam');
      const isAdmin = (emp.roles || []).includes('admin_toko');

      let productivity = 80;
      let salesContribution = 75;
      let discipline = Math.min(100, Math.round((shifts / 20) * 100)) || 80;
      let qualityControl = 85;

      if (isHost) {
        const salesPerHour = hours > 0 ? Math.round(omzet / hours) : 0;
        salesContribution = Math.min(100, Math.round((omzet / 15000000) * 100));
        productivity = Math.min(100, Math.round((salesPerHour / 500000) * 100));
      } else if (isSortir || isSteam) {
        productivity = Math.min(100, Math.round((pcs / 300) * 100)) || 85;
      }

      const overallScore = Math.round((productivity * 0.3) + (salesContribution * 0.3) + (discipline * 0.25) + (qualityControl * 0.15));
      let performanceGrade = 'Cukup Baik (B)';
      if (overallScore >= 90) performanceGrade = 'Sangat Efektif (A+)';
      else if (overallScore >= 80) performanceGrade = 'Efektif (A)';
      else if (overallScore < 65) performanceGrade = 'Perlu Peningkatan (C)';

      const fallbackResult = {
        employeeId: emp.id,
        employeeName: emp.name,
        overallScore,
        performanceGrade,
        efficiencyRating: {
          productivity: Math.max(50, Math.min(98, productivity)),
          salesContribution: Math.max(40, Math.min(98, salesContribution)),
          discipline: Math.max(60, Math.min(99, discipline)),
          qualityControl: Math.max(70, Math.min(95, qualityControl)),
        },
        summary: `${emp.name} menunjukkan komitmen kerja yang solid dengan tingkat kehadiran ${shifts} shift dan kontribusi aktif di kategori fashion. Efektivitas kerja tergolong ${performanceGrade}.`,
        strengths: [
          `Konsistensi kehadiran yang terjaga dengan total ${shifts} sesi shift aktif.`,
          isHost ? `Kemampuan interaksi dan konversi penjualan live mencapai ${pcs} pcs.` : `Ketelitian dalam penanganan ${pcs > 0 ? pcs + ' pcs barang fashion' : 'tugas operasional toko'}.`,
          `Fleksibilitas dalam mendukung target penjualan dan operasional harian toko.`
        ],
        areasForImprovement: [
          isHost ? 'Optimasi hook 3 menit awal saat live untuk mendongkrak retensi penonton dan closing rate.' : 'Peningkatan kecepatan processing per jam saat volume pesanan memuncak.',
          'Koordinasi komunikasi stok real-time antar shift agar stok update tepat waktu.'
        ],
        actionableRecommendations: [
          isHost ? 'Jadwalkan di prime time live (19:00 - 22:00 WIB) untuk memaksimalkan potensi konversi omzet.' : 'Berikan reward insentif kecepatan processing agar target harian selalu tercapai.',
          'Pertahankan skema insentif berbasis performa untuk menjaga motivasi kerja jangka panjang.',
          'Lakukan briefing mingguan untuk review barang best seller dan feedback retur pelanggan.'
        ],
        suggestedShiftStrategy: isHost ? 'Sesi Prime Time Malam (19:30 - 22:30 WIB) & Siang (12:00 - 14:00 WIB)' : 'Shift Pagi / Siang saat puncak persiapan packing & sortir'
      };

      return res.json({ success: true, data: fallbackResult, isAiGenerated: false });
    } catch (error: any) {
      console.error('Error evaluating employee:', error);
      res.status(500).json({ error: 'Gagal menganalisis efektivitas pegawai: ' + error.message });
    }
  });

  // AI Bundling Price & Minimum Packages Calculation Endpoint
  app.post('/api/ai/calculate-bundle', async (req, res) => {
    try {
      const { userQuery, storeContext, parameters } = req.body;

      // Extract or set defaults
      let targetProfit = Number(parameters?.targetProfit ?? 1000000);
      let targetProfitPercent = Number(parameters?.targetProfitPercent ?? 20);
      const targetProfitType = parameters?.targetProfitType || 'nominal';

      let adsCost = Number(parameters?.adsCost ?? 60000);
      let coinCost = Number(parameters?.coinCost ?? 30000);
      let operationalCost = Number(parameters?.operationalCost ?? 0);

      // Host & Admin Live streaming salaries and incentives
      const hostSalary = Number(parameters?.hostSalary ?? 0);
      const hostIncentivePerPackage = Number(parameters?.hostIncentivePerPackage ?? 0);
      const hostIncentivePerPcs = Number(parameters?.hostIncentivePerPcs ?? 0);
      const adminSalary = Number(parameters?.adminSalary ?? 0);
      const adminIncentivePerPackage = Number(parameters?.adminIncentivePerPackage ?? 0);

      const hppPerPcs = Number(parameters?.hppPerPcs ?? (storeContext?.hppAverage || 20000));
      const adminPercentage = Number(parameters?.adminPercentage ?? (storeContext?.adminPromoPercentage || 8.5));
      const serviceFeePerOrder = Number(parameters?.serviceFeePerOrder ?? (storeContext?.serviceFeePerOrder || 1250));
      const returnPercentage = Number(parameters?.returnPercentage ?? (storeContext?.estimateReturnPercentage || 3.0));
      const packingCost = Number(parameters?.packingCost ?? (storeContext?.averagePackingCost || 1500));

      // Dynamic smart regex extraction from userQuery if user typed numbers directly in natural language
      if (typeof userQuery === 'string' && userQuery.trim().length > 0) {
        const lowerQ = userQuery.toLowerCase();
        
        // Iklan e.g. "iklan 60k", "iklan 60.000", "iklan 80rb"
        const adsMatch = lowerQ.match(/iklan\s*(?:sebesar|seharga|sebanyak|rp)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i);
        if (adsMatch) {
          const num = parseFloat(adsMatch[1].replace(',', '.'));
          const unit = adsMatch[2]?.toLowerCase();
          if (unit === 'k' || unit === 'rb' || unit === 'ribu') adsCost = num * 1000;
          else if (unit === 'jt' || unit === 'juta') adsCost = num * 1000000;
          else if (num < 1000) adsCost = num * 1000;
          else adsCost = num;
        }

        // Koin e.g. "koin 30k", "koin 30.000", "koin 50rb"
        const coinMatch = lowerQ.match(/koin\s*(?:sebesar|seharga|sebanyak|rp)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i);
        if (coinMatch) {
          const num = parseFloat(coinMatch[1].replace(',', '.'));
          const unit = coinMatch[2]?.toLowerCase();
          if (unit === 'k' || unit === 'rb' || unit === 'ribu') coinCost = num * 1000;
          else if (unit === 'jt' || unit === 'juta') coinCost = num * 1000000;
          else if (num < 1000) coinCost = num * 1000;
          else coinCost = num;
        }

        // Target Laba e.g. "keuntungan 1 jt", "untung 1jt", "laba 1.5 jt", "profit 25%"
        const percentMatch = lowerQ.match(/(?:laba|untung|keuntungan|profit|margin)\s*(?:mencapai|sebesar|minimal)?\s*(\d+(?:[.,]\d+)?)\s*%/i);
        if (percentMatch) {
          targetProfitPercent = parseFloat(percentMatch[1].replace(',', '.'));
        } else {
          const labaMatch = lowerQ.match(/(?:laba|untung|keuntungan|profit)\s*(?:mencapai|sebesar|minimal|rp)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i);
          if (labaMatch) {
            const num = parseFloat(labaMatch[1].replace(',', '.'));
            const unit = labaMatch[2]?.toLowerCase();
            if (unit === 'k' || unit === 'rb' || unit === 'ribu') targetProfit = num * 1000;
            else if (unit === 'jt' || unit === 'juta') targetProfit = num * 1000000;
            else if (num <= 50) targetProfit = num * 1000000; // e.g. "1 jt" without unit or "1"
            else targetProfit = num;
          }
        }
      }

      // Total daily fixed overhead
      const totalFixedOverhead = adsCost + coinCost + operationalCost + hostSalary + adminSalary;
      const totalFixedBurden = totalFixedOverhead + targetProfit;

      const apiKeyAvailable = Boolean(process.env.GEMINI_API_KEY);

      if (apiKeyAvailable) {
        try {
          const aiClient = getAI();
          const prompt = `Anda adalah CFO & Pakar Strategi Bisnis E-Commerce & Live Streaming Fashion (Shopee Live, TikTok Shop, Thrift, Distro).

PERTANYAAN USER:
"${userQuery || 'Jika dalam satu hari iklan 60k dan koin 30k berapa harga bundling yang dijual agar keuntungan bisa mencapai 1 jt/hari dan berapa minimum paket terjual?'}"

DATA FINANSIAL & PARAMETER OPERASIONAL TOKO:
- Nama Toko: ${storeContext?.storeName || 'Fashion Live Store'}
- Tipe Target Laba: ${targetProfitType === 'percentage' ? `Persentase (${targetProfitPercent}% dari Omzet)` : `Nominal (Rp ${targetProfit.toLocaleString('id-ID')}/hari)`}
- Biaya Iklan Harian: Rp ${adsCost.toLocaleString('id-ID')}
- Biaya Koin / Voucher Diskon Harian: Rp ${coinCost.toLocaleString('id-ID')}
- Biaya Operasional Tetap Toko: Rp ${operationalCost.toLocaleString('id-ID')}
- Beban Gaji Pokok Host Live: Rp ${hostSalary.toLocaleString('id-ID')}/hari
- Beban Gaji Pokok Admin Toko: Rp ${adminSalary.toLocaleString('id-ID')}/hari
- Insentif Host Live per Paket: Rp ${hostIncentivePerPackage.toLocaleString('id-ID')}
- Insentif Admin Toko per Paket: Rp ${adminIncentivePerPackage.toLocaleString('id-ID')}
- Modal HPP Rata-rata per Pcs: Rp ${hppPerPcs.toLocaleString('id-ID')}
- Potongan Admin Promo Marketplace: ${adminPercentage}%
- Biaya Layanan per Pesanan: Rp ${serviceFeePerOrder.toLocaleString('id-ID')} / paket
- Biaya Packing (Plastik/Lakban): Rp ${packingCost.toLocaleString('id-ID')} / paket
- Cadangan Estimasi Retur: ${returnPercentage}%

ATURAN PERHITUNGAN AKUNTANSI TOKO:
1. Beban Tetap Harian (Fixed Overhead) = Iklan + Koin + Ops + Gaji Pokok Host + Gaji Pokok Admin = Rp ${totalFixedOverhead.toLocaleString('id-ID')}.
2. Biaya Variabel per Paket = (Pcs * HPP) + Biaya Layanan + Biaya Packing + Insentif Host + Insentif Admin.
3. Margin Bersih per Paket = Harga Bundling - (Admin Marketplace % * Harga) - (Retur % * Harga) - Biaya Variabel.
4. Minimum Paket Terjual untuk Target Laba Nominal = (Beban Tetap Harian + Target Laba) / Margin Bersih per Paket (dibulatkan ke atas).
5. Titik Impas (BEP) Paket Operasional = Beban Tetap Harian / Margin Bersih per Paket.

Harap berikan respons JSON murni TANPA pembungkus markdown (tanpa \`\`\`json) dengan struktur berikut:
{
  "directAnswer": string (jawaban ringkas, lugas, dan profesional menjawab pertanyaan user dengan angka konkret),
  "extractedParams": {
    "targetProfit": number,
    "targetProfitPercent": number,
    "adsCost": number,
    "coinCost": number,
    "hostSalary": number,
    "adminSalary": number,
    "totalFixedBurden": number,
    "hppPerPcs": number
  },
  "scenarios": [
    {
      "id": "bundling_2pcs",
      "name": "Bundling Hemat (Isi 2 Pcs)",
      "badge": "Paling Direkomendasikan",
      "pcsPerPackage": 2,
      "recommendedPrice": number,
      "marginPerPackage": number,
      "marginPercentage": number,
      "minPackagesNeeded": number,
      "totalPcsNeeded": number,
      "bepPackagesNeeded": number,
      "totalOmzetKotor": number,
      "summary": string
    },
    {
      "id": "bundling_3pcs",
      "name": "Bundling Best Seller (Isi 3 Pcs)",
      "badge": "Margin Tinggi",
      "pcsPerPackage": 3,
      "recommendedPrice": number,
      "marginPerPackage": number,
      "marginPercentage": number,
      "minPackagesNeeded": number,
      "totalPcsNeeded": number,
      "bepPackagesNeeded": number,
      "totalOmzetKotor": number,
      "summary": string
    },
    {
      "id": "bundling_1pcs",
      "name": "Satuan (Single 1 Pcs)",
      "badge": "Penjualan Satuan",
      "pcsPerPackage": 1,
      "recommendedPrice": number,
      "marginPerPackage": number,
      "marginPercentage": number,
      "minPackagesNeeded": number,
      "totalPcsNeeded": number,
      "bepPackagesNeeded": number,
      "totalOmzetKotor": number,
      "summary": string
    },
    {
      "id": "bundling_5pcs",
      "name": "Bundling Jumbo / Flash Sale (Isi 5 Pcs)",
      "badge": "Cepat Habiskan Stok",
      "pcsPerPackage": 5,
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
    "step1": string (penjelasan total beban harian yang harus ditutup),
    "step2": string (penjelasan cara menghitung margin bersih per paket termasuk gaji dan insentif),
    "step3": string (penjelasan cara menghitung minimum paket terjual dan titik impas)
  },
  "strategicAdvice": string[] (3-4 tips terapan untuk Host Live & Admin Toko, teknik promo bundling, timing koin, dan efisiensi tenaga kerja)
}`;

          const parsed = await generateJsonWithAi(prompt, 0.2);
          return res.json({ success: true, data: parsed, isAiGenerated: true });
        } catch (apiErr: any) {
          console.info('Gemini models unavailable or experiencing spikes, serving precision financial engine:', apiErr?.message || apiErr);
        }
      }

      // Exact Financial Engine Fallback
      function computeScenario(id: string, name: string, badge: string, pcs: number, price: number, summary: string) {
        const totalHpp = pcs * hppPerPcs;
        const adminFee = Math.round((adminPercentage / 100) * price);
        const returnReserve = Math.round((returnPercentage / 100) * price);
        const totalIncentive = hostIncentivePerPackage + adminIncentivePerPackage + (pcs * hostIncentivePerPcs);
        const variableCost = totalHpp + packingCost + serviceFeePerOrder + totalIncentive;
        const margin = price - adminFee - returnReserve - variableCost;
        const marginPct = price > 0 ? (margin / price) * 100 : 0;
        
        let minPkgs = 9999;
        if (targetProfitType === 'nominal') {
          minPkgs = margin > 0 ? Math.ceil(totalFixedBurden / margin) : 9999;
        } else {
          const retentionFactor = 1 - (adminPercentage + returnPercentage + targetProfitPercent) / 100;
          const effMargin = price * retentionFactor - variableCost;
          minPkgs = effMargin > 0 ? Math.ceil(totalFixedOverhead / effMargin) : 9999;
        }

        const bepPkgs = margin > 0 && totalFixedOverhead > 0 ? Math.ceil(totalFixedOverhead / margin) : 0;

        return {
          id,
          name,
          badge,
          pcsPerPackage: pcs,
          recommendedPrice: price,
          marginPerPackage: Math.round(margin),
          marginPercentage: Number(marginPct.toFixed(1)),
          minPackagesNeeded: minPkgs,
          totalPcsNeeded: minPkgs * pcs,
          bepPackagesNeeded: bepPkgs,
          totalOmzetKotor: minPkgs * price,
          summary,
        };
      }

      const p2 = Math.round(((hppPerPcs * 2) * 1.55 + 15000) / 1000) * 1000;
      const p3 = Math.round(((hppPerPcs * 3) * 1.50 + 18000) / 1000) * 1000;
      const p1 = Math.round((hppPerPcs * 1.80 + 12000) / 1000) * 1000;
      const p5 = Math.round(((hppPerPcs * 5) * 1.45 + 22000) / 1000) * 1000;

      const sc2 = computeScenario('bundling_2pcs', 'Bundling Hemat (Isi 2 Pcs)', 'Paling Populer & Seimbang', 2, p2, 'Sangat direkomendasikan saat sesi live streaming, menghemat ongkir pelanggan dan mempercepat perputaran barang.');
      const sc3 = computeScenario('bundling_3pcs', 'Bundling Best Seller (Isi 3 Pcs)', 'Rekomendasi Margin Profit', 3, p3, 'Margin profit per transaksi tinggi, hanya membutuhkan lebih sedikit pesanan untuk mencapai target laba.');
      const sc1 = computeScenario('bundling_1pcs', 'Satuan (Single 1 Pcs)', 'Penjualan Satuan Normal', 1, p1, 'Pilihan bagi pembeli yang baru pertama kali coba berbelanja di toko Anda.');
      const sc5 = computeScenario('bundling_5pcs', 'Bundling Jumbo / Grosir (Isi 5 Pcs)', 'Volume Cepat Habis', 5, p5, 'Paling efektif untuk cuci gudang / menghabiskan sisa ball persediaan stok.');

      const fallbackData = {
        directAnswer: `Untuk menutup biaya iklan Rp ${adsCost.toLocaleString('id-ID')}, koin Rp ${coinCost.toLocaleString('id-ID')}, serta beban gaji host & admin${hostSalary + adminSalary > 0 ? ` (Rp ${(hostSalary + adminSalary).toLocaleString('id-ID')})` : ''} dengan target keuntungan Rp ${targetProfit.toLocaleString('id-ID')}/hari (total beban Rp ${totalFixedBurden.toLocaleString('id-ID')}), Anda disarankan menjual paket Bundling 2 Pcs seharga Rp ${p2.toLocaleString('id-ID')} dengan minimum penjualan ${sc2.minPackagesNeeded} paket/hari, atau Bundling 3 Pcs seharga Rp ${p3.toLocaleString('id-ID')} dengan kuota penjualan hanya ${sc3.minPackagesNeeded} paket/hari.`,
        extractedParams: {
          targetProfit,
          targetProfitPercent,
          adsCost,
          coinCost,
          hostSalary,
          adminSalary,
          totalFixedBurden,
          hppPerPcs,
        },
        scenarios: [sc2, sc3, sc1, sc5],
        formulaExplanation: {
          step1: `Total Beban Harian yang Wajib Ditutup = Target Laba (Rp ${targetProfit.toLocaleString('id-ID')}) + Biaya Iklan (Rp ${adsCost.toLocaleString('id-ID')}) + Biaya Koin (Rp ${coinCost.toLocaleString('id-ID')}) + Gaji Pokok Host (Rp ${hostSalary.toLocaleString('id-ID')}) + Gaji Pokok Admin (Rp ${adminSalary.toLocaleString('id-ID')}) = Rp ${totalFixedBurden.toLocaleString('id-ID')}/hari.`,
          step2: `Margin Bersih per Paket dihitung dari Harga Jual dikurangi Modal HPP, Admin Marketplace ${adminPercentage}%, Biaya Layanan Rp ${serviceFeePerOrder.toLocaleString('id-ID')}, Biaya Packing Rp ${packingCost.toLocaleString('id-ID')}, Cadangan Retur ${returnPercentage}%, serta Insentif Host & Admin.`,
          step3: `Minimum Paket Terjual = Total Beban (Rp ${totalFixedBurden.toLocaleString('id-ID')}) dibagi Margin Bersih per Paket.`
        },
        strategicAdvice: [
          `Fokuskan host live mempromosikan Bundling 2 & 3 pcs sebagai "Menu Utama" etalase, karena efisiensi biaya layanan dan packing jauh lebih hemat dibanding menjual 1 pcs.`,
          `Alokasikan koin Rp ${coinCost.toLocaleString('id-ID')} pada saat traffic penonton sedang berada di puncaknya (biasanya menit ke-20 sampai ke-45 per sesi) untuk menstimulasi tombol checkout keranjang.`,
          `Batas aman titik impas (BEP) beban operasional harian Anda adalah ${sc2.bepPackagesNeeded} paket bundling 2 pcs. Setelah titik ini terlampaui, setiap penjualan berikutnya 100% menambah laba bersih.`,
          `Terapkan skema insentif per paket terjual untuk memacu host live lebih agresif melakukan upselling dari paket satuan menjadi paket bundling.`
        ]
      };

      return res.json({ success: true, data: fallbackData, isAiGenerated: false });
    } catch (error: any) {
      console.error('Error in /api/ai/calculate-bundle:', error);
      res.status(500).json({ error: 'Gagal melakukan kalkulasi paket bundling: ' + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
