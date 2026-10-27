import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
import { CurrentUser, ReturnRecord } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  RotateCcw, 
  Trash2, 
  PackageX, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  ArrowLeft, 
  Search, 
  Shield, 
  Sliders,
  Sparkles,
  ArrowRight,
  ClipboardList,
  PlusCircle,
  Calendar,
  ChevronDown,
  X,
  Package,
  Wallet
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

interface ReturnViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ReturnViewMode = 'menu' | 'input' | 'output';

export const ReturnView: React.FC<ReturnViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<ReturnViewMode>('menu');
  const [inputStep, setInputStep] = useState<number>(1);
  const [returnList, setReturnList] = useState<ReturnRecord[]>([]);
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

  // Return Mechanism Mode (Req 1: Owner Control)
  const [isEstimateMode, setIsEstimateMode] = useState(false);
  const [estimatePercentage, setEstimatePercentage] = useState<number>(3);

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'specific' | 'range'>('all');
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cod' | 'defect' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<ReturnRecord | null>(null);

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [packageCount, setPackageCount] = useState<number>(2);
  const [totalAmount, setTotalAmount] = useState<number>(120000);
  const [reason, setReason] = useState('Paket retur gagal COD / reject pembeli');

  const sales = StorageService.getSales(currentUser.storeId);
  const totalOmzetStore = sales.reduce((acc, s) => acc + (s.omzet || 0), 0);

  const loadData = () => {
    const list = StorageService.getReturns(currentUser.storeId);
    setReturnList(list);

    const store = StorageService.getStoreById(currentUser.storeId);
    if (store?.settings?.returnMechanism === 'estimate') {
      setIsEstimateMode(true);
      setEstimatePercentage(store.settings.estimateReturnPercentage || 3);
    } else {
      setIsEstimateMode(false);
      setEstimatePercentage(store?.settings?.estimateReturnPercentage || 3);
    }
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
    setPackageCount(2);
    setTotalAmount(120000);
    setReason('Paket retur gagal COD / reject pembeli');
    setInputStep(1);
  };

  const handleStartEdit = (item: ReturnRecord) => {
    setEditingId(item.id);
    setDate(item.date);
    setPackageCount(item.packageCount);
    setTotalAmount(item.totalAmount);
    setReason(item.reason || '');
    setInputStep(1);
    setViewMode('input');
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // Req 1: Owner-only Save Return Estimation Settings
  const handleSaveOwnerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isOwner) {
      onNotify('Hanya Owner yang memiliki akses mengubah estimasi return!', 'error');
      return;
    }

    StorageService.updateStoreSettings(currentUser.storeId, {
      returnMechanism: isEstimateMode ? 'estimate' : 'detail',
      estimateReturnPercentage: Number(estimatePercentage) || 0,
    });

    onNotify(`Pengaturan return berhasil diperbarui ke mode ${isEstimateMode ? `Estimasi (${estimatePercentage}%)` : 'Detail Pencatatan Manual'}!`, 'success');
    loadData();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEstimateMode) {
      onNotify('Mode return estimasi (%) sedang aktif. Nilai return dihitung otomatis pada laporan laba rugi.', 'info');
      return;
    }

    const record: ReturnRecord = {
      id: editingId || 'ret-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      packageCount,
      totalAmount,
      reason,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingId) {
          StorageService.updateReturn(record);
          onNotify('Perubahan data retur berhasil disimpan!', 'success');
        } else {
          StorageService.addReturn(record);
          onNotify('Data retur paket berhasil disimpan!', 'success');
        }
        loadData();
        resetForm();
        setViewMode('output');
      } catch (err: any) {
        console.error('Error saving return:', err);
        onNotify('Gagal menyimpan data retur: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Retur' : 'Konfirmasi Catat Retur Baru',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data retur ${packageCount} paket ini?`
        : `Apakah Anda yakin ingin menyimpan catatan retur ${packageCount} paket senilai ${formatRupiah(totalAmount)}?`,
      type: editingId ? 'edit' : 'create',
      confirmText: editingId ? 'Ya, Simpan Perubahan' : 'Ya, Catat Retur',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, reasonText?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Data Retur',
      message: `Apakah Anda yakin ingin menghapus catatan retur ${reasonText ? `"${reasonText}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Retur',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteReturn(id);
        loadData();
        onNotify('Data retur berhasil dihapus.', 'info');
        if (editingId === id) {
          handleCancelEdit();
        }
      },
    });
  };

  // Filter & sort
  const filteredList = returnList
    .filter(r => {
      // Category filter
      if (categoryFilter === 'cod') {
        const lower = r.reason.toLowerCase();
        if (!lower.includes('cod') && !lower.includes('tolak') && !lower.includes('gagal')) return false;
      } else if (categoryFilter === 'defect') {
        const lower = r.reason.toLowerCase();
        if (!lower.includes('cacat') && !lower.includes('rusak') && !lower.includes('reject')) return false;
      } else if (categoryFilter === 'other') {
        const lower = r.reason.toLowerCase();
        if (lower.includes('cod') || lower.includes('cacat') || lower.includes('rusak')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.reason.toLowerCase().includes(q) && !(r.recordedBy || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (periodFilter === 'today') return r.date === getTodayString();
      if (periodFilter === 'specific') return r.date === specificDate;
      if (periodFilter === 'range') return r.date >= startDate && r.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return r.date >= weekAgo && r.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return r.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPackages = filteredList.reduce((acc, r) => acc + (r.packageCount || 0), 0);
  const totalNominal = filteredList.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  const estimatedReturnAmount = Math.round((totalOmzetStore * estimatePercentage) / 100);

  // ================= 1. MENU HUB STATE (2 Pilihan Grid) =================
  if (viewMode === 'menu') {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Paket Retur</div>
            <div className="text-sm sm:text-base font-black text-white">{formatNumber(totalPackages)} paket</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Nominal Retur</div>
            <div className="text-sm sm:text-base font-black text-[#FE2C55]">{formatRupiah(totalNominal)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 font-semibold">Mekanisme Retur</div>
            <div className="text-sm sm:text-base font-black text-[#25F4EE]">
              {isEstimateMode ? `Estimasi (${estimatePercentage}%)` : 'Detail Manual'}
            </div>
          </div>
        </div>

        {/* Owner Settings Card */}
        {currentUser.isOwner && (
          <div className="bg-[#161823] rounded-2xl border border-[#25F4EE]/30 p-3.5 shadow-md">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#25F4EE]" />
                <span className="text-xs font-bold text-white">Pengaturan Mekanisme Return (Khusus Owner)</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEstimateMode}
                    onChange={e => setIsEstimateMode(e.target.checked)}
                    className="rounded accent-[#25F4EE] cursor-pointer"
                  />
                  <span>Gunakan Mode Estimasi (%)</span>
                </label>

                {isEstimateMode && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={estimatePercentage}
                      onChange={e => setEstimatePercentage(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-xs rounded-lg bg-[#0b0c10] border border-white/10 text-white font-bold"
                    />
                    <span className="text-xs text-zinc-400">%</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveOwnerSettings}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-[#25F4EE] text-black hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  Simpan Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid Kecil 2 Kesamping: Input vs Output */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: Form Input */}
            <div
              id="menu-card-input-return"
              onClick={() => {
                if (isEstimateMode) {
                  onNotify('Mode return estimasi (%) sedang aktif. Nilai retur dihitung otomatis pada laporan.', 'info');
                  return;
                }
                resetForm();
                setInputStep(1);
                setViewMode('input');
              }}
              className={`group p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98 ${
                isEstimateMode
                  ? 'bg-[#12141c] border-white/5 opacity-60'
                  : 'bg-[#161823] hover:bg-[#1c1f2e] border-white/10 hover:border-[#FE2C55]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Input Paket Retur"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text={isEstimateMode ? 'Terkunci (Mode Estimasi Aktif)' : 'Catat paket retur baru bertahap'}
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{isEstimateMode ? 'Otomatis %' : 'Input data baru'}</span>
                <span className="text-[#FE2C55] font-bold">{isEstimateMode ? 'Terkunci' : 'Buka Form'}</span>
              </div>
            </div>

            {/* Card 2: Laporan & Riwayat */}
            <div
              id="menu-card-output-return"
              onClick={() => setViewMode('output')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Riwayat Paket Retur"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Daftar paket retur & nominal"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{filteredList.length} Data Tersedia</span>
                <span className="text-[#25F4EE] font-bold">Buka Data</span>
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
            id="btn-back-menu-return"
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

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20">
            Tahap {inputStep} dari 2
          </span>
        </div>

        {/* Stepper Header Pills */}
        <div className="grid grid-cols-2 gap-2 bg-[#161823] p-2.5 rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setInputStep(1)}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 1
                ? 'bg-[#FE2C55]/10 border border-[#FE2C55] text-[#FE2C55]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            <span className="hidden sm:inline">Tanggal &amp; Jumlah Paket</span>
            <span className="sm:hidden">Tahap 1</span>
          </button>
          <button
            type="button"
            onClick={() => setInputStep(2)}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 2
                ? 'bg-[#FE2C55]/10 border border-[#FE2C55] text-[#FE2C55]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
            <span className="hidden sm:inline">Nominal &amp; Alasan</span>
            <span className="sm:hidden">Tahap 2</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {/* TAHAP 1: Tanggal & Jumlah Paket */}
          {inputStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <PackageX className="w-4 h-4 text-[#FE2C55]" />
                  <span>Tahap 1: Tanggal &amp; Jumlah Paket Retur</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Masukkan tanggal paket kembali dan total paket retur.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Kedatangan Retur <span className="text-[#FE2C55]">*</span>
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
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Jumlah Paket Retur <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={packageCount}
                    onChange={e => setPackageCount(parseInt(e.target.value) || 0)}
                    placeholder="Misal: 2"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (packageCount <= 0) {
                      onNotify('Jumlah paket harus lebih dari 0!', 'error');
                      return;
                    }
                    setInputStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#FE2C55] text-white font-extrabold text-xs shadow-md shadow-[#FE2C55]/20 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <span>Tahap Selanjutnya: Nominal &amp; Alasan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2: Nominal Nilai & Alasan Retur */}
          {inputStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#FE2C55]" />
                  <span>Tahap 2: Estimasi Nominal &amp; Alasan Retur</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Tentukan nilai perkiraan kerugian/harga paket retur dan keterangannya.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Estimasi Nominal Retur (Rp)
                  </label>
                  <CommaNumberInput
                    value={totalAmount}
                    onChange={setTotalAmount}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Alasan / Keterangan Retur <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Misal: Alamat tidak ditemukan, COD ditolak pembeli, barang cacat"
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
                  id="btn-submit-return"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Simpan Data Retur'}</span>
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

  return (
    <div className="w-full min-h-screen bg-[#060b14] text-white">
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#142239]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              id="btn-back-menu-from-output-return"
              type="button"
              onClick={() => setViewMode('menu')}
              className="p-1.5 sm:p-2 rounded-xl bg-[#0c1527] border border-[#162544] hover:bg-[#142239] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Kembali ke Menu Retur"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm xs:text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                Riwayat Retur Paket
              </h1>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-slate-400 truncate">
                Histori pencatatan retur paket, kerugian &amp; alasan retur
              </p>
            </div>
          </div>

          <button
            id="btn-open-form-from-output-return"
            type="button"
            onClick={() => {
              resetForm();
              setInputStep(1);
              setViewMode('input');
            }}
            className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-[10px] sm:text-xs md:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#050811] stroke-[2.5]" />
            <span>+ Catat Retur Baru</span>
          </button>
        </div>

        {/* =========================================================================
            TOP SUMMARY CARDS (SELALU 3 KOLOM SESUAI GAMBAR)
            ========================================================================= */}
        <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
          <div className="grid grid-cols-3 divide-x divide-[#142239]">
            {/* 1. Total Paket Retur */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#ff3366]/10 border border-[#ff3366] text-[#ff3366] flex items-center justify-center shrink-0">
                  <PackageX className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                  Total Paket Retur
                </span>
              </div>
              <div className="text-white font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                {formatNumber(totalPackages)} Paket
              </div>
            </div>

            {/* 2. Total Nominal Retur */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#ff3366]/10 border border-[#ff3366] text-[#ff3366] flex items-center justify-center shrink-0">
                  <RotateCcw className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                  Total Kerugian
                </span>
              </div>
              <div className="text-[#ff3366] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                {formatRupiah(totalNominal)}
              </div>
            </div>

            {/* 3. Mekanisme Retur */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 text-[#00d2ff] flex items-center justify-center shrink-0">
                  <Sliders className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                  Mekanisme
                </span>
              </div>
              <div className="text-[#00d2ff] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                {isEstimateMode ? `Estimasi ${estimatePercentage}%` : 'Detail Manual'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('cod')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              categoryFilter === 'cod'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Gagal COD / Ditolak
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('defect')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              categoryFilter === 'defect'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Barang Cacat / Rusak
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('other')}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
              categoryFilter === 'other'
                ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
            }`}
          >
            Lainnya
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
              placeholder="Cari alasan retur / pencatat..."
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
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Jml Paket</th>
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Pencatat</th>
                <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-right w-[17%] whitespace-nowrap">Nilai Retur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132038]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada catatan paket retur pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const icon = <PackageX className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />;
                  const iconBg = 'bg-[#371322] border border-[#831e3d] text-[#ff3366]';
                  const badgeLabel = `${item.packageCount} Paket`;
                  const badgeClass = 'bg-[#371322] text-[#ff3366] border-[#831e3d]';
                  const title = item.reason || 'Paket Retur';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDetailItem(item)}
                      className="border-b border-[#132038] last:border-b-0 hover:bg-[#0e1c36] transition cursor-pointer group"
                      title="Klik untuk melihat rincian riwayat retur"
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

                      {/* Jml Paket */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                        <span className="text-white font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                          {item.packageCount} Paket
                        </span>
                      </td>

                      {/* Pencatat */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                        <span className="text-slate-300 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs block truncate">
                          {item.recordedBy || 'Admin'}
                        </span>
                      </td>

                      {/* Nilai Retur */}
                      <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-right">
                        <span className="text-[#ff3366] font-extrabold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                          {formatRupiah(item.totalAmount)}
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
                <div className="w-8 h-8 rounded-full bg-[#ff3366]/10 border border-[#ff3366] flex items-center justify-center text-[#ff3366]">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Detail Riwayat Retur</h3>
                  <p className="text-[10px] text-slate-400">{formatDateIndo(selectedDetailItem.date)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Kerugian Card */}
            <div className="p-3 rounded-2xl bg-[#060b14] border border-[#142239] text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Estimasi Kerugian Retur</span>
              <div className="text-xl sm:text-2xl font-black text-[#ff3366] tabular-nums">
                {formatRupiah(selectedDetailItem.totalAmount)}
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="space-y-2 text-xs divide-y divide-[#14233c]">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Tanggal:</span>
                <span className="font-semibold text-white">{formatDateIndo(selectedDetailItem.date)}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Jumlah Paket Retur:</span>
                <span className="font-bold text-white">{selectedDetailItem.packageCount} Paket</span>
              </div>

              {selectedDetailItem.recordedBy && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Dicatat Oleh:</span>
                  <span className="text-slate-200">{selectedDetailItem.recordedBy}</span>
                </div>
              )}

              {selectedDetailItem.reason && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Alasan / Keterangan:</span>
                  <p className="text-white bg-[#060b14] p-2.5 rounded-xl border border-[#142239] text-[11px] leading-relaxed">
                    {selectedDetailItem.reason}
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
                  handleDelete(item.id, `${item.packageCount} paket - ${item.reason}`);
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

