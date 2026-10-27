import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
import { BallDataRecord, BallQualityGrade, CurrentUser } from '../types';
import {
  formatDateIndo,
  formatNumber,
  evaluateBallQuality,
  ballQualityMeta,
} from '../utils/formatters';
import {
  Scale,
  Award,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Info,
  ClipboardList,
  Calendar,
  ChevronDown,
  X,
  Package,
  Shirt
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
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

interface DaftarBallViewProps {
  currentUser: CurrentUser;
  onBackToDashboard?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DaftarBallView: React.FC<DaftarBallViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const storeId = currentUser.storeId;
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formStep, setFormStep] = useState<number>(1);
  const [ballDataList, setBallDataList] = useState<BallDataRecord[]>([]);
  const [editingBall, setEditingBall] = useState<BallDataRecord | null>(null);

  useEffect(() => {
    if (viewMode === 'form') {
      registerSubViewBackHandler(() => {
        setEditingBall(null);
        setFormStep(1);
        setViewMode('list');
        return true;
      });
    } else {
      registerSubViewBackHandler(null);
    }
    return () => registerSubViewBackHandler(null);
  }, [viewMode]);
  const [showCriteriaGuide, setShowCriteriaGuide] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'all' | BallQualityGrade>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'specific' | 'range'>('all');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [selectedDetailBall, setSelectedDetailBall] = useState<BallDataRecord | null>(null);

  // Edit form states (for updating existing ball data synced from Sortir & QC)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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

  const loadData = () => {
    setBallDataList(StorageService.getBallData(storeId));
  };

  useEffect(() => {
    loadData();
    const unsub = StorageService.subscribe((key) => {
      if (key === 'ball_data' || key === 'steam_sortir' || key === 'all') {
        loadData();
      }
    });
    return () => unsub();
  }, [storeId]);

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

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setBallName('');
    setWeightKg(45);
    setPcsKepala('');
    setPcsBadan('');
    setPcsKaki('');
    setPcsTotal('');
    setNotes('');
    setEditingBall(null);
    setFormStep(1);
  };

  const handleStartEdit = (ball: BallDataRecord) => {
    setEditingBall(ball);
    setDate(ball.date || new Date().toISOString().slice(0, 10));
    setBallName(ball.ballName);
    setWeightKg(ball.weightKg || 45);
    setPcsKepala(ball.pcsKepala);
    setPcsBadan(ball.pcsBadan);
    setPcsKaki(ball.pcsKaki);
    setPcsTotal(ball.pcsTotal);
    setNotes(ball.notes || '');
    setFormStep(1);
    setViewMode('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBall) return;

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
      ...editingBall,
      date,
      ballName: cleanName,
      weightKg: finalWeight,
      pcsTotal: finalTotal,
      pcsKepala: numKepala,
      pcsBadan: numBadan,
      pcsKaki: numKaki,
      qualityGrade: computedGrade,
      notes: notes.trim(),
      recordedBy: currentUser.name,
    };

    setConfirmModal({
      isOpen: true,
      title: 'Simpan Perubahan Data Ball',
      message: `Simpan perubahan data "${cleanName}" (${finalWeight} Kg, Isi ${formatNumber(finalTotal)} pcs, Kepala ${formatNumber(numKepala)} pcs) dengan kualitas "${ballQualityMeta[computedGrade].label}"?`,
      type: 'edit',
      confirmText: 'Ya, Simpan Perubahan',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.addOrUpdateBallData(record);
        loadData();
        notify('Data Ball berhasil diperbarui!', 'success');
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
        loadData();
        notify('Data ball berhasil dihapus.', 'info');
      },
    });
  };

  // Filtered list
  const filteredBalls = ballDataList
    .filter(item => {
      if (qualityFilter !== 'all' && item.qualityGrade !== qualityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.ballName.toLowerCase().includes(q);
        const matchNote = item.notes && item.notes.toLowerCase().includes(q);
        if (!matchName && !matchNote) return false;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      if (periodFilter === 'today') {
        return item.date === todayStr;
      } else if (periodFilter === 'specific') {
        return item.date === specificDate;
      } else if (periodFilter === 'range') {
        return (item.date || '') >= startDate && (item.date || '') <= endDate;
      } else if (periodFilter === 'weekly') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return (item.date || '') >= d.toISOString().slice(0, 10);
      } else if (periodFilter === 'monthly') {
        const currentMonth = todayStr.slice(0, 7);
        return item.date?.startsWith(currentMonth);
      }

      return true;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Summary counts
  const totalPcsFiltered = filteredBalls.reduce((acc, b) => acc + (b.pcsTotal || 0), 0);
  const countSuperBagusFiltered = filteredBalls.filter(b => {
    const q = evaluateBallQuality(b.pcsKepala, b.pcsTotal);
    return q === 'sangat_bagus' || q === 'bagus';
  }).length;

  const liveKepala = typeof pcsKepala === 'number' ? pcsKepala : 0;
  const liveBadan = typeof pcsBadan === 'number' ? pcsBadan : 0;
  const liveKaki = typeof pcsKaki === 'number' ? pcsKaki : 0;
  const liveTotal = typeof pcsTotal === 'number' && pcsTotal > 0 ? pcsTotal : liveKepala + liveBadan + liveKaki;
  const liveQuality = evaluateBallQuality(liveKepala, liveTotal);
  const liveMeta = ballQualityMeta[liveQuality];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* ================= FORM EDIT BALL ================= */}
      {viewMode === 'form' && editingBall ? (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white">
                    Informasi Nama &amp; Berat Ball
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Perbarui identitas ball dan berat ball (Kg).
                  </p>
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

                  <div>
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
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white">
                    Rincian Kelas (Kepala, Badan, Kaki) &amp; Kualitas Ball
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Kualitas ball dihitung otomatis dari jumlah Kepala dan Total Isi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {formStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setFormStep(prev => prev - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setViewMode('list');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 border border-[#FE2C55]/30 text-[#FE2C55] transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FE2C55] stroke-[2.5]" />
                  <span>Batal</span>
                </button>
              )}

              {formStep < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!ballName.trim()) {
                      notify('Nama Ball wajib diisi!', 'error');
                      return;
                    }
                    setFormStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan Ball</span>
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* ================= RIWAYAT / DAFTAR BALL (STANDARDIZED UI) ================= */
        <div className="space-y-3 sm:space-y-4">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {onBackToDashboard && (
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0c1527] hover:bg-[#122038] border border-[#162544] flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                  title="Kembali ke Dashboard"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                  Riwayat Evaluasi Ball
                </h1>
                <p className="text-[9px] xs:text-[10px] sm:text-xs text-slate-400 truncate">
                  Data terintegrasi sortir, QC &amp; finishing
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCriteriaGuide(!showCriteriaGuide)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-[10px] sm:text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
            >
              <Info className="w-3.5 h-3.5 text-[#050811] stroke-[2.5]" />
              <span>{showCriteriaGuide ? 'Tutup Standar' : 'Standar Kualitas'}</span>
            </button>
          </div>

          {/* 3-Column Top Summary Card */}
          <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
            <div className="grid grid-cols-3 divide-x divide-[#142239]">
              {/* 1. Total Ball Terdata */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] text-[#00f2fe] flex items-center justify-center shrink-0">
                    <Package className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                    Total Terdata
                  </span>
                </div>
                <div className="text-[#00f2fe] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                  {formatNumber(filteredBalls.length)} Ball
                </div>
              </div>

              {/* 2. Total Isi Pcs */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00e676]/10 border border-[#00e676] text-[#00e676] flex items-center justify-center shrink-0">
                    <Shirt className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                    Total Isi Pcs
                  </span>
                </div>
                <div className="text-[#00e676] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                  {formatNumber(totalPcsFiltered)} pcs
                </div>
              </div>

              {/* 3. Super & Bagus */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24] text-[#fbbf24] flex items-center justify-center shrink-0">
                    <Award className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                    Super &amp; Bagus
                  </span>
                </div>
                <div className="text-[#fbbf24] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                  {formatNumber(countSuperBagusFiltered)} Ball
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Standar Kriteria Kualitas Ball */}
          {showCriteriaGuide && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0a1220] border border-[#00f2fe]/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-[#00f2fe] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00f2fe]" />
                  <span>Standar Penilaian Kualitas Ball</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="font-black text-emerald-400 text-xs">1. Sangat Bagus</div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-300 leading-snug">
                    Kepala &gt; 100 pcs &amp; Total Isi &gt; 270 pcs
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/30 space-y-1">
                  <div className="font-black text-[#00f2fe] text-xs">2. Bagus</div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-300 leading-snug">
                    Kepala &gt; 70-100 pcs &amp; Isi &gt; 270 pcs, atau Kepala &gt; 100 pcs &amp; Isi &lt; 270 pcs
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="font-black text-amber-400 text-xs">3. Biasa</div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-300 leading-snug">
                    Kepala 70-100 pcs &amp; Isi &lt; 270 pcs, atau Kepala &lt; 70 pcs &amp; Isi &gt; 270 pcs
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 space-y-1">
                  <div className="font-black text-[#ff3366] text-xs">4. Jelek</div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-300 leading-snug">
                    Kepala &lt; 70 pcs &amp; Total Isi &lt; 250 pcs
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'sangat_bagus', label: 'Sangat Bagus' },
              { id: 'bagus', label: 'Bagus' },
              { id: 'biasa', label: 'Biasa' },
              { id: 'jelek', label: 'Jelek' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQualityFilter(tab.id as any)}
                className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                  qualityFilter === tab.id
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
                placeholder="Cari nama ball atau catatan..."
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
                  <th className="w-[35%] py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-left font-bold truncate">Nama Ball</th>
                  <th className="w-[16.5%] py-2.5 px-0.5 xs:px-1 text-center font-bold truncate">Kepala</th>
                  <th className="w-[16.5%] py-2.5 px-0.5 xs:px-1 text-center font-bold truncate">Berat</th>
                  <th className="w-[17%] py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-right font-bold truncate">Total Isi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142239]/60">
                {filteredBalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                      Tidak ada data ball yang sesuai kriteria
                    </td>
                  </tr>
                ) : (
                  filteredBalls.map((ball) => {
                    const computedGrade = evaluateBallQuality(ball.pcsKepala, ball.pcsTotal);
                    const qMeta = ballQualityMeta[computedGrade];

                    return (
                      <tr
                        key={ball.id}
                        onClick={() => setSelectedDetailBall(ball)}
                        className="hover:bg-[#0e182c]/80 transition cursor-pointer"
                      >
                        {/* Tanggal */}
                        <td className="py-2 sm:py-2.5 px-1 xs:px-1.5 sm:px-2.5 align-middle">
                          <span className="text-[6.5px] xs:text-[7.5px] sm:text-[10px] md:text-xs text-slate-300 font-semibold tracking-tight whitespace-nowrap block truncate">
                            {formatScreenshotDate(ball.date)}
                          </span>
                        </td>

                        {/* Nama Ball */}
                        <td className="py-2 sm:py-2.5 px-1 xs:px-1.5 sm:px-2.5 align-middle min-w-0">
                          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                            <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 flex items-center justify-center shrink-0">
                              <Package className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-[#00f2fe]" />
                            </div>
                            <div className="min-w-0 flex-1 truncate">
                              <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold text-white block truncate leading-tight">
                                {ball.ballName}
                              </span>
                              <span className={`inline-block text-[5.5px] xs:text-[6.5px] sm:text-[9px] font-bold px-1 py-0.5 rounded-md border mt-0.5 ${qMeta.bgClass} ${qMeta.textClass} ${qMeta.borderClass}`}>
                                {qMeta.label}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kepala */}
                        <td className="py-2 sm:py-2.5 px-0.5 xs:px-1 text-center align-middle">
                          <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold text-[#00e676] tabular-nums whitespace-nowrap block truncate">
                            {formatNumber(ball.pcsKepala)} pcs
                          </span>
                        </td>

                        {/* Berat */}
                        <td className="py-2 sm:py-2.5 px-0.5 xs:px-1 text-center align-middle">
                          <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold text-slate-300 tabular-nums whitespace-nowrap block truncate">
                            {formatNumber(ball.weightKg || 45)} Kg
                          </span>
                        </td>

                        {/* Total Isi */}
                        <td className="py-2 sm:py-2.5 px-1 xs:px-1.5 sm:px-2.5 text-right align-middle">
                          <span className="text-[7px] xs:text-[8px] sm:text-xs font-black text-[#00f2fe] tabular-nums whitespace-nowrap block truncate">
                            {formatNumber(ball.pcsTotal)} pcs
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailBall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedDetailBall(null)}
        >
          <div
            className="w-full max-w-md bg-[#0a1220] border border-[#142239] rounded-3xl p-5 shadow-2xl space-y-4 text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#142239]">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Detail Evaluasi Ball
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatDateIndo(selectedDetailBall.date)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailBall(null)}
                className="w-7 h-7 rounded-full bg-[#142239] hover:bg-[#1e3252] flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quality Grade Banner */}
            {(() => {
              const compGrade = evaluateBallQuality(selectedDetailBall.pcsKepala, selectedDetailBall.pcsTotal);
              const m = ballQualityMeta[compGrade];
              return (
                <div className={`p-3.5 rounded-2xl border ${m.bgClass} ${m.borderClass} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase tracking-wider ${m.textClass}`}>
                      Grade: {m.label}
                    </span>
                    <Award className={`w-4 h-4 ${m.textClass}`} />
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {m.description}
                  </p>
                </div>
              );
            })()}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544] col-span-2">
                <span className="text-[10px] text-slate-400 block mb-0.5">Nama Ball:</span>
                <span className="font-bold text-white text-sm block">
                  {selectedDetailBall.ballName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Berat Ball:</span>
                <span className="font-black text-[#00f2fe] text-sm">
                  {formatNumber(selectedDetailBall.weightKg || 45)} Kg
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Total Isi Ball:</span>
                <span className="font-black text-[#00f2fe] text-sm">
                  {formatNumber(selectedDetailBall.pcsTotal)} pcs
                </span>
              </div>
            </div>

            {/* Breakdown Kelas (Kepala, Badan, Kaki) */}
            <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544] space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Rincian Kelas Hasil Sortir
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[#060b14] border border-[#142239]">
                  <span className="text-[9px] text-[#00e676] font-bold block">Kepala</span>
                  <span className="text-xs font-black text-[#00e676]">
                    {formatNumber(selectedDetailBall.pcsKepala)} pcs
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">
                    {selectedDetailBall.pcsTotal > 0 ? Math.round((selectedDetailBall.pcsKepala / selectedDetailBall.pcsTotal) * 100) : 0}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#060b14] border border-[#142239]">
                  <span className="text-[9px] text-[#00f2fe] font-bold block">Badan</span>
                  <span className="text-xs font-black text-[#00f2fe]">
                    {formatNumber(selectedDetailBall.pcsBadan)} pcs
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">
                    {selectedDetailBall.pcsTotal > 0 ? Math.round((selectedDetailBall.pcsBadan / selectedDetailBall.pcsTotal) * 100) : 0}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#060b14] border border-[#142239]">
                  <span className="text-[9px] text-[#fbbf24] font-bold block">Kaki</span>
                  <span className="text-xs font-black text-[#fbbf24]">
                    {formatNumber(selectedDetailBall.pcsKaki)} pcs
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">
                    {selectedDetailBall.pcsTotal > 0 ? Math.round((selectedDetailBall.pcsKaki / selectedDetailBall.pcsTotal) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan */}
            {selectedDetailBall.notes && (
              <div className="p-3 rounded-xl bg-[#0c1527] border border-[#162544]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Catatan Evaluasi:</span>
                <span className="text-xs text-slate-300 italic">
                  "{selectedDetailBall.notes}"
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#142239]">
              <button
                type="button"
                onClick={() => setSelectedDetailBall(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedDetailBall;
                    setSelectedDetailBall(null);
                    handleDelete(b);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#ff3366]/15 hover:bg-[#ff3366]/25 border border-[#ff3366]/30 text-[#ff3366] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const b = selectedDetailBall;
                    setSelectedDetailBall(null);
                    handleStartEdit(b);
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
