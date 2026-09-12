import React, { useState } from 'react';
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
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
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

const DEVELOPER_PASSCODE = 'Qwertypoiuy1';

export const DeveloperMonitorView: React.FC<DeveloperMonitorViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === DEVELOPER_PASSCODE) {
      SoundFx.playSuccessSound();
      setIsUnlocked(true);
      setErrorMessage('');
      onNotify?.('Akses Developer & Telemetri Firebase Berhasil Dibuka.', 'success');
    } else {
      SoundFx.playRobotErrorSound();
      setErrorMessage('Password developer salah. Akses ditolak.');
      onNotify?.('Password developer salah.', 'error');
    }
  };

  // If locked, render developer password challenge screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6 text-white font-sans">
        <button
          type="button"
          onClick={() => {
            SoundFx.playRobotButtonClick();
            onBackToDashboard();
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#161823] border border-amber-500/30 shadow-2xl space-y-5 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">
              Akses Developer Terkunci
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Monitoring status kuota dan telemetri Google Cloud Firestore dilindungi password master developer.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">
                Password Developer
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Masukkan password developer..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0b0c10] border border-white/15 focus:border-amber-400 focus:outline-hidden text-sm text-white placeholder-zinc-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMessage && (
                <p className="text-xs text-[#FE2C55] font-bold mt-1">
                  {errorMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm transition shadow-lg cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Akses Developer</span>
            </button>
          </form>

          <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-500">
            Hanya developer berwenang yang dapat mengakses halaman ini.
          </div>
        </div>
      </div>
    );
  }

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
