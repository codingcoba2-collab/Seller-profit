import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  storeName?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Memuat Sistem Akuntansi Shopee...',
  storeName,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0c10] text-white px-4 transition-opacity duration-300">
      {/* Background ambient neon glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#FE2C55]/15 blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/4" />
      <div className="absolute w-72 h-72 rounded-full bg-[#25F4EE]/15 blur-3xl pointer-events-none translate-x-1/3 translate-y-1/4" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* TikTok Dual Glowing Rings Animation */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Cyan Ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-[#25F4EE] opacity-80 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Pink Ring */}
          <div className="absolute inset-1.5 rounded-2xl border-2 border-[#FE2C55] opacity-90 animate-spin" style={{ animationDuration: '3s' }} />
          
          {/* Center Brand Icon */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#161823] border border-white/15 flex items-center justify-center shadow-2xl animate-tiktok-pulse">
            <ShoppingBag className="w-8 h-8 text-[#25F4EE] drop-shadow-[0_0_8px_#25F4EE]" />
          </div>
        </div>

        {/* Text & Progress Info */}
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-pulse" />
            <h2 className="text-lg font-black tracking-tight text-white">
              Remix Laba &amp; Rugi Shopee
            </h2>
            <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-pulse" />
          </div>

          {storeName && (
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
              {storeName}
            </div>
          )}

          <p className="text-xs text-zinc-400 font-medium animate-pulse">
            {message}
          </p>
        </div>

        {/* TikTok Style Mini Loading Dots */}
        <div className="flex items-center gap-2 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#25F4EE] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
