import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, SteamSortirRecord } from '../types';
import { formatDateIndo, formatNumber } from '../utils/formatters';
import { 
  Scissors, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Search, 
  Package, 
  Users, 
  PlusCircle,
  ClipboardList,
  AlertCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';

interface SteamSortirViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SteamSortirViewMode = 'menu' | 'input' | 'output';

export const SteamSortirView: React.FC<SteamSortirViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<SteamSortirViewMode>('menu');
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
  const [processType, setProcessType] = useState<'sortir' | 'steam' | 'sortir_dan_steam'>('sortir');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
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
      setPcsTotal(found.pcsCount || '');
      setPcsLayakJual(found.pcsCount || '');
      setPcsReject(0);
      setCustomBallName(found.ballType || '');
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
    setBallInventoryId(record.ballInventoryId || '');
    setCustomBallName(record.ballName || '');
    setProcessType(record.processType || 'sortir');
    setSelectedEmployeeIds(record.employeeIds || []);
    setPcsTotal(record.pcsTotal);
    setPcsLayakJual(record.pcsLayakJual);
    setPcsReject(record.pcsReject);
    setNotes(record.notes || '');
    setStatus(record.status || 'selesai');
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
    setSelectedEmployeeIds([]);
    setPcsTotal('');
    setPcsLayakJual('');
    setPcsReject(0);
    setNotes('');
    setStatus('selesai');
    setEditingRecord(null);
  };

  // Save record (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBall = inventoryList.find(b => b.id === ballInventoryId);
    const finalBallName = (selectedBall ? selectedBall.ballType : (customBallName.trim() || notes.trim() || 'Ball Pengerjaan Sortir/Steam')).trim();

    const selectedEmpNames = employeeList
      .filter(e => selectedEmployeeIds.includes(e.id))
      .map(e => e.name);

    const calcTotal = typeof pcsTotal === 'number' ? pcsTotal : 0;
    const calcReject = typeof pcsReject === 'number' ? pcsReject : 0;
    const calcLayak = typeof pcsLayakJual === 'number' ? pcsLayakJual : Math.max(0, calcTotal - calcReject);

    const record: SteamSortirRecord = {
      id: editingRecord ? editingRecord.id : 'steam-sortir-' + Date.now(),
      storeId,
      date,
      ballInventoryId: selectedBall ? selectedBall.id : undefined,
      ballName: finalBallName,
      processType,
      employeeIds: selectedEmployeeIds,
      employeeNames: selectedEmpNames.length > 0 ? selectedEmpNames : [currentUser.name],
      pcsTotal: calcTotal,
      pcsLayakJual: calcLayak,
      pcsReject: calcReject,
      costPerPcs: 0,
      totalCost: 0,
      status,
      notes,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingRecord) {
          StorageService.updateSteamSortir(record);
          notify('Perubahan data pengerjaan Ball berhasil disimpan!', 'success');
        } else {
          StorageService.addSteamSortir(record);
          notify('Data pengerjaan Sortir & Steam berhasil ditambahkan!', 'success');
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
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-steam"
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer active:scale-95"
              title="Kembali"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
            </button>
          </div>

          <div className="text-right text-xs text-zinc-400">
            Total Selesai: <strong className="text-[#25F4EE]">{formatNumber(totalPcsLayak)} pcs</strong>
          </div>
        </div>

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

        {/* Pilihan Aksi Menu Card (Semantic Buttons) */}
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
                    Catat QC pengerjaan ball, pcs layak &amp; reject
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

  // ================= 2. INPUT FORM STATE (Unified, Non-blocking Form) =================
  if (viewMode === 'input') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-steam"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setViewMode('menu');
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer active:scale-95"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white">
              {editingRecord ? '✏️ Edit Catatan Pengerjaan' : '➕ Input Sortir & QC Finishing'}
            </span>
            <button
              type="button"
              onClick={() => setViewMode('output')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition"
            >
              Lihat Riwayat
            </button>
          </div>
        </div>

        {/* Unified Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bagian 1: Ball & Tim Bertugas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#25F4EE]" />
                <span>Bagian 1: Informasi Ball &amp; Petugas Bertugas</span>
              </h3>
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
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Pilih Ball dari Stok Inventaris
                </label>
                <select
                  value={ballInventoryId}
                  onChange={e => handleSelectBall(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                >
                  <option value="">-- Pilih Ball Masuk / Manual --</option>
                  {inventoryList.map(ball => (
                    <option key={ball.id} value={ball.id}>
                      {ball.ballType} ({ball.pcsCount} pcs)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nama Ball Manual / Teks */}
            <div>
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
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />

              {/* Rekomendasi Cepat Nama Ball */}
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

            {/* Jenis Proses */}
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

            {/* Petugas Pengerja */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span>Petugas yang Mengerjakan (Pilih Pegawai):</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllEmployees}
                  className="text-[10px] text-[#25F4EE] hover:underline font-bold"
                >
                  {selectedEmployeeIds.length === (sortirSteamEmployees.length > 0 ? sortirSteamEmployees : employeeList).length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(sortirSteamEmployees.length > 0 ? sortirSteamEmployees : employeeList).map(emp => {
                  const isSelected = selectedEmployeeIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleToggleEmployee(emp.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate font-semibold">{emp.name || emp.username}</div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${isSelected ? 'bg-[#25F4EE] text-black font-bold' : 'border border-white/20'}`}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bagian 2: Hasil QC Pcs Layak, Reject & Catatan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#FE2C55]" />
                <span>Bagian 2: Hasil Pcs Layak, Reject &amp; Catatan</span>
              </h3>
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
                  placeholder="Misal: 300"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                />
                <div className="flex gap-1 mt-1.5">
                  {[100, 200, 300, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePcsTotalChange(amt)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
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
                  placeholder="Misal: 280"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-emerald-500/40 text-emerald-400 font-bold focus:border-emerald-400"
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
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-[#FE2C55]/40 text-[#FE2C55] font-bold focus:border-[#FE2C55]"
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

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Catatan Kondisi Barang / Evaluasi Ball (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Barang bagus, dominan knit tebal, sedikit noda di 5 pcs bisa dicuci..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                handleCancelEdit();
                setViewMode('menu');
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer active:scale-95 shrink-0"
              title="Kembali"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold transition"
                title="Reset isian form"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-submit-steam"
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/30 hover:bg-[#25F4EE]/90 transition cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingRecord ? 'Simpan Perubahan' : 'Simpan Pengerjaan Sortir & Steam'}</span>
              </button>
            </div>
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
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Top Header Bar with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <button
          id="btn-back-menu-from-output-steam"
          type="button"
          onClick={() => setViewMode('menu')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer active:scale-95"
          title="Kembali"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
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

          <select
            value={selectedProcessFilter}
            onChange={e => setSelectedProcessFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          >
            <option value="all">Semua Proses</option>
            <option value="sortir">Sortir Saja</option>
            <option value="steam">Steam Saja</option>
            <option value="sortir_dan_steam">Sortir + Steam</option>
          </select>

          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          >
            <option value="all">Semua Periode</option>
            <option value="today">Hari Ini</option>
            <option value="weekly">7 Hari Terakhir</option>
            <option value="monthly">Bulan Ini</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400 font-semibold">
          Total: <strong className="text-white">{filteredRecords.length}</strong> catatan
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-[#161823] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#25F4EE]" />
            <span>Rekap Pengerjaan Sortir &amp; Steam Ball</span>
          </h3>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-zinc-500 text-xs">
              Belum ada catatan pengerjaan sortir/steam pada filter ini.
            </p>
            <button
              type="button"
              onClick={() => {
                handleCancelEdit();
                setViewMode('input');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25F4EE]/10 hover:bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/30 text-xs font-bold transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Catat Pengerjaan Pertama Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c10]/60 text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Nama Ball</th>
                  <th className="p-3 font-semibold">Jenis Proses</th>
                  <th className="p-3 font-semibold">Petugas</th>
                  <th className="p-3 font-semibold text-center">Total</th>
                  <th className="p-3 font-semibold text-center text-emerald-400">Layak</th>
                  <th className="p-3 font-semibold text-center text-[#FE2C55]">Reject</th>
                  <th className="p-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-white/5 transition">
                    <td className="p-3 whitespace-nowrap font-medium text-zinc-300">
                      {formatDateIndo(rec.date)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold text-white">
                      {rec.ballName}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
                        {rec.processType === 'sortir_dan_steam' ? 'Sortir + Steam' : rec.processType === 'steam' ? 'Steam' : 'Sortir'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-zinc-300">
                      {rec.employeeNames ? rec.employeeNames.join(', ') : '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-center font-bold text-white">
                      {rec.pcsTotal} pcs
                    </td>
                    <td className="p-3 whitespace-nowrap text-center font-bold text-emerald-400">
                      {rec.pcsLayakJual} pcs
                    </td>
                    <td className="p-3 whitespace-nowrap text-center font-bold text-[#FE2C55]">
                      {rec.pcsReject} pcs
                    </td>
                    <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStartEdit(rec);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#25F4EE]/20 text-[#25F4EE] transition cursor-pointer border border-white/5"
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
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer border border-white/5"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
