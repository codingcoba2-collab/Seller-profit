import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Shirt,
  User,
  Sun,
  Activity,
  Cloud,
  Check,
  RotateCcw,
  Palette,
  Box,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AvatarStudioConfig,
  AvatarSettingsService,
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  EYE_COLOR_PRESETS,
  JERSEY_COLOR_PRESETS,
  LIGHTING_PRESETS,
  POSE_PRESETS,
  DEFAULT_AVATAR_CONFIG,
} from '../services/avatarSettingsService';
import { SoundFx } from '../services/soundFx';
import { ProcessingService } from '../services/processingService';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AvatarStudioConfig;
  onChangeConfig: (newConfig: AvatarStudioConfig) => void;
  onOpenMeshyUpload?: () => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onOpenMeshyUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'apparel' | 'body' | 'lighting' | 'pose' | 'engine'>('apparel');
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSuccessMsg, setCloudSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = (patch: Partial<AvatarStudioConfig>) => {
    SoundFx.playRobotButtonClick();
    const updated = { ...config, ...patch };
    onChangeConfig(updated);
  };

  const handleSaveToCloud = async () => {
    SoundFx.playOutfitEquipSound();
    setIsSavingCloud(true);
    setCloudSuccessMsg(null);

    ProcessingService.show({
      title: 'SINKRONISASI AVATAR KE CLOUD',
      message: 'Mendaftarkan pengaturan 3D ke Firestore agar langsung dinikmati di semua HP...',
      durationMs: 1200,
    });

    const success = await AvatarSettingsService.saveToCloud(config);
    setIsSavingCloud(false);

    if (success) {
      setCloudSuccessMsg('Karakter berhasil disimpan ke Cloud! Semua pengunjung di HP lain akan melihat avatar ini.');
      setTimeout(() => setCloudSuccessMsg(null), 5000);
    } else {
      alert('Gagal menyinkronkan ke cloud. Data tetap tersimpan di browser ini.');
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan semua pengaturan avatar ke konfigurasi resmi default?')) {
      SoundFx.playRobotButtonClick();
      onChangeConfig({ ...DEFAULT_AVATAR_CONFIG });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-zinc-950 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-white select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FE2C55]/20 to-[#C70101]/20 border border-[#FE2C55]/40 text-[#FE2C55] shadow-[0_0_15px_rgba(254,44,85,0.25)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-white">
                  Studio Pengembangan Karakter 3D
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Sync
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Kustomisasi anatomi, jersey, nomor, toko, dan sinkronkan otomatis ke semua HP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/10 bg-black/40 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('apparel')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'apparel'
                ? 'bg-[#FE2C55] text-white shadow-[0_0_15px_rgba(254,44,85,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Jersey & Apparel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('body')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'body'
                ? 'bg-[#25F4EE] text-black shadow-[0_0_15px_rgba(37,244,238,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Fisik & Anatomi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lighting')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'lighting'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Pencahayaan Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pose')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'pose'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Pose & Gerak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Model 3D Engine</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* ================================================================= */}
          {/* TAB 1: JERSEY & APPAREL                                            */}
          {/* ================================================================= */}
          {activeTab === 'apparel' && (
            <div className="space-y-5">
              {/* Back Name & Number Customization */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#FE2C55]" />
                    Nomor Punggung & Nama Toko di Jersey
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">Tercetak di Punggung 3D</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      Nama Punggung / Nama Toko (Maks. 16 Karakter)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={config.backName}
                      onChange={(e) => handleUpdate({ backName: e.target.value.toUpperCase() })}
                      placeholder="CONTOH: SELLER PROFIT"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white font-bold tracking-wider placeholder-zinc-500 focus:outline-none focus:border-[#FE2C55]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      Nomor Punggung (1-99)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={config.backNumber}
                      onChange={(e) => handleUpdate({ backNumber: e.target.value.slice(0, 2) })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white font-black text-center text-base focus:outline-none focus:border-[#FE2C55]"
                    />
                  </div>
                </div>
              </div>

              {/* Jersey Color Presets */}
              <div className="space-y-2">
                <label className="font-bold text-white flex items-center gap-2">
                  <span>Pilihan Warna Jersey Resmi</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    (Kerah & lis otomatis serasi)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {JERSEY_COLOR_PRESETS.map((preset, idx) => {
                    const isSelected = config.jerseyColor === preset.base;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          handleUpdate({
                            jerseyColor: preset.base,
                            accentColor: preset.accent,
                            shortsColor: preset.shorts,
                          })
                        }
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-[#FE2C55] ring-2 ring-[#FE2C55]/40 shadow-lg'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-xl border border-white/30 shrink-0 shadow-inner"
                          style={{ backgroundColor: preset.base }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{preset.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{preset.base}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">Warna Utama Jersey</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.jerseyColor}
                      onChange={(e) => handleUpdate({ jerseyColor: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-zinc-300">{config.jerseyColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">Warna Lis Kerah (Aksen)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-zinc-300">{config.accentColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">Warna Celana (Shorts)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.shortsColor}
                      onChange={(e) => handleUpdate({ shortsColor: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-zinc-300">{config.shortsColor}</span>
                  </div>
                </div>
              </div>

              {/* Material Finish */}
              <div className="space-y-2">
                <label className="font-bold text-white">Tekstur & Shading Bahan (Material Finish)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'matte', name: 'Sport Matte', desc: 'Doff tanpa silau' },
                    { id: 'satin', name: 'Silky Sportswear', desc: 'Kilau serat satin' },
                    { id: 'glossy', name: 'High Gloss', desc: 'Mengkilap cerah' },
                    { id: 'metallic', name: 'Cyber Armor', desc: 'Pantulan metalik' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleUpdate({ materialFinish: m.id as any })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        config.materialFinish === m.id
                          ? 'bg-[#FE2C55]/20 border-[#FE2C55] text-white font-bold'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                      }`}
                    >
                      <p className="text-xs">{m.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: FISIK & ANATOMI                                            */}
          {/* ================================================================= */}
          {activeTab === 'body' && (
            <div className="space-y-5">
              {/* Skin Tone */}
              <div className="space-y-2">
                <label className="font-bold text-white flex items-center justify-between">
                  <span>Tone Warna Kulit (Skin Complexion)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{config.skinTone}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SKIN_TONE_PRESETS.map((skin) => {
                    const isSelected = config.skinToneId === skin.id || config.skinTone === skin.color;
                    return (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => handleUpdate({ skinTone: skin.color, skinToneId: skin.id })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-[#25F4EE] ring-2 ring-[#25F4EE]/40'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full border border-white/40 shrink-0 shadow"
                          style={{ backgroundColor: skin.color }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white">{skin.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{skin.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hair Color */}
              <div className="space-y-2">
                <label className="font-bold text-white">Warna Rambut (Hair Color)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HAIR_COLOR_PRESETS.map((hair) => {
                    const isSelected = config.hairColorId === hair.id || config.hairColor === hair.color;
                    return (
                      <button
                        key={hair.id}
                        type="button"
                        onClick={() => handleUpdate({ hairColor: hair.color, hairColorId: hair.id })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-[#25F4EE] ring-2 ring-[#25F4EE]/40'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full border border-white/40 shrink-0 shadow"
                          style={{ backgroundColor: hair.color }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white">{hair.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{hair.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eye Color */}
              <div className="space-y-2">
                <label className="font-bold text-white">Warna Iris Mata (Eye Color)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EYE_COLOR_PRESETS.map((eye) => {
                    const isSelected = config.eyeColorId === eye.id || config.eyeColor === eye.color;
                    return (
                      <button
                        key={eye.id}
                        type="button"
                        onClick={() => handleUpdate({ eyeColor: eye.color, eyeColorId: eye.id })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-[#25F4EE] ring-2 ring-[#25F4EE]/40'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/40 shrink-0 shadow"
                          style={{ backgroundColor: eye.color }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{eye.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: PENCAHAYAAN STUDIO                                         */}
          {/* ================================================================= */}
          {activeTab === 'lighting' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300">
                Pilih atmosfer pencahayaan studio Three.js untuk memberikan pantulan bayangan dramatis pada model 3D:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LIGHTING_PRESETS.map((light) => {
                  const isSelected = config.lightingPreset === light.id;
                  return (
                    <button
                      key={light.id}
                      type="button"
                      onClick={() => handleUpdate({ lightingPreset: light.id as any })}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-white text-xs sm:text-sm">{light.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{light.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: POSE & GERAK                                               */}
          {/* ================================================================= */}
          {activeTab === 'pose' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300">
                Atur gestur tubuh dan gaya animasi karakter saat disapa atau sedang memamerkan jersey:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POSE_PRESETS.map((p) => {
                  const isSelected = config.pose === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleUpdate({ pose: p.id as any })}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/25 border-purple-500 ring-2 ring-purple-500/40 shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-white text-xs sm:text-sm">{p.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: MODEL 3D ENGINE & MESHY AI                                 */}
          {/* ================================================================= */}
          {activeTab === 'engine' && (
            <div className="space-y-5">
              {/* Engine Choice */}
              <div className="space-y-2">
                <label className="font-bold text-white">Pilih Tipe Tampilan Utama</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleUpdate({ engineMode: 'meshy' })}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      config.engineMode === 'meshy'
                        ? 'bg-[#25F4EE]/20 border-[#25F4EE] ring-2 ring-[#25F4EE]/40 text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Box className="w-4 h-4 text-[#25F4EE]" />
                      <span className="font-black text-xs">Model 3D Meshy AI</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Model 3D poligon utuh (GLB) bawaan server resmi yang dapat dimuat di semua HP.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate({ engineMode: 'webgl' })}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      config.engineMode === 'webgl'
                        ? 'bg-[#FE2C55]/20 border-[#FE2C55] ring-2 ring-[#FE2C55]/40 text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-[#FE2C55]" />
                      <span className="font-black text-xs">Sophia Digital Human</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Karakter 3D Three.js dengan anatomi fisik, kulit berpori, dan jersey kustom.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate({ engineMode: 'scan' })}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      config.engineMode === 'scan'
                        ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-xs">Photorealistic 360°</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Turntable 360 derajat visual otentik dengan titik interaktif hotspot.
                    </p>
                  </button>
                </div>
              </div>

              {/* Meshy AI Bundled Model Info */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Model 3D Bawaan Resmi Terdaftar
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">/meshy_mu_athlete.glb</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Model 3D atlet resmi Manchester United telah dibundel langsung di server aplikasi. 
                  Setiap orang yang menginstal atau membuka aplikasi di ponsel lain akan **langsung melihat model 3D ini secara otomatis** tanpa perlu mengunggah file secara manual!
                </p>
              </div>

              {/* Scale and Position Controls */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#25F4EE]" />
                    Penyesuaian Skala & Posisi Model 3D
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ scale: 1.0, offsetY: 0.0 })}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    Reset Ukuran
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-300">
                    <span>Skala Ukuran (Scale):</span>
                    <span className="font-mono text-[#25F4EE]">{config.scale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={config.scale}
                    onChange={(e) => handleUpdate({ scale: parseFloat(e.target.value) })}
                    className="w-full accent-[#25F4EE]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-300">
                    <span>Ketinggian Vertikal (Offset Y):</span>
                    <span className="font-mono text-[#25F4EE]">{config.offsetY.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.05"
                    value={config.offsetY}
                    onChange={(e) => handleUpdate({ offsetY: parseFloat(e.target.value) })}
                    className="w-full accent-[#25F4EE]"
                  />
                </div>
              </div>

              {/* Upload alternative model button */}
              {onOpenMeshyUpload && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMeshyUpload();
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <Box className="w-4 h-4 text-[#25F4EE]" />
                    <span>Upload File 3D Meshy AI Kustom Baru (.glb / .txt)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cloud Success Alert */}
        {cloudSuccessMsg && (
          <div className="px-5 py-2.5 bg-emerald-500/20 border-t border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cloudSuccessMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-white/10 bg-zinc-950">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSavingCloud}
              onClick={handleSaveToCloud}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black text-xs font-black tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Cloud className="w-4 h-4 text-black" />
              <span>{isSavingCloud ? 'Menyimpan...' : 'Simpan ke Cloud (Aktif di Semua HP)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
