import React, { useState, useEffect } from 'react';
import { ShoppingBag, Cpu, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface LoadingScreenProps {
  message?: string;
  storeName?: string;
  durationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Memuat Sistem Akuntansi Marketplace...',
  storeName,
  durationMs = 4500,
}) => {
  const [progress, setProgress] = useState(12);

  // Play loading telemetry audio automatically and increment progress counter
  useEffect(() => {
    let isStillLoading = true;

    // Trigger time machine warp sound automatically
    const startAudio = async () => {
      await SoundFx.unlockAudio();
      if (!isStillLoading) return;
      SoundFx.playTimeMachineWarp();
    };
    startAudio();

    // Unlock on any first gesture automatically
    const onUserInteraction = async () => {
      if (!isStillLoading) return;
      await SoundFx.unlockAudio();
      if (!isStillLoading) return;
      SoundFx.playTimeMachineWarp();
    };

    window.addEventListener('pointerdown', onUserInteraction, { capture: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('click', onUserInteraction, { capture: true });
    window.addEventListener('mousedown', onUserInteraction, { capture: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true });

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);
      if (pct >= 98) {
        // Cut audio as soon as loading reaches completion
        SoundFx.stopLoadingAudio();
      }
      if (pct >= 100) {
        clearInterval(interval);
        SoundFx.stopLoadingAudio();
      }
    }, 50);

    return () => {
      isStillLoading = false;
      clearInterval(interval);
      SoundFx.stopLoadingAudio();
      window.removeEventListener('pointerdown', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('mousedown', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
  }, [durationMs]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080b] text-white px-4 select-none overflow-hidden"
    >
      {/* Background ambient neon glow & grid */}
      <div className="absolute w-96 h-96 rounded-full bg-[#FE2C55]/15 blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/4" />
      <div className="absolute w-96 h-96 rounded-full bg-[#25F4EE]/15 blur-3xl pointer-events-none translate-x-1/3 translate-y-1/4" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,244,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,244,238,0.03)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />

      {/* Center Sci-Fi Loading Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-5">
        
        {/* Logo with Holographic Dual Orbital Rings */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer Cyber Reticle Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#25F4EE]/60 animate-spin-slow" />
          {/* Inner Counter-Rotating Hex Ring */}
          <div className="absolute inset-2 rounded-full border border-dotted border-[#FE2C55]/70 animate-spin-slow-reverse" />
          
          {/* Radar Sweep Line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent animate-radar-sweep opacity-70" />
          </div>

          {/* Center Brand Icon */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#161823] border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(37,244,238,0.4)]">
            <ShoppingBag className="w-8 h-8 text-[#25F4EE] drop-shadow-[0_0_10px_#25F4EE]" />
          </div>
        </div>

        {/* Title & Store Info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
            <h2 className="text-xl font-black tracking-wider uppercase text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              Seller Profit
            </h2>
            <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-ping" />
          </div>

          {storeName && (
            <div className="inline-block px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
              {storeName}
            </div>
          )}

          <p className="text-xs text-zinc-400 font-medium">
            {message}
          </p>
        </div>

        {/* ========================================================= */}
        {/* SCI-FI HOLOGRAPHIC LOADING INTERFACE (Below Logo)        */}
        {/* ========================================================= */}
        <div className="w-full spatial-card rounded-2xl p-4 border border-[#25F4EE]/30 space-y-3 shadow-[0_0_30px_rgba(37,244,238,0.15)] relative overflow-hidden">
          {/* Holographic scanning laser line */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent animate-pulse" />

          {/* Sci-Fi Corner Accents */}
          <div className="hologram-corner-tl" />
          <div className="hologram-corner-tr" />
          <div className="hologram-corner-bl" />
          <div className="hologram-corner-br" />

          {/* Telemetry Header */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-zinc-400 border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-[#25F4EE]">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>CORE PROTOCOL v4.8</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>QUANTUM SYNC</span>
            </div>
          </div>

          {/* Segmented Sci-Fi Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <span className="text-zinc-300 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-[#FE2C55]" />
                CALIBRATING SYSTEM
              </span>
              <span className="text-[#25F4EE]">{progress}%</span>
            </div>

            {/* Glowing Segmented Outer Track */}
            <div className="relative w-full h-3.5 bg-black/60 rounded-md border border-[#25F4EE]/40 p-0.5 overflow-hidden flex items-center">
              <div 
                className="h-full bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#00d2ff] rounded-xs shadow-[0_0_12px_#25F4EE] transition-all duration-150 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Diagonal stripes on active progress */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.3)_4px,rgba(0,0,0,0.3)_8px)]" />
              </div>
            </div>
          </div>

          {/* Sci-Fi Live Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[9px] text-zinc-500">SYS.CLOCK</div>
              <div className="text-[10px] font-bold text-[#25F4EE]">0.024 MS</div>
            </div>
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[9px] text-zinc-500">MEM.FLUX</div>
              <div className="text-[10px] font-bold text-amber-300">99.4% STABLE</div>
            </div>
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[9px] text-zinc-500">SECURITY</div>
              <div className="text-[10px] font-bold text-[#FE2C55]">LVL 5 ENCRYPT</div>
            </div>
          </div>

          {/* Mini Equalizer Waveform Bars */}
          <div className="flex items-center justify-center gap-1 pt-1">
            {[40, 75, 100, 60, 90, 45, 80, 55, 95, 70, 85, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-[#25F4EE]/70 animate-pulse"
                style={{
                  height: `${Math.max(4, Math.round((h * (progress / 100)) * 0.16))}px`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: '600ms',
                }}
              />
            ))}
          </div>
        </div>

        {/* Status Prompt */}
        <div className="text-[11px] font-mono text-zinc-400">
          &gt; Memuat modul sistem &amp; realtime data...
        </div>
      </div>
    </div>
  );
};
