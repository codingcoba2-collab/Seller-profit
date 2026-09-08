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
  Layers, 
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  PlusCircle
} from 'lucide-react';

interface SteamSortirViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SteamSortirViewMode = 'menu' | 'input' | 'output';

export const SteamSortirView: React.FC<SteamSortirViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<SteamSortirViewMode>('menu');
  const [inputStep, setInputStep] = useState<number>(1);
  const [editingRecord, setEditingRecord] = useState<SteamSortirRecord | null>(null);

  // Filter state for Output tab
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
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
    e => e.roles.includes('sortir') || e.roles.includes('steam') || e.roles.includes('owner')
  );

  // Handle Ball Selection to auto-fill pcs & name
  const handleSelectBall = (ballId: string) => {
    setBallInventoryId(ballId);
    const found = inventoryList.find(b => b.id === ballId);
    if (found) {
      setPcsTotal(found.pcsCount);
      setPcsLayakJual(found.pcsCount);
      setPcsReject(0);
      setCustomBallName(found.ballType);
    }
  };

  const handleToggleEmployee = (empId: string) => {
    if (selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
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
    setDate(record.date);
    setBallInventoryId(record.ballInventoryId || '');
    setCustomBallName(record.ballName);
    setProcessType(record.processType);
    setSelectedEmployeeIds(record.employeeIds || []);
    setPcsTotal(record.pcsTotal);
    setPcsLayakJual(record.pcsLayakJual);
    setPcsReject(record.pcsReject);
    setNotes(record.notes || '');
    setStatus(record.status);
    setInputStep(1);
    setViewMode('input');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingRecord(null);
    resetForm();
    setInputStep(1);
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

    if (!ballInventoryId && !customBallName && !notes) {
      onNotify('Pilih Ball dari stok atau tuliskan nama ball yang diproses.', 'error');
      return;
    }

    const selectedBall = inventoryList.find(b => b.id === ballInventoryId);
    const finalBallName = selectedBall ? selectedBall.ballType : (customBallName || notes || 'Ball Pengerjaan');

    const selectedEmpNames = employeeList
      .filter(e => selectedEmployeeIds.includes(e.id))
      .map(e => e.name);

    const record: SteamSortirRecord = {
      id: editingRecord ? editingRecord.id : 'steam-sortir-' + Date.now(),
      storeId,
      date,
      ballInventoryId: selectedBall ? selectedBall.id : undefined,
      ballName: finalBallName,
      processType,
      employeeIds: selectedEmployeeIds,
      employeeNames: selectedEmpNames.length > 0 ? selectedEmpNames : [currentUser.name],
      pcsTotal: typeof pcsTotal === 'number' ? pcsTotal : 0,
      pcsLayakJual: typeof pcsLayakJual === 'number' ? pcsLayakJual : 0,
      pcsReject: typeof pcsReject === 'number' ? pcsReject : 0,
      costPerPcs: 0,
      totalCost: 0,
      status,
      notes,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    if (editingRecord) {
      StorageService.updateSteamSortir(record);
      onNotify('Perubahan data pengerjaan Ball berhasil disimpan!', 'success');
    } else {
      StorageService.addSteamSortir(record);
      onNotify('Data pengerjaan Sortir & Steam berhasil ditambahkan!', 'success');
    }

    resetForm();
    handleCancelEdit();
    setViewMode('output');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus riwayat pengerjaan ball ini?')) {
      StorageService.deleteSteamSortir(id);
      onNotify('Data pengerjaan berhasil dihapus.', 'info');
      if (editingRecord?.id === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & Sort output records by date descending
  const filteredRecords = steamSortirRecords
    .filter(r => {
      // Process type filter
      if (selectedProcessFilter !== 'all' && r.processType !== selectedProcessFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.ballName.toLowerCase().includes(q);
        const matchEmp = r.employeeNames.some(en => en.toLowerCase().includes(q));
        if (!matchName && !matchEmp) return false;
      }

      // Date filters
      const todayStr = new Date().toISOString().slice(0, 10);
      if (periodFilter === 'today') {
        return r.date === todayStr;
      }
      if (periodFilter === 'range') {
        return r.date >= startDate && r.date <= endDate;
      }
      if (periodFilter === 'weekly') {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
        return r.date >= weekAgo && r.date <= todayStr;
      }
      if (periodFilter === 'monthly') {
        const curMonth = todayStr.slice(0, 7);
        return r.date.startsWith(curMonth);
      }

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Calculate totals
  const totalPcsProcessed = filteredRecords.reduce((acc, r) => acc + (r.pcsTotal || 0), 0);
  const totalPcsLayak = filteredRecords.reduce((acc, r) => acc + (r.pcsLayakJual || 0), 0);
  const totalPcsReject = filteredRecords.reduce((acc, r) => acc + (r.pcsReject || 0), 0);

  // ================= 1. MENU HUB STATE (2 Pilihan Grid) =================
  if (viewMode === 'menu') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-dashboard-steam"
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#25F4EE]" />
                <span>Sortir QC &amp; Finishing Pakaian</span>
              </h2>
            </div>
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

        {/* Grid Kecil 2 Kesamping: Input vs Output */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: Form Input */}
            <div
              id="menu-card-input-steam"
              onClick={() => {
                handleCancelEdit();
                setInputStep(1);
                setViewMode('input');
              }}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors truncate">
                    Input Sortir &amp; Steam
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                    Catat QC pengerjaan ball bertahap
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Input data baru →</span>
                <span className="text-[#25F4EE] font-bold">Buka Form</span>
              </div>
            </div>

            {/* Card 2: Laporan & Riwayat */}
            <div
              id="menu-card-output-steam"
              onClick={() => setViewMode('output')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors truncate">
                    Riwayat Pengerjaan
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                    Laporan hasil layak &amp; reject
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{filteredRecords.length} Data Tersedia →</span>
                <span className="text-[#FE2C55] font-bold">Buka Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) =================
  if (viewMode === 'input') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-steam"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setViewMode('menu');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Kembali ke Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white">
              {editingRecord ? '✏️ Edit Pengerjaan' : 'Input Sortir & Finishing'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
              Tahap {inputStep} dari 2
            </span>
          </div>
        </div>

        {/* Stepper Header Pills */}
        <div className="grid grid-cols-2 gap-2 bg-[#161823] p-2.5 rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setInputStep(1)}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 1
                ? 'bg-[#25F4EE]/10 border border-[#25F4EE] text-[#25F4EE]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            <span>Ball &amp; Tim Bertugas</span>
          </button>
          <button
            type="button"
            onClick={() => setInputStep(2)}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 2
                ? 'bg-[#25F4EE]/10 border border-[#25F4EE] text-[#25F4EE]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
            <span>Hasil QC &amp; Pcs</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {/* TAHAP 1: Info Ball & Pegawai */}
          {inputStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 1: Pilih Ball &amp; Petugas Bertugas</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Tentukan sumber ball dan pegawai yang mengerjakan.</p>
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

              {!ballInventoryId && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Atau Ketik Nama / Kode Ball Manual <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="text"
                    value={customBallName}
                    onChange={e => setCustomBallName(e.target.value)}
                    placeholder="Misal: Ball Knit Korea Grade A"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Jenis Proses Pengerjaan <span className="text-[#FE2C55]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sortir', label: 'Sortir QC Saja' },
                    { id: 'steam', label: 'Steam Finishing' },
                    { id: 'sortir_dan_steam', label: 'Sortir + Steam' },
                  ].map(proc => (
                    <button
                      key={proc.id}
                      type="button"
                      onClick={() => setProcessType(proc.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        processType === proc.id
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-[#25F4EE]'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {proc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pegawai Pengerja */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span>Petugas yang Mengerjakan (Bisa Pilih Banyak):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(sortirSteamEmployees.length > 0 ? sortirSteamEmployees : employeeList).map(emp => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white font-bold'
                            : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEmployee(emp.id)}
                          className="rounded accent-[#25F4EE] cursor-pointer"
                        />
                        <span className="truncate">{emp.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!ballInventoryId && !customBallName.trim()) {
                      onNotify('Harap pilih atau tuliskan nama ball terlebih dahulu!', 'error');
                      return;
                    }
                    setInputStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Tahap Selanjutnya: Hasil Pcs &amp; QC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2: Hasil Pcs Layak, Reject & Simpan */}
          {inputStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 2: Input Hasil Pcs Layak, Reject &amp; Catatan</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Masukkan jumlah pakaian layak jual dan yang mengalami kerusakan/reject.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Total Pcs Ball <span className="text-[#FE2C55]">*</span>
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Pcs Layak Jual (Grade A/B)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pcsLayakJual}
                    onChange={e => setPcsLayakJual(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="Otomatis"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-emerald-500/30 text-emerald-300 font-bold focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#FE2C55] mb-1">
                    Pcs Reject / Cacat
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pcsReject}
                    onChange={e => handlePcsRejectChange(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-[#FE2C55]/30 text-[#FE2C55] font-bold focus:border-[#FE2C55]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Status Pengerjaan
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  >
                    <option value="selesai">✅ Selesai Dikerjakan</option>
                    <option value="proses">⏳ Sedang Dalam Proses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Catatan Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Misal: Ball banyak dress knit bagus, reject noda 5 pcs"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setInputStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tahap Sebelumnya</span>
                </button>

                <button
                  id="btn-submit-steam"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingRecord ? 'Simpan Perubahan' : 'Simpan Pengerjaan'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // ================= 3. OUTPUT & LAPORAN STATE (Tanpa Tab) =================
  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <button
          id="btn-back-menu-from-output-steam"
          type="button"
          onClick={() => setViewMode('menu')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kembali ke Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-form-from-output-steam"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setInputStep(1);
              setViewMode('input');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Input Pengerjaan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-60">
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
          <div className="text-center py-12 text-zinc-500 text-xs">
            Belum ada catatan pengerjaan sortir/steam pada periode ini.
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
                      {rec.employeeNames.join(', ')}
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
                        onClick={() => handleStartEdit(rec)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Edit Pengerjaan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
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
    </div>
  );
};
