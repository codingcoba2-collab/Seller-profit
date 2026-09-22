import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { TagihanRecord, CurrentUser, Employee } from '../types';
import { formatRupiah, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from './CommaNumberInput';
import { ThemedSelect } from './ThemedSelect';
import { ConfirmModal } from './ConfirmModal';
import {
  Receipt,
  PlusCircle,
  CheckCircle2,
  Clock,
  User,
  Eye,
  Trash2,
  Search,
  Calendar,
  X,
  ArrowLeft,
  CreditCard,
  Building2,
  History,
  RotateCcw
} from 'lucide-react';

interface TagihanSectionProps {
  currentUser: CurrentUser;
  employees: Employee[];
  tagihanList: TagihanRecord[];
  onRefresh: () => void;
  onBackToMenu: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TagihanSection: React.FC<TagihanSectionProps> = ({
  currentUser,
  employees,
  tagihanList,
  onRefresh,
  onBackToMenu,
  onNotify,
}) => {
  // Filters matching Buku Kas
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'specific' | 'range' | 'weekly' | 'monthly'>('all');
  const [specificDate, setSpecificDate] = useState<string>(getTodayString());
  const [startDate, setStartDate] = useState<string>(getTodayString().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [filterType, setFilterType] = useState<'all' | 'kasbon' | 'dana_talang'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);
  const [isDanaTalangModalOpen, setIsDanaTalangModalOpen] = useState(false);
  const [paymentModalItem, setPaymentModalItem] = useState<TagihanRecord | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<TagihanRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form: Catat Kasbon
  const [kasbonDate, setKasbonDate] = useState(getTodayString());
  const [kasbonEmpId, setKasbonEmpId] = useState(employees[0]?.id || '');
  const [kasbonEmpName, setKasbonEmpName] = useState(employees[0]?.name || '');
  const [kasbonAmount, setKasbonAmount] = useState<number>(200000);
  const [kasbonNotes, setKasbonNotes] = useState('');
  const [kasbonProofImage, setKasbonProofImage] = useState('');

  // Form: Catat Dana Talang
  const [talangDate, setTalangDate] = useState(getTodayString());
  const [talangTitle, setTalangTitle] = useState('Dana Talang Operasional Toko');
  const [talangAmount, setTalangAmount] = useState<number>(1000000);
  const [talangNotes, setTalangNotes] = useState('');
  const [talangProofImage, setTalangProofImage] = useState('');

  // Form: Pembayaran
  const [payDate, setPayDate] = useState(getTodayString());
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');
  const [payProofImage, setPayProofImage] = useState('');

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'save' | 'delete' | 'warning';
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'save',
    onConfirm: () => {},
  });

  // Photo upload helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onNotify('Ukuran file foto maksimal 5MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        onNotify('Foto berhasil diunggah!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Kasbon
  const handleSaveKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (kasbonAmount <= 0) {
      onNotify('Nominal kasbon harus lebih dari 0!', 'error');
      return;
    }
    if (!kasbonEmpName) {
      onNotify('Pilih pegawai peminjam kasbon!', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Catat Kasbon',
      message: `Catat kasbon sebesar ${formatRupiah(kasbonAmount)} untuk ${kasbonEmpName}? Transaksi ini otomatis dicatat ke Buku Tagihan dan Pengeluaran Kas.`,
      type: 'save',
      confirmText: 'Ya, Catat Kasbon',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.createKasbonRecord({
            storeId: currentUser.storeId,
            date: kasbonDate,
            amount: kasbonAmount,
            employeeId: kasbonEmpId,
            employeeName: kasbonEmpName,
            notes: kasbonNotes,
            proofImageUrl: kasbonProofImage || undefined,
          });
          onNotify(`Kasbon ${kasbonEmpName} sebesar ${formatRupiah(kasbonAmount)} berhasil dicatat ke Buku Tagihan!`, 'success');
          setIsKasbonModalOpen(false);
          setKasbonNotes('');
          setKasbonProofImage('');
          onRefresh();
        } catch (err: any) {
          onNotify('Gagal mencatat kasbon: ' + (err?.message || 'Kesalahan sistem'), 'error');
        }
      },
    });
  };

  // Submit Dana Talang
  const handleSaveDanaTalang = (e: React.FormEvent) => {
    e.preventDefault();
    if (talangAmount <= 0) {
      onNotify('Nominal dana talang harus lebih dari 0!', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Catat Dana Talang',
      message: `Catat dana talang sebesar ${formatRupiah(talangAmount)}? Transaksi ini otomatis dicatat ke Riwayat Kas Masuk dan Buku Tagihan.`,
      type: 'save',
      confirmText: 'Ya, Catat Dana Talang',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.createDanaTalangRecord({
            storeId: currentUser.storeId,
            date: talangDate,
            amount: talangAmount,
            title: talangTitle,
            notes: talangNotes,
            proofImageUrl: talangProofImage || undefined,
          });
          onNotify(`Dana talang sebesar ${formatRupiah(talangAmount)} berhasil dicatat ke Buku Tagihan & Riwayat Kas!`, 'success');
          setIsDanaTalangModalOpen(false);
          setTalangNotes('');
          setTalangProofImage('');
          onRefresh();
        } catch (err: any) {
          onNotify('Gagal mencatat dana talang: ' + (err?.message || 'Kesalahan sistem'), 'error');
        }
      },
    });
  };

  // Open Payment Modal
  const openPaymentModal = (item: TagihanRecord) => {
    setPaymentModalItem(item);
    setPayDate(getTodayString());
    setPayNotes('');
    setPayProofImage('');
    if (item.type === 'kasbon') {
      setPayAmount(item.currentBalance);
    } else {
      setPayAmount(Math.abs(item.currentBalance));
    }
  };

  // Process Payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalItem) return;
    if (payAmount <= 0) {
      onNotify('Nominal pembayaran harus lebih dari 0!', 'error');
      return;
    }

    const isKasbon = paymentModalItem.type === 'kasbon';
    const title = isKasbon ? 'Konfirmasi Pembayaran Kasbon' : 'Konfirmasi Perusahaan Bayar Dana Talang';
    const message = isKasbon
      ? `Proses pembayaran kasbon ${paymentModalItem.employeeName || paymentModalItem.title} sebesar ${formatRupiah(payAmount)}? Transaksi ini dicatat ke riwayat pengeluaran kas dan mengurangi sisa tagihan kasbon.`
      : `Proses pelunasan dana talang ${paymentModalItem.title} sebesar ${formatRupiah(payAmount)}? Transaksi ini dicatat ke pengeluaran kas perusahaan dan mengurangi sisa kewajiban dana talang.`;

    setConfirmModal({
      isOpen: true,
      title,
      message,
      type: 'save',
      confirmText: 'Ya, Proses Pembayaran',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          if (isKasbon) {
            StorageService.payKasbonRecord(paymentModalItem.id, {
              date: payDate,
              amount: payAmount,
              notes: payNotes,
              proofImageUrl: payProofImage || undefined,
            });
            onNotify(`Pembayaran kasbon sebesar ${formatRupiah(payAmount)} berhasil dicatat ke Riwayat Kas & Buku Tagihan.`, 'success');
          } else {
            StorageService.payDanaTalangRecord(paymentModalItem.id, {
              date: payDate,
              amount: payAmount,
              notes: payNotes,
              proofImageUrl: payProofImage || undefined,
            });
            onNotify(`Perusahaan membayar dana talang sebesar ${formatRupiah(payAmount)} berhasil dicatat ke Riwayat Kas & Buku Tagihan.`, 'success');
          }
          setPaymentModalItem(null);
          onRefresh();
        } catch (err: any) {
          onNotify('Gagal memproses pembayaran: ' + (err?.message || 'Kesalahan sistem'), 'error');
        }
      },
    });
  };

  // Delete Tagihan
  const handleDelete = (item: TagihanRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Catatan Tagihan',
      message: `Hapus catatan tagihan ${item.title}? Riwayat kas yang sudah dicatat sebelumnya tidak akan dihapus otomatis.`,
      type: 'delete',
      confirmText: 'Ya, Hapus Tagihan',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteTagihan(item.id);
        onNotify('Catatan tagihan berhasil dihapus.', 'info');
        onRefresh();
      },
    });
  };

  // Global Active Totals
  const activeKasbonList = tagihanList.filter(t => t.type === 'kasbon' && t.currentBalance > 0);
  const totalKasbonAktif = activeKasbonList.reduce((sum, t) => sum + t.currentBalance, 0);

  const activeTalangList = tagihanList.filter(t => t.type === 'dana_talang' && t.currentBalance < 0);
  const totalTalangAktif = activeTalangList.reduce((sum, t) => sum + Math.abs(t.currentBalance), 0);

  // Filter list matching CashflowView logic
  const filteredList = tagihanList
    .filter(item => {
      // Type Filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Status Filter
      if (filterStatus === 'unpaid') {
        if (item.type === 'kasbon' && item.currentBalance <= 0) return false;
        if (item.type === 'dana_talang' && item.currentBalance >= 0) return false;
      }
      if (filterStatus === 'paid') {
        if (item.type === 'kasbon' && item.currentBalance > 0) return false;
        if (item.type === 'dana_talang' && item.currentBalance < 0) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchEmp = item.employeeName?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchEmp && !matchNotes) return false;
      }

      // Period Filter
      if (periodFilter === 'today') return item.date === getTodayString();
      if (periodFilter === 'specific') return item.date === specificDate;
      if (periodFilter === 'range') return item.date >= startDate && item.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return item.date >= weekAgo && item.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return item.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Filtered Totals for quick glance
  const filteredKasbonTotal = filteredList
    .filter(t => t.type === 'kasbon')
    .reduce((sum, t) => sum + Math.max(0, t.currentBalance), 0);
  const filteredTalangTotal = filteredList
    .filter(t => t.type === 'dana_talang')
    .reduce((sum, t) => sum + (t.currentBalance < 0 ? Math.abs(t.currentBalance) : 0), 0);

  const isAnyFilterActive =
    periodFilter !== 'all' ||
    filterType !== 'all' ||
    filterStatus !== 'all' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setPeriodFilter('all');
    setFilterType('all');
    setFilterStatus('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header - Consistent with CashflowView */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="p-2 rounded-xl bg-[#0b0c10] hover:bg-[#25F4EE]/20 text-zinc-400 hover:text-[#25F4EE] border border-white/10 transition cursor-pointer"
            title="Kembali ke Buku Kas"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#25F4EE]" />
              <h2 className="text-base sm:text-lg font-black text-white">Buku Tagihan &amp; Dana Talang</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Catatan kasbon pegawai &amp; kewajiban dana talangan toko
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-catat-kasbon"
            type="button"
            onClick={() => {
              if (employees.length > 0) {
                setKasbonEmpId(employees[0].id);
                setKasbonEmpName(employees[0].name);
              }
              setIsKasbonModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Kasbon</span>
          </button>

          <button
            id="btn-catat-dana-talang"
            type="button"
            onClick={() => setIsDanaTalangModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25F4EE]/10 hover:bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            <span>+ Catat Dana Talang</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Cards - Exact Layout & Geometry of CashflowView */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Kasbon Pegawai */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Total Kasbon Pegawai
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
              {activeKasbonList.length} Peminjam Aktif
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-400">
            {formatRupiah(totalKasbonAktif)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            Piutang kasbon toko yang belum lunas atau belum dipotong gaji
          </p>
        </div>

        {/* Card 2: Dana Talang */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-[#FE2C55]/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#FE2C55]" />
              Total Dana Talang
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] font-bold border border-[#FE2C55]/20">
              {activeTalangList.length} Pos Kewajiban
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#FE2C55]">
            {formatRupiah(totalTalangAktif)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            Kewajiban perusahaan yang harus dibayarkan kembali
          </p>
        </div>

        {/* Card 3: Saldo Bersih Tagihan */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#25F4EE]" />
              Saldo Bersih Tagihan
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 font-bold border border-white/10">
              {activeKasbonList.length + activeTalangList.length} Belum Lunas
            </span>
          </div>
          <div className={`text-lg sm:text-xl font-black ${
            totalKasbonAktif >= totalTalangAktif ? 'text-[#25F4EE]' : 'text-amber-400'
          }`}>
            {formatRupiah(totalKasbonAktif - totalTalangAktif)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">
            Selisih piutang kasbon dikurangi kewajiban dana talang
          </p>
        </div>
      </div>

      {/* Filter & Search Bar - Identical to CashflowView */}
      <div className="p-3 bg-[#161823] rounded-2xl border border-white/10 shadow-lg space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari tagihan, pegawai, atau keterangan..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Periode Filter */}
            <ThemedSelect
              value={periodFilter}
              onChange={val => setPeriodFilter(val as any)}
              title="Pilih Periode Tagihan"
              options={[
                { value: 'all', label: 'Semua Periode' },
                { value: 'today', label: 'Hari Ini' },
                { value: 'specific', label: '📅 Pilih Tanggal' },
                { value: 'range', label: '📅 Rentang Tanggal' },
                { value: 'weekly', label: '7 Hari Terakhir' },
                { value: 'monthly', label: 'Bulan Ini' },
              ]}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
            />

            {/* Jenis Tagihan Filter */}
            <ThemedSelect
              value={filterType}
              onChange={val => setFilterType(val as any)}
              title="Pilih Jenis Tagihan"
              options={[
                { value: 'all', label: 'Semua Jenis Tagihan' },
                { value: 'kasbon', label: 'Kasbon Pegawai' },
                { value: 'dana_talang', label: 'Dana Talang' },
              ]}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
            />

            {/* Status Filter */}
            <ThemedSelect
              value={filterStatus}
              onChange={val => setFilterStatus(val as any)}
              title="Pilih Status Tagihan"
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'unpaid', label: 'Belum Lunas' },
                { value: 'paid', label: 'Sudah Lunas' },
              ]}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
            />

            {/* Reset Filter Button */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] border border-white/10 text-[11px] font-bold transition cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <div className="text-xs text-zinc-400 font-semibold px-1 shrink-0">
              Total: <strong className="text-white">{filteredList.length}</strong> tagihan
            </div>
          </div>
        </div>

        {/* Dedicated Date Selectors when specific or range is selected */}
        {periodFilter === 'specific' && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-zinc-400 font-medium">Tanggal:</span>
            <input
              type="date"
              value={specificDate}
              onChange={e => setSpecificDate(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl bg-[#0b0c10] border border-[#25F4EE]/40 text-white font-semibold focus:outline-none"
            />
          </div>
        )}

        {periodFilter === 'range' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-zinc-400 font-medium">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:outline-none"
            />
            <span className="text-zinc-400 font-medium">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:outline-none"
            />
          </div>
        )}

        {/* Quick summary strip matching CashflowView */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
          <div>
            Filter:{' '}
            <span className="text-zinc-300 font-medium">
              {periodFilter === 'all'
                ? 'Semua Periode'
                : periodFilter === 'today'
                ? 'Hari Ini'
                : periodFilter === 'specific'
                ? `Tanggal ${formatDateIndo(specificDate)}`
                : periodFilter === 'range'
                ? `${formatDateIndo(startDate)} - ${formatDateIndo(endDate)}`
                : periodFilter === 'weekly'
                ? '7 Hari Terakhir'
                : 'Bulan Ini'}
            </span>
            {filterType !== 'all' && (
              <span className="ml-2 text-amber-400 font-semibold">
                • {filterType === 'kasbon' ? 'Kasbon Pegawai' : 'Dana Talang'}
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="ml-2 text-cyan-300 font-semibold">
                • {filterStatus === 'unpaid' ? 'Belum Lunas' : 'Sudah Lunas'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-semibold text-xs">
            <span>
              Kasbon: <strong className="text-amber-400">{formatRupiah(filteredKasbonTotal)}</strong>
            </span>
            <span>
              Dana Talang: <strong className="text-[#FE2C55]">{formatRupiah(filteredTalangTotal)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* List Tagihan - Exact Banking List Format of CashflowView */}
      {filteredList.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#161823] border border-white/10 text-zinc-400 space-y-2">
          <Receipt className="w-10 h-10 mx-auto text-zinc-600 mb-1" />
          <div className="text-sm font-bold text-white">Tidak Ada Catatan Tagihan</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {isAnyFilterActive
              ? 'Tidak ada data tagihan yang sesuai dengan filter pencarian.'
              : 'Gunakan tombol "+ Catat Kasbon" atau "+ Catat Dana Talang" di bagian atas untuk mencatat data baru.'}
          </p>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredList.map(item => {
            const isKasbon = item.type === 'kasbon';
            const isPaid = isKasbon ? item.currentBalance <= 0 : item.currentBalance >= 0;
            const remainingBalance = Math.abs(item.currentBalance);

            return (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition-all shadow-sm space-y-2"
              >
                {/* Top Row: Date Badge on Left, Action Buttons on Right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodFilter('specific');
                        setSpecificDate(item.date);
                      }}
                      title={`Filter hanya tanggal ${formatDateIndo(item.date)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300 hover:border-[#25F4EE]/50 hover:text-[#25F4EE] transition cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-[#25F4EE]" />
                      <span>{formatDateIndo(item.date)}</span>
                    </button>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isKasbon
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/20'
                    }`}>
                      {isKasbon ? 'Kasbon Pegawai' : 'Dana Talang'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      isPaid
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.history && item.history.length > 0
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lunas</span>
                        </>
                      ) : item.history && item.history.length > 0 ? (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Dicicil Sebagian</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Belum Lunas</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* View Proof Photo */}
                    {item.proofImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(item.proofImageUrl || null)}
                        className="p-1.5 rounded-lg bg-[#0b0c10] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
                        title="Lihat Bukti Foto"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#25F4EE]" />
                      </button>
                    )}

                    {/* View Payment History */}
                    {item.history && item.history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistoryModalItem(item)}
                        className="p-1.5 rounded-lg bg-[#0b0c10] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
                        title="Riwayat Pembayaran"
                      >
                        <History className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    )}

                    {/* Pay Button */}
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => openPaymentModal(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer ${
                          isKasbon
                            ? 'bg-amber-500 hover:bg-amber-600 text-black'
                            : 'bg-[#25F4EE] hover:bg-[#20ded8] text-black'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>{isKasbon ? 'Bayar Kasbon' : 'Bayar Talangan'}</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-[#0b0c10] hover:bg-[#FE2C55]/20 text-zinc-500 hover:text-[#FE2C55] border border-white/10 transition cursor-pointer"
                      title="Hapus Catatan Tagihan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Row: Nominal on Left, Category/Title on Right */}
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-base sm:text-lg font-black tracking-tight ${
                      isPaid
                        ? 'text-emerald-400'
                        : isKasbon
                        ? 'text-amber-400'
                        : 'text-[#FE2C55]'
                    }`}>
                      {isPaid ? 'Rp 0 (Lunas)' : `Sisa: ${formatRupiah(remainingBalance)}`}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Total Awal: {formatRupiah(item.initialAmount)}
                    </div>
                  </div>

                  <div className="text-right min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold text-white truncate">
                      {item.title}
                    </div>
                    {item.employeeName && (
                      <div className="text-[11px] text-amber-400 font-medium truncate">
                        Pegawai: {item.employeeName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Description / Catatan & Payment Progress */}
                <div className="pt-1.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-400">
                  <div className="truncate">
                    {item.notes ? (
                      <>
                        <span className="text-zinc-500 font-medium">Catatan: </span>
                        <span>{item.notes}</span>
                      </>
                    ) : (
                      <span className="text-zinc-500 italic">Tidak ada catatan</span>
                    )}
                  </div>
                  {item.history && item.history.length > 0 && (
                    <div className="text-emerald-400/90 text-[10px] sm:text-[11px] font-semibold shrink-0">
                      Terbayar: {formatRupiah(item.initialAmount - remainingBalance)} ({item.history.length}x pembayaran)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1: CATAT KASBON ================= */}
      {isKasbonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161823] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Catat Kasbon Pegawai</h3>
                  <p className="text-[10px] text-zinc-400">Otomatis dicatat ke Buku Tagihan dan Pengeluaran Kas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKasbonModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKasbon} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Pilih Pegawai <span className="text-[#FE2C55]">*</span>
                </label>
                {employees.length === 0 ? (
                  <div className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    Belum ada pegawai terdaftar. Tambahkan pegawai di menu Tim &amp; Gaji terlebih dahulu.
                  </div>
                ) : (
                  <ThemedSelect
                    value={kasbonEmpId}
                    onChange={val => {
                      setKasbonEmpId(val);
                      const emp = employees.find(e => e.id === val);
                      if (emp) setKasbonEmpName(emp.name);
                    }}
                    title="Pilih Pegawai"
                    options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.role})` }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Kasbon <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={kasbonDate}
                    onChange={e => setKasbonDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nominal Kasbon <span className="text-[#FE2C55]">*</span>
                  </label>
                  <CommaNumberInput
                    value={kasbonAmount}
                    onChange={val => setKasbonAmount(val)}
                    placeholder="Rp 0"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-amber-400 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Keterangan / Keperluan Kasbon
                </label>
                <input
                  type="text"
                  placeholder="Misal: Keperluan mendadak / servis motor"
                  value={kasbonNotes}
                  onChange={e => setKasbonNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Foto Bukti Transfer / Struk (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handlePhotoUpload(e, setKasbonProofImage)}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0b0c10] file:text-amber-400 hover:file:bg-white/10 cursor-pointer"
                />
                {kasbonProofImage && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-amber-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Foto bukti berhasil dipilih</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsKasbonModalOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={employees.length === 0}
                  className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-black rounded-xl transition shadow-md disabled:opacity-50"
                >
                  Simpan Catatan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CATAT DANA TALANG ================= */}
      {isDanaTalangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161823] border border-[#25F4EE]/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#25F4EE]" />
                <div>
                  <h3 className="text-sm font-black text-white">Catat Dana Talang Masuk</h3>
                  <p className="text-[10px] text-zinc-400">Otomatis dicatat ke Riwayat Kas Masuk dan Buku Tagihan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDanaTalangModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDanaTalang} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nama / Keperluan Dana Talang <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dana Talang Beli Ball / Talangan Iklan"
                  value={talangTitle}
                  onChange={e => setTalangTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Masuk <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={talangDate}
                    onChange={e => setTalangDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nominal Dana Talang <span className="text-[#FE2C55]">*</span>
                  </label>
                  <CommaNumberInput
                    value={talangAmount}
                    onChange={val => setTalangAmount(val)}
                    placeholder="Rp 0"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Catatan / Keterangan Sumber Talangan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Dari kas pusat / talangan owner"
                  value={talangNotes}
                  onChange={e => setTalangNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Foto Bukti Transfer (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handlePhotoUpload(e, setTalangProofImage)}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0b0c10] file:text-[#25F4EE] hover:file:bg-white/10 cursor-pointer"
                />
                {talangProofImage && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#25F4EE] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Foto bukti berhasil dipilih</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDanaTalangModalOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black bg-[#25F4EE] hover:bg-[#20ded8] text-black rounded-xl transition shadow-md"
                >
                  Simpan Dana Talang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: BAYAR TAGIHAN ================= */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161823] border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#25F4EE]" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    {paymentModalItem.type === 'kasbon' ? 'Bayar / Lunasi Kasbon' : 'Perusahaan Bayar Dana Talang'}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {paymentModalItem.type === 'kasbon'
                      ? 'Dicatat ke pengeluaran kas dan mengurangi tagihan kasbon'
                      : 'Dicatat ke pengeluaran kas perusahaan dan mengurangi saldo dana talang'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Tagihan Card Info */}
            <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/10 space-y-1 text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="font-bold">{paymentModalItem.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                  {paymentModalItem.type === 'kasbon' ? 'Kasbon Pegawai' : 'Dana Talang'}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                <span>Total Awal: {formatRupiah(paymentModalItem.initialAmount)}</span>
                <span className="font-bold text-amber-400">
                  Sisa Tagihan: {formatRupiah(Math.abs(paymentModalItem.currentBalance))}
                </span>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Bayar <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nominal Pembayaran <span className="text-[#FE2C55]">*</span>
                  </label>
                  <CommaNumberInput
                    value={payAmount}
                    onChange={val => setPayAmount(val)}
                    placeholder="Rp 0"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-black"
                  />
                </div>
              </div>

              {/* Quick shortcut buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayAmount(Math.abs(paymentModalItem.currentBalance))}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30"
                >
                  Lunasi Penuh ({formatRupiah(Math.abs(paymentModalItem.currentBalance))})
                </button>
                {Math.abs(paymentModalItem.currentBalance) > 100000 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(Math.abs(paymentModalItem.currentBalance) / 2))}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30"
                  >
                    Bayar 50%
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Catatan / Keterangan Pembayaran
                </label>
                <input
                  type="text"
                  placeholder="Misal: Pelunasan tunai / transfer"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Foto Bukti Transfer (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handlePhotoUpload(e, setPayProofImage)}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0b0c10] file:text-[#25F4EE] hover:file:bg-white/10 cursor-pointer"
                />
                {payProofImage && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#25F4EE] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Foto bukti berhasil dipilih</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black bg-[#25F4EE] hover:bg-[#20ded8] text-black rounded-xl transition shadow-md"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: PAYMENT HISTORY ================= */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161823] border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Riwayat Pembayaran &amp; Potongan</h3>
                  <p className="text-[10px] text-zinc-400">{historyModalItem.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(!historyModalItem.history || historyModalItem.history.length === 0) ? (
                <div className="text-xs text-zinc-500 text-center py-4">Belum ada riwayat pembayaran.</div>
              ) : (
                historyModalItem.history.map(hist => (
                  <div key={hist.id} className="p-2.5 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{formatRupiah(hist.amount)}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {formatDateIndo(hist.date)} {hist.notes ? `• ${hist.notes}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 font-semibold border border-white/10">
                      {hist.type === 'potong_gaji' ? 'Potong Gaji' : hist.type === 'bayar_kasbon' ? 'Bayar Kasbon' : 'Bayar Talangan'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalItem(null)}
                className="px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: PHOTO PREVIEW ================= */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-[#161823] border border-white/20 rounded-2xl p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-zinc-300 mb-2 px-1">Bukti Transaksi</div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={previewPhotoUrl}
                alt="Bukti Transaksi"
                className="max-h-[75vh] w-auto object-contain"
              />
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
