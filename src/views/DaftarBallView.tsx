import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { BallDataRecord, BallQualityGrade, CurrentUser } from '../types';
import {
  formatDateIndo,
  formatNumber,
  evaluateBallQuality,
  ballQualityMeta,
} from '../utils/formatters';
import {
  Package,
  Scale,
  Award,
  Layers,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Info,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { ThemedSelect } from '../components/ThemedSelect';

interface DaftarBallViewProps {
  currentUser: CurrentUser;
  onBackToDashboard?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DaftarBallView: React.FC<DaftarBallViewProps> = ({
  currentUser,
  onNotify,
}) => {
  const storeId = currentUser.storeId;
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingBall, setEditingBall] = useState<BallDataRecord | null>(null);
  const [showCriteriaGuide, setShowCriteriaGuide] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'all' | BallQualityGrade>('all');

  // Form states
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [ballName, setBallName] = useState('');
  const [weightKg, setWeightKg] = useState<number | ''>(45);
  const [pcsKepala, setPcsKepala] = useState<number | ''>('');
  const [pcsBadan, setPcsBadan] = useState<number | ''>('');
  const [pcsKaki, setPcsKaki] = useState<number | ''>('');
  const [pcsTotal, setPcsTotal] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Confirm Modal
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

  const ballDataList = StorageService.getBallData(storeId);
  const inventoryList = StorageService.getInventory(storeId);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onNotify) onNotify(msg, type);
  };

  const handleClassChange = (
    nextKepala: number | '',
    nextBadan: number | '',
    nextKaki: number | ''
  ) => {
    setPcsKepala(nextKepala);
    setPcsBadan(nextBadan);
    setPcsKaki(nextKaki);
    const k = typeof nextKepala === 'number' ? nextKepala : 0;
    const b = typeof nextBadan === 'number' ? nextBadan : 0;
    const f = typeof nextKaki === 'number' ? nextKaki : 0;
    const sum = k + b + f;
    if (sum > 0) {
      setPcsTotal(sum);
    }
  };

  const handleSelectInventory = (invId: string) => {
    setSelectedInventoryId(invId);
    if (!invId) return;
    const found = inventoryList.find(i => i.id === invId);
    if (found) {
      setBallName(found.ballType || '');
      if (found.weightKg) setWeightKg(found.weightKg);
      const count = found.pcsCount || found.pcsTotal || '';
      setPcsTotal(count);
      if (found.pcsKepala !== undefined) setPcsKepala(found.pcsKepala);
      if (found.pcsBadan !== undefined) setPcsBadan(found.pcsBadan);
      if (found.pcsKaki !== undefined) setPcsKaki(found.pcsKaki);
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setSelectedInventoryId('');
    setBallName('');
    setWeightKg(45);
    setPcsKepala('');
    setPcsBadan('');
    setPcsKaki('');
    setPcsTotal('');
    setNotes('');
    setEditingBall(null);
  };

  const handleStartEdit = (ball: BallDataRecord) => {
    setEditingBall(ball);
    setDate(ball.date || new Date().toISOString().slice(0, 10));
    setSelectedInventoryId(ball.inventoryBallId || '');
    setBallName(ball.ballName);
    setWeightKg(ball.weightKg || 45);
    setPcsKepala(ball.pcsKepala);
    setPcsBadan(ball.pcsBadan);
    setPcsKaki(ball.pcsKaki);
    setPcsTotal(ball.pcsTotal);
    setNotes(ball.notes || '');
    setViewMode('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = ballName.trim();
    if (!cleanName) {
      notify('Nama Ball wajib diisi!', 'error');
      return;
    }

    const numKepala = typeof pcsKepala === 'number' ? pcsKepala : 0;
    const numBadan = typeof pcsBadan === 'number' ? pcsBadan : 0;
    const numKaki = typeof pcsKaki === 'number' ? pcsKaki : 0;
    const sumClass = numKepala + numBadan + numKaki;
    const finalTotal = typeof pcsTotal === 'number' && pcsTotal > 0 ? pcsTotal : sumClass;
    const finalWeight = typeof weightKg === 'number' && weightKg > 0 ? weightKg : 45;
    const computedGrade = evaluateBallQuality(numKepala, finalTotal);

    const record: BallDataRecord = {
      id: editingBall ? editingBall.id : `ball-data-${Date.now()}`,
      storeId,
      date,
      ballName: cleanName,
      weightKg: finalWeight,
      pcsTotal: finalTotal,
      pcsKepala: numKepala,
      pcsBadan: numBadan,
      pcsKaki: numKaki,
      qualityGrade: computedGrade,
      inventoryBallId: selectedInventoryId || undefined,
      notes: notes.trim(),
      recordedBy: currentUser.name,
      createdAt: editingBall ? editingBall.createdAt : new Date().toISOString(),
    };

    setConfirmModal({
      isOpen: true,
      title: editingBall ? 'Simpan Perubahan Data Ball' : 'Tambah Data Ball Baru',
      message: `Simpan data "${cleanName}" (${finalWeight} Kg, Isi ${formatNumber(finalTotal)} pcs, Kepala ${formatNumber(numKepala)} pcs) dengan kualitas "${ballQualityMeta[computedGrade].label}"?`,
      type: editingBall ? 'edit' : 'create',
      confirmText: 'Ya, Simpan Data Ball',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.addOrUpdateBallData(record);
        notify(
          editingBall
            ? 'Data Ball berhasil diperbarui!'
            : 'Data Ball baru berhasil ditambahkan ke Daftar Ball!',
          'success'
        );
        resetForm();
        setViewMode('list');
      },
    });
  };

  const handleDelete = (ball: BallDataRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Ball',
      message: `Apakah Anda yakin ingin menghapus "${ball.ballName}" dari Daftar Ball?`,
      type: 'delete',
      confirmText: 'Ya, Hapus',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteBallData(ball.id);
        notify('Data ball berhasil dihapus.', 'info');
      },
    });
  };

  // Filtered list
  const filteredBalls = ballDataList.filter(item => {
    if (qualityFilter !== 'all' && item.qualityGrade !== qualityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.ballName.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Summary counts
  const countSangatBagus = ballDataList.filter(b => b.qualityGrade === 'sangat_bagus').length;
  const countBagus = ballDataList.filter(b => b.qualityGrade === 'bagus').length;
  const countBiasa = ballDataList.filter(b => b.qualityGrade === 'biasa').length;
  const countJelek = ballDataList.filter(b => b.qualityGrade === 'jelek').length;

  const liveKepala = typeof pcsKepala === 'number' ? pcsKepala : 0;
  const liveBadan = typeof pcsBadan === 'number' ? pcsBadan : 0;
  const liveKaki = typeof pcsKaki === 'number' ? pcsKaki : 0;
  const liveTotal = typeof pcsTotal === 'number' && pcsTotal > 0 ? pcsTotal : liveKepala + liveBadan + liveKaki;
  const liveQuality = evaluateBallQuality(liveKepala, liveTotal);
  const liveMeta = ballQualityMeta[liveQuality];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 text-white font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white leading-tight">
              Daftar Ball &amp; Klasifikasi Kualitas
            </h2>
            <p className="text-xs text-zinc-400">
              Data Nama Ball, Berat Ball (Kg), Rincian Kelas (Kepala, Badan, Kaki) &amp; Kualitas Ball
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCriteriaGuide(!showCriteriaGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>{showCriteriaGuide ? 'Tutup Rumus Kualitas' : 'Standar Kualitas Ball'}</span>
          </button>

          {viewMode === 'list' ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('form');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25F4EE] text-black text-xs font-black shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Data Ball</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('list');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali ke Daftar Ball</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Standar Kriteria Kualitas Ball */}
      {showCriteriaGuide && (
        <div className="p-4 rounded-2xl bg-[#161823] border border-[#25F4EE]/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#25F4EE] flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Aturan Penilaian Kualitas Ball (Berdasarkan Kelas Kepala &amp; Total Isi)</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="font-black text-emerald-400">1. Sangat Bagus</div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                • <strong>Kepala &gt; 100 pcs</strong> dan <strong>Total Isi &gt; 270 pcs</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 space-y-1">
              <div className="font-black text-[#25F4EE]">2. Bagus</div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                • <strong>Kepala &gt; 70 s/d 100 pcs</strong> dan <strong>Isi &gt; 270 pcs</strong><br />
                • Atau <strong>Kepala &gt; 100 pcs</strong> dan <strong>Isi &lt; 270 pcs</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="font-black text-amber-400">3. Biasa</div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                • <strong>Kepala &gt; 70 s/d 100 pcs</strong> dan <strong>Isi &lt; 270 pcs</strong><br />
                • Atau <strong>Kepala &lt; 70 pcs</strong> dan <strong>Isi &gt; 270 pcs</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 space-y-1">
              <div className="font-black text-[#FE2C55]">4. Jelek</div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                • <strong>Kepala &lt; 70 pcs</strong> dan <strong>Total Isi &lt; 250 pcs</strong> (atau di bawah standar)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan Statistik Kualitas Ball */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setQualityFilter('all')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            qualityFilter === 'all'
              ? 'bg-[#1c1f2e] border-white/30 shadow-md'
              : 'bg-[#161823] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="text-[10px] text-zinc-400 font-semibold uppercase">Total Daftar Ball</div>
          <div className="text-base sm:text-lg font-black text-white mt-0.5">
            {formatNumber(ballDataList.length)} <span className="text-xs font-normal text-zinc-400">Ball</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setQualityFilter('sangat_bagus')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            qualityFilter === 'sangat_bagus'
              ? 'bg-emerald-500/20 border-emerald-400 shadow-md'
              : 'bg-[#161823] border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="text-[10px] text-emerald-400 font-bold uppercase">Sangat Bagus</div>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
            {formatNumber(countSangatBagus)} <span className="text-xs font-normal text-zinc-400">Ball</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setQualityFilter('bagus')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            qualityFilter === 'bagus'
              ? 'bg-[#25F4EE]/20 border-[#25F4EE] shadow-md'
              : 'bg-[#161823] border-[#25F4EE]/20 hover:border-[#25F4EE]/40'
          }`}
        >
          <div className="text-[10px] text-[#25F4EE] font-bold uppercase">Bagus</div>
          <div className="text-base sm:text-lg font-black text-[#25F4EE] mt-0.5">
            {formatNumber(countBagus)} <span className="text-xs font-normal text-zinc-400">Ball</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setQualityFilter('biasa')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            qualityFilter === 'biasa'
              ? 'bg-amber-500/20 border-amber-400 shadow-md'
              : 'bg-[#161823] border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div className="text-[10px] text-amber-400 font-bold uppercase">Biasa</div>
          <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
            {formatNumber(countBiasa)} <span className="text-xs font-normal text-zinc-400">Ball</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setQualityFilter('jelek')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer col-span-2 sm:col-span-1 ${
            qualityFilter === 'jelek'
              ? 'bg-[#FE2C55]/20 border-[#FE2C55] shadow-md'
              : 'bg-[#161823] border-[#FE2C55]/20 hover:border-[#FE2C55]/40'
          }`}
        >
          <div className="text-[10px] text-[#FE2C55] font-bold uppercase">Jelek</div>
          <div className="text-base sm:text-lg font-black text-[#FE2C55] mt-0.5">
            {formatNumber(countJelek)} <span className="text-xs font-normal text-zinc-400">Ball</span>
          </div>
        </button>
      </div>

      {/* ================= FORM INPUT / EDIT BALL ================= */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#25F4EE]" />
              <span>{editingBall ? 'Edit Data Ball & Kualitas' : 'Input Data Ball Baru'}</span>
            </h3>
            <span className="text-[11px] text-zinc-400">Kualitas dihitung otomatis dari Kepala &amp; Total Isi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tanggal Pencatatan <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Ambil dari Stok Inventaris (Opsional)
              </label>
              <ThemedSelect
                value={selectedInventoryId}
                onChange={val => handleSelectInventory(val)}
                title="Pilih Ball dari Stok Inventaris"
                placeholder="-- Ketik Manual / Pilih dari Stok Inventaris --"
                options={[
                  { value: '', label: '-- Ketik Manual / Pilih dari Stok Inventaris --' },
                  ...inventoryList.map(inv => ({
                    value: inv.id,
                    label: `${inv.ballType} (${inv.pcsCount || inv.pcsTotal || 0} pcs)`,
                    description: 'Salin nama & isi ball dari inventaris',
                  })),
                ]}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Nama Ball <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="text"
                required
                value={ballName}
                onChange={e => setBallName(e.target.value)}
                placeholder="Contoh: Ball Knitwear Premium Grade A #01"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span>Berat Ball (Kg) <span className="text-[#FE2C55]">*</span></span>
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={weightKg}
                onChange={e => setWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                placeholder="Misal: 45"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
              />
              <div className="flex gap-1 mt-1.5">
                {[40, 45, 50, 100].map(kg => (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setWeightKg(kg)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition ${
                      weightKg === kg
                        ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE] font-bold'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {kg} Kg
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Kategori Kelas: Kepala, Badan, Kaki & Total Isi */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#0b0c10] border border-emerald-500/30 space-y-1.5">
              <label className="block text-xs font-black text-emerald-400">
                Kelas Kepala (Pcs) <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={pcsKepala}
                onChange={e =>
                  handleClassChange(
                    e.target.value === '' ? '' : parseInt(e.target.value) || 0,
                    pcsBadan,
                    pcsKaki
                  )
                }
                placeholder="Misal: 115"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-emerald-500/30 text-white font-bold"
              />
              <span className="text-[10px] text-zinc-400 block">Penentu utama kualitas ball</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#25F4EE]/30 space-y-1.5">
              <label className="block text-xs font-black text-[#25F4EE]">
                Kelas Badan (Pcs)
              </label>
              <input
                type="number"
                min="0"
                value={pcsBadan}
                onChange={e =>
                  handleClassChange(
                    pcsKepala,
                    e.target.value === '' ? '' : parseInt(e.target.value) || 0,
                    pcsKaki
                  )
                }
                placeholder="Misal: 120"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-[#25F4EE]/30 text-white font-bold"
              />
              <span className="text-[10px] text-zinc-400 block">Barang kualitas standar</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0c10] border border-amber-500/30 space-y-1.5">
              <label className="block text-xs font-black text-amber-400">
                Kelas Kaki (Pcs)
              </label>
              <input
                type="number"
                min="0"
                value={pcsKaki}
                onChange={e =>
                  handleClassChange(
                    pcsKepala,
                    pcsBadan,
                    e.target.value === '' ? '' : parseInt(e.target.value) || 0
                  )
                }
                placeholder="Misal: 45"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-amber-500/30 text-white font-bold"
              />
              <span className="text-[10px] text-zinc-400 block">Barang grade bawah</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/20 space-y-1.5">
              <label className="block text-xs font-black text-white">
                Total Isi Ball (Pcs) <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={pcsTotal}
                onChange={e => setPcsTotal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="Misal: 280"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/20 text-white font-black"
              />
              <span className="text-[10px] text-zinc-400 block">Otomatis Kepala + Badan + Kaki</span>
            </div>
          </div>

          {/* Hasil Kualitas Ball Otomatis */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${liveMeta.bgClass} ${liveMeta.borderClass} ${liveMeta.textClass}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-300">Kualitas Ball (Otomatis):</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${liveMeta.bgClass} ${liveMeta.borderClass} ${liveMeta.textClass}`}>
                    {liveMeta.label}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Kriteria: <strong className="text-zinc-200">{liveMeta.description}</strong>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-300 font-semibold">
              Kepala: <span className="text-emerald-400 font-bold">{formatNumber(liveKepala)} pcs</span> • Total Isi: <span className="text-white font-bold">{formatNumber(liveTotal)} pcs</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Catatan Evaluasi Ball (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Isi dominan brand bagus, bahan tebal..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/25 hover:bg-[#25F4EE]/90 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingBall ? 'Simpan Perubahan Ball' : 'Simpan ke Daftar Ball'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ================= DAFTAR BALL TABLE & CARDS ================= */
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="p-3 rounded-2xl bg-[#161823] border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama ball atau catatan..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                />
              </div>

              <ThemedSelect
                value={qualityFilter}
                onChange={val => setQualityFilter(val as any)}
                title="Filter Kualitas Ball"
                options={[
                  { value: 'all', label: 'Semua Kualitas Ball' },
                  { value: 'sangat_bagus', label: 'Sangat Bagus (Kepala > 100 & Isi > 270)' },
                  { value: 'bagus', label: 'Bagus' },
                  { value: 'biasa', label: 'Biasa' },
                  { value: 'jelek', label: 'Jelek (Kepala < 70 & Isi < 250)' },
                ]}
                className="px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
              />
            </div>

            <div className="text-xs text-zinc-400 font-semibold">
              Menampilkan <strong className="text-white">{filteredBalls.length}</strong> Ball
            </div>
          </div>

          {filteredBalls.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#161823] border border-white/10 text-center space-y-3">
              <ClipboardList className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-xs text-zinc-400">
                Belum ada data ball yang sesuai filter. Anda dapat menambahkan langsung atau mengisi melalui menu Sortir &amp; QC.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode('form');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold hover:bg-[#25F4EE]/25 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Input Data Ball Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBalls.map(ball => {
                const computedGrade = evaluateBallQuality(ball.pcsKepala, ball.pcsTotal);
                const qMeta = ballQualityMeta[computedGrade];

                return (
                  <div
                    key={ball.id}
                    className="p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition shadow-md flex flex-col justify-between gap-3"
                  >
                    {/* Header Card: Nama Ball, Berat Ball & Kualitas Ball */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0b0c10] border border-white/10 text-zinc-400 font-semibold">
                            {formatDateIndo(ball.date)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-[#25F4EE]/10 border border-[#25F4EE]/30 text-[#25F4EE] font-black">
                            <Scale className="w-3 h-3" />
                            <span>Berat: {formatNumber(ball.weightKg)} Kg</span>
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-white mt-1.5 truncate">
                          {ball.ballName}
                        </h3>
                      </div>

                      {/* Badge Kualitas Ball + Actions */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black border shadow-sm ${qMeta.bgClass} ${qMeta.borderClass} ${qMeta.textClass}`}
                        >
                          {qMeta.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(ball)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                            title="Edit Data Ball"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ball)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                            title="Hapus Data Ball"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rincian Isi & Kelas (Kepala, Badan, Kaki) */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 text-center">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-semibold">Total Isi</div>
                        <div className="text-xs sm:text-sm font-black text-white">
                          {formatNumber(ball.pcsTotal)} <span className="text-[10px] font-normal text-zinc-400">pcs</span>
                        </div>
                      </div>
                      <div className="border-l border-white/10">
                        <div className="text-[10px] text-emerald-400 font-bold">Kepala</div>
                        <div className="text-xs sm:text-sm font-black text-emerald-400">
                          {formatNumber(ball.pcsKepala)} <span className="text-[10px] font-normal">pcs</span>
                        </div>
                      </div>
                      <div className="border-l border-white/10">
                        <div className="text-[10px] text-[#25F4EE] font-bold">Badan</div>
                        <div className="text-xs sm:text-sm font-black text-[#25F4EE]">
                          {formatNumber(ball.pcsBadan)} <span className="text-[10px] font-normal">pcs</span>
                        </div>
                      </div>
                      <div className="border-l border-white/10">
                        <div className="text-[10px] text-amber-400 font-bold">Kaki</div>
                        <div className="text-xs sm:text-sm font-black text-amber-400">
                          {formatNumber(ball.pcsKaki)} <span className="text-[10px] font-normal">pcs</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Keterangan Kualitas */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 pt-1 border-t border-white/5">
                      <span>Kriteria: <strong className="text-zinc-300">{qMeta.description}</strong></span>
                      {ball.notes && (
                        <span className="truncate max-w-[45%] text-zinc-400 italic" title={ball.notes}>
                          "{ball.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
