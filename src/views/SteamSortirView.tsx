import React, { useState } from 'react';
import { CurrentUser, SteamSortirRecord, BallInventory, Employee } from '../types';
import { StorageService } from '../services/storage';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { formatNumber } from '../utils/formatters';
import { 
  Scissors, 
  Flame, 
  Package, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Layers, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';

interface SteamSortirViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SteamSortirView: React.FC<SteamSortirViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
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
    setSubTab('input');
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
      setEditingRecord(null);
    } else {
      StorageService.addSteamSortir(record);
      onNotify('Data pengerjaan Sortir & Steam berhasil ditambahkan!', 'success');
    }

    resetForm();
    setSubTab('output');
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Sub Navigation */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingRecord ? '✏️ Sedang Mengedit Data' : 'Formulir Input Pengerjaan'}
        outputTitle="Laporan &amp; Riwayat Pengerjaan"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="bg-[#161823] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {editingRecord ? (
                  <>
                    <Edit3 className="w-5 h-5 text-[#FE2C55]" />
                    <span>Sedang Mengedit: <span className="text-[#25F4EE]">{editingRecord.ballName}</span></span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5 text-[#25F4EE]" />
                    <span>Input Pengerjaan Sortir &amp; Steam Ball</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {editingRecord ? 'Perbarui data pengerjaan ball yang dipilih' : 'Pilih ball dari stok atau masukkan pengerjaan baru'}
              </p>
            </div>

            {editingRecord && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Tanggal Pengerjaan <span className="text-[#FE2C55]">*</span>
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE]"
                  />
                </div>
              </div>

              {/* Jenis Proses */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Jenis Proses <span className="text-[#FE2C55]">*</span>
                </label>
                <select
                  value={processType}
                  onChange={e => setProcessType(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE]"
                >
                  <option value="sortir">Proses Sortir Saja</option>
                  <option value="steam">Proses Steam / Setrika Saja</option>
                  <option value="sortir_dan_steam">Sortir &amp; Steam Sekaligus</option>
                </select>
              </div>
            </div>

            {/* Pilih Ball dari Stok Modal */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Pilih Ball dari Stok Inventory (Opsional tapi Direkomendasikan)
              </label>
              <select
                value={ballInventoryId}
                onChange={e => handleSelectBall(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE]"
              >
                <option value="">-- Pilih Ball dari Inventory / Atau ketik manual di bawah --</option>
                {inventoryList.map(ball => (
                  <option key={ball.id} value={ball.id}>
                    {ball.ballType} - {ball.pcsCount} pcs ({ball.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Ball Manual jika tidak dari stok */}
            {!ballInventoryId && (
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nama / Jenis Ball (Manual)
                </label>
                <input
                  type="text"
                  value={customBallName}
                  onChange={e => setCustomBallName(e.target.value)}
                  placeholder="Contoh: Ball Knit Korea Grade A"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE]"
                />
              </div>
            )}

            {/* Pilih Petugas Tim Sortir / Steam */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Petugas yang Mengerjakan (Pilih Pegawai)
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {sortirSteamEmployees.length > 0 ? (
                  sortirSteamEmployees.map(emp => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleToggleEmployee(emp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#25F4EE] text-black border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                            : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{emp.name}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-zinc-500">
                    Belum ada pegawai dengan role Sortir/Steam. Silakan daftarkan di Manajemen Pegawai.
                  </span>
                )}
              </div>
            </div>

            {/* Perhitungan Pcs & Reject */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Total Pcs Dibongkar <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pcsTotal}
                    onChange={e => handlePcsTotalChange(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="350"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#FE2C55] mb-1">
                    Pcs Reject (Rusak/Noda)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pcsReject}
                    onChange={e => handlePcsRejectChange(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-[#FE2C55] font-bold focus:border-[#FE2C55]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#25F4EE] mb-1">
                    Pcs Layak Jual (Otomatis)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={pcsLayakJual}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823]/80 border border-[#25F4EE]/30 text-[#25F4EE] font-extrabold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#25F4EE]/5 border border-[#25F4EE]/20 flex items-start gap-2">
                <span className="text-xs">💡</span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong className="text-[#25F4EE]">Aturan Sistem:</strong> Insentif pekerja sortir &amp; steam serta sisa stok tersedia toko dihitung <b>murni dari Pcs Layak Jual</b>. Barang reject otomatis tidak dianggap masuk stok maupun insentif.
                </p>
              </div>
            </div>

            {/* Catatan / Keterangan Pengerjaan */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Catatan / Keterangan Pengerjaan
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Kondisi knit bersih, reject minim kancing lepas"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-95 transition cursor-pointer"
              >
                {editingRecord ? 'Simpan Perubahan' : 'Simpan Data Pengerjaan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & RIWAYAT */}
      {subTab === 'output' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10">
              <span className="text-[11px] text-zinc-400 font-semibold block">Total Pcs Diproses</span>
              <span className="text-lg font-black text-white mt-1 block">
                {formatNumber(totalPcsProcessed)} pcs
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10">
              <span className="text-[11px] text-zinc-400 font-semibold block">Pcs Layak Jual</span>
              <span className="text-lg font-black text-[#25F4EE] mt-1 block">
                {formatNumber(totalPcsLayak)} pcs
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10">
              <span className="text-[11px] text-zinc-400 font-semibold block">Total Pcs Reject</span>
              <span className="text-lg font-black text-[#FE2C55] mt-1 block">
                {formatNumber(totalPcsReject)} pcs
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari jenis ball / nama tim..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                />
              </div>

              <select
                value={selectedProcessFilter}
                onChange={e => setSelectedProcessFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
              >
                <option value="all">Semua Jenis Proses</option>
                <option value="sortir">Hanya Sortir</option>
                <option value="steam">Hanya Steam</option>
                <option value="sortir_dan_steam">Sortir &amp; Steam</option>
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

            <button
              type="button"
              onClick={() => {
                resetForm();
                setSubTab('input');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Input Pengerjaan Baru
            </button>
          </div>

          {/* Records Table */}
          <div className="rounded-2xl bg-[#161823] border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#0b0c10] text-zinc-400 uppercase text-[10px] font-bold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jenis Ball</th>
                    <th className="py-3 px-4">Proses</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-center">Pcs Total</th>
                    <th className="py-3 px-4 text-center">Layak Jual</th>
                    <th className="py-3 px-4 text-center">Reject</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-mono text-zinc-300">{item.date}</td>
                        <td className="py-3 px-4 font-bold text-white">
                          <div>{item.ballName}</div>
                          {item.notes && <div className="text-[10px] text-zinc-400">{item.notes}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.processType === 'sortir'
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                              : item.processType === 'steam'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                : 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/30'
                          }`}>
                            {item.processType === 'sortir' ? 'Sortir' : item.processType === 'steam' ? 'Steam' : 'Sortir & Steam'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {item.employeeNames.join(', ')}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{item.pcsTotal}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#25F4EE]">{item.pcsLayakJual}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#FE2C55]">{item.pcsReject}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                              title="Edit Data Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-zinc-500">
                        Belum ada riwayat pengerjaan sortir &amp; steam yang sesuai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
