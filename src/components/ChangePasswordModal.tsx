import React, { useState } from 'react';
import { CurrentUser } from '../types';
import { StorageService } from '../services/storage';
import { Lock, X, CheckCircle2, KeyRound, Store, User, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNotify,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState(currentUser.storeName);
  const [username, setUsername] = useState(currentUser.username || 'owner');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentStore = StorageService.getStoreById(currentUser.storeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentStore) {
      setErrorMsg('Data toko tidak ditemukan.');
      return;
    }

    // Verify old password (unless guest mode)
    if (!currentUser.isGuest) {
      const actualOld = currentStore.ownerPassword || '123';
      if (oldPassword !== actualOld) {
        setErrorMsg('Password lama tidak sesuai.');
        return;
      }
    }

    if (newPassword.length < 3) {
      setErrorMsg('Password baru minimal 3 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    // Update store
    const updatedStore = {
      ...currentStore,
      storeName: storeName.trim() || currentStore.storeName,
      ownerUsername: username.trim() || currentStore.ownerUsername,
      ownerPassword: newPassword,
    };

    StorageService.updateStore(updatedStore);

    // Update session
    const updatedUser: CurrentUser = {
      ...currentUser,
      storeName: updatedStore.storeName,
      username: updatedStore.ownerUsername,
    };
    StorageService.setCurrentUser(updatedUser);

    onNotify('Password toko berhasil diubah! Gunakan password baru untuk login berikutnya.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#161823] border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FE2C55]/15 border border-[#FE2C55]/30 flex items-center justify-center text-[#FE2C55]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Pengaturan Akun Toko</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#25F4EE]/10 border border-[#25F4EE]/30 text-[#25F4EE] text-[10px] font-bold">
                Khusus Owner
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ubah password dan kredensial akses toko Anda
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nama Toko
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Store className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Username Owner
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
              />
            </div>
          </div>

          {!currentUser.isGuest && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Password Lama Saat Ini <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                  placeholder="Masukkan password saat ini"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Password Baru <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Password baru"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Ulangi Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Konfirmasi password"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-md shadow-[#FE2C55]/20 active:scale-95 transition cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
