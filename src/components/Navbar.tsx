import React, { useState } from 'react';
import { CurrentUser, ViewState } from '../types';
import { StorageService } from '../services/storage';
import { roleLabels } from '../utils/formatters';
import { 
  ArrowLeft, 
  ShoppingBag, 
  LogOut, 
  Smartphone,
  Settings,
  RefreshCw,
  Cloud,
  DownloadCloud,
  Palette
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ChangePasswordModal } from './ChangePasswordModal';
import { UpdateAppModal } from './UpdateAppModal';
import { ThemeSelectorModal } from './ThemeSelectorModal';

interface NavbarProps {
  currentUser: CurrentUser;
  currentView: ViewState;
  onNavigate: (tab: ViewState) => void;
  onLogout: () => void;
  onOpenInstallGuide: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onOpenInstallGuide,
  onNotify,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const ok = await StorageService.syncAllFromCloud(currentUser.storeId);
      if (ok) {
        onNotify('Data berhasil disinkronkan dari Cloud Firestore.', 'success');
      } else {
        onNotify('Koneksi sinkronisasi lokal aktif.', 'info');
      }
    } catch {
      onNotify('Gagal menyinkronkan data cloud.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Clean module page titles without stage numbers
  const getPageTitle = (view: ViewState): string => {
    switch (view) {
      case 'dashboard': return 'Beranda Utama';
      case 'role_management': return 'Manajemen Pegawai & Role';
      case 'steam_sortir': return 'Sortir, QC & Finishing';
      case 'modal_stok': return 'Modal & Stok Fashion (HPP)';
      case 'admin_shopee': return 'Biaya Admin Marketplace & Layanan';
      case 'kehadiran': return 'Presensi & Kehadiran Shift';
      case 'penjualan': return 'Data Penjualan (Live & Non-Live)';
      case 'statistik': return 'Statistik & Analisis Penjualan';
      case 'return': return 'Data Retur / Paket Return';
      case 'iklan_koin': return 'Saldo Biaya Iklan & Koin Live';
      case 'gaji': return 'Slip Gaji & Insentif';
      case 'laba_rugi': return 'Laporan Laba & Rugi Sesi';
      case 'cashflow': return 'Cashflow & Arus Kas';
      case 'laba_bersih': return 'Laporan Laba Bersih Toko';
      case 'index_performa': return 'Indeks Performa & Efektivitas AI';
      default: return 'Seller Profit';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#161823]/95 backdrop-blur-md border-b border-white/10 shadow-lg text-white">
        {/* Main navigation header (Clean, no cluttered top text) */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' ? (
              <button
                id="btn-back-to-dashboard"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
                <span>Kembali ke Menu</span>
              </button>
            ) : (
              <AppLogo size="sm" showText={true} />
            )}

            {currentView !== 'dashboard' && (
              <div className="hidden md:block">
                <h2 className="text-sm font-black text-white">
                  {getPageTitle(currentView)}
                </h2>
              </div>
            )}
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {currentUser.roles.map(r => (
                    <span
                      key={r}
                      className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/10"
                    >
                      {roleLabels[r] || r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Update App Button */}
              <button
                id="btn-update-app"
                onClick={() => setShowUpdateModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#25F4EE]/15 to-emerald-500/15 text-[#25F4EE] hover:bg-[#25F4EE]/25 border border-[#25F4EE]/40 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                title="Pembaruan Aplikasi (Update Instan Tanpa Uninstall)"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span className="text-xs font-black text-[#25F4EE]">Update</span>
              </button>

              {/* Owner Settings / Gear Icon for Password Change */}
              {currentUser.isOwner && (
                <button
                  id="btn-owner-settings"
                  onClick={() => setShowPasswordModal(true)}
                  className="p-2 rounded-xl text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                  title="Pengaturan & Ganti Password Toko"
                >
                  <Settings className="w-4 h-4 text-[#25F4EE]" />
                </button>
              )}

              {/* Logout Button */}
              <button
                id="btn-user-logout"
                onClick={onLogout}
                className="p-2 rounded-xl text-zinc-400 hover:text-[#FE2C55] bg-white/5 hover:bg-[#FE2C55]/10 border border-white/10 transition cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
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

