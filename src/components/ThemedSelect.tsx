import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Search } from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import { NeonCorners } from './NeonCorners';

export interface ThemedSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface ThemedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  title?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  color?: 'theme' | 'cyan' | 'magenta' | 'amber' | 'emerald';
}

export const ThemedSelect: React.FC<ThemedSelectProps> = ({
  value,
  onChange,
  options,
  title = 'Pilih Opsi',
  placeholder = 'Pilih Opsi...',
  className = '',
  disabled = false,
  id,
  color = 'theme',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options if search query typed
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    try {
      SoundFx.playRobotButtonClick();
    } catch {
      // ignore
    }
    setIsOpen(true);
  };

  const handleSelect = (val: string) => {
    try {
      SoundFx.playRobotButtonClick();
    } catch {
      // ignore
    }
    onChange(val);
    setIsOpen(false);
  };

  const themeColors = {
    theme: {
      neonColor: 'cyan' as const,
      border: 'border-[var(--primary-color,#25F4EE)]/40',
      activeBorder: 'border-[var(--primary-color,#25F4EE)]',
      activeRing: 'border-[var(--primary-color,#25F4EE)] bg-[var(--primary-color,#25F4EE)]/20 shadow-[0_0_12px_var(--primary-color,#25F4EE)]',
      dot: 'bg-[var(--primary-color,#25F4EE)] shadow-[0_0_8px_var(--primary-color,#25F4EE)]',
      textActive: 'text-[var(--primary-color,#25F4EE)]',
      bgActive: 'bg-[var(--primary-color,#25F4EE)]/10',
      chevron: 'text-[var(--primary-color,#25F4EE)]',
    },
    cyan: {
      neonColor: 'cyan' as const,
      border: 'border-[#25F4EE]/40',
      activeBorder: 'border-[#25F4EE]',
      activeRing: 'border-[#25F4EE] bg-[#25F4EE]/15 shadow-[0_0_12px_rgba(37,244,238,0.5)]',
      dot: 'bg-[#25F4EE] shadow-[0_0_8px_#25F4EE]',
      textActive: 'text-[#25F4EE]',
      bgActive: 'bg-[#25F4EE]/10',
      chevron: 'text-[#25F4EE]',
    },
    magenta: {
      neonColor: 'magenta' as const,
      border: 'border-[#FE2C55]/40',
      activeBorder: 'border-[#FE2C55]',
      activeRing: 'border-[#FE2C55] bg-[#FE2C55]/15 shadow-[0_0_12px_rgba(254,44,85,0.5)]',
      dot: 'bg-[#FE2C55] shadow-[0_0_8px_#FE2C55]',
      textActive: 'text-[#FE2C55]',
      bgActive: 'bg-[#FE2C55]/10',
      chevron: 'text-[#FE2C55]',
    },
    amber: {
      neonColor: 'magenta' as const,
      border: 'border-amber-400/40',
      activeBorder: 'border-amber-400',
      activeRing: 'border-amber-400 bg-amber-400/15 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      textActive: 'text-amber-400',
      bgActive: 'bg-amber-400/10',
      chevron: 'text-amber-400',
    },
    emerald: {
      neonColor: 'cyan' as const,
      border: 'border-emerald-400/40',
      activeBorder: 'border-emerald-400',
      activeRing: 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.5)]',
      dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      textActive: 'text-emerald-300',
      bgActive: 'bg-emerald-500/10',
      chevron: 'text-emerald-400',
    },
  }[color];

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`px-3 py-2 text-xs rounded-xl bg-[var(--bg-main,#0b0c10)] border border-white/10 hover:border-[var(--primary-color,#25F4EE)]/50 text-[var(--text-main,#f4f4f6)] font-semibold flex items-center justify-between gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={selectedOption ? selectedOption.label : title}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${themeColors.chevron}`} />
      </button>

      {/* Themed Bottom Sheet / Modal Options Picker */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="spatial-card relative w-full max-w-lg bg-[var(--bg-card,#161823)] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-[0_-15px_45px_rgba(0,0,0,0.85)] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 text-[var(--text-main,#ffffff)]"
              onClick={(e) => e.stopPropagation()}
            >
              <NeonCorners variant="side-left" color={themeColors.neonColor} size="sm" />

              {/* Mobile grab handle */}
              <div className="pt-3 pb-1 sm:hidden relative z-10">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
              </div>

              {/* Sheet Header */}
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] relative z-10">
                <div>
                  <h3 className="text-sm font-black text-[var(--text-main,#ffffff)] tracking-wide">
                    {title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Pilih salah satu opsi di bawah ini
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar if > 5 options */}
              {options.length > 5 && (
                <div className="p-3 border-b border-white/5 bg-[var(--bg-main,#0b0c10)]/50 relative z-10">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari opsi..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-main,#0b0c10)] border border-white/10 text-[var(--text-main,#ffffff)] placeholder-zinc-500 focus:border-[var(--primary-color,#25F4EE)] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="p-3 overflow-y-auto max-h-[55vh] space-y-1.5 relative z-10">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-500">
                    Opsi tidak ditemukan.
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-left transition cursor-pointer border ${
                          isSelected
                            ? `${themeColors.bgActive} ${themeColors.activeBorder} ${themeColors.textActive} font-black shadow-sm`
                            : 'bg-[var(--bg-main,#0b0c10)]/70 border-white/5 hover:bg-white/5 text-[var(--text-main,#e4e4e7)] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {opt.icon && (
                            <div className="shrink-0">{opt.icon}</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold truncate">
                              {opt.label}
                            </div>
                            {opt.description && (
                              <div className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">
                                {opt.description}
                              </div>
                            )}
                          </div>
                          {opt.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-zinc-300 font-semibold shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>

                        {/* Custom Radio Circle Matching App Theme */}
                        <div className="shrink-0 pl-2">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? themeColors.activeRing
                                : 'border-white/25 hover:border-white/40'
                            }`}
                          >
                            {isSelected && (
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${themeColors.dot}`}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Sheet Footer */}
              <div className="p-3 border-t border-white/10 bg-[var(--bg-main,#0b0c10)]/40 flex justify-end relative z-10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
