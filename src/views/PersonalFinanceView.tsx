import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
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
  Settings
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';

interface PersonalFinanceViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PersonalFinanceViewMode = 'menu' | 'input' | 'output' | 'pengaturan';
type PeriodFilter = 'today' | 'weekly' | 'monthly' | 'all';

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

  // Filter expenses by period
  const todayStr = getTodayString();
  const filteredExpenses = expenses.filter(item => {
    if (periodFilter === 'today') return item.date === todayStr;
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
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* ================= 1. MENU HUB STATE (Grid Kecil 2 Kesamping) ================= */}
      {viewMode === 'menu' && (
        <div className="space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-personal"
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
                <span>Pos Keuangan Pribadi Owner</span>
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            Sisa Dana: <strong className={isDeficit ? 'text-[#FE2C55]' : 'text-[#25F4EE]'}>{formatRupiah(totalRemaining)}</strong>
          </div>
        </div>

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
            <div className="text-[10px] text-zinc-400 font-semibold">Status Keuangan</div>
            <div className={`text-sm sm:text-base font-black ${isDeficit ? 'text-[#FE2C55]' : 'text-emerald-400'}`}>
              {isDeficit ? 'Defisit / Minus' : 'Surplus Aman'}
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
        <div className="max-w-3xl mx-auto space-y-4">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-personal"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setViewMode('menu');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Kembali ke Menu</span>
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
        <div className="max-w-2xl mx-auto space-y-4">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-from-pengaturan"
            type="button"
            onClick={() => setViewMode('menu')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Kembali ke Menu</span>
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

      {/* ================= 4. OUTPUT & LAPORAN STATE (Tanpa Tab) ================= */}
      {viewMode === 'output' && (
        <div className="space-y-4">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <button
          id="btn-back-menu-from-output-personal"
          type="button"
          onClick={() => setViewMode('menu')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kembali ke Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('pengaturan')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition border border-white/10 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Atur %</span>
          </button>
          <button
            id="btn-open-form-from-output-personal"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setInputStep(1);
              setViewMode('input');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Category Allocation Progress Bar Breakdown */}
      <div className="bg-[#161823] rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#25F4EE]" />
              <span>Monitoring Batas Anggaran per Kategori</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Pagu anggaran vs realisasi riil pengeluaran pribadi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(['sehari_hari', 'utang', 'tabungan', 'investasi_toko'] as PersonalBudgetCategory[]).map(catKey => {
            const allocNominal = budgetNominal[catKey];
            const spent = expenseByCategory[catKey];
            const diff = allocNominal - spent;
            const isOver = diff < 0;
            const pct = allocNominal > 0 ? Math.min(200, Math.round((spent / allocNominal) * 100)) : 0;
            const barWidth = Math.min(100, pct);

            return (
              <div key={catKey} className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{CATEGORY_ICONS[catKey]}</span>
                    <span>{CATEGORY_NAMES[catKey]}</span>
                  </span>
                  <span className={`font-black ${isOver ? 'text-[#FE2C55]' : 'text-emerald-400'}`}>
                    {pct}% Terpakai
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-[#FE2C55]' : 'bg-[#25F4EE]'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                  <span>Terpakai: <strong className="text-white">{formatRupiah(spent)}</strong></span>
                  <span>Pagu: <strong className="text-zinc-300">{formatRupiah(allocNominal)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex items-center justify-between gap-2.5">
        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value as any)}
          className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
        >
          <option value="monthly">Bulan Ini</option>
          <option value="today">Hari Ini</option>
          <option value="weekly">7 Hari Terakhir</option>
          <option value="all">Semua Waktu</option>
        </select>

        <div className="text-xs text-zinc-400 font-semibold">
          Total: <strong className="text-white">{filteredExpenses.length}</strong> catatan
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-[#161823] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#25F4EE]" />
            <span>Riwayat Pengeluaran Pribadi</span>
          </h3>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Belum ada catatan pengeluaran pribadi pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c10]/60 text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Pos Anggaran</th>
                  <th className="p-3 font-semibold">Keperluan</th>
                  <th className="p-3 font-semibold text-right">Nominal</th>
                  <th className="p-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredExpenses.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="p-3 whitespace-nowrap font-medium text-zinc-300">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-zinc-200 border border-white/10">
                        {CATEGORY_ICONS[item.category]} {CATEGORY_NAMES[item.category]}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-300 max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right font-bold text-[#FE2C55]">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Edit Pengeluaran"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(item.id, item.description || `${CATEGORY_NAMES[item.category]} - ${formatRupiah(item.amount)}`)}
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
