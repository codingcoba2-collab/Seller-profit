import React from 'react';
import { Volume2, Sparkles, Flame, Megaphone } from 'lucide-react';

interface RunningTextBannerProps {
  messages: string[];
  speed?: number; // duration in seconds
  iconType?: 'volume' | 'flame' | 'megaphone' | 'sparkles';
  badgeText?: string;
}

export const RunningTextBanner: React.FC<RunningTextBannerProps> = ({
  messages,
  speed = 18,
  iconType = 'volume',
  badgeText = 'LIVE INFO',
}) => {
  const fullText = messages.join('   ✦   ');

  return (
    <div 
      id="running-text-banner"
      className="w-full bg-[#161823] border border-white/10 rounded-2xl p-2.5 sm:p-3 overflow-hidden shadow-md flex items-center gap-2.5 sm:gap-3 select-none"
    >
      {/* Badge Indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#25F4EE]/20 to-[#FE2C55]/20 border border-[#25F4EE]/30 text-white font-black text-xs shrink-0 shadow-xs">
        {iconType === 'flame' && <Flame className="w-3.5 h-3.5 text-[#FE2C55] animate-bounce" />}
        {iconType === 'megaphone' && <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
        {iconType === 'sparkles' && <Sparkles className="w-3.5 h-3.5 text-[#25F4EE] animate-spin" style={{ animationDuration: '3s' }} />}
        {iconType === 'volume' && <Volume2 className="w-3.5 h-3.5 text-[#25F4EE] animate-pulse" />}
        
        <span className="bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] bg-clip-text text-transparent tracking-wider text-[10px] sm:text-xs font-black uppercase">
          {badgeText}
        </span>
      </div>

      {/* Continuously Running Marquee Text */}
      <div className="overflow-hidden w-full relative">
        <div
          className="inline-flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: `${speed}s` }}
        >
          <span className="pr-12 text-xs font-semibold text-zinc-200 inline-block tracking-wide">
            {fullText}
          </span>
          <span className="pr-12 text-xs font-semibold text-zinc-200 inline-block tracking-wide">
            {fullText}
          </span>
        </div>
      </div>
    </div>
  );
};
