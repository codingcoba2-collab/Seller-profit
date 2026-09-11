import React, { useState } from 'react';
import { CurrentUser, ViewState } from '../types';
import { StorageService } from '../services/storage';
import { roleLabels } from '../utils/formatters';
import { RoutePath, getParentRoute, getPageTitle } from '../services/navigation';
import { 
  ArrowLeft, 
  ShoppingBag, 
  LogOut, 
  Settings, 
  DownloadCloud, 
  Palette
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ChangePasswordModal } from './ChangePasswordModal';
import { UpdateAppModal } from './UpdateAppModal';
import { ThemeSelectorModal } from './ThemeSelectorModal';

interface NavbarProps {
  currentUser: CurrentUser;
  currentRoute: RoutePath;
  onNavigate: (route: RoutePath) => void;
  onLogout: () => void;
  onOpenInstallGuide: () => void;
  onOpenProfile: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRoute,
  onNavigate,
  onLogout,
  onOpenInstallGuide,
  onOpenProfile,
  onNotify,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const parent = getParentRoute(currentRoute);
  const isHome = currentRoute === '/dashboard';

  return (
    <>
      <header 
        style={{ 
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 8px)',
          paddingBottom: '10px'
        }}
        className="spatial-header sticky top-0 z-40 bg-[#161823] border-b border-white/10 shadow-lg text-white flex flex-col justify-center transition-all"
      >
        {/* Main navigation header with responsive mobile clearance */}
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-10 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {!isHome ? (
              <button
                id="btn-back-to-parent"
                onClick={() => onNavigate(parent ? parent.path : '/dashboard')}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer shadow-xs active:scale-95 shrink-0"
                title={parent ? `Kembali ke ${parent.label}` : 'Kembali ke Beranda'}
              >
                <ArrowLeft className="w-4 h-4 text-[#25F4EE] shrink-0" />
                <span className="truncate max-w-[90px] sm:max-w-[160px] md:max-w-none">
                  {parent ? parent.label : 'Beranda'}
                </span>
              </button>
            ) : (
              <div 
                onClick={() => onNavigate('/dashboard')} 
                className="cursor-pointer shrink-0 flex items-center gap-2"
                id="navbar-app-logo"
              >
                <AppLogo size="sm" showText={true} />
              </div>
            )}

            {!isHome && (
              <div className="pl-2 border-l border-white/10 min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-white truncate">
                  {getPageTitle(currentRoute)}
                </h2>
              </div>
            )}
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Theme Selector Button */}
            <button
              id="btn-theme-selector"
              onClick={() => setShowThemeModal(true)}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              title="Ganti Tema & Warna Toko"
            >
              <Palette className="w-4 h-4 text-[#25F4EE]" />
            </button>

            {/* Update App Button */}
            <button
              id="btn-update-app"
              onClick={() => setShowUpdateModal(true)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#25F4EE]/15 to-emerald-500/15 text-[#25F4EE] hover:bg-[#25F4EE]/25 border border-[#25F4EE]/40 transition cursor-pointer flex items-center gap-1 sm:gap-1.5 active:scale-95 shadow-xs"
              title="Pembaruan Aplikasi (Update Instan Tanpa Uninstall)"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span className="text-[11px] sm:text-xs font-black text-[#25F4EE]">Update</span>
            </button>

            {/* Owner Settings / Gear Icon for Password Change */}
            {currentUser.isOwner && (
              <button
                id="btn-owner-settings"
                onClick={() => setShowPasswordModal(true)}
                className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                title="Pengaturan & Ganti Password Toko"
              >
                <Settings className="w-4 h-4 text-[#25F4EE]" />
              </button>
            )}

            {/* Logout Button */}
            <button
              id="btn-user-logout"
              onClick={onLogout}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-[#FE2C55] bg-white/5 hover:bg-[#FE2C55]/10 border border-white/10 transition cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser}
        onNotify={onNotify}
      />

      {/* Update App Modal */}
      <UpdateAppModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onNotify={onNotify}
      />

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onNotify={onNotify}
      />
    </>
  );
};
