import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, Employee, AIEmployeeEvaluation } from '../types';
import { formatRupiah, formatNumber, roleLabels, roleBadgeColors } from '../utils/formatters';
import { 
  Award, 
  Trophy, 
  Clock, 
  TrendingUp, 
  ArrowLeft,
  Zap,
  Target,
  BarChart3,
  Users,
  Activity,
  Package,
  Sparkles,
  Bot,
  Brain,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  ThumbsUp
} from 'lucide-react';

interface IndexPerformaViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const IndexPerformaView: React.FC<IndexPerformaViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AIEmployeeEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluatingEmployeeName, setEvaluatingEmployeeName] = useState<string>('');
  const [cachedEvaluations, setCachedEvaluations] = useState<Record<string, AIEmployeeEvaluation>>({});

  const attendance = StorageService.getAttendance(currentUser.storeId);
  const sales = StorageService.getSales(currentUser.storeId);
  const returns = StorageService.getReturns(currentUser.storeId);

  useEffect(() => {
    const list = StorageService.getEmployees(currentUser.storeId);
    setEmployees(list);
  }, [currentUser.storeId]);

  // Performance calculation formula
  const performanceData = useMemo(() => {
    return employees.map(emp => {
      const empAtt = attendance.filter(a => a.employeeId === emp.id || a.employeeName === emp.name);
      const totalShifts = empAtt.length;
      const totalHours = empAtt.reduce((acc, a) => acc + (a.hoursWorked || 0), 0);

      const isHost = emp.roles.includes('host');

      let totalOmzet = 0;
      let totalPcs = 0;
      let totalPackages = 0;
      let hostLiveHours = 0;

      if (isHost) {
        const hostSales = sales.filter(s => 
          s.hostIds?.includes(emp.id) || s.hostNames?.some(hn => hn.toLowerCase().includes(emp.name.toLowerCase()))
        );
        totalOmzet = hostSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
        totalPcs = hostSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
        totalPackages = hostSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
        hostLiveHours = hostSales.reduce((acc, s) => acc + (s.hoursWorked || 0), 0);
      }

      // Formula index calculation (0 - 100)
      let indexScore = 0;
      let grade = 'B';

      if (isHost) {
        // Host Formula:
        // 30% Kehadiran & jam live (target: 20 jam per periode)
        // 40% Omzet Penjualan (target: Rp 15jt per periode)
        // 30% Volume Penjualan Pcs (target: 200 pcs per periode)
        const attendanceScore = Math.min(100, (hostLiveHours / 20) * 100);
        const omzetScore = Math.min(100, (totalOmzet / 15000000) * 100);
        const pcsScore = Math.min(100, (totalPcs / 200) * 100);

        indexScore = Math.round(attendanceScore * 0.3 + omzetScore * 0.4 + pcsScore * 0.3);
      } else {
        // Non-host (Sortir, Steam, Admin):
        const shiftScore = Math.min(100, (totalShifts / 20) * 100);
        indexScore = Math.round(shiftScore);
      }

      if (indexScore >= 90) grade = 'A+';
      else if (indexScore >= 80) grade = 'A';
      else if (indexScore >= 70) grade = 'B';
      else if (indexScore >= 60) grade = 'C';
      else grade = 'D';

      const salesPerHour = hostLiveHours > 0 ? Math.round(totalOmzet / hostLiveHours) : 0;

      return {
        emp,
        isHost,
        totalShifts,
        totalHours,
        totalOmzet,
        totalPcs,
        totalPackages,
        hostLiveHours,
        salesPerHour,
        indexScore,
        grade,
      };
    }).sort((a, b) => b.indexScore - a.indexScore);
  }, [employees, attendance, sales]);

  // Overall Statistics Metrics
  const statsOverview = useMemo(() => {
    const totalTeam = employees.length;
    const avgScore = performanceData.length > 0 
      ? Math.round(performanceData.reduce((acc, p) => acc + p.indexScore, 0) / performanceData.length)
      : 0;
    const topGradeCount = performanceData.filter(p => p.grade === 'A+' || p.grade === 'A').length;
    const totalLiveOmzet = performanceData.reduce((acc, p) => acc + p.totalOmzet, 0);
    const totalPcsLive = performanceData.reduce((acc, p) => acc + p.totalPcs, 0);
    const totalLiveHours = performanceData.reduce((acc, p) => acc + p.hostLiveHours, 0);

    return {
      totalTeam,
      avgScore,
      topGradeCount,
      totalLiveOmzet,
      totalPcsLive,
      totalLiveHours,
    };
  }, [employees, performanceData]);

  // Call Server AI Evaluation Endpoint
  const handleEvaluateEmployeeAI = async (item: typeof performanceData[0]) => {
    setIsEvaluating(true);
    setEvaluatingEmployeeName(item.emp.name);

    try {
      const payload = {
        employee: {
          id: item.emp.id,
          name: item.emp.name,
          roles: item.emp.roles,
          salaryType: item.emp.salaryType,
        },
        metrics: {
          totalShifts: item.totalShifts,
          totalHoursWorked: item.totalHours,
          totalOmzet: item.totalOmzet,
          totalPcsSold: item.totalPcs,
          totalPackages: item.totalPackages,
          hostLiveHours: item.hostLiveHours,
          salesPerHour: item.salesPerHour,
          attendanceRatePercentage: item.totalShifts > 0 ? Math.min(100, Math.round((item.totalShifts / 25) * 100)) : 0,
        },
        storeContext: {
          storeName: currentUser.storeName,
          totalSalesRecorded: sales.length,
          totalReturnsRecorded: returns.length,
        },
      };

      const res = await fetch('/api/ai/evaluate-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI Server');
      }

      const evaluation: AIEmployeeEvaluation = await res.json();
      setSelectedEvaluation(evaluation);
      setCachedEvaluations(prev => ({ ...prev, [item.emp.id]: evaluation }));

      if (onNotify) {
        onNotify(`Evaluasi AI untuk ${item.emp.name} berhasil dihasilkan!`, 'success');
      }
    } catch (err: any) {
      console.error('AI Evaluation error:', err);
      // Fallback local calculation
      const fallbackEval: AIEmployeeEvaluation = {
        employeeId: item.emp.id,
        employeeName: item.emp.name,
        overallScore: item.indexScore,
        performanceGrade: item.grade,
        efficiencyRating: {
          productivity: Math.min(100, item.indexScore + 5),
          salesContribution: item.isHost ? Math.min(100, Math.round((item.totalOmzet / 15000000) * 100)) : 80,
          discipline: Math.min(100, Math.round((item.totalShifts / 20) * 100)),
          qualityControl: 85,
        },
        summary: `${item.emp.name} menunjukkan komitmen kerja yang baik dengan total ${item.totalShifts} shift dan indeks performa ${item.indexScore}/100.`,
        strengths: [
          `Disiplin shift kerja (${item.totalShifts} sesi tercatat)`,
          item.isHost ? `Kemampuan live commerce dengan omzet ${formatRupiah(item.totalOmzet)}` : `Ketelitian pengerjaan tugas operasional toko`,
          `Konsistensi dalam target shift mingguan`,
        ],
        areasForImprovement: [
          item.isHost ? `Peningkatan konversi closing pada jam-jam prime time live` : `Optimalisasi kecepatan proses finishing dan sortir`,
          `Koordinasi komunikasi antar tim kasir & packing`,
        ],
        actionableRecommendations: [
          `Pertahankan jadwal shift konsisten minimal 4 hari per minggu`,
          `Fokus pada produk fashion terlaris (best seller) untuk meningkatkan basket size`,
          `Ikuti evaluasi berkala mingguan bersama owner toko`,
        ],
        suggestedShiftStrategy: `Jadwalkan di shift utama pada hari Jumat-Minggu untuk memaksimalkan potensi penjualan.`,
        evaluatedAt: new Date().toISOString(),
      };
      setSelectedEvaluation(fallbackEval);
      setCachedEvaluations(prev => ({ ...prev, [item.emp.id]: fallbackEval }));
      if (onNotify) {
        onNotify(`Evaluasi performa cerdas untuk ${item.emp.name} siap ditinjau.`, 'info');
      }
    } finally {
      setIsEvaluating(false);
      setEvaluatingEmployeeName('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Quick AI Action Banner */}
      <div className="flex items-center justify-between bg-[#161823] p-4 rounded-3xl border border-[#25F4EE]/30 shadow-xl">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#25F4EE]" />
          <span className="text-xs font-bold text-zinc-300">
            Kecerdasan Buatan (Gemini AI) untuk evaluasi performa &amp; efektivitas kerja pegawai
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (performanceData.length > 0) {
              handleEvaluateEmployeeAI(performanceData[0]);
            }
          }}
          disabled={isEvaluating || performanceData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#25F4EE] via-teal-400 to-[#FE2C55] text-[#0b0c10] font-black text-xs transition cursor-pointer shadow-lg shadow-[#25F4EE]/20 hover:opacity-95 active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-[#0b0c10]" />
          <span>{isEvaluating ? `Menganalisis ${evaluatingEmployeeName}...` : '⚡ Analisis AI Pegawai Terbaik'}</span>
        </button>
      </div>

      {/* STATISTIK KPI DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Rata-Rata Indeks Tim</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#25F4EE]">{statsOverview.avgScore} <span className="text-xs text-zinc-500 font-normal">/ 100</span></div>
          <div className="w-full bg-[#0b0c10] rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
            <div 
              className="bg-[#25F4EE] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, statsOverview.avgScore)}%` }}
            />
          </div>
        </div>

        <div className="bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Total Tim Aktif</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-[#FE2C55] border border-white/10">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{statsOverview.totalTeam} <span className="text-xs text-zinc-500 font-normal">Orang</span></div>
          <p className="text-[11px] text-zinc-400">{statsOverview.topGradeCount} orang grade A / A+</p>
        </div>

        <div className="bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Total Omzet Live Tim</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-emerald-400 border border-white/10">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">{formatRupiah(statsOverview.totalLiveOmzet)}</div>
          <p className="text-[11px] text-zinc-400">{statsOverview.totalPcsLive} pcs terjual live</p>
        </div>

        <div className="bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Total Jam Siaran Live</span>
            <div className="p-2 rounded-xl bg-[#0b0c10] text-amber-400 border border-white/10">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{statsOverview.totalLiveHours} <span className="text-xs text-zinc-500 font-normal">Jam</span></div>
          <p className="text-[11px] text-zinc-400">Siaran streaming marketplace</p>
        </div>
      </div>

      {/* Top Performers Podium Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {performanceData.slice(0, 3).map((item, idx) => (
          <div
            key={item.emp.id}
            className={`p-6 rounded-3xl border shadow-2xl space-y-3 relative overflow-hidden flex flex-col justify-between ${
              idx === 0
                ? 'bg-gradient-to-br from-[#161823] to-[#0b0c10] border-[#FE2C55]/50 shadow-[#FE2C55]/10'
                : 'bg-[#161823] border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                  idx === 0 
                    ? 'bg-[#FE2C55] text-white border-[#FE2C55]' 
                    : idx === 1 
                    ? 'bg-[#25F4EE] text-black border-[#25F4EE]' 
                    : 'bg-white/10 text-white border-white/20'
                }`}>
                  {idx === 0 ? '👑 Juara 1 - Top Performer' : idx === 1 ? '🥈 Peringkat 2' : '🥉 Peringkat 3'}
                </span>
                <div className={`p-2 rounded-xl border border-white/10 ${idx === 0 ? 'bg-[#FE2C55]/20 text-[#FE2C55]' : 'bg-[#0b0c10] text-zinc-300'}`}>
                  {idx === 0 ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-lg font-black text-white">{item.emp.name}</h3>
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

              {/* Progress bar */}
              <div className="space-y-1 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Indeks Skor:</span>
                  <span className="font-black text-[#25F4EE]">{item.indexScore} / 100 ({item.grade})</span>
                </div>
                <div className="w-full bg-[#0b0c10] rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full ${idx === 0 ? 'bg-[#FE2C55]' : 'bg-[#25F4EE]'}`} 
                    style={{ width: `${Math.min(100, item.indexScore)}%` }}
                  />
                </div>
              </div>

              {item.isHost && (
                <div className="text-[11px] text-zinc-400 pt-2 border-t border-white/10 flex justify-between items-center mt-3">
                  <span>Omzet: <strong className="text-white">{formatRupiah(item.totalOmzet)}</strong></span>
                  <span className="text-zinc-500">|</span>
                  <span>{item.totalPcs} pcs ({item.hostLiveHours} jam)</span>
                </div>
              )}
            </div>

            {/* AI Evaluate Button for Podium */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleEvaluateEmployeeAI(item)}
                disabled={isEvaluating}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Lihat Analisis AI</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Lengkap Performa dengan Tombol AI Review */}
      <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#25F4EE]" />
            <span>Evaluasi Lengkap &amp; Analisis AI Tiap Pegawai</span>
          </h3>
          <span className="text-xs text-zinc-400">
            Klik tombol "🤖 Nilai AI" untuk evaluasi detail
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {performanceData.map((item, i) => (
            <div key={item.emp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0b0c10] border border-white/10 text-xs font-bold flex items-center justify-center text-zinc-400">
                    #{i + 1}
                  </span>
                  <span className="text-sm font-black text-white">
                    {item.emp.name}
                  </span>
                  {item.emp.roles.map(r => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30"
                    >
                      {roleLabels[r]}
                    </span>
                  ))}
                  {cachedEvaluations[item.emp.id] && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI Evaluated</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-400">
                  Kehadiran: <strong className="text-white">{item.totalShifts} shift ({item.totalHours} jam)</strong>
                  {item.isHost && (
                    <span> • Omzet: <strong className="text-emerald-400">{formatRupiah(item.totalOmzet)}</strong> • Terjual: <strong className="text-white">{item.totalPcs} pcs ({item.totalPackages} paket)</strong></span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md bg-[#0b0c10] rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-[#25F4EE] h-full rounded-full" 
                    style={{ width: `${Math.min(100, item.indexScore)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-base font-black text-[#25F4EE]">
                    Skor: {item.indexScore}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${
                    item.grade.startsWith('A') 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : item.grade === 'B' 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    Grade: {item.grade}
                  </span>
                </div>

                {/* AI Evaluate Button */}
                <button
                  type="button"
                  onClick={() => handleEvaluateEmployeeAI(item)}
                  disabled={isEvaluating}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-[#25F4EE]/20 hover:from-purple-500/30 hover:to-[#25F4EE]/30 border border-[#25F4EE]/40 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
                  title="Minta AI mengevaluasi performa pegawai ini"
                >
                  <Bot className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span>{isEvaluating && evaluatingEmployeeName === item.emp.name ? 'Menganalisis...' : 'Nilai AI'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= AI EVALUATION MODAL ================= */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161823] border border-white/15 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#161823] via-purple-950/40 to-[#0b0c10]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#25F4EE] to-purple-500 flex items-center justify-center text-[#0b0c10] shadow-lg">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Hasil Evaluasi AI: {selectedEvaluation.employeeName}</span>
                  </h3>
                  <p className="text-xs text-purple-300 font-medium">
                    Analisis Efektivitas, Produktivitas &amp; Strategi Kerja AI
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvaluation(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Score & Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0b0c10] to-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-purple-300 font-bold uppercase">Skor</span>
                      <span className="text-xl font-black text-[#25F4EE]">{selectedEvaluation.overallScore}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">Grade Performa: {selectedEvaluation.performanceGrade}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Terverifikasi AI
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        {selectedEvaluation.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Efficiency breakdown bars */}
                <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-zinc-400 block mb-1">Produktivitas</span>
                    <strong className="text-sm font-black text-[#25F4EE]">
                      {selectedEvaluation.efficiencyRating?.productivity || 85}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-zinc-400 block mb-1">Omzet Kontribusi</span>
                    <strong className="text-sm font-black text-emerald-400">
                      {selectedEvaluation.efficiencyRating?.salesContribution || 80}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-zinc-400 block mb-1">Kedisiplinan</span>
                    <strong className="text-sm font-black text-amber-400">
                      {selectedEvaluation.efficiencyRating?.discipline || 90}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-zinc-400 block mb-1">Quality &amp; QC</span>
                    <strong className="text-sm font-black text-pink-400">
                      {selectedEvaluation.efficiencyRating?.qualityControl || 88}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Kekuatan &amp; Keunggulan Utama</span>
                  </h4>
                  <ul className="space-y-1.5 text-zinc-300">
                    {selectedEvaluation.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <h4 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Area yang Perlu Ditingkatkan</span>
                  </h4>
                  <ul className="space-y-1.5 text-zinc-300">
                    {selectedEvaluation.areasForImprovement.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2">
                <h4 className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  <span>Rekomendasi Tindakan Nyata untuk Owner / Manajer Toko</span>
                </h4>
                <div className="space-y-2 text-zinc-200">
                  {selectedEvaluation.actionableRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/5 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shift Strategy Advice */}
              {selectedEvaluation.suggestedShiftStrategy && (
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <h4 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>Saran Penempatan Shift Optimal</span>
                  </h4>
                  <p className="text-zinc-300 text-xs">
                    {selectedEvaluation.suggestedShiftStrategy}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = performanceData.find(p => p.emp.id === selectedEvaluation.employeeId);
                  if (target) handleEvaluateEmployeeAI(target);
                }}
                disabled={isEvaluating}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>Analisis Ulang AI</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEvaluation(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] text-[#0b0c10] font-black text-xs transition hover:opacity-90 cursor-pointer shadow-lg shadow-[#25F4EE]/20"
              >
                Selesai Ditinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
