import React, { useState, useRef, useEffect } from 'react';
import { RoutePath } from '../services/navigation';
import { CurrentUser } from '../types';
import { SoundFx } from '../services/soundFx';
import { 
  MessageCircle, 
  Calculator, 
  User, 
  Home, 
  Megaphone, 
  Volume2, 
  X, 
  Command
} from 'lucide-react';

interface FloatingAssistiveNavProps {
  currentRoute: RoutePath;
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onOpenProfile: () => void;
}

const clampPosition = (x: number, y: number) => {
  const winW = typeof window !== 'undefined' ? window.innerWidth : 380;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 700;
  const maxX = Math.max(12, winW - 68);
  const maxY = Math.max(60, winH - 76);
  return {
    x: Math.min(Math.max(12, x), maxX),
    y: Math.min(Math.max(60, y), maxY),
  };
};

export const FloatingAssistiveNav: React.FC<FloatingAssistiveNavProps> = ({
  currentRoute,
  currentUser,
  onNavigate,
  onOpenProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('seller_profit_assistive_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return clampPosition(parsed.x, parsed.y);
        }
      }
    } catch {}
    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 68 : 300;
    const defaultY = typeof window !== 'undefined' ? window.innerHeight - 150 : 500;
    return clampPosition(defaultX, defaultY);
  });

  const buttonRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const currentPosRef = useRef(position);
  currentPosRef.current = position;

  // Re-clamp position on window resize to guarantee it never disappears off-screen
  useEffect(() => {
    const handleResize = () => {
      const clamped = clampPosition(currentPosRef.current.x, currentPosRef.current.y);
      setPosition(clamped);
      if (buttonRef.current) {
        buttonRef.current.style.left = `${clamped.x}px`;
        buttonRef.current.style.top = `${clamped.y}px`;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAction = (action: () => void) => {
    SoundFx.playRobotButtonClick();
    action();
    setIsOpen(false);
  };

  // Hardware-accelerated pointer drag handlers with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: currentPosRef.current.x, y: currentPosRef.current.y };

    if (buttonRef.current) {
      buttonRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;

    if (Math.hypot(dx, dy) > 6) {
      hasMovedRef.current = true;
    }

    const clamped = clampPosition(startPosRef.current.x + dx, startPosRef.current.y + dy);

    // Direct DOM styling for maximum 120 FPS buttery smoothness without React re-render lag
    if (buttonRef.current) {
      buttonRef.current.style.left = `${clamped.x}px`;
      buttonRef.current.style.top = `${clamped.y}px`;
    }
    currentPosRef.current = clamped;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (!hasMovedRef.current) {
      // Clean tap without drag: open/close menu
      SoundFx.playRobotButtonClick();
      setIsOpen((prev) => !prev);
      return;
    }

    // Magnetic snap to nearest edge (iOS Assistive Touch behavior)
    const winW = typeof window !== 'undefined' ? window.innerWidth : 380;
    const snapX = currentPosRef.current.x < winW / 2 ? 16 : winW - 68;
    const finalPos = clampPosition(snapX, currentPosRef.current.y);

    if (buttonRef.current) {
      buttonRef.current.style.transition = 'left 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2), top 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2)';
      buttonRef.current.style.left = `${finalPos.x}px`;
      buttonRef.current.style.top = `${finalPos.y}px`;
    }

    setPosition(finalPos);
    try {
      localStorage.setItem('seller_profit_assistive_pos', JSON.stringify(finalPos));
    } catch {}
  };

  return (
    <>
      {/* Expanded iOS Assistive Touch Menu Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            id="assistive-touch-panel"
            onClick={(e) => e.stopPropagation()}
            className="spatial-card relative w-full max-w-xs rounded-3xl border border-white/20 bg-[#161823] text-white p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scale-up space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[#25F4EE]">
                  <Command className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Pintasan Cepat (iOS Touch)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Shortcuts */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Live Chat */}
              <button
                type="button"
                id="btn-assistive-livechat"
                onClick={() => handleAction(() => onNavigate('/informasi/live-chat'))}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#25F4EE]/15 to-transparent border border-[#25F4EE]/30 hover:border-[#25F4EE] hover:bg-[#25F4EE]/20 transition group cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] mb-1.5 group-hover:scale-110 transition shadow-[0_0_15px_rgba(37,244,238,0.3)]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Live Chat</span>
                <span className="text-[10px] text-zinc-400">Real-time chat</span>
              </button>

              {/* 2. Kalkulasi Paket */}
              <button
                type="button"
                id="btn-assistive-kalkulasi"
                onClick={() => handleAction(() => onNavigate('/penjualan/kalkulasi-paket'))}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-transparent border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/20 transition group cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1.5 group-hover:scale-110 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Kalkulasi</span>
                <span className="text-[10px] text-zinc-400">Harga & margin</span>
              </button>

              {/* 3. Pengumuman Toko (Live Info) */}
              <button
                type="button"
                id="btn-assistive-pengumuman"
                onClick={() => handleAction(() => onNavigate('/informasi/pengumuman'))}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#FE2C55]/15 to-transparent border border-[#FE2C55]/30 hover:border-[#FE2C55] hover:bg-[#FE2C55]/20 transition group cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55] mb-1.5 group-hover:scale-110 transition shadow-[0_0_15px_rgba(254,44,85,0.3)]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Pengumuman</span>
                <span className="text-[10px] text-zinc-400">Live Info Toko</span>
              </button>

              {/* 4. Profil Pengguna */}
              <button
                type="button"
                id="btn-assistive-profile"
                onClick={() => handleAction(onOpenProfile)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-purple-500/15 to-transparent border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/20 transition group cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-1.5 group-hover:scale-110 transition shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Profil Saya</span>
                <span className="text-[10px] text-zinc-400">Foto, WA & Bio</span>
              </button>
            </div>

            {/* Bottom Row Actions: Beranda & Suara Robot AI */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('/dashboard'))}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span>Beranda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  SoundFx.playRobotVoiceWelcome(currentUser.name || (currentUser.isOwner ? 'Owner' : 'Tim Toko'));
                  SoundFx.playRobotButtonClick();
                  setIsOpen(false);
                }}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#25F4EE]/20 to-[#FE2C55]/20 border border-white/20 hover:border-white/40 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Putar Suara Robot AI"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#FE2C55]" />
                <span>Suara AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AssistiveTouch Button (Buttery Smooth & 100% Guaranteed Persistent) */}
      <div
        id="btn-floating-assistive-touch"
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
          willChange: 'left, top, transform',
        }}
        className={`fixed z-[9990] flex items-center justify-center w-14 h-14 rounded-full select-none cursor-pointer transition-transform active:scale-95 ${
          isOpen ? 'scale-90' : 'hover:scale-105'
        }`}
        title="Pintasan Mengambang iPhone (Geser atau Ketuk)"
      >
        {/* Outer Pulsing Glow - GPU Composited Box Shadow */}
        <div className="absolute inset-0 rounded-full shadow-[0_0_18px_rgba(37,244,238,0.55),0_0_28px_rgba(254,44,85,0.35)] pointer-events-none" />

        {/* Glossy Black iOS Assistive Ring */}
        <div className="relative w-full h-full rounded-full bg-black/95 border-2 border-white/60 shadow-[0_0_25px_rgba(37,244,238,0.45)] flex items-center justify-center overflow-hidden pointer-events-none">
          {/* Concentric iOS Assistive Touch Circles */}
          <div className="w-8 h-8 rounded-full border border-white/40 bg-white/15 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </div>

          {/* Glowing particle badge */}
          <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#25F4EE] shadow-[0_0_6px_#25F4EE]" />
        </div>
      </div>
    </>
  );
};
