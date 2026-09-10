import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, StoreAccount } from '../types';
import { 
  ShoppingBag, 
  Lock, 
  User, 
  Store, 
  ArrowRight, 
  Smartphone, 
  MessageCircle,
  List,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { DeveloperStoreListModal } from '../components/DeveloperStoreListModal';
import { UpdateAppModal } from '../components/UpdateAppModal';
import { AppHeroSection } from '../components/AppHeroSection';
import { AppEducationSection } from '../components/AppEducationSection';
import { SoundFx } from '../services/soundFx';

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void;
  onOpenInstallGuide: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenInstallGuide, onNotify }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeveloperStoreList, setShowDeveloperStoreList] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Login form state
  const [storeNameOrId, setStoreNameOrId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // WhatsApp Help URL
  const waHelpUrl = `https://wa.me/62895621670403?text=${encodeURIComponent(
    'Halo Developer, saya lupa password akun toko saya di aplikasi Seller Profit. Mohon bantuan informasi password akun saya.'
  )}`;

  // Auto sync cloud data on load
  const doCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      await StorageService.syncStoresAndEmployeesFromCloud();
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    doCloudSync();
    const unsub = StorageService.startRealtimeSync();
    return () => {
      unsub();
    };
  }, []);

  // Open holographic login modal with sound effect
  const handleOpenLogin = () => {
    SoundFx.playHologramOpen();
    setShowLoginModal(true);
  };

  // Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Attempt 1: Check with local cache
    let stores = StorageService.getStores();
    
    let targetStore: StoreAccount | undefined;
    if (storeNameOrId.trim()) {
      targetStore = stores.find(
        s => s.storeName.toLowerCase().includes(storeNameOrId.toLowerCase()) || s.id === storeNameOrId
      );
    } else {
      targetStore = stores[0];
    }

    let employees = targetStore ? StorageService.getEmployees(targetStore.id) : [];
    let emp = employees.find(e => e.username.toLowerCase() === username.toLowerCase());
    let isOwnerMatch = targetStore && (
      username.toLowerCase() === targetStore.ownerUsername.toLowerCase() && 
      password === (targetStore.ownerPassword || '123')
    );

    // If not found, try sync from cloud immediately
    if (!targetStore || (!emp && !isOwnerMatch)) {
      setIsCloudSyncing(true);
      await StorageService.syncStoresAndEmployeesFromCloud();
      setIsCloudSyncing(false);

      stores = StorageService.getStores();
      if (storeNameOrId.trim()) {
        targetStore = stores.find(
          s => s.storeName.toLowerCase().includes(storeNameOrId.toLowerCase()) || s.id === storeNameOrId
        );
      } else {
        targetStore = stores[0];
      }

      if (targetStore) {
        employees = StorageService.getEmployees(targetStore.id);
        emp = employees.find(e => e.username.toLowerCase() === username.toLowerCase());
        isOwnerMatch = (
          username.toLowerCase() === targetStore.ownerUsername.toLowerCase() && 
          password === (targetStore.ownerPassword || '123')
        );
      }
    }

    if (!targetStore) {
      setErrorMsg(storeNameOrId ? `Toko "${storeNameOrId}" tidak ditemukan.` : 'Belum ada data toko terdaftar di Cloud.');
      return;
    }

    // Check if logging in as Owner
    if (isOwnerMatch || (username.toLowerCase() === targetStore.ownerUsername.toLowerCase() && password === (targetStore.ownerPassword || '123'))) {
      const user: CurrentUser = {
        id: 'owner-' + targetStore.id,
        storeId: targetStore.id,
        storeName: targetStore.storeName,
        name: 'Owner ' + targetStore.storeName,
        username: targetStore.ownerUsername,
        isOwner: true,
        roles: ['owner'],
      };
      StorageService.setCurrentUser(user);
      setShowLoginModal(false);
      onLoginSuccess(user);
      return;
    }

    // Check if logging in as Employee
    if (emp) {
      if (emp.password && emp.password !== password) {
        setErrorMsg('Password akun pegawai salah.');
        return;
      }
      const user: CurrentUser = {
        id: emp.id,
        storeId: targetStore.id,
        storeName: targetStore.storeName,
        name: emp.name,
        username: emp.username,
        isOwner: emp.roles.includes('owner'),
        roles: emp.roles,
        employeeProfile: emp,
      };
      StorageService.setCurrentUser(user);
      setShowLoginModal(false);
      onLoginSuccess(user);
      return;
    }

    setErrorMsg('Username atau Password tidak cocok untuk toko tersebut. Pastikan username sudah benar.');
  };

  return (
    <div className="relative min-h-screen bg-[#07080b] text-[#f4f4f6] flex flex-col justify-between overflow-x-hidden font-sans">
      {/* ==================================================================== */}
      {/* 1. BERANDA SEBELUM LOGIN: HEADER & HERO SECTION SELLER PROFIT        */}
      {/* ==================================================================== */}
      <AppHeroSection onOpenLoginModal={handleOpenLogin} />

      {/* ==================================================================== */}
      {/* EDUKASI TENTANG APLIKASI: KEUNTUNGAN & KELEBIHAN BISNIS RITEL         */}
      {/* ==================================================================== */}
      <AppEducationSection onOpenLoginModal={handleOpenLogin} />

      {/* ==================================================================== */}
      {/* 2. HOLOGRAPHIC LOGIN POPUP MODAL                                     */}
      {/* ==================================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="holographic-modal relative w-full max-w-md p-6 sm:p-7 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
            {/* Holographic sci-fi reticles */}
            <div className="hologram-corner-tl" />
            <div className="hologram-corner-tr" />
            <div className="hologram-corner-bl" />
            <div className="hologram-corner-br" />

            {/* Top HUD Telemetry Tag */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#25F4EE] opacity-80 border-b border-white/10 pb-2 mb-4">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#25F4EE]" />
                HOLOGRAPHIC AUTHENTICATION GATE
              </span>
              <span className="text-zinc-500">SYS.ONLINE</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-login-modal"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer z-10"
              title="Tutup Modal Login"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Brand Header Inside Modal */}
            <div className="text-center mb-5">
              <div className="flex justify-center mb-2.5">
                <div className="relative w-14 h-14 rounded-2xl bg-[#161823] border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,244,238,0.3)]">
                  <ShoppingBag className="w-7 h-7 text-[#25F4EE] drop-shadow-[0_0_8px_#25F4EE]" />
                </div>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">
                Seller Profit
              </h3>
              <p className="text-xs font-medium text-zinc-400">
                Sistem Akuntansi Penjualan Live Marketplace &amp; Laba Bersih
              </p>

              {/* Cloud Sync Status Indicator */}
              <div className="mt-2.5 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 border border-white/10 text-zinc-300">
                  <span className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span>{isCloudSyncing ? 'Menyinkronkan Cloud...' : 'Cloud Firestore Terhubung'}</span>
                </span>
                <button
                  type="button"
                  onClick={doCloudSync}
                  disabled={isCloudSyncing}
                  className="p-1 text-zinc-400 hover:text-[#25F4EE] transition"
                  title="Refresh data dari Cloud Firestore"
                >
                  <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-[#FE2C55]/15 border border-[#FE2C55]/40 text-[#FE2C55] text-xs font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FE2C55] shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nama Toko (Opsional / Kosongkan untuk Toko Utama)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-store"
                    type="text"
                    value={storeNameOrId}
                    onChange={e => setStoreNameOrId(e.target.value)}
                    placeholder="Contoh: Fashion Thrift Official"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Username <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username Akun Anda (Contoh: siti_host / owner)"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Password <span className="text-[#FE2C55]">*</span>
                  </label>
                  {/* Lupa Password WhatsApp Link */}
                  <a
                    href={waHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#25F4EE] hover:text-[#25F4EE]/80 flex items-center gap-1 transition"
                    title="Hubungi Developer via WhatsApp untuk Bantuan Password"
                  >
                    <MessageCircle className="w-3 h-3 text-[#25F4EE]" />
                    <span>Lupa Password?</span>
                  </a>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password Anda"
                    className="block w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={isCloudSyncing}
                  className="spatial-button w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-black bg-[#25F4EE] hover:bg-[#25F4EE]/90 border border-[#25F4EE]/50 shadow-lg shadow-[#25F4EE]/20 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                >
                  <span>{isCloudSyncing ? 'Memeriksa Cloud...' : 'Masuk ke Aplikasi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* List Toko Terdaftar untuk Developer */}
                <button
                  id="btn-developer-store-list"
                  type="button"
                  onClick={() => setShowDeveloperStoreList(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer"
                >
                  <List className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span>List Toko Terdaftar (Developer)</span>
                </button>
              </div>
            </form>

            {/* Modal Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-center">
              <button
                type="button"
                onClick={onOpenInstallGuide}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span>Install di HP</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#25F4EE] hover:text-[#25F4EE]/80 transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-[#25F4EE]" />
                <span>Update Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Store List Modal */}
      <DeveloperStoreListModal
        isOpen={showDeveloperStoreList}
        onClose={() => setShowDeveloperStoreList(false)}
        onSelectStoreToLogin={(storeName) => {
          setStoreNameOrId(storeName);
        }}
      />

      {/* Update App Modal */}
      <UpdateAppModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onNotify={onNotify}
      />
    </div>
  );
};
