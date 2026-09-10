import * as THREE from 'three';
import { OutfitConfig } from './types';

// Module-level caches so heavy procedural textures are only generated once across the app lifecycle
let cachedSkinTexture: THREE.CanvasTexture | null = null;
let cachedSkinBumpMap: THREE.CanvasTexture | null = null;
let cachedEyeTexture: THREE.CanvasTexture | null = null;
let cachedHairTexture: THREE.CanvasTexture | null = null;

/**
 * Procedural Photorealistic PBR Skin Texture Generator (512x512 high-performance mobile-optimized)
 * Creates organic porcelain-peach micro-tonal gradation, fine pores, natural cheek blush,
 * feathered eyebrows, lip striations, and anatomical muscle/tendon shading.
 */
export function createPhotorealisticSkinTexture(): THREE.CanvasTexture {
  if (cachedSkinTexture) return cachedSkinTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Warm organic base gradient with anatomical temperature zones
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#FFF2EA');    // Forehead / temples: soft luminous ivory
  grad.addColorStop(0.25, '#FDE5D8'); // Mid-face: warm peach
  grad.addColorStop(0.5, '#F8DACB');  // Cheeks / chin: rich organic peach
  grad.addColorStop(0.75, '#F1CDBC'); // Neck / clavicle: gentle warmth
  grad.addColorStop(1, '#E8C0AA');    // Torso / extremities: soft caramel tone
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Micro skin pore stippling & fine melanin tonal variations (removes plastic look)
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8.5;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.82));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.65));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Soft natural peach blush on cheeks
  const blush1 = ctx.createRadialGradient(128, 160, 8, 128, 160, 85);
  blush1.addColorStop(0, 'rgba(240, 138, 152, 0.28)');
  blush1.addColorStop(0.6, 'rgba(240, 138, 152, 0.12)');
  blush1.addColorStop(1, 'rgba(240, 138, 152, 0)');
  ctx.fillStyle = blush1;
  ctx.fillRect(45, 85, 166, 150);

  const blush2 = ctx.createRadialGradient(384, 160, 8, 384, 160, 85);
  blush2.addColorStop(0, 'rgba(240, 138, 152, 0.28)');
  blush2.addColorStop(0.6, 'rgba(240, 138, 152, 0.12)');
  blush2.addColorStop(1, 'rgba(240, 138, 152, 0)');
  ctx.fillStyle = blush2;
  ctx.fillRect(301, 85, 166, 150);

  // 4. Natural lip pigmentation with Cupid's bow and soft vermilion border
  const lipGrad = ctx.createRadialGradient(256, 275, 8, 256, 275, 70);
  lipGrad.addColorStop(0, 'rgba(215, 96, 112, 0.45)');
  lipGrad.addColorStop(0.7, 'rgba(195, 82, 100, 0.22)');
  lipGrad.addColorStop(1, 'rgba(195, 82, 100, 0)');
  ctx.fillStyle = lipGrad;
  ctx.fillRect(170, 235, 172, 80);

  // Vertical lip micro-creases
  ctx.strokeStyle = 'rgba(175, 70, 85, 0.24)';
  ctx.lineWidth = 1.0;
  for (let lx = 200; lx < 312; lx += 6) {
    ctx.beginPath();
    ctx.moveTo(lx, 260 + Math.sin(lx * 0.1) * 2);
    ctx.lineTo(lx + (Math.random() - 0.5) * 3, 285 + Math.cos(lx * 0.1) * 2);
    ctx.stroke();
  }

  // 5. Feathered natural eyebrows
  const drawEyebrow = (startX: number, isRight: boolean) => {
    ctx.strokeStyle = 'rgba(38, 25, 20, 0.42)';
    ctx.lineWidth = 1.2;
    for (let bx = 0; bx < 72; bx += 3) {
      const x = isRight ? startX + bx : startX - bx;
      const arch = Math.sin((bx / 72) * Math.PI) * 7;
      const y = 120 - arch;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (isRight ? 3 : -3), y - 4 - (Math.random() * 2));
      ctx.stroke();
    }
  };
  drawEyebrow(180, false);
  drawEyebrow(332, true);

  // 6. Subtle clavicle contour shading
  const neckShade = ctx.createLinearGradient(0, 362, 0, 462);
  neckShade.addColorStop(0, 'rgba(185, 135, 120, 0)');
  neckShade.addColorStop(0.5, 'rgba(185, 135, 120, 0.22)');
  neckShade.addColorStop(1, 'rgba(185, 135, 120, 0)');
  ctx.fillStyle = neckShade;
  ctx.fillRect(0, 362, 512, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedSkinTexture = texture;
  return texture;
}

/**
 * Procedural Skin Bump / Normal Map (512x512)
 * Generates tactile micro-pore relief and fine epidermal texture
 */
