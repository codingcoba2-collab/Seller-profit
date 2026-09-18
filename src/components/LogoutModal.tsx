import React, { useEffect } from 'react';
import { LogOut, X, Sparkles, Shield, User, Store } from 'lucide-react';
import { CurrentUser } from '../types';
import { SoundFx } from '../services/soundFx';
import { roleLabels } from '../utils/formatters';
import { NeonCorners } from './NeonCorners';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentUser: CurrentUser;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentUser,
}) => {
  useEffect(() => {
    if (isOpen) {
      SoundFx.playHologramOpen();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    SoundFx.playRobotButtonClick();
    onConfirm();
  };

  const handleCancel = () => {
    SoundFx.playRobotButtonClick();
    onClose();
  };

  const roleText = currentUser.isOwner
    ? 'Owner Toko (Super Admin)'
    : currentUser.roles && currentUser.roles.length > 0
    ? currentUser.roles.map((r) => roleLabels[r] || r).join(', ')
    : 'Staf Toko';

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={handleCancel}
    >
      <div
        id="modal-logout-confirm"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="spatial-card relative w-full max-w-md rounded-3xl border border-white/20 bg-[#161823] text-white p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.85)] animate-scale-up space-y-5 overflow-hidden"
      >
        {/* Neon decorative accents matching application theme */}
        <NeonCorners variant="opposite-tl-br" color="magenta" size="sm" />

        {/* Top Protocol Tag */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#FE2C55] opacity-85 border-b border-white/10 pb-2.5">
          <span className="flex items-center gap-1.5 font-bold tracking-wider">
            <Sparkles className="w-3 h-3 text-[#FE2C55]" />
            SISTEM KEAMANAN // KONFIRMASI KELUAR
          </span>
          <span className="text-zinc-500 font-mono">AUTH.SESSION</span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          id="btn-close-logout-modal"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer z-20 border border-white/5"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Main Content Area */}
        <div className="flex flex-col items-center text-center space-y-3 pt-1">
          {/* Glowing Animated Exit Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FE2C55]/20 to-black/60 border border-[#FE2C55]/40 flex items-center justify-center text-[#FE2C55] shadow-[0_0_25px_rgba(254,44,85,0.4)]">
              <LogOut className="w-8 h-8 text-[#FE2C55]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FE2C55] border-2 border-[#161823] flex items-center justify-center text-white shadow-md">
              <Shield className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Keluar dari Aplikasi?
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Anda akan mengakhiri sesi aktif saat ini. Seluruh data transaksi dan laporan Anda tersimpan aman.
            </p>
          </div>

          {/* Active User Card Preview */}
          <div className="w-full p-3 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0 font-bold overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-5 h-5 text-[#25F4EE]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {currentUser.name || currentUser.username}
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-[#25F4EE] shrink-0" />
                  <span>{currentUser.storeName || 'Toko Seller'}</span>
                </div>
              </div>
            </div>

            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FE2C55]/15 text-[#FE2C55] border border-[#FE2C55]/30 uppercase">
              {currentUser.isOwner ? 'Owner' : 'Staf'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Batal & Ya Keluar */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            id="btn-cancel-logout"
            onClick={handleCancel}
            className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95 text-center"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-confirm-logout"
            onClick={handleConfirmLogout}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#FE2C55]/85 hover:from-[#FE2C55]/90 hover:to-[#FE2C55]/75 text-white font-black text-xs transition cursor-pointer active:scale-95 shadow-lg shadow-[#FE2C55]/30 border border-[#FE2C55]/50 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Ya, Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
