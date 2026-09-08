import React from 'react';
import { CurrentUser } from '../types';
import { CATEGORIES, RoutePath, isRouteAllowed } from '../services/navigation';
import { Lock } from 'lucide-react';
import { MarqueeText } from '../components/MarqueeText';

interface CategoryPageViewProps {
  categoryKey: 'persiapan' | 'penjualan' | 'keuangan';
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
      {/* Top Header & Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
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

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-[#0b0c10] p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              id={`btn-switch-to-category-${cat.key}`}
              onClick={() => onNavigate(cat.path)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                cat.key === categoryKey
                  ? 'bg-white text-zinc-950 shadow-sm font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{cat.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-menu Feature Cards Grid: 2 ke samping, sisanya ke bawah */}
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
              className={`group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border cursor-pointer ${
                accessible
                  ? 'bg-[#161823] hover:bg-[#1c1f2e] border-white/10 hover:border-[#25F4EE]/40 shadow-sm hover:shadow-md active:scale-[0.99]'
                  : 'bg-[#12141c]/70 border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Left: Icon & Text */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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
