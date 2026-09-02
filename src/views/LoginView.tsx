import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, StoreAccount, UserRole } from '../types';
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
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { DeveloperStoreListModal } from '../components/DeveloperStoreListModal';

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void;
  onOpenInstallGuide: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenInstallGuide }) => {
  const [showDeveloperStoreList, setShowDeveloperStoreList] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);

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
      setCloudSynced(true);
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

  // Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Attempt 1: Check with local cache
    let stores = StorageService.getStores();
    
    // If stores empty or username not found, trigger online refresh
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
      onLoginSuccess(user);
      return;
    }

    setErrorMsg('Username atau Password tidak cocok untuk toko tersebut. Pastikan username sudah benar.');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f4f4f6] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* TikTok Ambient Neon Background */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <div className="relative w-16 h-16 rounded-2xl bg-[#161823] border border-white/15 flex items-center justify-center text-white shadow-2xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] opacity-30 blur-xs" />
            <ShoppingBag className="relative z-10 w-8 h-8 text-[#25F4EE] drop-shadow-[0_0_8px_#25F4EE]" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Seller Profit
        </h2>
        <p className="mt-1 text-xs font-medium text-zinc-400">
          Sistem Akuntansi Penjualan Live Marketplace &amp; Laba Bersih
        </p>

        {/* Cloud Sync Status Indicator */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#161823] border border-white/10 text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{isCloudSyncing ? 'Menyinkronkan Cloud...' : 'Cloud Online Realtime Terhubung'}</span>
          </span>
          <button
            type="button"
            onClick={doCloudSync}
            disabled={isCloudSyncing}
            className="p-1 text-zinc-400 hover:text-[#25F4EE] transition"
            title="Refresh data dari Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#161823] backdrop-blur-md py-7 px-6 sm:px-8 shadow-2xl rounded-3xl border border-white/10">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] text-xs font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FE2C55] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="border-b border-white/10 pb-3 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#25F4EE]" />
                <span>Masuk Akun Toko / Pegawai</span>
              </h3>
            </div>

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
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
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
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
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
                  className="block w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
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

            <div className="pt-2 space-y-2.5">
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isCloudSyncing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-black bg-[#25F4EE] hover:bg-[#25F4EE]/90 border border-[#25F4EE]/50 shadow-lg shadow-[#25F4EE]/20 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
              >
                <span>{isCloudSyncing ? 'Memeriksa Cloud...' : 'Masuk ke Aplikasi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1">
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
            </div>
          </form>
        </div>

        {/* Install app guide footer button */}
        <div className="mt-5 text-center">
          <button
            onClick={onOpenInstallGuide}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#161823] px-4 py-2 rounded-full border border-white/10 hover:border-white/20 transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#25F4EE]" />
            <span>Cara Install Aplikasi di HP (PWA iOS &amp; Android)</span>
          </button>
        </div>
      </div>

      {/* Developer Store List Modal */}
      <DeveloperStoreListModal
        isOpen={showDeveloperStoreList}
        onClose={() => setShowDeveloperStoreList(false)}
        onSelectStoreToLogin={(storeName) => {
          setStoreNameOrId(storeName);
        }}
      />
    </div>
  );
};
