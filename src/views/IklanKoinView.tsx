import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { AdsCoinDeposit, CurrentUser } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  Coins, 
  Megaphone, 
  Trash2, 
  Wallet, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Search,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  ClipboardList,
  PlusCircle
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';
import { ThemedSelect } from '../components/ThemedSelect';

interface IklanKoinViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type IklanKoinViewMode = 'menu' | 'input' | 'output';

export const IklanKoinView: React.FC<IklanKoinViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<IklanKoinViewMode>('menu');
  const [inputStep, setInputStep] = useState<number>(1);
  const [depositList, setDepositList] = useState<AdsCoinDeposit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [adsAmount, setAdsAmount] = useState<number>(1000000);
  const [coinAmount, setCoinAmount] = useState<number>(500000);
  const [notes, setNotes] = useState('Topup Marketplace Ads & Koin Live');

  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);
  const salesList = StorageService.getSales(currentUser.storeId);

  // ROAS (Return On Ad Spend) Calculation
  const roasMetrics = useMemo(() => {
    const totalOmzet = salesList.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalAdsUsed = adsCoinInfo.totalAdsUsed || 0;
    const totalCoinUsed = adsCoinInfo.totalCoinUsed || 0;
    const totalMarketingSpend = totalAdsUsed + totalCoinUsed;

    const roasAdsOnly = totalAdsUsed > 0 ? (totalOmzet / totalAdsUsed) : 0;
    const roasTotalMarketing = totalMarketingSpend > 0 ? (totalOmzet / totalMarketingSpend) : 0;
    const adCostPerOrder = salesList.length > 0 && totalAdsUsed > 0 
      ? Math.round(totalAdsUsed / salesList.reduce((acc, s) => acc + (s.packagesSold || 1), 0)) 
      : 0;

    return {
      totalOmzet,
      totalAdsUsed,
      totalCoinUsed,
      totalMarketingSpend,
      roasAdsOnly: roasAdsOnly.toFixed(2),
      roasTotalMarketing: roasTotalMarketing.toFixed(2),
      adCostPerOrder,
    };
  }, [salesList, adsCoinInfo]);

  const loadData = () => {
    const list = StorageService.getAdsCoins(currentUser.storeId);
    setDepositList(list);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayString());
    setAdsAmount(1000000);
    setCoinAmount(500000);
    setNotes('Topup Marketplace Ads & Koin Live');
    setInputStep(1);
  };

  const handleStartEdit = (item: AdsCoinDeposit) => {
    setEditingId(item.id);
    setDate(item.date);
    setAdsAmount(item.adsAmount);
    setCoinAmount(item.coinAmount);
    setNotes(item.notes || '');
    setInputStep(1);
    setViewMode('input');
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adsAmount <= 0 && coinAmount <= 0) {
      onNotify('Harap isi nominal topup saldo Iklan atau Koin!', 'error');
      return;
    }

    const record: AdsCoinDeposit = {
      id: editingId || 'adcoin-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      adsAmount,
      coinAmount,
      notes,
      createdAt: new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingId) {
          const all = StorageService.getAdsCoins(currentUser.storeId);
          const updated = all.map(d => d.id === editingId ? record : d);
          StorageService.saveAdsCoins(updated);
          onNotify('Perubahan saldo iklan & koin berhasil disimpan!', 'success');
        } else {
          StorageService.addAdsCoin(record);
          onNotify('Topup saldo iklan & koin berhasil dicatat!', 'success');
        }

        loadData();
        resetForm();
        setViewMode('output');
      } catch (err: any) {
        console.error('Error saving ads/coins:', err);
        onNotify('Gagal mencatat saldo iklan & koin: ' + (err?.message || 'Terjadi gangguan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Saldo' : 'Konfirmasi Catat Top-Up Saldo',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data deposit saldo ini?`
        : `Apakah Anda yakin ingin menyimpan deposit saldo iklan ${formatRupiah(adsAmount)} dan koin ${formatRupiah(coinAmount)}?`,
      type: editingId ? 'edit' : 'create',
      confirmText: editingId ? 'Ya, Simpan Perubahan' : 'Ya, Catat Saldo',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, noteText?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Riwayat Saldo',
      message: `Apakah Anda yakin ingin menghapus data riwayat deposit saldo ${noteText ? `"${noteText}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteAdsCoin(id);
        loadData();
        onNotify('Riwayat deposit saldo dihapus.', 'info');
        if (editingId === id) {
          handleCancelEdit();
        }
      },
    });
  };

  // Filter list
  const filteredList = depositList
    .filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!d.notes.toLowerCase().includes(q)) return false;
      }
      if (periodFilter === 'today') return d.date === getTodayString();
      if (periodFilter === 'range') return d.date >= startDate && d.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return d.date >= weekAgo && d.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return d.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // ================= 1. MENU HUB STATE (2 Pilihan Grid) =================
  if (viewMode === 'menu') {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-3.5 text-white font-sans">
        {/* Header Bar Sub-Menu */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-iklankoin"
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer active:scale-95 shrink-0"
              title="Kembali ke Dashboard"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
            </button>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Deposit Iklan &amp; Koin Saweran Live</span>
              </h2>
              <p className="text-[10px] text-zinc-400">Pengelolaan saldo promosi berbayar &amp; giveaway</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block font-medium">Total Terpakai:</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {formatRupiah(adsCoinInfo.totalAdsUsed + adsCoinInfo.totalCoinUsed)}
            </span>
          </div>
        </div>

        {/* Ringkasan Ringkas & Kompak di Atas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Sisa Saldo Iklan</div>
            <div className={`text-xs sm:text-sm font-black truncate ${adsCoinInfo.remainingAds < 0 ? 'text-[#FE2C55]' : 'text-[#25F4EE]'}`}>
              {formatRupiah(adsCoinInfo.remainingAds)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Sisa Saldo Koin</div>
            <div className={`text-xs sm:text-sm font-black truncate ${adsCoinInfo.remainingCoin < 0 ? 'text-[#FE2C55]' : 'text-amber-400'}`}>
              {formatRupiah(adsCoinInfo.remainingCoin)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Biaya Iklan+Koin</div>
            <div className="text-xs sm:text-sm font-black text-white truncate">
              {formatRupiah(adsCoinInfo.totalAdsUsed + adsCoinInfo.totalCoinUsed)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">ROAS Pemasaran</div>
            <div className="text-xs sm:text-sm font-black text-[#25F4EE] truncate">
              {roasMetrics.roasTotalMarketing}x
            </div>
          </div>
        </div>

        {/* Grid Kecil 2 Kesamping: Input vs Output */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Card 1: Form Input */}
            <div
              id="menu-card-input-iklankoin"
              onClick={() => {
                resetForm();
                setInputStep(1);
                setViewMode('input');
              }}
              className="group p-3 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-2.5 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Top Up Saldo Iklan & Koin"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <p className="text-[10px] text-zinc-400 truncate leading-snug">
                    Catat pengisian saldo bertahap
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-white/5">
                <span>Input data baru</span>
                <span className="text-[#25F4EE] font-bold">Buka Form</span>
              </div>
            </div>

            {/* Card 2: Laporan & Riwayat */}
            <div
              id="menu-card-output-iklankoin"
              onClick={() => setViewMode('output')}
              className="group p-3 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-amber-400/40 transition cursor-pointer flex flex-col justify-between gap-2.5 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Riwayat Saldo & ROAS"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-amber-400 transition-colors leading-tight"
                  />
                  <p className="text-[10px] text-zinc-400 truncate leading-snug">
                    Rekap deposit &amp; efektivitas
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-white/5">
                <span>{filteredList.length} Deposit Tercatat</span>
                <span className="text-amber-400 font-bold">Buka Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) =================
  if (viewMode === 'input') {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
        {/* Compact Form Header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            id="btn-back-menu-iklankoin"
            type="button"
            onClick={() => {
              resetForm();
              setViewMode('menu');
            }}
            className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Batal / Kembali ke Menu</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {/* TAHAP 1: Tanggal & Saldo Iklan */}
          {inputStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white">
                  Tanggal &amp; Topup Iklan Berbayar
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Masukkan tanggal pengisian dan nominal saldo iklan berbayar marketplace.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Pengisian Saldo <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#25F4EE] mb-1">
                    Nominal Top Up Saldo Iklan (Rp)
                  </label>
                  <CommaNumberInput
                    value={adsAmount}
                    onChange={setAdsAmount}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {formatRupiah(adsAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInputStep(2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2: Saldo Koin & Catatan */}
          {inputStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white">
                  Topup Saldo Koin Saweran &amp; Catatan
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Masukkan topup koin untuk giveaway/saweran live dan catatan bukti transaksi.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    Nominal Top Up Saldo Koin Live (Rp)
                  </label>
                  <CommaNumberInput
                    value={coinAmount}
                    onChange={setCoinAmount}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-amber-400"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {formatRupiah(coinAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Catatan / Keterangan Sumber Topup
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Misal: Topup BCA Shopee Ads & Koin TikTok Live"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setInputStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tahap Sebelumnya</span>
                </button>

                <button
                  id="btn-submit-deposit"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Simpan Pengisian Saldo'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // ================= 3. OUTPUT & LAPORAN STATE (Tanpa Tab) =================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* Sub-menu Navigation Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            id="btn-back-menu-from-output-iklankoin"
            type="button"
            onClick={() => setViewMode('menu')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer active:scale-95 shrink-0"
            title="Kembali ke Menu"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
          </button>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white">Riwayat Saldo &amp; ROAS</h3>
            <p className="text-[10px] text-zinc-400">Daftar mutasi pengisian saldo iklan &amp; koin</p>
          </div>
        </div>

        <button
          id="btn-open-form-from-output-iklankoin"
          type="button"
          onClick={() => {
            resetForm();
            setInputStep(1);
            setViewMode('input');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Topup Baru</span>
        </button>
      </div>

      {/* ROAS Summary Highlights - Kompak & Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        <div className="p-2.5 sm:p-3 rounded-xl bg-[#161823] border border-white/10 space-y-0.5">
          <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>ROAS Iklan (Ads)</span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#25F4EE]">
            {roasMetrics.roasAdsOnly}x
          </div>
          <div className="text-[9px] text-zinc-500">Omzet / Biaya Iklan</div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-[#161823] border border-white/10 space-y-0.5">
          <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
            <span>ROAS Pemasaran Total</span>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-300">
            {roasMetrics.roasTotalMarketing}x
          </div>
          <div className="text-[9px] text-zinc-500">Omzet / (Iklan + Koin)</div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-[#161823] border border-white/10 space-y-0.5 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-white" />
            <span>Biaya Iklan / Paket</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white">
            {formatRupiah(roasMetrics.adCostPerOrder)}
          </div>
          <div className="text-[9px] text-zinc-500">Efisiensi per pesanan</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-2.5 sm:p-3 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari catatan topup..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
            />
          </div>

          <ThemedSelect
            value={periodFilter}
            onChange={val => setPeriodFilter(val as any)}
            title="Pilih Periode Deposit"
            options={[
              { value: 'all', label: 'Semua Periode' },
              { value: 'today', label: 'Hari Ini' },
              { value: 'weekly', label: '7 Hari Terakhir' },
              { value: 'monthly', label: 'Bulan Ini' },
            ]}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          />
        </div>

        <div className="text-xs text-zinc-400 font-semibold shrink-0">
          Total: <strong className="text-white">{filteredList.length}</strong> deposit
        </div>
      </div>

      {/* List of Deposit Cards (Persis Style Riwayat Cashflow) */}
      <div className="space-y-2">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
            Belum ada catatan topup saldo pada periode ini.
          </div>
        ) : (
          filteredList.map(item => {
            const formattedDate = formatDateIndo(item.date);
            const totalDeposit = (item.adsAmount || 0) + (item.coinAmount || 0);

            return (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition-all shadow-sm space-y-2"
              >
                {/* Top Row: Date Badge on Left, Action Buttons on Right */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                    {formattedDate}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                      title="Edit Deposit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.notes || `${formatRupiah(totalDeposit)}`)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Row: Total Nominal on Left (+Rp ...), Breakdown on Right */}
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-black tracking-tight text-white">
                      +{formatRupiah(totalDeposit)}
                    </div>
                  </div>

                  <div className="text-right min-w-0 flex-1 space-y-0.5">
                    {item.adsAmount > 0 && (
                      <div className="text-[11px] font-bold text-[#25F4EE]">
                        Iklan: {formatRupiah(item.adsAmount)}
                      </div>
                    )}
                    {item.coinAmount > 0 && (
                      <div className="text-[11px] font-bold text-amber-300">
                        Koin: {formatRupiah(item.coinAmount)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Notes / Keterangan */}
                {item.notes && (
                  <div className="pt-1.5 border-t border-white/5 text-[11px] sm:text-xs text-zinc-400 leading-snug">
                    <span className="text-zinc-500 font-medium">Catatan: </span>
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            );
          })
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
