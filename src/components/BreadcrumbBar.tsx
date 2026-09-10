import React from 'react';
import { RoutePath, getBreadcrumbs, getParentRoute } from '../services/navigation';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

interface BreadcrumbBarProps {
  currentRoute: RoutePath;
  onNavigate: (route: RoutePath) => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  if (currentRoute === '/dashboard') {
    return null;
  }

  const breadcrumbs = getBreadcrumbs(currentRoute);

  return (
    <div className="spatial-menu w-full bg-[#12141c]/80 backdrop-blur-md border-b border-white/5 px-4 py-2 text-xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap text-zinc-400">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}

              {isLast ? (
                <span
                  id={`breadcrumb-current-${crumb.path.replace(/\//g, '-')}`}
                  className="font-bold text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10 shrink-0"
                  title={crumb.label}
                >
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  id={`breadcrumb-link-${crumb.path.replace(/\//g, '-')}`}
                  onClick={() => onNavigate(crumb.path)}
                  className="hover:text-white transition font-medium flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {idx === 0 && <Home className="w-3 h-3 text-[#25F4EE]" />}
                  <span>{crumb.label}</span>
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
