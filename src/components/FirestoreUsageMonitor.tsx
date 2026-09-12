import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Activity, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Layers, 
  RotateCcw,
  Sparkles,
  BarChart2,
  Clock
} from 'lucide-react';
import { 
  FirestoreTelemetry, 
  FirestoreUsageSummary, 
  FirestoreOperationLog, 
  FIRESTORE_LIMITS 
} from '../services/firestoreTelemetry';
import firebaseConfig from '../../firebase-applet-config.json';
import { SoundFx } from '../services/soundFx';

interface FirestoreUsageMonitorProps {
  onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
  compact?: boolean;
  onOpenFullView?: () => void;
}

export const FirestoreUsageMonitor: React.FC<FirestoreUsageMonitorProps> = ({
  onNotify,
  compact = false,
  onOpenFullView,
}) => {
  const [summary, setSummary] = useState<FirestoreUsageSummary>(() => FirestoreTelemetry.getSummary());
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<FirestoreOperationLog[]>(() => FirestoreTelemetry.getLogs());
  const [activeTab, setActiveTab] = useState<'bars' | 'collections' | 'logs'>('bars');

  useEffect(() => {
    const unsub = FirestoreTelemetry.subscribe((newSummary) => {
      setSummary(newSummary);
      setLogs(FirestoreTelemetry.getLogs());
    });
    return () => unsub();
  }, []);

  const handleScan = async () => {
    SoundFx.playRobotButtonClick();
    setIsScanning(true);
    try {
      const res = await FirestoreTelemetry.scanDatabase();
      setSummary(res);
      setLogs(FirestoreTelemetry.getLogs());
      onNotify?.(
        `Pemindaian cloud selesai: ${res.totalDocuments} total dokumen terdeteksi (${res.totalStorageKB} KB)`,
        'success'
      );
    } catch {
      onNotify?.('Gagal memindai Firestore Cloud.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSimulateRead = () => {
    SoundFx.playMenuSound();
    FirestoreTelemetry.recordReads(50, 'sales', 'Simulasi Pengujian Pembacaan Dokumen (+50 reads)');
    onNotify?.('+50 Dokumen dibaca dicatat ke meter harian.', 'info');
  };

  const handleSimulateWrite = () => {
    SoundFx.playRobotButtonClick();
    FirestoreTelemetry.recordWrites(10, 'sales', 'Simulasi Pengujian Penulisan Dokumen (+10 writes)');
    onNotify?.('+10 Dokumen ditulis dicatat ke meter harian.', 'info');
  };

  const handleResetMeter = () => {
    if (window.confirm('Reset hitungan pembacaan & penulisan harian kembali ke 0 untuk pengujian?')) {
      SoundFx.playRobotButtonClick();
      FirestoreTelemetry.resetDailyUsage();
      onNotify?.('Meter penggunaan harian direset ke 0.', 'info');
    }
  };

  // Helper color for progress bar
  const getReadProgressColor = (percent: number) => {
    if (percent < 50) return 'from-[#25F4EE] to-emerald-400';
    if (percent < 80) return 'from-amber-400 to-amber-500';
    return 'from-[#FE2C55] to-rose-600';
  };

  const getStorageProgressColor = (percent: number) => {
    if (percent < 50) return 'from-purple-500 to-indigo-400';
    if (percent < 80) return 'from-amber-400 to-orange-500';
    return 'from-[#FE2C55] to-rose-600';
  };

  const remainingReads = Math.max(0, summary.maxDailyReads - summary.readsToday);
  const remainingStorageKB = Math.max(0, summary.maxStorageKB - summary.totalStorageKB);

  return (
    <div className="spatial-card p-4 sm:p-6 rounded-2xl border border-white/10 bg-[#161823]/90 backdrop-blur-md shadow-xl text-white space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] shadow-[0_0_20px_rgba(37,244,238,0.25)] shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Firestore Database & Quota Telemetry
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              DB ID:{' '}
              <span className="font-mono text-zinc-300 font-bold">
                {firebaseConfig.firestoreDatabaseId || 'default'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-scan-firestore-database"
            onClick={handleScan}
            disabled={isScanning}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#25F4EE]/20 to-emerald-500/20 hover:from-[#25F4EE]/30 hover:to-emerald-500/30 border border-[#25F4EE]/50 text-[#25F4EE] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-xs disabled:opacity-50"
            title="Pindai jumlah dokumen live di cloud firestore sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Memindai...' : 'Pindai Ulang Cloud'}</span>
          </button>

          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="Buka Konsol Firebase Google"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Firebase Console</span>
          </a>

          {compact && onOpenFullView && (
            <button
              type="button"
              onClick={onOpenFullView}
              className="px-3 py-2 rounded-xl bg-[#25F4EE]/10 hover:bg-[#25F4EE]/20 border border-[#25F4EE]/30 text-[#25F4EE] text-xs font-bold transition cursor-pointer"
            >
              Layar Penuh →
            </button>
          )}
        </div>
      </div>

      {/* Overview Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Stat 1: Reads Today */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Baca Hari Ini</span>
            <Activity className="w-3.5 h-3.5 text-[#25F4EE]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#25F4EE] tracking-tight">
            {summary.readsToday.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Batas: 50.000</span>
            <span className="font-bold text-white">{summary.readPercentage}%</span>
          </div>
        </div>

        {/* Stat 2: Writes Today */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Tulis Hari Ini</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            {summary.writesToday.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Batas: 20.000</span>
            <span className="font-bold text-white">{summary.writePercentage}%</span>
          </div>
        </div>

        {/* Stat 3: Storage Used */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Kapasitas Data</span>
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-400 tracking-tight">
            {summary.totalStorageKB > 1024 
              ? `${summary.totalStorageMB} MB` 
              : `${summary.totalStorageKB} KB`}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Batas: 1 GB</span>
            <span className="font-bold text-white">{summary.storagePercentage}%</span>
          </div>
        </div>

        {/* Stat 4: Total Documents */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Total Dokumen</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            {summary.totalDocuments.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>11 Koleksi Toko</span>
            <span className="font-bold text-emerald-400 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Aman
            </span>
          </div>
        </div>
      </div>

      {/* MAIN PROGRESS BARS (REQUESTED BY USER) */}
      <div className="space-y-5 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#25F4EE]" />
            Indikator Bar Proses Kuota Firestore (Spark Plan Gratis)
          </h4>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            Reset kuota harian: 07:00 WIB
          </span>
        </div>

        {/* PROGRESS BAR 1: PENGGUNAAN BACA HARI INI */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white">1. Data yang Sudah Dibaca Hari Ini (Firestore Reads):</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/40">
                {summary.readsToday.toLocaleString('id-ID')} / {summary.maxDailyReads.toLocaleString('id-ID')} Dokumen
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <span>Sisa kuota: <strong className="text-white">{remainingReads.toLocaleString('id-ID')}</strong> reads</span>
              <span className="font-mono font-black text-sm text-[#25F4EE]">{summary.readPercentage}%</span>
            </div>
          </div>

          {/* Glowing Cyberpunk Progress Bar */}
          <div className="relative w-full h-5 rounded-full bg-zinc-900 border border-white/15 overflow-hidden p-0.5 shadow-inner">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${getReadProgressColor(summary.readPercentage)} transition-all duration-700 relative`}
              style={{ width: `${Math.min(100, Math.max(1, summary.readPercentage))}%` }}
            >
              {/* Shine animated beam */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>0 Dokumen</span>
            <span>25.000 (50%)</span>
            <span className="text-emerald-400 font-bold">50.000 Dokumen / Hari (100% Bebas Biaya)</span>
          </div>
        </div>

        {/* PROGRESS BAR 2: KAPASITAS DATA TERSIMPAN DI FIRESTORE */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white">2. Kapasitas Data yang Tersimpan (Storage Capacity):</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {summary.totalStorageKB.toLocaleString('id-ID')} KB / 1.048.576 KB (1 GB)
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <span>Tersisa: <strong className="text-white">{(remainingStorageKB / 1024).toFixed(1)} MB</strong></span>
              <span className="font-mono font-black text-sm text-purple-400">{summary.storagePercentage}%</span>
            </div>
          </div>

          {/* Progress Bar Storage */}
          <div className="relative w-full h-5 rounded-full bg-zinc-900 border border-white/15 overflow-hidden p-0.5 shadow-inner">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${getStorageProgressColor(summary.storagePercentage)} transition-all duration-700 relative`}
              style={{ width: `${Math.min(100, Math.max(0.5, summary.storagePercentage))}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>0 KB</span>
            <span>500 MB (50%)</span>
            <span className="text-purple-400 font-bold">1 GB Cloud Storage (Gratis Selamanya)</span>
          </div>
        </div>

        {/* PROGRESS BAR 3: OPERASI TULIS HARI INI */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white">3. Data yang Ditulis Hari Ini (Firestore Writes):</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {summary.writesToday.toLocaleString('id-ID')} / {summary.maxDailyWrites.toLocaleString('id-ID')} Dokumen
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <span>Batas Tulis: <strong className="text-white">20.000</strong>/hari</span>
              <span className="font-mono font-black text-sm text-emerald-400">{summary.writePercentage}%</span>
            </div>
          </div>

          {/* Progress Bar Writes */}
          <div className="relative w-full h-3 rounded-full bg-zinc-900 border border-white/10 overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#25F4EE] transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0.5, summary.writePercentage))}%` }}
            />
          </div>
        </div>

        {/* Status Notice Card */}
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-300">Status Akun Firestore: Sangat Aman (Spark Free Tier)</p>
              <p className="text-[11px] text-zinc-400">
                Sistem mengutamakan Local Caching + Diff Merging, sehingga pembacaan database ke Cloud sangat hemat dan tidak akan terkena limit ataupun tagihan.
              </p>
            </div>
          </div>
          <span className="hidden md:inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-[11px] whitespace-nowrap">
            0 RUPIAH / BULAN
          </span>
        </div>
      </div>

      {/* Tabs for Detailed Breakdown & Activity Logs (Non-compact mode or toggle) */}
      {!compact && (
        <div className="space-y-4 pt-2">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('bars')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bars'
                  ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/40'
                  : 'text-zinc-400 hover:text-white bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rincian Koleksi Data ({summary.collections.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/40'
                  : 'text-zinc-400 hover:text-white bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Aktivitas Realtime Terakhir ({logs.length})</span>
            </button>
          </div>

          {/* TAB 1: RINCIAN PER KOLEKSI DENGAN MINI PROGRESS BAR */}
          {activeTab === 'bars' && (
            <div className="space-y-2.5">
              <div className="text-xs text-zinc-400 mb-2 flex items-center justify-between">
                <span>Distribusi Data Tersimpan per Koleksi Firestore:</span>
                <span>Terakhir dipindai: {summary.lastScanTimestamp ? new Date(summary.lastScanTimestamp).toLocaleTimeString('id-ID') : 'Belum dipindai'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {summary.collections.map((col) => {
                  const percentOfDocs = summary.totalDocuments > 0 
                    ? Math.round((col.count / summary.totalDocuments) * 100) 
                    : 0;
                  const sizeKB = Math.round(col.estimatedBytes / 1024);

                  return (
                    <div 
                      key={col.name} 
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#25F4EE]/30 transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-white truncate block">{col.label}</span>
                          <span className="text-[10px] font-mono text-zinc-400">koleksi: {col.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-sm text-[#25F4EE]">{col.count.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-zinc-400 block">~{sizeKB} KB</span>
                        </div>
                      </div>

                      {/* Mini Bar */}
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#25F4EE] to-purple-500"
                          style={{ width: `${Math.max(1, percentOfDocs)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AKTIVITAS OPERASI REALTIME */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Log 40 Aktivitas Firestore Terakhir (Read, Write & Sync):</span>
                <button
                  type="button"
                  onClick={() => {
                    FirestoreTelemetry.clearLogs();
                    setLogs([]);
                    onNotify?.('Log aktivitas dibersihkan.', 'info');
                  }}
                  className="text-xs text-zinc-400 hover:text-rose-400 underline cursor-pointer"
                >
                  Bersihkan Log
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-zinc-400 text-xs">
                  Belum ada log operasi tercatat pada sesi ini.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between gap-2 hover:bg-black/60 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          log.type === 'read' ? 'bg-[#25F4EE]/20 text-[#25F4EE]' :
                          log.type === 'write' ? 'bg-emerald-500/20 text-emerald-400' :
                          log.type === 'delete' ? 'bg-[#FE2C55]/20 text-[#FE2C55]' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-zinc-300 truncate">{log.description}</span>
                        <span className="text-zinc-500">[{log.collection}]</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-zinc-400 text-[10px]">
                        <span className="font-bold text-white">+{log.count}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEVELOPER SIMULATOR & TESTING BUTTONS */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Developer Testing & Simulation Tools
              </span>
              <span className="text-[10px] text-zinc-400">Uji langsung animasi & respon bar proses</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-simulate-reads"
                onClick={handleSimulateRead}
                className="px-3 py-1.5 rounded-lg bg-[#25F4EE]/10 hover:bg-[#25F4EE]/20 border border-[#25F4EE]/30 text-[#25F4EE] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulasi +50 Reads</span>
              </button>

              <button
                type="button"
                id="btn-simulate-writes"
                onClick={handleSimulateWrite}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulasi +10 Writes</span>
              </button>

              <button
                type="button"
                id="btn-reset-meter"
                onClick={handleResetMeter}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-zinc-300 hover:text-rose-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Meter Hari Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
