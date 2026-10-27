import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
import { 
  CurrentUser, 
  PersonalBudgetAllocation, 
  PersonalExpenseRecord, 
  PersonalBudgetCategory 
} from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  UserCheck, 
  Wallet, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Percent, 
  DollarSign, 
  Layers, 
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
  PlusCircle,
  ClipboardList,
  ArrowRight,
  Settings,
  Search,
  ChevronDown,
  X
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

interface PersonalFinanceViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PersonalFinanceViewMode = 'menu' | 'input' | 'output' | 'pengaturan';
type PeriodFilter = 'all' | 'today' | 'weekly' | 'monthly' | 'specific' | 'range';

const CATEGORY_NAMES: Record<PersonalBudgetCategory, string> = {
  sehari_hari: 'Kebutuhan Sehari-hari',
  utang: 'Utang & Cicilan',
  tabungan: 'Tabungan & Dana Darurat',
  investasi_toko: 'Investasi & Pengembangan Usaha',
};

const CATEGORY_ICONS: Record<PersonalBudgetCategory, string> = {
  sehari_hari: '🛒',
  utang: '💳',
  tabungan: '💰',
  investasi_toko: '🚀',
};

export const PersonalFinanceView: React.FC<PersonalFinanceViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<PersonalFinanceViewMode>('menu');
  const [inputStep, setInputStep] = useState<number>(1);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PersonalBudgetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [selectedDetailExpense, setSelectedDetailExpense] = useState<PersonalExpenseRecord | null>(null);

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

  // Allocation State (Pengaturan Biaya)
  const [totalIncome, setTotalIncome] = useState<number>(1000000);
  const [sehariHariPercent, setSehariHariPercent] = useState<number>(50);
  const [utangPercent, setUtangPercent] = useState<number>(20);
  const [tabunganPercent, setTabunganPercent] = useState<number>(15);
  const [investasiTokoPercent, setInvestasiTokoPercent] = useState<number>(15);

  // Input Expense State
  const [expenseDate, setExpenseDate] = useState<string>(getTodayString());
  const [expenseCategory, setExpenseCategory] = useState<PersonalBudgetCategory>('sehari_hari');
  const [expenseAmount, setExpenseAmount] = useState<number>(50000);
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [editingExpense, setEditingExpense] = useState<PersonalExpenseRecord | null>(null);

  // List states
  const [expenses, setExpenses] = useState<PersonalExpenseRecord[]>([]);

  const loadData = () => {
    StorageService.cleanupLegacyPriveExpenses(currentUser.storeId);
    const alloc = StorageService.getPersonalBudgetAllocation(currentUser.storeId);
    
    // Otomatis akumulasi total dana pribadi dari pencatatan konsumsi pribadi di cashflow toko
    const cashflowPriveTotal = StorageService.getTotalKonsumsiPribadi(currentUser.storeId);
    const effectiveIncome = cashflowPriveTotal > 0 ? cashflowPriveTotal : (alloc.totalIncome || 0);

    setTotalIncome(effectiveIncome);
    setSehariHariPercent(alloc.sehariHariPercent ?? 50);
    setUtangPercent(alloc.utangPercent ?? 20);
    setTabunganPercent(alloc.tabunganPercent ?? 15);
    setInvestasiTokoPercent(alloc.investasiTokoPercent ?? 15);

    const expList = StorageService.getPersonalExpenses(currentUser.storeId);
    setExpenses(expList);
  };

  useEffect(() => {
    if (viewMode !== 'menu') {
      registerSubViewBackHandler(() => {
        setEditingExpense(null);
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

  // Validation: sum of percentages must be 100%
  const totalPercent = sehariHariPercent + utangPercent + tabunganPercent + investasiTokoPercent;

  // Budget nominal for each category based on total income
  const budgetNominal: Record<PersonalBudgetCategory, number> = {
    sehari_hari: Math.round((totalIncome * sehariHariPercent) / 100),
    utang: Math.round((totalIncome * utangPercent) / 100),
    tabungan: Math.round((totalIncome * tabunganPercent) / 100),
    investasi_toko: Math.round((totalIncome * investasiTokoPercent) / 100),
  };

  // Filter expenses by period, category, and search query
  const todayStr = getTodayString();
  const filteredExpenses = expenses.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = (CATEGORY_NAMES[item.category] || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchCat && !matchDesc) return false;
    }
    if (periodFilter === 'today') return item.date === todayStr;
    if (periodFilter === 'specific') return item.date === specificDate;
    if (periodFilter === 'range') return (item.date || '') >= startDate && (item.date || '') <= endDate;
    if (periodFilter === 'weekly') {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      return item.date >= weekAgo && item.date <= todayStr;
    }
    if (periodFilter === 'monthly') {
      const curMonth = todayStr.slice(0, 7);
      return item.date.startsWith(curMonth);
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Actual spent per category
  const expenseByCategory: Record<PersonalBudgetCategory, number> = {
    sehari_hari: 0,
    utang: 0,
    tabungan: 0,
    investasi_toko: 0,
  };

  filteredExpenses.forEach(exp => {
    if (expenseByCategory[exp.category] !== undefined) {
      expenseByCategory[exp.category] += exp.amount;
    }
  });

  const totalFilteredExpense = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRemaining = totalIncome - totalFilteredExpense;
  const isDeficit = totalRemaining < 0;

  // Handle Save Allocation Settings
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalPercent !== 100) {
      onNotify(`Total alokasi harus tepat 100% (saat ini: ${totalPercent}%)`, 'error');
      return;
    }

    const alloc: PersonalBudgetAllocation = {
      totalIncome,
      sehariHariPercent,
      utangPercent,
      tabunganPercent,
      investasiTokoPercent,
      updatedAt: new Date().toISOString(),
    };

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Simpan Alokasi Budget',
      message: `Apakah Anda yakin ingin menyimpan alokasi budget dengan total pendapatan ${formatRupiah(totalIncome)}?`,
      type: 'save',
      confirmText: 'Ya, Simpan Alokasi',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.savePersonalBudgetAllocation(currentUser.storeId, alloc);
          onNotify('Pengaturan alokasi anggaran pribadi berhasil disimpan!', 'success');
          setViewMode('output');
        } catch (err: any) {
          console.error('Error saving personal budget allocation:', err);
          onNotify('Gagal menyimpan alokasi: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
        }
      },
    });
  };

  // Handle Save / Update Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (expenseAmount <= 0) {
      onNotify('Nominal pengeluaran harus lebih dari Rp 0', 'error');
      return;
    }

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingExpense) {
          const updated: PersonalExpenseRecord = {
            ...editingExpense,
            date: expenseDate,
            category: expenseCategory,
            amount: expenseAmount,
            description: expenseDescription,
          };
          StorageService.updatePersonalExpense(updated);
          onNotify('Data pengeluaran pribadi berhasil diperbarui!', 'success');
          setEditingExpense(null);
        } else {
          const newRec: PersonalExpenseRecord = {
            id: 'pexp-' + Date.now(),
            storeId: currentUser.storeId,
            date: expenseDate,
            category: expenseCategory,
            amount: expenseAmount,
            description: expenseDescription,
            createdAt: new Date().toISOString(),
          };
          StorageService.addPersonalExpense(newRec);
          onNotify('Pengeluaran pribadi baru berhasil dicatat!', 'success');
        }

        // Reset Form
        setExpenseAmount(50000);
        setExpenseDescription('');
        setExpenseDate(getTodayString());
        setInputStep(1);
        loadData();
        setViewMode('output');
      } catch (err: any) {
        console.error('Error saving personal expense:', err);
        onNotify('Gagal menyimpan pengeluaran pribadi: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingExpense ? 'Konfirmasi Simpan Perubahan Pengeluaran' : 'Konfirmasi Catat Pengeluaran',
      message: editingExpense
        ? `Apakah Anda yakin ingin menyimpan perubahan pengeluaran sebesar ${formatRupiah(expenseAmount)}?`
        : `Apakah Anda yakin ingin mencatat pengeluaran ${CATEGORY_NAMES[expenseCategory]} sebesar ${formatRupiah(expenseAmount)}?`,
      type: editingExpense ? 'edit' : 'create',
      confirmText: editingExpense ? 'Ya, Simpan Perubahan' : 'Ya, Catat Pengeluaran',
      onConfirm: executeSave,
    });
  };

  // Handle Edit Expense
  const handleStartEdit = (item: PersonalExpenseRecord) => {
    setEditingExpense(item);
    setExpenseDate(item.date);
    setExpenseCategory(item.category);
    setExpenseAmount(item.amount);
    setExpenseDescription(item.description || '');
    setInputStep(1);
    setViewMode('input');
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingExpense(null);
    setExpenseAmount(50000);
    setExpenseDescription('');
    setExpenseDate(getTodayString());
    setInputStep(1);
  };

  // Handle Delete Expense
  const handleDeleteExpense = (id: string, desc?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Pengeluaran Pribadi',
      message: `Apakah Anda yakin ingin menghapus catatan pengeluaran ${desc ? `"${desc}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Pengeluaran',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deletePersonalExpense(id);
        loadData();
        onNotify('Catatan pengeluaran berhasil dihapus.', 'info');
        if (editingExpense?.id === id) {
          handleCancelEdit();
        }
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* ================= 1. MENU HUB STATE (Grid Kecil 2 Kesamping) ================= */}
      {viewMode === 'menu' && (
        <div className="space-y-3.5 sm:space-y-4">
        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Dana Pribadi</div>
            <div className="text-sm sm:text-base font-black text-white">{formatRupiah(totalIncome)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Pengeluaran</div>
            <div className="text-sm sm:text-base font-black text-[#FE2C55]">{formatRupiah(totalFilteredExpense)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 font-semibold">Sisa Dana Pribadi</div>
            <div className={`text-sm sm:text-base font-black ${isDeficit ? 'text-[#FE2C55]' : 'text-[#25F4EE]'}`}>
              {formatRupiah(totalRemaining)}
            </div>
          </div>
        </div>

        {/* Grid Kecil 2 Kesamping jika tidak cukup sisanya ke bawah */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: Form Input Pengeluaran */}
            <div
              id="menu-card-input-personal"
              onClick={() => {
                handleCancelEdit();
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
                    text="Catat Pengeluaran"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Input biaya belanja pribadi bertahap"
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

            {/* Card 2: Laporan & Budget Tracker */}
            <div
              id="menu-card-output-personal"
              onClick={() => setViewMode('output')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-amber-400/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Laporan & Budget"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-amber-400 transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Monitoring batas anggaran 4 pos"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{filteredExpenses.length} Biaya Tercatat</span>
                <span className="text-amber-400 font-bold">Buka Data</span>
              </div>
            </div>

            {/* Card 3: Pengaturan Alokasi Persentase */}
            <div
              id="menu-card-settings-personal"
              onClick={() => setViewMode('pengaturan')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-purple-400/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98 col-span-2 sm:col-span-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Alokasi Budget %"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-purple-400 transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Atur persentase 50/20/15/15 pos"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Konfigurasi persentase</span>
                <span className="text-purple-400 font-bold">Atur Budget</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) ================= */}
      {viewMode === 'input' && (
        <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-4">
        {/* Compact Form Header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            id="btn-back-menu-personal"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setViewMode('menu');
            }}
            className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Batal / Kembali ke Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white">
              {editingExpense ? '✏️ Edit Pengeluaran' : 'Catat Pengeluaran Pribadi'}
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
            <span>Tanggal &amp; Pos Anggaran</span>
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
            <span>Nominal &amp; Keperluan</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSaveExpense} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {/* TAHAP 1: Tanggal & Pos Kategori */}
          {inputStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 1: Tanggal &amp; Pos Anggaran</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Pilih tanggal transaksi dan kelompok pos pengeluaran.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Pengeluaran <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  Pilih Pos Kategori Anggaran <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['sehari_hari', 'utang', 'tabungan', 'investasi_toko'] as PersonalBudgetCategory[]).map(catKey => {
                    const isSelected = expenseCategory === catKey;
                    return (
                      <div
                        key={catKey}
                        onClick={() => setExpenseCategory(catKey)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white'
                            : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl">{CATEGORY_ICONS[catKey]}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{CATEGORY_NAMES[catKey]}</div>
                          <div className="text-[10px] text-zinc-500">
                            Pagu: {formatRupiah(budgetNominal[catKey])}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInputStep(2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Tahap Selanjutnya: Nominal &amp; Keperluan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2: Nominal & Keperluan */}
          {inputStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 2: Masukkan Nominal &amp; Keterangan Keperluan</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Tentukan nilai nominal rupiah dan rincian catatan kebutuhan.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={expenseAmount}
                  onChange={setExpenseAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {formatRupiah(expenseAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Keterangan / Deskripsi Keperluan (Opsional)
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={e => setExpenseDescription(e.target.value)}
                  placeholder="Misal: Belanja sembako pasar, bayar tagihan listrik rumah"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
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
                  id="btn-submit-personal-expense"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
        </div>
      )}

      {/* ================= 3. PENGATURAN ALOKASI STATE (Tanpa Tab) ================= */}
      {viewMode === 'pengaturan' && (
        <div className="max-w-2xl mx-auto space-y-3.5 sm:space-y-4">
        {/* Compact Form Header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            id="btn-back-menu-from-pengaturan"
            type="button"
            onClick={() => setViewMode('menu')}
            className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Batal / Kembali ke Menu</span>
          </button>

          <span className="text-xs font-black text-white">⚙️ Pengaturan Rasio Anggaran</span>
        </div>

        <form onSubmit={handleSaveAllocation} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          <div className="border-b border-white/10 pb-2">
            <h3 className="text-sm font-black text-white">Alokasi Persentase Budget (Harus Pas 100%)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Tentukan pembagian uang pribadi ke dalam 4 pos utama.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Total Dana Pribadi Bulanan (Rp)
            </label>
            <CommaNumberInput
              value={totalIncome}
              onChange={setTotalIncome}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              {formatRupiah(totalIncome)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-xs text-zinc-300 font-bold">🛒 Kebutuhan Sehari-hari</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sehariHariPercent}
                  onChange={e => setSehariHariPercent(parseInt(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 text-xs rounded-lg bg-[#161823] border border-white/10 text-white font-bold text-right"
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-xs text-zinc-300 font-bold">💳 Utang &amp; Cicilan</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={utangPercent}
                  onChange={e => setUtangPercent(parseInt(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 text-xs rounded-lg bg-[#161823] border border-white/10 text-white font-bold text-right"
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-xs text-zinc-300 font-bold">💰 Tabungan &amp; Dana Darurat</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tabunganPercent}
                  onChange={e => setTabunganPercent(parseInt(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 text-xs rounded-lg bg-[#161823] border border-white/10 text-white font-bold text-right"
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-white/5">
              <span className="text-xs text-zinc-300 font-bold">🚀 Investasi &amp; Pengembangan</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={investasiTokoPercent}
                  onChange={e => setInvestasiTokoPercent(parseInt(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1 text-xs rounded-lg bg-[#161823] border border-white/10 text-white font-bold text-right"
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-between text-xs">
            <span>Total Persentase:</span>
            <strong className={totalPercent === 100 ? 'text-emerald-400' : 'text-[#FE2C55]'}>
              {totalPercent}% {totalPercent === 100 ? '✓ Tepat' : '(Harus 100%)'}
            </strong>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={totalPercent !== 100}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#25F4EE] disabled:opacity-50 text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Pengaturan Rasio</span>
            </button>
          </div>
        </form>
        </div>
      )}

      {/* ================= 4. OUTPUT & LAPORAN STATE (STANDARDIZED UI) ================= */}
      {viewMode === 'output' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                id="btn-back-menu-from-output-personal"
                type="button"
                onClick={() => setViewMode('menu')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0c1527] hover:bg-[#122038] border border-[#162544] flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                title="Kembali ke Menu Keuangan"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                  Riwayat Pengeluaran Pribadi
                </h1>
                <p className="text-[9px] xs:text-[10px] sm:text-xs text-slate-400 truncate">
                  Pagu anggaran &amp; realisasi belanja pribadi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('pengaturan')}
                className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0c1527] border border-[#162544] hover:bg-[#122038] text-slate-200 text-[10px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <Settings className="w-3 h-3 text-[#00f2fe]" />
                <span className="hidden xs:inline">Atur %</span>
              </button>

              <button
                id="btn-open-form-from-output-personal"
                type="button"
                onClick={() => {
                  handleCancelEdit();
                  setInputStep(1);
                  setViewMode('input');
                }}
                className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-[10px] sm:text-xs md:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#050811] stroke-[2.5]" />
                <span>+ Catat Pengeluaran</span>
              </button>
            </div>
          </div>

          {/* 3-Column Top Summary Card */}
          <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
            <div className="grid grid-cols-3 divide-x divide-[#142239]">
              {/* 1. Total Pengeluaran */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#ff3366]/10 border border-[#ff3366] text-[#ff3366] flex items-center justify-center shrink-0">
                    <DollarSign className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                    Total Belanja
                  </span>
                </div>
                <div className="text-[#ff3366] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                  {formatRupiah(totalFilteredExpense)}
                </div>
              </div>

              {/* 2. Total Catatan */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] text-[#00f2fe] flex items-center justify-center shrink-0">
                    <ClipboardList className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                    Total Catatan
                  </span>
                </div>
                <div className="text-[#00f2fe] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                  {filteredExpenses.length} Transaksi
                </div>
              </div>

              {/* 3. Sisa Anggaran */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full ${isDeficit ? 'bg-[#ff3366]/10 border-[#ff3366] text-[#ff3366]' : 'bg-[#00e676]/10 border-[#00e676] text-[#00e676]'} border flex items-center justify-center shrink-0`}>
                    <Wallet className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                    Sisa Anggaran
                  </span>
                </div>
                <div className={`${isDeficit ? 'text-[#ff3366]' : 'text-[#00e676]'} font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate`}>
                  {formatRupiah(totalRemaining)}
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Batas Anggaran per Kategori */}
          <div className="bg-[#0a1220] rounded-2xl p-3 sm:p-4 border border-[#142239] space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#142239] pb-2">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#00f2fe]" />
                <span>Pagu Anggaran vs Realisasi</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Dana: <strong className="text-white">{formatRupiah(totalIncome)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['sehari_hari', 'utang', 'tabungan', 'investasi_toko'] as PersonalBudgetCategory[]).map(catKey => {
                const allocNominal = budgetNominal[catKey];
                const spent = expenseByCategory[catKey];
                const isOver = allocNominal - spent < 0;
                const pct = allocNominal > 0 ? Math.min(200, Math.round((spent / allocNominal) * 100)) : 0;
                const barWidth = Math.min(100, pct);

                return (
                  <div key={catKey} className="p-2 sm:p-2.5 rounded-xl bg-[#0c1527] border border-[#162544] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{CATEGORY_ICONS[catKey]}</span>
                        <span className="truncate">{catKey === 'sehari_hari' ? 'Sehari-hari' : catKey === 'utang' ? 'Utang' : catKey === 'tabungan' ? 'Tabungan' : 'Investasi'}</span>
                      </span>
                      <span className={`font-black tabular-nums ${isOver ? 'text-[#ff3366]' : 'text-[#00e676]'}`}>
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#142239] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-[#ff3366]' : 'bg-[#00f2fe]'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 pt-0.5">
                      <span>{formatRupiah(spent)}</span>
                      <span>/ {formatRupiah(allocNominal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'sehari_hari', label: 'Sehari-hari' },
              { id: 'utang', label: 'Utang & Cicilan' },
              { id: 'tabungan', label: 'Tabungan' },
              { id: 'investasi_toko', label: 'Investasi Usaha' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                    : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Second Row: Periode Dropdown + Search Box */}
          <div className="flex items-center gap-2">
            {/* Periode Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c1527] border border-[#162544] hover:border-[#00f2fe]/40 text-slate-200 text-[10px] sm:text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-[#00f2fe]" />
                <span>
                  {periodFilter === 'all' && 'Semua Periode'}
                  {periodFilter === 'today' && 'Hari Ini'}
                  {periodFilter === 'weekly' && '7 Hari Terakhir'}
                  {periodFilter === 'monthly' && 'Bulan Ini'}
                  {periodFilter === 'specific' && `Tgl: ${formatScreenshotDate(specificDate)}`}
                  {periodFilter === 'range' && 'Rentang Tgl'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isPeriodDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 p-3 bg-[#0c1527] border border-[#162544] rounded-2xl shadow-2xl z-30 space-y-2 text-xs">
                  <div className="font-bold text-slate-300 pb-1 border-b border-[#142239] text-[11px]">
                    Pilih Periode Waktu
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodFilter('all');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition ${
                        periodFilter === 'all' ? 'bg-[#00f2fe] text-black font-bold' : 'text-slate-300 hover:bg-[#142239]'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodFilter('today');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition ${
                        periodFilter === 'today' ? 'bg-[#00f2fe] text-black font-bold' : 'text-slate-300 hover:bg-[#142239]'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodFilter('weekly');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition ${
                        periodFilter === 'weekly' ? 'bg-[#00f2fe] text-black font-bold' : 'text-slate-300 hover:bg-[#142239]'
                      }`}
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodFilter('monthly');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition ${
                        periodFilter === 'monthly' ? 'bg-[#00f2fe] text-black font-bold' : 'text-slate-300 hover:bg-[#142239]'
                      }`}
                    >
                      Bulan Ini
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#142239] space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Tanggal Tertentu:</label>
                      <input
                        type="date"
                        value={specificDate}
                        onChange={e => {
                          setSpecificDate(e.target.value);
                          setPeriodFilter('specific');
                        }}
                        className="w-full px-2 py-1 bg-[#060b14] border border-[#162544] rounded-lg text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Rentang Tanggal:</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={startDate}
                          onChange={e => {
                            setStartDate(e.target.value);
                            setPeriodFilter('range');
                          }}
                          className="px-2 py-1 bg-[#060b14] border border-[#162544] rounded-lg text-white text-[10px]"
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={e => {
                            setEndDate(e.target.value);
                            setPeriodFilter('range');
                          }}
                          className="px-2 py-1 bg-[#060b14] border border-[#162544] rounded-lg text-white text-[10px]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPeriodDropdownOpen(false)}
                    className="w-full py-1 text-center text-[10px] text-slate-400 hover:text-white pt-1"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari pos anggaran atau keperluan..."
                className="w-full pl-8 pr-7 py-1.5 text-[10px] sm:text-xs rounded-xl bg-[#0c1527] border border-[#162544] text-white placeholder-slate-500 focus:outline-none focus:border-[#00f2fe]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 5-Column Table */}
          <div className="bg-[#0a1220] border border-[#142239] rounded-2xl overflow-hidden shadow-xl">
            <table className="table-fixed w-full border-collapse">
              <thead>
                <tr className="border-b border-[#142239] bg-[#0c1527]/90 text-[7px] xs:text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="w-[15%] py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-left font-bold truncate">Tanggal</th>
                  <th className="w-[35%] py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-left font-bold truncate">Pos Anggaran</th>
                  <th className="w-[16.5%] py-2.5 px-0.5 xs:px-1 text-center font-bold truncate">Kategori</th>
                  <th className="w-[16.5%] py-2.5 px-0.5 xs:px-1 text-center font-bold truncate">Jenis</th>
                  <th className="w-[17%] py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-right font-bold truncate">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142239]/60">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                      Belum ada catatan pengeluaran pribadi pada periode ini
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDetailExpense(item)}
                      className="hover:bg-[#0e182c]/80 transition cursor-pointer"
                    >
                      {/* Tanggal */}
                      <td className="py-2 sm:py-2.5 px-1 xs:px-1.5 sm:px-2.5 align-middle">
                        <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] md:text-xs text-slate-300 font-semibold tracking-tight whitespace-nowrap block truncate">
                          {formatScreenshotDate(item.date)}
                        </span>
                      </td>

                      {/* Pos Anggaran */}
                      <td className="py-2 sm:py-2.5 px-1 xs:px-1.5 sm:px-2.5 align-middle min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                          <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 flex items-center justify-center shrink-0 text-xs">
                            {CATEGORY_ICONS[item.category]}
                          </div>
                          <div className="min-w-0 flex-1 truncate">
                            <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold text-white block truncate leading-tight">
                              {CATEGORY_NAMES[item.category]}
                            </span>
                            <span className="text-[5.5px] xs:text-[6.5px] sm:text-[9px] text-slate-400 block truncate">
                              {item.description || 'Pengeluaran pribadi'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-2 sm:py-2.5 px-0.5 xs:px-1 text-center align-middle">
                        <span className="inline-block text-[6px] xs:text-[7px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full bg-[#0c1527] border border-[#162544] text-[#00f2fe] truncate max-w-full">
                          {item.category === 'sehari_hari' ? 'Sehari-hari' : item.category === 'utang' ? 'Utang' : item.category === 'tabungan' ? 'Tabungan' : 'Investasi'}
                        </span>
                      </td>

                      {/* Jenis */}
                      <td className="py-2 sm:py-2.5 px-0.5 xs:px-1 text-center align-middle">
                        <span className="text-[6.5px] xs:text-[7.5px] sm:text-xs font-semibold text-slate-300 block truncate">
                          Pribadi
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-2 sm:py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-right align-middle">
                        <span className="text-[7px] xs:text-[8px] sm:text-xs font-black text-[#ff3366] tabular-nums whitespace-nowrap block truncate">
                          {formatRupiah(item.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedDetailExpense(null)}
        >
          <div
            className="w-full max-w-md bg-[#0a1220] border border-[#142239] rounded-3xl p-5 shadow-2xl space-y-4 text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#142239]">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Detail Pengeluaran Pribadi
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatDateIndo(selectedDetailExpense.date)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailExpense(null)}
                className="w-7 h-7 rounded-full bg-[#142239] hover:bg-[#1e3252] flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Banner */}
            <div className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#162544] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{CATEGORY_ICONS[selectedDetailExpense.category]}</span>
                <div>
                  <span className="text-xs font-black text-white block">
                    {CATEGORY_NAMES[selectedDetailExpense.category]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Pos Anggaran Pengeluaran
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-[#ff3366] block">
                  {formatRupiah(selectedDetailExpense.amount)}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Tanggal:</span>
                <span className="font-bold text-white text-xs">
                  {formatDateIndo(selectedDetailExpense.date)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Jenis Alokasi:</span>
                <span className="font-bold text-[#00f2fe] text-xs">
                  Uang Pribadi
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544] col-span-2">
                <span className="text-[10px] text-slate-400 block mb-0.5">Keperluan / Keterangan:</span>
                <span className="text-xs text-white">
                  {selectedDetailExpense.description || 'Tidak ada keterangan tambahan'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#142239]">
              <button
                type="button"
                onClick={() => setSelectedDetailExpense(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDetailExpense;
                    setSelectedDetailExpense(null);
                    handleDeleteExpense(item.id, item.description || `${CATEGORY_NAMES[item.category]} - ${formatRupiah(item.amount)}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#ff3366]/15 hover:bg-[#ff3366]/25 border border-[#ff3366]/30 text-[#ff3366] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDetailExpense;
                    setSelectedDetailExpense(null);
                    handleStartEdit(item);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00f2fe] text-black text-xs font-black shadow-lg shadow-cyan-500/20 hover:bg-[#19e6f1] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>
              </div>
            </div>
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
