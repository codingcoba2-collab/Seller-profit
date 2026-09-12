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
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';

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
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formStep, setFormStep] = useState<number>(1);
  const [inventoryList, setInventoryList] = useState<BallInventory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

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
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [sizeBreakdown, setSizeBreakdown] = useState<{ [size: string]: number }>({ S: 75, M: 75, L: 75, XL: 75 });

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
    const unsub = StorageService.subscribe((key) => {
      if (key === 'inventory' || key === 'all') {
        loadData();
      }
    });
    return () => unsub();
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
    setSelectedSizes(['S', 'M', 'L', 'XL']);
    setSizeBreakdown({ S: 75, M: 75, L: 75, XL: 75 });
    setFormStep(1);
  };

  const handleStartEdit = (ball: BallInventory) => {
    setEditingId(ball.id);
    setDate(ball.date);
    setBallType(ball.ballType);
    setCategory(ball.category || 'pakaian_jadi');
    setUnitType(ball.unitType || 'ball_karung');
    setModalPrice(ball.modalPrice);
    setPcsCount(ball.pcsCount);
    setShippingCost(ball.shippingCost || 0);
    setSteamCost(ball.steamCost || 0);
    setSortirCost(ball.sortirCost || 0);
    setNotes(ball.notes || '');
    setReturnMechanism(ball.returnMechanism || 'detail');
    setEstimateReturnPercentage(ball.estimateReturnPercentage || 3.0);
    setSelectedSizes(ball.sizes || ['S', 'M', 'L', 'XL']);
    setSizeBreakdown(ball.sizeBreakdown || {});
    setFormStep(1);
    setViewMode('form');
  };

  const handleCancelEdit = () => {
    resetForm();
    setViewMode('list');
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length <= 1) return;
      setSelectedSizes(selectedSizes.filter(s => s !== size));
      const nextBreakdown = { ...sizeBreakdown };
      delete nextBreakdown[size];
      setSizeBreakdown(nextBreakdown);
    } else {
      const nextSizes = [...selectedSizes, size];
      setSelectedSizes(nextSizes);
      setSizeBreakdown({ ...sizeBreakdown, [size]: 0 });
    }
  };

  const distributeSizesEvenly = () => {
    if (selectedSizes.length === 0 || pcsCount <= 0) return;
    const countPerSize = Math.floor(pcsCount / selectedSizes.length);
    const remainder = pcsCount % selectedSizes.length;
    const next: { [size: string]: number } = {};
    selectedSizes.forEach((sz, idx) => {
      next[sz] = countPerSize + (idx === 0 ? remainder : 0);
    });
    setSizeBreakdown(next);
  };

  const handleNextStep = () => {
    if (formStep === 1) {
      if (!ballType.trim()) {
        onNotify('Harap isi nama stok / kode barang / tipe ball!', 'error');
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      if (pcsCount <= 0) {
        onNotify('Jumlah pcs harus lebih besar dari 0!', 'error');
        return;
      }
      if (modalPrice < 0) {
        onNotify('Harga modal tidak boleh negatif!', 'error');
        return;
      }
      setFormStep(3);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(prev => prev - 1);
    }
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
      sizes: selectedSizes,
      sizeBreakdown,
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

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingId) {
          StorageService.updateInventory(newBall);
          onNotify('Perubahan data stok fashion & HPP berhasil disimpan!', 'success');
        } else {
          StorageService.addInventory(newBall);
          onNotify('Data stok fashion baru & kalkulasi HPP berhasil disimpan!', 'success');
        }

        loadData();
        resetForm();
        setViewMode('list');
      } catch (err: any) {
        console.error('Error saving inventory:', err);
        onNotify('Gagal menyimpan data stok: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Stok' : 'Konfirmasi Catat Stok Baru',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data stok "${ballType}" ini?`
        : `Apakah Anda yakin ingin membuat dan menyimpan data stok "${ballType}" (${formatNumber(pcsCount)} pcs)?`,
      type: editingId ? 'edit' : 'create',
      confirmText: editingId ? 'Ya, Simpan Perubahan' : 'Ya, Simpan Stok Baru',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, name?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Data Stok',
      message: `Apakah Anda yakin ingin menghapus data stok ${name ? `"${name}"` : 'ini'} beserta riwayat modalnya?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Stok',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteInventory(id);
        loadData();
        onNotify('Data stok berhasil dihapus.', 'info');
        if (editingId === id) {
          handleCancelEdit();
        }
      },
    });
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={viewMode === 'form' ? handleCancelEdit : onBackToDashboard}
            className="p-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-zinc-300 hover:text-white hover:border-[#25F4EE] transition cursor-pointer"
            title={viewMode === 'form' ? 'Kembali ke Daftar Stok' : 'Kembali ke Dashboard'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#25F4EE]" />
              <span>{viewMode === 'form' ? (editingId ? 'Edit Data Stok & HPP' : 'Input Stok Fashion & HPP') : 'Modal, Stok & Kalkulasi HPP'}</span>
            </h2>
            <p className="text-xs text-zinc-400">
              {viewMode === 'form'
                ? 'Pengisian bertahap 3 langkah agar rapi dan nyaman tanpa scroll panjang'
                : 'Kelola riwayat pembelian stok pakaian dan pantau sisa stok fisik toko'}
            </p>
          </div>
        </div>

        {viewMode === 'list' ? (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setViewMode('form');
              setFormStep(1);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>+ Input Stok / Ball Baru</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#25F4EE]">
            Langkah {formStep} dari 3
          </div>
        )}
      </div>

      {/* TAMPILAN FORM WIZARD (INPUT / EDIT) */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 bg-[#161823] p-3 rounded-2xl border border-white/10 text-xs">
            {[
              { step: 1, label: 'Info & Kategori Barang', icon: '📦' },
              { step: 2, label: 'Modal Beli & HPP', icon: '💰' },
              { step: 3, label: 'Ukuran & Return', icon: '📏' },
            ].map(item => {
              const isActive = formStep === item.step;
              const isDone = formStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    if (isDone || item.step <= formStep) {
                      setFormStep(item.step);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-[#25F4EE] font-black'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold cursor-pointer'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-500 font-medium cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm">{isDone ? '✓' : item.icon}</span>
                  <span className="truncate text-[11px] sm:text-xs">
                    {item.step}. {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            {/* TAHAP 1: IDENTITAS & KATEGORI BARANG */}
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">1</span>
                    <span>Informasi Dasar Barang &amp; Kategori</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Masukkan tanggal kedatangan stok, nama stok / ball, dan kategorinya.</p>
                </div>

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
                      Satuan Stok <span className="text-[#FE2C55]">*</span>
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
                    Nama Stok / Tipe Ball / Seri <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ballType}
                    onChange={e => setBallType(e.target.value)}
                    placeholder="Misal: Ball Knit Korea Grade A / Celana Cargo Vintage / Dress Katun"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Catatan / Nama Supplier (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Misal: Supplier Bandung Grosir, Ball Segel Merah, dll."
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                  />
                </div>
              </div>
            )}

            {/* TAHAP 2: MODAL BELI & BIAYA HPP */}
            {formStep === 2 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">2</span>
                    <span>Harga Modal Beli &amp; Komponen Biaya HPP</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Masukkan jumlah total pcs barang dan seluruh biaya terkait untuk menghitung HPP per pcs secara akurat.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Isi / Jumlah Pcs Barang <span className="text-[#FE2C55]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pcsCount}
                      onChange={e => setPcsCount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Harga Beli / Modal (Rp) <span className="text-[#FE2C55]">*</span>
                    </label>
                    <CommaNumberInput
                      value={modalPrice}
                      onChange={setModalPrice}
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
              </div>
            )}

            {/* TAHAP 3: BREAKDOWN UKURAN & RETURN */}
            {formStep === 3 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">3</span>
                    <span>Distribusi Ukuran &amp; Ketentuan Return</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Atur pembagian size pakaian dan mekanisme estimasi return.</p>
                </div>

                {/* Ukuran Varian */}
                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      Pilihan Varian Ukuran dalam Stok / Ball Ini
                    </label>
                    <button
                      type="button"
                      onClick={distributeSizesEvenly}
                      className="text-[11px] font-bold text-[#25F4EE] hover:underline cursor-pointer"
                    >
                      Bagi Rata Otomatis ({pcsCount} pcs)
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Allsize', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Jumbo'].map(sz => {
                      const isSel = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                            isSel
                              ? 'bg-[#25F4EE] text-black border-[#25F4EE]'
                              : 'bg-[#161823] text-zinc-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input masing-masing size */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {selectedSizes.map(sz => (
                      <div key={sz} className="p-2.5 rounded-xl bg-[#161823] border border-white/5 space-y-1">
                        <span className="text-[11px] font-bold text-zinc-400">Size {sz}</span>
                        <input
                          type="number"
                          min="0"
                          value={sizeBreakdown[sz] ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setSizeBreakdown(prev => ({ ...prev, [sz]: Math.max(0, val) }));
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0b0c10] border border-white/10 text-white font-bold text-center"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                    <span>
                      Total terdistribusi:{' '}
                      <strong className="text-white">
                        {Object.values(sizeBreakdown).reduce((a: number, b: number) => a + (b || 0), 0)} pcs
                      </strong>
                    </span>
                    <span>
                      Target total:{' '}
                      <strong className="text-[#25F4EE]">{pcsCount} pcs</strong>
                    </span>
                  </div>
                </div>

                {/* Return Mechanism */}
                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                  <label className="text-xs font-bold text-zinc-300">
                    Mekanisme Return Barang Penjualan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setReturnMechanism('detail')}
                      className={`p-3 rounded-xl border cursor-pointer transition select-none ${
                        returnMechanism === 'detail'
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white'
                          : 'bg-[#161823] border-white/10 text-zinc-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Pencatatan Detail Riil</div>
                      <p className="text-[11px] text-zinc-400 mt-1">Dicatat manual per paket yang benar-benar diretur pelanggan.</p>
                    </div>

                    <div
                      onClick={() => setReturnMechanism('estimate')}
                      className={`p-3 rounded-xl border cursor-pointer transition select-none ${
                        returnMechanism === 'estimate'
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white'
                          : 'bg-[#161823] border-white/10 text-zinc-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Estimasi Otomatis (%)</div>
                      <p className="text-[11px] text-zinc-400 mt-1">Cadangan retur otomatis dialokasikan dari persentase omzet.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {formStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tahap Sebelumnya</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar</span>
                </button>
              )}

              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Lanjut: {formStep === 1 ? 'Modal & HPP' : 'Ukuran & Return'}</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              ) : (
                <button
                  id="btn-submit-ball"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 active:scale-98 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan Stok' : 'Simpan Data Stok &amp; HPP'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAMPILAN LAPORAN & RIWAYAT STOK (LIST VIEW) */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Sisa Stok Bar */}
          <div className="flex items-center justify-between bg-[#161823] p-4 rounded-3xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-zinc-400">Total Stok Fisik Tersedia</div>
                <div className="text-lg font-black text-white">
                  {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs pakaian</span>
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-zinc-400">
              Total Terjual: <b className="text-[#25F4EE]">{formatNumber(stockInfo.totalPcsSold)} pcs</b>
            </div>
          </div>

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
                          <div>{formatNumber(item.pcsCount)} pcs</div>
                          {item.sizes && item.sizes.length > 0 && (
                            <div className="flex flex-wrap justify-end gap-1 mt-1">
                              {item.sizes.map(sz => (
                                <span key={sz} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                                  {sz}{item.sizeBreakdown?.[sz] !== undefined ? `: ${item.sizeBreakdown[sz]}` : ''}
                                </span>
                              ))}
                            </div>
                          )}
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
                              onClick={() => handleDelete(item.id, item.ballType)}
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

      {/* Confirmation Modal for CRUD Stok */}
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
