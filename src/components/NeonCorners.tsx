import React, { useId } from 'react';

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

const COLOR_MAP: Record<string, { hex: string; glow: string; strokeGlow: string }> = {
  cyan: {
    hex: '#25F4EE',
    glow: 'rgba(37, 244, 238, 0.9)',
    strokeGlow: 'drop-shadow(0 0 7px #25F4EE) drop-shadow(0 0 14px rgba(37, 244, 238, 0.7))',
  },
  magenta: {
    hex: '#FE2C55',
    glow: 'rgba(254, 44, 85, 0.9)',
    strokeGlow: 'drop-shadow(0 0 7px #FE2C55) drop-shadow(0 0 14px rgba(254, 44, 85, 0.7))',
  },
  emerald: {
    hex: '#10B981',
    glow: 'rgba(16, 185, 129, 0.9)',
    strokeGlow: 'drop-shadow(0 0 7px #10B981) drop-shadow(0 0 14px rgba(16, 185, 129, 0.7))',
  },
  amber: {
    hex: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.9)',
    strokeGlow: 'drop-shadow(0 0 7px #F59E0B) drop-shadow(0 0 14px rgba(245, 158, 11, 0.7))',
  },
};

/**
 * Komponen Lengkungan Kabel Neon Bersebrangan (Opposite Curved Neon Tube)
 * Memasang aksen lengkungan kabel neon fleksibel HANYA di ujung-ujung sudut yang bersebrangan
 * (seperti model sisa saldo di dashboard):
 * - Variasi 1: Ujung Kiri-Atas (Top-Left) & Kanan-Bawah (Bottom-Right)
 * - Variasi 2: Ujung Kanan-Atas (Top-Right) & Kiri-Bawah (Bottom-Left)
 */
export const NeonCorners: React.FC<NeonCornersProps> = ({
  cyanTop = true,
  magentaBottom = true,
  variant = 'auto',
  color,
  className = '',
  size = 'md',
}) => {
  const uniqueId = useId().replace(/[:]/g, '');

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

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 overflow-visible ${className}`} aria-hidden="true">
      {/* SVG Defs Filter untuk pendaran cahaya neon silikon alami */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id={`neon-glow-a-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`neon-glow-b-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

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
              className="overflow-visible transition-all duration-300 group-hover:scale-105"
            >
              {/* Outer Diffuse Neon Tube Glow */}
              <path
                d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
                stroke={theme1.hex}
                strokeWidth="4.8"
                strokeLinecap="round"
                opacity="0.6"
                filter={`url(#neon-glow-a-${uniqueId})`}
              />
              {/* Main Saturated Flexible Neon Tube */}
              <path
                d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
                stroke={theme1.hex}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              {/* High-Luminance White Core Filament */}
              <path
                d="M 26 3.5 L 14 3.5 C 8.8 3.5 4.5 7.8 4.5 13 L 4.5 26"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.9"
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
              className="overflow-visible transition-all duration-300 group-hover:scale-105"
            >
              <path
                d="M 6 30.5 L 20 30.5 C 25.8 30.5 30.5 25.8 30.5 20 L 30.5 6"
                stroke={theme2.hex}
                strokeWidth="4.8"
                strokeLinecap="round"
                opacity="0.6"
                filter={`url(#neon-glow-b-${uniqueId})`}
              />
              <path
                d="M 6 30.5 L 20 30.5 C 25.8 30.5 30.5 25.8 30.5 20 L 30.5 6"
                stroke={theme2.hex}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 8 30.5 L 20 30.5 C 25.2 30.5 29.5 26.2 29.5 21 L 29.5 8"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.9"
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
              className="overflow-visible transition-all duration-300 group-hover:scale-105"
            >
              <path
                d="M 6 3.5 L 20 3.5 C 25.8 3.5 30.5 8.2 30.5 14 L 30.5 28"
                stroke={theme1.hex}
                strokeWidth="4.8"
                strokeLinecap="round"
                opacity="0.6"
                filter={`url(#neon-glow-a-${uniqueId})`}
              />
              <path
                d="M 6 3.5 L 20 3.5 C 25.8 3.5 30.5 8.2 30.5 14 L 30.5 28"
                stroke={theme1.hex}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 8 3.5 L 20 3.5 C 25.2 3.5 29.5 7.8 29.5 13 L 29.5 26"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.9"
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
              className="overflow-visible transition-all duration-300 group-hover:scale-105"
            >
              <path
                d="M 28 30.5 L 14 30.5 C 8.2 30.5 3.5 25.8 3.5 20 L 3.5 6"
                stroke={theme2.hex}
                strokeWidth="4.8"
                strokeLinecap="round"
                opacity="0.6"
                filter={`url(#neon-glow-b-${uniqueId})`}
              />
              <path
                d="M 28 30.5 L 14 30.5 C 8.2 30.5 3.5 25.8 3.5 20 L 3.5 6"
                stroke={theme2.hex}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 26 30.5 L 14 30.5 C 8.8 30.5 4.5 26.2 4.5 21 L 4.5 8"
                stroke="#FFFFFF"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export const NeonFlexCable = NeonCorners;
