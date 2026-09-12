import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, ChannelFeeConfig } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  Percent, 
  ShoppingCart, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Store, 
  HelpCircle,
  Calculator,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';

interface AdminShopeeViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminShopeeView: React.FC<AdminShopeeViewProps> = ({
  currentUser,
  onNotify,
}) => {
  const [channelFees, setChannelFees] = useState<ChannelFeeConfig[]>([]);
  const [defaultAdminPercentage, setDefaultAdminPercentage] = useState<number>(8.5);
  const [defaultServiceFee, setDefaultServiceFee] = useState<number>(1250);

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

  // New Channel Modal / Input
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelKey, setNewChannelKey] = useState('lainnya');
  const [newChannelAdmin, setNewChannelAdmin] = useState<number>(5.0);
  const [newChannelServiceFee, setNewChannelServiceFee] = useState<number>(1000);

  // Simulation calculator
  const [simOmzet, setSimOmzet] = useState<number>(150000);
  const [simPackages, setSimPackages] = useState<number>(1);

  useEffect(() => {
    const store = StorageService.getStoreById(currentUser.storeId);
    if (store?.settings) {
      setDefaultAdminPercentage(store.settings.adminPromoPercentage ?? 8.5);
      setDefaultServiceFee(store.settings.serviceFeePerOrder ?? 1250);
      const fees = StorageService.getChannelFees(currentUser.storeId);
      setChannelFees(fees);
    }
  }, [currentUser.storeId]);

  const handleUpdateChannel = (id: string, updates: Partial<ChannelFeeConfig>) => {
    setChannelFees(prev => prev.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      onNotify('Nama channel wajib diisi.', 'error');
      return;
    }

    const newCh: ChannelFeeConfig = {
      id: `ch-${Date.now()}`,
      channel: newChannelKey || 'lainnya',
      name: newChannelName.trim(),
      adminPercentage: newChannelAdmin,
      serviceFeePerOrder: newChannelServiceFee,
      isActive: true,
    };

    setChannelFees(prev => [...prev, newCh]);
    setNewChannelName('');
    setNewChannelAdmin(5.0);
    setNewChannelServiceFee(1000);
    setShowAddChannel(false);
    onNotify(`Channel "${newCh.name}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteChannel = (id: string, name: string) => {
    if (channelFees.length <= 1) {
      onNotify('Minimal harus ada satu channel tersisa.', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Channel',
      message: `Apakah Anda yakin ingin menghapus konfigurasi channel "${name}"?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Channel',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setChannelFees(prev => prev.filter(ch => ch.id !== id));
        onNotify(`Channel "${name}" dihapus.`, 'info');
      },
    });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Simpan Pengaturan Admin',
      message: 'Apakah Anda yakin ingin menyimpan perubahan pengaturan biaya admin dan layanan semua channel marketplace?',
      type: 'save',
      confirmText: 'Ya, Simpan Pengaturan',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          // Cari shopee atau fallback untuk default
          const shopeeCh = channelFees.find(c => c.channel === 'shopee' || c.name.toLowerCase().includes('shopee'));
          const adminPct = shopeeCh ? shopeeCh.adminPercentage : defaultAdminPercentage;
          const servFee = shopeeCh ? shopeeCh.serviceFeePerOrder : defaultServiceFee;

          StorageService.updateStoreSettings(currentUser.storeId, {
            adminPromoPercentage: adminPct,
            serviceFeePerOrder: servFee,
            channelFees: channelFees,
          });

          onNotify('Pengaturan seluruh channel marketplace & admin fee berhasil disimpan!', 'success');
        } catch (err: any) {
          console.error('Error saving channel fees:', err);
          onNotify('Gagal menyimpan pengaturan: ' + (err?.message || 'Terjadi gangguan sistem.'), 'error');
        }
      },
    });
  };

  const handleResetToDefaults = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Reset Channel ke Standar',
      message: 'Apakah Anda yakin ingin mengembalikan daftar channel ke konfigurasi preset standar?',
      type: 'delete',
      confirmText: 'Ya, Reset ke Standar',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const defaults = StorageService.getChannelFees('');
        setChannelFees(defaults);
        onNotify('Daftar channel dikembalikan ke preset standar (TikTok, Shopee, Offline, Tokopedia, dll).', 'info');
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header Banner */}
      <div className="bg-[#161823] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-bold border border-sky-500/20">
              <Store className="w-3.5 h-3.5 text-sky-400" />
              <span>Biaya Admin &amp; Layanan Multi-Channel</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Atur Biaya Admin Tiap Channel Marketplace
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Tentukan persentase potongan admin (%) dan biaya penanganan layanan (Rp per paket) khusus untuk <strong className="text-white">TikTok</strong>, <strong className="text-white">Shopee</strong>, <strong className="text-white">Toko Offline</strong>, WhatsApp, dan channel lainnya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-reset-channels"
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition cursor-pointer"
              title="Reset ke daftar standar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
            <button
              id="btn-open-add-channel"
              type="button"
              onClick={() => setShowAddChannel(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#25F4EE] text-zinc-950 hover:bg-[#25F4EE]/90 transition cursor-pointer shadow-md shadow-[#25F4EE]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Channel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form: Channel Cards */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#25F4EE]" />
              <span>Daftar Channel Marketplace &amp; Toko ({channelFees.length} Channel)</span>
            </h3>
            <span className="text-[11px] text-zinc-400">
              *Perubahan langsung berlaku pada perhitungan laporan laba &amp; rugi sesi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channelFees.map((ch, idx) => {
              const isOffline = ch.channel === 'offline' || ch.channel === 'whatsapp';
              const badgeColor = ch.channel === 'tiktok' 
                ? 'border-[#FE2C55]/30 text-[#FE2C55] bg-[#FE2C55]/10' 
                : ch.channel === 'shopee' 
                ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' 
                : ch.channel === 'offline' 
                ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';

              return (
                <div
                  key={ch.id}
                  id={`card-channel-${ch.id}`}
                  className={`p-5 rounded-2xl bg-[#161823] border transition-all space-y-4 ${
                    ch.isActive ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-60 bg-[#12141c]'
                  }`}
                >
                  {/* Channel Card Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${badgeColor}`}>
                        {ch.channel.toUpperCase()}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{ch.name}</h4>
                        <span className="text-[10px] text-zinc-400">
                          {isOffline ? 'Bebas biaya admin / Penjualan Langsung' : 'Potongan marketplace online'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ch.isActive}
                          onChange={e => handleUpdateChannel(ch.id, { isActive: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-white/20 text-[#25F4EE] focus:ring-0"
                        />
                        <span>{ch.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </label>

                      {channelFees.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteChannel(ch.id, ch.name)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Hapus Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Channel Rate Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
                    {/* Admin % */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-[#FE2C55]" />
                          <span>Biaya Admin (%)</span>
                        </label>
                        <span className="text-xs font-black text-[#25F4EE]">
                          {ch.adminPercentage}%
                        </span>
                      </div>
                      <input
                        id={`input-admin-pct-${ch.id}`}
                        type="number"
                        step="0.05"
                        min="0"
                        max="100"
                        value={ch.adminPercentage}
                        onChange={e => handleUpdateChannel(ch.id, { adminPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm font-bold text-white focus:border-[#25F4EE]"
                      />
                      {/* Quick pills */}
                      <div className="flex items-center gap-1 pt-0.5">
                        {[0, 6.5, 7.5, 8.5, 10].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleUpdateChannel(ch.id, { adminPercentage: p })}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${
                              ch.adminPercentage === p 
                                ? 'bg-[#25F4EE]/20 text-[#25F4EE] border-[#25F4EE]/40' 
                                : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Biaya Layanan */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3 text-[#25F4EE]" />
                          <span>Biaya Layanan (Rp)</span>
                        </label>
                        <span className="text-xs font-semibold text-zinc-400">
                          / paket
                        </span>
                      </div>
                      <CommaNumberInput
                        id={`input-service-fee-${ch.id}`}
                        value={ch.serviceFeePerOrder}
                        onChange={val => handleUpdateChannel(ch.id, { serviceFeePerOrder: val })}
                        className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3 py-2 text-sm font-bold text-white focus:border-[#25F4EE]"
                      />
                      {/* Quick pills */}
                      <div className="flex items-center gap-1 pt-0.5">
                        {[0, 1000, 1250, 2000].map(fee => (
                          <button
                            key={fee}
                            type="button"
                            onClick={() => handleUpdateChannel(ch.id, { serviceFeePerOrder: fee })}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${
                              ch.serviceFeePerOrder === fee 
                                ? 'bg-[#25F4EE]/20 text-[#25F4EE] border-[#25F4EE]/40' 
                                : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {fee === 0 ? 'Gratis' : formatNumber(fee)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulation Calculator */}
        <div className="bg-[#12141c] rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Simulasi Perbandingan Potongan Admin per Channel</span>
            </h4>
            <span className="text-[11px] text-zinc-400">
              Uji coba omzet: Rp {formatNumber(simOmzet)} ({simPackages} paket)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 font-semibold block mb-1">Contoh Omzet Penjualan (Rp)</label>
              <CommaNumberInput
                id="input-sim-omzet"
                value={simOmzet}
                onChange={setSimOmzet}
                className="w-full rounded-xl border border-white/10 bg-[#161823] px-3 py-2 text-xs font-bold text-white focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 font-semibold block mb-1">Jumlah Paket / Resi</label>
              <input
                id="input-sim-packages"
                type="number"
                min="1"
                value={simPackages}
                onChange={e => setSimPackages(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-white/10 bg-[#161823] px-3 py-2 text-xs font-bold text-white focus:border-amber-400"
              />
            </div>
          </div>

          {/* Result comparison grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
            {channelFees.map(ch => {
              const adminDeduction = Math.round((ch.adminPercentage / 100) * simOmzet);
              const serviceDeduction = (ch.serviceFeePerOrder || 0) * simPackages;
              const totalDeduction = adminDeduction + serviceDeduction;
              const netReceived = Math.max(0, simOmzet - totalDeduction);

              return (
                <div key={ch.id} className="p-3 rounded-xl bg-[#161823] border border-white/5 space-y-1">
                  <div className="text-[11px] font-bold text-white truncate">{ch.name}</div>
                  <div className="text-[10px] text-rose-400 font-semibold">
                    -Rp {formatNumber(totalDeduction)}
                  </div>
                  <div className="text-xs font-black text-[#25F4EE]">
                    Rp {formatNumber(netReceived)}
                  </div>
                  <div className="text-[9px] text-zinc-500">
                    Net diterima
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          id="btn-save-all-channels"
          type="submit"
          className="w-full py-4 rounded-2xl text-xs sm:text-sm font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-xl shadow-[#FE2C55]/20 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Simpan Seluruh Pengaturan Biaya Marketplace</span>
        </button>
      </form>

      {/* Modal Add Channel */}
      {showAddChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161823] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#25F4EE]" />
                <span>Tambah Channel Penjualan Baru</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddChannel(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Nama Channel / Platform <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Lazada, Blibli, Bazar Event, Butik Cabang"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3.5 py-2.5 text-xs text-white focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Jenis Tipe Channel
                </label>
                <select
                  value={newChannelKey}
                  onChange={e => setNewChannelKey(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3.5 py-2.5 text-xs text-white focus:border-[#25F4EE]"
                >
                  <option value="lainnya">Marketplace Online Lainnya</option>
                  <option value="offline">Toko Offline / Fisik</option>
                  <option value="whatsapp">Chat &amp; Social Media</option>
                  <option value="tiktok">TikTok Network</option>
                  <option value="shopee">Shopee Network</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Admin (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newChannelAdmin}
                    onChange={e => setNewChannelAdmin(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3 py-2 text-xs font-bold text-white focus:border-[#25F4EE]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Biaya Layanan (Rp)
                  </label>
                  <CommaNumberInput
                    value={newChannelServiceFee}
                    onChange={setNewChannelServiceFee}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3 py-2 text-xs font-bold text-white focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddChannel(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#25F4EE] text-zinc-950 hover:bg-[#25F4EE]/90 cursor-pointer shadow-md shadow-[#25F4EE]/20"
                >
                  Tambahkan Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
