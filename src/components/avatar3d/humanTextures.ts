import * as THREE from 'three';
import { OutfitConfig } from './types';

/**
 * Procedural Photorealistic PBR Skin Texture Generator (2048x2048)
 * Creates organic porcelain-peach micro-tonal gradation, fine pores, natural cheek blush,
 * feathered eyebrows, lip striations, and anatomical muscle/tendon shading.
 */
export function createPhotorealisticSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // 1. Warm organic base gradient with anatomical temperature zones
  const grad = ctx.createLinearGradient(0, 0, 0, 2048);
  grad.addColorStop(0, '#FFF2EA');    // Forehead / temples: soft luminous ivory
  grad.addColorStop(0.25, '#FDE5D8'); // Mid-face: warm peach
  grad.addColorStop(0.5, '#F8DACB');  // Cheeks / chin: rich organic peach
  grad.addColorStop(0.75, '#F1CDBC'); // Neck / clavicle: gentle warmth
  grad.addColorStop(1, '#E8C0AA');    // Torso / extremities: soft caramel tone
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 2048);

  // 2. Micro skin pore stippling & fine melanin tonal variations (removes plastic look)
  const imgData = ctx.getImageData(0, 0, 2048, 2048);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8.5;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.82));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.65));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Soft natural peach blush on cheeks
  const blush1 = ctx.createRadialGradient(512, 640, 30, 512, 640, 340);
  blush1.addColorStop(0, 'rgba(240, 138, 152, 0.28)');
  blush1.addColorStop(0.6, 'rgba(240, 138, 152, 0.12)');
  blush1.addColorStop(1, 'rgba(240, 138, 152, 0)');
  ctx.fillStyle = blush1;
  ctx.fillRect(180, 340, 664, 600);

  const blush2 = ctx.createRadialGradient(1536, 640, 30, 1536, 640, 340);
  blush2.addColorStop(0, 'rgba(240, 138, 152, 0.28)');
  blush2.addColorStop(0.6, 'rgba(240, 138, 152, 0.12)');
  blush2.addColorStop(1, 'rgba(240, 138, 152, 0)');
  ctx.fillStyle = blush2;
  ctx.fillRect(1204, 340, 664, 600);

  // 4. Natural lip pigmentation with Cupid's bow and soft vermilion border
  const lipGrad = ctx.createRadialGradient(1024, 1100, 30, 1024, 1100, 280);
  lipGrad.addColorStop(0, 'rgba(215, 96, 112, 0.45)');
  lipGrad.addColorStop(0.7, 'rgba(195, 82, 100, 0.22)');
  lipGrad.addColorStop(1, 'rgba(195, 82, 100, 0)');
  ctx.fillStyle = lipGrad;
  ctx.fillRect(680, 940, 688, 320);

  // Vertical lip micro-creases for tactile fidelity
  ctx.strokeStyle = 'rgba(175, 70, 85, 0.24)';
  ctx.lineWidth = 1.8;
  for (let lx = 800; lx < 1248; lx += 12) {
    ctx.beginPath();
    ctx.moveTo(lx, 1040 + Math.sin(lx * 0.05) * 6);
    ctx.lineTo(lx + (Math.random() - 0.5) * 6, 1140 + Math.cos(lx * 0.05) * 8);
    ctx.stroke();
  }

  // 5. Feathered natural eyebrows with multi-layered directional hair strokes
  const drawEyebrow = (startX: number, isRight: boolean) => {
    ctx.strokeStyle = 'rgba(38, 25, 20, 0.42)';
    ctx.lineWidth = 1.6;
    for (let bx = 0; bx < 290; bx += 6) {
      const x = isRight ? startX + bx : startX - bx;
      const arch = Math.sin((bx / 290) * Math.PI) * 28;
      const y = 480 - arch;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (isRight ? 10 : -10), y - 14 - (Math.random() * 8));
      ctx.stroke();
    }
  };
  drawEyebrow(720, false);
  drawEyebrow(1328, true);

  // 6. Subtle clavicle and suprasternal notch contour shading
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
 * Generates tactile micro-pore relief and fine epidermal texture
 */
export function createPhotorealisticSkinBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);

  const imgData = ctx.getImageData(0, 0, 1024, 1024);
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
  return texture;
}

/**
 * Procedural Photorealistic Eye Texture (Iris, Limbal Ring, Radial Fibers, Pupil & Wet Highlights)
 */
export function createPhotorealisticEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Sclera base
  ctx.fillStyle = '#F8F5F2';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-capillary vein network
  ctx.strokeStyle = 'rgba(215, 80, 80, 0.12)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 30; i++) {
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

  // Dense radial striations (iris stroma fibers)
  ctx.strokeStyle = 'rgba(225, 245, 195, 0.35)';
  ctx.lineWidth = 2.0;
  for (let a = 0; a < Math.PI * 2; a += 0.032) {
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

  // Deep pupil
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
 * Procedural Photorealistic Hair Texture with micro-strands & anisotropic sheen (1024x1024)
 */
export function createPhotorealisticHairTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#16100E';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro hair strands
  ctx.fillStyle = 'rgba(92, 68, 56, 0.35)';
  for (let i = 0; i < 1024; i += 3) {
    ctx.fillRect(i, 0, 1.8, 1024);
  }

  // Warm caramel highlight strands
  ctx.fillStyle = 'rgba(138, 102, 82, 0.22)';
  for (let i = 0; i < 1024; i += 7) {
    ctx.fillRect(i + (Math.random() - 0.5) * 2, 0, 1.4, 1024);
  }

  // Anisotropic specular sheen band
  const sheenGrad = ctx.createLinearGradient(0, 320, 0, 640);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheenGrad.addColorStop(0.5, 'rgba(185, 150, 130, 0.42)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 320, 1024, 320);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural texture generator for Manchester United Home Jersey (1024x1024)
 */
export function createMUJerseyCanvas(ctx: CanvasRenderingContext2D) {
  // Vibrant crimson red gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#DA020E');
  grad.addColorStop(0.5, '#C70101');
  grad.addColorStop(1, '#980000');
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
  ctx.fillStyle = '#FFFFFF';
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

  // Back side
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
export function createPresetPatternCanvas(ctx: CanvasRenderingContext2D, presetId: string) {
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
    ctx.fillText('SELLER PROFIT', 768, 220);
    ctx.font = '900 230px sans-serif';
    ctx.fillText('7', 768, 460);
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
    ctx.fillText('SELLER PROFIT', 256, 410);

    ctx.font = '900 220px sans-serif';
    ctx.fillStyle = '#25F4EE';
    ctx.fillText('01', 768, 460);
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
  } else if (presetId === 'clean-white') {
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, 1024, 1024);

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
    createMUJerseyCanvas(ctx);
  } else if (config.type === 'preset' && config.presetId) {
    createPresetPatternCanvas(ctx, config.presetId);
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
