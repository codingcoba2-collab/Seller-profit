import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { BallInventory, CurrentUser } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  Package, 
  Trash2, 
  Calculator, 
  Layers, 
  Truck, 
  SlidersHorizontal, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Filter, 
  Search, 
  Scissors 
} from 'lucide-react';

interface ModalStokViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ModalStokView: React.FC<ModalStokViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [inventoryList, setInventoryList] = useState<BallInventory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter state for Output tab
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [ballType, setBallType] = useState('');
  const [modalPrice, setModalPrice] = useState<number>(6000000);
  const [pcsCount, setPcsCount] = useState<number>(300);
  const [shippingCost, setShippingCost] = useState<number>(200000);
  const [steamCost, setSteamCost] = useState<number>(150000);
  const [sortirCost, setSortirCost] = useState<number>(100000);
  const [returnMechanism, setReturnMechanism] = useState<'estimate' | 'detail'>('detail');
  const [estimateReturnPercentage, setEstimateReturnPercentage] = useState<number>(3.0);

  const stockInfo = StorageService.calculateStock(currentUser.storeId);
  const hppInfo = StorageService.calculateHPP(currentUser.storeId);

  const loadData = () => {
    const list = StorageService.getInventory(currentUser.storeId);
    setInventoryList(list);

    const store = StorageService.getStoreById(currentUser.storeId);
    if (store?.settings?.returnMechanism) {
      setReturnMechanism(store.settings.returnMechanism);
      setEstimateReturnPercentage(store.settings.estimateReturnPercentage || 3.0);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  // Total biaya satu ball
  const totalBallCost = modalPrice + shippingCost + steamCost + sortirCost;
  // HPP = (harga modal + ongkir ball + biaya steam + biaya sortir) / (isi ball)
  const calculatedHpp = pcsCount > 0 ? Math.round(totalBallCost / pcsCount) : 0;

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayString());
    setBallType('');
    setModalPrice(6000000);
    setPcsCount(300);
    setShippingCost(200000);
    setSteamCost(150000);
    setSortirCost(100000);
  };

  const handleStartEdit = (ball: BallInventory) => {
    setEditingId(ball.id);
    setDate(ball.date);
    setBallType(ball.ballType);
    setModalPrice(ball.modalPrice);
    setPcsCount(ball.pcsCount);
    setShippingCost(ball.shippingCost);
    setSteamCost(ball.steamCost);
    setSortirCost(ball.sortirCost);
    setReturnMechanism(ball.returnMechanism || 'detail');
    setEstimateReturnPercentage(ball.estimateReturnPercentage || 3.0);
    setSubTab('input'); // Switch to input form smoothly (Requirement 7)
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ballType.trim()) {
      onNotify('Harap isi tipe / nama ball terlebih dahulu!', 'error');
      return;
    }
    if (pcsCount <= 0) {
      onNotify('Isi ball harus lebih besar dari 0!', 'error');
      return;
    }

    const newBall: BallInventory = {
      id: editingId || 'ball-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      ballType,
      modalPrice,
      pcsCount,
      shippingCost,
      steamCost,
      sortirCost,
      hppPerPcs: calculatedHpp,
      returnMechanism,
      estimateReturnPercentage,
      createdAt: new Date().toISOString(),
    };

    // Update store settings for return mechanism
    StorageService.updateStoreSettings(currentUser.storeId, {
      returnMechanism,
      estimateReturnPercentage,
    });

    if (editingId) {
      const all = StorageService.getInventory(currentUser.storeId);
      const updated = all.map(b => b.id === editingId ? newBall : b);
      StorageService.saveInventory(updated);
      onNotify('Perubahan data ball & HPP berhasil disimpan!', 'success');
    } else {
      StorageService.addInventory(newBall);
      onNotify('Data ball baru & kalkulasi HPP berhasil disimpan!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('output');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pencatatan ball ini?')) {
      StorageService.deleteInventory(id);
      loadData();
      onNotify('Data ball berhasil dihapus.', 'info');
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & sort list by date desc (Requirement 9)
  const filteredList = inventoryList
    .filter(b => {
      if (searchQuery.trim()) {
        if (!b.ballType.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      if (periodFilter === 'today') return b.date === getTodayString();
      if (periodFilter === 'range') return b.date >= startDate && b.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return b.date >= weekAgo && b.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return b.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-modal"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Modal &amp; Stok Ball (HPP)
            </h2>
          </div>
        </div>

        {/* Stock summary pill */}
        <div className="flex items-center gap-3 bg-[#161823] text-white p-3 rounded-2xl border border-white/10 shadow-lg">
          <div className="p-2 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-400">Sisa Stok Gudang</div>
            <div className="text-lg font-black text-white">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation (Requirement 7) */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Ball' : 'Input Ball Baru'}
        outputTitle="Laporan &amp; Riwayat Ball"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-4xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <Package className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingId ? 'Edit Data Ball & HPP' : 'Input Data Ball Baru & HPP'}</span>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Masuk Ball <span className="text-[#FE2C55]">*</span>
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
                  Tipe / Nama Ball <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ballType}
                  onChange={e => setBallType(e.target.value)}
                  placeholder="Contoh: Ball Knit Korea Grade A"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Harga Modal Beli Ball (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={modalPrice}
                  onChange={setModalPrice}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Estimasi Total Isi (Pcs) <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={pcsCount}
                  onChange={e => setPcsCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Ongkir Ball (Rp)
                </label>
                <CommaNumberInput
                  value={shippingCost}
                  onChange={setShippingCost}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Biaya Jasa Steam (Rp)
                </label>
                <CommaNumberInput
                  value={steamCost}
                  onChange={setSteamCost}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Biaya Jasa Sortir (Rp)
                </label>
                <CommaNumberInput
                  value={sortirCost}
                  onChange={setSortirCost}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>
            </div>

            {/* Live HPP Calculation preview card */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#25F4EE] flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  <span>Kalkulasi Otomatis HPP Ball Ini:</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  ({formatRupiah(modalPrice)} + {formatRupiah(shippingCost)} + {formatRupiah(steamCost)} + {formatRupiah(sortirCost)}) / {pcsCount} pcs
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-[#25F4EE]">
                  {formatRupiah(calculatedHpp)} / pcs
                </div>
                <div className="text-[10px] text-zinc-500">
                  Total Biaya: {formatRupiah(totalBallCost)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-submit-ball"
                type="submit"
                className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{editingId ? 'Simpan Perubahan Ball' : 'Simpan Data Ball &amp; HPP'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & LAPORAN */}
      {subTab === 'output' && (
        <div className="space-y-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Total Pcs Layak Jual</div>
              <div className="text-xl font-black text-white mt-1">
                {formatNumber(stockInfo.totalPcsLayakJual ?? hppInfo.totalPcs)} <span className="text-xs font-medium text-zinc-400">pcs</span>
              </div>
              {(stockInfo.totalPcsReject || 0) > 0 && (
                <div className="text-[10px] text-[#FE2C55] mt-0.5">
                  -{formatNumber(stockInfo.totalPcsReject)} pcs reject diabaikan
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Total Modal + Jasa</div>
              <div className="text-xl font-black text-white mt-1">
                {formatRupiah(hppInfo.totalBiayaModalDanJasa)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Rata-rata HPP / Pcs</div>
              <div className="text-xl font-black text-[#25F4EE] mt-1">
                {formatRupiah(hppInfo.weightedAverageHpp)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Sisa Stok Layak Jual</div>
              <div className="text-xl font-black text-white mt-1">
                {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-medium text-zinc-400">pcs</span>
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
                  placeholder="Cari tipe ball..."
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Input Ball Baru
            </button>
          </div>

          {/* List of Ball Inventory (Sorted by date desc) */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Daftar Ball Terdaftar ({filteredList.length})
              </h3>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data ball pada filter ini.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {item.ballType}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {formatDateIndo(item.date)}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Isi: <strong className="text-zinc-200">{formatNumber(item.pcsCount)} pcs</strong></span>
                        <span>•</span>
                        <span>Modal: {formatRupiah(item.modalPrice)}</span>
                        <span>•</span>
                        <span>Ongkir: {formatRupiah(item.shippingCost || 0)}</span>
                        <span>•</span>
                        <span>Steam: {formatRupiah(item.steamCost || 0)}</span>
                        <span>•</span>
                        <span>Sortir: {formatRupiah(item.sortirCost || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-[#25F4EE]">
                          {formatRupiah(item.hppPerPcs)}/pcs
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          HPP Final
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                          title="Edit Ball"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Hapus Ball"
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
