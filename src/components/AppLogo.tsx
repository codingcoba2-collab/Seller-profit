import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  variant = 'full',
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-xs', sub: 'text-[8px]' },
    sm: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-14 h-14', icon: 'w-9 h-9', text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', icon: 'w-12 h-12', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Custom Fashion-Profit Emblem */}
      <div
        className={`relative ${currentSize.box} rounded-2xl bg-gradient-to-br from-[#161823] to-[#0b0c10] border border-white/20 shadow-xl flex items-center justify-center overflow-hidden group transition-transform duration-300 hover:scale-105`}
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#25F4EE]/25 via-transparent to-[#FE2C55]/25 opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Custom SVG: Geometric Hanger + Profit Chart Arrow + Diamond */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentSize.icon} relative z-10 drop-shadow-md`}
        >
          {/* Hanger Hook Top */}
          <path
            d="M24 10C24 7.79086 25.7909 6 28 6C30.2091 6 32 7.79086 32 10C32 12.2091 30.2091 14 28 14H24V18"
            stroke="url(#logo-grad-cyan)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Minimalist Hanger Body Structure */}
          <path
            d="M8 29L24 18L40 29C40 29 38 31 34 31H14C10 31 8 29 8 29Z"
            stroke="url(#logo-grad-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upward Profit Trendline (Financial growth crossing the fashion hanger) */}
          <path
            d="M12 37L22 27L28 32L38 18"
            stroke="url(#logo-grad-cyan)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arrow Head on Trendline */}
          <path
            d="M32 18H38V24"
            stroke="url(#logo-grad-cyan)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sparkling Diamond Accent */}
          <circle cx="38" cy="18" r="2.2" fill="#FE2C55" />
          <circle cx="12" cy="37" r="2" fill="#25F4EE" />

          {/* Gradients */}
          <defs>
            <linearGradient id="logo-grad-cyan" x1="8" y1="6" x2="40" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#25F4EE" />
              <stop offset="1" stopColor="#00D2FF" />
            </linearGradient>
            <linearGradient id="logo-grad-pink" x1="8" y1="18" x2="40" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FE2C55" />
              <stop offset="1" stopColor="#FF6B8B" />
            </linearGradient>
          </defs>
        </svg>

        {/* Shimmer line */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight text-white flex items-center gap-1 leading-none ${currentSize.text}`}>
            <span>Seller</span>
            <span className="bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] bg-clip-text text-transparent">
              Profit
            </span>
          </div>
          <span className={`text-zinc-400 font-semibold tracking-wider uppercase mt-1 ${currentSize.sub}`}>
            Fashion &amp; Live Commerce
          </span>
        </div>
      )}
    </div>
  );
};
