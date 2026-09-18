import React from 'react';
import { CurrentUser } from '../types';
import { CATEGORIES, RoutePath, isRouteAllowed } from '../services/navigation';
import { Lock, ChevronRight } from 'lucide-react';
import { MarqueeText } from '../components/MarqueeText';
import { NeonCorners } from '../components/NeonCorners';

interface CategoryPageViewProps {
  categoryKey: 'persiapan' | 'penjualan' | 'keuangan' | 'informasi';
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CategoryPageView: React.FC<CategoryPageViewProps> = ({
  categoryKey,
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const currentCategory = CATEGORIES.find((c) => c.key === categoryKey) || CATEGORIES[0];
  const CategoryIcon = currentCategory.icon;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* Category Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg flex items-center gap-3 sm:gap-4 relative overflow-hidden">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 shrink-0 ${currentCategory.iconColor}`}>
          <CategoryIcon className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Kategori {currentCategory.title}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
              {currentCategory.items.length} Modul
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
            {currentCategory.description}
          </p>
        </div>
      </div>

      {/* Sub-menu Feature Cards Grid: 2 ke samping */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {currentCategory.items.map((item) => {
          const accessible = isRouteAllowed(item.path, currentUser);
          const ItemIcon = item.icon;

          return (
            <div
              key={item.path}
              id={`sub-menu-card-${item.path.replace(/[\/]/g, '-')}`}
              onClick={() => {
                if (accessible) {
                  onNavigate(item.path);
                } else {
                  onNotify?.('Akses menu ini dibatasi untuk peran Anda.', 'error');
                }
              }}
              className={`spatial-card relative group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-2.5 border cursor-pointer overflow-hidden ${
                accessible
                  ? 'border-white/10 hover:border-[#25F4EE]/60 hover:shadow-[0_0_20px_rgba(37,244,238,0.22)] active:scale-[0.98]'
                  : 'border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              {accessible ? (
                <NeonCorners 
                  variant="side-left" 
                  color={item.iconColor?.includes('FE2C55') ? 'magenta' : item.iconColor?.includes('emerald') ? 'emerald' : item.iconColor?.includes('amber') ? 'amber' : 'cyan'} 
                  size="sm"
                />
              ) : (
                <NeonCorners variant="side-left" color="magenta" size="sm" />
              )}

              {/* Top Row: Icon & Status */}
              <div className="flex items-center justify-between gap-2 relative z-10">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 shrink-0 group-hover:scale-105 transition-transform ${
                    accessible ? item.iconColor : 'text-zinc-500'
                  }`}
                >
                  <ItemIcon className="w-4.5 h-4.5" />
                </div>

                <div className="shrink-0">
                  {accessible ? (
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#25F4EE] group-hover:translate-x-0.5 transition-all" />
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded-lg border border-zinc-700/40">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom: Title & Subtitle */}
              <div className="min-w-0 relative z-10 space-y-0.5">
                <MarqueeText
                  text={item.title}
                  className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                />
                <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
