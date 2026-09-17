import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { StoreAccount } from '../types';
import { 
  ShieldCheck, 
  KeyRound, 
  X, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  Plus, 
  Store, 
  User, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shuffle,
  Info
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from './ConfirmModal';
import { SoundFx } from '../services/soundFx';

interface DeveloperStoreListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStoreToLogin?: (storeName: string) => void;
}

const DEVELOPER_PASSCODE = 'Qwertypoiuy1';

export const DeveloperStoreListModal: React.FC<DeveloperStoreListModalProps> = ({
  isOpen,
  onClose,
  onSelectStoreToLogin,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [devInputPassword, setDevInputPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: ConfirmActionType;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'save',
    onConfirm: () => {},
  });

  // Editing state (Hanya Nama Toko & Username Owner, TANPA melihat/edit password langsung)
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editOwnerUsername, setEditOwnerUsername] = useState('');

  // Add new store state
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerUsername, setNewOwnerUsername] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('123');

  // Modal Khusus: Buatkan Password Baru jika Owner Lupa Password
  const [resetModalStore, setResetModalStore] = useState<StoreAccount | null>(null);
  const [verifyStoreName, setVerifyStoreName] = useState('');
  const [verifyUsername, setVerifyUsername] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetMsg, setResetMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      SoundFx.playHologramOpen();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stores = StorageService.getStores();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (devInputPassword === DEVELOPER_PASSCODE) {
      setIsUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Password Developer salah.');
    }
  };

  const handleStartEdit = (store: StoreAccount) => {
    setEditingStoreId(store.id);
    setEditStoreName(store.storeName);
    setEditOwnerUsername(store.ownerUsername);
  };

  const handleSaveEdit = (storeId: string) => {
    const existing = stores.find(s => s.id === storeId);
    if (!existing) return;

    if (editStoreName.trim() && StorageService.isStoreNameTaken(editStoreName.trim(), storeId)) {
      setErrorMsg(`Nama toko "${editStoreName.trim()}" sudah digunakan, silakan gunakan nama lain.`);
      return;
    }

    if (editOwnerUsername.trim() && StorageService.isUsernameTaken(editOwnerUsername.trim(), undefined, storeId)) {
      setErrorMsg(`Username "${editOwnerUsername.trim()}" sudah digunakan, silakan gunakan username lain.`);
      return;
    }

    const updated: StoreAccount = {
      ...existing,
      storeName: editStoreName.trim() || existing.storeName,
      ownerUsername: editOwnerUsername.trim() || existing.ownerUsername,
    };

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Simpan Perubahan Toko',
      message: `Apakah Anda yakin ingin menyimpan perubahan nama/username toko "${updated.storeName}"?`,
      type: 'edit',
      confirmText: 'Ya, Simpan Perubahan',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.updateStore(updated);
        setEditingStoreId(null);
        setErrorMsg('');
      },
    });
  };

  const handleDeleteStore = (storeId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Toko',
      message: `Yakin ingin menghapus toko "${name}" beserta datanya? Tindakan ini permanen.`,
      type: 'delete',
      confirmText: 'Ya, Hapus Toko',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteStore(storeId);
      },
    });
  };

  const handleCreateNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newOwnerUsername || !newOwnerPassword) {
      setErrorMsg('Harap lengkapi nama toko, username, dan password awal.');
      return;
    }

    if (StorageService.isStoreNameTaken(newStoreName)) {
      setErrorMsg(`Nama toko "${newStoreName}" sudah digunakan, silakan gunakan nama lain.`);
      return;
    }

    if (StorageService.isUsernameTaken(newOwnerUsername)) {
      setErrorMsg(`Username "${newOwnerUsername}" sudah digunakan, silakan gunakan username lain.`);
      return;
    }

    const newId = 'store-' + Date.now();
    const newStore: StoreAccount = {
      id: newId,
      storeName: newStoreName,
      ownerUsername: newOwnerUsername,
      ownerPassword: newOwnerPassword,
      isPasswordChangedByOwner: false,
      createdAt: new Date().toISOString(),
      settings: {
        adminPromoName: 'Marketplace Live Cashback 8.5%',
        adminPromoPercentage: 8.5,
        serviceFeePerOrder: 1250,
        returnMechanism: 'detail',
        estimateReturnPercentage: 3.0,
      }
    };

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Daftarkan Toko Baru',
      message: `Daftarkan toko "${newStoreName}" dengan owner @${newOwnerUsername}? Password awal yang dibuatkan adalah "${newOwnerPassword}". Begitu owner mengganti password, developer tidak dapat melihat password tersebut.`,
      type: 'create',
      confirmText: 'Ya, Daftarkan Toko',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.saveStores([...stores, newStore]);
        setIsAddingStore(false);
        setNewStoreName('');
        setNewOwnerUsername('');
        setNewOwnerPassword('123');
        setErrorMsg('');
      },
    });
  };

  // Generate Acak Password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetNewPass(res);
  };

  // Eksekusi Buatkan Password Baru untuk Owner
  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStore) return;
    setResetMsg(null);

    const cleanStore = verifyStoreName.trim().toLowerCase();
    const cleanUser = verifyUsername.trim().toLowerCase();

    if (cleanStore !== resetModalStore.storeName.trim().toLowerCase()) {
      setResetMsg({ type: 'error', text: 'Nama Toko yang dimasukkan tidak cocok dengan toko yang dipilih.' });
      return;
    }

    if (cleanUser !== resetModalStore.ownerUsername.trim().toLowerCase()) {
      setResetMsg({ type: 'error', text: 'Username Owner yang dimasukkan tidak cocok dengan data akun.' });
      return;
    }

    if (resetNewPass.trim().length < 3) {
      setResetMsg({ type: 'error', text: 'Password baru minimal 3 karakter.' });
      return;
    }

    const updated: StoreAccount = {
      ...resetModalStore,
      ownerPassword: resetNewPass.trim(),
      isPasswordChangedByOwner: false, // Reset oleh developer
      passwordLastChangedAt: new Date().toISOString(),
    };

    StorageService.updateStore(updated);
    SoundFx.playSuccessSound();
    setResetMsg({
      type: 'success',
      text: `Password baru "${resetNewPass.trim()}" berhasil dibuatkan untuk toko "${resetModalStore.storeName}". Silakan berikan password ini kepada owner. Ketika owner login dan mengganti password mereka sendiri, developer tidak akan dapat melihatnya lagi.`
    });
  };

  const filteredStores = stores.filter(s => 
    s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ownerUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
      <div className="holographic-modal relative w-full max-w-2xl p-6 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Hologram Corner Reticles */}
        <div className="hologram-corner-tl" />
        <div className="hologram-corner-tr" />
        <div className="hologram-corner-bl" />
        <div className="hologram-corner-br" />

        {/* Close */}
        <button
          onClick={() => {
            setIsUnlocked(false);
            setDevInputPassword('');
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Daftar Toko &amp; Username Terdaftar</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] text-[10px] font-bold">
                Khusus Developer
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Menu developer hanya untuk melihat nama toko dan username. Password owner dirahasiakan setelah diganti.
            </p>
          </div>
        </div>

        {!isUnlocked ? (
          /* Developer Passcode Gate */
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#121216] border border-white/10 flex items-center justify-center text-[#25F4EE]">
              <KeyRound className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Akses Pengembang (Developer Gate)</h4>
              <p className="text-xs text-zinc-400 max-w-sm">
                Masukkan Master Password Developer untuk melihat nama toko dan username yang terdaftar.
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-[#FE2C55] font-semibold">{errorMsg}</p>
            )}

            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                value={devInputPassword}
                onChange={e => setDevInputPassword(e.target.value)}
                placeholder="Masukkan Master Password..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:outline-hidden text-center"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black bg-[#25F4EE] hover:bg-[#25F4EE]/90 transition cursor-pointer"
              >
                Buka Data Toko
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Content */
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Privacy Notification Banner */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-white">Privasi Password Owner Aktif:</span> Developer tidak dapat melihat password toko setelah owner mengganti password. Jika owner lupa password, gunakan tombol <strong>"Buatkan Password"</strong> asalkan Nama Toko dan Username sesuai.
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama toko / username..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddingStore(!isAddingStore)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-black bg-[#25F4EE] rounded-xl hover:bg-[#25F4EE]/90 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan Toko Baru</span>
              </button>
            </div>

            {/* Form Tambah Toko Baru */}
            {isAddingStore && (
              <form onSubmit={handleCreateNewStore} className="p-4 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 space-y-3">
                <h4 className="text-xs font-bold text-[#25F4EE] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>Daftarkan Akun Toko Baru</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Nama Toko *</label>
                    <input
                      type="text"
                      required
                      value={newStoreName}
                      onChange={e => setNewStoreName(e.target.value)}
                      placeholder="Contoh: Fashion Store"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#161823] border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Username Owner *</label>
                    <input
                      type="text"
                      required
                      value={newOwnerUsername}
                      onChange={e => setNewOwnerUsername(e.target.value)}
                      placeholder="Contoh: owner_fashion"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#161823] border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Password Awal *</label>
                    <input
                      type="text"
                      required
                      value={newOwnerPassword}
                      onChange={e => setNewOwnerPassword(e.target.value)}
                      placeholder="Contoh: 123"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#161823] border border-white/15 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingStore(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-[#FE2C55] rounded-lg text-white"
                  >
                    Simpan Toko
                  </button>
                </div>
              </form>
            )}

            {/* List Stores Cards (HANYA Nama Toko & Username) */}
            <div className="space-y-2.5">
              {filteredStores.map(store => {
                const isEditing = editingStoreId === store.id;

                return (
                  <div
                    key={store.id}
                    className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/10 hover:border-white/20 transition space-y-3"
                  >
                    {isEditing ? (
                      /* Edit Mode (Nama Toko & Username Owner) */
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Nama Toko</label>
                            <input
                              type="text"
                              value={editStoreName}
                              onChange={e => setEditStoreName(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#161823] border border-white/15 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Username Owner</label>
                            <input
                              type="text"
                              value={editOwnerUsername}
                              onChange={e => setEditOwnerUsername(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#161823] border border-white/15 text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setEditingStoreId(null)}
                            className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(store.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#25F4EE] text-black font-bold text-xs rounded-lg cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan Perubahan</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode: HANYA Nama Toko & Username Owner */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-white">
                              {store.storeName}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-white/5">
                              ID: {store.id}
                            </span>

                            {store.isPasswordChangedByOwner ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Password Privat Owner</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Lock className="w-3 h-3" />
                                <span>Password Terproteksi</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#25F4EE]" />
                              <span>Username Owner: <strong className="text-zinc-200">{store.ownerUsername}</strong></span>
                            </div>

                            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                              <Lock className="w-3 h-3 text-zinc-500" />
                              <span>Password: <span className="italic text-zinc-400 font-mono">•••••••• (Dirahasiakan)</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                          {onSelectStoreToLogin && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStoreToLogin(store.storeName);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
                            >
                              Gunakan
                            </button>
                          )}

                          {/* Tombol Buatkan Password Baru jika owner lupa password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalStore(store);
                              setVerifyStoreName('');
                              setVerifyUsername('');
                              setResetNewPass('');
                              setResetMsg(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                            title="Buatkan Password Baru untuk Owner yang Lupa Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Buatkan Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(store)}
                            className="p-1.5 rounded-lg bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                            title="Edit Nama Toko & Username"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {stores.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStore(store.id, store.storeName)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Hapus Toko"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredStores.length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-500">
                  Tidak ada toko yang sesuai pencarian.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-Modal: Buatkan Password Baru untuk Owner (Syarat: Nama Toko & Username Ingat) */}
        {resetModalStore && (
          <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md p-5 sm:p-6 rounded-2xl bg-[#161823] border border-amber-500/30 shadow-2xl text-white space-y-4">
              <button
                type="button"
                onClick={() => setResetModalStore(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Buatkan Password Baru untuk Owner</h4>
                  <p className="text-[11px] text-zinc-400">
                    Bantuan developer untuk owner yang lupa password
                  </p>
                </div>
              </div>

              {resetMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  resetMsg.type === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                }`}>
                  {resetMsg.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{resetMsg.text}</span>
                </div>
              )}

              {resetMsg?.type !== 'success' ? (
                <form onSubmit={handleExecuteResetPassword} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-zinc-300 space-y-1">
                    <p className="font-semibold text-white">Syarat Pembuatan Password Baru:</p>
                    <p className="text-zinc-400">
                      Owner harus mengingat Nama Toko dan Username. Developer memvalidasi kecocokan data yang dilaporkan owner sebelum membuatkan password baru.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Verifikasi Nama Toko yang Diingat Owner *
                    </label>
                    <input
                      type="text"
                      required
                      value={verifyStoreName}
                      onChange={e => setVerifyStoreName(e.target.value)}
                      placeholder={`Ketik nama toko (Contoh: ${resetModalStore.storeName})`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-amber-400"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Verifikasi Username yang Diingat Owner *
                    </label>
                    <input
                      type="text"
                      required
                      value={verifyUsername}
                      onChange={e => setVerifyUsername(e.target.value)}
                      placeholder={`Ketik username owner (Contoh: ${resetModalStore.ownerUsername})`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-300">
                        Password Baru yang Dibuatkan *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Acak Password Aman</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={resetNewPass}
                      onChange={e => setResetNewPass(e.target.value)}
                      placeholder="Masukkan password baru untuk owner (min. 3 karakter)"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-amber-400 font-mono font-bold focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResetModalStore(null)}
                      className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-xl cursor-pointer shadow-md"
                    >
                      Terapkan Password Baru
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setResetModalStore(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
