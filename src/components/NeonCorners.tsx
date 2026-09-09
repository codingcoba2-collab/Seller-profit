import React, { useId } from 'react';

export type NeonFlexVariant = 
  | 'side-left' 
  | 'side-right' 
  | 'corner-top-left' 
  | 'corner-top-right' 
  | 'corner-bottom-right'
  | 'dual-accent'
  | 'auto';

export type NeonFlexColor = 'cyan' | 'magenta' | 'emerald' | 'amber' | 'gradient';

interface NeonCornersProps {
  /** Optional legacy flag */
  cyanTop?: boolean;
  /** Optional legacy flag */
  magentaBottom?: boolean;
  /** Position variant: side or end/corner */
  variant?: NeonFlexVariant;
  /** Neon color theme */
  color?: NeonFlexColor;
  /** Custom extra styling */
  className?: string;
  /** Cable thickness: normal (3.5px) or thin (2.5px) */
  thickness?: 'normal' | 'thin';
}

const COLOR_MAP: Record<NeonFlexColor, {
  hex: string;
  glow: string;
  shadow: string;
  border: string;
  bgGradient: string;
}> = {
  cyan: {
    hex: '#25F4EE',
    glow: 'rgba(37, 244, 238, 0.85)',
    shadow: '0 0 4px #fff, 0 0 10px #25F4EE, 0 0 20px rgba(37, 244, 238, 0.65)',
    border: 'border-[#25F4EE]',
    bgGradient: 'from-[#25F4EE] to-[#00C2FF]',
  },
  magenta: {
    hex: '#FE2C55',
    glow: 'rgba(254, 44, 85, 0.85)',
    shadow: '0 0 4px #fff, 0 0 10px #FE2C55, 0 0 20px rgba(254, 44, 85, 0.65)',
    border: 'border-[#FE2C55]',
    bgGradient: 'from-[#FE2C55] to-[#FF007A]',
  },
  emerald: {
    hex: '#10B981',
    glow: 'rgba(16, 185, 129, 0.85)',
    shadow: '0 0 4px #fff, 0 0 10px #10B981, 0 0 20px rgba(16, 185, 129, 0.65)',
    border: 'border-[#10B981]',
    bgGradient: 'from-[#10B981] to-[#059669]',
  },
  amber: {
    hex: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.85)',
    shadow: '0 0 4px #fff, 0 0 10px #F59E0B, 0 0 20px rgba(245, 158, 11, 0.65)',
    border: 'border-[#F59E0B]',
    bgGradient: 'from-[#F59E0B] to-[#D97706]',
  },
  gradient: {
    hex: '#25F4EE',
    glow: 'rgba(37, 244, 238, 0.85)',
    shadow: '0 0 4px #fff, 0 0 12px #25F4EE, 0 0 20px rgba(254, 44, 85, 0.6)',
    border: 'border-[#25F4EE]',
    bgGradient: 'from-[#25F4EE] via-[#A855F7] to-[#FE2C55]',
  }
};

/**
 * Komponen Kabel Neon Fleksibel (LED Neon Flex Wire/Tube)
 * Memberikan aksen lampu selang neon variasi di samping atau di ujung sudut menu
 */
