import React from 'react';

interface NeonCornersProps {
  cyanTop?: boolean;
  magentaBottom?: boolean;
  className?: string;
}

export const NeonCorners: React.FC<NeonCornersProps> = ({
  cyanTop = true,
  magentaBottom = true,
  className = '',
}) => {
  return (
    <>
      {/* Top Left Neon Corner */}
      <span
        className={`pointer-events-none absolute -top-px -left-px w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-2xl transition-all duration-300 z-10 ${
          cyanTop
            ? 'border-[#25F4EE] shadow-[0_0_8px_rgba(37,244,238,0.85)] group-hover:w-5 group-hover:h-5 group-hover:shadow-[0_0_12px_#25F4EE]'
            : 'border-[#FE2C55] shadow-[0_0_8px_rgba(254,44,85,0.85)] group-hover:w-5 group-hover:h-5'
        } ${className}`}
        aria-hidden="true"
      />

      {/* Top Right Neon Corner */}
      <span
        className={`pointer-events-none absolute -top-px -right-px w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-2xl transition-all duration-300 z-10 ${
          cyanTop
            ? 'border-[#25F4EE] shadow-[0_0_8px_rgba(37,244,238,0.85)] group-hover:w-5 group-hover:h-5 group-hover:shadow-[0_0_12px_#25F4EE]'
            : 'border-[#FE2C55] shadow-[0_0_8px_rgba(254,44,85,0.85)] group-hover:w-5 group-hover:h-5'
        } ${className}`}
        aria-hidden="true"
      />

      {/* Bottom Left Neon Corner */}
      <span
        className={`pointer-events-none absolute -bottom-px -left-px w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-2xl transition-all duration-300 z-10 ${
          magentaBottom
            ? 'border-[#FE2C55] shadow-[0_0_8px_rgba(254,44,85,0.85)] group-hover:w-5 group-hover:h-5 group-hover:shadow-[0_0_12px_#FE2C55]'
            : 'border-[#25F4EE] shadow-[0_0_8px_rgba(37,244,238,0.85)] group-hover:w-5 group-hover:h-5'
        } ${className}`}
        aria-hidden="true"
      />

      {/* Bottom Right Neon Corner */}
      <span
        className={`pointer-events-none absolute -bottom-px -right-px w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-2xl transition-all duration-300 z-10 ${
          magentaBottom
            ? 'border-[#FE2C55] shadow-[0_0_8px_rgba(254,44,85,0.85)] group-hover:w-5 group-hover:h-5 group-hover:shadow-[0_0_12px_#FE2C55]'
            : 'border-[#25F4EE] shadow-[0_0_8px_rgba(37,244,238,0.85)] group-hover:w-5 group-hover:h-5'
        } ${className}`}
        aria-hidden="true"
      />
    </>
  );
};
