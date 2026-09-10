import React from 'react';
import { CurrentUser } from '../types';
import { CATEGORIES, RoutePath, isRouteAllowed } from '../services/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Top Header without category switcher tabs */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#121520] border border-white/10 shadow-lg overflow-hidden">
        <NeonCorners variant="side-left" color="cyan" />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${currentCategory.iconColor} shrink-0`}
          >
            <CategoryIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {currentCategory.title}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                {currentCategory.items.length} Fitur
              </span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-1">
              {currentCategory.description}
            </p>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <button
          type="button"
          id="btn-sub-menu-back-to-dashboard"
          onClick={() => onNavigate('/dashboard')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs transition border border-white/10 cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {/* Sub-menu Feature Cards Grid: 2 ke samping pada layar mobile */}
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
              className={`relative group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border cursor-pointer overflow-hidden ${
                accessible
                  ? 'bg-[#121520] hover:bg-[#181c2b] border-white/10 hover:border-[#25F4EE]/40 shadow-sm hover:shadow-md active:scale-[0.99]'
                  : 'bg-[#12141c]/70 border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              {accessible && (
                <NeonCorners 
                  variant="side-left" 
                  color={item.iconColor?.includes('FE2C55') ? 'magenta' : item.iconColor?.includes('emerald') ? 'emerald' : item.iconColor?.includes('amber') ? 'amber' : 'cyan'} 
                />
              )}
              {/* Left: Icon & Text */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 relative z-10">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 shrink-0 ${
                    accessible ? item.iconColor : 'text-zinc-500'
                  }`}
                >
                  <ItemIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <MarqueeText
                    text={item.title}
                    as="h3"
                    className="text-xs sm:text-sm font-bold text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text={item.subtitle}
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>

              {/* Right: Lock if not accessible */}
              {!accessible && (
                <div className="shrink-0 flex items-center justify-end">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded-lg border border-zinc-700/40">
                    <Lock className="w-3 h-3" />
                    <span>Kunci</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