export const NeonCorners: React.FC<NeonCornersProps> = ({
  cyanTop = true,
  magentaBottom = true,
  variant,
  color,
  className = '',
  thickness = 'normal',
}) => {
  const uniqueId = useId().replace(/[:]/g, '');

  // Tentukan varian otomatis jika belum ditentukan
  let resolvedVariant: NeonFlexVariant = variant || 'auto';
  let resolvedColor: NeonFlexColor = color || (cyanTop && magentaBottom ? 'gradient' : cyanTop ? 'cyan' : 'magenta');

  if (resolvedVariant === 'auto') {
    // Jika ada cyanTop tapi bukan magentaBottom -> ujung atas / corner-top-left
    if (cyanTop && !magentaBottom) {
      resolvedVariant = 'corner-top-left';
      resolvedColor = 'cyan';
    } else if (!cyanTop && magentaBottom) {
      // Jika magentaBottom saja -> kabel samping kiri magenta
      resolvedVariant = 'side-left';
      resolvedColor = 'magenta';
    } else {
      // Default: kabel samping fleksibel elegan
      resolvedVariant = 'side-left';
    }
  }

  const activeTheme = COLOR_MAP[resolvedColor] || COLOR_MAP.cyan;
  const tubeWidthClass = thickness === 'thin' ? 'w-[3px]' : 'w-[3.5px]';

  // 1. Variasi Kabel Neon di Samping Kiri (Vertical Flexible Neon Strip)
  if (resolvedVariant === 'side-left') {
    return (
      <div 
        className={`pointer-events-none absolute left-0 top-3 bottom-3 ${tubeWidthClass} z-10 transition-all duration-300 ${className}`}
        aria-hidden="true"
      >
        {/* Diffuse Outer Ambient Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-[4px] opacity-70 group-hover:opacity-100 group-hover:blur-[6px] transition-all duration-300"
          style={{ backgroundColor: activeTheme.hex }}
        />
        {/* Core Flexible Silicone Neon Tube */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-b ${activeTheme.bgGradient}`}
          style={{ boxShadow: activeTheme.shadow }}
        />
        {/* High-Intensity Inner Light Core */}
        <div className="absolute left-[0.5px] right-[0.5px] top-1 bottom-1 rounded-full bg-white/80 blur-[0.3px]" />
      </div>
    );
  }

  // 2. Variasi Kabel Neon di Samping Kanan (Vertical Flexible Neon Strip)
  if (resolvedVariant === 'side-right') {
    return (
      <div 
        className={`pointer-events-none absolute right-0 top-3 bottom-3 ${tubeWidthClass} z-10 transition-all duration-300 ${className}`}
        aria-hidden="true"
      >
        <div 
          className="absolute inset-0 rounded-full blur-[4px] opacity-70 group-hover:opacity-100 group-hover:blur-[6px] transition-all duration-300"
          style={{ backgroundColor: activeTheme.hex }}
        />
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-b ${activeTheme.bgGradient}`}
          style={{ boxShadow: activeTheme.shadow }}
        />
        <div className="absolute left-[0.5px] right-[0.5px] top-1 bottom-1 rounded-full bg-white/80 blur-[0.3px]" />
      </div>
    );
  }

  // 3. Variasi Kabel Neon Lekukan Ujung Atas-Kiri (Bent Flexible Neon Cable Corner)
  if (resolvedVariant === 'corner-top-left') {
    return (
      <div className={`pointer-events-none absolute -top-px -left-px z-10 overflow-visible ${className}`} aria-hidden="true">
        <svg 
          className="w-10 h-10 overflow-visible transition-all duration-300 group-hover:scale-105" 
          viewBox="0 0 36 36" 
          fill="none"
        >
          <defs>
            <filter id={`neon-flex-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur1" />
              <feGaussianBlur stdDeviation="5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Outer Ambient Glow Tube */}
          <path
            d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
            stroke={activeTheme.hex}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
            filter={`url(#neon-flex-${uniqueId})`}
          />
          {/* Main Neon Flex Tube */}
          <path
            d="M 28 3.5 L 14 3.5 C 8.2 3.5 3.5 8.2 3.5 14 L 3.5 28"
            stroke={activeTheme.hex}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Intense White Core Filament */}
          <path
            d="M 26 3.5 L 14 3.5 C 8.8 3.5 4.5 7.8 4.5 13 L 4.5 26"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      </div>
    );
  }

  // 4. Variasi Kabel Neon Lekukan Ujung Atas-Kanan
  if (resolvedVariant === 'corner-top-right') {
    return (
      <div className={`pointer-events-none absolute -top-px -right-px z-10 overflow-visible ${className}`} aria-hidden="true">
        <svg 
          className="w-10 h-10 overflow-visible transition-all duration-300 group-hover:scale-105" 
          viewBox="0 0 36 36" 
          fill="none"
        >
          <defs>
            <filter id={`neon-flex-tr-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur1" />
              <feGaussianBlur stdDeviation="5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 8 3.5 L 22 3.5 C 27.8 3.5 32.5 8.2 32.5 14 L 32.5 28"
            stroke={activeTheme.hex}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
            filter={`url(#neon-flex-tr-${uniqueId})`}
          />
          <path
            d="M 8 3.5 L 22 3.5 C 27.8 3.5 32.5 8.2 32.5 14 L 32.5 28"
            stroke={activeTheme.hex}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 10 3.5 L 22 3.5 C 27.2 3.5 31.5 7.8 31.5 13 L 31.5 26"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      </div>
    );
  }

  // 5. Variasi Kabel Neon Lekukan Ujung Bawah-Kanan
  if (resolvedVariant === 'corner-bottom-right') {
    return (
      <div className={`pointer-events-none absolute -bottom-px -right-px z-10 overflow-visible ${className}`} aria-hidden="true">
        <svg 
          className="w-10 h-10 overflow-visible transition-all duration-300 group-hover:scale-105" 
          viewBox="0 0 36 36" 
          fill="none"
        >
          <defs>
            <filter id={`neon-flex-br-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur1" />
              <feGaussianBlur stdDeviation="5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 8 32.5 L 22 32.5 C 27.8 32.5 32.5 27.8 32.5 22 L 32.5 8"
            stroke={activeTheme.hex}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
            filter={`url(#neon-flex-br-${uniqueId})`}
          />
          <path
            d="M 8 32.5 L 22 32.5 C 27.8 32.5 32.5 27.8 32.5 22 L 32.5 8"
            stroke={activeTheme.hex}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 10 32.5 L 22 32.5 C 27.2 32.5 31.5 28.2 31.5 23 L 31.5 10"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      </div>
    );
  }

  // 6. Variasi Dual Accent (Lekukan Ujung Atas Cyan + Kabel Samping Magenta)
  return (
    <>
      {/* Bent flex at top-left corner */}
      <div className="pointer-events-none absolute -top-px -left-px z-10 overflow-visible" aria-hidden="true">
        <svg className="w-8 h-8 overflow-visible" viewBox="0 0 32 32" fill="none">
          <path
            d="M 24 3 L 12 3 C 7 3 3 7 3 12 L 3 24"
            stroke="#25F4EE"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(37, 244, 238, 0.85))' }}
          />
          <path
            d="M 22 3 L 12 3 C 7.5 3 4 6.5 4 11 L 4 22"
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Side bottom neon cable accent */}
      <div 
        className="pointer-events-none absolute right-0 bottom-3 h-10 w-[3px] rounded-full z-10"
        style={{
          backgroundColor: '#FE2C55',
          boxShadow: '0 0 4px #fff, 0 0 8px #FE2C55, 0 0 16px rgba(254, 44, 85, 0.7)'
        }}
        aria-hidden="true"
      />
    </>
  );
};

export const NeonFlexCable = NeonCorners;

