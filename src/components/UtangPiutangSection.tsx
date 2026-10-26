import React, { useState, useMemo, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { TagihanRecord, CurrentUser, Employee, UtangPiutangType, TagihanPaymentHistory } from '../types';
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
  HandCoins,
  DollarSign,
  AlertCircle,
  Users,
  Package,
  Landmark,
  ArrowUp,
  ArrowDown,
  Wallet,
  ChevronDown
} from 'lucide-react';

interface UtangPiutangSectionProps {
  currentUser: CurrentUser;
  employees: Employee[];
  tagihanList: TagihanRecord[];
  onRefresh: () => void;
  onBackToMenu: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  externalAddTrigger?: number;
}

export type UtangPiutangTab = 'all' | 'piutang' | 'kasbon' | 'utang_supplier' | 'pinjaman';

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

export const UtangPiutangSection: React.FC<UtangPiutangSectionProps> = ({
  currentUser,
  employees,
  tagihanList,
  onRefresh,
  onBackToMenu,
  onNotify,
  externalAddTrigger,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<UtangPiutangTab>('all');

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Period & Search Filter
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'specific' | 'range' | 'weekly' | 'monthly'>('all');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [specificDate, setSpecificDate] = useState<string>(getTodayString());
  const [startDate, setStartDate] = useState<string>(getTodayString().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentModalItem, setPaymentModalItem] = useState<TagihanRecord | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<TagihanRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<TagihanRecord | null>(null);

  // External Add Trigger from Cashflow header
  useEffect(() => {
    if (externalAddTrigger && externalAddTrigger > 0) {
      openAddModal(activeTab === 'all' ? 'piutang' : activeTab);
    }
  }, [externalAddTrigger]);

  // Form: Catat Baru
  const [formType, setFormType] = useState<UtangPiutangType>('piutang');
  const [formDate, setFormDate] = useState(getTodayString());
  const [formDueDate, setFormDueDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState(employees[0]?.id || '');
  const [formEmployeeName, setFormEmployeeName] = useState(employees[0]?.name || '');
  const [formAmount, setFormAmount] = useState<number>(500000);
  const [formNotes, setFormNotes] = useState('');
  const [formProofImage, setFormProofImage] = useState('');
  const [formSyncToCashflow, setFormSyncToCashflow] = useState(true);

  // Form: Bayar / Cicil
  const [payDate, setPayDate] = useState(getTodayString());
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');
  const [payProofImage, setPayProofImage] = useState('');
  const [paySyncToCashflow, setPaySyncToCashflow] = useState(true);

  // Confirmation Modal
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

  // Photo Upload Handler
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

  // Open Add Modal
  const openAddModal = (defaultType: UtangPiutangType = 'piutang') => {
    setFormType(defaultType);
    setFormDate(getTodayString());
    setFormDueDate('');
    setFormAmount(500000);
    setFormNotes('');
    setFormProofImage('');
    setFormSyncToCashflow(true);

    if (defaultType === 'kasbon') {
      const emp = employees[0];
      setFormEmployeeId(emp?.id || '');
      setFormEmployeeName(emp?.name || '');
      setFormTitle(`Kasbon - ${emp?.name || 'Pegawai'}`);
      setFormContactName(emp?.name || '');
    } else if (defaultType === 'piutang') {
      setFormTitle('Piutang Penjualan Pelanggan');
      setFormContactName('');
    } else if (defaultType === 'utang_supplier') {
      setFormTitle('Utang Belanja Stok Supplier');
      setFormContactName('');
    } else if (defaultType === 'pinjaman') {
      setFormTitle('Pinjaman Usaha');
      setFormContactName('');
    }
    setIsAddModalOpen(true);
  };

  // Submit Add
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      onNotify('Nominal harus lebih dari 0!', 'error');
      return;
    }

    let contact = formContactName.trim();
    if (formType === 'kasbon') {
      contact = formEmployeeName.trim();
      if (!contact) {
        onNotify('Pilih pegawai untuk kasbon!', 'error');
        return;
      }
    } else if (!contact) {
      onNotify('Nama pihak terkait (pelanggan / supplier / pemberi pinjaman) wajib diisi!', 'error');
      return;
    }

    const title = formTitle.trim() || `${getTypeLabel(formType)} - ${contact}`;

    const typeLabel = getTypeLabel(formType);
    setConfirmModal({
      isOpen: true,
      title: `Konfirmasi Catat ${typeLabel}`,
      message: `Apakah Anda yakin ingin mencatat ${typeLabel} sebesar ${formatRupiah(formAmount)} untuk "${contact}"?`,
      type: 'save',
      confirmText: 'Ya, Simpan Catatan',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.createUtangPiutangRecord({
            storeId: currentUser.storeId,
            date: formDate,
            type: formType,
            title,
            initialAmount: formAmount,
            contactName: contact,
            employeeId: formType === 'kasbon' ? formEmployeeId : undefined,
            employeeName: formType === 'kasbon' ? formEmployeeName : undefined,
            customerName: formType === 'piutang' ? contact : undefined,
            supplierName: formType === 'utang_supplier' ? contact : undefined,
            lenderName: formType === 'pinjaman' ? contact : undefined,
            dueDate: formDueDate || undefined,
            notes: formNotes,
            proofImageUrl: formProofImage || undefined,
            recordToCashflow: formSyncToCashflow,
          });

          onNotify(`${typeLabel} sebesar ${formatRupiah(formAmount)} berhasil dicatat!`, 'success');
          setIsAddModalOpen(false);
          onRefresh();
        } catch (err: any) {
          onNotify('Gagal menyimpan: ' + (err?.message || 'Terjadi kesalahan sistem'), 'error');
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
    setPaySyncToCashflow(true);
    setPayAmount(Math.abs(item.currentBalance));
  };

  // Process Payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalItem) return;
    if (payAmount <= 0) {
      onNotify('Nominal pembayaran harus lebih dari 0!', 'error');
      return;
    }

    const maxAmount = Math.abs(paymentModalItem.currentBalance);
    if (payAmount > maxAmount) {
      onNotify(`Nominal pembayaran melebihi sisa tagihan (${formatRupiah(maxAmount)})!`, 'error');
      return;
    }

    const itemLabel = getTypeLabel(paymentModalItem.type);
    const targetName = paymentModalItem.contactName || paymentModalItem.employeeName || paymentModalItem.title;

    setConfirmModal({
      isOpen: true,
      title: `Konfirmasi Pembayaran / Cicilan ${itemLabel}`,
      message: `Proses pembayaran ${itemLabel} untuk "${targetName}" sebesar ${formatRupiah(payAmount)}?`,
      type: 'save',
      confirmText: 'Ya, Proses Pembayaran',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.payUtangPiutangRecord(paymentModalItem.id, {
            date: payDate,
            amount: payAmount,
            notes: payNotes,
            proofImageUrl: payProofImage || undefined,
            recordToCashflow: paySyncToCashflow,
          });

          onNotify(`Pembayaran sebesar ${formatRupiah(payAmount)} berhasil diproses!`, 'success');
          setPaymentModalItem(null);
          onRefresh();
        } catch (err: any) {
          onNotify('Gagal memproses pembayaran: ' + (err?.message || 'Kesalahan sistem'), 'error');
        }
      },
    });
  };

  // Delete
  const handleDelete = (item: TagihanRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Catatan',
      message: `Apakah Anda yakin ingin menghapus catatan "${item.title}"? Riwayat dan saldo akan dihapus.`,
      type: 'delete',
      confirmText: 'Ya, Hapus',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.deleteTagihan(item.id);
          onNotify('Catatan berhasil dihapus!', 'info');
          onRefresh();
        } catch (err: any) {
          onNotify('Gagal menghapus: ' + (err?.message || 'Kesalahan sistem'), 'error');
        }
      },
    });
  };

  // Helper label & badges
  function getTypeLabel(type: UtangPiutangType): string {
    switch (type) {
      case 'piutang': return 'Piutang';
      case 'kasbon': return 'Kasbon Pegawai';
      case 'utang_supplier': return 'Utang Supplier';
      case 'pinjaman':
      case 'dana_talang': return 'Pinjaman';
      default: return 'Utang / Piutang';
    }
  }

  function getTypeBadge(type: UtangPiutangType) {
    switch (type) {
      case 'piutang':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">Piutang (Hak Kita)</span>;
      case 'kasbon':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">Kasbon Pegawai</span>;
      case 'utang_supplier':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/30">Utang Supplier</span>;
      case 'pinjaman':
      case 'dana_talang':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">Pinjaman Usaha</span>;
      default:
        return null;
    }
  }

  // Filter List
  const filteredList = useMemo(() => {
    return tagihanList
      .filter(item => {
        // Tab filter
        if (activeTab === 'piutang' && item.type !== 'piutang') return false;
        if (activeTab === 'kasbon' && item.type !== 'kasbon') return false;
        if (activeTab === 'utang_supplier' && item.type !== 'utang_supplier') return false;
        if (activeTab === 'pinjaman' && item.type !== 'pinjaman' && item.type !== 'dana_talang') return false;

        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;

        // Period filter
        if (periodFilter === 'today') {
          if (item.date !== getTodayString()) return false;
        } else if (periodFilter === 'specific') {
          if (item.date !== specificDate) return false;
        } else if (periodFilter === 'range') {
          if (item.date < startDate || item.date > endDate) return false;
        } else if (periodFilter === 'weekly') {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          const minDate = d.toISOString().slice(0, 10);
          if (item.date < minDate) return false;
        } else if (periodFilter === 'monthly') {
          const curMonth = getTodayString().slice(0, 7);
          if (!item.date.startsWith(curMonth)) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (item.title || '').toLowerCase().includes(q);
          const matchContact = (item.contactName || item.employeeName || '').toLowerCase().includes(q);
          const matchNotes = (item.notes || '').toLowerCase().includes(q);
          if (!matchTitle && !matchContact && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Urutan menurut tanggal transaksi dari paling lama di bawah (terbaru di atas)
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeA = new Date(a.createdAt || a.date).getTime() || 0;
        const timeB = new Date(b.createdAt || b.date).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [tagihanList, activeTab, statusFilter, periodFilter, specificDate, startDate, endDate, searchQuery]);

  // Totals
  const totalPiutang = useMemo(() => {
    return tagihanList
      .filter(t => t.type === 'piutang' && t.status !== 'paid')
      .reduce((sum, t) => sum + Math.abs(t.currentBalance), 0);
  }, [tagihanList]);

  const totalKasbon = useMemo(() => {
    return tagihanList
      .filter(t => t.type === 'kasbon' && t.status !== 'paid')
      .reduce((sum, t) => sum + Math.abs(t.currentBalance), 0);
  }, [tagihanList]);

  const totalUtangSupplier = useMemo(() => {
    return tagihanList
      .filter(t => t.type === 'utang_supplier' && t.status !== 'paid')
      .reduce((sum, t) => sum + Math.abs(t.currentBalance), 0);
  }, [tagihanList]);

  const totalPinjaman = useMemo(() => {
    return tagihanList
      .filter(t => (t.type === 'pinjaman' || t.type === 'dana_talang') && t.status !== 'paid')
      .reduce((sum, t) => sum + Math.abs(t.currentBalance), 0);
  }, [tagihanList]);

  // Counts
  const countPiutang = tagihanList.filter(t => t.type === 'piutang').length;
  const countKasbon = tagihanList.filter(t => t.type === 'kasbon').length;
  const countSupplier = tagihanList.filter(t => t.type === 'utang_supplier').length;
  const countPinjaman = tagihanList.filter(t => t.type === 'pinjaman' || t.type === 'dana_talang').length;

  const periodLabelMap: Record<string, string> = {
    all: 'Semua Periode',
    today: 'Hari Ini',
    weekly: '7 Hari Terakhir',
    monthly: 'Bulan Ini',
    specific: 'Pilih Tanggal',
    range: 'Rentang Tanggal',
  };

  return (
    <div className="space-y-2.5 sm:space-y-3.5">
      {/* =========================================================================
          TOP SUMMARY CARDS (SELALU 3 KOLOM SESUAI CATATAN KAS)
          ========================================================================= */}
      <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
        <div className="grid grid-cols-3 divide-x divide-[#142239]">
          {/* 1. Total Piutang */}
          <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00e676]/10 border border-[#00e676] text-[#00e676] flex items-center justify-center shrink-0">
                <ArrowUp className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
              </div>
              <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                Piutang &amp; Kasbon
              </span>
            </div>
            <div className="text-[#00e676] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
              {formatRupiah(totalPiutang + totalKasbon)}
            </div>
          </div>

          {/* 2. Total Utang */}
          <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#ff3366]/10 border border-[#ff3366] text-[#ff3366] flex items-center justify-center shrink-0">
                <ArrowDown className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
              </div>
              <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                Utang &amp; Pinjaman
              </span>
            </div>
            <div className="text-[#ff3366] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
              {formatRupiah(totalUtangSupplier + totalPinjaman)}
            </div>
          </div>

          {/* 3. Saldo Bersih */}
          <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 text-[#00d2ff] flex items-center justify-center shrink-0">
                <Wallet className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                Saldo Bersih
              </span>
            </div>
            <div className="text-[#00d2ff] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
              {formatRupiah((totalPiutang + totalKasbon) - (totalUtangSupplier + totalPinjaman))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILTER PILLS (PERSIS SEPERTI CATATAN KAS)
          ========================================================================= */}
      <div className="space-y-1.5 sm:space-y-2">
        {/* Row 1: Kategori */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'piutang', label: 'Piutang' },
            { key: 'kasbon', label: 'Kasbon Pegawai' },
            { key: 'utang_supplier', label: 'Utang Supplier' },
            { key: 'pinjaman', label: 'Pinjaman Usaha' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                  : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { key: 'all', label: 'Semua Status' },
            { key: 'unpaid', label: 'Belum Lunas' },
            { key: 'partial', label: 'Dicicil Sebagian' },
            { key: 'paid', label: 'Lunas ✓' },
          ].map(st => (
            <button
              key={st.key}
              type="button"
              onClick={() => setStatusFilter(st.key as any)}
              className={`px-2.5 sm:px-3 py-0.5 rounded-full text-[8px] sm:text-[10px] font-semibold transition cursor-pointer shrink-0 ${
                statusFilter === st.key
                  ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40'
                  : 'bg-[#0a1322] border border-[#162544] text-slate-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Row 3: Periode Dropdown & Search Input (Pas sebaris menyesuaikan layar) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Periode Picker Dropdown Pill */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-2.5 cursor-pointer transition text-left"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#00e5ff] shrink-0" />
                <div>
                  <span className="text-[6.5px] sm:text-[8px] text-slate-400 font-medium block leading-none">Periode</span>
                  <span className="text-[8.5px] sm:text-[11px] text-white font-semibold block leading-tight mt-0.5 whitespace-nowrap">
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
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setPeriodFilter(p.key as any);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                      periodFilter === p.key
                        ? 'bg-[#00f2fe]/15 text-[#00f2fe]'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{p.label}</span>
                    {periodFilter === p.key && <CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" />}
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
              className="px-2 py-1 text-[9px] sm:text-[10px] rounded-xl bg-[#0a1322] border border-[#162544] text-white outline-none shrink-0"
            />
          )}

          {/* Date Range inputs if selected */}
          {periodFilter === 'range' && (
            <div className="flex items-center gap-1 text-[9px]">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-1.5 py-1 text-[9px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-1.5 py-1 text-[9px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
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
              placeholder="Cari pihak / judul..."
              className="w-full bg-transparent text-white placeholder-slate-500 text-[9px] sm:text-xs focus:outline-none"
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
      </div>

      {/* =========================================================================
          TABLE CONTAINER (LEBAR PAS KE LAYAR 100% PERSIS CATATAN KAS)
          ========================================================================= */}
      <div className="bg-[#09111e]/95 border border-[#14233c] rounded-2xl overflow-hidden shadow-2xl w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-[#14233c] text-slate-300 font-semibold text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs bg-[#0a1220]">
              <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[15%] whitespace-nowrap">Tanggal</th>
              <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[35%] whitespace-nowrap">Pihak &amp; Keterangan</th>
              <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Nominal Awal</th>
              <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Sisa Tagihan</th>
              <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-right w-[17%] whitespace-nowrap">Aksi / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#132038]">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  Tidak ada catatan utang &amp; piutang pada filter ini.
                </td>
              </tr>
            ) : (
              filteredList.map(item => {
                const isSettled = item.status === 'paid';
                const isPartial = item.status === 'partial';
                const balanceAmount = Math.abs(item.currentBalance);
                const contactName = item.contactName || item.employeeName || item.customerName || item.supplierName || item.lenderName || item.title;

                // Icon and bg based on type
                let icon = <Users className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />;
                let iconBg = 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]';
                let typeBadgeText = 'Piutang';
                let typeBadgeClass = 'bg-[#0d213b] text-[#38bdf8] border-[#1a4275]';

                if (item.type === 'kasbon') {
                  icon = <User className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />;
                  iconBg = 'bg-[#241738] border border-[#4c2777] text-[#a855f7]';
                  typeBadgeText = 'Kasbon';
                  typeBadgeClass = 'bg-[#1a1c44] text-[#818cf8] border-[#323682]';
                } else if (item.type === 'utang_supplier') {
                  icon = <Package className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />;
                  iconBg = 'bg-[#371322] border border-[#831e3d] text-[#ff3366]';
                  typeBadgeText = 'Utang Supplier';
                  typeBadgeClass = 'bg-[#36190f] text-[#fb923c] border-[#6b311c]';
                } else if (item.type === 'pinjaman' || item.type === 'dana_talang') {
                  icon = <Landmark className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />;
                  iconBg = 'bg-[#33250e] border border-[#78541a] text-[#f59e0b]';
                  typeBadgeText = 'Pinjaman';
                  typeBadgeClass = 'bg-[#2d1f0d] text-[#fbbf24] border-[#5d4117]';
                }

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedDetailItem(item)}
                    className="border-b border-[#132038] last:border-b-0 hover:bg-[#0e1c36] transition cursor-pointer group"
                    title="Klik untuk melihat rincian & aksi pembayaran"
                  >
                    {/* Tanggal */}
                    <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs font-medium text-slate-300 whitespace-nowrap">
                      <span>{formatScreenshotDate(item.date)}</span>
                    </td>

                    {/* Pihak & Keterangan: Icon + Nama/Judul + Badge */}
                    <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2">
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
                        <div className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[7px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs font-bold text-white block leading-tight truncate group-hover:text-cyan-300 transition">
                            {contactName}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className={`inline-block text-[5.5px] xs:text-[6px] sm:text-[7px] font-semibold px-0.5 xs:px-1 py-[0.5px] rounded border ${typeBadgeClass} leading-none whitespace-nowrap`}>
                              {typeBadgeText}
                            </span>
                            <span className={`inline-block text-[5.5px] xs:text-[6px] sm:text-[7px] font-semibold px-0.5 xs:px-1 py-[0.5px] rounded border leading-none whitespace-nowrap ${
                              isSettled
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                                : isPartial
                                ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                                : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                            }`}>
                              {isSettled ? 'Lunas' : isPartial ? 'Dicicil' : 'Belum Lunas'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Nominal Awal */}
                    <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                      <span className="text-slate-300 font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                        {formatRupiah(item.initialAmount)}
                      </span>
                    </td>

                    {/* Sisa Tagihan */}
                    <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                      <span className={`font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block ${
                        isSettled
                          ? 'text-slate-500 line-through'
                          : item.type === 'piutang' || item.type === 'kasbon'
                          ? 'text-[#00e676]'
                          : 'text-[#ff3366]'
                      }`}>
                        {formatRupiah(balanceAmount)}
                      </span>
                    </td>

                    {/* Aksi / Status */}
                    <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-right">
                      {isSettled ? (
                        <span className="text-emerald-400 font-bold text-[6.5px] xs:text-[7px] sm:text-[8px] whitespace-nowrap block text-right">
                          Lunas ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            openPaymentModal(item);
                          }}
                          className="px-1.5 xs:px-2 py-0.5 rounded-full bg-[#00f2fe] text-black font-extrabold text-[6.5px] xs:text-[7px] sm:text-[8px] hover:brightness-110 active:scale-95 transition cursor-pointer shadow ml-auto block"
                        >
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          DETAIL UTANG / PIUTANG MODAL (KLIK BARIS)
          ========================================================================= */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-[9990] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0a1220] rounded-3xl border border-[#1b2b48] p-5 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#14233c] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-[#00f2fe]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Detail Utang &amp; Piutang</h4>
                  <span className="text-xs text-slate-400">
                    {formatScreenshotDate(selectedDetailItem.date)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#080f1b] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pihak Terkait:</span>
                  <span className="text-white font-bold">
                    {selectedDetailItem.contactName || selectedDetailItem.employeeName || selectedDetailItem.customerName || selectedDetailItem.supplierName || selectedDetailItem.lenderName || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Keterangan:</span>
                  <span className="text-white font-semibold">{selectedDetailItem.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jenis:</span>
                  <span className="font-bold text-[#00f2fe] uppercase text-[11px]">{getTypeLabel(selectedDetailItem.type)}</span>
                </div>
                {selectedDetailItem.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Jatuh Tempo:</span>
                    <span className="text-amber-400 font-bold">{formatScreenshotDate(selectedDetailItem.dueDate)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-[#080f1b] border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Nominal Awal</span>
                  <span className="text-white font-black text-sm block mt-0.5">
                    {formatRupiah(selectedDetailItem.initialAmount)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#080f1b] border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Sisa Tagihan</span>
                  <span className={`font-black text-sm block mt-0.5 ${
                    selectedDetailItem.status === 'paid' ? 'text-slate-500 line-through' : 'text-[#ff3366]'
                  }`}>
                    {formatRupiah(Math.abs(selectedDetailItem.currentBalance))}
                  </span>
                </div>
              </div>

              {selectedDetailItem.notes && (
                <div className="p-3 rounded-2xl bg-[#080f1b] border border-white/5">
                  <span className="text-slate-400 block text-[11px] mb-1">Catatan Tambahan:</span>
                  <p className="text-slate-200 text-xs italic">{selectedDetailItem.notes}</p>
                </div>
              )}

              {selectedDetailItem.proofImageUrl && (
                <div className="p-2.5 rounded-2xl bg-[#080f1b] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedDetailItem.proofImageUrl}
                      alt="Nota"
                      className="w-10 h-10 object-cover rounded-lg border border-white/10"
                    />
                    <span className="text-slate-300 font-medium">Foto Bukti Terlampir</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoUrl(selectedDetailItem.proofImageUrl!)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-cyan-300 font-bold cursor-pointer"
                  >
                    Lihat Foto
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#14233c]">
              <button
                type="button"
                onClick={() => {
                  const it = selectedDetailItem;
                  setSelectedDetailItem(null);
                  handleDelete(it);
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <div className="flex items-center gap-2">
                {(selectedDetailItem.history && selectedDetailItem.history.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const it = selectedDetailItem;
                      setSelectedDetailItem(null);
                      setHistoryModalItem(it);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat ({selectedDetailItem.history.length})</span>
                  </button>
                )}

                {selectedDetailItem.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      const it = selectedDetailItem;
                      setSelectedDetailItem(null);
                      openPaymentModal(it);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00f2fe] text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 hover:brightness-110 cursor-pointer transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bayar / Cicil</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CATAT BARU UTANG / PIUTANG
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[#161823] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#25F4EE]" />
                <span>Catat Utang / Piutang Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Pilihan Jenis */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Pilih Jenis Catatan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('piutang');
                      setFormTitle('Piutang Penjualan Pelanggan');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border ${
                      formType === 'piutang'
                        ? 'bg-[#25F4EE]/20 text-[#25F4EE] border-[#25F4EE]'
                        : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Piutang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('kasbon');
                      const emp = employees[0];
                      setFormEmployeeId(emp?.id || '');
                      setFormEmployeeName(emp?.name || '');
                      setFormTitle(`Kasbon - ${emp?.name || 'Pegawai'}`);
                      setFormContactName(emp?.name || '');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border ${
                      formType === 'kasbon'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                        : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Kasbon Pegawai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('utang_supplier');
                      setFormTitle('Utang Belanja Stok Supplier');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border ${
                      formType === 'utang_supplier'
                        ? 'bg-[#FE2C55]/20 text-[#FE2C55] border-[#FE2C55]'
                        : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Utang Supplier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('pinjaman');
                      setFormTitle('Pinjaman Usaha');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer border ${
                      formType === 'pinjaman'
                        ? 'bg-amber-400/20 text-amber-400 border-amber-400'
                        : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span>Pinjaman</span>
                  </button>
                </div>
              </div>

              {/* Tanggal & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Transaksi:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Jatuh Tempo (Opsional):
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              {/* Pihak Terkait (Pegawai vs Contact Name) */}
              {formType === 'kasbon' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Pilih Pegawai Peminjam Kasbon:
                  </label>
                  <ThemedSelect
                    value={formEmployeeId}
                    onChange={val => {
                      setFormEmployeeId(val);
                      const emp = employees.find(e => e.id === val);
                      if (emp) {
                        setFormEmployeeName(emp.name);
                        setFormTitle(`Kasbon - ${emp.name}`);
                        setFormContactName(emp.name);
                      }
                    }}
                    options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.role})` }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {formType === 'piutang' && 'Nama Pelanggan / Debitur:'}
                    {formType === 'utang_supplier' && 'Nama Supplier / Pemasok:'}
                    {formType === 'pinjaman' && 'Nama Kreditur / Bank / Pemberi Pinjaman:'}
                  </label>
                  <input
                    type="text"
                    value={formContactName}
                    onChange={e => setFormContactName(e.target.value)}
                    placeholder={
                      formType === 'piutang'
                        ? 'Contoh: Toko Berkah / Kak Ani'
                        : formType === 'utang_supplier'
                        ? 'Contoh: Supplier Ball Import Bandung'
                        : 'Contoh: Bank BCA / Rekanan Usaha'
                    }
                    className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                    required
                  />
                </div>
              )}

              {/* Judul Catatan */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Keterangan / Judul:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Keterangan singkat catatan..."
                  className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                  required
                />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nominal (Rp):
                </label>
                <CommaNumberInput
                  value={formAmount}
                  onChange={val => setFormAmount(val)}
                  className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-[#25F4EE] focus:outline-none focus:border-[#25F4EE]"
                />
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Nomor invoice, rincian produk, atau syarat pembayaran..."
                  className="w-full bg-[#0b0c10] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                />
              </div>

              {/* Foto Bukti Nota */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Upload Bukti Nota / Foto (Opsional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handlePhotoUpload(e, setFormProofImage)}
                  className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
                {formProofImage && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                    <img src={formProofImage} alt="Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormProofImage('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-[#FE2C55] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Checkbox Sinkron ke Cashflow */}
              <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/10">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSyncToCashflow}
                    onChange={e => setFormSyncToCashflow(e.target.checked)}
                    className="rounded text-[#25F4EE] focus:ring-0"
                  />
                  <span>
                    Sinkronkan ke Kas Cashflow:
                    <span className="text-[11px] text-zinc-400 block">
                      {formType === 'piutang' && 'Catat kas keluar saat uang/barang dipinjamkan'}
                      {formType === 'kasbon' && 'Catat kas keluar (gaji/kasbon pegawai)'}
                      {formType === 'utang_supplier' && 'Tidak mempengaruhi kas saat pencatatan awal (non-tunai)'}
                      {formType === 'pinjaman' && 'Catat kas masuk dari pinjaman diterima'}
                    </span>
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#25F4EE] hover:bg-[#1ee0da] text-[#0b0c10] font-black text-xs cursor-pointer shadow active:scale-98"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PROSES BAYAR / CICIL
          ========================================================================= */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#161823] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#25F4EE]" />
                <span>Bayar / Cicil {getTypeLabel(paymentModalItem.type)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-4 space-y-4">
              {/* Ringkasan Item */}
              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Judul:</span>
                  <strong className="text-white">{paymentModalItem.title}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Pihak:</span>
                  <strong className="text-white">
                    {paymentModalItem.contactName || paymentModalItem.employeeName || '-'}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Sisa Tagihan:</span>
                  <strong className="text-[#25F4EE] text-sm">
                    {formatRupiah(Math.abs(paymentModalItem.currentBalance))}
                  </strong>
                </div>
              </div>

              {/* Tanggal Bayar */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Pembayaran:
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                  required
                />
              </div>

              {/* Nominal Bayar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-300">
                    Nominal Pembayaran (Rp):
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.abs(paymentModalItem.currentBalance))}
                    className="text-[11px] font-bold text-[#25F4EE] hover:underline cursor-pointer"
                  >
                    Lunaskan Semua
                  </button>
                </div>
                <CommaNumberInput
                  value={payAmount}
                  onChange={val => setPayAmount(val)}
                  className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-[#25F4EE] focus:outline-none focus:border-[#25F4EE]"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Catatan Pembayaran (Opsional):
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="Contoh: Cicilan ke-1 / transfer BCA"
                  className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25F4EE]"
                />
              </div>

              {/* Upload Foto */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Upload Bukti Transfer / Kwitansi:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handlePhotoUpload(e, setPayProofImage)}
                  className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
                {payProofImage && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                    <img src={payProofImage} alt="Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPayProofImage('')}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-[#FE2C55] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Checkbox Sinkron ke Cashflow */}
              <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-white/10">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paySyncToCashflow}
                    onChange={e => setPaySyncToCashflow(e.target.checked)}
                    className="rounded text-[#25F4EE] focus:ring-0"
                  />
                  <span>
                    Sinkronkan ke Kas Cashflow:
                    <span className="text-[10px] text-zinc-400 block">
                      {paymentModalItem.type === 'piutang' && 'Kas Masuk (Inflow dari pelunasan piutang)'}
                      {paymentModalItem.type === 'kasbon' && 'Kas Masuk (Pengembalian kasbon)'}
                      {paymentModalItem.type === 'utang_supplier' && 'Kas Keluar (Outflow bayar utang supplier)'}
                      {(paymentModalItem.type === 'pinjaman' || paymentModalItem.type === 'dana_talang') && 'Kas Keluar (Outflow pokok pinjaman)'}
                    </span>
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#25F4EE] hover:bg-[#1ee0da] text-[#0b0c10] font-black text-xs cursor-pointer shadow active:scale-98"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RIWAYAT PEMBAYARAN / CICILAN
          ========================================================================= */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[#161823] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#25F4EE]" />
                <span>Riwayat Pembayaran: {historyModalItem.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setHistoryModalItem(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-between text-xs">
                <span>Nominal Awal: <strong>{formatRupiah(historyModalItem.initialAmount)}</strong></span>
                <span>Sisa Saldo: <strong className="text-[#25F4EE]">{formatRupiah(Math.abs(historyModalItem.currentBalance))}</strong></span>
              </div>

              <div className="space-y-2">
                {(!historyModalItem.history || historyModalItem.history.length === 0) ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    Belum ada riwayat pembayaran yang tercatat.
                  </div>
                ) : (
                  historyModalItem.history.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      className="p-3 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">
                          Pembayaran ke-{idx + 1}: {formatRupiah(hist.amount)}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Tgl: {formatDateIndo(hist.date)} {hist.notes ? `• "${hist.notes}"` : ''}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Tercatat
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 text-right">
              <button
                type="button"
                onClick={() => setHistoryModalItem(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PREVIEW FOTO
          ========================================================================= */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden bg-[#161823] border border-white/20 shadow-2xl p-2">
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-[#FE2C55] transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Preview Bukti"
              className="w-full h-full max-h-[78vh] object-contain rounded-2xl"
            />
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
