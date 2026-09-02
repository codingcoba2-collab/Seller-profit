import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { CashflowRecord, CurrentUser, Employee } from '../types';
import { formatRupiah, formatDateIndo, getTodayString, roleLabels } from '../utils/formatters';
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
  Calendar,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  UserCheck,
  Receipt
} from 'lucide-react';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  packing: 'Bahan Packing (Lakban, Plastik, Bubble Wrap)',
  makan_minum: 'Konsumsi / Makan & Minum Tim',
  listrik_wifi: 'Listrik, Air & Internet WiFi',
  sewa_tempat: 'Sewa Tempat / Ruko Live',
  gaji_pegawai: 'Gaji Pegawai / Karyawan',
  lainnya: 'Operasional Lainnya',
  penarikan_shopee: 'Penarikan Saldo Marketplace',
};

export const CashflowView: React.FC<CashflowViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [cashflowList, setCashflowList] = useState<CashflowRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingItem, setEditingItem] = useState<CashflowRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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
  };

  const handleStartEdit = (item: CashflowRecord) => {
    setEditingItem(item);
    setDate(item.date);
    setType(item.type);
    setAmount(item.amount);
    setCategory(item.category);
    setDescription(item.description || '');
    setEmployeeId(item.employeeId || (employees[0]?.id || ''));
    setEmployeeName(item.employeeName || (employees[0]?.name || ''));
    setPeriodMonth(item.periodMonth || getTodayString().slice(0, 7));
    setProofImageUrl(item.proofImageUrl || '');
    setSubTab('input');
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
        setDescription(`Pembayaran Gaji & Insentif - ${selectedEmp.name} (Periode ${periodMonth})`);
      }
    } else if (newCat === 'packing' && description.includes('Gaji')) {
      setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    }
  };

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setEmployeeName(emp.name);
      setDescription(`Pembayaran Gaji & Insentif - ${emp.name} (Periode ${periodMonth})`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onNotify('Ukuran file foto maksimal 5MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofImageUrl(reader.result);
        onNotify('Foto bukti berhasil diunggah!', 'success');
      }
    };
    reader.readAsDataURL(file);
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
      employeeId: (type === 'outflow' && category === 'gaji_pegawai') ? employeeId : undefined,
      employeeName: (type === 'outflow' && category === 'gaji_pegawai') ? employeeName : undefined,
      periodMonth: (type === 'outflow' && category === 'gaji_pegawai') ? periodMonth : undefined,
      proofImageUrl: (type === 'outflow' && proofImageUrl) ? proofImageUrl : undefined,
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

  // Filter & Sort list by date descending
  const filteredList = cashflowList
    .filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = c.description?.toLowerCase().includes(q);
        const empMatch = c.employeeName?.toLowerCase().includes(q);
        const catMatch = (CATEGORY_LABELS[c.category] || c.category).toLowerCase().includes(q);
        if (!descMatch && !empMatch && !catMatch) return false;
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
      {/* Header */}
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
              Catat saldo ditarik dari Marketplace / Rekening dan pengeluaran operasional toko (gaji pegawai, packing, lakban, makan, sewa)
            </p>
          </div>
        </div>
      </div>

      {/* Sub Navigation (2 Clean Tabs) */}
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
                    <span>Penarikan Marketplace</span>
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
                    onChange={e => handleCategoryChange(e.target.value as CashflowRecord['category'])}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  >
                    <option value="gaji_pegawai">💼 Gaji Pegawai / Karyawan</option>
                    <option value="packing">📦 Bahan Packing (Lakban, Plastik, Bubble Wrap)</option>
                    <option value="makan_minum">🍱 Konsumsi / Makan &amp; Minum Tim</option>
                    <option value="listrik_wifi">⚡ Listrik, Air &amp; Internet WiFi</option>
                    <option value="sewa_tempat">🏢 Sewa Tempat / Ruko Live</option>
                    <option value="lainnya">⚙️ Operasional Lainnya</option>
                  </select>
                </div>
              )}
            </div>

            {/* OPSI KHUSUS GAJI PEGAWAI */}
            {type === 'outflow' && category === 'gaji_pegawai' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <Receipt className="w-4 h-4 text-[#25F4EE]" />
                  <span className="text-xs font-black text-[#25F4EE] uppercase tracking-wider">
                    Detail Pembayaran Gaji Pegawai &amp; Bukti Foto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Pilih Pegawai / Penerima Gaji <span className="text-[#FE2C55]">*</span>
                    </label>
                    <select
                      value={employeeId}
                      onChange={e => handleEmployeeChange(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.roles.map(r => roleLabels[r] || r).join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Periode Gaji (Bulan)
                    </label>
                    <input
                      type="month"
                      value={periodMonth}
                      onChange={e => {
                        setPeriodMonth(e.target.value);
                        if (employeeName) {
                          setDescription(`Pembayaran Gaji & Insentif - ${employeeName} (Periode ${e.target.value})`);
                        }
                      }}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-medium focus:border-[#25F4EE]"
                    />
                  </div>
                </div>

                {/* Upload Foto Bukti Pembayaran */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#25F4EE]" />
                      <span>Upload Foto Bukti Transfer / Struk Gaji</span>
                    </span>
                    {proofImageUrl && (
                      <button
                        type="button"
                        onClick={() => setProofImageUrl('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </label>

                  {proofImageUrl ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#161823] p-3 flex items-center gap-3">
                      <img
                        src={proofImageUrl}
                        alt="Bukti Transfer"
                        className="w-16 h-16 object-cover rounded-xl border border-white/10"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-emerald-400">✓ Bukti Foto Terlampir</p>
                        <p className="text-[11px] text-zinc-400">Akan ditampilkan pada slip gaji pegawai</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(proofImageUrl)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Lihat Foto Penuh"
                      >
                        <Eye className="w-4 h-4 text-[#25F4EE]" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/15 hover:border-[#25F4EE]/50 bg-[#161823] p-4 rounded-2xl text-center cursor-pointer transition group"
                    >
                      <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[#25F4EE] mx-auto mb-1 transition" />
                      <p className="text-xs font-bold text-zinc-300 group-hover:text-white">
                        Klik untuk upload foto bukti transfer / struk kas
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Format PNG, JPG, JPEG (Maks. 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Optional proof photo for other outflow categories too */}
            {type === 'outflow' && category !== 'gaji_pegawai' && (
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Upload Foto Nota / Bukti Pengeluaran (Opsional)</span>
                  </span>
                  {proofImageUrl && (
                    <button
                      type="button"
                      onClick={() => setProofImageUrl('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </label>

                {proofImageUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-white/15 bg-[#0b0c10] p-2.5 flex items-center gap-3">
                    <img
                      src={proofImageUrl}
                      alt="Bukti Nota"
                      className="w-12 h-12 object-cover rounded-xl border border-white/10"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-zinc-200">Foto Nota Terlampir</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(proofImageUrl)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Lihat Foto"
                    >
                      <Eye className="w-4 h-4 text-[#25F4EE]" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/15 hover:border-white/30 bg-[#0b0c10] py-2.5 px-3 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-400">Lampirkan foto struk/nota</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}

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
                  placeholder="Cari rincian / pegawai..."
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
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {formatDateIndo(item.date)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          item.type === 'inflow' 
                            ? 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/30' 
                            : item.category === 'gaji_pegawai'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30'
                        }`}>
                          {item.type === 'inflow' ? 'Penarikan Marketplace' : CATEGORY_LABELS[item.category] || item.category}
                        </span>

                        {item.employeeName && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b0c10] text-[#25F4EE] border border-white/10 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>{item.employeeName}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-300">
                        {item.description}
                      </div>

                      {/* Photo Thumbnail Button if exists */}
                      {item.proofImageUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 cursor-pointer transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Lihat Bukti Foto / Struk</span>
                        </button>
                      )}
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

      {/* Modal Preview Bukti Foto Penuh */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-[#161823] rounded-3xl border border-white/20 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#25F4EE]" />
                <span>Foto Bukti Transaksi / Pembayaran</span>
              </h4>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-2xl bg-[#0b0c10] p-2 border border-white/10">
              <img
                src={previewPhotoUrl}
                alt="Foto Bukti"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

