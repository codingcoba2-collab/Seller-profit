import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Database, 
  HardDrive, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  HelpCircle, 
  ExternalLink,
  Layers,
  Zap,
  Lock,
  Cpu
} from 'lucide-react';
import { CurrentUser } from '../types';
import { FirestoreUsageMonitor } from '../components/FirestoreUsageMonitor';
import firebaseConfig from '../../firebase-applet-config.json';
import { SoundFx } from '../services/soundFx';

interface DeveloperMonitorViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DeveloperMonitorView: React.FC<DeveloperMonitorViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6 text-white font-sans overflow-x-hidden">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              SoundFx.playRobotButtonClick();
              onBackToDashboard();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition cursor-pointer active:scale-95 shrink-0"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-[#25F4EE]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Developer Console & Firestore Telemetry
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Mode Developer
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Pantau real-time kapasitas penyimpanan data dan jumlah operasi baca/tulis harian di Cloud Firestore.
            </p>
          </div>
        </div>

        {/* Console Link */}
        <div className="flex items-center gap-2">
          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Firebase Console Resmi</span>
          </a>
        </div>
      </div>

      {/* Main Interactive Telemetry Widget with Progress Bars */}
      <FirestoreUsageMonitor onNotify={onNotify} />

      {/* Developer FAQ & Architectural Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Penjelasan Batasan Gratis */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#161823]/80 border border-white/10 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] mb-2">
            <Activity className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-white">Batasan Kuota Spark Plan (Gratis)</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Google Firestore memberikan kuota gratis setiap hari:
          </p>
          <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
            <li><strong>50.000 Operasi Baca</strong> per hari</li>
            <li><strong>20.000 Operasi Tulis</strong> per hari</li>
            <li><strong>1 GB Kapasitas Penyimpanan</strong> permanen</li>
          </ul>
          <p className="text-[11px] text-emerald-400 font-semibold pt-1">
            ✓ Kuota direset otomatis setiap hari pada jam 07:00 WIB (00:00 UTC).
          </p>
        </div>

        {/* Card 2: Arsitektur Local-First Caching */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#161823]/80 border border-white/10 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-white">Mengapa Sangat Hemat Kuota?</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Aplikasi ini dirancang dengan prinsip <strong>Offline-First & Local Caching</strong>:
          </p>
          <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
            <li>Data selalu dibaca dari memori lokal (localStorage) dengan instan.</li>
            <li>Cloud hanya diakses saat ada perubahan nyata (realtime diffing).</li>
            <li>Pemindaian menggunakan <em>Count Server</em> (hanya 1 read per 1.000 dokumen).</li>
          </ul>
          <p className="text-[11px] text-zinc-400 pt-1">
            Sehingga pemakaian harian biasanya hanya berkisar 2% - 5% dari kuota gratis.
          </p>
        </div>

        {/* Card 3: Konfigurasi Terhubung */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#161823]/80 border border-white/10 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-white">Identitas Database Firestore</h4>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div>
              <span className="text-zinc-500 block">Project ID:</span>
              <span className="text-white truncate block">{firebaseConfig.projectId}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Database ID:</span>
              <span className="text-[#25F4EE] truncate block">{firebaseConfig.firestoreDatabaseId || 'default'}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
            Database ini terikat permanen pada file konfigurasi di repositori, sehingga jika project dibuka di akun mana pun, datanya tetap terhubung ke Firestore ini.
          </p>
        </div>
      </div>
    </div>
  );
};
