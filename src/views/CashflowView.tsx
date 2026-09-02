import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CashflowRecord, CurrentUser } from '../types';
import { formatRupiah, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [cashflowList, setCashflowList] = useState<CashflowRecord[]>([]);
  const [editingItem, setEditingItem] = useState<CashflowRecord | null>(null);

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

  const loadData = () => {
    const list = StorageService.getCashflow(currentUser.storeId);
    setCashflowList(list);
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
    setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
  };

  const handleStartEdit = (item: CashflowRecord) => {
    setEditingItem(item);
    setDate(item.date);
    setType(item.type);
    setAmount(item.amount);
    setCategory(item.category);
    setDescription(item.description || '');
    setSubTab('input'); // Switch smoothly to input tab without needing 3rd tab
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      onNotify('Nominal harus lebih dari 0!', 'error');
      return;
    }

    const newRecord: CashflowRecord = {
      id: editingItem ? editingItem.id : 'cf-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      type,
      amount,
      category: type === 'inflow' ? 'penarikan_shopee' : category,
      description,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    if (editingItem) {
      const all = StorageService.getCashflow(currentUser.storeId);
      const updated = all.map(c => c.id === editingItem.id ? newRecord : c);
      localStorage.setItem('shopee_lr_cashflow', JSON.stringify(updated));
      onNotify('Perubahan data cashflow berhasil disimpan!', 'success');
      setEditingItem(null);
    } else {
      StorageService.addCashflow(newRecord);
      onNotify('Catatan cashflow kas berhasil disimpan!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('output');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pencatatan cashflow ini?')) {
      StorageService.deleteCashflow(id);
      loadData();
      onNotify('Data cashflow berhasil dihapus.', 'info');
      if (editingItem?.id === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & Sort list by date descending (Requirement 9)
  const filteredList = cashflowList
    .filter(c => {
      if (searchQuery.trim()) {
        if (!c.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      if (periodFilter === 'today') return c.date === getTodayString();
      if (periodFilter === 'range') return c.date >= startDate && c.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return c.date >= weekAgo && c.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return c.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalInflow = filteredList.filter(c => c.type === 'inflow').reduce((acc, c) => acc + c.amount, 0);
  const totalOutflow = filteredList.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
  const netCashflow = totalInflow - totalOutflow;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without stage labels (Requirement 5 & 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-cashflow"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Cashflow &amp; Arus Kas Keluar/Masuk
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Catat saldo ditarik dari Marketplace / Rekening dan pengeluaran operasional toko (packing, lakban, makan, sewa)
            </p>
          </div>
        </div>
      </div>

      {/* Sub Navigation (2 Clean Tabs) (Requirement 7) */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingItem ? '✏️ Sedang Mengedit Transaksi' : 'Input Kas Masuk/Keluar'}
        outputTitle="Output &amp; Rekap Kas"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-3xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingItem ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <Wallet className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingItem ? 'Edit Catatan Arus Kas' : 'Input Catatan Kas Masuk / Keluar'}</span>
            </h3>
            {editingItem && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Transaksi <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Jenis Arus Kas <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('outflow')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      type === 'outflow'
                        ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/20'
                        : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>Pengeluaran (Kas Keluar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('inflow')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      type === 'inflow'
                        ? 'bg-[#25F4EE] text-black border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                        : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Penarikan Saldo Marketplace</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nominal (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  id="input-cashflow-amount"
                  value={amount}
                  onChange={setAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>

              {type === 'outflow' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CashflowRecord['category'])}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  >
                    <option value="packing">Bahan Packing (Lakban, Plastik, Bubble Wrap)</option>
                    <option value="makan_minum">Konsumsi / Makan &amp; Minum Tim</option>
                    <option value="listrik_wifi">Listrik, Air &amp; Internet WiFi</option>
                    <option value="sewa_tempat">Sewa Tempat / Ruko Live</option>
                    <option value="lainnya">Operasional Lainnya</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Keterangan / Rincian
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Rincian pengeluaran kas"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>

            <button
              id="btn-submit-cashflow"
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs font-extrabold text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingItem ? 'Simpan Perubahan Cashflow' : 'Simpan Transaksi Kas'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & LAPORAN */}
      {subTab === 'output' && (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#161823] border border-white/10 shadow-xl">
              <div className="text-[11px] font-semibold text-zinc-400">Total Penarikan Dana (Inflow)</div>
              <div className="text-xl font-black text-[#25F4EE] mt-1">
                {formatRupiah(totalInflow)}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#161823] border border-white/10 shadow-xl">
              <div className="text-[11px] font-semibold text-zinc-400">Total Pengeluaran Kas (Outflow)</div>
              <div className="text-xl font-black text-[#FE2C55] mt-1">
                {formatRupiah(totalOutflow)}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b0c10] text-white border border-white/10 shadow-xl">
              <div className="text-[11px] font-semibold text-zinc-400">Net Arus Kas (Sisa Kas)</div>
              <div className={`text-xl font-black mt-1 ${netCashflow >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                {formatRupiah(netCashflow)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-[#161823] rounded-2xl border border-white/10 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Periode:</span>
                </span>
                <button
                  onClick={() => setPeriodFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    periodFilter === 'all' ? 'bg-[#25F4EE] text-black shadow-md' : 'bg-[#0b0c10] text-zinc-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setPeriodFilter('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    periodFilter === 'today' ? 'bg-[#25F4EE] text-black shadow-md' : 'bg-[#0b0c10] text-zinc-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setPeriodFilter('weekly')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    periodFilter === 'weekly' ? 'bg-[#25F4EE] text-black shadow-md' : 'bg-[#0b0c10] text-zinc-400 border border-white/10 hover:text-white'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setPeriodFilter('monthly')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    periodFilter === 'monthly' ? 'bg-[#25F4EE] text-black shadow-md' : 'bg-[#0b0c10] text-zinc-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => setPeriodFilter('range')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    periodFilter === 'range' ? 'bg-[#25F4EE] text-black shadow-md' : 'bg-[#0b0c10] text-zinc-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Rentang Tgl
                </button>
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari rincian kas..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                />
              </div>
            </div>

            {periodFilter === 'range' && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs">
                <span className="text-zinc-400 font-medium">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
                <span className="text-zinc-400 font-medium">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>
            )}
          </div>

          {/* List of Cashflow */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Daftar Mutasi Kas ({filteredList.length})
              </h3>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data kas pada filter ini.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {formatDateIndo(item.date)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          item.type === 'inflow' ? 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/30' : 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30'
                        }`}>
                          {item.type === 'inflow' ? 'Penarikan Marketplace' : item.category}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400">
                        {item.description}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className={`text-sm font-black ${item.type === 'inflow' ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                          {item.type === 'inflow' ? '+' : '-'}{formatRupiah(item.amount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          title="Edit Cashflow"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl text-rose-400 hover:bg-[#FE2C55]/20 hover:text-[#FE2C55] transition cursor-pointer"
                          title="Hapus Cashflow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
