import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

  // Resilient JSON generator with automatic fallback across fast models with per-call timeout
  async function generateJsonWithAi(prompt: string, temperature = 0.2) {
    const aiClient = getAI();
    // Prioritized model fallback list (gemini-3.8-flash is fastest & reliable, fallback to gemini-flash-latest and gemini-3.1-flash-lite)
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout calling model ${model} after 12000ms`)), 12000)
        );

        const response: any = await Promise.race([
          aiClient.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature,
            },
          }),
          timeoutPromise,
        ]);

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
        console.info(`Model ${model} encounter: ${msg}. Trying next candidate model...`);
        continue;
      }
    }
    throw lastError || new Error('All AI models currently unavailable');
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
      const { userQuery, storeContext, parameters } = req.body || {};

      // Helper to safely parse Indonesian currency & number formats from user input
      function extractIndoValue(rawText: string, regexList: RegExp[]): number | null {
        for (const re of regexList) {
          const match = rawText.match(re);
          if (match) {
            let numStr = match[1].trim();
            const unit = (match[2] || '').trim().toLowerCase();

            // If format is like 1.500.000 or 60.000 (dots as thousand separators)
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

      // Safe defaults
      let targetProfit = Math.max(0, Number(parameters?.targetProfit ?? 1000000) || 1000000);
      let targetProfitPercent = Math.max(1, Math.min(90, Number(parameters?.targetProfitPercent ?? 20) || 20));
      const targetProfitType = parameters?.targetProfitType === 'percentage' ? 'percentage' : 'nominal';

      let adsCost = Math.max(0, Number(parameters?.adsCost ?? 60000) || 0);
      let coinCost = Math.max(0, Number(parameters?.coinCost ?? 30000) || 0);
      let operationalCost = Math.max(0, Number(parameters?.operationalCost ?? 0) || 0);

      // Host & Admin live streaming salaries & incentives
      let hostSalary = Math.max(0, Number(parameters?.hostSalary ?? 0) || 0);
      const hostIncentivePerPackage = Math.max(0, Number(parameters?.hostIncentivePerPackage ?? 0) || 0);
      const hostIncentivePerPcs = Math.max(0, Number(parameters?.hostIncentivePerPcs ?? 0) || 0);
      let adminSalary = Math.max(0, Number(parameters?.adminSalary ?? 0) || 0);
      const adminIncentivePerPackage = Math.max(0, Number(parameters?.adminIncentivePerPackage ?? 0) || 0);

      let hppPerPcs = Math.max(1000, Number(parameters?.hppPerPcs ?? (storeContext?.hppAverage || 20000)) || 20000);
      const adminPercentage = Math.max(0, Math.min(50, Number(parameters?.adminPercentage ?? (storeContext?.adminPromoPercentage || 8.5)) || 8.5));
      const serviceFeePerOrder = Math.max(0, Number(parameters?.serviceFeePerOrder ?? (storeContext?.serviceFeePerOrder || 1250)) || 1250);
      const returnPercentage = Math.max(0, Math.min(50, Number(parameters?.returnPercentage ?? (storeContext?.estimateReturnPercentage || 3.0)) || 3.0));
      const packingCost = Math.max(0, Number(parameters?.packingCost ?? (storeContext?.averagePackingCost || 1500)) || 1500);

      const cleanedUserQuery = typeof userQuery === 'string' ? userQuery.trim() : '';

      // Intelligent extraction from natural language question / complaint
      if (cleanedUserQuery.length > 0) {
        const lowerQ = cleanedUserQuery.toLowerCase();

        // 1. Iklan / Ads
        const extractedAds = extractIndoValue(lowerQ, [
          /(?:iklan|ads|biaya iklan|budget iklan|bakar iklan)\s*(?:sebesar|seharga|sebanyak|rp|saya)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
          /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\s*(?:buat|untuk)\s*iklan/i,
        ]);
        if (extractedAds !== null && extractedAds > 0) adsCost = extractedAds;

        // 2. Koin / Voucher
        const extractedCoin = extractIndoValue(lowerQ, [
          /(?:koin|coin|voucher|sawer)\s*(?:sebesar|seharga|sebanyak|rp)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
          /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\s*(?:buat|untuk)\s*koin/i,
        ]);
        if (extractedCoin !== null && extractedCoin >= 0) coinCost = extractedCoin;

        // 3. HPP / Modal
        const extractedHpp = extractIndoValue(lowerQ, [
          /(?:modal|hpp|harga modal|kulakan|beli)\s*(?:sebesar|seharga|per\s*pcs)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu)?/i,
        ]);
        if (extractedHpp !== null && extractedHpp >= 1000) hppPerPcs = extractedHpp;

        // 4. Target Laba / Profit
        const percentMatch = lowerQ.match(/(?:laba|untung|keuntungan|profit|margin)\s*(?:mencapai|sebesar|minimal)?\s*(\d+(?:[.,]\d+)?)\s*%/i);
        if (percentMatch) {
          targetProfitPercent = Math.max(1, Math.min(90, parseFloat(percentMatch[1].replace(',', '.'))));
        } else {
          const extractedProfit = extractIndoValue(lowerQ, [
            /(?:laba|untung|keuntungan|profit|biar untung|agar untung|target untung|target laba)\s*(?:mencapai|sebesar|minimal|rp)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
            /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\s*(?:per\s*hari|\/hari)?\s*(?:keuntungan|laba|profit)/i,
          ]);
          if (extractedProfit !== null && extractedProfit > 0) targetProfit = extractedProfit;
        }

        // 5. Gaji Host
        const extractedHost = extractIndoValue(lowerQ, [
          /(?:gaji host|bayar host|host live)\s*(?:sebesar|seharga|sebanyak|rp)?\s*(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?/i,
        ]);
        if (extractedHost !== null && extractedHost > 0) hostSalary = extractedHost;
      }

      // Total daily fixed overhead
      const totalFixedOverhead = adsCost + coinCost + operationalCost + hostSalary + adminSalary;
      const totalFixedBurden = totalFixedOverhead + targetProfit;

      // Safe financial calculator ensuring viable positive margins
      function computeScenario(id: string, name: string, badge: string, pcs: number, rawSuggestedPrice: number, summary: string) {
        const totalHpp = pcs * hppPerPcs;
        const totalIncentive = hostIncentivePerPackage + adminIncentivePerPackage + (pcs * hostIncentivePerPcs);
        const variableCost = totalHpp + packingCost + serviceFeePerOrder + totalIncentive;
        
        // Ensure price is at least giving 20% gross margin above variable cost
        const retentionRate = Math.max(0.60, 1 - (adminPercentage + returnPercentage) / 100);
        const minViablePrice = Math.ceil(((variableCost + 10000) / retentionRate) / 1000) * 1000;
        const price = Math.max(minViablePrice, Math.round(rawSuggestedPrice / 1000) * 1000);

        const adminFee = Math.round((adminPercentage / 100) * price);
        const returnReserve = Math.round((returnPercentage / 100) * price);
        const margin = Math.max(1000, price - adminFee - returnReserve - variableCost);
        const marginPct = Number(((margin / price) * 100).toFixed(1));

        let minPkgs = 1;
        if (targetProfitType === 'nominal') {
          minPkgs = Math.max(1, Math.ceil(totalFixedBurden / margin));
        } else {
          const retentionFactor = 1 - (adminPercentage + returnPercentage + targetProfitPercent) / 100;
          const effMargin = Math.max(1000, price * retentionFactor - variableCost);
          minPkgs = Math.max(1, Math.ceil(totalFixedOverhead / effMargin));
        }

        const bepPkgs = totalFixedOverhead > 0 ? Math.max(1, Math.ceil(totalFixedOverhead / margin)) : 0;

        return {
          id,
          name,
          badge,
          pcsPerPackage: pcs,
          recommendedPrice: price,
          marginPerPackage: Math.round(margin),
          marginPercentage: marginPct,
          minPackagesNeeded: minPkgs,
          totalPcsNeeded: minPkgs * pcs,
          bepPackagesNeeded: bepPkgs,
          totalOmzetKotor: minPkgs * price,
          summary,
        };
      }

      // Base pricing model with healthy markup
      const p2 = Math.round(((hppPerPcs * 2) * 1.55 + 15000) / 1000) * 1000;
      const p3 = Math.round(((hppPerPcs * 3) * 1.50 + 18000) / 1000) * 1000;
      const p1 = Math.round((hppPerPcs * 1.80 + 12000) / 1000) * 1000;
      const p5 = Math.round(((hppPerPcs * 5) * 1.45 + 22000) / 1000) * 1000;

      const sc2 = computeScenario('bundling_2pcs', 'Bundling Hemat (Isi 2 Pcs)', 'Paling Populer & Seimbang', 2, p2, 'Sangat direkomendasikan saat sesi live streaming, menghemat ongkir pelanggan dan mempercepat perputaran barang.');
      const sc3 = computeScenario('bundling_3pcs', 'Bundling Best Seller (Isi 3 Pcs)', 'Rekomendasi Margin Profit', 3, p3, 'Margin profit per transaksi tinggi, hanya membutuhkan lebih sedikit pesanan untuk mencapai target laba.');
      const sc1 = computeScenario('bundling_1pcs', 'Satuan (Single 1 Pcs)', 'Penjualan Satuan Normal', 1, p1, 'Pilihan bagi pembeli yang baru pertama kali coba berbelanja di toko Anda.');
      const sc5 = computeScenario('bundling_5pcs', 'Bundling Jumbo / Grosir (Isi 5 Pcs)', 'Volume Cepat Habis', 5, p5, 'Paling efektif untuk cuci gudang / menghabiskan sisa ball persediaan stok.');

      // Tailored fallback response analyzing specific complaints or questions
      const lowerQ = cleanedUserQuery.toLowerCase();
      let tailoredComplaintDiagnosis = '';
      let tailoredAdvice: string[] = [];

      if (lowerQ.includes('boncos') || lowerQ.includes('rugi') || lowerQ.includes('bakar')) {
        tailoredComplaintDiagnosis = `Solusi Masalah Iklan Boncos: Beban iklan Rp ${adsCost.toLocaleString('id-ID')} dan koin Rp ${coinCost.toLocaleString('id-ID')} akan langsung menutup jika Anda beralih menjual Bundling 2 Pcs seharga Rp ${p2.toLocaleString('id-ID')} (target ${sc2.minPackagesNeeded} paket) atau Bundling 3 Pcs Rp ${p3.toLocaleString('id-ID')} (cukup ${sc3.minPackagesNeeded} paket/hari). Titik impas (BEP) operasional Anda hanya butuh ${sc2.bepPackagesNeeded} paket terjual!`;
        tailoredAdvice = [
          `Hentikan iklan bidding otomatis di siang hari; nyalakan iklan kata kunci spesifik hanya 15 menit sebelum sesi live dimulai sampai live berakhir.`,
          `Fokuskan iklan hanya ke 1 etalase utama (Bundling 2 Pcs) sebagai "Hero Product", jangan menyebar budget iklan ke banyak produk satuan.`,
          `Sebar koin Rp ${coinCost.toLocaleString('id-ID')} dalam bentuk 3 sesi "hujan koin" bernominal kecil saat penonton live ramai (peak hours) untuk memicu retensi penonton dan interaksi tap layar.`,
          `Pastikan host live selalu mengarahkan penonton: "Checkout sekarang mumpung voucher koin aktif di etalase 1!"`
        ];
      } else if (lowerQ.includes('sepi') || lowerQ.includes('anjlok') || lowerQ.includes('turun') || lowerQ.includes('sedikit')) {
        tailoredComplaintDiagnosis = `Solusi Penjualan Live Sepi: Jangan menurunkan harga satuan karena akan merusak margin. Alihkan strategi ke Bundling 2 Pcs Rp ${p2.toLocaleString('id-ID')} (cukup laku ${sc2.minPackagesNeeded} paket/hari) dan Bundling 3 Pcs Rp ${p3.toLocaleString('id-ID')} (${sc3.minPackagesNeeded} paket/hari) dengan memberikan value gratis voucher ongkir atau hadiah aksesoris kecil.`;
        tailoredAdvice = [
          `Gunakan teknik "Trigger Etalase Kaget": Buat bundling 2 pcs dengan diskon waktu terbatas (hanya 5 menit) untuk memicu kepanikan belanja (FOMO).`,
          `Tingkatkan interaksi di 10 menit pertama live dengan menyapa penonton dan meminta tap-tap layar sebelum mulai spill harga bundling.`,
          `Terapkan etalase anchor: Tampilkan produk 1 pcs seharga Rp ${p1.toLocaleString('id-ID')} agar bundling 2 pcs seharga Rp ${p2.toLocaleString('id-ID')} terlihat jauh lebih hemat dan menguntungkan bagi pembeli.`,
          `Atur jadwal live streaming rutin di jam prime-time (12.00-14.00 WIB atau 19.30-22.30 WIB).`
        ];
      } else if (lowerQ.includes('retur') || lowerQ.includes('tolak') || lowerQ.includes('kembali')) {
        tailoredComplaintDiagnosis = `Solusi Mengatasi Retur: Dengan asumsi cadangan retur ${returnPercentage}%, Anda disarankan menetapkan harga Bundling 2 Pcs di Rp ${p2.toLocaleString('id-ID')} (kuota ${sc2.minPackagesNeeded} paket) untuk menyerap potensi ongkir pengembalian tanpa menggerus target laba Rp ${targetProfit.toLocaleString('id-ID')}/hari.`;
        tailoredAdvice = [
          `Host wajib memperjelas detail ukuran (lingkar dada, panjang baju) dan kondisi fisik pakaian secara transparan saat live agar pembeli tidak merasa tertipu.`,
          `Sertakan kartu ucapan terima kasih dan petunjuk unboxing di dalam paket untuk mencegah komplain sepihak via COD.`,
          `Admin toko wajib langsung konfirmasi via chat marketplace untuk pesanan COD di atas Rp 100.000 guna memastikan pembeli benar-benar siap membayar.`,
          `Evaluasi jasa ekspedisi yang memiliki tingkat retur tertinggi dan aktifkan opsi penjemputan paket tercepat.`
        ];
      } else if (lowerQ.includes('host') || lowerQ.includes('gaji') || lowerQ.includes('closing')) {
        tailoredComplaintDiagnosis = `Solusi Kinerja Host & Gaji: Untuk menutup gaji host Rp ${hostSalary.toLocaleString('id-ID')}, admin Rp ${adminSalary.toLocaleString('id-ID')}, dan operasional iklan/koin (total beban Rp ${totalFixedBurden.toLocaleString('id-ID')}), targetkan host menjual ${sc2.minPackagesNeeded} paket Bundling 2 Pcs (Rp ${p2.toLocaleString('id-ID')}) atau cukup ${sc3.minPackagesNeeded} paket Bundling 3 Pcs (Rp ${p3.toLocaleString('id-ID')}) per hari.`;
        tailoredAdvice = [
          `Beri host target bertahap: "Target 1 = ${sc2.bepPackagesNeeded} paket bundling untuk tutup operasional harian, Target 2 = ${sc2.minPackagesNeeded} paket untuk bonus insentif".`,
          `Sediakan script closing standar untuk host: Ajarkan teknik membandingkan paket satuan vs bundling ("Kalau beli 1 pcs rugi ongkir kak, ambil paket hemat 2 pcs langsung gratis packing dan koin!").`,
          `Terapkan komisi bertingkat (tier) jika host berhasil menjual lebih dari ${sc2.minPackagesNeeded} paket bundling dalam satu sesi live.`,
          `Admin live streaming harus aktif mem-pin komentar keranjang dan membantu host menjawab pertanyaan ukuran penonton.`
        ];
      } else {
        tailoredComplaintDiagnosis = `Untuk menutup biaya iklan Rp ${adsCost.toLocaleString('id-ID')}, koin Rp ${coinCost.toLocaleString('id-ID')}, operasional & gaji${hostSalary + adminSalary > 0 ? ` (Rp ${(hostSalary + adminSalary).toLocaleString('id-ID')})` : ''} dengan target keuntungan Rp ${targetProfit.toLocaleString('id-ID')}/hari (total beban Rp ${totalFixedBurden.toLocaleString('id-ID')}), Anda disarankan menjual paket Bundling 2 Pcs seharga Rp ${p2.toLocaleString('id-ID')} dengan target ${sc2.minPackagesNeeded} paket/hari, atau Bundling 3 Pcs seharga Rp ${p3.toLocaleString('id-ID')} dengan target hanya ${sc3.minPackagesNeeded} paket/hari. Titik impas (BEP) Anda adalah ${sc2.bepPackagesNeeded} paket.`;
        tailoredAdvice = [
          `Fokuskan host live mempromosikan Bundling 2 & 3 pcs sebagai "Menu Utama" etalase, karena efisiensi biaya layanan dan packing jauh lebih hemat dibanding menjual satuan.`,
          `Alokasikan koin Rp ${coinCost.toLocaleString('id-ID')} saat traffic penonton berada di puncaknya (biasanya menit ke-20 sampai ke-45 per sesi) untuk menstimulasi checkout cepat.`,
          `Titik impas (BEP) toko Anda adalah ${sc2.bepPackagesNeeded} paket bundling 2 pcs. Setelah titik ini tercapai, setiap penjualan selanjutnya murni menjadi laba bersih.`,
          `Terapkan skema insentif per paket terjual untuk memacu host live lebih aktif melakukan upselling ke paket bundling.`
        ];
      }

      const fallbackData = {
        directAnswer: tailoredComplaintDiagnosis,
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
          step1: `Total Beban Harian Wajib Ditutup = Target Laba (Rp ${targetProfit.toLocaleString('id-ID')}) + Biaya Iklan (Rp ${adsCost.toLocaleString('id-ID')}) + Biaya Koin (Rp ${coinCost.toLocaleString('id-ID')}) + Gaji Pokok Host (Rp ${hostSalary.toLocaleString('id-ID')}) + Gaji Admin (Rp ${adminSalary.toLocaleString('id-ID')}) = Rp ${totalFixedBurden.toLocaleString('id-ID')}/hari.`,
          step2: `Margin Bersih per Paket = Harga Jual - Modal HPP - Admin Marketplace (${adminPercentage}%) - Biaya Layanan (Rp ${serviceFeePerOrder.toLocaleString('id-ID')}) - Packing (Rp ${packingCost.toLocaleString('id-ID')}) - Cadangan Retur (${returnPercentage}%) - Insentif Host & Admin.`,
          step3: `Minimum Kuota Penjualan = Total Beban Harian (Rp ${totalFixedBurden.toLocaleString('id-ID')}) dibagi Margin Bersih per Paket.`
        },
        strategicAdvice: tailoredAdvice
      };

      const apiKeyAvailable = Boolean(process.env.GEMINI_API_KEY);

      if (apiKeyAvailable) {
        try {
          const prompt = `Anda adalah CFO & Pakar Strategi Bisnis E-Commerce & Live Streaming Fashion (Shopee Live, TikTok Shop, Thrift, Distro).

PERTANYAAN / KELUHAN SELLER:
"${cleanedUserQuery || 'Jika dalam satu hari iklan 60k dan koin 30k berapa harga bundling yang dijual agar keuntungan bisa mencapai 1 jt/hari dan berapa minimum paket terjual?'}"

DATA FINANSIAL & BEBAN TOKO:
- Beban Tetap Harian: Rp ${totalFixedOverhead.toLocaleString('id-ID')} (Iklan: Rp ${adsCost.toLocaleString('id-ID')}, Koin: Rp ${coinCost.toLocaleString('id-ID')}, Gaji Host: Rp ${hostSalary.toLocaleString('id-ID')}, Gaji Admin: Rp ${adminSalary.toLocaleString('id-ID')})
- Target Laba Harian: Rp ${targetProfit.toLocaleString('id-ID')}
- Total Beban Wajib Ditutup: Rp ${totalFixedBurden.toLocaleString('id-ID')}
- Modal HPP Rata-rata per Pcs: Rp ${hppPerPcs.toLocaleString('id-ID')}
- Admin Marketplace: ${adminPercentage}% | Biaya Layanan: Rp ${serviceFeePerOrder.toLocaleString('id-ID')} | Packing: Rp ${packingCost.toLocaleString('id-ID')} | Retur: ${returnPercentage}%

SIMULASI HARGA REKOMENDASI:
- Bundling 2 pcs: Harga Rp ${p2.toLocaleString('id-ID')} (Margin Bersih Rp ${sc2.marginPerPackage.toLocaleString('id-ID')}, Kuota ${sc2.minPackagesNeeded} paket/hari, BEP ${sc2.bepPackagesNeeded} paket)
- Bundling 3 pcs: Harga Rp ${p3.toLocaleString('id-ID')} (Margin Bersih Rp ${sc3.marginPerPackage.toLocaleString('id-ID')}, Kuota ${sc3.minPackagesNeeded} paket/hari, BEP ${sc3.bepPackagesNeeded} paket)
- Satuan 1 pcs: Harga Rp ${p1.toLocaleString('id-ID')} (Margin Bersih Rp ${sc1.marginPerPackage.toLocaleString('id-ID')}, Kuota ${sc1.minPackagesNeeded} paket/hari)
- Bundling 5 pcs: Harga Rp ${p5.toLocaleString('id-ID')} (Margin Bersih Rp ${sc5.marginPerPackage.toLocaleString('id-ID')}, Kuota ${sc5.minPackagesNeeded} paket/hari)

TUGAS ANDA:
1. Respon secara langsung keluhan atau pertanyaan seller dengan bahasa profesional, solutif, empati, dan taktis.
2. Jika seller mengeluh (iklan boncos, toko sepi, retur tinggi, host susah jualan), berikan diagnosa penyebab dan solusi taktis bundling harga untuk membalikkan keadaan menjadi profit.
3. Sebutkan secara eksplisit harga jual bundling 2 & 3 pcs yang disarankan serta kuota paket yang harus terjual per hari agar target tercapai.
4. Berikan 3-4 tips taktis terapan untuk host live dan admin toko sesuai keluhan tersebut.

Berikan format JSON murni TANPA markdown:
{
  "directAnswer": string (jawaban 2-4 kalimat lugas menjawab keluhan/pertanyaan seller, menyebutkan harga jual bundling 2 & 3 pcs dan target kuota paket yang harus terjual),
  "recommendedPrice2pcs": number (harga bundling 2 pcs, misal ${p2}),
  "recommendedPrice3pcs": number (harga bundling 3 pcs, misal ${p3}),
  "recommendedPrice1pcs": number (harga satuan 1 pcs, misal ${p1}),
  "recommendedPrice5pcs": number (harga bundling 5 pcs, misal ${p5}),
  "strategicAdvice": string[] (3-4 tips taktis spesifik untuk host dan admin mengatasi keluhan seller)
}`;

          const parsed = await generateJsonWithAi(prompt, 0.2);
          if (parsed && typeof parsed === 'object') {
            const price2 = Number(parsed.recommendedPrice2pcs) > 0 ? Number(parsed.recommendedPrice2pcs) : p2;
            const price3 = Number(parsed.recommendedPrice3pcs) > 0 ? Number(parsed.recommendedPrice3pcs) : p3;
            const price1 = Number(parsed.recommendedPrice1pcs) > 0 ? Number(parsed.recommendedPrice1pcs) : p1;
            const price5 = Number(parsed.recommendedPrice5pcs) > 0 ? Number(parsed.recommendedPrice5pcs) : p5;

            const finalSc2 = computeScenario('bundling_2pcs', 'Bundling Hemat (Isi 2 Pcs)', 'Paling Populer & Seimbang', 2, price2, 'Sangat direkomendasikan saat sesi live streaming, menghemat ongkir pelanggan dan mempercepat perputaran barang.');
            const finalSc3 = computeScenario('bundling_3pcs', 'Bundling Best Seller (Isi 3 Pcs)', 'Rekomendasi Margin Profit', 3, price3, 'Margin profit per transaksi tinggi, hanya membutuhkan lebih sedikit pesanan untuk mencapai target laba.');
            const finalSc1 = computeScenario('bundling_1pcs', 'Satuan (Single 1 Pcs)', 'Penjualan Satuan Normal', 1, price1, 'Pilihan bagi pembeli yang baru pertama kali coba berbelanja di toko Anda.');
            const finalSc5 = computeScenario('bundling_5pcs', 'Bundling Jumbo / Grosir (Isi 5 Pcs)', 'Volume Cepat Habis', 5, price5, 'Paling efektif untuk cuci gudang / menghabiskan sisa ball persediaan stok.');

            const extractedParams = {
              targetProfit,
              targetProfitPercent,
              adsCost,
              coinCost,
              hostSalary,
              adminSalary,
              totalFixedBurden,
              hppPerPcs,
            };

            const formulaExplanation = {
              step1: `Total Beban Harian Wajib Ditutup = Target Laba (Rp ${targetProfit.toLocaleString('id-ID')}) + Biaya Iklan (Rp ${adsCost.toLocaleString('id-ID')}) + Biaya Koin (Rp ${coinCost.toLocaleString('id-ID')}) + Gaji Pokok Host (Rp ${hostSalary.toLocaleString('id-ID')}) + Gaji Admin (Rp ${adminSalary.toLocaleString('id-ID')}) = Rp ${totalFixedBurden.toLocaleString('id-ID')}/hari.`,
              step2: `Margin Bersih per Paket = Harga Jual - Modal HPP - Admin Marketplace (${adminPercentage}%) - Biaya Layanan (Rp ${serviceFeePerOrder.toLocaleString('id-ID')}) - Packing (Rp ${packingCost.toLocaleString('id-ID')}) - Cadangan Retur (${returnPercentage}%) - Insentif Host & Admin.`,
              step3: `Minimum Kuota Penjualan = Total Beban Harian (Rp ${totalFixedBurden.toLocaleString('id-ID')}) dibagi Margin Bersih per Paket.`
            };

            const strategicAdvice = Array.isArray(parsed.strategicAdvice) && parsed.strategicAdvice.length > 0
              ? parsed.strategicAdvice
              : fallbackData.strategicAdvice;

            const finalData = {
              directAnswer: parsed.directAnswer || fallbackData.directAnswer,
              extractedParams,
              scenarios: [finalSc2, finalSc3, finalSc1, finalSc5],
              formulaExplanation,
              strategicAdvice,
            };

            return res.json({ success: true, data: finalData, isAiGenerated: true });
          }
        } catch (apiErr: any) {
          console.info('Gemini models unavailable or experiencing spikes, serving precision financial engine:', apiErr?.message || apiErr);
        }
      }

      // Always return 200 with precision calculations even during AI downtime
      return res.json({ success: true, data: fallbackData, isAiGenerated: false });
    } catch (error: any) {
      console.error('Error in /api/ai/calculate-bundle:', error);
      // Even in fatal exception, return safe default without 500
      const safeDefaultPrice = 75000;
      return res.json({
        success: true,
        isAiGenerated: false,
        data: {
          directAnswer: 'Rekomendasi Bundling Live Streaming: Jual Paket Bundling 2 Pcs seharga Rp 75.000 dengan target penjualan minimal 25-30 paket per hari untuk menutup beban operasional harian dan mengamankan keuntungan bersih toko Anda.',
          extractedParams: {
            targetProfit: 1000000,
            adsCost: 60000,
            coinCost: 30000,
            totalFixedBurden: 1090000,
            hppPerPcs: 20000,
          },
          scenarios: [
            {
              id: 'bundling_2pcs',
              name: 'Bundling Hemat (Isi 2 Pcs)',
              badge: 'Paling Populer & Seimbang',
              pcsPerPackage: 2,
              recommendedPrice: 75000,
              marginPerPackage: 23500,
              marginPercentage: 31.3,
              minPackagesNeeded: 47,
              totalPcsNeeded: 94,
              bepPackagesNeeded: 4,
              totalOmzetKotor: 3525000,
              summary: 'Sangat direkomendasikan saat sesi live streaming, menghemat ongkir pelanggan dan mempercepat perputaran barang.',
            }
          ],
          strategicAdvice: [
            'Fokuskan host live mempromosikan Bundling 2 pcs sebagai menu utama etalase.',
            'Tebar koin pada menit ke-20 sampai ke-40 untuk menstimulasi checkout keranjang.',
            'Terapkan etalase anchor dengan produk 1 pcs agar bundling terlihat jauh lebih hemat.'
          ]
        }
      });
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
