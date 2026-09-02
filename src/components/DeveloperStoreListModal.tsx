import React, { useState } from 'react';
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
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';

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
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Editing state
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editOwnerUsername, setEditOwnerUsername] = useState('');
  const [editOwnerPassword, setEditOwnerPassword] = useState('');

  // Add new store state
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerUsername, setNewOwnerUsername] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');

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

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (store: StoreAccount) => {
    setEditingStoreId(store.id);
    setEditStoreName(store.storeName);
    setEditOwnerUsername(store.ownerUsername);
    setEditOwnerPassword(store.ownerPassword || '123');
  };

  const handleSaveEdit = (storeId: string) => {
    const existing = stores.find(s => s.id === storeId);
    if (!existing) return;

    const updated: StoreAccount = {
      ...existing,
      storeName: editStoreName.trim() || existing.storeName,
      ownerUsername: editOwnerUsername.trim() || existing.ownerUsername,
      ownerPassword: editOwnerPassword.trim() || existing.ownerPassword,
    };

    StorageService.updateStore(updated);
    setEditingStoreId(null);
  };

  const handleDeleteStore = (storeId: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus toko "${name}" beserta datanya?`)) {
      StorageService.deleteStore(storeId);
    }
  };

  const handleCreateNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newOwnerUsername || !newOwnerPassword) {
      setErrorMsg('Harap lengkapi semua data toko baru.');
      return;
    }

    const newId = 'store-' + Date.now();
    const newStore: StoreAccount = {
      id: newId,
      storeName: newStoreName,
      ownerUsername: newOwnerUsername,
      ownerPassword: newOwnerPassword,
      createdAt: new Date().toISOString(),
      settings: {
        adminPromoName: 'Shopee Live Cashback 8.5%',
        adminPromoPercentage: 8.5,
        serviceFeePerOrder: 1250,
        returnMechanism: 'detail',
        estimateReturnPercentage: 3.0,
      }
    };

    StorageService.saveStores([...stores, newStore]);
    setIsAddingStore(false);
    setNewStoreName('');
    setNewOwnerUsername('');
    setNewOwnerPassword('');
  };

  const filteredStores = stores.filter(s => 
    s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ownerUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#161823] border border-white/15 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] flex flex-col">
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
              <h3 className="text-base font-black text-white">Daftar Toko Terdaftar</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] text-[10px] font-bold">
                Khusus Developer
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kelola toko, periksa nama toko terdaftar, dan edit password akun
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
                Masukkan Master Password Developer untuk membuka daftar dan edit password toko.
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-3 pt-2">
              <input
                type="password"
                required
                value={devInputPassword}
                onChange={e => setDevInputPassword(e.target.value)}
                placeholder="Masukkan Password Developer"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/15 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] text-center tracking-wider"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#25F4EE]/20 hover:bg-[#25F4EE]/30 border border-[#25F4EE]/50 text-[#25F4EE] shadow-md transition cursor-pointer"
              >
                Buka Kunci Developer
              </button>
            </form>
          </div>
        ) : (
          /* Store List Content */
          <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari toko atau username..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE]"
                />
              </div>

              <button
                onClick={() => setIsAddingStore(!isAddingStore)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingStore ? 'Tutup Form' : 'Tambah Toko Baru'}</span>
              </button>
            </div>

            {/* Form Tambah Toko Baru */}
            {isAddingStore && (
              <form onSubmit={handleCreateNewStore} className="p-4 rounded-2xl bg-[#0b0c10] border border-[#FE2C55]/30 space-y-3">
                <h5 className="text-xs font-bold text-[#FE2C55] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Daftarkan Toko Baru (Developer)</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nama Toko"
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg bg-[#161823] border border-white/10 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Username Owner"
                    value={newOwnerUsername}
                    onChange={e => setNewOwnerUsername(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg bg-[#161823] border border-white/10 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Password Owner"
                    value={newOwnerPassword}
                    onChange={e => setNewOwnerPassword(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg bg-[#161823] border border-white/10 text-white"
                  />
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

            {/* List Stores Table / Cards */}
            <div className="space-y-2.5">
              {filteredStores.map(store => {
                const isEditing = editingStoreId === store.id;
                const isPassVisible = showPasswordMap[store.id];

                return (
                  <div
                    key={store.id}
                    className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/10 hover:border-white/20 transition space-y-3"
                  >
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Password Owner</label>
                            <input
                              type="text"
                              value={editOwnerPassword}
                              onChange={e => setEditOwnerPassword(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#161823] border border-white/15 text-white text-[#25F4EE] font-mono"
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
                            <span>Simpan Kredensial</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-white">
                              {store.storeName}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-white/5">
                              ID: {store.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#25F4EE]" />
                              <span>Username: <strong className="text-zinc-200">{store.ownerUsername}</strong></span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-[#FE2C55]" />
                              <span>Password: </span>
                              <span className="font-mono font-bold text-[#25F4EE]">
                                {isPassVisible ? (store.ownerPassword || '123') : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPassword(store.id)}
                                className="text-zinc-500 hover:text-zinc-300 p-0.5"
                                title={isPassVisible ? 'Sembunyikan' : 'Lihat'}
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
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

                          <button
                            type="button"
                            onClick={() => handleStartEdit(store)}
                            className="p-1.5 rounded-lg bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                            title="Edit Password & Kredensial"
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
      </div>
    </div>
  );
};