export function createPhotorealisticSkinBumpMap(): THREE.CanvasTexture {
  if (cachedSkinBumpMap) return cachedSkinBumpMap;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const val = 128 + (Math.random() - 0.5) * 38;
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedSkinBumpMap = texture;
  return texture;
}

/**
 * Procedural Photorealistic Eye Texture (Iris, Limbal Ring, Radial Fibers, Pupil & Wet Highlights)
 */
export function createPhotorealisticEyeTexture(): THREE.CanvasTexture {
  if (cachedEyeTexture) return cachedEyeTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sclera base
  ctx.fillStyle = '#F8F5F2';
  ctx.fillRect(0, 0, 512, 512);

  // Micro-capillary vein network
  ctx.strokeStyle = 'rgba(215, 80, 80, 0.12)';
  ctx.lineWidth = 1.0;
  for (let i = 0; i < 15; i++) {
    const startX = Math.random() < 0.5 ? 30 + Math.random() * 40 : 440 + Math.random() * 40;
    const startY = 100 + Math.random() * 300;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + (Math.random() - 0.5) * 30,
      startY + (Math.random() - 0.5) * 20,
      startX + (Math.random() - 0.5) * 50,
      startY + (Math.random() - 0.5) * 40,
      startX + (Math.random() - 0.5) * 70,
      startY + (Math.random() - 0.5) * 50
    );
    ctx.stroke();
  }

  // Limbal ring
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.fillStyle = '#141E18';
  ctx.fill();

  // Multi-tone iris gradient
  const irisGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 175);
  irisGrad.addColorStop(0, '#8A9E58');
  irisGrad.addColorStop(0.35, '#4E7558');
  irisGrad.addColorStop(0.75, '#2A4A36');
  irisGrad.addColorStop(1, '#15241B');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 174, 0, Math.PI * 2);
  ctx.fill();

  // Iris fibers
  ctx.strokeStyle = 'rgba(225, 245, 195, 0.35)';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 55, 256 + Math.sin(a) * 55);
    ctx.lineTo(256 + Math.cos(a) * 168, 256 + Math.sin(a) * 168);
    ctx.stroke();
  }

  // Deep pupil
  ctx.beginPath();
  ctx.arc(256, 256, 52, 0, Math.PI * 2);
  ctx.fillStyle = '#050706';
  ctx.fill();

  // Wet corneal highlight reflection
  ctx.beginPath();
  ctx.arc(220, 215, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  cachedEyeTexture = texture;
  return texture;
}

/**
 * Procedural Photorealistic Hair Texture with micro-strands & anisotropic sheen (512x512)
 */
