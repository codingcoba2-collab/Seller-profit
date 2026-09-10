import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  Heart, 
  Hand,
  Compass,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  X,
  Palette,
  Shirt,
  Sparkle
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import { ProcessingService } from '../services/processingService';

interface MuJersey360ViewerProps {
  onOpenLoginModal: () => void;
}

interface TouchRipple {
  id: number;
  x: number;
  y: number;
  color: string;
}

type OutfitMode = 'jersey' | 'full' | 'logo';

interface OutfitConfig {
  type: 'default-mu' | 'preset' | 'custom';
  presetId?: string;
  name: string;
  imageUrl?: string;
  mode: OutfitMode;
  baseColor: string;
  accentColor: string;
}

const STORAGE_KEY = 'seller_profit_avatar_custom_outfit';

const BASE_COLOR_OPTIONS = [
  { name: 'Merah MU', value: '#C70101', accent: '#FFFFFF' },
  { name: 'Hitam Stealth', value: '#111319', accent: '#25F4EE' },
  { name: 'Putih Bersih', value: '#FAFAFB', accent: '#161823' },
  { name: 'Biru Navy', value: '#0E2140', accent: '#FFC72C' },
  { name: 'Cyber Teal', value: '#083338', accent: '#25F4EE' },
  { name: 'Emas Mewah', value: '#B38F38', accent: '#161823' }
];

const PRESETS: { id: string; name: string; tag: string; baseColor: string; accentColor: string; mode: OutfitMode }[] = [
  { id: 'mu-home', name: 'MU Home 24/25', tag: 'Official', baseColor: '#C70101', accentColor: '#FFFFFF', mode: 'jersey' },
  { id: 'mu-away', name: 'MU Away Shadow', tag: 'Stealth', baseColor: '#121624', accentColor: '#A0AEC0', mode: 'jersey' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', tag: 'Sci-Fi', baseColor: '#0a0d14', accentColor: '#25F4EE', mode: 'logo' },
  { id: 'batik', name: 'Batik Nusantara', tag: 'Classic', baseColor: '#2B1A12', accentColor: '#D4AF37', mode: 'full' },
  { id: 'clean-white', name: 'Streetwear Putih', tag: 'Modern', baseColor: '#FAFAFB', accentColor: '#161823', mode: 'logo' }
];

const AVATAR_RESPONSES = [
  "Hello! Welcome to Seller Profit! Siap pantau closingan live hari ini? GGMU! 🔥",
  "Sentuhan terdeteksi! ❤️ Semangat kejar target omset & laba bersih tokomu!",
  "Manchester United Spirit! Karakter virtual siap mendampingi analisa tokomu!",
  "Hai Kak! Silakan klik tombol 'Masuk / Login' di atas untuk membuka pembukuan.",
  "Halo! Sensor respon aktif. Geser layar ke kiri & kanan untuk melihat detail 360°!"
];

/**
 * Procedural texture generator for Manchester United Home Jersey (1024x1024)
 */
function createMUJerseyCanvas(ctx: CanvasRenderingContext2D) {
  // 1. Base vibrant crimson red gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#DA020E');
  grad.addColorStop(0.5, '#C70101');
  grad.addColorStop(1, '#980000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Micro jacquard texture stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 1024; i += 16) {
    ctx.fillRect(i, 0, 8, 1024);
  }

  // 3. Side panels (darker red accent)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, 80, 1024);
  ctx.fillRect(944, 0, 80, 1024);

  // 4. White collar accent at top
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1024, 60);
  ctx.fillStyle = '#0B0C10';
  ctx.fillRect(0, 50, 1024, 12);

  // 5. Front side (Left half: 0 to 512)
  // 5a. Manchester United Crest (Left Chest)
  const crestX = 170;
  const crestY = 240;
  ctx.save();
  ctx.beginPath();
  ctx.arc(crestX, crestY, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#FFC72C';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#DA020E';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(crestX, crestY, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#C70101';
  ctx.fill();

  ctx.fillStyle = '#FFC72C';
  ctx.fillRect(crestX - 16, crestY - 18, 32, 10);
  ctx.beginPath();
  ctx.arc(crestX, crestY + 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5b. Adidas 3-bars logo (Right Chest)
  const adX = 340;
  const adY = 240;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.transform(1, 0, -0.35, 1, 0, 0);
  ctx.fillRect(adX + 50, adY - 12, 10, 24);
  ctx.fillRect(adX + 66, adY - 6, 10, 18);
  ctx.fillRect(adX + 82, adY, 10, 12);
  ctx.restore();

  // 5c. Snapdragon Chest Sponsor
  ctx.save();
  const spX = 256;
  const spY = 410;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(spX, spY - 24, 30, Math.PI * 0.2, Math.PI * 1.8, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(spX, spY - 24, 16, Math.PI * 0.5, Math.PI * 1.5, false);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('Snapdragon', spX, spY + 38);
  ctx.restore();

  // 6. Back side (Right half: 512 to 1024)
  const backCenterX = 768;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText('SELLER PROFIT', backCenterX, 220);

  ctx.font = '900 230px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  ctx.strokeText('7', backCenterX, 460);
  ctx.fillText('7', backCenterX, 460);

  ctx.fillStyle = '#C70101';
  ctx.beginPath();
  ctx.arc(backCenterX + 35, 435, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws preset outfit patterns (Away, Cyberpunk, Batik, Minimalist)
 */
function createPresetPatternCanvas(ctx: CanvasRenderingContext2D, presetId: string) {
  if (presetId === 'mu-away') {
    // Deep Navy & Silver Jersey
    ctx.fillStyle = '#101524';
    ctx.fillRect(0, 0, 1024, 1024);

    // Diagonal silver stripes
    ctx.strokeStyle = 'rgba(160, 174, 192, 0.12)';
    ctx.lineWidth = 20;
    for (let i = -1024; i < 2048; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 1024, 1024);
      ctx.stroke();
    }

    // Collar silver
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, 1024, 60);

    // Silver Snapdragon sponsor
    ctx.save();
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Snapdragon', 256, 430);

    // Back Name and Number in Silver
    ctx.font = '900 42px sans-serif';
    ctx.fillText('SELLER PROFIT', 768, 220);
    ctx.font = '900 230px sans-serif';
    ctx.fillText('7', 768, 460);
    ctx.restore();
  } else if (presetId === 'cyberpunk') {
    // Carbon Dark with Glowing Cyan & Magenta circuit lines
    ctx.fillStyle = '#080A10';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.strokeStyle = '#25F4EE';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(80, 200); ctx.lineTo(256, 320); ctx.lineTo(432, 200);
    ctx.moveTo(80, 600); ctx.lineTo(256, 480); ctx.lineTo(432, 600);
    ctx.stroke();

    ctx.strokeStyle = '#FE2C55';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 400, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Chest Logo "AI SELLER"
    ctx.save();
    ctx.fillStyle = '#25F4EE';
    ctx.font = '900 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SELLER PROFIT', 256, 410);

    // Back neon
    ctx.font = '900 220px sans-serif';
    ctx.fillStyle = '#25F4EE';
    ctx.fillText('01', 768, 460);
    ctx.restore();
  } else if (presetId === 'batik') {
    // Indonesian Batik Gold on Dark Espresso Brown
    ctx.fillStyle = '#26160E';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = '#D4AF37';
    // Diamond Batik Parang / Kawung motifs
    for (let x = 40; x < 1024; x += 120) {
      for (let y = 60; y < 1024; y += 120) {
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1A0E08';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#D4AF37';
      }
    }
  } else if (presetId === 'clean-white') {
    // Pure White Designer Tee
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, 1024, 1024);

    // Minimalist black typography front & back
    ctx.fillStyle = '#111319';
    ctx.fillRect(256 - 60, 360, 120, 6);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROFIT // CLUB', 256, 420);

    ctx.font = '900 38px sans-serif';
    ctx.fillText('SELLER PROFIT', 768, 230);
    ctx.font = '900 220px sans-serif';
    ctx.fillText('7', 768, 460);
  }
}

/**
 * Procedural Photorealistic PBR Skin Texture Generator
 * Features organic porcelain-peach micro-tonal gradation, fine pores, subtle melanin shading, and natural blush
 */
function createPhotorealisticSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm organic ivory-peach base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#FFE8DD');
  grad.addColorStop(0.4, '#F8D8C9');
  grad.addColorStop(0.8, '#F0CEBE');
  grad.addColorStop(1, '#E6C2B0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro skin pore noise & fine melanin tonal variations to remove doll/plastic look
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.8));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Soft natural peach blush around cheeks area
  const blushGrad1 = ctx.createRadialGradient(256, 320, 20, 256, 320, 150);
  blushGrad1.addColorStop(0, 'rgba(244, 130, 150, 0.25)');
  blushGrad1.addColorStop(1, 'rgba(244, 130, 150, 0)');
  ctx.fillStyle = blushGrad1;
  ctx.fillRect(100, 180, 312, 280);

  const blushGrad2 = ctx.createRadialGradient(768, 320, 20, 768, 320, 150);
  blushGrad2.addColorStop(0, 'rgba(244, 130, 150, 0.25)');
  blushGrad2.addColorStop(1, 'rgba(244, 130, 150, 0)');
  ctx.fillStyle = blushGrad2;
  ctx.fillRect(612, 180, 312, 280);

  // Subtle clavicle and neck contour shading
  const neckShade = ctx.createLinearGradient(0, 700, 0, 950);
  neckShade.addColorStop(0, 'rgba(205, 155, 140, 0)');
  neckShade.addColorStop(0.5, 'rgba(205, 155, 140, 0.18)');
  neckShade.addColorStop(1, 'rgba(205, 155, 140, 0)');
  ctx.fillStyle = neckShade;
  ctx.fillRect(0, 700, 1024, 250);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Photorealistic Eye Texture (Iris, Limbal Ring, Radial Fibers, Pupil & Wet Specular Corneal Highlights)
 */
function createPhotorealisticEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base sclera with natural gentle shading
  ctx.fillStyle = '#FAF7F5';
  ctx.fillRect(0, 0, 512, 512);

  // Limbal ring (outer dark iris border)
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.fillStyle = '#1A2820';
  ctx.fill();

  // Multi-tone hazel green iris gradient
  const irisGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 175);
  irisGrad.addColorStop(0, '#7E9152'); // Warm hazel center
  irisGrad.addColorStop(0.45, '#3E664E'); // Deep forest jade
  irisGrad.addColorStop(1, '#1A3324'); // Dark limbal edge
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 172, 0, Math.PI * 2);
  ctx.fill();

  // Radial striations (delicate iris fibers)
  ctx.strokeStyle = 'rgba(215, 235, 180, 0.35)';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 55, 256 + Math.sin(a) * 55);
    ctx.lineTo(256 + Math.cos(a) * 165, 256 + Math.sin(a) * 165);
    ctx.stroke();
  }

  // Deep black pupil
  ctx.beginPath();
  ctx.arc(256, 256, 52, 0, Math.PI * 2);
  ctx.fillStyle = '#060807';
  ctx.fill();

  // Wet corneal highlight reflection
  ctx.beginPath();
  ctx.arc(220, 215, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(295, 285, 11, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Photorealistic Hair Texture with directional micro-strands & anisotropic sheen
 */
function createPhotorealisticHairTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep silky espresso brunette base
  ctx.fillStyle = '#181210';
  ctx.fillRect(0, 0, 512, 512);

  // Micro hair strands in longitudinal direction
  ctx.fillStyle = 'rgba(80, 58, 48, 0.3)';
  for (let i = 0; i < 512; i += 3) {
    ctx.fillRect(i, 0, 1.5, 512);
  }

  // Anisotropic glossy specular light band across hair
  const sheenGrad = ctx.createLinearGradient(0, 160, 0, 320);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheenGrad.addColorStop(0.5, 'rgba(170, 138, 120, 0.38)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 160, 512, 160);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Universal Custom Outfit Texture Generator
 */
function generateOutfitTexture(
  config: OutfitConfig,
  customImageElement: HTMLImageElement | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  if (config.type === 'default-mu') {
    createMUJerseyCanvas(ctx);
  } else if (config.type === 'preset' && config.presetId) {
    createPresetPatternCanvas(ctx, config.presetId);
  } else if (config.type === 'custom' && customImageElement) {
    const img = customImageElement;

    if (config.mode === 'full') {
      // 1. Full wrap mode: Custom image fills front and back
      ctx.fillStyle = config.baseColor || '#111319';
      ctx.fillRect(0, 0, 1024, 1024);

      // Draw custom image on Front (0 to 512)
      ctx.drawImage(img, 0, 0, 512, 1024);
      // Draw custom image on Back (512 to 1024)
      ctx.drawImage(img, 512, 0, 512, 1024);

      // Add subtle neck collar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, 0, 1024, 45);

      // Subtle fabric shading
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let i = 0; i < 1024; i += 12) {
        ctx.fillRect(i, 0, 6, 1024);
      }
    } else if (config.mode === 'logo') {
      // 2. Logo / Graphic Print on Chest mode
      ctx.fillStyle = config.baseColor || '#111319';
      ctx.fillRect(0, 0, 1024, 1024);

      // Collar trim
      ctx.fillStyle = config.accentColor || '#FFFFFF';
      ctx.fillRect(0, 0, 1024, 48);

      // Fabric micro-grain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 1024; i += 16) {
        ctx.fillRect(i, 0, 8, 1024);
      }

      // Draw imported image centered on chest (x: 256, y: 380)
      const targetSize = 280;
      const imgAspect = (img.width || 1) / (img.height || 1);
      let dw = targetSize;
      let dh = targetSize;
      if (imgAspect > 1) {
        dh = targetSize / imgAspect;
      } else {
        dw = targetSize * imgAspect;
      }

      const dx = 256 - dw / 2;
      const dy = 380 - dh / 2;

      // Soft glow / drop shadow behind chest graphic
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      // Back side branding
      const backCenterX = 768;
      ctx.save();
      ctx.fillStyle = config.accentColor || '#FFFFFF';
      ctx.font = '900 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SELLER PROFIT', backCenterX, 220);

      ctx.font = '900 230px sans-serif';
      ctx.fillText('7', backCenterX, 460);
      ctx.restore();
    } else {
      // 3. Sport Jersey style with custom chest image
      // Gradient jersey base
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, config.baseColor);
      grad.addColorStop(1, '#090A0E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Jersey side racing stripes
      ctx.fillStyle = config.accentColor || '#FFFFFF';
      ctx.fillRect(0, 0, 50, 1024);
      ctx.fillRect(974, 0, 50, 1024);

      // Collar
      ctx.fillRect(0, 0, 1024, 55);

      // Crest (Left chest)
      ctx.beginPath();
      ctx.arc(160, 230, 36, 0, Math.PI * 2);
      ctx.fillStyle = config.accentColor || '#FFC72C';
      ctx.fill();

      // Draw custom imported image as center jersey sponsor
      const targetW = 340;
      const targetH = 180;
      const imgAspect = (img.width || 1) / (img.height || 1);
      let dw = targetW;
      let dh = targetW / imgAspect;
      if (dh > targetH) {
        dh = targetH;
        dw = targetH * imgAspect;
      }
      const dx = 256 - dw / 2;
      const dy = 410 - dh / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      // Back
      const backCenterX = 768;
      ctx.save();
      ctx.fillStyle = config.accentColor || '#FFFFFF';
      ctx.font = '900 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SELLER PROFIT', backCenterX, 220);

      ctx.font = '900 230px sans-serif';
      ctx.fillText('7', backCenterX, 460);
      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural texture generator for Matching Shorts
 */
function generateShortsTexture(baseColor: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Side stripes
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 36, 512);
  ctx.fillRect(476, 0, 36, 512);

  // Bottom hem
  ctx.fillRect(0, 484, 512, 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const MuJersey360Viewer: React.FC<MuJersey360ViewerProps> = ({ onOpenLoginModal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isReacting, setIsReacting] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [touchCount, setTouchCount] = useState(0);
  const [ripples, setRipples] = useState<TouchRipple[]>([]);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Outfit Customization Drawer / Modal State
  const [isOutfitDrawerOpen, setIsOutfitDrawerOpen] = useState(false);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [activeOutfit, setActiveOutfit] = useState<OutfitConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      type: 'default-mu',
      name: 'Jersey Manchester United 24/25',
      mode: 'jersey',
      baseColor: '#C70101',
      accentColor: '#FFFFFF'
    };
  });

  const [customImageElement, setCustomImageElement] = useState<HTMLImageElement | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const rightForearmRef = useRef<THREE.Group | null>(null);
  const chestRef = useRef<THREE.Mesh | null>(null);
  const bustGroupRef = useRef<THREE.Group | null>(null);
  const ponyRootRef = useRef<THREE.Group | null>(null);
  const ponyMidRef = useRef<THREE.Group | null>(null);
  const ponyTipRef = useRef<THREE.Group | null>(null);
  const bangsLeftRef = useRef<THREE.Group | null>(null);
  const bangsRightRef = useRef<THREE.Group | null>(null);
  const eyelidsRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Secondary Physics simulation state (Hair Inertia & Bust Dynamics)
  const hairSwayAngleRef = useRef(0);
  const hairSwayVelRef = useRef(0);
  const bustOffsetXRef = useRef(0);
  const bustOffsetYRef = useRef(0);
  const bustVelXRef = useRef(0);
  const bustVelYRef = useRef(0);
  const prevAngularVelRef = useRef(0);

  // Materials References to update dynamically when outfit changes
  const jerseyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const shortsMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Touch / Drag momentum state
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const angularVelocityRef = useRef(0.003);
  const currentRotationRef = useRef(0);
  const lastSoundTickDeg = useRef(0);
  const reactTimeoutRef = useRef<any>(null);
  const waveTimeRef = useRef(0);

  // Load custom image element if activeOutfit has imageUrl
  useEffect(() => {
    if (activeOutfit.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setCustomImageElement(img);
      };
      img.src = activeOutfit.imageUrl;
    } else {
      setCustomImageElement(null);
    }
  }, [activeOutfit.imageUrl]);

  // Apply outfit texture whenever activeOutfit or customImageElement updates
  const applyOutfitToAvatar = useCallback((config: OutfitConfig, imgEl: HTMLImageElement | null) => {
    if (!jerseyMaterialRef.current || !shortsMaterialRef.current) return;

    // Generate new texture
    const newJerseyTex = generateOutfitTexture(config, imgEl);
    jerseyMaterialRef.current.map = newJerseyTex;
    jerseyMaterialRef.current.needsUpdate = true;

    // Generate matching shorts texture
    const shortsBase = config.type === 'default-mu' ? '#F5F5F7' : config.baseColor;
    const shortsAccent = config.type === 'default-mu' ? '#C70101' : config.accentColor;
    const newShortsTex = generateShortsTexture(shortsBase, shortsAccent);
    shortsMaterialRef.current.map = newShortsTex;
    shortsMaterialRef.current.needsUpdate = true;

    // Save to LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, []);

  // Update textures when materials ready or outfit changes
  useEffect(() => {
    if (jerseyMaterialRef.current && shortsMaterialRef.current) {
      applyOutfitToAvatar(activeOutfit, customImageElement);
    }
  }, [activeOutfit, customImageElement, applyOutfitToAvatar]);

  // Build the 3D Virtual Human in Three.js
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5.2);
    camera.lookAt(0, 0.15, 0);
    cameraRef.current = camera;

    // 3. Renderer with high-end antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Lighting (Cyber Stadium Atmosphere)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
    keyLight.position.set(2, 4, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const cyanLight = new THREE.DirectionalLight(0x25F4EE, 1.2);
    cyanLight.position.set(-3, 2, 2);
    scene.add(cyanLight);

    const rimLight = new THREE.DirectionalLight(0xFE2C55, 2.0);
    rimLight.position.set(3, 2, -3);
    scene.add(rimLight);

    const pedestalLight = new THREE.PointLight(0x25F4EE, 2.5, 6);
    pedestalLight.position.set(0, -1.8, 0.5);
    scene.add(pedestalLight);

    // 5. Photorealistic PBR Materials
    const skinTex = createPhotorealisticSkinTexture();
    const skinMaterial = new THREE.MeshStandardMaterial({
      map: skinTex,
      roughness: 0.38,
      metalness: 0.04,
      color: 0xFFF2EA,
    });

    const eyeTex = createPhotorealisticEyeTexture();
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xFCFAF8,
      roughness: 0.12,
    });

    const irisMaterial = new THREE.MeshStandardMaterial({
      map: eyeTex,
      roughness: 0.05,
      metalness: 0.0,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x050505,
    });

    const hairTex = createPhotorealisticHairTexture();
    const hairMaterial = new THREE.MeshStandardMaterial({
      map: hairTex,
      roughness: 0.28,
      metalness: 0.14,
      color: 0x181210,
    });

    const lipsMaterial = new THREE.MeshStandardMaterial({
      color: 0xD35D72,
      roughness: 0.22,
      metalness: 0.04,
    });

    const blushMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF8595,
      transparent: true,
      opacity: 0.35,
    });

    // Dynamic Outfit Material (Jersey/Shirt/Dress)
    const initialJerseyTex = generateOutfitTexture(activeOutfit, customImageElement);
    const jerseyMaterial = new THREE.MeshStandardMaterial({
      map: initialJerseyTex,
      roughness: 0.42,
      metalness: 0.08,
    });
    jerseyMaterialRef.current = jerseyMaterial;

    const initialShortsTex = generateShortsTexture(
      activeOutfit.type === 'default-mu' ? '#F5F5F7' : activeOutfit.baseColor,
      activeOutfit.type === 'default-mu' ? '#C70101' : activeOutfit.accentColor
    );
    const shortsMaterial = new THREE.MeshStandardMaterial({
      map: initialShortsTex,
      roughness: 0.48,
      metalness: 0.05,
    });
    shortsMaterialRef.current = shortsMaterial;

    const sockMaterial = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.55,
    });

    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.3,
      metalness: 0.15,
    });

    const redTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xC70101,
      roughness: 0.35,
    });

    // 6. Character Hierarchy (Avatar Root)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, -0.65, 0);
    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    // --- TORSO & CHEST (With Dynamic Secondary Physics & Cloth Movement) ---
    const torsoGroup = new THREE.Group();
    avatarGroup.add(torsoGroup);

    // Sculpted natural feminine torso (curved waist, athletic shoulders)
    const torsoGeo = new THREE.CylinderGeometry(0.36, 0.28, 0.88, 36);
    torsoGeo.scale(1.0, 1.0, 0.72);
    const torsoMesh = new THREE.Mesh(torsoGeo, jerseyMaterial);
    torsoMesh.position.y = 1.34;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoGroup.add(torsoMesh);
    chestRef.current = torsoMesh;

    // Clavicle & Collarbone Ridge
    const clavicleGeo = new THREE.TorusGeometry(0.18, 0.02, 16, 32, Math.PI * 0.7);
    const clavicleMesh = new THREE.Mesh(clavicleGeo, skinMaterial);
    clavicleMesh.position.set(0, 1.74, 0.04);
    clavicleMesh.rotation.x = Math.PI * 0.45;
    torsoGroup.add(clavicleMesh);

    // Anatomical Bust & Clothing Overlay Group with Dynamic Inertia Springs
    const bustGroup = new THREE.Group();
    bustGroup.position.set(0, 1.44, 0);
    torsoGroup.add(bustGroup);
    bustGroupRef.current = bustGroup;

    // Left and Right sculpted breasts with organic natural curvature
    const breastLeftGeo = new THREE.SphereGeometry(0.135, 24, 24);
    breastLeftGeo.scale(1.15, 0.95, 1.1);
    const breastLeftMesh = new THREE.Mesh(breastLeftGeo, jerseyMaterial);
    breastLeftMesh.position.set(-0.11, 0, 0.14);
    breastLeftMesh.rotation.z = -0.12;
    breastLeftMesh.castShadow = true;
    bustGroup.add(breastLeftMesh);

    const breastRightGeo = new THREE.SphereGeometry(0.135, 24, 24);
    breastRightGeo.scale(1.15, 0.95, 1.1);
    const breastRightMesh = new THREE.Mesh(breastRightGeo, jerseyMaterial);
    breastRightMesh.position.set(0.11, 0, 0.14);
    breastRightMesh.rotation.z = 0.12;
    breastRightMesh.castShadow = true;
    bustGroup.add(breastRightMesh);

    // Jersey V-neck collar trim
    const collarGeo = new THREE.TorusGeometry(0.15, 0.022, 16, 32, Math.PI);
    const collarMesh = new THREE.Mesh(collarGeo, redTrimMaterial);
    collarMesh.position.set(0, 0.28, 0.05);
    collarMesh.rotation.x = Math.PI * 0.4;
    collarMesh.rotation.z = Math.PI;
    bustGroup.add(collarMesh);

    // --- HEAD GROUP (Organic Photorealistic Feminine Features) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.88, 0);
    avatarGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Elegant Slender Neck
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.135, 0.24, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.y = -0.06;
    headGroup.add(neckMesh);

    // Sculpted Cranium & Soft Feminine Jawline
    const headGeo = new THREE.SphereGeometry(0.32, 36, 36);
    headGeo.scale(0.88, 1.06, 0.92);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.y = 0.22;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Delicate Chin Definition
    const chinGeo = new THREE.SphereGeometry(0.09, 16, 16);
    chinGeo.scale(0.8, 0.7, 0.8);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, 0.04, 0.24);
    headGroup.add(chinMesh);

    // Natural Nose Bridge & Tip
    const noseBridgeGeo = new THREE.ConeGeometry(0.032, 0.14, 16);
    noseBridgeGeo.rotateX(Math.PI * 0.1);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMaterial);
    noseBridge.position.set(0, 0.19, 0.29);
    headGroup.add(noseBridge);

    const noseTipGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const noseTip = new THREE.Mesh(noseTipGeo, skinMaterial);
    noseTip.position.set(0, 0.14, 0.32);
    headGroup.add(noseTip);

    // Photorealistic Layered Hair: Hair Cap with Anisotropic Sheen
    const hairCapGeo = new THREE.SphereGeometry(0.345, 36, 36);
    hairCapGeo.scale(0.92, 1.08, 0.98);
    const hairCapMesh = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCapMesh.position.set(0, 0.25, -0.03);
    headGroup.add(hairCapMesh);

    // Side-Swept Soft Bangs framing cheeks
    const bangsLeftGroup = new THREE.Group();
    bangsLeftGroup.position.set(-0.13, 0.42, 0.23);
    const bangsLeftGeo = new THREE.ConeGeometry(0.09, 0.38, 16);
    bangsLeftGeo.rotateZ(0.28);
    bangsLeftGeo.rotateX(-0.15);
    const bangsLeft = new THREE.Mesh(bangsLeftGeo, hairMaterial);
    bangsLeftGroup.add(bangsLeft);
    headGroup.add(bangsLeftGroup);
    bangsLeftRef.current = bangsLeftGroup;

    const bangsRightGroup = new THREE.Group();
    bangsRightGroup.position.set(0.13, 0.42, 0.23);
    const bangsRightGeo = new THREE.ConeGeometry(0.09, 0.38, 16);
    bangsRightGeo.rotateZ(-0.35);
    bangsRightGeo.rotateX(-0.15);
    const bangsRight = new THREE.Mesh(bangsRightGeo, hairMaterial);
    bangsRightGroup.add(bangsRight);
    headGroup.add(bangsRightGroup);
    bangsRightRef.current = bangsRightGroup;

    // Ponytail Scrunchie / Tie
    const bandGeo = new THREE.TorusGeometry(0.09, 0.026, 16, 32);
    const bandMesh = new THREE.Mesh(bandGeo, redTrimMaterial);
    bandMesh.position.set(0, 0.44, -0.32);
    bandMesh.rotation.x = Math.PI * 0.32;
    headGroup.add(bandMesh);

    // 3-Segment Articulated Dynamic Ponytail (Responsive Hair Inertia Physics)
    const ponyRoot = new THREE.Group();
    ponyRoot.position.set(0, 0.42, -0.34);
    headGroup.add(ponyRoot);
    ponyRootRef.current = ponyRoot;

    // Segment 1: Root
    const pony1Geo = new THREE.CylinderGeometry(0.07, 0.1, 0.26, 16);
    const pony1 = new THREE.Mesh(pony1Geo, hairMaterial);
    pony1.position.y = -0.13;
    pony1.castShadow = true;
    ponyRoot.add(pony1);

    // Segment 2: Mid
    const ponyMid = new THREE.Group();
    ponyMid.position.set(0, -0.25, -0.02);
    ponyRoot.add(ponyMid);
    ponyMidRef.current = ponyMid;

    const pony2Geo = new THREE.CylinderGeometry(0.09, 0.08, 0.28, 16);
    const pony2 = new THREE.Mesh(pony2Geo, hairMaterial);
    pony2.position.y = -0.14;
    pony2.castShadow = true;
    ponyMid.add(pony2);

    // Segment 3: Tip
    const ponyTip = new THREE.Group();
    ponyTip.position.set(0, -0.27, -0.02);
    ponyMid.add(ponyTip);
    ponyTipRef.current = ponyTip;

    const pony3Geo = new THREE.ConeGeometry(0.08, 0.26, 16);
    pony3Geo.rotateX(Math.PI);
    const pony3 = new THREE.Mesh(pony3Geo, hairMaterial);
    pony3.position.y = -0.13;
    pony3.castShadow = true;
    ponyTip.add(pony3);

    // High-Fidelity Photorealistic Eyes with Wet Specular Reflections
    const createEye = (isRight: boolean) => {
      const eyeGroup = new THREE.Group();
      const x = isRight ? 0.108 : -0.108;
      eyeGroup.position.set(x, 0.225, 0.275);

      // Natural sclera
      const scleraGeo = new THREE.SphereGeometry(0.062, 20, 20);
      scleraGeo.scale(1.22, 0.86, 0.58);
      const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMaterial);
      eyeGroup.add(sclera);

      // Hazel-Green Iris with detailed radial fibers
      const irisGeo = new THREE.CircleGeometry(0.036, 32);
      const iris = new THREE.Mesh(irisGeo, irisMaterial);
      iris.position.set(0, 0, 0.038);
      eyeGroup.add(iris);

      // Pupil
      const pupilGeo = new THREE.CircleGeometry(0.018, 20);
      const pupil = new THREE.Mesh(pupilGeo, pupilMaterial);
      pupil.position.set(0, 0, 0.04);
      eyeGroup.add(pupil);

      // Wet Specular Reflection
      const sparkGeo = new THREE.CircleGeometry(0.007, 16);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(0.011, 0.011, 0.042);
      eyeGroup.add(spark);

      // 3D Curved Eyelashes framing the eye
      const lashGeo = new THREE.TorusGeometry(0.045, 0.006, 8, 24, Math.PI * 0.7);
      const lashMat = new THREE.MeshBasicMaterial({ color: 0x110B09 });
      const lash = new THREE.Mesh(lashGeo, lashMat);
      lash.position.set(0, 0.024, 0.034);
      lash.rotation.z = isRight ? -0.1 : 0.1;
      eyeGroup.add(lash);

      // Delicate Eyelid for Realistic Blinking
      const lidGeo = new THREE.SphereGeometry(0.066, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
      lidGeo.scale(1.24, 0.88, 0.6);
      const lid = new THREE.Mesh(lidGeo, skinMaterial);
      lid.position.set(0, 0.018, 0.008);
      lid.scale.y = 0.05;
      eyeGroup.add(lid);
      eyelidsRef.current.push(lid);

      return eyeGroup;
    };

    headGroup.add(createEye(false));
    headGroup.add(createEye(true));

    // Delicate Eyebrows
    const browGeo = new THREE.TorusGeometry(0.065, 0.009, 8, 24, Math.PI * 0.65);
    const browMat = new THREE.MeshStandardMaterial({ color: 0x221714, roughness: 0.4 });
    const browLeft = new THREE.Mesh(browGeo, browMat);
    browLeft.position.set(-0.11, 0.285, 0.27);
    browLeft.rotation.z = -0.12;
    headGroup.add(browLeft);

    const browRight = new THREE.Mesh(browGeo, browMat);
    browRight.position.set(0.11, 0.285, 0.27);
    browRight.rotation.z = 0.12;
    headGroup.add(browRight);

    // Natural Contoured Lips with Gloss
    const upperLipGeo = new THREE.TorusGeometry(0.038, 0.012, 12, 24, Math.PI * 0.85);
    const upperLip = new THREE.Mesh(upperLipGeo, lipsMaterial);
    upperLip.position.set(0, 0.095, 0.29);
    upperLip.rotation.x = Math.PI * 0.12;
    upperLip.rotation.z = Math.PI;
    headGroup.add(upperLip);

    const lowerLipGeo = new THREE.TorusGeometry(0.034, 0.014, 12, 24, Math.PI * 0.8);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipsMaterial);
    lowerLip.position.set(0, 0.075, 0.285);
    lowerLip.rotation.x = -Math.PI * 0.12;
    headGroup.add(lowerLip);

    // --- ARMS & DELICATE ARTICULATED HANDS ---
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.38, 1.68, 0);
    avatarGroup.add(leftArmGroup);

    const sleeveGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.25, 20);
    const leftSleeve = new THREE.Mesh(sleeveGeo, jerseyMaterial);
    leftSleeve.position.y = -0.11;
    leftArmGroup.add(leftSleeve);

    const armGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.62, 20);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMaterial);
    leftArmMesh.position.set(0, -0.46, 0);
    leftArmGroup.add(leftArmMesh);
    leftArmGroup.rotation.z = 0.16;
    leftArmGroup.rotation.x = 0.06;

    // Articulated Feminine Left Hand
    const handGroupLeft = new THREE.Group();
    handGroupLeft.position.set(0, -0.76, 0);
    leftArmGroup.add(handGroupLeft);
    const palmLeft = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.03), skinMaterial);
    handGroupLeft.add(palmLeft);
    const thumbLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.04, 12), skinMaterial);
    thumbLeft.position.set(0.035, -0.01, 0.01);
    thumbLeft.rotation.z = -0.4;
    handGroupLeft.add(thumbLeft);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.38, 1.68, 0);
    avatarGroup.add(rightArmGroup);
    rightArmRef.current = rightArmGroup;

    const rightSleeve = new THREE.Mesh(sleeveGeo, jerseyMaterial);
    rightSleeve.position.y = -0.11;
    rightArmGroup.add(rightSleeve);

    const rightUpperGeo = new THREE.CylinderGeometry(0.075, 0.068, 0.34, 20);
    const rightUpperMesh = new THREE.Mesh(rightUpperGeo, skinMaterial);
    rightUpperMesh.position.y = -0.28;
    rightArmGroup.add(rightUpperMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.46, 0);
    rightArmGroup.add(rightForearm);
    rightForearmRef.current = rightForearm;

    const rightForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.056, 0.32, 20),
      skinMaterial
    );
    rightForearmMesh.position.y = -0.15;
    rightForearm.add(rightForearmMesh);

    // Articulated Right Hand
    const handGroupRight = new THREE.Group();
    handGroupRight.position.set(0, -0.32, 0);
    rightForearm.add(handGroupRight);
    const palmRight = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.03), skinMaterial);
    handGroupRight.add(palmRight);
    const thumbRight = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.04, 12), skinMaterial);
    thumbRight.position.set(-0.035, -0.01, 0.01);
    thumbRight.rotation.z = 0.4;
    handGroupRight.add(thumbRight);

    rightArmGroup.rotation.z = -0.16;

    // --- HIPS & SHORTS ---
    const hipsGroup = new THREE.Group();
    hipsGroup.position.set(0, 0.9, 0);
    avatarGroup.add(hipsGroup);

    const shortsGeo = new THREE.CylinderGeometry(0.31, 0.34, 0.36, 28);
    shortsGeo.scale(1.0, 1.0, 0.82);
    const shortsMesh = new THREE.Mesh(shortsGeo, shortsMaterial);
    shortsMesh.castShadow = true;
    hipsGroup.add(shortsMesh);

    const createLeg = (isRight: boolean) => {
      const leg = new THREE.Group();
      const x = isRight ? 0.14 : -0.14;
      leg.position.set(x, -0.18, 0);

      // Thigh with natural contour
      const thighGeo = new THREE.CylinderGeometry(0.11, 0.082, 0.46, 20);
      const thigh = new THREE.Mesh(thighGeo, skinMaterial);
      thigh.position.y = -0.22;
      thigh.castShadow = true;
      leg.add(thigh);

      // Athletic Knee definition
      const kneeGeo = new THREE.SphereGeometry(0.078, 16, 16);
      const knee = new THREE.Mesh(kneeGeo, skinMaterial);
      knee.position.set(0, -0.44, 0.01);
      leg.add(knee);

      // Calf and Sock
      const sockGeo = new THREE.CylinderGeometry(0.085, 0.072, 0.48, 20);
      const sock = new THREE.Mesh(sockGeo, sockMaterial);
      sock.position.y = -0.68;
      sock.castShadow = true;
      leg.add(sock);

      const bandSockGeo = new THREE.CylinderGeometry(0.088, 0.085, 0.05, 20);
      const bandSock = new THREE.Mesh(bandSockGeo, redTrimMaterial);
      bandSock.position.y = -0.46;
      leg.add(bandSock);

      // Sculpted Athletic Sneakers
      const shoeGeo = new THREE.BoxGeometry(0.12, 0.09, 0.26);
      const shoe = new THREE.Mesh(shoeGeo, shoeMaterial);
      shoe.position.set(0, -0.92, 0.04);
      shoe.castShadow = true;
      leg.add(shoe);

      const soleGeo = new THREE.BoxGeometry(0.13, 0.03, 0.28);
      const soleMat = new THREE.MeshStandardMaterial({ color: 0x111319, roughness: 0.6 });
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(0, -0.965, 0.04);
      leg.add(sole);

      return leg;
    };

    hipsGroup.add(createLeg(false));
    hipsGroup.add(createLeg(true));

    // --- PEDESTAL STAGE ---
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -0.3, 0);
    avatarGroup.add(pedestalGroup);

    const baseDiscGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.08, 48);
    const baseDiscMat = new THREE.MeshStandardMaterial({
      color: 0x111319,
      roughness: 0.2,
      metalness: 0.8,
    });
    const baseDisc = new THREE.Mesh(baseDiscGeo, baseDiscMat);
    baseDisc.receiveShadow = true;
    pedestalGroup.add(baseDisc);

    const innerRingGeo = new THREE.RingGeometry(1.2, 1.28, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x25F4EE,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI * 0.5;
    innerRing.position.y = 0.045;
    pedestalGroup.add(innerRing);

    const outerRingGeo = new THREE.RingGeometry(1.5, 1.56, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xFE2C55,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI * 0.5;
    outerRing.position.y = 0.046;
    pedestalGroup.add(outerRing);

    // Floating particles
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 4;
      particlePos[i + 1] = Math.random() * 3 - 0.5;
      particlePos[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x25F4EE,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 7. Animation Loop
    let animationFrameId: number;
    let blinkTimer = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle Swiping Momentum & Rotation (Item: Digeser 360°)
      if (!isDraggingRef.current) {
        currentRotationRef.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.94;

        if (Math.abs(angularVelocityRef.current) < 0.0001) {
          angularVelocityRef.current = 0;
        }
      }

      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = currentRotationRef.current;
      }

      const deg = Math.round(((-currentRotationRef.current * (180 / Math.PI)) % 360 + 360) % 360);
      setRotationDeg(deg);

      if (Math.abs(deg - lastSoundTickDeg.current) >= 30) {
        lastSoundTickDeg.current = deg;
        SoundFx.playJerseyRotateTick();
      }

      // Breathing & time scale
      const time = currentTime * 0.002;

      // --- DYNAMIC HAIR & BUST SECONDARY PHYSICS SIMULATION ---
      const angVel = angularVelocityRef.current;
      const safeDt = Math.min(dt, 0.05); // Prevent explosive delta during frame drops
      const angAccel = safeDt > 0.0001 ? (angVel - prevAngularVelRef.current) / safeDt : 0;
      prevAngularVelRef.current = angVel;

      // 1. Hair Inertia Dynamics (Ponytail sway & centrifugal lift when swiped)
      const hairTorque = -angAccel * 0.08 - angVel * 5.2;
      const hairSpringK = 36.0;
      const hairDamping = 5.8;
      hairSwayVelRef.current += (-hairSpringK * hairSwayAngleRef.current - hairDamping * hairSwayVelRef.current + hairTorque) * safeDt;
      hairSwayAngleRef.current += hairSwayVelRef.current * safeDt;
      hairSwayAngleRef.current = THREE.MathUtils.clamp(hairSwayAngleRef.current, -0.65, 0.65);

      if (ponyRootRef.current) {
        // Lateral sway responding to drag/spin direction
        ponyRootRef.current.rotation.z = hairSwayAngleRef.current;
        // Centrifugal lift as rotation speed rises
        const centrifugal = Math.min(0.55, Math.abs(angVel) * 4.0);
        ponyRootRef.current.rotation.x = -Math.PI * 0.22 - centrifugal;
      }
      if (ponyMidRef.current) {
        ponyMidRef.current.rotation.z = hairSwayAngleRef.current * 0.65;
        ponyMidRef.current.rotation.x = Math.sin(time * 2.8) * 0.05;
      }
      if (ponyTipRef.current) {
        ponyTipRef.current.rotation.z = hairSwayAngleRef.current * 0.45;
      }
      if (bangsLeftRef.current && bangsRightRef.current) {
        bangsLeftRef.current.rotation.z = 0.28 + hairSwayAngleRef.current * 0.2;
        bangsRightRef.current.rotation.z = -0.35 + hairSwayAngleRef.current * 0.2;
      }

      // 2. Bust & Clothing Organic Soft-Body Dynamics (Secondary sway & bounce when moved)
      const bustInertiaX = -angVel * 0.35;
      const bustSpringK = 46.0;
      const bustDamping = 7.0;
      bustVelXRef.current += (-bustSpringK * bustOffsetXRef.current - bustDamping * bustVelXRef.current + bustInertiaX) * safeDt;
      bustOffsetXRef.current += bustVelXRef.current * safeDt;
      bustOffsetXRef.current = THREE.MathUtils.clamp(bustOffsetXRef.current, -0.035, 0.035);

      // Vertical bounce coupled with rotation impulse & natural breathing
      const verticalJolt = Math.abs(angVel) * 0.16;
      const breathPulse = Math.sin(time * 2.2) * 0.012;
      bustVelYRef.current += (-bustSpringK * bustOffsetYRef.current - bustDamping * bustVelYRef.current + verticalJolt) * safeDt;
      bustOffsetYRef.current += bustVelYRef.current * safeDt;
      bustOffsetYRef.current = THREE.MathUtils.clamp(bustOffsetYRef.current, -0.025, 0.025);

      if (bustGroupRef.current) {
        bustGroupRef.current.position.x = bustOffsetXRef.current;
        bustGroupRef.current.position.y = 1.44 + bustOffsetYRef.current + breathPulse;
        bustGroupRef.current.rotation.z = -bustOffsetXRef.current * 0.5;
      }

      // Breathing & subtle life
      if (chestRef.current) {
        chestRef.current.scale.x = 1.0 + Math.sin(time * 2.2) * 0.02;
        chestRef.current.scale.z = 0.75 + Math.sin(time * 2.2) * 0.02;
      }

      if (headGroupRef.current && !isReacting) {
        headGroupRef.current.rotation.y = Math.sin(time * 1.4) * 0.04;
        headGroupRef.current.rotation.z = Math.cos(time * 1.8) * 0.02;
      }

      innerRing.rotation.z += 0.008;
      outerRing.rotation.z -= 0.005;

      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += dt * 0.25;
          if (positions[i] > 2.8) positions[i] = -0.5;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Blinking
      blinkTimer += dt;
      if (blinkTimer > 3.2) {
        const blinkProgress = Math.sin((blinkTimer - 3.2) * Math.PI * 8);
        eyelidsRef.current.forEach(lid => {
          lid.scale.y = blinkProgress > 0 ? 0.95 : 0.05;
        });
        if (blinkTimer > 3.4) blinkTimer = 0;
      }

      // Waving Reaction
      if (rightArmRef.current && rightForearmRef.current) {
        if (waveTimeRef.current > 0) {
          waveTimeRef.current -= dt;
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -2.1, 0.15);
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.4, 0.15);
          rightForearmRef.current.rotation.z = Math.sin(currentTime * 0.015) * 0.45 - 0.2;

          if (headGroupRef.current) {
            headGroupRef.current.rotation.z = -0.08;
            headGroupRef.current.rotation.y = 0.05;
          }
        } else {
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.18, 0.08);
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.08);
          rightForearmRef.current.rotation.z = THREE.MathUtils.lerp(rightForearmRef.current.rotation.z, 0, 0.08);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Pointer & Touch Events for Dragging 360° (Geser Layar Bebas Tombol)
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    prevPointerXRef.current = clientX;
    angularVelocityRef.current = 0;
    setShowSwipeHint(false);
  };

  const handlePointerMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - prevPointerXRef.current;
    prevPointerXRef.current = clientX;

    const rotationDelta = deltaX * 0.009;
    currentRotationRef.current += rotationDelta;
    angularVelocityRef.current = rotationDelta;
  }, []);

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Avatar Touch Response (Skin Touch Effect & Response)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    SoundFx.unlockAudio();
    SoundFx.playSkinTouchSound();
    SoundFx.playAvatarTouchReaction();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const rippleColors = ['#FFA88C', '#25F4EE', '#FE2C55'];
      const newRipple: TouchRipple = {
        id: Date.now() + Math.random(),
        x,
        y,
        color: rippleColors[Math.floor(Math.random() * rippleColors.length)],
      };
      setRipples(prev => [...prev.slice(-3), newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 900);
    }

    waveTimeRef.current = 2.4;
    setIsReacting(true);
    setTouchCount(prev => prev + 1);

    const randomMsg = AVATAR_RESPONSES[touchCount % AVATAR_RESPONSES.length];
    setResponseText(randomMsg);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const shortLine = touchCount % 2 === 0
          ? "Hello! Welcome to Seller Profit! Let's boost your sales today!"
          : "GGMU! System online. Please enjoy your sale!";
        const utt = new SpeechSynthesisUtterance(shortLine);
        utt.lang = 'en-US';
        utt.pitch = 1.25;
        utt.rate = 1.05;
        window.speechSynthesis.speak(utt);
      } catch {}
    }

    if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
    reactTimeoutRef.current = setTimeout(() => {
      setIsReacting(false);
    }, 3800);
  };

  // Trigger happy avatar celebration when outfit is equipped
  const triggerOutfitEquippedReaction = (outfitName: string) => {
    SoundFx.unlockAudio();
    SoundFx.playOutfitEquipSound();

    waveTimeRef.current = 3.0;
    setIsReacting(true);
    setResponseText(`Outfit baruku "${outfitName}" berhasil dipasang! Keren banget! Terima kasih ya! ✨`);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance("Outfit equipped! Looking fabulous! Thank you!");
        utt.lang = 'en-US';
        utt.pitch = 1.3;
        utt.rate = 1.1;
        window.speechSynthesis.speak(utt);
      } catch {}
    }

    if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
    reactTimeoutRef.current = setTimeout(() => {
      setIsReacting(false);
    }, 4500);
  };

  // Image Upload / File Import Handler with Global Processing HUD
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file format gambar (JPG, PNG, WEBP)');
      return;
    }

    ProcessingService.show({
      title: 'MEMPROSES TEKSTUR OUTFIT 3D',
      message: `Mengonversi file "${file.name}" dan memetakan pola ke tubuh Virtual Human...`,
      durationMs: 1400,
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        setCustomImageElement(img);

        const newOutfit: OutfitConfig = {
          type: 'custom',
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20),
          imageUrl: dataUrl,
          mode: activeOutfit.mode || 'jersey',
          baseColor: activeOutfit.baseColor || '#C70101',
          accentColor: activeOutfit.accentColor || '#FFFFFF',
        };

        setActiveOutfit(newOutfit);
        applyOutfitToAvatar(newOutfit, img);
        triggerOutfitEquippedReaction(newOutfit.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Preset Select Handler with Global Processing HUD
  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    ProcessingService.show({
      title: 'MENERAPKAN OUTFIT 3D',
      message: `Memuat preset ${preset.name} dan material Virtual Human...`,
      durationMs: 1200,
    });

    const newOutfit: OutfitConfig = {
      type: preset.id === 'mu-home' ? 'default-mu' : 'preset',
      presetId: preset.id,
      name: preset.name,
      mode: preset.mode,
      baseColor: preset.baseColor,
      accentColor: preset.accentColor,
    };
    setActiveOutfit(newOutfit);
    setCustomImageElement(null);
    applyOutfitToAvatar(newOutfit, null);
    triggerOutfitEquippedReaction(preset.name);
  };

  // Drag and Drop File Handlers on Viewport
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen flex flex-col justify-between overflow-hidden bg-[#07080b] select-none"
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={(e) => {
        if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
      }}
      onTouchEnd={handlePointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Image Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
          }
        }}
      />

      {/* Cyber Stadium Atmosphere Background */}
      <div className="absolute inset-0 bg-radial from-[#FE2C55]/15 via-[#0c0e14]/90 to-[#07080b] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Drag & Drop Overlay Indicator */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-50 bg-black/85 border-4 border-dashed border-[#25F4EE] backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center animate-pulse pointer-events-none">
          <div className="p-5 rounded-full bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/60 shadow-[0_0_30px_rgba(37,244,238,0.5)]">
            <Upload className="w-12 h-12 animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Lepaskan Gambar Outfit Disini!</h2>
            <p className="text-sm text-[#25F4EE] mt-1">Virtual human akan langsung mengenakan pakaian bermotif gambarmu</p>
          </div>
        </div>
      )}

      {/* Top Floating Spatial Header - Generous safe area padding so top text is never cut off */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-7 sm:pt-10 pt-[max(1.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-4 pointer-events-auto overflow-visible">
        {/* Left Badge: Virtual Human & Active Outfit Name */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#161823]/80 border border-white/10 backdrop-blur-md shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55] animate-ping" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-widest text-white uppercase">VIRTUAL HUMAN 3D</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FE2C55]/30 text-[#FE2C55] font-bold uppercase">
                {activeOutfit.type === 'custom' ? 'CUSTOM' : '360°'}
              </span>
            </div>
            <span className="text-[9px] font-semibold text-zinc-400 truncate max-w-[170px] sm:max-w-[240px]">
              {activeOutfit.name}
            </span>
          </div>
        </div>

        {/* Center Gyro Compass */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161823]/70 border border-[#25F4EE]/30 text-xs font-mono text-[#25F4EE] shadow-[0_0_15px_rgba(37,244,238,0.2)]">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>ROTASI: {rotationDeg}° / 360°</span>
        </div>

        {/* Right Actions: Import Outfit Button & Masuk / Login Button */}
        <div className="flex items-center gap-2.5">
          {/* Import Outfit Button with Pulsing Glow */}
          <button
            id="btn-import-outfit-toggle"
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setIsOutfitDrawerOpen(!isOutfitDrawerOpen);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#161823]/90 hover:bg-[#1f2233] border border-[#25F4EE]/60 text-white font-bold text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-[#25F4EE]/20 cursor-pointer active:scale-95 transition-all"
            title="Ganti atau Import Gambar Baju Avatar"
          >
            <Shirt className="w-4 h-4 text-[#25F4EE]" />
            <span className="hidden sm:inline">Ganti / Import Baju</span>
            <span className="sm:hidden">Outfit</span>
            <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-pulse" />
          </button>

          {/* Masuk / Login Button */}
          <button
            id="btn-beranda-login"
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              onOpenLoginModal();
            }}
            className="spatial-button px-5 py-2 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#00d2ff] hover:from-[#3ffef9] hover:to-[#25F4EE] text-zinc-950 font-black text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-[#25F4EE]/30 cursor-pointer border border-[#25F4EE]/60 active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-zinc-950" />
            <span>Masuk / Login</span>
          </button>
        </div>
      </div>

      {/* Main 3D WebGL Canvas (Full interactive area to Drag / Swipe 360° & Touch) */}
      <div className="relative z-10 flex-1 w-full h-full flex items-center justify-center">
        {/* Floating Speech Bubble When Avatar Responds */}
        {responseText && (
          <div 
            className={`absolute top-24 sm:top-28 z-40 max-w-sm sm:max-w-md mx-4 px-4 py-3 rounded-2xl bg-[#161823]/95 border border-[#25F4EE]/60 shadow-[0_0_30px_rgba(37,244,238,0.35)] backdrop-blur-xl text-center transition-all duration-300 ${
              isReacting ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#25F4EE] uppercase tracking-wider mb-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Respon Virtual Human 3D</span>
              <Heart className="w-3.5 h-3.5 text-[#FE2C55] fill-[#FE2C55] animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-white leading-relaxed">
              "{responseText}"
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#161823] border-b border-r border-[#25F4EE]/60 rotate-45" />
          </div>
        )}

        {/* 3D Canvas element */}
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
          }}
          onClick={handleCanvasClick}
        />

        {/* Touch Ripple Visual Animations */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none animate-ping z-30"
            style={{
              left: ripple.x - 35,
              top: ripple.y - 35,
              width: 70,
              height: 70,
              borderColor: ripple.color,
              borderWidth: 3,
              boxShadow: `0 0 30px ${ripple.color}`,
            }}
          />
        ))}

        {/* Swipe & Touch Instructional Overlay Pill (Disappears upon first swipe) */}
        {showSwipeHint && (
          <div className="absolute bottom-20 z-20 pointer-events-none flex flex-col items-center gap-2 animate-bounce">
            <div className="px-4 py-2 rounded-full bg-black/80 border border-[#25F4EE]/60 backdrop-blur-md shadow-xl text-xs font-bold text-white flex items-center gap-2">
              <Hand className="w-4 h-4 text-[#25F4EE] animate-pulse" />
              <span>Geser layar untuk memutar karakter 360° bebas tombol</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="relative z-30 w-full max-w-xl mx-auto px-4 pb-5 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="spatial-card w-full py-2 px-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-zinc-300">
          <div className="flex items-center gap-2 font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-ping" />
            <span className="hidden sm:inline">Geser jari/mouse untuk memutar 360° • Sentuh avatar untuk respon</span>
            <span className="sm:hidden">Geser untuk 360° • Sentuh avatar</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Ganti Baju Trigger */}
            <button
              type="button"
              onClick={() => {
                SoundFx.unlockAudio();
                setIsOutfitDrawerOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition shrink-0"
              title="Ganti Outfit / Import Gambar"
            >
              <Upload className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Import Baju</span>
            </button>

            {/* Sapa Avatar Button */}
            <button
              type="button"
              onClick={(e) => handleCanvasClick(e as any)}
              className="px-3 py-1 rounded-xl bg-[#25F4EE]/20 hover:bg-[#25F4EE]/30 border border-[#25F4EE]/50 text-[#25F4EE] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sapa</span>
              {touchCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FE2C55] text-white text-[9px] font-black">
                  {touchCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SPATIAL DRAWER / MODAL: IMPORT GAMBAR OUTFIT VIRTUAL HUMAN           */}
      {/* ==================================================================== */}
      {isOutfitDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#11131a] border border-[#25F4EE]/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(37,244,238,0.2)] max-h-[90vh] overflow-y-auto text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#25F4EE]/20 border border-[#25F4EE]/50 text-[#25F4EE]">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                    <span>Ganti Outfit Virtual Human</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
                  </h3>
                  <p className="text-xs text-zinc-400">Import gambar dari perangkatmu untuk dijadikan pakaian avatar 3D</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOutfitDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Drag & Drop File Upload Box */}
            <div className="mt-5">
              <label className="text-xs font-bold text-[#25F4EE] uppercase tracking-wider block mb-2">
                1. Import Gambar dari Perangkat
              </label>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#25F4EE]/50 hover:border-[#25F4EE] bg-[#161823]/90 hover:bg-[#1c1f2e] rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center gap-3 group"
              >
                <div className="p-3.5 rounded-full bg-[#25F4EE]/10 group-hover:bg-[#25F4EE]/20 border border-[#25F4EE]/40 text-[#25F4EE] transition-transform group-hover:scale-110">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-white group-hover:text-[#25F4EE] transition">
                    Klik untuk Pilih Gambar atau Tarik & Lepas (Drag & Drop)
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">
                    Mendukung file PNG, JPG, WEBP (Logo, Desain Baju, Foto, Motif Batik, dll)
                  </span>
                </div>

                {/* Active Custom Image Preview if available */}
                {activeOutfit.type === 'custom' && activeOutfit.imageUrl && (
                  <div className="flex items-center gap-3 mt-1 p-2 rounded-xl bg-black/60 border border-white/10 w-full justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={activeOutfit.imageUrl} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-[#25F4EE]/40" 
                      />
                      <div className="text-left truncate">
                        <span className="text-[11px] font-bold text-white block truncate">{activeOutfit.name}</span>
                        <span className="text-[9px] text-[#25F4EE]">Sedang Terpasang di Avatar</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#25F4EE]/20 hover:bg-[#25F4EE]/30 text-[#25F4EE] text-[10px] font-bold border border-[#25F4EE]/40"
                    >
                      Ganti Gambar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Outfit Style Mode (When Custom Image is Imported) */}
            {activeOutfit.type === 'custom' && (
              <div className="mt-5">
                <label className="text-xs font-bold text-[#25F4EE] uppercase tracking-wider block mb-2">
                  2. Gaya Penataan Gambar
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated: OutfitConfig = { ...activeOutfit, mode: 'jersey' };
                      setActiveOutfit(updated);
                      applyOutfitToAvatar(updated, customImageElement);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      activeOutfit.mode === 'jersey'
                        ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Shirt className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Jersey Sport</span>
                    <span className="text-[9px] text-zinc-400">Sponsor Dada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated: OutfitConfig = { ...activeOutfit, mode: 'logo' };
                      setActiveOutfit(updated);
                      applyOutfitToAvatar(updated, customImageElement);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      activeOutfit.mode === 'logo'
                        ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Sablon Dada</span>
                    <span className="text-[9px] text-zinc-400">Graphic Tee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated: OutfitConfig = { ...activeOutfit, mode: 'full' };
                      setActiveOutfit(updated);
                      applyOutfitToAvatar(updated, customImageElement);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      activeOutfit.mode === 'full'
                        ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Motif Penuh</span>
                    <span className="text-[9px] text-zinc-400">Full Print Wrap</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Base Shirt Color Selector */}
            <div className="mt-5">
              <label className="text-xs font-bold text-[#25F4EE] uppercase tracking-wider block mb-2">
                {activeOutfit.type === 'custom' ? '3. Warna Dasar Kaos / Jersey' : '2. Pilihan Warna Dasar'}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {BASE_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      const updated: OutfitConfig = {
                        ...activeOutfit,
                        baseColor: c.value,
                        accentColor: c.accent,
                      };
                      setActiveOutfit(updated);
                      applyOutfitToAvatar(updated, customImageElement);
                    }}
                    className={`h-10 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                      activeOutfit.baseColor === c.value ? 'ring-2 ring-[#25F4EE] border-white' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {activeOutfit.baseColor === c.value && (
                      <Check className="w-4 h-4" style={{ color: c.accent }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ready Preset Outfits */}
            <div className="mt-5">
              <label className="text-xs font-bold text-[#25F4EE] uppercase tracking-wider block mb-2">
                Pilihan Preset Siap Pakai
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      activeOutfit.type !== 'custom' && (activeOutfit.presetId === p.id || (p.id === 'mu-home' && activeOutfit.type === 'default-mu'))
                        ? 'bg-[#FE2C55]/20 border-[#FE2C55] text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/20" 
                        style={{ backgroundColor: p.baseColor }} 
                      />
                      <span className="text-xs font-bold">{p.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                      {p.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const defaultMU: OutfitConfig = {
                    type: 'default-mu',
                    name: 'Jersey Manchester United 24/25',
                    mode: 'jersey',
                    baseColor: '#C70101',
                    accentColor: '#FFFFFF',
                  };
                  setActiveOutfit(defaultMU);
                  setCustomImageElement(null);
                  applyOutfitToAvatar(defaultMU, null);
                  triggerOutfitEquippedReaction('Jersey Manchester United Asli');
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke MU Asli</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOutfitDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#00d2ff] hover:from-[#3ffef9] hover:to-[#25F4EE] text-zinc-950 font-black text-xs tracking-wider uppercase cursor-pointer shadow-lg shadow-[#25F4EE]/25 transition"
              >
                Selesai / Pasang Outfit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
