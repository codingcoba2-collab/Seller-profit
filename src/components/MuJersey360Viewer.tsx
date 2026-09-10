import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  Play, 
  Pause, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Compass, 
  ShieldCheck, 
  MessageCircle,
  Heart,
  Volume2
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';

// 4K 3D Avatar Model Renderings wearing Manchester United Jersey
import avatarFront from '../assets/images/mu_woman_front_1789002310397.jpg';
import avatarSide from '../assets/images/mu_woman_side_1789002325663.jpg';
import avatarBack from '../assets/images/mu_woman_back_1789002341253.jpg';
import avatarReact from '../assets/images/mu_woman_react_1789002358124.jpg';

interface MuJersey360ViewerProps {
  onOpenLoginModal: () => void;
}

interface TouchRipple {
  id: number;
  x: number;
  y: number;
  color: string;
}

const AVATAR_RESPONSES = [
  "Hello! Welcome to Seller Profit! Ready to boost today's live sales? GGMU! 🔥",
  "Touch detected! ❤️ Model 3D aktif! Semangat closing paket live streaming hari ini!",
  "Manchester United spirit! Glory Glory Man United! Siap pantau profit & marginmu!",
  "Halo Kak! Sistem akuntansi live sudah siap. Silakan klik tombol 'Masuk / Login' di atas ya!",
  "Hai! Sensor sentuhan merespon sempurna. Mari catat setiap transaksi dengan teliti!"
];

