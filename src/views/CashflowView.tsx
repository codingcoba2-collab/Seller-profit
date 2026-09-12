import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { CashflowRecord, CurrentUser, Employee } from '../types';
import { formatRupiah, formatDateIndo, getTodayString, roleLabels } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Search,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  PlusCircle,
  ClipboardList,
  ArrowRight,
  Layers
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type CashflowViewMode = 'menu' | 'input' | 'output';

const CATEGORY_LABELS: Record<string, string> = {
  packing: 'Bahan Packing (Lakban, Plastik, Bubble Wrap)',
  makan_minum: 'Konsumsi / Makan & Minum Tim',
  listrik_wifi: 'Listrik, Air & Internet WiFi',
  sewa_tempat: 'Sewa Tempat / Ruko Live',
  gaji_pegawai: 'Gaji Pegawai / Karyawan',
  konsumsi_pribadi: 'Konsumsi Pribadi (Prive Owner)',
  lainnya: 'Operasional Lainnya',
  penarikan_shopee: 'Penarikan Saldo Marketplace',
};

export const CashflowView: React.FC<CashflowViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<CashflowViewMode>('menu');
  const [inputStep, setInputStep] = useState<number>(1);
  const [cashflowList, setCashflowList] = useState<CashflowRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingItem, setEditingItem] = useState<CashflowRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');
  const [amount, setAmount] = useState<number>(150000);
  const [category, setCategory] = useState<CashflowRecord['category']>('packing');
  const [description, setDescription] = useState('Beli lakban, plastik packing polymailer & bubble wrap');
  
  // Gaji Pegawai specific states
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'gaji_insentif' | 'kasbon'>('gaji_insentif');
  const [periodMonth, setPeriodMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const list = StorageService.getCashflow(currentUser.storeId);
    setCashflowList(list);
    const emps = StorageService.getEmployees(currentUser.storeId);
    setEmployees(emps);
    if (emps.length > 0 && !employeeId) {
      setEmployeeId(emps[0].id);
      setEmployeeName(emps[0].name);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const resetForm = () => {
    setEditingItem(null);
    setDate(getTodayString());
    setType('outflow');
    setAmount(150000);
    setCategory('packing');
    setPaymentType('gaji_insentif');
    setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    if (employees.length > 0) {
      setEmployeeId(employees[0].id);
      setEmployeeName(employees[0].name);
    } else {
      setEmployeeId('');
      setEmployeeName('');
    }
    const now = new Date();
    setPeriodMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setProofImageUrl('');
    setInputStep(1);
  };

  const handleStartEdit = (item: CashflowRecord) => {
    setEditingItem(item);
    setDate(item.date);
    setType(item.type);
    setAmount(item.amount);
    setCategory(item.category);
    setPaymentType(item.paymentType || (item.description?.toLowerCase().includes('kasbon') ? 'kasbon' : 'gaji_insentif'));
    setDescription(item.description || '');
    setEmployeeId(item.employeeId || (employees[0]?.id || ''));
    setEmployeeName(item.employeeName || (employees[0]?.name || ''));
    setPeriodMonth(item.periodMonth || getTodayString().slice(0, 7));
    setProofImageUrl(item.proofImageUrl || '');
    setInputStep(1);
    setViewMode('input');
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleCategoryChange = (newCat: CashflowRecord['category']) => {
    setCategory(newCat);
    if (newCat === 'gaji_pegawai') {
      const selectedEmp = employees.find(e => e.id === employeeId) || employees[0];
      if (selectedEmp) {
        setEmployeeId(selectedEmp.id);
        setEmployeeName(selectedEmp.name);
        const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
        setDescription(`${prefix} - ${selectedEmp.name} (Periode ${periodMonth})`);
      }
    } else if (newCat === 'konsumsi_pribadi') {
      setDescription('Prive / Pengeluaran konsumsi pribadi owner');
    } else if (newCat === 'packing' && (description.includes('Gaji') || description.includes('Kasbon') || description.includes('Prive'))) {
      setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    }
  };

  const handlePaymentTypeChange = (newType: 'gaji_insentif' | 'kasbon') => {
    setPaymentType(newType);
    if (employeeName) {
      const prefix = newType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
      setDescription(`${prefix} - ${employeeName} (Periode ${periodMonth})`);
    }
  };

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setEmployeeName(emp.name);
      const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
      setDescription(`${prefix} - ${emp.name} (Periode ${periodMonth})`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onNotify('Ukuran file foto maksimal 10MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.65);
            setProofImageUrl(compressed);
            onNotify('Foto nota berhasil dikompres & siap disimpan.', 'info');
          } else {
            setProofImageUrl(dataUrl);
          }
        } catch {
          setProofImageUrl(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      onNotify('Nominal transaksi harus lebih dari Rp 0!', 'error');
      return;
    }

    const record: CashflowRecord = {
      id: editingItem ? editingItem.id : 'cf-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      type,
      amount,
      category,
      description,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
      employeeId: category === 'gaji_pegawai' ? employeeId : undefined,
      employeeName: category === 'gaji_pegawai' ? employeeName : undefined,
      paymentType: category === 'gaji_pegawai' ? paymentType : undefined,
      periodMonth: category === 'gaji_pegawai' ? periodMonth : undefined,
      proofImageUrl: proofImageUrl || undefined,
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingItem) {
          StorageService.updateCashflow(record);
          onNotify('Perubahan transaksi arus kas berhasil disimpan!', 'success');
        } else {
          StorageService.addCashflow(record);
          onNotify('Transaksi arus kas berhasil dicatat!', 'success');
        }

        loadData();
        resetForm();
        setViewMode('output');
      } catch (err: any) {
        console.error('Error saving cashflow:', err);
        onNotify('Gagal menyimpan transaksi kas: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingItem ? 'Konfirmasi Simpan Perubahan Transaksi' : 'Konfirmasi Catat Transaksi Kas',
      message: editingItem
        ? `Apakah Anda yakin ingin menyimpan perubahan transaksi ${formatRupiah(amount)}?`
        : `Apakah Anda yakin ingin mencatat ${type === 'inflow' ? 'pemasukan' : 'pengeluaran'} sebesar ${formatRupiah(amount)}?`,
      type: editingItem ? 'edit' : 'create',
      confirmText: editingItem ? 'Ya, Simpan Perubahan' : 'Ya, Catat Transaksi',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, desc?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Transaksi Kas',
      message: `Apakah Anda yakin ingin menghapus transaksi ${desc ? `"${desc}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Transaksi',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteCashflow(id);
        loadData();
        onNotify('Transaksi berhasil dihapus.', 'info');
        if (editingItem?.id === id) {
          handleCancelEdit();
        }
      },
    });
  };

  // Filter list
  const filteredList = cashflowList
    .filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = CATEGORY_LABELS[item.category]?.toLowerCase().includes(q);
        const matchEmp = item.employeeName?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchEmp) return false;
      }
      if (periodFilter === 'today') return item.date === getTodayString();
      if (periodFilter === 'range') return item.date >= startDate && item.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return item.date >= weekAgo && item.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return item.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalInflow = filteredList.filter(c => c.type === 'inflow').reduce((acc, c) => acc + c.amount, 0);
  const totalOutflow = filteredList.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
  const netCash = totalInflow - totalOutflow;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* ================= 1. MENU HUB STATE (2 Pilihan Grid) ================= */}
      {viewMode === 'menu' && (
        <div className="space-y-4">
          {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-cashflow"
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#25F4EE]" />
                <span>Buku Kas &amp; Arus Keuangan</span>
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            Arus Bersih: <strong className={netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}>{formatRupiah(netCash)}</strong>
          </div>
        </div>

        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Pemasukan Kas</div>
            <div className="text-sm sm:text-base font-black text-[#25F4EE]">{formatRupiah(totalInflow)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Pengeluaran Kas</div>
            <div className="text-sm sm:text-base font-black text-[#FE2C55]">{formatRupiah(totalOutflow)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 font-semibold">Saldo Kas Bersih</div>
            <div className={`text-sm sm:text-base font-black ${netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(netCash)}
            </div>
          </div>
        </div>

        {/* Grid Kecil 2 Kesamping: Input vs Output */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: Form Input */}
            <div
              id="menu-card-input-cashflow"
              onClick={() => {
                resetForm();
                setInputStep(1);
                setViewMode('input');
              }}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Catat Transaksi Kas"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Input pengeluaran/pemasukan bertahap"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Input data baru</span>
                <span className="text-[#25F4EE] font-bold">Buka Form</span>
              </div>
            </div>

            {/* Card 2: Laporan & Riwayat */}
            <div
              id="menu-card-output-cashflow"
              onClick={() => setViewMode('output')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Buku Kas & Riwayat"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Tabel rincian mutasi kas"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{filteredList.length} Transaksi Tercatat</span>
                <span className="text-[#FE2C55] font-bold">Buka Data</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) ================= */}
      {viewMode === 'input' && (
        <div className="max-w-3xl mx-auto space-y-4">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-cashflow"
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
              {editingItem ? '✏️ Edit Transaksi' : 'Catat Transaksi Kas'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
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
                ? 'bg-[#25F4EE]/10 border border-[#25F4EE] text-[#25F4EE]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            <span>Jenis &amp; Kategori</span>
          </button>
          <button
            type="button"
            onClick={() => setInputStep(2)}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 2
                ? 'bg-[#25F4EE]/10 border border-[#25F4EE] text-[#25F4EE]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
            <span>Nominal &amp; Nota</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {/* TAHAP 1: Jenis Transaksi & Kategori */}
          {inputStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 1: Jenis Transaksi, Tanggal &amp; Kategori</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Tentukan apakah kas masuk atau pengeluaran operasional toko.</p>
              </div>

              {/* Inflow vs Outflow */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('outflow');
                    setCategory('packing');
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    type === 'outflow'
                      ? 'bg-[#FE2C55]/10 border-[#FE2C55] text-[#FE2C55]'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Pengeluaran (Kas Keluar)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('inflow');
                    setCategory('penarikan_shopee');
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    type === 'inflow'
                      ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-[#25F4EE]'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Pemasukan (Kas Masuk)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Transaksi <span className="text-[#FE2C55]">*</span>
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
                    Kategori Transaksi <span className="text-[#FE2C55]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  >
                    {type === 'outflow' ? (
                      <>
                        <option value="packing">Bahan Packing (Lakban/Plastik)</option>
                        <option value="makan_minum">Konsumsi / Makan Tim</option>
                        <option value="listrik_wifi">Listrik, Air &amp; Internet WiFi</option>
                        <option value="sewa_tempat">Sewa Tempat / Ruko</option>
                        <option value="gaji_pegawai">Gaji / Kasbon Pegawai</option>
                        <option value="konsumsi_pribadi">Konsumsi Pribadi (Prive Owner)</option>
                        <option value="lainnya">Operasional Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="penarikan_shopee">Penarikan Saldo Marketplace</option>
                        <option value="lainnya">Pemasukan Lainnya / Modal Tambahan</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {category === 'gaji_pegawai' && (
                <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-purple-500/30 space-y-3">
                  <div className="text-xs font-bold text-purple-300">Rincian Pembayaran Pegawai</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Pilih Pegawai</label>
                      <select
                        value={employeeId}
                        onChange={e => handleEmployeeChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Tipe Pembayaran</label>
                      <select
                        value={paymentType}
                        onChange={e => handlePaymentTypeChange(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                      >
                        <option value="gaji_insentif">Gaji / Insentif</option>
                        <option value="kasbon">Kasbon Pegawai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Periode Bulan</label>
                      <input
                        type="month"
                        value={periodMonth}
                        onChange={e => {
                          setPeriodMonth(e.target.value);
                          if (employeeName) {
                            const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
                            setDescription(`${prefix} - ${employeeName} (Periode ${e.target.value})`);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                      >
                      </input>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInputStep(2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Tahap Selanjutnya: Nominal &amp; Nota</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2: Nominal Transaksi & Nota / Catatan */}
          {inputStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 2: Masukkan Nominal &amp; Foto Nota Bukti</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Tentukan nilai nominal rupiah dan lampirkan bukti pengeluaran jika ada.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nominal Transaksi (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={amount}
                  onChange={setAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {formatRupiah(amount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Keterangan / Deskripsi Transaksi <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Misal: Beli lakban 5 roll & plastik polymailer"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              {/* Upload Bukti Nota */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Foto Nota / Bukti Transfer (Opsional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {proofImageUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0b0c10] border border-white/10">
                    <img
                      src={proofImageUrl}
                      alt="Bukti Nota"
                      className="w-14 h-14 object-cover rounded-xl border border-white/10"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="text-emerald-400 font-bold block">✓ Foto Bukti Terlampir</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-[#25F4EE] hover:underline cursor-pointer mr-3"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setProofImageUrl('')}
                        className="text-[10px] text-[#FE2C55] hover:underline cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-2xl bg-[#0b0c10] border border-dashed border-white/10 hover:border-[#25F4EE]/40 transition text-center cursor-pointer"
                  >
                    <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                    <span className="text-xs text-zinc-300 font-bold block">Klik untuk Unggah Foto Nota</span>
                    <span className="text-[10px] text-zinc-500">Mendukung format JPG, PNG maksimal 5MB</span>
                  </button>
                )}
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
                  id="btn-submit-cashflow"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Transaksi Kas'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
        </div>
      )}

      {/* ================= 3. OUTPUT & LAPORAN STATE (Tanpa Tab) ================= */}
      {viewMode === 'output' && (
        <div className="space-y-4">
          {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <button
          id="btn-back-menu-from-output-cashflow"
          type="button"
          onClick={() => setViewMode('menu')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kembali ke Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-form-from-output-cashflow"
            type="button"
            onClick={() => {
              resetForm();
              setInputStep(1);
              setViewMode('input');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Catat Transaksi Baru</span>
          </button>
        </div>
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
              placeholder="Cari deskripsi / kategori..."
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
          Total: <strong className="text-white">{filteredList.length}</strong> transaksi
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-[#161823] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#25F4EE]" />
            <span>Riwayat Mutasi Buku Kas</span>
          </h3>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Belum ada transaksi arus kas pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c10]/60 text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Jenis</th>
                  <th className="p-3 font-semibold">Kategori</th>
                  <th className="p-3 font-semibold">Keterangan</th>
                  <th className="p-3 font-semibold text-right">Nominal</th>
                  <th className="p-3 font-semibold text-center">Nota</th>
                  <th className="p-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="p-3 whitespace-nowrap font-medium text-zinc-300">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'inflow' 
                          ? 'bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20'
                          : 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                      }`}>
                        {item.type === 'inflow' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-zinc-300">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </td>
                    <td className="p-3 text-zinc-300 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className={`p-3 whitespace-nowrap text-right font-bold ${
                      item.type === 'inflow' ? 'text-[#25F4EE]' : 'text-[#FE2C55]'
                    }`}>
                      {item.type === 'inflow' ? '+' : '-'}{formatRupiah(item.amount)}
                    </td>
                    <td className="p-3 whitespace-nowrap text-center">
                      {item.proofImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                          title="Lihat Nota"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Edit Transaksi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.description || `${CATEGORY_LABELS[item.category] || item.category} (${formatRupiah(item.amount)})`)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                        title="Hapus Transaksi"
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
      </div>
      )}

      {/* Image Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#161823] rounded-2xl border border-white/10 p-4 max-w-md w-full space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-white">Foto Bukti Nota</h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewPhotoUrl}
              alt="Preview Nota"
              className="w-full max-h-96 object-contain rounded-xl border border-white/5 bg-black"
            />
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
