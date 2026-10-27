import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
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
  PlusCircle,
  Calendar,
  ChevronDown,
  X,
  Zap
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';
import { ThemedSelect } from '../components/ThemedSelect';

function formatScreenshotDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthName = months[monthIdx] || parts[1];
      return `${day} ${monthName} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

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
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'specific' | 'range'>('all');
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'ads' | 'coins'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<AdsCoinDeposit | null>(null);

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
    if (viewMode !== 'menu') {
      registerSubViewBackHandler(() => {
        setEditingId(null);
        setInputStep(1);
        setViewMode('menu');
        return true;
      });
    } else {
      registerSubViewBackHandler(null);
    }
    return () => registerSubViewBackHandler(null);
  }, [viewMode]);

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

    // Saldo tetap yang didapat sesuai nominal input user
    // Biaya kas keluar otomatis +10% + 1000
    const adsPaymentCost = adsAmount > 0 ? (adsAmount + Math.round(adsAmount * 0.1) + 1000) : 0;

    const record: AdsCoinDeposit = {
      id: editingId || 'adcoin-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      adsAmount, // Saldo tetap yang diinput user
      adsPaymentCost, // Total kas keluar (+10% + 1000)
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

    const finalAdsBreakdownText = adsAmount > 0 
      ? `iklan ${formatRupiah(adsAmount)} (total bayar kas ${formatRupiah(adsPaymentCost)})` 
      : '';

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Saldo' : 'Konfirmasi Catat Top-Up Saldo',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data deposit saldo ini?`
        : `Apakah Anda yakin ingin menyimpan deposit saldo ${finalAdsBreakdownText}${adsAmount > 0 && coinAmount > 0 ? ' dan ' : ''}${coinAmount > 0 ? `koin ${formatRupiah(coinAmount)}` : ''}?`,
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
      // Type filter
      if (typeFilter === 'ads' && (!d.adsAmount || d.adsAmount <= 0)) return false;
      if (typeFilter === 'coins' && (!d.coinAmount || d.coinAmount <= 0)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const notesMatch = d.notes?.toLowerCase().includes(q);
        const adsMatch = d.adsAmount?.toString().includes(q);
        const coinsMatch = d.coinAmount?.toString().includes(q);
        if (!notesMatch && !adsMatch && !coinsMatch) return false;
      }
      if (periodFilter === 'today') return d.date === getTodayString();
      if (periodFilter === 'specific') return d.date === specificDate;
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
    );
  }

  // ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) =================
  if (viewMode === 'input') {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#25F4EE]">
                      Nominal Top Up Saldo Iklan (Rp)
                    </label>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Bayar Kas: +10% + Rp 1.000
                    </span>
                  </div>
                  <CommaNumberInput
                    value={adsAmount}
                    onChange={setAdsAmount}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                  {adsAmount > 0 && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1 mt-1.5">
                      <div className="flex items-center justify-between text-zinc-300 text-[10px]">
                        <span className="font-bold text-[#25F4EE]">Saldo Iklan (Saldo Tetap):</span>
                        <span className="font-bold text-[#25F4EE]">{formatRupiah(adsAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span>+ Pajak/PPN Iklan 10%:</span>
                        <span className="text-amber-400">+{formatRupiah(Math.round(adsAmount * 0.1))}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span>+ Biaya Admin Transaksi:</span>
                        <span className="text-amber-400">+Rp 1.000</span>
                      </div>
                      <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                        <span className="font-bold text-zinc-200 text-[11px]">Total Biaya Bayar (Kas Keluar):</span>
                        <span className="font-black text-xs text-amber-400">
                          {formatRupiah(adsAmount + Math.round(adsAmount * 0.1) + 1000)}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-400 pt-0.5 italic">
                        Saldo iklan yang didapat sesuai nominal input, sedangkan uang kas keluar dicatat sebesar total biaya bayar.
                      </p>
                    </div>
                  )}
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

  // ================= 3. OUTPUT & LAPORAN STATE (STANDARDIZED SEPERTI CATATAN KAS) =================
  const periodLabelMap: Record<string, string> = {
    all: 'Semua Periode',
    today: 'Hari Ini',
    weekly: '7 Hari Terakhir',
    monthly: 'Bulan Ini',
    specific: 'Pilih Tanggal',
    range: 'Rentang Tanggal',
  };

  const totalTopupAds = filteredList.reduce((acc, curr) => acc + (curr.adsAmount || 0), 0);
  const totalTopupCoins = filteredList.reduce((acc, curr) => acc + (curr.coinAmount || 0), 0);
  const totalSaldo = totalTopupAds + totalTopupCoins;

  return (
    <div className="w-full min-h-screen bg-[#060b14] text-white">
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#142239]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              id="btn-back-menu-from-output-deposit"
              type="button"
              onClick={() => setViewMode('menu')}
              className="p-1.5 sm:p-2 rounded-xl bg-[#0c1527] border border-[#162544] hover:bg-[#142239] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Kembali ke Menu Iklan & Koin"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm xs:text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                Riwayat Top Up Saldo
              </h1>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-slate-400 truncate">
                Histori saldo top-up iklan dan koin live streaming
              </p>
            </div>
          </div>

          <button
            id="btn-open-form-from-output-deposit"
            type="button"
            onClick={() => {
              resetForm();
              setInputStep(1);
              setViewMode('input');
            }}
            className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-[10px] sm:text-xs md:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#050811] stroke-[2.5]" />
            <span>+ Catat Top Up</span>
          </button>
        </div>

        {/* =========================================================================
            TOP SUMMARY CARDS (SELALU 3 KOLOM SESUAI GAMBAR)
            ========================================================================= */}
        <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
          <div className="grid grid-cols-3 divide-x divide-[#142239]">
            {/* 1. Total Iklan */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] text-[#00f2fe] flex items-center justify-center shrink-0">
                  <Megaphone className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                  Total Iklan
                </span>
              </div>
              <div className="text-[#00f2fe] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                {formatRupiah(totalTopupAds)}
              </div>
            </div>

            {/* 2. Total Koin */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-amber-500/10 border border-amber-400 text-amber-400 flex items-center justify-center shrink-0">
                  <Coins className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                  Total Koin
                </span>
              </div>
              <div className="text-amber-400 font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                {formatRupiah(totalTopupCoins)}
              </div>
            </div>

            {/* 3. Total Saldo */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 text-[#00d2ff] flex items-center justify-center shrink-0">
                  <Wallet className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                  Total Saldo
                </span>
              </div>
              <div className="text-[#00d2ff] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                {formatRupiah(totalSaldo)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              typeFilter === 'all'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('ads')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              typeFilter === 'ads'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Iklan Saja
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('coins')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              typeFilter === 'coins'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Koin Saja
          </button>
        </div>

        {/* Second Row: Periode Dropdown & Search Input (Sebaris pas layar) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Periode Picker Dropdown Pill */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-2.5 cursor-pointer transition text-left"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00e5ff] shrink-0" />
                <div>
                  <span className="text-[7.5px] sm:text-[8.5px] text-slate-400 font-medium block leading-none">Periode</span>
                  <span className="text-[9px] sm:text-[11px] text-white font-semibold block leading-tight mt-0.5 whitespace-nowrap">
                    {periodLabelMap[periodFilter] || 'Semua Periode'}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-52 sm:w-56 rounded-2xl bg-[#0d1627] border border-[#1b2b48] shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95">
                {[
                  { key: 'all', label: 'Semua Periode' },
                  { key: 'today', label: 'Hari Ini' },
                  { key: 'weekly', label: '7 Hari Terakhir' },
                  { key: 'monthly', label: 'Bulan Ini' },
                  { key: 'specific', label: '📅 Pilih Tanggal' },
                  { key: 'range', label: '📅 Rentang Tanggal' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setPeriodFilter(opt.key as any);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                      periodFilter === opt.key
                        ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {periodFilter === opt.key && <CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specific Date input if selected */}
          {periodFilter === 'specific' && (
            <input
              type="date"
              value={specificDate}
              onChange={e => setSpecificDate(e.target.value)}
              className="px-2 py-1 text-xs rounded-xl bg-[#0a1322] border border-[#162544] text-white outline-none focus:border-cyan-400"
            />
          )}

          {/* Date Range inputs if selected */}
          {periodFilter === 'range' && (
            <div className="flex items-center gap-1 text-[10px]">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-1.5 py-1 text-[10px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-1.5 py-1 text-[10px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
              />
            </div>
          )}

          {/* Search Box */}
          <div className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 flex-1 min-w-0 transition">
            <Search className="w-3 h-3 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari catatan top-up..."
              className="w-full bg-transparent text-white placeholder-slate-500 text-[10px] sm:text-xs focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Container (LEBAR PAS KE LAYAR 100% PERSIS SEPERTI GAMBAR) */}
        <div className="bg-[#09111e]/95 border border-[#14233c] rounded-2xl overflow-hidden shadow-2xl w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-[#14233c] text-slate-300 font-semibold text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs bg-[#0a1220]">
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[15%] whitespace-nowrap">Tanggal</th>
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[35%] whitespace-nowrap">Keterangan</th>
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Topup Iklan</th>
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Topup Koin</th>
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-right w-[17%] whitespace-nowrap">Total Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132038]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada catatan deposit saldo pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const total = (item.adsAmount || 0) + (item.coinAmount || 0);
                  const isBoth = item.adsAmount > 0 && item.coinAmount > 0;
                  const isAdsOnly = item.adsAmount > 0 && (!item.coinAmount || item.coinAmount <= 0);

                  const icon = isBoth ? (
                    <Zap className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />
                  ) : isAdsOnly ? (
                    <Megaphone className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />
                  ) : (
                    <Coins className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />
                  );

                  const iconBg = isBoth
                    ? 'bg-[#251b3d] border border-[#5c3e91] text-[#c084fc]'
                    : isAdsOnly
                    ? 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]'
                    : 'bg-[#33250e] border border-[#78541a] text-[#f59e0b]';

                  const badgeLabel = isBoth ? 'Iklan & Koin' : isAdsOnly ? 'Topup Iklan' : 'Topup Koin';
                  const badgeClass = isBoth
                    ? 'bg-[#28153e] text-[#c084fc] border-[#4c2473]'
                    : isAdsOnly
                    ? 'bg-[#0d213b] text-[#38bdf8] border-[#1a4275]'
                    : 'bg-[#2d1f0d] text-[#fbbf24] border-[#5d4117]';

                  const title = item.notes?.trim() || (isBoth ? 'Top Up Iklan & Koin' : isAdsOnly ? 'Top Up Saldo Iklan' : 'Top Up Koin Live');

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDetailItem(item)}
                      className="border-b border-[#132038] last:border-b-0 hover:bg-[#0e1c36] transition cursor-pointer group"
                      title="Klik untuk melihat rincian riwayat top-up"
                    >
                      {/* Tanggal */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs font-medium text-slate-300 whitespace-nowrap">
                        <span>{formatScreenshotDate(item.date)}</span>
                      </td>

                      {/* Keterangan: Icon + Title + Badge */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2">
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
                          <div className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[7px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs font-bold text-white block leading-tight truncate group-hover:text-cyan-300 transition">
                              {title}
                            </span>
                            <span className={`inline-block mt-0.5 text-[5.5px] xs:text-[6px] sm:text-[7px] font-semibold px-0.5 xs:px-1 py-[0.5px] rounded border ${badgeClass} leading-none whitespace-nowrap`}>
                              {badgeLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Topup Iklan */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                        {item.adsAmount > 0 ? (
                          <span className="text-[#00f2fe] font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                            {formatRupiah(item.adsAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs block">-</span>
                        )}
                      </td>

                      {/* Topup Koin */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                        {item.coinAmount > 0 ? (
                          <span className="text-amber-400 font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                            {formatRupiah(item.coinAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs block">-</span>
                        )}
                      </td>

                      {/* Total Saldo */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-right">
                        <span className="text-white font-extrabold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                          {formatRupiah(total)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          DETAIL MODAL (POPUP RINCIAN KLIK BARIS)
          ========================================================================= */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#0a1220] border border-[#1b2b48] rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#14233c] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] flex items-center justify-center text-[#00f2fe]">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Detail Riwayat Top-Up</h3>
                  <p className="text-[10px] text-slate-400">{formatDateIndo(selectedDetailItem.date)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Saldo Card */}
            <div className="p-3 rounded-2xl bg-[#060b14] border border-[#142239] text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Saldo Didapat</span>
              <div className="text-xl sm:text-2xl font-black text-[#00f2fe] tabular-nums">
                {formatRupiah((selectedDetailItem.adsAmount || 0) + (selectedDetailItem.coinAmount || 0))}
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="space-y-2 text-xs divide-y divide-[#14233c]">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Tanggal:</span>
                <span className="font-semibold text-white">{formatDateIndo(selectedDetailItem.date)}</span>
              </div>

              {selectedDetailItem.adsAmount > 0 && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Top-Up Saldo Iklan:</span>
                  <span className="font-bold text-[#00f2fe]">{formatRupiah(selectedDetailItem.adsAmount)}</span>
                </div>
              )}

              {selectedDetailItem.adsPaymentCost && selectedDetailItem.adsPaymentCost > 0 && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Biaya Bayar Kas (Iklan):</span>
                  <span className="font-semibold text-amber-300">{formatRupiah(selectedDetailItem.adsPaymentCost)}</span>
                </div>
              )}

              {selectedDetailItem.coinAmount > 0 && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Top-Up Koin Live:</span>
                  <span className="font-bold text-amber-400">{formatRupiah(selectedDetailItem.coinAmount)}</span>
                </div>
              )}

              {selectedDetailItem.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Catatan / Keterangan:</span>
                  <p className="text-white bg-[#060b14] p-2.5 rounded-xl border border-[#142239] text-[11px] leading-relaxed">
                    {selectedDetailItem.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#14233c]">
              <button
                type="button"
                onClick={() => {
                  const item = selectedDetailItem;
                  handleDelete(item.id, item.notes || `Rp ${formatRupiah((item.adsAmount || 0) + (item.coinAmount || 0))}`);
                  setSelectedDetailItem(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#ff3366] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = selectedDetailItem;
                  setSelectedDetailItem(null);
                  handleStartEdit(item);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-[#00f2fe] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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

