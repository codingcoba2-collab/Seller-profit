import React, { useEffect, useState } from 'react';
import { ProcessingService, ProcessingRequest } from '../services/processingService';
import { Cpu, Zap, Activity } from 'lucide-react';
import { SoundFx } from '../services/soundFx';

export const ProcessingModal: React.FC = () => {
  const [request, setRequest] = useState<ProcessingRequest | null>(null);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    return ProcessingService.subscribe((req) => {
      setRequest(req);
      if (req) {
        setProgress(18);
        SoundFx.playProcessingSound();

        const duration = req.durationMs || 1400;
        const start = performance.now();
        const interval = setInterval(() => {
          const elapsed = performance.now() - start;
          const p = Math.min(100, Math.round((elapsed / duration) * 100));
          setProgress(p);
          if (p >= 100) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);
      }
    });
  }, []);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      {/* Background ambient pulse */}
      <div className="absolute w-72 h-72 rounded-full bg-[#25F4EE]/10 blur-3xl pointer-events-none" />

      {/* Holographic Processing Card */}
      <div className="relative w-full max-w-sm bg-[#0e1017] border border-[#25F4EE]/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(37,244,238,0.3)] text-white overflow-hidden text-center">
        {/* Holographic corner accents */}
        <div className="hologram-corner-tl" />
        <div className="hologram-corner-tr" />
        <div className="hologram-corner-bl" />
        <div className="hologram-corner-br" />

        {/* Laser scanline */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent animate-pulse" />

        {/* Center Animated Dual Ring Icon */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#25F4EE]/70 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border border-dotted border-[#FE2C55]/80 animate-spin-slow-reverse" />
          <div className="w-12 h-12 rounded-2xl bg-[#161823] border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(37,244,238,0.5)]">
            <Cpu className="w-6 h-6 text-[#25F4EE] animate-pulse" />
          </div>
        </div>

        {/* Header Title */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#25F4EE] tracking-widest uppercase mb-1">
          <Zap className="w-3.5 h-3.5 text-[#FE2C55]" />
          <span>{request.title}</span>
        </div>

        {/* Message */}
        <p className="text-xs text-zinc-300 font-medium mb-4 leading-relaxed">
          {request.message}
        </p>

        {/* Progress Bar & Counter */}
        <div className="space-y-1.5 text-left mb-2">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#25F4EE] animate-pulse" />
              SINKRONISASI DATA
            </span>
            <span className="text-[#25F4EE]">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-black/60 rounded-full border border-[#25F4EE]/40 p-0.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#00d2ff] rounded-full transition-all duration-75 shadow-[0_0_10px_#25F4EE]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom Sub-status */}
        <div className="text-[10px] font-mono text-zinc-500 tracking-wider">
          MEMASTIKAN INTEGRITAS PROTOCOL KEAMANAN
        </div>
      </div>
    </div>
  );
};
