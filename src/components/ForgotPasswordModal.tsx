import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { StoreAccount } from '../types';
import { 
  KeyRound, 
  Store, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessReset: (storeName: string, username: string, newPass: string) => void;
  onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessReset,
  onNotify,
}) => {
  const [storeNameInput, setStoreNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isVerified, setIsVerified] = useState(false);
  const [matchedStore, setMatchedStore] = useState<StoreAccount | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanStore = storeNameInput.trim().toLowerCase();
    const cleanUser = usernameInput.trim().toLowerCase();

    if (!cleanStore || !cleanUser) {
      setErrorMessage('Nama Toko dan Username Owner wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    // Sinkronisasi data cloud terbaru untuk memastikan toko yang baru terdaftar tersedia
    await StorageService.syncStoresAndEmployeesFromCloud();
    setIsSubmitting(false);

    const stores = StorageService.getStores();
    const found = stores.find(s => {
      const matchStore = s.storeName.trim().toLowerCase() === cleanStore || s.id.toLowerCase() === cleanStore;
      const matchUser = s.ownerUsername.trim().toLowerCase() === cleanUser;
      return matchStore && matchUser;
    });

    if (found) {
      SoundFx.playSuccessSound();
      setMatchedStore(found);
      setIsVerified(true);
      setErrorMessage('');
    } else {
      SoundFx.playRobotErrorSound();
      setErrorMessage('Kombinasi Nama Toko dan Username Owner tidak ditemukan. Pastikan ejaan sesuai saat mendaftar.');
    }
  };

  const handleApplyNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedStore) return;

    if (newPassword.length < 3) {
      setErrorMessage('Password baru minimal 3 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      const updatedStore: StoreAccount = {
        ...matchedStore,
        ownerPassword: newPassword,
        isPasswordChangedByOwner: true,
        passwordLastChangedAt: new Date().toISOString(),
      };

      StorageService.updateStore(updatedStore);
      SoundFx.playSuccessSound();
      onNotify?.('Password baru berhasil dibuat! Password Anda kini dirahasiakan dan tidak dapat dilihat oleh developer.', 'success');
      onSuccessReset(matchedStore.storeName, matchedStore.ownerUsername, newPassword);
      handleClose();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan password baru: ' + (err?.message || 'Terjadi kesalahan sistem.'));
    }
  };

  const handleClose = () => {
    setStoreNameInput('');
    setUsernameInput('');
    setNewPassword('');
    setConfirmPassword('');
    setIsVerified(false);
    setMatchedStore(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="holographic-modal relative w-full max-w-md p-6 sm:p-7 shadow-2xl text-white font-sans">
        {/* Hologram Corner Reticles */}
        <div className="hologram-corner-tl" />
        <div className="hologram-corner-tr" />
        <div className="hologram-corner-bl" />
        <div className="hologram-corner-br" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] shadow-inner">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Lupa Password Toko</span>
              <span className="px-2 py-0.5 rounded-full bg-[#25F4EE]/10 border border-[#25F4EE]/30 text-[#25F4EE] text-[10px] font-bold">
                Pemulihan Mandiri
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
              Buat password baru asalkan Anda mengingat Nama Toko dan Username
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isVerified ? (
          /* TAHAP 1: VERIFIKASI NAMA TOKO & USERNAME */
          <form onSubmit={handleVerifyAccount} className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#25F4EE]" />
                <span>Verifikasi Kepemilikan Toko</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Demi keamanan data, masukkan Nama Toko dan Username Owner yang terdaftar. Developer tidak dapat melihat password Anda, sehingga pembuatan password baru diverifikasi melalui data toko Anda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nama Toko <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  id="input-forgot-store-name"
                  type="text"
                  required
                  value={storeNameInput}
                  onChange={e => setStoreNameInput(e.target.value)}
                  placeholder="Contoh: Fashion Thrift Official"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Username Owner <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-forgot-username"
                  type="text"
                  required
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="Contoh: owner / nama_owner"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-verify-forgot-account"
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-black bg-[#25F4EE] hover:bg-[#25F4EE]/90 shadow-md shadow-[#25F4EE]/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Memeriksa Data...' : 'Verifikasi Akun'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* TAHAP 2: BUAT PASSWORD BARU */
          <form onSubmit={handleApplyNewPassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Akun Terverifikasi!</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Toko: <strong>{matchedStore?.storeName}</strong> • Username: <strong>{matchedStore?.ownerUsername}</strong>
              </p>
              <p className="text-[10px] text-zinc-400 pt-0.5">
                Silakan buat password baru di bawah ini. Password ini akan dirahasiakan dan tidak akan dapat dilihat oleh developer.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Password Baru <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-new-password-reset"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 3 karakter"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Ulangi Password Baru <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-confirm-password-reset"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsVerified(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                Ganti Akun
              </button>

              <button
                id="btn-submit-new-password"
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-md shadow-[#FE2C55]/20 active:scale-95 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Terapkan Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
