import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { ReturnRecord, CurrentUser } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  PackageX, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Filter, 
  Search,
  Settings,
  Percent,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

interface ReturnViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReturnView: React.FC<ReturnViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [returnList, setReturnList] = useState<ReturnRecord[]>([]);
  const [isEstimateMode, setIsEstimateMode] = useState(false);
  const [estimatePercentage, setEstimatePercentage] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);

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
  };

  const handleStartEdit = (item: ReturnRecord) => {
    setEditingId(item.id);
    setDate(item.date);
    setPackageCount(item.packageCount);
    setTotalAmount(item.totalAmount);
    setReason(item.reason || '');
    setSubTab('input');
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

    if (editingId) {
      const all = StorageService.getReturns(currentUser.storeId);
      const updated = all.map(r => r.id === editingId ? record : r);
      StorageService.addReturn(record);
      onNotify('Perubahan data retur berhasil disimpan!', 'success');
    } else {
      StorageService.addReturn(record);
      onNotify('Data retur paket berhasil disimpan!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('output');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data retur ini?')) {
      StorageService.deleteReturn(id);
      loadData();
      onNotify('Data retur berhasil dihapus.', 'info');
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & sort list by date desc
  const filteredList = returnList
    .filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.reason?.toLowerCase().includes(q)) return false;
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

  const totalRetPkgs = filteredList.reduce((acc, r) => acc + (r.packageCount || 0), 0);
  const totalRetNominal = filteredList.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  const estimatedTotalNominal = Math.round((estimatePercentage / 100) * totalOmzetStore);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without stage labels */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-return"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Pencatatan Retur / Paket Return Marketplace
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pencatatan paket retur gagal kirim / COD atau estimasi persentase untuk mengurangi omzet pada laporan laba rugi
            </p>
          </div>
        </div>
      </div>

      {/* Req 1: PENGATURAN ESTIMASI RETURN (AKSES HANYA OWNER) */}
      {currentUser.isOwner ? (
        <div className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#FE2C55]/20 text-[#FE2C55]">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Pengaturan Mekanisme Return</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#25F4EE]/10 text-[#25F4EE] text-[10px] font-bold border border-[#25F4EE]/30">
                    Akses Khusus Owner
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Pilih apakah toko menggunakan estimasi persentase otomatis atau pencatatan detail tiap paket retur
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveOwnerSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsEstimateMode(false)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  !isEstimateMode
                    ? 'bg-[#25F4EE]/15 border-[#25F4EE] text-white shadow-md'
                    : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Mode 1: Pencatatan Detail Manual</span>
                  {!isEstimateMode && <CheckCircle2 className="w-4 h-4 text-[#25F4EE]" />}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Tim/admin menginput data paket retur satu per satu saat paket fisik tiba di toko.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsEstimateMode(true)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  isEstimateMode
                    ? 'bg-[#FE2C55]/15 border-[#FE2C55] text-white shadow-md'
                    : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Mode 2: Estimasi Persentase (%) Otomatis</span>
                  {isEstimateMode && <CheckCircle2 className="w-4 h-4 text-[#FE2C55]" />}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Return otomatis dipotong sekian % dari total omzet kotor penjualan di Laba Rugi.
                </p>
              </button>
            </div>

            {isEstimateMode && (
              <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-200">
                    Persentase Estimasi Return (% dari Omzet Kotor Marketplace)
                  </label>
                  <span className="text-xs font-black text-[#25F4EE]">
                    Simulasi: {formatRupiah(estimatedTotalNominal)} (dari omzet {formatRupiah(totalOmzetStore)})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={estimatePercentage}
                    onChange={e => setEstimatePercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm font-black rounded-xl bg-[#161823] border border-white/10 text-white focus:border-[#25F4EE]"
                  />

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[2.0, 3.0, 4.0, 5.0, 8.0, 10.0].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setEstimatePercentage(pct)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          estimatePercentage === pct
                            ? 'bg-[#FE2C55] text-white border-[#FE2C55]'
                            : 'bg-[#161823] text-zinc-300 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-black font-extrabold text-xs shadow-lg cursor-pointer transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pengaturan Return (Owner)</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Shield className="w-4 h-4 text-[#25F4EE]" />
            <span>
              Mekanisme Return Aktif: <strong className="text-white">{isEstimateMode ? `Estimasi (${estimatePercentage}%)` : 'Pencatatan Detail Manual'}</strong> (Dikelola oleh Owner)
            </span>
          </div>
        </div>
      )}

      {/* Sub Navigation */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Retur' : 'Input Data Retur'}
        outputTitle="Riwayat Paket Retur"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-3xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <PackageX className="w-5 h-5 text-[#FE2C55]" />}
              <span>{editingId ? 'Edit Data Retur Paket' : 'Input Data Retur Marketplace'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          {isEstimateMode && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              ⚠️ Toko sedang menggunakan <strong>Mode Estimasi Return ({estimatePercentage}%)</strong>. Laporan Laba Rugi menghitung return otomatis secara persentase omzet.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tanggal Retur <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                id="input-return-date"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Jumlah Paket Return <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  id="input-return-count"
                  type="number"
                  required
                  min="1"
                  value={packageCount}
                  onChange={e => setPackageCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Total Nilai Barang Retur (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  id="input-return-amount"
                  value={totalAmount}
                  onChange={setTotalAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#FE2C55] font-bold focus:border-[#25F4EE]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Alasan / Catatan Retur
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Contoh: Paket rusak / gagal COD / pembeli tolak"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />
            </div>

            <button
              id="btn-submit-return"
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{editingId ? 'Simpan Perubahan Retur' : 'Simpan Data Retur Paket'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & LAPORAN */}
      {subTab === 'output' && (
        <div className="space-y-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Total Paket Retur Manual</div>
              <div className="text-xl font-black text-white mt-1">
                {formatNumber(totalRetPkgs)} <span className="text-xs font-normal text-zinc-400">paket</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">
                {isEstimateMode ? `Total Retur (Estimasi ${estimatePercentage}%)` : 'Total Nilai Retur Manual'}
              </div>
              <div className="text-xl font-black text-[#FE2C55] mt-1">
                {formatRupiah(isEstimateMode ? estimatedTotalNominal : totalRetNominal)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari alasan retur..."
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
                <option value="weekly">7 Hari</option>
                <option value="monthly">Bulan Ini</option>
              </select>
            </div>

            <button
              onClick={() => {
                resetForm();
                setSubTab('input');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Input Retur
            </button>
          </div>

          {/* List of Returns */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Daftar Paket Retur ({filteredList.length})
              </h3>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data retur pada filter ini.
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
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-[#FE2C55] text-[10px] font-bold border border-rose-500/30">
                          {item.packageCount} Paket
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400">
                        {item.reason}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-[#FE2C55]">
                          {formatRupiah(item.totalAmount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                          title="Edit Retur"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Hapus Retur"
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
