import React, { useState } from 'react';
import { CurrentUser, ViewState } from '../types';
import { StorageService } from '../services/storage';
import { formatNumber, roleLabels } from '../utils/formatters';
import { 
  ArrowLeft, 
  ShoppingBag, 
  LogOut, 
  Coins, 
  Package, 
  Megaphone,
  Smartphone,
  Settings,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const stockInfo = StorageService.calculateStock(currentUser.storeId);
  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);

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
      case 'steam_sortir': return 'Sortir & Steam Ball';
      case 'modal_stok': return 'Modal & Stok Ball (HPP)';
      case 'admin_shopee': return 'Biaya Admin Shopee & Layanan';
      case 'kehadiran': return 'Presensi & Kehadiran Shift';
      case 'penjualan': return 'Data Penjualan Host Live';
      case 'return': return 'Data Retur / Paket Return';
      case 'iklan_koin': return 'Saldo Biaya Iklan & Koin';
      case 'gaji': return 'Slip Gaji & Insentif';
      case 'laba_rugi': return 'Laporan Laba & Rugi Live';
      case 'cashflow': return 'Cashflow & Arus Kas';
      case 'laba_bersih': return 'Laporan Laba Bersih Toko';
      case 'index_performa': return 'Indeks Performa Tim';
      default: return 'Seller Profit';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#161823]/95 backdrop-blur-md border-b border-white/10 shadow-lg text-white">
        {/* Top micro bar for store context and quick stock/ad balances */}
        <div className="bg-[#0b0c10] border-b border-white/5 px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-flex items-center gap-1.5 bg-[#161823] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-white/10">
                <ShoppingBag className="w-3 h-3 text-[#25F4EE]" />
                <span>{currentUser.storeName}</span>
              </span>

              {/* Realtime Cloud Online status badge */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
                title="Status database online Firestore terhubung di semua HP. Klik untuk paksa refresh."
              >
                <Cloud className={`w-3 h-3 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Online Sync</span>
                <RefreshCw className={`w-2.5 h-2.5 ml-0.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
              <div className="flex items-center gap-1 bg-[#161823] border border-white/10 px-2 py-0.5 rounded-lg" title="Sisa Stok Barang (Total Masuk - Terjual)">
                <Package className="w-3 h-3 text-[#25F4EE]" />
                <span className="hidden xs:inline text-zinc-400">Stok:</span>
                <strong className={`font-bold ${stockInfo.remainingStock < 50 ? 'text-[#FE2C55]' : 'text-white'}`}>
                  {formatNumber(stockInfo.remainingStock)} pcs
                </strong>
              </div>

              <div className="flex items-center gap-1 bg-[#161823] border border-white/10 px-2 py-0.5 rounded-lg" title="Sisa Saldo Iklan Shopee">
                <Megaphone className="w-3 h-3 text-[#25F4EE]" />
                <span className="hidden xs:inline text-zinc-400">Iklan:</span>
                <strong className={`font-bold ${adsCoinInfo.remainingAds <= 0 ? 'text-[#FE2C55]' : 'text-white'}`}>
                  Rp {formatNumber(adsCoinInfo.remainingAds)}
                </strong>
              </div>

              <div className="flex items-center gap-1 bg-[#161823] border border-white/10 px-2 py-0.5 rounded-lg" title="Sisa Saldo Koin Shopee">
                <Coins className="w-3 h-3 text-amber-400" />
                <span className="hidden xs:inline text-zinc-400">Koin:</span>
                <strong className={`font-bold ${adsCoinInfo.remainingCoin <= 0 ? 'text-[#FE2C55]' : 'text-white'}`}>
                  Rp {formatNumber(adsCoinInfo.remainingCoin)}
                </strong>
              </div>

              {/* Install Guide Button */}
              <button
                id="btn-install-guide-navbar"
                onClick={onOpenInstallGuide}
                className="inline-flex items-center gap-1 bg-[#25F4EE]/15 hover:bg-[#25F4EE]/25 text-[#25F4EE] border border-[#25F4EE]/40 font-bold px-2.5 py-0.5 rounded-lg transition cursor-pointer active:scale-95 shadow-xs"
                title="Petunjuk Install Aplikasi di HP"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px]">Install HP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main navigation header */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' ? (
              <button
                id="btn-back-to-dashboard"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
                <span>Kembali ke Menu</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-white shadow-xs">
                  <ShoppingBag className="w-5 h-5 text-[#25F4EE]" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight flex items-center gap-1.5">
                    <span>Seller Profit</span>
                  </h1>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Sistem Akuntansi &amp; Live Shop
                  </p>
                </div>
              </div>
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
    </>
  );
};