export const MuJersey360Viewer: React.FC<MuJersey360ViewerProps> = ({ onOpenLoginModal }) => {
  const [rotationAngle, setRotationAngle] = useState(0); // 0 to 360
  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [touchCount, setTouchCount] = useState(0);
  const [ripples, setRipples] = useState<TouchRipple[]>([]);

  const startXRef = useRef(0);
  const startAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastSoundTickAngle = useRef(0);
  const reactTimeoutRef = useRef<any>(null);

  // Auto spin loop
  useEffect(() => {
    if (!isAutoSpin || isDragging || isReacting) return;

    let lastTime = performance.now();
    const spinLoop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      setRotationAngle(prev => {
        const next = (prev + (delta * 0.042)) % 360;
        // Trigger subtle tick every 45 degrees
        if (Math.abs(next - lastSoundTickAngle.current) >= 45) {
          lastSoundTickAngle.current = next;
          SoundFx.playJerseyRotateTick();
        }
        return next;
      });
      animationFrameRef.current = requestAnimationFrame(spinLoop);
    };

    animationFrameRef.current = requestAnimationFrame(spinLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isAutoSpin, isDragging, isReacting]);

  // Touch and Mouse handlers for smooth 360 drag rotation
  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    setIsAutoSpin(false);
    startXRef.current = clientX;
    startAngleRef.current = rotationAngle;
  };

  const handlePointerMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startXRef.current;
    // Map pixels to degrees (1 pixel = 0.75 degrees)
    let newAngle = (startAngleRef.current - diff * 0.75) % 360;
    if (newAngle < 0) newAngle += 360;
    setRotationAngle(newAngle);

    // Audio feedback on manual spin
    if (Math.abs(newAngle - lastSoundTickAngle.current) >= 30) {
      lastSoundTickAngle.current = newAngle;
      SoundFx.playJerseyRotateTick();
    }
  }, [isDragging]);

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Avatar Touch Response Handler
  const handleAvatarTouch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    SoundFx.unlockAudio();
    SoundFx.playAvatarTouchReaction();

    // Determine touch position relative to the avatar container for visual ripple effect
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const newRipple: TouchRipple = {
        id: Date.now() + Math.random(),
        x,
        y,
        color: Math.random() > 0.5 ? '#25F4EE' : '#FE2C55'
      };

      setRipples(prev => [...prev.slice(-4), newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    }

    // Trigger 3D female avatar response
    setTouchCount(prev => prev + 1);
    setIsReacting(true);

    const randomMsg = AVATAR_RESPONSES[touchCount % AVATAR_RESPONSES.length];
    setResponseText(randomMsg);

    // Cute voice speech synthesis reaction if supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const shortLine = touchCount % 2 === 0 
          ? "Hello! Welcome to Seller Profit! GGMU!" 
          : "Touch confirmed! System online! Please enjoy your sale!";
        const utt = new SpeechSynthesisUtterance(shortLine);
        utt.lang = 'en-US';
        utt.pitch = 1.25; // Friendly feminine/playful pitch
        utt.rate = 1.05;
        window.speechSynthesis.speak(utt);
      } catch {}
    }

    if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
    reactTimeoutRef.current = setTimeout(() => {
      setIsReacting(false);
    }, 3800);
  };

  // Determine which image and transform perspective to display
  // 360 Degree angle mapping:
  // 315° to 45°: Front View
  // 45° to 135°: Right 3/4 Quarter Angle View
  // 135° to 225°: Back View
  // 225° to 315°: Left 3/4 Quarter Angle View (mirrored)
  const normAngle = ((rotationAngle % 360) + 360) % 360;

  let activeImage = avatarFront;
  let isMirrored = false;
  let viewName = 'Tampak Depan (Front View)';

  if (isReacting) {
    activeImage = avatarReact;
    isMirrored = false;
    viewName = 'Mode Respon Sentuhan (Interactive Reaction)';
  } else if (normAngle >= 45 && normAngle < 135) {
    activeImage = avatarSide;
    isMirrored = false;
    viewName = 'Tampak Samping Kanan (Quarter Right 45°)';
  } else if (normAngle >= 135 && normAngle < 225) {
    activeImage = avatarBack;
    isMirrored = false;
    viewName = 'Tampak Belakang (Back View #7)';
  } else if (normAngle >= 225 && normAngle < 315) {
    activeImage = avatarSide;
    isMirrored = true;
    viewName = 'Tampak Samping Kiri (Quarter Left 45°)';
  }

  // Micro tilt angle for realistic 3D feel
  const relativeSubAngle = ((normAngle % 90) - 45);
  const tiltDeg = (relativeSubAngle * 0.3);

  const rotateTo = (targetAngle: number) => {
    setIsAutoSpin(false);
    setIsReacting(false);
    setRotationAngle(targetAngle);
    SoundFx.playJerseyRotateTick();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-between overflow-hidden bg-[#07080b] select-none"
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={(e) => {
        if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
      }}
      onTouchEnd={handlePointerUp}
    >
      {/* Background Stadium Atmosphere & Cyber Neon Grid */}
      <div className="absolute inset-0 bg-radial from-[#FE2C55]/15 via-[#0b0c10]/90 to-[#07080b] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Floating Spatial HUD Bar */}
      <div className="relative z-20 w-full max-w-7xl px-4 sm:px-8 pt-4 flex items-center justify-between gap-4">
        {/* Left Badge: 3D Model MU Authentic */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#161823]/80 border border-white/10 backdrop-blur-md shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55] animate-ping" />
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-widest text-white uppercase flex items-center gap-1">
              <span>MU 3D AVATAR MODEL</span>
              <span className="text-[#FE2C55]">★</span>
            </span>
            <span className="text-[9px] font-bold text-zinc-400">JERSEY 4K HD 360° + INTERACTIVE TOUCH</span>
          </div>
        </div>

        {/* Center: Live 360 Degree Gyro Compass */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161823]/70 border border-[#25F4EE]/30 text-xs font-mono text-[#25F4EE] shadow-[0_0_15px_rgba(37,244,238,0.2)]">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>GYRO: {Math.round(normAngle)}° / 360°</span>
        </div>

        {/* Right Action: Prompt Login Button with glowing spatial UI */}
        <div className="flex items-center gap-2">
          <button
            id="btn-beranda-login"
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              onOpenLoginModal();
            }}
            className="spatial-button px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#00d2ff] hover:from-[#3ffef9] hover:to-[#25F4EE] text-zinc-950 font-black text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-[#25F4EE]/30 cursor-pointer border border-[#25F4EE]/60"
          >
            <ShieldCheck className="w-4 h-4 text-zinc-950" />
            <span>Masuk / Login</span>
          </button>
        </div>
      </div>

      {/* Main 360 Showcase Canvas (Fills Screen) */}
      <div 
        className="relative z-10 flex-1 w-full flex flex-col items-center justify-center py-2 px-4 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
        }}
      >
        {/* Interactive Speech Bubble When 3D Woman Responds */}
        {responseText && (
          <div 
            className={`relative z-30 mb-3 max-w-sm sm:max-w-md px-4 py-2.5 rounded-2xl bg-[#161823]/95 border border-[#25F4EE]/60 shadow-[0_0_25px_rgba(37,244,238,0.3)] backdrop-blur-xl text-center transition-all duration-300 ${
              isReacting ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#25F4EE] uppercase tracking-wider mb-1">
              <MessageCircle className="w-3 h-3" />
              <span>Respon Avatar 3D (Sentuhan Terdeteksi)</span>
              <Heart className="w-3 h-3 text-[#FE2C55] fill-[#FE2C55] animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-white leading-relaxed">
              "{responseText}"
            </p>
            {/* Bubble pointer triangle */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#161823] border-b border-r border-[#25F4EE]/60 rotate-45" />
          </div>
        )}

        {/* Holographic Glowing Pedestal Stage at Base */}
        <div className="absolute bottom-6 sm:bottom-10 w-64 sm:w-96 h-28 sm:h-36 pointer-events-none">
          <div className="absolute inset-0 rounded-[100%] border border-[#FE2C55]/40 shadow-[0_0_35px_rgba(254,44,85,0.4)] animate-pulse" />
          <div className="absolute inset-3 sm:inset-5 rounded-[100%] border border-dashed border-[#25F4EE]/50 animate-spin-slow" />
          <div className="absolute inset-x-12 bottom-0 top-1/2 bg-gradient-to-t from-[#FE2C55]/30 to-transparent blur-md rounded-full" />
        </div>

        {/* 360° Rotating 3D Woman Model Entity Card with Spatial 3D Perspective */}
        <div 
          ref={cardRef}
          onClick={handleAvatarTouch}
          className={`relative transition-transform duration-100 ease-out flex items-center justify-center cursor-pointer group ${
            isZoomed ? 'scale-110 sm:scale-120' : 'scale-95 sm:scale-100'
          }`}
          style={{
            perspective: '1200px',
          }}
        >
          {/* Avatar Container with 3D Depth & Dynamic Specular Sheen */}
          <div 
            className="relative w-[300px] sm:w-[370px] md:w-[420px] max-h-[68vh] rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(254,44,85,0.25)] border border-white/20 bg-black/70 backdrop-blur-xs transition-all duration-150 group-hover:border-[#25F4EE]/50"
            style={{
              transform: `rotateY(${tiltDeg}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 4K Image Render of 3D Woman wearing MU Jersey */}
            <img
              src={activeImage}
              alt="Wanita 3D Memakai Jersey Manchester United 4K HD 360"
              referrerPolicy="no-referrer"
              className={`w-full h-auto object-contain pointer-events-none transition-transform duration-200 select-none ${
                isMirrored ? '-scale-x-100' : ''
              } ${isReacting ? 'scale-[1.03]' : ''}`}
            />

            {/* Dynamic Touch Ripples Expanding from touch location */}
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="absolute rounded-full pointer-events-none animate-ping"
                style={{
                  left: ripple.x - 30,
                  top: ripple.y - 30,
                  width: 60,
                  height: 60,
                  borderColor: ripple.color,
                  borderWidth: 2,
                  boxShadow: `0 0 25px ${ripple.color}`,
                }}
              />
            ))}

            {/* Dynamic 360 Lighting Sheen / Reflection based on rotation */}
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-200"
              style={{
                background: `linear-gradient(${normAngle}deg, rgba(255,255,255,0.25) 0%, transparent 60%, rgba(254,44,85,0.2) 100%)`,
                opacity: isDragging ? 0.7 : 0.35,
              }}
            />

            {/* Sci-Fi Corner Overlays */}
            <div className="hologram-corner-tl" />
            <div className="hologram-corner-tr" />
            <div className="hologram-corner-bl" />
            <div className="hologram-corner-br" />

            {/* Touch Prompt Banner Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#25F4EE]/40 text-[10px] font-bold text-white shadow-md animate-pulse">
              <Sparkles className="w-3 h-3 text-[#25F4EE]" />
              <span>Sentuh Model 3D Untuk Respon</span>
            </div>

            {/* Touch Counter Badge */}
            {touchCount > 0 && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FE2C55]/80 backdrop-blur-md border border-white/20 text-[10px] font-black text-white shadow-lg">
                <Heart className="w-3 h-3 fill-white" />
                <span>{touchCount}x</span>
              </div>
            )}

            {/* Live Angle Pill inside frame */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#FE2C55]/50 text-[11px] font-mono font-bold text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
              <span>{Math.round(normAngle)}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar (Rotate 360, Presets, Auto-Spin, Interactive Touch) */}
      <div className="relative z-20 w-full max-w-2xl px-4 pb-6 sm:pb-8 flex flex-col items-center gap-2.5">
        {/* View Name Indicator */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161823]/80 border border-white/10 text-xs font-semibold text-zinc-300">
            <span className="text-[#25F4EE]">●</span>
            <span>{viewName}</span>
            <span className="text-zinc-500 font-normal">| Geser untuk 360° • Sentuh untuk respon</span>
          </span>
        </div>

        {/* 360° Interactive Rotation Slider & Preset Buttons */}
        <div className="spatial-card w-full p-3 sm:p-4 rounded-2xl flex flex-col gap-3">
          {/* Quick Angle Presets & Interactive Wave Button */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => rotateTo(0)}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-bold transition border cursor-pointer ${
                !isReacting && (normAngle >= 315 || normAngle < 45)
                  ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/30'
                  : 'bg-white/5 text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              Depan 0°
            </button>
            <button
              type="button"
              onClick={() => rotateTo(90)}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-bold transition border cursor-pointer ${
                !isReacting && normAngle >= 45 && normAngle < 135
                  ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/30'
                  : 'bg-white/5 text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              Kanan 90°
            </button>
            <button
              type="button"
              onClick={() => rotateTo(180)}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-bold transition border cursor-pointer ${
                !isReacting && normAngle >= 135 && normAngle < 225
                  ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/30'
                  : 'bg-white/5 text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              Belakang 180°
            </button>
            <button
              type="button"
              onClick={() => rotateTo(270)}
              className={`py-1.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-bold transition border cursor-pointer ${
                !isReacting && normAngle >= 225 && normAngle < 315
                  ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/30'
                  : 'bg-white/5 text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              Kiri 270°
            </button>
            <button
              type="button"
              onClick={(e) => handleAvatarTouch(e as any)}
              className="py-1.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-black transition border cursor-pointer bg-gradient-to-r from-[#25F4EE]/30 to-[#00d2ff]/30 text-[#25F4EE] border-[#25F4EE]/60 hover:border-[#25F4EE] flex items-center justify-center gap-1 shadow-sm"
              title="Sapa Model 3D"
            >
              <Sparkles className="w-3 h-3" />
              <span>Sapa 3D</span>
            </button>
          </div>

          {/* Interactive Range Slider + Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Step Left */}
            <button
              type="button"
              onClick={() => {
                setIsAutoSpin(false);
                setIsReacting(false);
                setRotationAngle(prev => (prev - 30 + 360) % 360);
                SoundFx.playJerseyRotateTick();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition cursor-pointer"
              title="Putar Kiri 30°"
            >
              <RotateCcw className="w-4 h-4 text-[#25F4EE]" />
            </button>

            {/* Slider */}
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round(normAngle)}
                onChange={(e) => {
                  setIsAutoSpin(false);
                  setIsReacting(false);
                  setRotationAngle(Number(e.target.value));
                  SoundFx.playJerseyRotateTick();
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FE2C55]"
              />
            </div>

            {/* Step Right */}
            <button
              type="button"
              onClick={() => {
                setIsAutoSpin(false);
                setIsReacting(false);
                setRotationAngle(prev => (prev + 30) % 360);
                SoundFx.playJerseyRotateTick();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition cursor-pointer"
              title="Putar Kanan 30°"
            >
              <RotateCw className="w-4 h-4 text-[#25F4EE]" />
            </button>

            {/* Toggle Auto-Spin */}
            <button
              type="button"
              onClick={() => {
                setIsAutoSpin(!isAutoSpin);
                SoundFx.playRobotButtonClick();
              }}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isAutoSpin
                  ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE]'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title={isAutoSpin ? 'Jeda Putaran Otomatis' : 'Mulai Putaran Otomatis 360°'}
            >
              {isAutoSpin ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Zoom Detail Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsZoomed(!isZoomed);
                SoundFx.playRobotButtonClick();
              }}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isZoomed
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title={isZoomed ? 'Kembalikan Ukuran Normal' : 'Perbesar Detail 4K'}
            >
              {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
