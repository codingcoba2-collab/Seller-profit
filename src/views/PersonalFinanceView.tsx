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
  FileSpreadsheet
} from 'lucide-react';

interface PersonalFinanceViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ActiveTab = 'laporan' | 'input' | 'pengaturan';
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
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('laporan');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');

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
    const alloc = StorageService.getPersonalBudgetAllocation(currentUser.storeId);
    setTotalIncome(alloc.totalIncome || 1000000);
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

  // Total Percentage validation
  const totalPercent = sehariHariPercent + utangPercent + tabunganPercent + investasiTokoPercent;

  // Calculated Budget Amounts from Income
  const budgetNominal = {
    sehari_hari: Math.round((sehariHariPercent / 100) * totalIncome),
    utang: Math.round((utangPercent / 100) * totalIncome),
    tabungan: Math.round((tabunganPercent / 100) * totalIncome),
    investasi_toko: Math.round((investasiTokoPercent / 100) * totalIncome),
  };

  // Date Filter Logic
  const todayStr = getTodayString();
  const getFilterDateFn = () => {
    if (periodFilter === 'today') {
      return (d: string) => d === todayStr;
    }
    if (periodFilter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      return (d: string) => d >= weekAgoStr && d <= todayStr;
    }
    if (periodFilter === 'monthly') {
      const monthPrefix = todayStr.slice(0, 7);
      return (d: string) => d.startsWith(monthPrefix);
    }
    return () => true;
  };

  const filteredExpenses = expenses.filter(e => getFilterDateFn()(e.date));

  // Expenses per Category
  const expenseByCategory = {
    sehari_hari: filteredExpenses.filter(e => e.category === 'sehari_hari').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    utang: filteredExpenses.filter(e => e.category === 'utang').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    tabungan: filteredExpenses.filter(e => e.category === 'tabungan').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    investasi_toko: filteredExpenses.filter(e => e.category === 'investasi_toko').reduce((acc, curr) => acc + (curr.amount || 0), 0),
  };

  const totalFilteredExpense = 
    expenseByCategory.sehari_hari + 
    expenseByCategory.utang + 
    expenseByCategory.tabungan + 
    expenseByCategory.investasi_toko;

  const totalRemaining = totalIncome - totalFilteredExpense;
  const isDeficit = totalRemaining < 0;

  // Save Allocation Settings
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercent !== 100) {
      onNotify(`Total alokasi persentase harus tepat 100%! (Saat ini: ${totalPercent}%)`, 'error');
      return;
    }
    if (totalIncome <= 0) {
      onNotify('Nominal uang pribadi yang masuk harus lebih dari Rp 0.', 'error');
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

    StorageService.savePersonalBudgetAllocation(currentUser.storeId, alloc);
    onNotify('Pengaturan alokasi keuangan pribadi berhasil disimpan!', 'success');
    setActiveTab('laporan');
  };

  // Submit Expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      onNotify('Nominal pengeluaran harus lebih dari Rp 0.', 'error');
      return;
    }

    const record: PersonalExpenseRecord = {
      id: editingExpense ? editingExpense.id : 'pexp-' + Date.now(),
      storeId: currentUser.storeId,
      date: expenseDate,
      category: expenseCategory,
      amount: expenseAmount,
      description: expenseDescription.trim() || `Pengeluaran ${CATEGORY_NAMES[expenseCategory]}`,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    if (editingExpense) {
      StorageService.updatePersonalExpense(record);
      onNotify('Data pengeluaran pribadi berhasil diperbarui!', 'success');
      setEditingExpense(null);
    } else {
      StorageService.addPersonalExpense(record);
      onNotify('Pengeluaran pribadi berhasil dicatat!', 'success');
    }

    // Reset Form
    setExpenseAmount(50000);
    setExpenseDescription('');
    setExpenseDate(getTodayString());
    loadData();
    setActiveTab('laporan');
  };

  const handleEdit = (exp: PersonalExpenseRecord) => {
    setEditingExpense(exp);
    setExpenseDate(exp.date);
    setExpenseCategory(exp.category);
    setExpenseAmount(exp.amount);
    setExpenseDescription(exp.description);
    setActiveTab('input');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus catatan pengeluaran pribadi ini?')) {
      StorageService.deletePersonalExpense(id);
      loadData();
      onNotify('Catatan pengeluaran berhasil dihapus.', 'info');
    }
  };

  // Check Category Remaining for the input form
  const categoryAllocated = budgetNominal[expenseCategory];
  const categorySpent = expenseByCategory[expenseCategory];
  const categoryRemainingBefore = categoryAllocated - categorySpent;
  const willExceed = expenseAmount > categoryRemainingBefore;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Top Banner */}
      <div className="bg-[#161823] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Cashflow &amp; Keuangan Pribadi Owner</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Manajemen Arus Kas &amp; Alokasi Uang Pribadi
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Kendalikan uang pribadi yang masuk, tetapkan alokasi persentase (<strong className="text-white">sehari-hari, utang, tabungan, investasi</strong>), pantau pengeluaran harian, dan evaluasi apakah keuangan Anda aman atau minus.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="tab-btn-laporan-pribadi"
              type="button"
              onClick={() => setActiveTab('laporan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                activeTab === 'laporan'
                  ? 'bg-white text-zinc-900 border-white shadow-md'
                  : 'bg-[#12141c] hover:bg-[#1a1d2c] text-zinc-300 border-white/10'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Laporan &amp; Rekap</span>
            </button>

            <button
              id="tab-btn-input-pribadi"
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setActiveTab('input');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                activeTab === 'input'
                  ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/20'
                  : 'bg-[#12141c] hover:bg-[#1a1d2c] text-zinc-300 border-white/10'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Pengeluaran</span>
            </button>

            <button
              id="tab-btn-pengaturan-pribadi"
              type="button"
              onClick={() => setActiveTab('pengaturan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                activeTab === 'pengaturan'
                  ? 'bg-[#25F4EE] text-zinc-950 border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                  : 'bg-[#12141c] hover:bg-[#1a1d2c] text-zinc-300 border-white/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pengaturan Biaya</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: LAPORAN & REKAPITULASI KEUANGAN PRIBADI */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          {/* Period Filter Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161823] p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#25F4EE]" />
              <span className="text-xs font-bold text-white">Periode Laporan Keuangan:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'today', label: 'Hari Ini' },
                { key: 'weekly', label: '7 Hari Terakhir' },
                { key: 'monthly', label: 'Bulan Ini' },
                { key: 'all', label: 'Semua Riwayat' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodFilter(p.key as PeriodFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    periodFilter === p.key
                      ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Financial Health Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Total Uang Masuk */}
            <div className="bg-[#161823] border border-white/10 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Total Alokasi Masuk</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {formatRupiah(totalIncome)}
              </div>
              <p className="text-[11px] text-zinc-500">
                Alokasi uang pribadi siap pakai
              </p>
            </div>

            {/* 2. Total Pengeluaran Terpakai */}
            <div className="bg-[#161823] border border-white/10 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Total Pengeluaran</span>
                <TrendingDown className="w-4 h-4 text-[#FE2C55]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#FE2C55]">
                {formatRupiah(totalFilteredExpense)}
              </div>
              <p className="text-[11px] text-zinc-500">
                {filteredExpenses.length} catatan pengeluaran pribadi
              </p>
            </div>

            {/* 3. Sisa Saldo / Defisit */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              isDeficit 
                ? 'bg-rose-500/10 border-rose-500/30' 
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isDeficit ? 'text-rose-400' : 'text-emerald-400'}>
                  {isDeficit ? 'Defisit / Minus' : 'Sisa Saldo Aman (Surplus)'}
                </span>
                {isDeficit ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className={`text-xl sm:text-2xl font-black ${
                isDeficit ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {isDeficit ? `- ${formatRupiah(Math.abs(totalRemaining))}` : formatRupiah(totalRemaining)}
              </div>
              <p className="text-[11px] text-zinc-400">
                {isDeficit 
                  ? '⚠️ Pengeluaran melebihi batas total uang masuk!' 
                  : '✅ Keuangan pribadi dalam kondisi surplus seimbang.'}
              </p>
            </div>
          </div>

          {/* Category Allocation Progress Bar Breakdown */}
          <div className="bg-[#161823] rounded-3xl p-5 sm:p-6 border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#25F4EE]" />
                  <span>Monitoring Batas Anggaran per Kategori</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Perbandingan nominal anggaran yang direncanakan dengan realisasi pengeluaran riil.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('pengaturan')}
                className="text-xs text-[#25F4EE] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Ubah Rasio %</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['sehari_hari', 'utang', 'tabungan', 'investasi_toko'] as PersonalBudgetCategory[]).map(catKey => {
                const allocNominal = budgetNominal[catKey];
                const spent = expenseByCategory[catKey];
                const diff = allocNominal - spent;
                const isOver = diff < 0;
                const pct = allocNominal > 0 ? Math.min(200, Math.round((spent / allocNominal) * 100)) : 0;
                const barWidth = Math.min(100, pct);

                return (
                  <div 
                    key={catKey}
                    className={`p-4 rounded-2xl bg-[#0b0c10] border transition ${
                      isOver ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/5'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CATEGORY_ICONS[catKey]}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{CATEGORY_NAMES[catKey]}</h4>
                          <span className="text-[10px] text-zinc-400">
                            Anggaran: {formatRupiah(allocNominal)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-black ${isOver ? 'text-rose-400' : 'text-[#25F4EE]'}`}>
                          {formatRupiah(spent)}
                        </div>
                        <span className={`text-[10px] font-bold ${isOver ? 'text-rose-400' : 'text-zinc-400'}`}>
                          {pct}% terpakai
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-400' : 'bg-[#25F4EE]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-zinc-400">
                        {isOver ? 'Melebihi Kuota:' : 'Sisa Batas:'}
                      </span>
                      <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isOver ? `Over ${formatRupiah(Math.abs(diff))}` : `${formatRupiah(diff)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense Log History Table */}
          <div className="bg-[#161823] rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Riwayat Pengeluaran Pribadi ({filteredExpenses.length} Transaksi)</span>
              </h3>

              <button
                id="btn-add-expense-quick"
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setActiveTab('input');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FE2C55] text-white hover:bg-[#FE2C55]/90 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengeluaran</span>
              </button>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-10 bg-[#0b0c10] rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs text-zinc-400">Belum ada catatan pengeluaran pada periode ini.</p>
                <p className="text-[11px] text-zinc-500">
                  Klik tombol <strong>"Tambah Pengeluaran"</strong> untuk mulai mencatat.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3 px-3">Tanggal</th>
                      <th className="pb-3 px-3">Kategori</th>
                      <th className="pb-3 px-3">Keterangan</th>
                      <th className="pb-3 px-3 text-right">Nominal</th>
                      <th className="pb-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredExpenses.map(exp => {
                      const isSynced = exp.syncedFromCashflowId;

                      return (
                        <tr key={exp.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-medium text-zinc-300 whitespace-nowrap">
                            {formatDateIndo(exp.date)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-zinc-200">
                              <span>{CATEGORY_ICONS[exp.category]}</span>
                              <span>{CATEGORY_NAMES[exp.category]}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-300 max-w-xs">
                            <div className="font-semibold text-white">{exp.description}</div>
                            {isSynced && (
                              <span className="text-[9px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                🔄 Otomatis dari Cashflow Toko (Prive)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#FE2C55] whitespace-nowrap">
                            {formatRupiah(exp.amount)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(exp)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
                                title="Edit Pengeluaran"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(exp.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Hapus Pengeluaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INPUT DATA PENGELUARAN PRIBADI */}
      {activeTab === 'input' && (
        <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FE2C55]" />
                <span>{editingExpense ? 'Edit Pengeluaran Pribadi' : 'Input Data Pengeluaran Pribadi Harian'}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Catat pengeluaran untuk membaca apakah sehari-hari, utang, tabungan, atau investasi melebihi batas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setActiveTab('laporan');
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕ Batal
            </button>
          </div>

          <form onSubmit={handleSubmitExpense} className="space-y-5">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tanggal Pengeluaran <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                id="input-expense-date"
                type="date"
                required
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
              />
            </div>

            {/* Kategori Pengeluaran */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Pilih Kategori Pengeluaran <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['sehari_hari', 'utang', 'tabungan', 'investasi_toko'] as PersonalBudgetCategory[]).map(catKey => {
                  const isSelected = expenseCategory === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setExpenseCategory(catKey)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-400 text-white shadow-md'
                          : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xl">{CATEGORY_ICONS[catKey]}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{CATEGORY_NAMES[catKey]}</div>
                        <div className="text-[10px] text-zinc-400">
                          Sisa: {formatRupiah(budgetNominal[catKey] - expenseByCategory[catKey])}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nominal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-300">
                  Nominal Pengeluaran (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <span className="text-xs font-black text-[#FE2C55]">
                  {formatRupiah(expenseAmount)}
                </span>
              </div>
              <CommaNumberInput
                id="input-expense-amount"
                value={expenseAmount}
                onChange={setExpenseAmount}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />

              {/* Quick Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {[15000, 25000, 50000, 100000, 250000, 500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setExpenseAmount(amt)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
                  >
                    + {formatNumber(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Realtime Over-Budget Warning / Limit Check */}
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              willExceed
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {willExceed ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>
                  {willExceed
                    ? `Perhatian: Pengeluaran ini akan melebihi batas anggaran ${CATEGORY_NAMES[expenseCategory]}!`
                    : `Status Anggaran Aman untuk ${CATEGORY_NAMES[expenseCategory]}.`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Kapasitas anggaran tersisa: <strong className="text-white">{formatRupiah(categoryRemainingBefore)}</strong>.
                {willExceed && ` Pengeluaran sebesar ${formatRupiah(expenseAmount)} akan menyebabkan over-budget sebesar ${formatRupiah(expenseAmount - categoryRemainingBefore)}.`}
              </p>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Keterangan / Catatan Pengeluaran
              </label>
              <input
                id="input-expense-desc"
                type="text"
                placeholder="Misal: Beli makan siang, bayar cicilan motor, top up tabungan, beli rak toko"
                value={expenseDescription}
                onChange={e => setExpenseDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setActiveTab('laporan');
                }}
                className="w-1/3 py-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
              >
                Kembali
              </button>
              <button
                id="btn-submit-expense"
                type="submit"
                className="w-2/3 py-3 rounded-xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PENGATURAN BIAYA & ALOKASI PERSENTASE */}
      {activeTab === 'pengaturan' && (
        <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-3xl mx-auto space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#25F4EE]" />
              <span>Pengaturan Biaya &amp; Alokasi Uang Pribadi</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tentukan uang pribadi yang masuk (misal: Rp 1.000.000) dan atur pembagian persentase untuk masing-masing pos alokasi (total harus 100%).
            </p>
          </div>

          <form onSubmit={handleSaveAllocation} className="space-y-6">
            {/* Input Uang Pribadi Masuk */}
            <div className="p-5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Uang Pribadi yang Masuk (Prive / Income Bulanan)</span>
                </label>
                <span className="text-sm font-black text-emerald-400">
                  {formatRupiah(totalIncome)}
                </span>
              </div>
              <CommaNumberInput
                id="input-total-income"
                value={totalIncome}
                onChange={setTotalIncome}
                className="w-full px-3.5 py-3 text-sm font-bold rounded-xl bg-[#161823] border border-white/10 text-white focus:border-[#25F4EE]"
              />
              <div className="flex flex-wrap gap-1.5">
                {[500000, 1000000, 2000000, 5000000, 10000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTotalIncome(val)}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
                  >
                    Rp {formatNumber(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Allocation Percentage Sliders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Alokasi Persentase Pos Keuangan
                </h4>
                <div className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                  totalPercent === 100 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                }`}>
                  Total: {totalPercent}% / 100%
                </div>
              </div>

              {/* 1. Sehari-hari */}
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>🛒</span>
                    <span>1. Alokasi Sehari-hari (Makan, Belanja Pokok)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#25F4EE]">{sehariHariPercent}%</span>
                    <span className="text-[11px] text-zinc-400">
                      ({formatRupiah(budgetNominal.sehari_hari)})
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sehariHariPercent}
                  onChange={e => setSehariHariPercent(parseInt(e.target.value) || 0)}
                  className="w-full accent-[#25F4EE]"
                />
              </div>

              {/* 2. Utang */}
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>💳</span>
                    <span>2. Alokasi Utang &amp; Cicilan</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-400">{utangPercent}%</span>
                    <span className="text-[11px] text-zinc-400">
                      ({formatRupiah(budgetNominal.utang)})
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={utangPercent}
                  onChange={e => setUtangPercent(parseInt(e.target.value) || 0)}
                  className="w-full accent-rose-400"
                />
              </div>

              {/* 3. Tabungan */}
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>💰</span>
                    <span>3. Alokasi Tabungan &amp; Dana Darurat</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400">{tabunganPercent}%</span>
                    <span className="text-[11px] text-zinc-400">
                      ({formatRupiah(budgetNominal.tabungan)})
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tabunganPercent}
                  onChange={e => setTabunganPercent(parseInt(e.target.value) || 0)}
                  className="w-full accent-emerald-400"
                />
              </div>

              {/* 4. Investasi & Pengembangan Toko */}
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>4. Investasi &amp; Pengembangan Toko</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-400">{investasiTokoPercent}%</span>
                    <span className="text-[11px] text-zinc-400">
                      ({formatRupiah(budgetNominal.investasi_toko)})
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={investasiTokoPercent}
                  onChange={e => setInvestasiTokoPercent(parseInt(e.target.value) || 0)}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>

            {/* Preset Standard Buttons */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-zinc-300 block">Pilih Preset Rekomendasi:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSehariHariPercent(50);
                    setUtangPercent(20);
                    setTabunganPercent(15);
                    setInvestasiTokoPercent(15);
                  }}
                  className="p-2.5 rounded-xl border border-white/10 text-left hover:border-[#25F4EE]/50 bg-white/5 transition"
                >
                  <div className="text-xs font-bold text-white">Preset Standar Owner (50-20-15-15)</div>
                  <div className="text-[10px] text-zinc-400">Sehari-hari 50%, Utang 20%, Tabungan 15%, Investasi 15%</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSehariHariPercent(50);
                    setUtangPercent(30);
                    setTabunganPercent(10);
                    setInvestasiTokoPercent(10);
                  }}
                  className="p-2.5 rounded-xl border border-white/10 text-left hover:border-[#25F4EE]/50 bg-white/5 transition"
                >
                  <div className="text-xs font-bold text-white">Preset Lunasi Utang (50-30-10-10)</div>
                  <div className="text-[10px] text-zinc-400">Prioritas alokasi pembayaran kewajiban utang 30%</div>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              id="btn-save-allocation-settings"
              type="submit"
              disabled={totalPercent !== 100}
              className={`w-full py-4 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                totalPercent === 100
                  ? 'bg-[#25F4EE] text-zinc-950 hover:bg-[#25F4EE]/90 shadow-lg shadow-[#25F4EE]/20 active:scale-98'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Pengaturan Alokasi Keuangan Pribadi</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
