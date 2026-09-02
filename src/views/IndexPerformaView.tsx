import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, Employee } from '../types';
import { formatRupiah, formatNumber, roleLabels, roleBadgeColors } from '../utils/formatters';
import { 
  Award, 
  Trophy, 
  Flame, 
  Clock, 
  TrendingUp, 
  ArrowLeft,
  Star, 
  Zap,
  Target,
  BarChart3,
  Users,
  Activity,
  Package,
  Sparkles
} from 'lucide-react';

interface IndexPerformaViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
}

export const IndexPerformaView: React.FC<IndexPerformaViewProps> = ({
  currentUser,
  onBackToDashboard,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const attendance = StorageService.getAttendance(currentUser.storeId);
  const sales = StorageService.getSales(currentUser.storeId);

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
        // 100% dari Kehadiran, Kedisiplinan & Kapasitas shift (target: 20 hari/shift)
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

  // Overall Statistics Metrics (Requirement 11)
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without stage labels (Requirement 5 & 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-performa"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Indeks &amp; Evaluasi Performa Kinerja Pegawai
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Statistik produktivitas Host live streaming, ketepatan shift tim, serta perankingan kinerja toko
            </p>
          </div>
        </div>
      </div>

      {/* STATISTIK KPI DASHBOARD (Requirement 11) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Rata-Rata Indeks</span>
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
          <p className="text-[11px] text-zinc-400">Siaran streaming shopee</p>
        </div>
      </div>

      {/* Top Performers Banner (Podium) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {performanceData.slice(0, 3).map((item, idx) => (
          <div
            key={item.emp.id}
            className={`p-6 rounded-3xl border shadow-2xl space-y-3 relative overflow-hidden ${
              idx === 0
                ? 'bg-gradient-to-br from-[#161823] to-[#0b0c10] border-[#FE2C55]/50 shadow-[#FE2C55]/10'
                : 'bg-[#161823] border-white/10'
            }`}
          >
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

            <div>
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

            {/* Visual Index Progress Bar */}
            <div className="space-y-1 pt-1">
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
              <div className="text-[11px] text-zinc-400 pt-2 border-t border-white/10 flex justify-between items-center">
                <span>Omzet: <strong className="text-white">{formatRupiah(item.totalOmzet)}</strong></span>
                <span className="text-zinc-500">|</span>
                <span>{item.totalPcs} pcs ({item.hostLiveHours} jam)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabel Lengkap Performa dengan Progress Bar */}
      <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#25F4EE]" />
            <span>Evaluasi Lengkap &amp; Statistik Performa Pegawai</span>
          </h3>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
