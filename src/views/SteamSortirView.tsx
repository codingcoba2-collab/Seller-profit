import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, SteamSortirRecord } from '../types';
import { formatDateIndo, formatNumber, evaluateBallQuality, ballQualityMeta } from '../utils/formatters';
import { 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  ArrowRight,
  Search, 
  Users, 
  PlusCircle,
  ClipboardList,
  RotateCcw,
  Award,
  Scale
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { ThemedSelect } from '../components/ThemedSelect';
import { FuturisticEmployeeCard } from '../components/FuturisticEmployeeCard';

interface SteamSortirViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SteamSortirViewMode = 'menu' | 'input' | 'output';

export const SteamSortirView: React.FC<SteamSortirViewProps> = ({
  currentUser,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<SteamSortirViewMode>('menu');
  const [formStep, setFormStep] = useState<number>(1);
  const [editingRecord, setEditingRecord] = useState<SteamSortirRecord | null>(null);

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
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<'all' | 'sortir' | 'steam' | 'sortir_dan_steam'>('all');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ballInventoryId, setBallInventoryId] = useState('');
  const [customBallName, setCustomBallName] = useState('');
  const [ballWeightKg, setBallWeightKg] = useState<number | ''>(45);
  const [processType, setProcessType] = useState<'sortir' | 'steam' | 'sortir_dan_steam'>('sortir');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [pcsKepala, setPcsKepala] = useState<number | ''>('');
  const [pcsBadan, setPcsBadan] = useState<number | ''>('');
  const [pcsKaki, setPcsKaki] = useState<number | ''>('');
  const [pcsTotal, setPcsTotal] = useState<number | ''>('');
  const [pcsLayakJual, setPcsLayakJual] = useState<number | ''>('');
  const [pcsReject, setPcsReject] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'proses' | 'selesai'>('selesai');

  // Data fetching
  const storeId = currentUser.storeId;
  const inventoryList = StorageService.getInventory(storeId);
  const employeeList = StorageService.getEmployees(storeId);
  const steamSortirRecords = StorageService.getSteamSortir(storeId);

  // Filter employees with sortir/steam/owner role
  const sortirSteamEmployees = employeeList.filter(
    e => e.roles?.includes('sortir') || e.roles?.includes('steam') || e.roles?.includes('owner') || e.roles?.includes('admin_toko')
  );

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onNotify) {
      onNotify(msg, type);
    }
  };

  // Handle Ball Selection to auto-fill pcs & name
  const handleSelectBall = (ballId: string) => {
    setBallInventoryId(ballId);
    if (!ballId) return;
    const found = inventoryList.find(b => b.id === ballId);
    if (found) {
      const count = found.pcsCount || found.pcsTotal || '';
      setPcsTotal(count);
      setPcsLayakJual(count);
      setPcsReject(0);
      setCustomBallName(found.ballType || '');
      if (found.weightKg) setBallWeightKg(found.weightKg);
      if (found.pcsKepala !== undefined) setPcsKepala(found.pcsKepala);
      if (found.pcsBadan !== undefined) setPcsBadan(found.pcsBadan);
      if (found.pcsKaki !== undefined) setPcsKaki(found.pcsKaki);
    }
  };

  // Auto-calculate total pcs when Kepala, Badan, or Kaki changes
  const updateClassBreakdown = (
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
    const sumClass = k + b + f;
    if (sumClass > 0) {
      setPcsTotal(sumClass);
      const reject = typeof pcsReject === 'number' ? pcsReject : 0;
      setPcsLayakJual(Math.max(0, sumClass - reject));
    }
  };

  const handleToggleEmployee = (empId: string) => {
    if (selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
    }
  };

  const handleSelectAllEmployees = () => {
    const listToUse = sortirSteamEmployees.length > 0 ? sortirSteamEmployees : employeeList;
    if (selectedEmployeeIds.length === listToUse.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(listToUse.map(e => e.id));
    }
  };

  const handlePcsTotalChange = (val: number | '') => {
    setPcsTotal(val);
    const numVal = typeof val === 'number' ? val : 0;
    const reject = typeof pcsReject === 'number' ? pcsReject : 0;
    setPcsLayakJual(Math.max(0, numVal - reject));
  };

  const handlePcsRejectChange = (val: number | '') => {
    setPcsReject(val);
    const numVal = typeof val === 'number' ? val : 0;
    const total = typeof pcsTotal === 'number' ? pcsTotal : 0;
    setPcsLayakJual(Math.max(0, total - numVal));
  };

  // Start editing a record
  const handleStartEdit = (record: SteamSortirRecord) => {
    setEditingRecord(record);
    setDate(record.date || new Date().toISOString().slice(0, 10));
    setBallInventoryId(record.ballInventoryId || record.inventoryBallId || '');
    setCustomBallName(record.ballName || '');
    setBallWeightKg(record.ballWeightKg ?? 45);
    setProcessType(record.processType || 'sortir');
    setSelectedEmployeeIds(record.employeeIds || []);
    setPcsKepala(record.pcsKepala ?? '');
    setPcsBadan(record.pcsBadan ?? '');
    setPcsKaki(record.pcsKaki ?? '');
    setPcsTotal(record.pcsTotal ?? record.totalPcsProcessed ?? '');
    setPcsLayakJual(record.pcsLayakJual ?? '');
    setPcsReject(record.pcsReject ?? 0);
    setNotes(record.notes || '');
    setStatus(record.status || 'selesai');
    setFormStep(1);
    setViewMode('input');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingRecord(null);
    resetForm();
  };

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setBallInventoryId('');
    setCustomBallName('');
    setBallWeightKg(45);
    setSelectedEmployeeIds([]);
    setPcsKepala('');
    setPcsBadan('');
    setPcsKaki('');
    setPcsTotal('');
    setPcsLayakJual('');
    setPcsReject(0);
    setNotes('');
    setStatus('selesai');
    setEditingRecord(null);
    setFormStep(1);
  };

  const handleNextStep = () => {
    if (formStep === 1) {
      const selectedBall = inventoryList.find(b => b.id === ballInventoryId);
      const effectiveName = (selectedBall ? selectedBall.ballType : customBallName).trim();
      if (!effectiveName) {
        notify('Pilih Ball dari stok inventaris atau ketik Nama / Jenis Ball terlebih dahulu!', 'error');
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      setFormStep(3);
    } else if (formStep === 3) {
      const k = typeof pcsKepala === 'number' ? pcsKepala : 0;
      const b = typeof pcsBadan === 'number' ? pcsBadan : 0;
      const f = typeof pcsKaki === 'number' ? pcsKaki : 0;
      const sumClass = k + b + f;
      if (sumClass > 0 && (!pcsTotal || pcsTotal === 0)) {
        setPcsTotal(sumClass);
        const reject = typeof pcsReject === 'number' ? pcsReject : 0;
        setPcsLayakJual(Math.max(0, sumClass - reject));
      }
      setFormStep(4);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(prev => prev - 1);
    }
  };

  // Save record (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBall = inventoryList.find(b => b.id === ballInventoryId);
    const finalBallName = (selectedBall ? selectedBall.ballType : (customBallName.trim() || notes.trim() || 'Ball Pengerjaan Sortir/Steam')).trim();

    const selectedEmpNames = employeeList
      .filter(e => selectedEmployeeIds.includes(e.id))
      .map(e => e.name);

    const numKepala = typeof pcsKepala === 'number' ? pcsKepala : 0;
    const numBadan = typeof pcsBadan === 'number' ? pcsBadan : 0;
    const numKaki = typeof pcsKaki === 'number' ? pcsKaki : 0;
    const sumFromClass = numKepala + numBadan + numKaki;

    const calcTotal = typeof pcsTotal === 'number' && pcsTotal > 0 ? pcsTotal : sumFromClass;
    if (calcTotal <= 0) {
      notify('Jumlah total pcs barang harus lebih dari 0!', 'error');
      return;
    }

    const calcReject = typeof pcsReject === 'number' ? pcsReject : 0;
    const calcLayak = typeof pcsLayakJual === 'number' ? pcsLayakJual : Math.max(0, calcTotal - calcReject);
    const calcWeight = typeof ballWeightKg === 'number' && ballWeightKg > 0 ? ballWeightKg : 45;
    const computedQuality = evaluateBallQuality(numKepala, calcTotal);

    const record: SteamSortirRecord = {
      id: editingRecord ? editingRecord.id : 'steam-sortir-' + Date.now(),
      storeId,
      date,
      ballInventoryId: selectedBall ? selectedBall.id : undefined,
      inventoryBallId: selectedBall ? selectedBall.id : undefined,
      ballName: finalBallName,
      ballWeightKg: calcWeight,
      processType,
      employeeIds: selectedEmployeeIds,
      employeeNames: selectedEmpNames.length > 0 ? selectedEmpNames : [currentUser.name],
      pcsKepala: numKepala,
      pcsBadan: numBadan,
      pcsKaki: numKaki,
      ballQuality: computedQuality,
      pcsTotal: calcTotal,
      totalPcsProcessed: calcTotal,
      pcsLayakJual: calcLayak,
      pcsReject: calcReject,
      costPerPcs: 0,
      totalCost: 0,
      status,
      notes,
      recordedBy: currentUser.name,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingRecord) {
          StorageService.updateSteamSortir(record);
          notify('Perubahan data pengerjaan Ball berhasil disimpan & disinkronkan ke Daftar Ball!', 'success');
        } else {
          StorageService.addSteamSortir(record);
          notify('Data pengerjaan Sortir & QC berhasil disimpan & otomatis masuk ke Daftar Ball!', 'success');
        }

        resetForm();
        setViewMode('output');
      } catch (err: any) {
        console.error('Error saving steam/sortir:', err);
        notify('Gagal menyimpan data sortir & steam: ' + (err?.message || 'Terjadi gangguan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingRecord ? 'Konfirmasi Simpan Perubahan Pengerjaan' : 'Konfirmasi Catat Sortir & Steam',
      message: editingRecord
        ? `Apakah Anda yakin ingin menyimpan perubahan pengerjaan ball "${finalBallName}"?`
        : `Apakah Anda yakin ingin menyimpan data pengerjaan ball "${finalBallName}" (${formatNumber(calcTotal)} pcs)?`,
      type: editingRecord ? 'edit' : 'create',
      confirmText: editingRecord ? 'Ya, Simpan Perubahan' : 'Ya, Simpan Data',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, name?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Riwayat Pengerjaan',
      message: `Apakah Anda yakin ingin menghapus riwayat pengerjaan ${name ? `"${name}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteSteamSortir(id);
        notify('Data pengerjaan berhasil dihapus.', 'info');
        if (editingRecord?.id === id) {
          handleCancelEdit();
        }
      },
    });
  };

  // Filter & Sort output records by date descending
  const filteredRecords = steamSortirRecords
    .filter(r => {
      if (selectedProcessFilter !== 'all' && r.processType !== selectedProcessFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.ballName?.toLowerCase().includes(q);
        const matchEmp = r.employeeNames?.some(en => en.toLowerCase().includes(q));
        if (!matchName && !matchEmp) return false;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      if (periodFilter === 'today') {
        return r.date === todayStr;
      } else if (periodFilter === 'weekly') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return r.date >= d.toISOString().slice(0, 10);
      } else if (periodFilter === 'monthly') {
        const currentMonth = todayStr.slice(0, 7);
        return r.date?.startsWith(currentMonth);
      }

      return true;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Quick stats
  const totalPcsProcessed = steamSortirRecords.reduce((acc, curr) => acc + (curr.pcsTotal || 0), 0);
  const totalPcsLayak = steamSortirRecords.reduce((acc, curr) => acc + (curr.pcsLayakJual || 0), 0);
  const totalPcsReject = steamSortirRecords.reduce((acc, curr) => acc + (curr.pcsReject || 0), 0);

  const ballPresets = [
    'Ball Knit Korea',
    'Ball Kaos Vintage',
    'Ball Crewneck & Hoodie',
    'Ball Kemeja Flannel',
    'Ball Celana Cargo'
  ];

  // ================= 1. MENU UTAMA HUB =================
  if (viewMode === 'menu') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4 text-white font-sans">
        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Pcs Diproses</div>
            <div className="text-sm sm:text-base font-black text-white">{formatNumber(totalPcsProcessed)} pcs</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Pcs Layak Jual</div>
            <div className="text-sm sm:text-base font-black text-[#25F4EE]">{formatNumber(totalPcsLayak)} pcs</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 font-semibold">Pcs Reject / Rusak</div>
            <div className="text-sm sm:text-base font-black text-[#FE2C55]">{formatNumber(totalPcsReject)} pcs</div>
          </div>
        </div>

        {/* Pilihan Aksi Menu Card */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi Menu:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Form Input */}
            <button
              id="menu-card-input-steam"
              type="button"
              onClick={() => {
                handleCancelEdit();
                setFormStep(1);
                setViewMode('input');
              }}
              className="w-full text-left group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/60 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0 group-hover:border-[#25F4EE]/50 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight">
                    Input Sortir &amp; Steam
                  </h3>
                  <p className="text-xs text-zinc-400 leading-snug mt-0.5">
                    Catat QC pengerjaan ball, kelas kepala/badan/kaki, pcs layak &amp; reject
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2.5 border-t border-white/5 w-full">
                <span>Input data baru</span>
                <span className="text-[#25F4EE] font-bold group-hover:underline">Buka Form Input &rarr;</span>
              </div>
            </button>

            {/* Card 2: Laporan & Riwayat */}
            <button
              id="menu-card-output-steam"
              type="button"
              onClick={() => setViewMode('output')}
              className="w-full text-left group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/60 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0 group-hover:border-[#FE2C55]/50 group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors leading-tight">
                    Riwayat Pengerjaan
                  </h3>
                  <p className="text-xs text-zinc-400 leading-snug mt-0.5">
                    Laporan hasil pengerjaan, edit data &amp; rekap total
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2.5 border-t border-white/5 w-full">
                <span>{steamSortirRecords.length} Catatan Tersimpan</span>
                <span className="text-[#FE2C55] font-bold group-hover:underline">Buka Riwayat Data &rarr;</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. INPUT FORM STATE (Wizard Bertahap "Selanjutnya", Tanpa Tanda di Atas) =================
  if (viewMode === 'input') {
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 text-white font-sans">
        {/* Compact Form Header (Tanpa tanda stepper di atas) */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            id="btn-back-menu-steam"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setViewMode('menu');
            }}
            className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Batal / Kembali ke Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('output')}
            className="text-xs text-[#25F4EE] hover:underline font-bold transition cursor-pointer"
          >
            Lihat Riwayat QC →
          </button>
        </div>

        {/* Form Container (Format sama dengan Manajemen Pegawai) */}
        <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          {/* TAHAP 1: INFORMASI BALL, BERAT & JENIS PROSES */}
          {formStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white">
                  Informasi Ball, Berat Ball &amp; Jenis Proses
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Pilih ball dari stok inventaris atau ketik nama ball manual beserta beratnya.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Pengerjaan <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Pilih Ball dari Stok Inventaris
                  </label>
                  <ThemedSelect
                    value={ballInventoryId}
                    onChange={val => handleSelectBall(val)}
                    title="Pilih Ball dari Stok Inventaris"
                    placeholder="-- Pilih Ball Masuk / Manual --"
                    options={[
                      { value: '', label: '-- Pilih Ball Masuk / Manual --' },
                      ...inventoryList.map(ball => ({
                        value: ball.id,
                        label: `${ball.ballType} (${ball.pcsCount} pcs)`,
                        description: `Stok ball masuk inventaris`
                      }))
                    ]}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Nama / Jenis Ball <span className="text-[#FE2C55]">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">Ketik manual atau pilih rekomendasi</span>
                  </div>
                  <input
                    type="text"
                    value={customBallName}
                    onChange={e => setCustomBallName(e.target.value)}
                    placeholder="Misal: Ball Knit Korea Grade A"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ballPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomBallName(preset)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-[#25F4EE]/20 hover:text-[#25F4EE] border border-white/10 text-zinc-300 transition"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#25F4EE]" />
                    <span>Berat Ball (Kg)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={ballWeightKg}
                    onChange={e => setBallWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="Misal: 45"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                  <div className="flex gap-1 mt-2">
                    {[40, 45, 50, 100].map(kg => (
                      <button
                        key={kg}
                        type="button"
                        onClick={() => setBallWeightKg(kg)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          ballWeightKg === kg
                            ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE] font-bold'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {kg} Kg
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Jenis Proses Pengerjaan <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sortir', label: 'Sortir QC Saja' },
                    { id: 'steam', label: 'Steam Saja' },
                    { id: 'sortir_dan_steam', label: 'Sortir + Steam' },
                  ].map(proc => (
                    <button
                      key={proc.id}
                      type="button"
                      onClick={() => setProcessType(proc.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        processType === proc.id
                          ? 'bg-[#25F4EE]/15 border-[#25F4EE] text-[#25F4EE] shadow-sm shadow-[#25F4EE]/20'
                          : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {proc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAHAP 2: PETUGAS YANG MENGERJAKAN */}
          {formStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Pilih Petugas Sortir &amp; Steam
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Pilih satu atau lebih pegawai yang mengerjakan ball ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllEmployees}
                  className="text-xs text-[#25F4EE] hover:underline font-bold cursor-pointer shrink-0"
                >
                  {selectedEmployeeIds.length === (sortirSteamEmployees.length > 0 ? sortirSteamEmployees : employeeList).length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua Pegawai'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(sortirSteamEmployees.length > 0 ? sortirSteamEmployees : employeeList).map(emp => {
                  const isSelected = selectedEmployeeIds.includes(emp.id);
                  return (
                    <FuturisticEmployeeCard
                      key={emp.id}
                      id={`card-steam-emp-${emp.id}`}
                      name={emp.name || emp.username}
                      username={emp.username}
                      roleLabel={emp.roles ? emp.roles.join(', ') : 'Sortir & Steam'}
                      isSelected={isSelected}
                      color="cyan"
                      variant="checkbox"
                      onClick={() => handleToggleEmployee(emp.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAHAP 3: KATEGORI KELAS SORTIR & QC (KEPALA, BADAN, KAKI) */}
          {formStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white">
                  Kategori Kelas Sortir &amp; QC (Kepala, Badan, Kaki)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Masukkan jumlah pcs untuk Kelas Kepala, Badan, dan Kaki. Data ini otomatis menentukan kualitas ball di menu Daftar Ball.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Kelas Kepala */}
                <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-emerald-400">
                      Kelas Kepala (Pcs)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Grade Utama
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={pcsKepala}
                    onChange={e => updateClassBreakdown(
                      e.target.value === '' ? '' : parseInt(e.target.value) || 0,
                      pcsBadan,
                      pcsKaki
                    )}
                    placeholder="Misal: 110"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-emerald-500/30 text-white font-bold focus:border-emerald-400"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[50, 75, 105, 120].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => updateClassBreakdown(amt, pcsBadan, pcsKaki)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-300 transition"
                      >
                        {amt} pcs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kelas Badan */}
                <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#25F4EE]">
                      Kelas Badan (Pcs)
                    </label>
                    <span className="text-[10px] text-[#25F4EE] font-semibold">
                      Grade Menengah
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={pcsBadan}
                    onChange={e => updateClassBreakdown(
                      pcsKepala,
                      e.target.value === '' ? '' : parseInt(e.target.value) || 0,
                      pcsKaki
                    )}
                    placeholder="Misal: 120"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-[#25F4EE]/30 text-white font-bold focus:border-[#25F4EE]"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[80, 100, 120, 150].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => updateClassBreakdown(pcsKepala, amt, pcsKaki)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#25F4EE]/20 text-zinc-400 hover:text-[#25F4EE] transition"
                      >
                        {amt} pcs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kelas Kaki */}
                <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-400">
                      Kelas Kaki (Pcs)
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      Grade Bawah
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={pcsKaki}
                    onChange={e => updateClassBreakdown(
                      pcsKepala,
                      pcsBadan,
                      e.target.value === '' ? '' : parseInt(e.target.value) || 0
                    )}
                    placeholder="Misal: 50"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-amber-500/30 text-white font-bold focus:border-amber-400"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[30, 50, 70, 90].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => updateClassBreakdown(pcsKepala, pcsBadan, amt)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 transition"
                      >
                        {amt} pcs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Kualitas Ball Preview Card */}
              {(() => {
                const k = typeof pcsKepala === 'number' ? pcsKepala : 0;
                const b = typeof pcsBadan === 'number' ? pcsBadan : 0;
                const f = typeof pcsKaki === 'number' ? pcsKaki : 0;
                const totalBarang = typeof pcsTotal === 'number' && pcsTotal > 0 ? pcsTotal : (k + b + f);
                const qualityGrade = evaluateBallQuality(k, totalBarang);
                const qMeta = ballQualityMeta[qualityGrade];
                return (
                  <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${qMeta.bgClass} ${qMeta.borderClass} ${qMeta.textClass}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-300">Kualitas Ball:</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${qMeta.bgClass} ${qMeta.borderClass} ${qMeta.textClass}`}>
                            {qMeta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Total Isi: <strong className="text-white">{formatNumber(totalBarang)} pcs</strong> (Kepala: <strong className="text-emerald-400">{formatNumber(k)}</strong> • Badan: <strong className="text-[#25F4EE]">{formatNumber(b)}</strong> • Kaki: <strong className="text-amber-400">{formatNumber(f)}</strong>)
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 sm:text-right">
                      <div>Standar: <span className="text-zinc-300 font-semibold">{qMeta.description}</span></div>
                      <div className="text-[#25F4EE] font-semibold mt-0.5">Otomatis tersimpan ke Menu Daftar Ball</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAHAP 4: HASIL PCS LAYAK, REJECT & CATATAN */}
          {formStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white">
                  Hasil QC Pcs Layak Jual, Reject &amp; Catatan
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Pastikan jumlah pcs layak jual dan reject sudah sesuai sebelum menyimpan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Total Pcs Dibuka/Diproses <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pcsTotal}
                    onChange={e => handlePcsTotalChange(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="Misal: 280"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">Otomatis dari Kepala + Badan + Kaki</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Pcs Layak Jual (Lolos QC) <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pcsLayakJual}
                    onChange={e => setPcsLayakJual(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="Misal: 275"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-emerald-500/40 text-emerald-400 font-bold focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">Otomatis dihitung (Total - Reject)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#FE2C55] mb-1">
                    Pcs Reject (Rusak / Cacat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pcsReject}
                    onChange={e => handlePcsRejectChange(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-[#FE2C55]/40 text-[#FE2C55] font-bold focus:border-[#FE2C55]"
                  />
                  <div className="flex gap-1 mt-1.5">
                    {[0, 5, 10, 20].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handlePcsRejectChange(amt)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Catatan Kondisi Barang / Evaluasi Ball (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Barang bagus, dominan knit tebal, sedikit noda di 5 pcs bisa dicuci..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                />
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons (Format sama dengan Manajemen Pegawai) */}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCancelEdit();
                    setViewMode('menu');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 border border-[#FE2C55]/30 text-[#FE2C55] transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FE2C55] stroke-[2.5]" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                  title="Reset isian form"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {formStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-submit-steam"
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 active:scale-98 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingRecord ? 'Simpan Perubahan' : 'Simpan Pengerjaan Sortir & Steam'}</span>
              </button>
            )}
          </div>
        </form>

        {/* Confirmation Modal */}
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
  }

  // ================= 3. OUTPUT & LAPORAN STATE =================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* Filter Bar with Back Shortcut */}
      <div className="p-3 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-back-menu-from-output-steam"
            type="button"
            onClick={() => setViewMode('menu')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition border border-white/10 cursor-pointer active:scale-95 shrink-0"
            title="Kembali ke Menu"
            aria-label="Kembali ke Menu"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama ball / petugas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
            />
          </div>

          <ThemedSelect
            value={selectedProcessFilter}
            onChange={val => setSelectedProcessFilter(val as any)}
            title="Pilih Tipe Proses"
            options={[
              { value: 'all', label: 'Semua Proses' },
              { value: 'sortir', label: 'Sortir Saja' },
              { value: 'steam', label: 'Steam Saja' },
              { value: 'sortir_dan_steam', label: 'Sortir + Steam' },
            ]}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          />

          <ThemedSelect
            value={periodFilter}
            onChange={val => setPeriodFilter(val as any)}
            title="Pilih Periode Catatan"
            options={[
              { value: 'all', label: 'Semua Periode' },
              { value: 'today', label: 'Hari Ini' },
              { value: 'weekly', label: '7 Hari Terakhir' },
              { value: 'monthly', label: 'Bulan Ini' },
            ]}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          />
        </div>

        <div className="text-xs text-zinc-400 font-semibold">
          Total: <strong className="text-white">{filteredRecords.length}</strong> catatan
        </div>
      </div>

      {/* List of Pengerjaan Cards */}
      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3 bg-[#161823] rounded-2xl border border-white/10 shadow-xl">
            <p className="text-zinc-500 text-xs">
              Belum ada catatan pengerjaan sortir/steam pada filter ini.
            </p>
            <button
              type="button"
              onClick={() => {
                handleCancelEdit();
                setFormStep(1);
                setViewMode('input');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25F4EE]/10 hover:bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Catat Pengerjaan Pertama Sekarang</span>
            </button>
          </div>
        ) : (
          filteredRecords.map(rec => (
            <div
              key={rec.id}
              className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition-all shadow-sm space-y-2"
            >
              {/* Top Row: Date Badge & Process Badge on Left, Action Buttons on Right */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                    {formatDateIndo(rec.date)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
                    {rec.processType === 'sortir_dan_steam' ? 'Sortir + Steam' : rec.processType === 'steam' ? 'Steam' : 'Sortir'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStartEdit(rec);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                    title="Edit Pengerjaan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(rec.id, `${rec.ballName} (${rec.pcsTotal} pcs)`);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Row: Total Pcs on Left, Ball Name & Petugas on Right */}
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                    <span>{rec.pcsTotal} <span className="text-xs font-semibold text-zinc-400">pcs</span></span>
                    {rec.ballWeightKg ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-semibold">
                        {rec.ballWeightKg} Kg
                      </span>
                    ) : null}
                    {((rec.pcsKepala || 0) > 0 || (rec.pcsBadan || 0) > 0 || (rec.pcsKaki || 0) > 0 || rec.ballQuality) && (() => {
                      const qGrade = rec.ballQuality || evaluateBallQuality(rec.pcsKepala || 0, rec.pcsTotal || 0);
                      const qMeta = ballQualityMeta[qGrade];
                      return (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${qMeta.bgClass} ${qMeta.borderClass} ${qMeta.textClass}`}>
                          Kualitas: {qMeta.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-emerald-400">Layak: {rec.pcsLayakJual} pcs</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[#FE2C55]">Reject: {rec.pcsReject} pcs</span>
                  </div>
                  {((rec.pcsKepala || 0) > 0 || (rec.pcsBadan || 0) > 0 || (rec.pcsKaki || 0) > 0) && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Kepala: {formatNumber(rec.pcsKepala || 0)} pcs
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
                        Badan: {formatNumber(rec.pcsBadan || 0)} pcs
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Kaki: {formatNumber(rec.pcsKaki || 0)} pcs
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {rec.ballName}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                    Petugas: {rec.employeeNames && rec.employeeNames.length > 0 ? rec.employeeNames.join(', ') : '-'}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Notes if present */}
              {rec.notes && (
                <div className="pt-1.5 border-t border-white/5 text-[11px] text-zinc-400 leading-snug">
                  <span className="text-zinc-500 font-medium">Catatan: </span>
                  <span>{rec.notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
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
