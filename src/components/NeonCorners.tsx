import React from 'react';

export type NeonOppositeVariant = 
  | 'opposite-tl-br' // Lengkung di Ujung Kiri-Atas & Kanan-Bawah (Bersebrangan)
  | 'opposite-tr-bl' // Lengkung di Ujung Kanan-Atas & Kiri-Bawah (Bersebrangan)
  | 'side-left'      // Backward compat fallback -> will map to opposite-tl-br
  | 'side-right'     // Backward compat fallback -> will map to opposite-tr-bl
  | 'corner-top-left'
  | 'corner-top-right'
  | 'auto';

export type NeonFlexColor = 'cyan' | 'magenta' | 'emerald' | 'amber' | 'dual' | 'gradient';

interface NeonCornersProps {
  /** Optional legacy flags */
  cyanTop?: boolean;
  magentaBottom?: boolean;
  /** Variasi posisi lengkungan: opposite-tl-br (Kiri Atas & Kanan Bawah) atau opposite-tr-bl (Kanan Atas & Kiri Bawah) */
  variant?: NeonOppositeVariant | string;
  /** Warna neon: cyan, magenta, emerald, amber, dual (cyan + magenta) */
  color?: NeonFlexColor;
  /** Custom extra styling */
  className?: string;
  /** Ketebalan kabel neon lengkung */
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_MAP: Record<string, { hex: string; glowColor: string }> = {
  cyan: {
    hex: '#25F4EE',
    glowColor: 'rgba(37, 244, 238, 0.4)',
  },
  magenta: {
    hex: '#FE2C55',
    glowColor: 'rgba(254, 44, 85, 0.4)',
  },
  emerald: {
    hex: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  amber: {
    hex: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
};

/**
 * Komponen Lengkungan Kabel Neon Bersebrangan (Opposite Curved Neon Tube)
 * Memasang aksen lengkungan kabel neon fleksibel HANYA di ujung-ujung sudut yang bersebrangan
 * (seperti model sisa saldo di dashboard):
 * - Variasi 1: Ujung Kiri-Atas (Top-Left) & Kanan-Bawah (Bottom-Right)
 * - Variasi 2: Ujung Kanan-Atas (Top-Right) & Kiri-Bawah (Bottom-Left)
 * 
 * Dioptimalkan dengan GPU hardware-accelerated layered strokes tanpa filter SVG blur berat,
 * sehingga sangat ringan, hemat baterai, dan ponsel tetap dingin.
 */
export const NeonCorners: React.FC<NeonCornersProps> = ({
  cyanTop = true,
  magentaBottom = true,
  variant = 'auto',
  color,
  className = '',
  size = 'md',
}) => {
  // 1. Tentukan varian pasangan ujung bersebrangan
  let resolvedVariant: 'tl-br' | 'tr-bl' = 'tl-br';

  if (variant === 'opposite-tr-bl' || variant === 'side-right' || variant === 'corner-top-right') {
    resolvedVariant = 'tr-bl';
  } else if (variant === 'opposite-tl-br' || variant === 'side-left' || variant === 'corner-top-left') {
    resolvedVariant = 'tl-br';
  } else {
    // Default 'auto': Jika hanya magentaBottom -> tr-bl, selain itu tl-br
    if (!cyanTop && magentaBottom) {
      resolvedVariant = 'tr-bl';
    } else {
      resolvedVariant = 'tl-br';
    }
  }

  // 2. Tentukan skema warna sudut 1 dan sudut 2 yang bersebrangan
  let theme1 = COLOR_MAP.cyan;
  let theme2 = COLOR_MAP.magenta;

  if (color === 'cyan') {
    theme1 = COLOR_MAP.cyan;
    theme2 = COLOR_MAP.cyan;
  } else if (color === 'magenta') {
    theme1 = COLOR_MAP.magenta;
    theme2 = COLOR_MAP.magenta;
  } else if (color === 'emerald') {
    theme1 = COLOR_MAP.emerald;
    theme2 = COLOR_MAP.emerald;
  } else if (color === 'amber') {
    theme1 = COLOR_MAP.amber;
    theme2 = COLOR_MAP.amber;
  } else {
    // Dual TikTok theme (Cyan + Magenta)
    if (cyanTop && !magentaBottom) {
      theme1 = COLOR_MAP.cyan;
      theme2 = COLOR_MAP.cyan;
    } else if (!cyanTop && magentaBottom) {
      theme1 = COLOR_MAP.magenta;
      theme2 = COLOR_MAP.magenta;
    } else {
      theme1 = COLOR_MAP.cyan;
      theme2 = COLOR_MAP.magenta;
    }
  }

  const svgDimension = size === 'sm' ? 28 : size === 'lg' ? 40 : 34;
  const outerStroke = size === 'sm' ? 4.2 : 5.2;
  const coreStroke = size === 'sm' ? 2.2 : 2.8;

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 overflow-visible ${className}`} aria-hidden="true">
      {/* VARIAN 1: LENGKUNG DI UJUNG KIRI-ATAS & KANAN-BAWAH (BERSEBRANGAN) */}
      {resolvedVariant === 'tl-br' && (
        <>
          {/* Lengkung Ujung Kiri-Atas (Top-Left Arc) */}
          <div className="absolute -top-[1.5px] -left-[1.5px] overflow-visible">
            <svg
              width={svgDimension}
              height={svgDimension}
              viewBox="0 0 34 34"
              fill="none"
              className="overflow-visible transition-transform duration-200"
            >
              {/* Ultra-Soft Ambient Vector Glow */}
              <path
                d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
                stroke={theme1.hex}
                strokeWidth={outerStroke + 4}
                strokeLinecap="round"
                opacity="0.2"
              />
              {/* Diffuse Outer Glow Stroke */}
              <path
                d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
                stroke={theme1.hex}
                strokeWidth={outerStroke}
                strokeLinecap="round"
                opacity="0.55"
              />
              {/* Main Saturated Flexible Neon Tube */}
              <path
                d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
                stroke={theme1.hex}
                strokeWidth={coreStroke}
                strokeLinecap="round"
              />
              {/* High-Luminance White Core Filament */}
              <path
                d="M 26 3.5 L 14 3.5 C 8.8 3.5 4.5 7.8 4.5 13 L 4.5 26"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.95"
              />
            </svg>
          </div>

          {/* Lengkung Ujung Kanan-Bawah (Bottom-Right Arc - Bersebrangan) */}
          <div className="absolute -bottom-[1.5px] -right-[1.5px] overflow-visible">
            <svg
              width={svgDimension}
              height={svgDimension}
              viewBox="0 0 34 34"
              fill="none"
              className="overflow-visible transition-transform duration-200"
            >
              {/* Ultra-Soft Ambient Vector Glow */}
              <path
                d="M 6 30.5 L 20 30.5 C 25.8 30.5 30.5 25.8 30.5 20 L 30.5 6"
                stroke={theme2.hex}
                strokeWidth={outerStroke + 4}
                strokeLinecap="round"
                opacity="0.2"
              />
              <path
                d="M 6 30.5 L 20 30.5 C 25.8 30.5 30.5 25.8 30.5 20 L 30.5 6"
                stroke={theme2.hex}
                strokeWidth={outerStroke}
                strokeLinecap="round"
                opacity="0.55"
              />
              <path
                d="M 6 30.5 L 20 30.5 C 25.8 30.5 30.5 25.8 30.5 20 L 30.5 6"
                stroke={theme2.hex}
                strokeWidth={coreStroke}
                strokeLinecap="round"
              />
              <path
                d="M 8 30.5 L 20 30.5 C 25.2 30.5 29.5 26.2 29.5 21 L 29.5 8"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.95"
              />
            </svg>
          </div>
        </>
      )}

      {/* VARIAN 2: LENGKUNG DI UJUNG KANAN-ATAS & KIRI-BAWAH (BERSEBRANGAN) */}
      {resolvedVariant === 'tr-bl' && (
        <>
          {/* Lengkung Ujung Kanan-Atas (Top-Right Arc) */}
          <div className="absolute -top-[1.5px] -right-[1.5px] overflow-visible">
            <svg
              width={svgDimension}
              height={svgDimension}
              viewBox="0 0 34 34"
              fill="none"
              className="overflow-visible transition-transform duration-200"
            >
              {/* Ultra-Soft Ambient Vector Glow */}
              <path
                d="M 6 3.5 L 20 3.5 C 25.8 3.5 30.5 8.2 30.5 14 L 30.5 28"
                stroke={theme1.hex}
                strokeWidth={outerStroke + 4}
                strokeLinecap="round"
                opacity="0.2"
              />
              <path
                d="M 6 3.5 L 20 3.5 C 25.8 3.5 30.5 8.2 30.5 14 L 30.5 28"
                stroke={theme1.hex}
                strokeWidth={outerStroke}
                strokeLinecap="round"
                opacity="0.55"
              />
              <path
                d="M 6 3.5 L 20 3.5 C 25.8 3.5 30.5 8.2 30.5 14 L 30.5 28"
                stroke={theme1.hex}
                strokeWidth={coreStroke}
                strokeLinecap="round"
              />
              <path
                d="M 8 3.5 L 20 3.5 C 25.2 3.5 29.5 7.8 29.5 13 L 29.5 26"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.95"
              />
            </svg>
          </div>

          {/* Lengkung Ujung Kiri-Bawah (Bottom-Left Arc - Bersebrangan) */}
          <div className="absolute -bottom-[1.5px] -left-[1.5px] overflow-visible">
            <svg
              width={svgDimension}
              height={svgDimension}
              viewBox="0 0 34 34"
              fill="none"
              className="overflow-visible transition-transform duration-200"
            >
              {/* Ultra-Soft Ambient Vector Glow */}
              <path
                d="M 28 30.5 L 14 30.5 C 8.2 30.5 3.5 25.8 3.5 20 L 3.5 6"
                stroke={theme2.hex}
                strokeWidth={outerStroke + 4}
                strokeLinecap="round"
                opacity="0.2"
              />
              <path
                d="M 28 30.5 L 14 30.5 C 8.2 30.5 3.5 25.8 3.5 20 L 3.5 6"
                stroke={theme2.hex}
                strokeWidth={outerStroke}
                strokeLinecap="round"
                opacity="0.55"
              />
              <path
                d="M 28 30.5 L 14 30.5 C 8.2 30.5 3.5 25.8 3.5 20 L 3.5 6"
                stroke={theme2.hex}
                strokeWidth={coreStroke}
                strokeLinecap="round"
              />
              <path
                d="M 26 30.5 L 14 30.5 C 8.8 30.5 4.5 26.2 4.5 21 L 4.5 8"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.95"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export const NeonFlexCable = NeonCorners;
