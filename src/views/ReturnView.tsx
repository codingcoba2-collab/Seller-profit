import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
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
  PlusCircle
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';

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
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

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
      StorageService.addReturn(record);
      onNotify(editingId ? 'Perubahan data retur berhasil disimpan!' : 'Data retur paket berhasil disimpan!', 'success');
      loadData();
      resetForm();
      setViewMode('output');
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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.reason.toLowerCase().includes(q) && !(r.recordedBy || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (periodFilter === 'today') return r.date === getTodayString();
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
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-return"
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#FE2C55]" />
                <span>Return &amp; Paket Gagal COD</span>
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            Total Retur: <strong className="text-[#FE2C55]">{formatRupiah(totalNominal)}</strong>
          </div>
        </div>

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
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-return"
            type="button"
            onClick={() => {
              resetForm();
              setViewMode('menu');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Kembali ke Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white">
              {editingId ? '✏️ Edit Data Retur' : 'Input Data Retur Paket'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20">
              Tahap {inputStep} dari 2
            </span>
          </div>
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
            <span>Tanggal &amp; Jumlah Paket</span>
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
            <span>Nominal &amp; Alasan</span>
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

  // ================= 3. OUTPUT & LAPORAN STATE (Tanpa Tab) =================
  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <button
          id="btn-back-menu-from-output-return"
          type="button"
          onClick={() => setViewMode('menu')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kembali ke Menu</span>
        </button>

        {!isEstimateMode && (
          <div className="flex items-center gap-2">
            <button
              id="btn-open-form-from-output-return"
              type="button"
              onClick={() => {
                resetForm();
                setInputStep(1);
                setViewMode('input');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FE2C55] text-white font-extrabold text-xs shadow-md shadow-[#FE2C55]/20 hover:bg-[#FE2C55]/90 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Input Retur Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari alasan / pencatat..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
            />
          </div>

          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          >
            <option value="all">Semua Periode</option>
            <option value="today">Hari Ini</option>
            <option value="weekly">7 Hari Terakhir</option>
            <option value="monthly">Bulan Ini</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400 font-semibold">
          Total: <strong className="text-white">{filteredList.length}</strong> catatan
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-[#161823] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#FE2C55]" />
            <span>Riwayat Paket Retur &amp; Gagal Kirim</span>
          </h3>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Belum ada catatan paket retur pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c10]/60 text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold text-center">Jumlah Paket</th>
                  <th className="p-3 font-semibold text-right">Nominal Retur</th>
                  <th className="p-3 font-semibold">Alasan Retur</th>
                  <th className="p-3 font-semibold">Dicatat Oleh</th>
                  <th className="p-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="p-3 whitespace-nowrap font-medium text-zinc-300">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="p-3 whitespace-nowrap text-center font-bold text-white">
                      {item.packageCount} paket
                    </td>
                    <td className="p-3 whitespace-nowrap text-right font-bold text-[#FE2C55]">
                      {formatRupiah(item.totalAmount)}
                    </td>
                    <td className="p-3 text-zinc-300 max-w-xs truncate">
                      {item.reason}
                    </td>
                    <td className="p-3 text-zinc-400 whitespace-nowrap">
                      {item.recordedBy || '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Edit Retur"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, `${item.packageCount} paket - ${item.reason}`)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
