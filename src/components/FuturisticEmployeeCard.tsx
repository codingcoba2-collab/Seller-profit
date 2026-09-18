import React from 'react';
import { CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { NeonCorners } from './NeonCorners';
import { SoundFx } from '../services/soundFx';
import { MarqueeText } from './MarqueeText';

export interface FuturisticEmployeeCardProps {
  id?: string;
  name: string;
  username?: string;
  roleLabel?: string;
  roles?: string[];
  subtext?: string;
  isSelected?: boolean;
  isLocked?: boolean;
  color?: 'cyan' | 'magenta' | 'amber' | 'emerald';
  variant?: 'navigation' | 'selectable' | 'checkbox' | 'display';
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export const FuturisticEmployeeCard: React.FC<FuturisticEmployeeCardProps> = ({
  id,
  name,
  username,
  roleLabel,
  roles,
  subtext,
  isSelected = false,
  isLocked = false,
  color = 'cyan',
  variant = 'selectable',
  onClick,
  className = '',
  badge,
}) => {
  const handleClick = () => {
    if (isLocked) {
      try {
        SoundFx.playChatNotificationSound(false);
      } catch {
        // ignore
      }
      return;
    }
    try {
      SoundFx.playRobotButtonClick();
    } catch {
      // ignore
    }
    onClick?.();
  };

  const initialLetter = (name || username || 'P').charAt(0).toUpperCase();

  const colorStyles = {
    cyan: {
      neonColor: 'cyan' as const,
      avatarBorder: 'border-[#25F4EE]/40 group-hover:border-[#25F4EE]',
      avatarText: 'text-[#25F4EE]',
      avatarActive: 'border-[#25F4EE] bg-[#25F4EE]/20 text-[#25F4EE]',
      selectedBorder: 'border-[#25F4EE] bg-[#25F4EE]/10 shadow-[0_0_18px_rgba(37,244,238,0.22)]',
      selectedText: 'text-[#25F4EE]',
      checkIcon: 'text-[#25F4EE]',
      badgeBg: 'bg-[#25F4EE]/15 border-[#25F4EE]/30 text-[#25F4EE]',
    },
    magenta: {
      neonColor: 'magenta' as const,
      avatarBorder: 'border-[#FE2C55]/40 group-hover:border-[#FE2C55]',
      avatarText: 'text-[#FE2C55]',
      avatarActive: 'border-[#FE2C55] bg-[#FE2C55]/20 text-[#FE2C55]',
      selectedBorder: 'border-[#FE2C55] bg-[#FE2C55]/10 shadow-[0_0_18px_rgba(254,44,85,0.22)]',
      selectedText: 'text-[#FE2C55]',
      checkIcon: 'text-[#FE2C55]',
      badgeBg: 'bg-[#FE2C55]/15 border-[#FE2C55]/30 text-[#FE2C55]',
    },
    emerald: {
      neonColor: 'cyan' as const,
      avatarBorder: 'border-emerald-400/40 group-hover:border-emerald-400',
      avatarText: 'text-emerald-400',
      avatarActive: 'border-emerald-400 bg-emerald-500/20 text-emerald-300',
      selectedBorder: 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_18px_rgba(52,211,153,0.22)]',
      selectedText: 'text-emerald-300',
      checkIcon: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
    amber: {
      neonColor: 'magenta' as const,
      avatarBorder: 'border-amber-400/40 group-hover:border-amber-400',
      avatarText: 'text-amber-400',
      avatarActive: 'border-amber-400 bg-amber-400/20 text-amber-300',
      selectedBorder: 'border-amber-400 bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,0.22)]',
      selectedText: 'text-amber-300',
      checkIcon: 'text-amber-400',
      badgeBg: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
    },
  }[color];

  // Locked state
  if (isLocked) {
    return (
      <div
        id={id}
        onClick={handleClick}
        className={`spatial-card relative overflow-hidden p-3 sm:p-3.5 rounded-2xl bg-[#10121a] border border-white/5 opacity-55 cursor-not-allowed select-none flex items-center justify-between group shadow-sm ${className}`}
      >
        <NeonCorners variant="side-left" color="magenta" size="sm" />
        <div className="flex items-center gap-2.5 min-w-0 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <MarqueeText
              text={name}
              className="font-bold text-zinc-400 text-xs sm:text-sm block"
            />
            <span className="text-[10px] text-zinc-600 block">Terkunci</span>
          </div>
        </div>
        <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-1.5 relative z-10" />
      </div>
    );
  }

  return (
    <div
      id={id}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={`spatial-card relative overflow-hidden p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer active:scale-97 select-none flex items-center justify-between group shadow-md ${
        isSelected
          ? `${colorStyles.selectedBorder}`
          : 'bg-[#161823] border border-white/10 hover:border-white/25 hover:bg-[#1a1d2b]'
      } ${className}`}
    >
      <NeonCorners variant="side-left" color={colorStyles.neonColor} size="sm" />

      <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1 overflow-hidden">
        {/* Futuristic Initial Avatar Box */}
        <div
          className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-[#0b0c10] flex items-center justify-center font-black text-xs shrink-0 transition-all shadow-xs border ${
            isSelected
              ? colorStyles.avatarActive
              : `${colorStyles.avatarBorder} ${colorStyles.avatarText} group-hover:scale-105`
          }`}
        >
          {initialLetter}
        </div>

        {/* Name & Role Details with MarqueeText */}
        <div className="min-w-0 flex-1 w-full overflow-hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="min-w-0 flex-1 overflow-hidden">
              <MarqueeText
                text={name}
                className={`font-bold text-xs sm:text-sm transition-colors ${
                  isSelected ? `${colorStyles.selectedText} font-black` : 'text-white group-hover:text-white'
                }`}
              />
            </div>
            {badge && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border shrink-0 ${colorStyles.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>

          {(roleLabel || subtext || (roles && roles.length > 0)) && (
            <div className="mt-0.5 overflow-hidden">
              <MarqueeText
                text={roleLabel || subtext || (roles ? roles.join(', ') : '')}
                speed={18}
                className="text-[10px] text-zinc-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Trailing Icon / Selection Indicator */}
      <div className="shrink-0 ml-2 relative z-10 flex items-center">
        {variant === 'navigation' && (
          <ChevronRight
            className={`w-4 h-4 transition-all ${
              isSelected ? colorStyles.checkIcon : 'text-zinc-500 group-hover:text-white group-hover:translate-x-0.5'
            }`}
          />
        )}

        {(variant === 'selectable' || variant === 'checkbox') && (
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? `${colorStyles.badgeBg} border`
                : 'border border-white/20 group-hover:border-white/40 bg-[#0b0c10]/60'
            }`}
          >
            {isSelected && (
              <CheckCircle2 className={`w-3.5 h-3.5 ${colorStyles.checkIcon}`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
