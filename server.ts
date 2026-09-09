import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { processAiCalculateBundle } from './server/pricingAi';

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
      genAI = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return genAI;
  }

  // Cooldown cache to track model rate limits (429) and high-demand spikes (503)
  const modelCooldowns = new Map<string, number>();

  // Resilient JSON generator with automatic fallback across fast models with adequate per-call timeout
  async function generateJsonWithAi(prompt: string, systemInstruction?: string, temperature = 0.4) {
    const aiClient = getAI();
    // Prioritized model fallback list as specified in gemini-api skill
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    const now = Date.now();
    let lastError: any = null;

    for (const model of candidateModels) {
      const cooldownUntil = modelCooldowns.get(model) || 0;
      if (now < cooldownUntil) {
        continue;
      }

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout calling model ${model} after 20000ms`)), 20000)
        );

        const response: any = await Promise.race([
          aiClient.models.generateContent({
            model,
            contents: prompt,
            config: {
              ...(systemInstruction ? { systemInstruction } : {}),
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
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
        const isDemand = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');

        let cooldownDuration = 15000;
        if (isQuota) {
          const matchDelay = errMsg.match(/retry in (\d+(?:\.\d+)?)s/i);
          cooldownDuration = matchDelay ? Math.ceil(parseFloat(matchDelay[1]) * 1000) : 30000;
        } else if (isDemand) {
          cooldownDuration = 10000;
        }

        modelCooldowns.set(model, Date.now() + cooldownDuration);
        console.info(`[AI Service] Model ${model} temporarily unavailable (${isQuota ? '429 Quota' : isDemand ? '503 High Demand' : 'rate-limited'}). Next retry in ${Math.round(cooldownDuration / 1000)}s.`);
        continue;
      }
    }
    throw lastError || new Error('All AI models currently in rate-limit cooldown or unavailable');
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

          const parsed = await generateJsonWithAi(prompt, undefined, 0.2);
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

  // AI Bundling Price & Multi-Channel Pricing Consultant Endpoint
  app.post('/api/ai/calculate-bundle', async (req, res) => {
    try {
      const result = await processAiCalculateBundle(req.body, (prompt, sysInst, temp) =>
        generateJsonWithAi(prompt, sysInst, temp)
      );
      return res.json(result);
    } catch (error: any) {
      console.info('[AI Service] Process bundle completed with fallback calculation.');
      try {
        // Run fallback calculation directly without AI
        const fallbackResult = await processAiCalculateBundle(
          { ...req.body, userQuery: '' },
          async () => null
        );
        return res.json(fallbackResult);
      } catch (fbErr: any) {
        return res.status(500).json({
          success: false,
          error: 'Gagal memproses kalkulasi harga: ' + (fbErr?.message || fbErr)
        });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
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
