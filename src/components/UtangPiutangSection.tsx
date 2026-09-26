import React, { useState, useMemo } from 'react';
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
  Landmark
} from 'lucide-react';

interface UtangPiutangSectionProps {
  currentUser: CurrentUser;
  employees: Employee[];
  tagihanList: TagihanRecord[];
  onRefresh: () => void;
  onBackToMenu: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type UtangPiutangTab = 'all' | 'piutang' | 'kasbon' | 'utang_supplier' | 'pinjaman';

export const UtangPiutangSection: React.FC<UtangPiutangSectionProps> = ({
  currentUser,
  employees,
  tagihanList,
  onRefresh,
  onBackToMenu,
  onNotify,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<UtangPiutangTab>('all');

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Period & Search Filter
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'specific' | 'range' | 'weekly' | 'monthly'>('all');
  const [specificDate, setSpecificDate] = useState<string>(getTodayString());
  const [startDate, setStartDate] = useState<string>(getTodayString().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentModalItem, setPaymentModalItem] = useState<TagihanRecord | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<TagihanRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      {/* Action Button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => openAddModal(activeTab === 'all' ? 'piutang' : activeTab)}
          className="px-4 py-2 rounded-xl bg-[#25F4EE] hover:bg-[#1ee0da] text-[#0b0c10] font-black text-xs flex items-center gap-1.5 transition shadow cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Catat Utang / Piutang</span>
        </button>
      </div>

      {/* 4 Top Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Piutang */}
        <div
          onClick={() => setActiveTab('piutang')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-md ${
            activeTab === 'piutang'
              ? 'bg-[#25F4EE]/10 border-[#25F4EE]/50 ring-1 ring-[#25F4EE]/50'
              : 'bg-[#161823] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
              Piutang (Belum Lunas)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#25F4EE]/20 text-[#25F4EE]">
              {countPiutang} data
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#25F4EE] mt-1.5">
            {formatRupiah(totalPiutang)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Uang toko di pihak lain</div>
        </div>

        {/* Card 2: Kasbon Pegawai */}
        <div
          onClick={() => setActiveTab('kasbon')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-md ${
            activeTab === 'kasbon'
              ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/50'
              : 'bg-[#161823] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Kasbon Pegawai
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              {countKasbon} data
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-400 mt-1.5">
            {formatRupiah(totalKasbon)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Pinjaman belum dipotong/lunas</div>
        </div>

        {/* Card 3: Utang Supplier */}
        <div
          onClick={() => setActiveTab('utang_supplier')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-md ${
            activeTab === 'utang_supplier'
              ? 'bg-[#FE2C55]/10 border-[#FE2C55]/50 ring-1 ring-[#FE2C55]/50'
              : 'bg-[#161823] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#FE2C55]" />
              Utang Supplier
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FE2C55]/20 text-[#FE2C55]">
              {countSupplier} data
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#FE2C55] mt-1.5">
            {formatRupiah(totalUtangSupplier)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Kewajiban bayar stok ke supplier</div>
        </div>

        {/* Card 4: Pinjaman */}
        <div
          onClick={() => setActiveTab('pinjaman')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-md ${
            activeTab === 'pinjaman'
              ? 'bg-amber-400/10 border-amber-400/50 ring-1 ring-amber-400/50'
              : 'bg-[#161823] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              Pinjaman Usaha
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400">
              {countPinjaman} data
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-400 mt-1.5">
            {formatRupiah(totalPinjaman)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Utang bank / talangan belum lunas</div>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div className="p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
            }`}
          >
            Semua ({tagihanList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('piutang')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'piutang'
                ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/40'
                : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
            }`}
          >
            <span>Piutang</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{countPiutang}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kasbon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'kasbon'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
            }`}
          >
            <span>Kasbon Pegawai</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{countKasbon}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('utang_supplier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'utang_supplier'
                ? 'bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/40'
                : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
            }`}
          >
            <span>Utang Supplier</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{countSupplier}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pinjaman')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pinjaman'
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
            }`}
          >
            <span>Pinjaman</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{countPinjaman}</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-zinc-400">Status:</span>
          {(['all', 'unpaid', 'partial', 'paid'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30'
                  : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
              }`}
            >
              {st === 'all' && 'Semua'}
              {st === 'unpaid' && 'Belum Lunas'}
              {st === 'partial' && 'Dicicil'}
              {st === 'paid' && 'Lunas'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama pihak, pegawai, supplier, atau judul..."
              className="w-full bg-[#0b0c10] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#25F4EE]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0b0c10] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  periodFilter === 'all' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('today')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  periodFilter === 'today' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('monthly')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  periodFilter === 'monthly' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('range')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  periodFilter === 'range' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Rentang
              </button>
            </div>

            {periodFilter === 'range' && (
              <div className="flex items-center gap-1 bg-[#0b0c10] px-2 py-1 rounded-xl border border-white/10">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none"
                />
                <span className="text-zinc-500 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center bg-[#161823] rounded-3xl border border-white/10 text-zinc-500 text-xs space-y-3">
            <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>Tidak ada catatan utang &amp; piutang pada filter yang dipilih.</p>
            <button
              type="button"
              onClick={() => openAddModal(activeTab === 'all' ? 'piutang' : activeTab)}
              className="px-4 py-2 rounded-xl bg-[#25F4EE] text-[#0b0c10] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Catat Utang / Piutang Sekarang
            </button>
          </div>
        ) : (
          filteredList.map(item => {
            const isSettled = item.status === 'paid';
            const isPartial = item.status === 'partial';
            const balanceAmount = Math.abs(item.currentBalance);
            const contactName = item.contactName || item.employeeName || item.customerName || item.supplierName || item.lenderName || '-';

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-[#161823] border border-white/10 hover:border-white/20 transition shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {getTypeBadge(item.type)}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                      Tgl: {formatDateIndo(item.date)}
                    </span>
                    {item.dueDate && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        Tempo: {formatDateIndo(item.dueDate)}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isSettled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isPartial
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                        : 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/30'
                    }`}>
                      {isSettled ? 'Lunas' : isPartial ? 'Dicicil Sebagian' : 'Belum Lunas'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.proofImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Lihat Bukti Foto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(item.history && item.history.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setHistoryModalItem(item)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Lihat Riwayat Cicilan"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <span>{item.title}</span>
                    </div>
                    <div className="text-xs text-zinc-300 font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="text-zinc-400">Pihak:</span>
                      <strong className="text-white">{contactName}</strong>
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-zinc-400 mt-1 italic">
                        "{item.notes}"
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-zinc-400">
                      Nominal Awal: <strong className="text-zinc-200">{formatRupiah(item.initialAmount)}</strong>
                    </div>
                    <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                      <span className="text-xs font-medium text-zinc-400 mr-1">Sisa Saldo:</span>
                      <span className={balanceAmount > 0 ? 'text-[#25F4EE]' : 'text-emerald-400'}>
                        {formatRupiah(balanceAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-400">
                    {item.history && item.history.length > 0 ? (
                      <span className="text-zinc-300">
                        {item.history.length}x pembayaran dicatat
                      </span>
                    ) : (
                      <span>Belum ada pembayaran dicatat</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.history && item.history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistoryModalItem(item)}
                        className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>Riwayat ({item.history.length})</span>
                      </button>
                    )}
                    {!isSettled && (
                      <button
                        type="button"
                        onClick={() => openPaymentModal(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#25F4EE] hover:bg-[#1ee0da] text-[#0b0c10] text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow active:scale-98"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar / Cicil</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