export function createPhotorealisticHairTexture(): THREE.CanvasTexture {
  if (cachedHairTexture) return cachedHairTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#16100E';
  ctx.fillRect(0, 0, 512, 512);

  // Micro hair strands
  ctx.fillStyle = 'rgba(92, 68, 56, 0.35)';
  for (let i = 0; i < 512; i += 2) {
    ctx.fillRect(i, 0, 1.2, 512);
  }

  // Anisotropic sheen band
  const sheenGrad = ctx.createLinearGradient(0, 160, 0, 320);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheenGrad.addColorStop(0.5, 'rgba(185, 150, 130, 0.42)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 160, 512, 160);

  const texture = new THREE.CanvasTexture(canvas);
  cachedHairTexture = texture;
  return texture;
}

/**
 * Procedural texture generator for Manchester United Home Jersey (1024x1024)
 */
export function createMUJerseyCanvas(
  ctx: CanvasRenderingContext2D,
  customName?: string,
  customNumber?: string,
  customBaseColor?: string,
  customAccentColor?: string
) {
  const baseRed = customBaseColor || '#C70101';
  const accent = customAccentColor || '#FFFFFF';

  // Vibrant crimson red gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, baseRed);
  grad.addColorStop(0.5, baseRed);
  grad.addColorStop(1, '#0D0E12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro jacquard texture stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 1024; i += 16) {
    ctx.fillRect(i, 0, 8, 1024);
  }

  // Side panels
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, 80, 1024);
  ctx.fillRect(944, 0, 80, 1024);

  // Collar accent
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 1024, 60);
  ctx.fillStyle = '#0B0C10';
  ctx.fillRect(0, 50, 1024, 12);

  // Manchester United Crest (Left Chest)
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

  // Adidas 3-bars logo (Right Chest)
  const adX = 340;
  const adY = 240;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.transform(1, 0, -0.35, 1, 0, 0);
  ctx.fillRect(adX + 50, adY - 12, 10, 24);
  ctx.fillRect(adX + 66, adY - 6, 10, 18);
  ctx.fillRect(adX + 82, adY, 10, 12);
  ctx.restore();

  // Snapdragon Chest Sponsor
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

  // Back side (Name & Number customizable)
  const backCenterX = 768;
  const backNameStr = (customName || 'SELLER PROFIT').toUpperCase().slice(0, 16);
  const backNumberStr = (customNumber || '7').slice(0, 2);

  ctx.save();
  ctx.fillStyle = accent;
  ctx.font = '900 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 8;
  ctx.fillText(backNameStr, backCenterX, 220);

  ctx.font = '900 230px sans-serif';
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  ctx.strokeText(backNumberStr, backCenterX, 460);
  ctx.fillText(backNumberStr, backCenterX, 460);

  ctx.fillStyle = '#FFC72C';
  ctx.beginPath();
  ctx.arc(backCenterX + 35, 435, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws preset outfit patterns (Away, Cyberpunk, Batik, Minimalist)
 */
export function createPresetPatternCanvas(
  ctx: CanvasRenderingContext2D,
  presetId: string,
  customName?: string,
  customNumber?: string
) {
  const backNameStr = (customName || 'SELLER PROFIT').toUpperCase().slice(0, 16);
  const backNumberStr = (customNumber || '7').slice(0, 2);

  if (presetId === 'mu-away') {
    ctx.fillStyle = '#101524';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.strokeStyle = 'rgba(160, 174, 192, 0.12)';
    ctx.lineWidth = 20;
    for (let i = -1024; i < 2048; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 1024, 1024);
      ctx.stroke();
    }

    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, 1024, 60);

    ctx.save();
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Snapdragon', 256, 430);

    ctx.font = '900 42px sans-serif';
    ctx.fillText(backNameStr, 768, 220);
    ctx.font = '900 230px sans-serif';
    ctx.fillText(backNumberStr, 768, 460);
    ctx.restore();
  } else if (presetId === 'cyberpunk') {
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

    ctx.save();
    ctx.fillStyle = '#25F4EE';
    ctx.font = '900 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(backNameStr, 256, 410);

    ctx.font = '900 220px sans-serif';
    ctx.fillStyle = '#25F4EE';
    ctx.fillText(backNumberStr || '01', 768, 460);
    ctx.restore();
  } else if (presetId === 'batik') {
    ctx.fillStyle = '#26160E';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = '#D4AF37';
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

    ctx.save();
    ctx.fillStyle = '#D4AF37';
    ctx.font = '900 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(backNameStr, 768, 230);
    ctx.font = '900 220px sans-serif';
    ctx.fillText(backNumberStr, 768, 460);
    ctx.restore();
  } else if (presetId === 'clean-white') {
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = '#111319';
    ctx.fillRect(256 - 60, 360, 120, 6);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROFIT // CLUB', 256, 420);

    ctx.save();
    ctx.fillStyle = '#111319';
    ctx.font = '900 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(backNameStr, 768, 230);
    ctx.font = '900 220px sans-serif';
    ctx.fillText(backNumberStr, 768, 460);
    ctx.restore();
  }
}

/**
 * Universal Custom Outfit Texture Generator
 */
export function generateOutfitTexture(
  config: OutfitConfig,
  customImageElement: HTMLImageElement | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  if (config.type === 'default-mu') {
    createMUJerseyCanvas(ctx, config.backName, config.backNumber, config.baseColor, config.accentColor);
  } else if (config.type === 'preset' && config.presetId) {
    createPresetPatternCanvas(ctx, config.presetId, config.backName, config.backNumber);
  } else if (config.type === 'custom' && customImageElement) {
    const img = customImageElement;

    if (config.mode === 'full') {
      ctx.fillStyle = config.baseColor || '#111319';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.drawImage(img, 0, 0, 512, 1024);
      ctx.drawImage(img, 512, 0, 512, 1024);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, 0, 1024, 45);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let i = 0; i < 1024; i += 12) {
        ctx.fillRect(i, 0, 6, 1024);
      }
    } else if (config.mode === 'logo') {
      ctx.fillStyle = config.baseColor || '#111319';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = config.accentColor || '#FFFFFF';
      ctx.fillRect(0, 0, 1024, 48);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 1024; i += 16) {
        ctx.fillRect(i, 0, 8, 1024);
      }

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

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

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
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, config.baseColor);
      grad.addColorStop(1, '#090A0E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = config.accentColor || '#FFFFFF';
      ctx.fillRect(0, 0, 50, 1024);
      ctx.fillRect(974, 0, 50, 1024);

      ctx.fillRect(0, 0, 1024, 55);

      ctx.beginPath();
      ctx.arc(160, 230, 36, 0, Math.PI * 2);
      ctx.fillStyle = config.accentColor || '#FFC72C';
      ctx.fill();

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
export function generateShortsTexture(baseColor: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 36, 512);
  ctx.fillRect(476, 0, 36, 512);

  ctx.fillRect(0, 484, 512, 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
