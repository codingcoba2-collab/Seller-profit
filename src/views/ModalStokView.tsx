import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { BallInventory, CurrentUser, FashionCategory, InventoryUnitType } from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  formatDateIndo, 
  getTodayString, 
  fashionCategoryLabels, 
  inventoryUnitLabels 
} from '../utils/formatters';
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
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Filter, 
  Search, 
  Scissors,
  Sparkles,
  Tag
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [ballType, setBallType] = useState('');
  const [category, setCategory] = useState<FashionCategory>('pakaian_jadi');
  const [unitType, setUnitType] = useState<InventoryUnitType>('ball_karung');
  const [modalPrice, setModalPrice] = useState<number>(6000000);
  const [pcsCount, setPcsCount] = useState<number>(300);
  const [shippingCost, setShippingCost] = useState<number>(200000);
  const [steamCost, setSteamCost] = useState<number>(150000);
  const [sortirCost, setSortirCost] = useState<number>(100000);
  const [notes, setNotes] = useState<string>('');
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

  // Total biaya stok / batch masuk
  const totalBallCost = modalPrice + shippingCost + steamCost + sortirCost;
  // HPP = (harga modal + ongkir + biaya steam/finishing + biaya sortir/QC) / (isi pcs)
  const calculatedHpp = pcsCount > 0 ? Math.round(totalBallCost / pcsCount) : 0;

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayString());
    setBallType('');
    setCategory('pakaian_jadi');
    setUnitType('ball_karung');
    setModalPrice(6000000);
    setPcsCount(300);
    setShippingCost(200000);
    setSteamCost(150000);
    setSortirCost(100000);
    setNotes('');
  };

  const handleStartEdit = (ball: BallInventory) => {
    setEditingId(ball.id);
    setDate(ball.date);
    setBallType(ball.ballType);
    setCategory(ball.category || 'pakaian_jadi');
    setUnitType(ball.unitType || 'ball_karung');
    setModalPrice(ball.modalPrice);
    setPcsCount(ball.pcsCount);
    setShippingCost(ball.shippingCost);
    setSteamCost(ball.steamCost);
    setSortirCost(ball.sortirCost);
    setNotes(ball.notes || '');
    setReturnMechanism(ball.returnMechanism || 'detail');
    setEstimateReturnPercentage(ball.estimateReturnPercentage || 3.0);
    setSubTab('input');
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ballType.trim()) {
      onNotify('Harap isi nama stok / kode barang / tipe ball terlebih dahulu!', 'error');
      return;
    }
    if (pcsCount <= 0) {
      onNotify('Jumlah pcs harus lebih besar dari 0!', 'error');
      return;
    }

    const newBall: BallInventory = {
      id: editingId || 'ball-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      ballType,
      category,
      unitType,
      modalPrice,
      pcsCount,
      shippingCost,
      steamCost,
      sortirCost,
      hppPerPcs: calculatedHpp,
      returnMechanism,
      estimateReturnPercentage,
      notes,
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
      onNotify('Perubahan data stok fashion & HPP berhasil disimpan!', 'success');
    } else {
      StorageService.addInventory(newBall);
      onNotify('Data stok fashion baru & kalkulasi HPP berhasil disimpan!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('output');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pencatatan stok / ball ini?')) {
      StorageService.deleteInventory(id);
      loadData();
      onNotify('Data stok berhasil dihapus.', 'info');
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & sort list by date desc
  const filteredList = inventoryList
    .filter(b => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!b.ballType.toLowerCase().includes(q) && !(b.notes || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-modal"
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer shadow-xs active:scale-95"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-[#25F4EE]" />
              <span>Modal &amp; Stok Fashion (HPP Real)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kelola modal kulakan pakaian baru, distro, hijab, thrift vintage, ongkir &amp; HPP per pcs otomatis
            </p>
          </div>
        </div>

        {/* Stock summary pill */}
        <div className="flex items-center gap-3 bg-[#161823] text-white p-3.5 rounded-3xl border border-white/10 shadow-lg">
          <div className="p-2 rounded-2xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-400">Sisa Stok Fisik Gudang</div>
            <div className="text-lg font-black text-white">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Stok' : '+ Input Stok / Ball Baru'}
        outputTitle="Laporan &amp; Riwayat Stok Fashion"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-4xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <Package className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingId ? 'Edit Data Stok & Kalkulasi HPP' : 'Input Data Stok Fashion Baru & HPP'}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Masuk Stok <span className="text-[#FE2C55]">*</span>
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
                  Kategori Fashion <span className="text-[#FE2C55]">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as FashionCategory)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                >
                  {Object.entries(fashionCategoryLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Bentuk Satuan Kemasan <span className="text-[#FE2C55]">*</span>
                </label>
                <select
                  value={unitType}
                  onChange={e => setUnitType(e.target.value as InventoryUnitType)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                >
                  {Object.entries(inventoryUnitLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Nama Stok / Kode Seri / Tipe Ball <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="text"
                required
                value={ballType}
                onChange={e => setBallType(e.target.value)}
                placeholder="Contoh: Kemeja Flanel Import / Seri Gamis Rayon / Ball Knit Korea Grade A"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Harga Modal Beli Total (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={modalPrice}
                  onChange={setModalPrice}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Total Jumlah Isi (Pcs) <span className="text-[#FE2C55]">*</span>
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
                  Biaya Ongkos Kirim (Rp)
                </label>
                <CommaNumberInput
                  value={shippingCost}
                  onChange={setShippingCost}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Biaya Steam / Finishing / Tag (Rp)
                </label>
                <CommaNumberInput
                  value={steamCost}
                  onChange={setSteamCost}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Biaya Sortir / QC / Packing (Rp)
                </label>
                <CommaNumberInput
                  value={sortirCost}
                  onChange={setSortirCost}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
              </div>
            </div>

            {/* Catatan / Suplier */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Catatan / Nama Supplier (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Misal: Supplier Konveksi Bandung, Ball Import Segel Merah, dll."
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>

            {/* Live HPP Calculation preview card */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#25F4EE] flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  <span>Kalkulasi Otomatis HPP per Pcs:</span>
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
                  Total Modal: {formatRupiah(totalBallCost)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-submit-ball"
                type="submit"
                className="w-full py-3.5 rounded-2xl text-xs font-black text-[#0b0c10] bg-gradient-to-r from-[#25F4EE] to-teal-400 hover:opacity-95 shadow-lg shadow-[#25F4EE]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#0b0c10]" />
                <span>{editingId ? 'Simpan Perubahan Stok' : 'Simpan Data Stok &amp; HPP'}</span>
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
            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-1">
              <div className="text-[11px] font-semibold text-zinc-400">Total Pcs Masuk</div>
              <div className="text-xl font-black text-white">
                {formatNumber(stockInfo.totalPcsIn)} <span className="text-xs font-normal text-zinc-400">pcs</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-1">
              <div className="text-[11px] font-semibold text-zinc-400">Total Pcs Terjual</div>
              <div className="text-xl font-black text-emerald-400">
                {formatNumber(stockInfo.totalPcsSold)} <span className="text-xs font-normal text-zinc-400">pcs</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-1">
              <div className="text-[11px] font-semibold text-zinc-400">Sisa Stok Fisik</div>
              <div className="text-xl font-black text-[#25F4EE]">
                {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-1">
              <div className="text-[11px] font-semibold text-zinc-400">Rata-Rata HPP / Pcs</div>
              <div className="text-xl font-black text-amber-300">
                {formatRupiah(hppInfo.weightedAverageHpp)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama stok / kode seri / supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium focus:border-[#25F4EE]"
              >
                <option value="all">Semua Kategori</option>
                {Object.entries(fashionCategoryLabels).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val}
                  </option>
                ))}
              </select>

              {/* Period Filter */}
              <select
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium focus:border-[#25F4EE]"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="weekly">7 Hari Terakhir</option>
                <option value="monthly">Bulan Ini</option>
              </select>
            </div>
          </div>

          {/* Table List */}
          <div className="rounded-3xl bg-[#161823] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#25F4EE]" />
                <span>Riwayat Pembelian Stok &amp; HPP ({filteredList.length})</span>
              </h3>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Belum ada data stok fashion yang tersimpan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#0b0c10] text-[11px] uppercase tracking-wider text-zinc-400 font-bold border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">Tanggal &amp; Nama Stok</th>
                      <th className="px-4 py-3.5">Kategori &amp; Satuan</th>
                      <th className="px-4 py-3.5 text-right">Modal Beli</th>
                      <th className="px-4 py-3.5 text-right">Ongkir &amp; Finishing</th>
                      <th className="px-4 py-3.5 text-right">Isi (Pcs)</th>
                      <th className="px-4 py-3.5 text-right">HPP / Pcs</th>
                      <th className="px-4 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredList.map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white">{item.ballType}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateIndo(item.date)}</div>
                          {item.notes && (
                            <div className="text-[10px] text-zinc-500 mt-0.5">📝 {item.notes}</div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
                            {fashionCategoryLabels[item.category as FashionCategory] || item.category || 'Fashion'}
                          </span>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {inventoryUnitLabels[item.unitType as InventoryUnitType] || item.unitType || 'Ball Karung'}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-white">
                          {formatRupiah(item.modalPrice)}
                        </td>

                        <td className="px-4 py-3.5 text-right text-zinc-400">
                          {formatRupiah((item.shippingCost || 0) + (item.steamCost || 0) + (item.sortirCost || 0))}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-white">
                          {formatNumber(item.pcsCount)} pcs
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="font-black text-[#25F4EE]">
                            {formatRupiah(item.hppPerPcs)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#25F4EE]/20 text-zinc-300 hover:text-[#25F4EE] transition cursor-pointer"
                              title="Edit Data Stok"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-zinc-400 hover:text-[#FE2C55] transition cursor-pointer"
                              title="Hapus Data Stok"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
    </div>
  );
};
