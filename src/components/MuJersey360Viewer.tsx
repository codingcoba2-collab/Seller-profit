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
 * Procedural Photorealistic PBR Skin Texture Generator (2048x2048)
 * Features organic porcelain-peach micro-tonal gradation, fine pores, subtle melanin shading,
 * realistic facial pigmentation, natural eyebrows, lip striations, and clavicle contour
 */
function createPhotorealisticSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // Warm organic ivory-peach base gradient with anatomical temperature variations
  const grad = ctx.createLinearGradient(0, 0, 0, 2048);
  grad.addColorStop(0, '#FFF0E8');    // Forehead / temples: soft luminous ivory
  grad.addColorStop(0.25, '#FCE4D6'); // Mid-face: warm peach
  grad.addColorStop(0.5, '#F8D8C8');  // Cheeks / chin: rich organic peach
  grad.addColorStop(0.75, '#F2CCBA'); // Neck / clavicle: gentle warmth
  grad.addColorStop(1, '#E6BFA8');    // Torso / extremities: soft caramel tone
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 2048);

  // Micro skin pore noise & fine melanin tonal variations to remove any plastic/flat look
  const imgData = ctx.getImageData(0, 0, 2048, 2048);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 9;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.82));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.65));
  }
  ctx.putImageData(imgData, 0, 0);

  // Soft natural peach blush around cheeks area
  const blushGrad1 = ctx.createRadialGradient(512, 640, 40, 512, 640, 320);
  blushGrad1.addColorStop(0, 'rgba(242, 140, 155, 0.28)');
  blushGrad1.addColorStop(0.6, 'rgba(242, 140, 155, 0.12)');
  blushGrad1.addColorStop(1, 'rgba(242, 140, 155, 0)');
  ctx.fillStyle = blushGrad1;
  ctx.fillRect(200, 360, 624, 560);

  const blushGrad2 = ctx.createRadialGradient(1536, 640, 40, 1536, 640, 320);
  blushGrad2.addColorStop(0, 'rgba(242, 140, 155, 0.28)');
  blushGrad2.addColorStop(0.6, 'rgba(242, 140, 155, 0.12)');
  blushGrad2.addColorStop(1, 'rgba(242, 140, 155, 0)');
  ctx.fillStyle = blushGrad2;
  ctx.fillRect(1224, 360, 624, 560);

  // Subtle natural lip pigmentation with Cupid's bow and soft vermilion border
  const lipGrad = ctx.createRadialGradient(1024, 1100, 30, 1024, 1100, 260);
  lipGrad.addColorStop(0, 'rgba(214, 100, 115, 0.45)');
  lipGrad.addColorStop(0.7, 'rgba(198, 88, 105, 0.25)');
  lipGrad.addColorStop(1, 'rgba(198, 88, 105, 0)');
  ctx.fillStyle = lipGrad;
  ctx.fillRect(700, 950, 648, 300);

  // Vertical lip micro-creases for natural tactile fidelity
  ctx.strokeStyle = 'rgba(175, 70, 85, 0.22)';
  ctx.lineWidth = 1.8;
  for (let lx = 820; lx < 1228; lx += 14) {
    ctx.beginPath();
    ctx.moveTo(lx, 1040 + Math.sin(lx * 0.05) * 6);
    ctx.lineTo(lx + (Math.random() - 0.5) * 6, 1140 + Math.cos(lx * 0.05) * 8);
    ctx.stroke();
  }

  // Feathered natural eyebrows with multi-layered directional hair strokes
  const drawEyebrow = (startX: number, isRight: boolean) => {
    ctx.strokeStyle = 'rgba(38, 25, 20, 0.4)';
    ctx.lineWidth = 1.6;
    for (let bx = 0; bx < 280; bx += 7) {
      const x = isRight ? startX + bx : startX - bx;
      const arch = Math.sin((bx / 280) * Math.PI) * 26;
      const y = 480 - arch;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (isRight ? 10 : -10), y - 14 - (Math.random() * 8));
      ctx.stroke();
    }
  };
  drawEyebrow(720, false);
  drawEyebrow(1328, true);

  // Subtle clavicle and suprasternal notch contour shading
  const neckShade = ctx.createLinearGradient(0, 1450, 0, 1850);
  neckShade.addColorStop(0, 'rgba(185, 135, 120, 0)');
  neckShade.addColorStop(0.5, 'rgba(185, 135, 120, 0.22)');
  neckShade.addColorStop(1, 'rgba(185, 135, 120, 0)');
  ctx.fillStyle = neckShade;
  ctx.fillRect(0, 1450, 2048, 400);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Skin Bump / Normal Map (1024x1024)
 * Generates tactile micro-pore relief, fine epidermal texture, and lip wrinkles
 */
function createPhotorealisticSkinBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Neutral mid-gray base
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);

  // High-frequency skin pore noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const val = 128 + (Math.random() - 0.5) * 36;
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

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
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base sclera with natural gentle shading & warm ivory tone
  ctx.fillStyle = '#F8F5F2';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-capillary vein gradients at peripheral edges of the sclera
  ctx.strokeStyle = 'rgba(215, 80, 80, 0.12)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 28; i++) {
    const startX = Math.random() < 0.5 ? 60 + Math.random() * 80 : 880 + Math.random() * 80;
    const startY = 200 + Math.random() * 600;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + (Math.random() - 0.5) * 60,
      startY + (Math.random() - 0.5) * 40,
      startX + (Math.random() - 0.5) * 100,
      startY + (Math.random() - 0.5) * 80,
      startX + (Math.random() - 0.5) * 140,
      startY + (Math.random() - 0.5) * 100
    );
    ctx.stroke();
  }

  // Limbal ring (outer dark iris border)
  ctx.beginPath();
  ctx.arc(512, 512, 360, 0, Math.PI * 2);
  ctx.fillStyle = '#141E18';
  ctx.fill();

  // Multi-tone hazel-emerald iris gradient
  const irisGrad = ctx.createRadialGradient(512, 512, 80, 512, 512, 350);
  irisGrad.addColorStop(0, '#8A9E58');   // Warm golden hazel center
  irisGrad.addColorStop(0.35, '#4E7558'); // Rich forest green
  irisGrad.addColorStop(0.75, '#2A4A36'); // Deep emerald
  irisGrad.addColorStop(1, '#15241B');   // Dark limbal edge
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(512, 512, 348, 0, Math.PI * 2);
  ctx.fill();

  // Dense radial striations (180+ delicate iris stroma fibers)
  ctx.strokeStyle = 'rgba(225, 245, 195, 0.32)';
  ctx.lineWidth = 2.0;
  for (let a = 0; a < Math.PI * 2; a += 0.035) {
    ctx.beginPath();
    ctx.moveTo(512 + Math.cos(a) * 110, 512 + Math.sin(a) * 110);
    ctx.lineTo(512 + Math.cos(a) * 335, 512 + Math.sin(a) * 335);
    ctx.stroke();
  }

  // Secondary amber collarette ring
  ctx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(512, 512, 190, 0, Math.PI * 2);
  ctx.stroke();

  // Deep black pupil
  ctx.beginPath();
  ctx.arc(512, 512, 104, 0, Math.PI * 2);
  ctx.fillStyle = '#050706';
  ctx.fill();

  // Wet corneal highlight reflection
  ctx.beginPath();
  ctx.arc(440, 430, 44, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(590, 570, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Photorealistic Hair Texture with directional micro-strands & anisotropic sheen (1024x1024)
 */
function createPhotorealisticHairTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep silky espresso brunette base
  ctx.fillStyle = '#16100E';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro hair strands in longitudinal direction
  ctx.fillStyle = 'rgba(92, 68, 56, 0.35)';
  for (let i = 0; i < 1024; i += 3) {
    ctx.fillRect(i, 0, 1.8, 1024);
  }

  // Secondary warm caramel highlight strands
  ctx.fillStyle = 'rgba(138, 102, 82, 0.22)';
  for (let i = 0; i < 1024; i += 7) {
    ctx.fillRect(i + (Math.random() - 0.5) * 2, 0, 1.4, 1024);
  }

  // Anisotropic glossy specular light band across hair
  const sheenGrad = ctx.createLinearGradient(0, 320, 0, 640);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheenGrad.addColorStop(0.5, 'rgba(185, 150, 130, 0.42)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 320, 1024, 320);

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

    // 2. Camera: Full body fashion model framing (head to toe)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.08, 4.35);
    camera.lookAt(0, 0.08, 0);
    cameraRef.current = camera;

    // 3. Renderer with high-end antialiasing & photographic tone mapping
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
    renderer.toneMappingExposure = 1.12;
    rendererRef.current = renderer;

    // 4. Natural Studio Lighting (Editorial Fashion Portrait Setup)
    const ambientLight = new THREE.AmbientLight(0xFAF8F5, 0.9);
    scene.add(ambientLight);

    // Warm Key Light (5200K daylight key, soft flattering facial modeling)
    const keyLight = new THREE.DirectionalLight(0xFFFAF2, 2.2);
    keyLight.position.set(2.4, 4.5, 3.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    scene.add(keyLight);

    // Soft Cool Studio Fill Light (balances shadows naturally, 3:1 contrast ratio)
    const fillLight = new THREE.DirectionalLight(0xEAF2FA, 1.15);
    fillLight.position.set(-2.8, 2.6, 2.8);
    scene.add(fillLight);

    // Subtle Hair & Shoulder Rim Backlight
    const rimLight = new THREE.DirectionalLight(0xFFFFFF, 1.6);
    rimLight.position.set(0.4, 4.2, -3.2);
    scene.add(rimLight);

    // Floor Soft Bounce Light
    const floorBounce = new THREE.DirectionalLight(0xF5ECE2, 0.5);
    floorBounce.position.set(0, -2.0, 2.0);
    scene.add(floorBounce);

    // 5. Photorealistic PBR Materials
    const skinTex = createPhotorealisticSkinTexture();
    const skinBumpMap = createPhotorealisticSkinBumpMap();
    const skinMaterial = new THREE.MeshStandardMaterial({
      map: skinTex,
      bumpMap: skinBumpMap,
      bumpScale: 0.0035,
      roughness: 0.36,
      metalness: 0.02,
      color: 0xFFF5EE,
    });

    const eyeTex = createPhotorealisticEyeTexture();
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xFDFBF8,
      roughness: 0.08,
      metalness: 0.0,
    });

    const irisMaterial = new THREE.MeshStandardMaterial({
      map: eyeTex,
      roughness: 0.04,
      metalness: 0.0,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x050706,
    });

    const tearDuctMaterial = new THREE.MeshStandardMaterial({
      color: 0xEE929C,
      roughness: 0.25,
      metalness: 0.02,
    });

    const hairTex = createPhotorealisticHairTexture();
    const hairMaterial = new THREE.MeshStandardMaterial({
      map: hairTex,
      roughness: 0.28,
      metalness: 0.12,
      color: 0x1A1210,
    });

    const lipsMaterial = new THREE.MeshStandardMaterial({
      color: 0xC85E6E,
      roughness: 0.18,
      metalness: 0.03,
    });

    const nailMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFE0D8,
      roughness: 0.12,
      metalness: 0.05,
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
      color: 0x14141A,
      roughness: 0.55,
    });

    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFDFDFD,
      roughness: 0.25,
      metalness: 0.18,
    });

    const shoeSoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181E,
      roughness: 0.55,
      metalness: 0.1,
    });

    const redTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xC70101,
      roughness: 0.35,
    });

    // 6. Character Hierarchy (Photorealistic Digital Human Root)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0, 0);
    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    // --- TORSO & CHEST (With Dynamic Secondary Physics & Cloth Movement) ---
    const torsoGroup = new THREE.Group();
    avatarGroup.add(torsoGroup);

    // Anatomically proportioned athletic feminine torso (slender waist, natural ribcage)
    const torsoGeo = new THREE.CylinderGeometry(0.31, 0.25, 0.62, 32);
    torsoGeo.scale(1.0, 1.0, 0.76);
    const torsoMesh = new THREE.Mesh(torsoGeo, jerseyMaterial);
    torsoMesh.position.y = 0.48;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoGroup.add(torsoMesh);
    chestRef.current = torsoMesh;

    // Sculpted Clavicle & Collarbone Ridge
    const clavicleGeo = new THREE.TorusGeometry(0.19, 0.016, 16, 32, Math.PI * 0.72);
    const clavicleMesh = new THREE.Mesh(clavicleGeo, skinMaterial);
    clavicleMesh.position.set(0, 0.78, 0.05);
    clavicleMesh.rotation.x = Math.PI * 0.46;
    torsoGroup.add(clavicleMesh);

    // Anatomical Bust & Clothing Overlay Group with Dynamic Inertia Springs
    const bustGroup = new THREE.Group();
    bustGroup.position.set(0, 0.58, 0);
    torsoGroup.add(bustGroup);
    bustGroupRef.current = bustGroup;

    // Left and Right sculpted breasts with organic natural curvature blending with ribcage
    const breastLeftGeo = new THREE.SphereGeometry(0.125, 24, 24);
    breastLeftGeo.scale(1.15, 0.96, 1.15);
    const breastLeftMesh = new THREE.Mesh(breastLeftGeo, jerseyMaterial);
    breastLeftMesh.position.set(-0.105, 0, 0.12);
    breastLeftMesh.rotation.z = -0.12;
    breastLeftMesh.castShadow = true;
    bustGroup.add(breastLeftMesh);

    const breastRightGeo = new THREE.SphereGeometry(0.125, 24, 24);
    breastRightGeo.scale(1.15, 0.96, 1.15);
    const breastRightMesh = new THREE.Mesh(breastRightGeo, jerseyMaterial);
    breastRightMesh.position.set(0.105, 0, 0.12);
    breastRightMesh.rotation.z = 0.12;
    breastRightMesh.castShadow = true;
    bustGroup.add(breastRightMesh);

    // Jersey V-neck collar trim
    const collarGeo = new THREE.TorusGeometry(0.14, 0.018, 16, 32, Math.PI * 0.95);
    const collarMesh = new THREE.Mesh(collarGeo, redTrimMaterial);
    collarMesh.position.set(0, 0.22, 0.06);
    collarMesh.rotation.x = Math.PI * 0.42;
    collarMesh.rotation.z = Math.PI;
    bustGroup.add(collarMesh);

    // --- HEAD GROUP (High-Fidelity Anatomical Features) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.94, 0);
    avatarGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Slender Natural Neck with Sternocleidomastoid Muscle Tone
    const neckGeo = new THREE.CylinderGeometry(0.095, 0.118, 0.20, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.y = -0.05;
    headGroup.add(neckMesh);

    // Sculpted Cranium & Soft Feminine Jawline
    const craniumGeo = new THREE.SphereGeometry(0.24, 36, 36);
    craniumGeo.scale(0.88, 1.08, 0.94);
    const craniumMesh = new THREE.Mesh(craniumGeo, skinMaterial);
    craniumMesh.position.set(0, 0.16, 0);
    craniumMesh.castShadow = true;
    headGroup.add(craniumMesh);

    // Cheekbones (Zygomatic arches definition)
    const cheekLeftGeo = new THREE.SphereGeometry(0.065, 16, 16);
    cheekLeftGeo.scale(1.0, 0.8, 0.7);
    const cheekLeft = new THREE.Mesh(cheekLeftGeo, skinMaterial);
    cheekLeft.position.set(-0.115, 0.13, 0.13);
    headGroup.add(cheekLeft);

    const cheekRightGeo = new THREE.SphereGeometry(0.065, 16, 16);
    cheekRightGeo.scale(1.0, 0.8, 0.7);
    const cheekRight = new THREE.Mesh(cheekRightGeo, skinMaterial);
    cheekRight.position.set(0.115, 0.13, 0.13);
    headGroup.add(cheekRight);

    // Delicate Chin Definition (Mentalis)
    const chinGeo = new THREE.SphereGeometry(0.062, 20, 20);
    chinGeo.scale(0.85, 0.75, 0.85);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, 0.015, 0.185);
    headGroup.add(chinMesh);

    // Real Anatomical Ears (Telinga) with Helix, Concha, and Lobe
    const createEar = (isRight: boolean) => {
      const earGroup = new THREE.Group();
      const x = isRight ? 0.19 : -0.19;
      earGroup.position.set(x, 0.13, -0.01);
      earGroup.rotation.y = isRight ? 0.25 : -0.25;

      // Outer Helix (curved rim)
      const helixGeo = new THREE.TorusGeometry(0.046, 0.009, 12, 24, Math.PI * 0.9);
      const helix = new THREE.Mesh(helixGeo, skinMaterial);
      helix.rotation.z = isRight ? -0.35 : 0.35;
      earGroup.add(helix);

      // Concha cavity (inner bowl)
      const conchaGeo = new THREE.SphereGeometry(0.026, 16, 16);
      conchaGeo.scale(0.8, 1.2, 0.4);
      const concha = new THREE.Mesh(conchaGeo, skinMaterial);
      concha.position.set(isRight ? -0.012 : 0.012, 0.005, 0.006);
      earGroup.add(concha);

      // Tragus tab
      const tragusGeo = new THREE.BoxGeometry(0.012, 0.016, 0.008);
      const tragus = new THREE.Mesh(tragusGeo, skinMaterial);
      tragus.position.set(isRight ? -0.024 : 0.024, 0.0, 0.012);
      earGroup.add(tragus);

      // Soft Earlobe (lobule)
      const lobeGeo = new THREE.SphereGeometry(0.018, 16, 16);
      lobeGeo.scale(0.9, 1.1, 0.7);
      const lobe = new THREE.Mesh(lobeGeo, skinMaterial);
      lobe.position.set(0, -0.042, 0.005);
      earGroup.add(lobe);

      return earGroup;
    };
    headGroup.add(createEar(false));
    headGroup.add(createEar(true));

    // Natural Nose Bridge, Tip, and Alar Wings (Hidung)
    const noseBridgeGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.095, 16);
    noseBridgeGeo.scale(0.7, 1.0, 1.2);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMaterial);
    noseBridge.position.set(0, 0.138, 0.215);
    noseBridge.rotation.x = Math.PI * 0.08;
    headGroup.add(noseBridge);

    const noseTipGeo = new THREE.SphereGeometry(0.022, 16, 16);
    noseTipGeo.scale(1.0, 0.85, 1.1);
    const noseTip = new THREE.Mesh(noseTipGeo, skinMaterial);
    noseTip.position.set(0, 0.098, 0.238);
    headGroup.add(noseTip);

    const alarLeftGeo = new THREE.SphereGeometry(0.014, 12, 12);
    const alarLeft = new THREE.Mesh(alarLeftGeo, skinMaterial);
    alarLeft.position.set(-0.022, 0.095, 0.222);
    headGroup.add(alarLeft);

    const alarRightGeo = new THREE.SphereGeometry(0.014, 12, 12);
    const alarRight = new THREE.Mesh(alarRightGeo, skinMaterial);
    alarRight.position.set(0.022, 0.095, 0.222);
    headGroup.add(alarRight);

    // Natural Contoured Lips with Cupid's Bow & Satin Finish (Mulut & Bibir)
    const upperLipGeo = new THREE.TorusGeometry(0.034, 0.011, 14, 24, Math.PI * 0.88);
    const upperLip = new THREE.Mesh(upperLipGeo, lipsMaterial);
    upperLip.position.set(0, 0.058, 0.212);
    upperLip.rotation.x = Math.PI * 0.12;
    upperLip.rotation.z = Math.PI;
    headGroup.add(upperLip);

    const lowerLipGeo = new THREE.TorusGeometry(0.030, 0.013, 14, 24, Math.PI * 0.84);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipsMaterial);
    lowerLip.position.set(0, 0.039, 0.208);
    lowerLip.rotation.x = -Math.PI * 0.10;
    headGroup.add(lowerLip);

    // Photorealistic 3D Eyes with Wet Reflections, Sclera, Iris, Caruncle & Eyelids (Mata)
    const createEye = (isRight: boolean) => {
      const eyeGroup = new THREE.Group();
      const x = isRight ? 0.082 : -0.082;
      eyeGroup.position.set(x, 0.165, 0.188);

      // Natural sclera with slight eyeball curvature
      const scleraGeo = new THREE.SphereGeometry(0.048, 24, 24);
      scleraGeo.scale(1.22, 0.92, 0.72);
      const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMaterial);
      eyeGroup.add(sclera);

      // Hazel-Green Iris with detailed radial fibers
      const irisGeo = new THREE.CircleGeometry(0.028, 32);
      const iris = new THREE.Mesh(irisGeo, irisMaterial);
      iris.position.set(0, 0, 0.032);
      eyeGroup.add(iris);

      // Deep black Pupil
      const pupilGeo = new THREE.CircleGeometry(0.013, 20);
      const pupil = new THREE.Mesh(pupilGeo, pupilMaterial);
      pupil.position.set(0, 0, 0.034);
      eyeGroup.add(pupil);

      // Wet Specular Corneal Highlight
      const corneaGeo = new THREE.SphereGeometry(0.026, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const corneaMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.88,
      });
      const corneaHighlight = new THREE.Mesh(corneaGeo, corneaMat);
      corneaHighlight.position.set(0.008, 0.008, 0.035);
      corneaHighlight.scale.set(0.24, 0.24, 0.1);
      eyeGroup.add(corneaHighlight);

      // Tear duct / Caruncle (soft warm pink inner corner)
      const tearDuctGeo = new THREE.SphereGeometry(0.008, 12, 12);
      const tearDuct = new THREE.Mesh(tearDuctGeo, tearDuctMaterial);
      tearDuct.position.set(isRight ? -0.042 : 0.042, -0.002, 0.028);
      eyeGroup.add(tearDuct);

      // 3D Curved Eyelashes framing upper lid
      const lashGeo = new THREE.TorusGeometry(0.038, 0.005, 8, 24, Math.PI * 0.74);
      const lashMat = new THREE.MeshBasicMaterial({ color: 0x140E0C });
      const lash = new THREE.Mesh(lashGeo, lashMat);
      lash.position.set(0, 0.018, 0.028);
      lash.rotation.z = isRight ? -0.1 : 0.1;
      eyeGroup.add(lash);

      // Delicate Upper Eyelid for Realistic Blinking
      const lidGeo = new THREE.SphereGeometry(0.052, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
      lidGeo.scale(1.24, 0.90, 0.74);
      const lid = new THREE.Mesh(lidGeo, skinMaterial);
      lid.position.set(0, 0.014, 0.006);
      lid.scale.y = 0.05;
      eyeGroup.add(lid);
      eyelidsRef.current.push(lid);

      return eyeGroup;
    };
    headGroup.add(createEye(false));
    headGroup.add(createEye(true));

    // Delicate Feathered Eyebrows
    const browGeo = new THREE.TorusGeometry(0.054, 0.007, 8, 24, Math.PI * 0.68);
    const browMat = new THREE.MeshStandardMaterial({ color: 0x221714, roughness: 0.4 });
    const browLeft = new THREE.Mesh(browGeo, browMat);
    browLeft.position.set(-0.086, 0.218, 0.182);
    browLeft.rotation.z = -0.12;
    headGroup.add(browLeft);

    const browRight = new THREE.Mesh(browGeo, browMat);
    browRight.position.set(0.086, 0.218, 0.182);
    browRight.rotation.z = 0.12;
    headGroup.add(browRight);

    // Photorealistic Layered Hair: Salon Hairstyle with Part & Natural Flow (Rambut)
    const hairCapGeo = new THREE.SphereGeometry(0.258, 36, 36);
    hairCapGeo.scale(0.92, 1.06, 0.98);
    const hairCapMesh = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCapMesh.position.set(0, 0.18, -0.02);
    headGroup.add(hairCapMesh);

    // Natural Face-Framing Tresses (Soft side locks)
    const bangsLeftGroup = new THREE.Group();
    bangsLeftGroup.position.set(-0.10, 0.28, 0.16);
    const bangsLeftGeo = new THREE.CylinderGeometry(0.038, 0.018, 0.32, 16);
    bangsLeftGeo.rotateZ(0.18);
    bangsLeftGeo.rotateX(-0.10);
    const bangsLeft = new THREE.Mesh(bangsLeftGeo, hairMaterial);
    bangsLeftGroup.add(bangsLeft);
    headGroup.add(bangsLeftGroup);
    bangsLeftRef.current = bangsLeftGroup;

    const bangsRightGroup = new THREE.Group();
    bangsRightGroup.position.set(0.10, 0.28, 0.16);
    const bangsRightGeo = new THREE.CylinderGeometry(0.038, 0.018, 0.32, 16);
    bangsRightGeo.rotateZ(-0.18);
    bangsRightGeo.rotateX(-0.10);
    const bangsRight = new THREE.Mesh(bangsRightGeo, hairMaterial);
    bangsRightGroup.add(bangsRight);
    headGroup.add(bangsRightGroup);
    bangsRightRef.current = bangsRightGroup;

    // Elegant Ponytail Tie
    const bandGeo = new THREE.TorusGeometry(0.065, 0.02, 16, 32);
    const bandMesh = new THREE.Mesh(bandGeo, redTrimMaterial);
    bandMesh.position.set(0, 0.32, -0.24);
    bandMesh.rotation.x = Math.PI * 0.32;
    headGroup.add(bandMesh);

    // 3-Segment Articulated Dynamic Ponytail (Responsive Hair Inertia Physics)
    const ponyRoot = new THREE.Group();
    ponyRoot.position.set(0, 0.30, -0.26);
    headGroup.add(ponyRoot);
    ponyRootRef.current = ponyRoot;

    // Segment 1: Root
    const pony1Geo = new THREE.CylinderGeometry(0.055, 0.075, 0.22, 16);
    const pony1 = new THREE.Mesh(pony1Geo, hairMaterial);
    pony1.position.y = -0.11;
    pony1.castShadow = true;
    ponyRoot.add(pony1);

    // Segment 2: Mid
    const ponyMid = new THREE.Group();
    ponyMid.position.set(0, -0.21, -0.01);
    ponyRoot.add(ponyMid);
    ponyMidRef.current = ponyMid;

    const pony2Geo = new THREE.CylinderGeometry(0.072, 0.062, 0.24, 16);
    const pony2 = new THREE.Mesh(pony2Geo, hairMaterial);
    pony2.position.y = -0.12;
    pony2.castShadow = true;
    ponyMid.add(pony2);

    // Segment 3: Tip
    const ponyTip = new THREE.Group();
    ponyTip.position.set(0, -0.23, -0.01);
    ponyMid.add(ponyTip);
    ponyTipRef.current = ponyTip;

    const pony3Geo = new THREE.ConeGeometry(0.062, 0.22, 16);
    pony3Geo.rotateX(Math.PI);
    const pony3 = new THREE.Mesh(pony3Geo, hairMaterial);
    pony3.position.y = -0.11;
    pony3.castShadow = true;
    ponyTip.add(pony3);

    // --- ARMS & 5-FINGER ARTICULATED ANATOMICAL HANDS (Tangan & Jari) ---
    // Helper to generate fully articulated 5-finger human hand
    const createArticulatedHand = (isRight: boolean) => {
      const handGroup = new THREE.Group();

      // Palm (Metacarpus with anatomical thenar / hypothenar mounds)
      const palmGeo = new THREE.BoxGeometry(0.052, 0.074, 0.024);
      const palm = new THREE.Mesh(palmGeo, skinMaterial);
      palm.position.y = -0.037;
      palm.castShadow = true;
      handGroup.add(palm);

      // Helper for finger creation (3 phalanges + fingernail)
      const createFinger = (
        name: string,
        relX: number,
        baseLen: number,
        radius: number,
        isThumb: boolean = false
      ) => {
        const fingerRoot = new THREE.Group();
        fingerRoot.position.set(relX, isThumb ? -0.02 : -0.074, isThumb ? 0.008 : 0);

        if (isThumb) {
          // Thumb is angled in natural opposition (metacarpal angle)
          fingerRoot.rotation.z = isRight ? 0.48 : -0.48;
          fingerRoot.rotation.y = isRight ? -0.25 : 0.25;

          const thumb1 = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 1.1, radius, baseLen * 0.55, 12),
            skinMaterial
          );
          thumb1.position.y = -baseLen * 0.275;
          fingerRoot.add(thumb1);

          const thumb2 = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius * 0.85, baseLen * 0.45, 12),
            skinMaterial
          );
          thumb2.position.y = -baseLen * 0.775;
          fingerRoot.add(thumb2);

          // Thumbnail
          const thumbNail = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 1.4, baseLen * 0.2, 0.004),
            nailMaterial
          );
          thumbNail.position.set(0, -baseLen * 0.88, radius * 0.85);
          fingerRoot.add(thumbNail);
        } else {
          // Regular fingers: 3 articulated phalanges (Proximal, Intermediate, Distal)
          const p1Len = baseLen * 0.42;
          const p2Len = baseLen * 0.32;
          const p3Len = baseLen * 0.26;

          // Phalanx 1 (Proximal)
          const p1 = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 1.05, radius * 0.95, p1Len, 12),
            skinMaterial
          );
          p1.position.y = -p1Len * 0.5;
          fingerRoot.add(p1);

          // Phalanx 2 (Intermediate) with gentle natural curvature
          const p2Group = new THREE.Group();
          p2Group.position.y = -p1Len;
          p2Group.rotation.x = 0.08; // natural resting curl
          fingerRoot.add(p2Group);

          const p2 = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 0.95, radius * 0.85, p2Len, 12),
            skinMaterial
          );
          p2.position.y = -p2Len * 0.5;
          p2Group.add(p2);

          // Phalanx 3 (Distal with fingernail)
          const p3Group = new THREE.Group();
          p3Group.position.y = -p2Len;
          p3Group.rotation.x = 0.06;
          p2Group.add(p3Group);

          const p3 = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 0.85, radius * 0.7, p3Len, 12),
            skinMaterial
          );
          p3.position.y = -p3Len * 0.5;
          p3Group.add(p3);

          // Manicured fingernail
          const nail = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 1.3, p3Len * 0.45, 0.003),
            nailMaterial
          );
          nail.position.set(0, -p3Len * 0.5, radius * 0.75);
          p3Group.add(nail);
        }

        return fingerRoot;
      };

      // 1. Thumb (opposed)
      handGroup.add(createFinger('thumb', isRight ? -0.028 : 0.028, 0.044, 0.009, true));
      // 2. Index finger
      handGroup.add(createFinger('index', isRight ? -0.016 : 0.016, 0.048, 0.0075));
      // 3. Middle finger (longest digit)
      handGroup.add(createFinger('middle', isRight ? -0.005 : 0.005, 0.054, 0.0078));
      // 4. Ring finger
      handGroup.add(createFinger('ring', isRight ? 0.006 : -0.006, 0.049, 0.0074));
      // 5. Pinky finger (delicate fashion flare)
      handGroup.add(createFinger('pinky', isRight ? 0.017 : -0.017, 0.041, 0.0065));

      return handGroup;
    };

    // Left Arm (Relaxed Runway Fashion Model Pose)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.33, 0.76, 0);
    avatarGroup.add(leftArmGroup);

    // Left Deltoid cap
    const deltoidLeft = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), skinMaterial);
    deltoidLeft.scale.set(0.9, 1.1, 0.85);
    leftArmGroup.add(deltoidLeft);

    // Left Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.096, 0.088, 0.20, 20);
    const leftSleeve = new THREE.Mesh(sleeveGeo, jerseyMaterial);
    leftSleeve.position.y = -0.09;
    leftArmGroup.add(leftSleeve);

    // Upper Arm
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.058, 0.28, 20),
      skinMaterial
    );
    leftUpperArm.position.y = -0.22;
    leftArmGroup.add(leftUpperArm);

    // Forearm
    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.36, 0);
    leftArmGroup.add(leftForearm);

    const leftForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.048, 0.26, 20),
      skinMaterial
    );
    leftForearmMesh.position.y = -0.13;
    leftForearm.add(leftForearmMesh);

    // Left Hand (Poised gracefully in editorial model stance)
    const handGroupLeft = createArticulatedHand(false);
    handGroupLeft.position.set(0, -0.26, 0);
    handGroupLeft.rotation.z = 0.08;
    leftForearm.add(handGroupLeft);

    leftArmGroup.rotation.z = 0.14;
    leftArmGroup.rotation.x = 0.04;

    // Right Arm (Articulated with Responsive Waving & Greeting Support)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.33, 0.76, 0);
    avatarGroup.add(rightArmGroup);
    rightArmRef.current = rightArmGroup;

    // Right Deltoid cap
    const deltoidRight = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), skinMaterial);
    deltoidRight.scale.set(0.9, 1.1, 0.85);
    rightArmGroup.add(deltoidRight);

    // Right Sleeve
    const rightSleeve = new THREE.Mesh(sleeveGeo, jerseyMaterial);
    rightSleeve.position.y = -0.09;
    rightArmGroup.add(rightSleeve);

    const rightUpperMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.058, 0.28, 20),
      skinMaterial
    );
    rightUpperMesh.position.y = -0.22;
    rightArmGroup.add(rightUpperMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.36, 0);
    rightArmGroup.add(rightForearm);
    rightForearmRef.current = rightForearm;

    const rightForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.048, 0.26, 20),
      skinMaterial
    );
    rightForearmMesh.position.y = -0.13;
    rightForearm.add(rightForearmMesh);

    // Right Hand (Resting naturally near the hip in model pose)
    const handGroupRight = createArticulatedHand(true);
    handGroupRight.position.set(0, -0.26, 0);
    handGroupRight.rotation.z = -0.08;
    rightForearm.add(handGroupRight);

    rightArmGroup.rotation.z = -0.14;

    // --- HIPS, LEGS & HIGH-FASHION FOOTWEAR (Kaki & Seluruh Tubuh) ---
    const hipsGroup = new THREE.Group();
    hipsGroup.position.set(0, 0.18, 0);
    avatarGroup.add(hipsGroup);

    // Contoured Shorts / Bottom Outfit
    const shortsGeo = new THREE.CylinderGeometry(0.26, 0.29, 0.28, 28);
    shortsGeo.scale(1.0, 1.0, 0.82);
    const shortsMesh = new THREE.Mesh(shortsGeo, shortsMaterial);
    shortsMesh.castShadow = true;
    hipsGroup.add(shortsMesh);

    // Realistic Anatomical Legs with Contrapposto Fashion Stance
    const createPhotorealisticLeg = (isRight: boolean) => {
      const leg = new THREE.Group();
      // Right leg is weight-bearing pillar; Left leg is relaxed in fashion pose
      const x = isRight ? 0.12 : -0.12;
      leg.position.set(x, -0.14, 0);

      // Thigh with natural quadriceps and adductor contour
      const thighGeo = new THREE.CylinderGeometry(0.098, 0.076, 0.44, 24);
      const thigh = new THREE.Mesh(thighGeo, skinMaterial);
      thigh.position.y = -0.22;
      thigh.castShadow = true;
      leg.add(thigh);

      // Anatomical Knee with sculpted Patella bone & tendon definition
      const kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.44, 0.01);
      leg.add(kneeGroup);

      const patellaGeo = new THREE.SphereGeometry(0.042, 16, 16);
      patellaGeo.scale(0.85, 1.1, 0.7);
      const patella = new THREE.Mesh(patellaGeo, skinMaterial);
      kneeGroup.add(patella);

      // Calf with Gastrocnemius muscle curve tapering down into the Achilles tendon
      const calfGroup = new THREE.Group();
      calfGroup.position.set(0, -0.44, 0);
      leg.add(calfGroup);

      const calfGeo = new THREE.CylinderGeometry(0.072, 0.054, 0.44, 24);
      const calf = new THREE.Mesh(calfGeo, skinMaterial);
      calf.position.y = -0.22;
      calf.castShadow = true;
      calfGroup.add(calf);

      // Athletic sock band
      const sockGeo = new THREE.CylinderGeometry(0.058, 0.052, 0.16, 20);
      const sock = new THREE.Mesh(sockGeo, sockMaterial);
      sock.position.y = -0.36;
      sock.castShadow = true;
      calfGroup.add(sock);

      const bandSockGeo = new THREE.CylinderGeometry(0.060, 0.058, 0.03, 20);
      const bandSock = new THREE.Mesh(bandSockGeo, redTrimMaterial);
      bandSock.position.y = -0.28;
      calfGroup.add(bandSock);

      // Ankle Malleolus Bones (medial & lateral)
      const ankleLeft = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), skinMaterial);
      ankleLeft.position.set(-0.044, -0.41, 0);
      calfGroup.add(ankleLeft);

      const ankleRight = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), skinMaterial);
      ankleRight.position.set(0.044, -0.41, 0);
      calfGroup.add(ankleRight);

      // High-Fashion Designer Footwear (Sculpted Sole, Arch, Heel Counter & Platform)
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.42, 0.03);
      calfGroup.add(shoeGroup);

      // Upper shoe body
      const shoeBodyGeo = new THREE.BoxGeometry(0.098, 0.075, 0.22);
      const shoeBody = new THREE.Mesh(shoeBodyGeo, shoeMaterial);
      shoeBody.position.set(0, -0.02, 0.02);
      shoeBody.castShadow = true;
      shoeGroup.add(shoeBody);

      // Sculpted sole with traction and arch
      const soleGeo = new THREE.BoxGeometry(0.106, 0.028, 0.24);
      const sole = new THREE.Mesh(soleGeo, shoeSoleMaterial);
      sole.position.set(0, -0.062, 0.02);
      sole.receiveShadow = true;
      shoeGroup.add(sole);

      // Metallic designer heel accent
      const heelAccentGeo = new THREE.BoxGeometry(0.088, 0.016, 0.035);
      const heelAccent = new THREE.Mesh(heelAccentGeo, redTrimMaterial);
      heelAccent.position.set(0, -0.045, -0.08);
      shoeGroup.add(heelAccent);

      // Relaxed contrapposto stance for left leg
      if (!isRight) {
        leg.rotation.x = 0.08;
        leg.rotation.y = 0.06;
      }

      return leg;
    };

    hipsGroup.add(createPhotorealisticLeg(false));
    hipsGroup.add(createPhotorealisticLeg(true));

    // --- RUNWAY PEDESTAL STAGE ---
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.04, 0);
    avatarGroup.add(pedestalGroup);

    // Studio base disc
    const baseDiscGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.08, 48);
    const baseDiscMat = new THREE.MeshStandardMaterial({
      color: 0x121318,
      roughness: 0.22,
      metalness: 0.75,
    });
    const baseDisc = new THREE.Mesh(baseDiscGeo, baseDiscMat);
    baseDisc.receiveShadow = true;
    pedestalGroup.add(baseDisc);

    // Ground Contact Ambient Occlusion Shadow Decal (Firmly grounds the model in space)
    const shadowDecalGeo = new THREE.PlaneGeometry(0.8, 0.5);
    const shadowDecalMat = new THREE.MeshBasicMaterial({
      color: 0x050608,
      transparent: true,
      opacity: 0.65,
    });
    const shadowDecal = new THREE.Mesh(shadowDecalGeo, shadowDecalMat);
    shadowDecal.rotation.x = -Math.PI * 0.5;
    shadowDecal.position.y = 0.042;
    pedestalGroup.add(shadowDecal);

    const innerRingGeo = new THREE.RingGeometry(1.2, 1.28, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x25F4EE,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
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
      opacity: 0.6,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI * 0.5;
    outerRing.position.y = 0.046;
    pedestalGroup.add(outerRing);

    // Subtle atmospheric ambient dust particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 3.5;
      particlePos[i + 1] = Math.random() * 2.5 - 0.8;
      particlePos[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x25F4EE,
      size: 0.025,
      transparent: true,
      opacity: 0.6,
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
        bustGroupRef.current.position.y = 0.58 + bustOffsetYRef.current + breathPulse;
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
