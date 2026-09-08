import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdsCoinDeposit, CurrentUser } from '../types';
import { getTodayString, formatRupiah } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { RoutePath } from '../services/navigation';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { 
  Wallet, 
  ArrowLeft, 
  History, 
  CheckCircle2, 
  Sparkles,
  Edit3,
  PlusCircle
} from 'lucide-react';

interface TopupSaldoInputViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  editId?: string | null;
}

export const TopupSaldoInputView: React.FC<TopupSaldoInputViewProps> = ({
  currentUser,
  onNavigate,
  onNotify,
  editId = null,
}) => {
  const [date, setDate] = useState(getTodayString());
  const [adsAmount, setAdsAmount] = useState<number>(1000000);
  const [coinAmount, setCoinAmount] = useState<number>(500000);
  const [notes, setNotes] = useState('Topup Marketplace Ads & Koin Live');
  const [isEditing, setIsEditing] = useState<boolean>(!!editId);

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

  useEffect(() => {
    if (editId) {
      const all = StorageService.getAdsCoins(currentUser.storeId);
      const found = all.find(d => d.id === editId);
      if (found) {
        setDate(found.date);
        setAdsAmount(found.adsAmount);
        setCoinAmount(found.coinAmount);
        setNotes(found.notes || '');
        setIsEditing(true);
      }
    }
  }, [editId, currentUser.storeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adsAmount <= 0 && coinAmount <= 0) {
      onNotify('Masukkan nominal topup iklan atau koin!', 'error');
      return;
    }

    const newDeposit: AdsCoinDeposit = {
      id: editId || 'adscoin-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      adsAmount,
      coinAmount,
      notes,
      createdAt: new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      if (editId) {
        const all = StorageService.getAdsCoins(currentUser.storeId);
        const updated = all.map(d => d.id === editId ? newDeposit : d);
        localStorage.setItem('shopee_lr_adscoins', JSON.stringify(updated));
        onNotify('Perubahan saldo topup iklan/koin berhasil disimpan!', 'success');
      } else {
        StorageService.addAdsCoin(newDeposit);
        onNotify('Top-up saldo iklan & koin berhasil dicatat!', 'success');
      }
      onNavigate('/topup-saldo/riwayat');
    };

    setConfirmModal({
      isOpen: true,
      title: isEditing ? 'Konfirmasi Simpan Perubahan Top-Up' : 'Konfirmasi Simpan Saldo Top-Up',
      message: isEditing
        ? `Apakah Anda yakin ingin menyimpan perubahan data top-up ini?`
        : `Apakah Anda yakin ingin menyimpan saldo top-up iklan ${formatRupiah(adsAmount)} dan koin ${formatRupiah(coinAmount)}?`,
      type: isEditing ? 'edit' : 'create',
      confirmText: isEditing ? 'Ya, Simpan Perubahan' : 'Ya, Simpan Saldo',
      onConfirm: executeSave,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Segmented Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-back-to-topup-hub"
            onClick={() => onNavigate('/topup-saldo')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
            title="Kembali ke Hub Saldo"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Hub Saldo</span>
          </button>
          <span className="text-sm font-black text-white px-1">
            {isEditing ? 'Edit Data Top-Up' : 'Input Top-Up Saldo'}
          </span>
        </div>

        {/* Tab Switcher between Input and Riwayat */}
        <div className="flex items-center gap-1 bg-[#0b0c10] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg text-xs font-black bg-white text-zinc-950 shadow-sm flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Form Input</span>
          </div>

          <button
            type="button"
            id="btn-goto-riwayat-from-input"
            onClick={() => onNavigate('/topup-saldo/riwayat')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Riwayat</span>
          </button>
        </div>
      </div>

      {/* Dedicated Form Input Card */}
      <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE]">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                {isEditing ? 'Form Edit Top-Up Saldo' : 'Formulir Top-Up Saldo Iklan & Koin'}
              </h3>
              <p className="text-xs text-zinc-400">
                Data akan otomatis memperbarui saldo kredit marketplace &amp; koin live.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Tanggal Top-Up <span className="text-[#FE2C55]">*</span>
            </label>
            <input
              id="input-topup-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0b0c10] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-[#25F4EE] transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nominal Iklan */}
            <div className="bg-[#0b0c10] p-4 rounded-2xl border border-white/10 space-y-1.5">
              <label className="block text-xs font-bold text-[#25F4EE]">
                Nominal Saldo Iklan Marketplace (Rp)
              </label>
              <CommaNumberInput
                id="input-topup-ads"
                value={adsAmount}
                onChange={setAdsAmount}
                placeholder="Contoh: 1.000.000"
                className="w-full bg-[#161823] border border-white/10 rounded-xl px-4 py-2.5 text-white font-black text-base focus:outline-hidden focus:border-[#25F4EE]"
              />
              <p className="text-[11px] text-zinc-500">
                Kredit untuk Shopee Ads / TikTok Ads Live
              </p>
            </div>

            {/* Nominal Koin */}
            <div className="bg-[#0b0c10] p-4 rounded-2xl border border-white/10 space-y-1.5">
              <label className="block text-xs font-bold text-amber-400">
                Nominal Koin Live Reward (Rp)
              </label>
              <CommaNumberInput
                id="input-topup-coin"
                value={coinAmount}
                onChange={setCoinAmount}
                placeholder="Contoh: 500.000"
                className="w-full bg-[#161823] border border-white/10 rounded-xl px-4 py-2.5 text-white font-black text-base focus:outline-hidden focus:border-amber-400"
              />
              <p className="text-[11px] text-zinc-500">
                Koin giveaway penonton saat sesi streaming
              </p>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Catatan / Referensi Topup
            </label>
            <input
              id="input-topup-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Top-up promo gajian shopee / voucher diskon"
              className="w-full bg-[#0b0c10] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-[#25F4EE] transition"
            />
          </div>

          {/* Tombol Simpan & Batal */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              id="btn-save-topup"
              type="submit"
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#25F4EE] to-emerald-400 text-zinc-950 font-black text-sm hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#25F4EE]/20 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-zinc-950" />
              <span>{isEditing ? 'Simpan Perubahan Top-Up' : 'Simpan Saldo Top-Up'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/topup-saldo')}
              className="py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-sm transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
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
