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
  Sparkles,
  Command
} from 'lucide-react';

interface FloatingAssistiveNavProps {
  currentRoute: RoutePath;
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onOpenProfile: () => void;
}

export const FloatingAssistiveNav: React.FC<FloatingAssistiveNavProps> = ({
  currentRoute,
  currentUser,
  onNavigate,
  onOpenProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 80 }); // offset from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const clickPreventRef = useRef(false);

  // Toggle open
  const handleToggle = () => {
    if (clickPreventRef.current) {
      clickPreventRef.current = false;
      return;
    }
    SoundFx.playRobotButtonClick();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    SoundFx.playRobotButtonClick();
    action();
    setIsOpen(false);
  };

  // Drag handlers for mobile & desktop touch
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    clickPreventRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      clickPreventRef.current = true;
    }

    // Since position is measured from right & bottom:
    const newX = Math.max(12, Math.min(window.innerWidth - 70, dragStartRef.current.posX - dx));
    const newY = Math.max(12, Math.min(window.innerHeight - 70, dragStartRef.current.posY - dy));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  return (
    <>
      {/* Expanded iOS Assistive Touch Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            id="assistive-touch-panel"
            onClick={(e) => e.stopPropagation()}
            className="spatial-card relative w-full max-w-xs rounded-3xl border border-white/20 bg-[#161823]/95 text-white p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-scale-up space-y-4"
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
              {/* 1. Live Chat (User Request) */}
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

              {/* 2. Kalkulasi Paket (User Request) */}
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

      {/* Floating AssistiveTouch Button (iPhone Style) */}
      <div
        id="btn-floating-assistive-touch"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleToggle}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
          touchAction: 'none',
        }}
        className={`fixed z-[75] flex items-center justify-center w-14 h-14 rounded-full select-none cursor-pointer transition-transform active:scale-90 ${
          isOpen ? 'scale-90' : 'hover:scale-105'
        }`}
        title="Pintasan Mengambang iPhone (Live Chat & Kalkulasi)"
      >
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#25F4EE] via-purple-500 to-[#FE2C55] opacity-75 blur-md animate-pulse" />

        {/* Glossy Black iOS Assistive Ring */}
        <div className="relative w-full h-full rounded-full bg-black/80 backdrop-blur-md border-2 border-white/60 shadow-[0_0_25px_rgba(37,244,238,0.4)] flex items-center justify-center overflow-hidden">
          {/* Concentric iOS Assistive Touch Circles */}
          <div className="w-8 h-8 rounded-full border border-white/40 bg-white/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </div>

          {/* Glowing particle badge */}
          <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#25F4EE] shadow-[0_0_6px_#25F4EE]" />
        </div>
      </div>
    </>
  );
};
