import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Box, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Link as LinkIcon, 
  FolderOpen,
  Info,
  Trash2,
  Maximize2
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface MeshyModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelName: string | null;
  activeModelSize: number | null;
  onLoadModelBuffer: (buffer: ArrayBuffer, name: string) => Promise<boolean>;
  onLoadModelUrl: (url: string) => Promise<boolean>;
  onResetToDefault: () => void;
  isMeshyActive: boolean;
  modelScale: number;
  onScaleChange: (scale: number) => void;
  modelOffsetY: number;
  onOffsetYChange: (offset: number) => void;
}

export const MeshyModelModal: React.FC<MeshyModelModalProps> = ({
  isOpen,
  onClose,
  activeModelName,
  activeModelSize,
  onLoadModelBuffer,
  onLoadModelUrl,
  onResetToDefault,
  isMeshyActive,
  modelScale,
  onScaleChange,
  modelOffsetY,
  onOffsetYChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'public' | 'help'>('upload');
  const [modelUrlInput, setModelUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setFeedback({ type: 'info', message: `Membaca file "${file.name}"...` });
    SoundFx.unlockAudio();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const success = await onLoadModelBuffer(arrayBuffer, file.name);
      if (success) {
        setFeedback({ 
          type: 'success', 
          message: `Model 3D "${file.name}" (${formatBytes(file.size)}) berhasil dimuat dan aktif di Beranda!` 
        });
        SoundFx.playSkinTouchSound();
      } else {
        setFeedback({ 
          type: 'error', 
          message: 'Format file tidak valid. Pastikan file adalah binary GLB dari Meshy AI (meskipun telah di-rename jadi .txt).' 
        });
      }
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        message: `Gagal memproses file: ${err?.message || 'Format tidak didukung'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelUrlInput.trim()) return;

    setIsLoading(true);
    setFeedback({ type: 'info', message: 'Mengunduh model 3D dari URL...' });

    try {
      const ok = await onLoadModelUrl(modelUrlInput.trim());
      if (ok) {
        setFeedback({ type: 'success', message: 'Model 3D berhasil diunduh dan aktif!' });
      } else {
        setFeedback({ type: 'error', message: 'Gagal memuat model dari URL tersebut. Pastikan CORS diizinkan atau gunakan upload file langsung.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Error: ${err?.message || 'Koneksi gagal'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPublicModel = async (filename: string) => {
    setIsLoading(true);
    setFeedback({ type: 'info', message: `Memeriksa /${filename}...` });

    try {
      const ok = await onLoadModelUrl(`/${filename}`);
      if (ok) {
        setFeedback({ type: 'success', message: `Model /${filename} berhasil ditemukan dan dimuat!` });
      } else {
        setFeedback({ 
          type: 'error', 
          message: `File /${filename} belum ada di folder public. Silakan upload file ke folder /public/ lewat file explorer.` 
        });
      }
    } catch {
      setFeedback({ 
        type: 'error', 
        message: `File /${filename} belum ditemukan di folder /public/.` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#11131c] border border-white/15 rounded-3xl p-5 sm:p-6 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FE2C55]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Model 3D Meshy AI
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30">
                  GLB / GLTF
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Integrasi model 3D kustom untuk tampilan beranda 360°
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Model Status */}
        <div className="my-3 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full ${isMeshyActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
            <div className="truncate">
              <span className="text-zinc-400">Model Aktif: </span>
              <span className="font-bold text-white">
                {isMeshyActive ? (activeModelName || 'Model Meshy AI Kustom') : 'Model Bawaan (Sophia 3D Scan)'}
              </span>
              {isMeshyActive && activeModelSize && (
                <span className="text-[10px] text-[#25F4EE] ml-1.5 font-mono">({formatBytes(activeModelSize)})</span>
              )}
            </div>
          </div>

          {isMeshyActive && (
            <button
              type="button"
              onClick={() => {
                onResetToDefault();
                setFeedback({ type: 'info', message: 'Kembali ke model bawaan Sophia 3D.' });
              }}
              className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[11px] shrink-0 flex items-center gap-1 transition cursor-pointer"
              title="Reset ke model bawaan"
            >
              <Trash2 className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-[#25F4EE] text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'public' ? 'bg-[#25F4EE] text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Folder /public
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'url' ? 'bg-[#25F4EE] text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            URL Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'help' ? 'bg-[#FE2C55] text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Info Error
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-2xl mb-4 text-xs flex items-start gap-2 border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : feedback.type === 'error'
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 text-blue-400 animate-spin mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{feedback.message}</div>
          </div>
        )}

        {/* Tab Contents */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* TAB 1: UPLOAD FILE DIRECTLY */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf,.txt,.bin,model/gltf-binary,model/gltf+json,application/octet-stream,*/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-[#25F4EE] bg-white/[0.02] hover:bg-[#25F4EE]/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#25F4EE]/20 text-[#25F4EE] mb-3 transition group-hover:scale-110">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-black text-white mb-1">
                  Pilih File Model 3D (.glb / .txt)
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mb-3">
                  Pilih file model 3D dari komputermu. File <span className="text-[#25F4EE] font-bold">.glb</span> maupun yang sudah di-rename jadi <span className="text-[#25F4EE] font-bold">.txt</span> otomatis terbaca!
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-zinc-200 text-xs font-bold group-hover:bg-[#25F4EE] group-hover:text-black transition">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Jelajahi File...</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-zinc-400 leading-relaxed">
                💡 <strong className="text-zinc-200">Tips:</strong> Model 3D yang kamu upload disimpan secara offline di browser (IndexedDB). Jika kamu refresh halaman atau membuka kembali, model 3D Meshy AI milikmu akan tetap langsung tampil!
              </div>
            </div>
          )}

          {/* TAB 2: PUBLIC FOLDER */}
          {activeTab === 'public' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#25F4EE]" />
                  Letakkan File di Folder Public
                </h4>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Kamu bisa langsung meng-upload file model ke folder <code className="text-[#25F4EE] bg-black/60 px-1 py-0.5 rounded">/public/</code> melalui panel File Explorer AI Studio di sebelah kiri.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-zinc-300">Pilih nama file yang sudah kamu upload:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['model.glb', 'meshy_model.glb', 'avatar.glb', 'model.txt'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleCheckPublicModel(name)}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition cursor-pointer hover:border-[#25F4EE]/50 flex items-center justify-between"
                    >
                      <span className="font-mono text-zinc-200 font-bold">/{name}</span>
                      <span className="text-[10px] text-[#25F4EE] font-bold">Muat →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: URL LINK */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-zinc-400 text-[11px] leading-relaxed">
                Masukkan URL langsung ke file GLB Meshy AI (misal dari hosting CDN, Firebase Storage, atau link export Meshy):
              </div>

              <div className="space-y-1.5">
                <label className="block text-zinc-300 font-bold">URL Model 3D (.glb):</label>
                <input
                  type="url"
                  placeholder="https://.../model.glb"
                  value={modelUrlInput}
                  onChange={(e) => setModelUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#25F4EE]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !modelUrlInput.trim()}
                className="w-full py-2.5 rounded-xl bg-[#25F4EE] hover:bg-[#20ded8] disabled:opacity-50 text-black font-black uppercase text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                Unduh & Terapkan Model
              </button>
            </form>
          )}

          {/* TAB 4: PENJELASAN ERROR "INVALID ARGUMENT" */}
          {activeTab === 'help' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 space-y-2">
                <h4 className="font-bold text-[#FE2C55] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Kenapa Muncul "Invalid Argument" di Chat?
                </h4>
                <p className="text-zinc-300 text-[11px]">
                  File <strong>.glb</strong> adalah format <strong>biner murni</strong> (berisi jutaan byte heksadesimal, posisi titik koordinat 3D, dan tekstur gambar kompresi).
                </p>
                <p className="text-zinc-300 text-[11px]">
                  Ketika file <code className="text-white bg-black/40 px-1 rounded">.glb</code> di-rename menjadi <code className="text-white bg-black/40 px-1 rounded">.txt</code>, isinya <strong>tetap biner</strong> (bukan karakter teks UTF-8 huruf alfabet).
                </p>
                <p className="text-zinc-300 text-[11px]">
                  Sistem chat AI Studio menganggap file <code className="text-white bg-black/40 px-1 rounded">.txt</code> sebagai teks dokumen bacaan. Begitu menemukan byte biner asing / null bytes, server AI menolak dengan error <strong className="text-[#FE2C55]">"Invalid Argument"</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Solusi yang Sudah Kami Pasang:
                </h4>
                <p className="text-zinc-300 text-[11px]">
                  Kamu tidak perlu mengirim file lewat chat lagi! Cukup klik tab <strong>"Upload File"</strong> di atas, lalu pilih file modelmu (baik yang berakhiran <code className="text-white bg-black/40 px-1 rounded">.glb</code> maupun <code className="text-white bg-black/40 px-1 rounded">.txt</code>).
                </p>
                <p className="text-zinc-300 text-[11px]">
                  Sistem Three.js di beranda akan langsung membedah struktur biner GLTF dan menampilkannya dalam bentuk 3D interaktif 360° yang bisa diputar bebas!
                </p>
              </div>
            </div>
          )}

          {/* Model Display Adjustments (Scale & Offset Y) */}
          {isMeshyActive && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-[#25F4EE]" />
                Penyesuaian Tampilan 3D
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Ukuran (Skala):</span>
                    <span className="font-mono text-[#25F4EE]">{modelScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="3.0"
                    step="0.05"
                    value={modelScale}
                    onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-[#25F4EE]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Tinggi Posisi (Y):</span>
                    <span className="font-mono text-[#25F4EE]">{modelOffsetY.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.05"
                    value={modelOffsetY}
                    onChange={(e) => onOffsetYChange(parseFloat(e.target.value))}
                    className="w-full accent-[#25F4EE]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px]">Powered by Three.js &amp; GLTFLoader</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
