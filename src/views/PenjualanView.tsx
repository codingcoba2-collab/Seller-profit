import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SalesRecord, CurrentUser, Employee } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  TrendingUp, 
  Trash2, 
  Coins, 
  Megaphone, 
  PackageCheck, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Edit3, 
  ArrowLeft, 
  Filter, 
  Search 
} from 'lucide-react';

interface PenjualanViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PenjualanView: React.FC<PenjualanViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [salesList, setSalesList] = useState<SalesRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter states for Output tab
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [omzet, setOmzet] = useState<number>(3500000);
  const [pcsSold, setPcsSold] = useState<number>(65);
  const [packagesSold, setPackagesSold] = useState<number>(45);
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [coinUsed, setCoinUsed] = useState<number>(50000);
  const [adsUsed, setAdsUsed] = useState<number>(100000);

  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);
  const todayStr = getTodayString();

  const loadData = () => {
    const list = StorageService.getSales(currentUser.storeId);
    setSalesList(list);

    const empList = StorageService.getEmployees(currentUser.storeId);
    setEmployees(empList);

    // Default select first host if available
    const hosts = empList.filter(e => e.roles.includes('host') || e.roles.includes('owner'));
    if (hosts.length > 0 && selectedHostIds.length === 0) {
      setSelectedHostIds([hosts[0].id]);
    }

    // Default select first admin_toko if available
    const admins = empList.filter(e => e.roles.includes('admin_toko'));
    if (admins.length > 0 && selectedAdminIds.length === 0) {
      setSelectedAdminIds([admins[0].id]);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const toggleHost = (hostId: string) => {
    if (selectedHostIds.includes(hostId)) {
      if (selectedHostIds.length === 1) return; // at least 1 host
      setSelectedHostIds(selectedHostIds.filter(id => id !== hostId));
    } else {
      setSelectedHostIds([...selectedHostIds, hostId]);
    }
  };

  const toggleAdmin = (adminId: string) => {
    if (selectedAdminIds.includes(adminId)) {
      setSelectedAdminIds(selectedAdminIds.filter(id => id !== adminId));
    } else {
      setSelectedAdminIds([...selectedAdminIds, adminId]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayString());
    setOmzet(3500000);
    setPcsSold(65);
    setPackagesSold(45);
    setHoursWorked(4);
    setCoinUsed(50000);
    setAdsUsed(100000);
    const admins = employees.filter(e => e.roles.includes('admin_toko'));
    setSelectedAdminIds(admins.length > 0 ? [admins[0].id] : []);
    setErrorMessage('');
  };

  const handleEdit = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !currentUser.isOwner) {
      onNotify('Hanya Owner Toko yang dapat mengedit data penjualan tanggal lampau!', 'error');
      return;
    }

    setEditingId(sale.id);
    setDate(sale.date);
    setSelectedHostIds(sale.hostIds || []);
    setSelectedAdminIds(sale.adminIds || (sale.adminId ? [sale.adminId] : []));
    setOmzet(sale.omzet);
    setPcsSold(sale.pcsSold);
    setPackagesSold(sale.packagesSold);
    setHoursWorked(sale.hoursWorked);
    setCoinUsed(sale.coinUsed);
    setAdsUsed(sale.adsUsed);
    setErrorMessage('');
    setSubTab('input'); // Switch to input smoothly (Requirement 7)
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedHostIds.length === 0) {
      setErrorMessage('Pilih minimal 1 Host Live!');
      return;
    }

    let availableAds = adsCoinInfo.remainingAds;
    let availableCoins = adsCoinInfo.remainingCoin;

    if (editingId) {
      const prev = salesList.find(s => s.id === editingId);
      if (prev) {
        availableAds += (prev.adsUsed || 0);
        availableCoins += (prev.coinUsed || 0);
      }
    }

    if (adsUsed > availableAds) {
      setErrorMessage(`Sisa saldo iklan tidak mencukupi! Sisa tersedia: ${formatRupiah(availableAds)}, diinput: ${formatRupiah(adsUsed)}`);
      return;
    }

    if (coinUsed > availableCoins) {
      setErrorMessage(`Sisa saldo koin tidak mencukupi! Sisa tersedia: ${formatRupiah(availableCoins)}, diinput: ${formatRupiah(coinUsed)}`);
      return;
    }

    const hostNames = selectedHostIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? emp.name : 'Host';
    });

    const adminNames = selectedAdminIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? emp.name : 'Admin Toko';
    });

    const record: SalesRecord = {
      id: editingId || 'sale-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      hostIds: selectedHostIds,
      hostNames,
      adminIds: selectedAdminIds,
      adminNames,
      adminId: selectedAdminIds[0] || '',
      adminName: adminNames[0] || '',
      omzet,
      pcsSold,
      packagesSold,
      hoursWorked,
      coinUsed,
      adsUsed,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      StorageService.updateSale(record);
      onNotify('Perubahan data penjualan berhasil disimpan!', 'success');
    } else {
      StorageService.addSale(record);
      onNotify('Data penjualan sesi live berhasil disimpan!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('output');
  };

  const handleDelete = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !currentUser.isOwner) {
      onNotify('Hanya Owner Toko yang dapat menghapus data penjualan tanggal lampau!', 'error');
      return;
    }
    if (confirm('Hapus data penjualan ini?')) {
      StorageService.deleteSale(sale.id);
      loadData();
      onNotify('Data penjualan berhasil dihapus.', 'info');
      if (editingId === sale.id) {
        handleCancelEdit();
      }
    }
  };

  const hostEmployees = employees.filter(e => e.roles.includes('host') || e.roles.includes('owner'));
  const adminEmployees = employees.filter(e => e.roles.includes('admin_toko') || e.roles.includes('owner'));

  // Filter & sort records by date desc (Requirement 9)
  const filteredSales = salesList
    .filter(s => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHost = s.hostNames?.some(h => h.toLowerCase().includes(q));
        const matchAdmin = s.adminNames?.some(a => a.toLowerCase().includes(q)) || s.adminName?.toLowerCase().includes(q);
        if (!matchHost && !matchAdmin) return false;
      }

      if (periodFilter === 'today') return s.date === todayStr;
      if (periodFilter === 'range') return s.date >= startDate && s.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return s.date >= weekAgo && s.date <= todayStr;
      }
      if (periodFilter === 'monthly') return s.date.startsWith(todayStr.slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Metrics
  const totalOmzetPeriod = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
  const totalPcsPeriod = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
  const totalPkgsPeriod = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
  const totalAdsPeriod = filteredSales.reduce((acc, s) => acc + (s.adsUsed || 0), 0);
  const totalCoinPeriod = filteredSales.reduce((acc, s) => acc + (s.coinUsed || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without stage labels (Requirement 5 & 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-penjualan"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Data Penjualan Live Shopee
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pencatatan omzet sesi live, host bertugas, admin catat/packing, pcs/paket, serta iklan &amp; koin
            </p>
          </div>
        </div>
      </div>

      {/* Sub Navigation (Requirement 7) */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Penjualan' : 'Input Penjualan'}
        outputTitle="Riwayat Penjualan Live"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <TrendingUp className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingId ? 'Edit Data Penjualan Sesi Live' : 'Form Input Penjualan Live Shopee'}</span>
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

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tanggal Penjualan Live <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                id="input-sale-date"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full sm:w-64 px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
              />
            </div>

            {/* Host Live */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-zinc-300">
                  Host Live Yang Bertugas (Bisa Lebih Dari 1) <span className="text-[#FE2C55]">*</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  Dipilih: <strong className="text-white">{selectedHostIds.length}</strong> Host
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {hostEmployees.map(emp => {
                  const isChecked = selectedHostIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleHost(emp.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-[#25F4EE] text-black border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                          : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{emp.name}</div>
                        <div className={`text-[10px] ${isChecked ? 'text-black/70' : 'text-zinc-500'}`}>
                          @{emp.username}
                        </div>
                      </div>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-black shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Toko */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-300">
                    Admin Toko Yang Bertugas (Catat &amp; Packing di Sesi Ini)
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Insentif admin toko dihitung khusus dari paket yang dicatat oleh admin yang dipilih
                  </p>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Dipilih: <strong className="text-white">{selectedAdminIds.length}</strong> Admin
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {adminEmployees.map(emp => {
                  const isChecked = selectedAdminIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleAdmin(emp.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-[#25F4EE] text-black border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                          : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{emp.name}</div>
                        <div className={`text-[10px] ${isChecked ? 'text-black/70' : 'text-zinc-500'}`}>
                          @{emp.username}
                        </div>
                      </div>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-black shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Omzet & Pcs & Paket */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Total Omzet Live (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  id="input-omzet"
                  value={omzet}
                  onChange={setOmzet}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-black focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Total Pcs Terjual <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  id="input-pcs-sold"
                  type="number"
                  required
                  min="0"
                  value={pcsSold}
                  onChange={e => setPcsSold(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Total Paket / Resi Terjual <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  id="input-packages-sold"
                  type="number"
                  required
                  min="0"
                  value={packagesSold}
                  onChange={e => setPackagesSold(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                />
              </div>
            </div>

            {/* Durasi Jam Live */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Durasi Live (Jam) <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                id="input-hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={hoursWorked}
                onChange={e => setHoursWorked(Number(e.target.value))}
                className="w-full sm:w-48 px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
              />
            </div>

            {/* Pemakaian Saldo Iklan & Koin */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-[#25F4EE]" />
                <span>Pemakaian Iklan &amp; Koin di Sesi Ini</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Saldo Iklan Dipakai (Rp)
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Sisa Saldo: {formatRupiah(adsCoinInfo.remainingAds)}
                    </span>
                  </div>
                  <CommaNumberInput
                    value={adsUsed}
                    onChange={setAdsUsed}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-300">
                      Saldo Koin Dipakai (Rp)
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Sisa Saldo: {formatRupiah(adsCoinInfo.remainingCoin)}
                    </span>
                  </div>
                  <CommaNumberInput
                    value={coinUsed}
                    onChange={setCoinUsed}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-submit-sales"
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{editingId ? 'Simpan Perubahan Penjualan' : 'Simpan Data Penjualan Live'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & LAPORAN */}
      {subTab === 'output' && (
        <div className="space-y-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Total Omzet</div>
              <div className="text-lg font-black text-[#25F4EE] mt-1">
                {formatRupiah(totalOmzetPeriod)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Pcs Terjual</div>
              <div className="text-lg font-black text-white mt-1">
                {formatNumber(totalPcsPeriod)} <span className="text-xs font-normal text-zinc-400">pcs</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Paket Terjual</div>
              <div className="text-lg font-black text-white mt-1">
                {formatNumber(totalPkgsPeriod)} <span className="text-xs font-normal text-zinc-400">paket</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
              <div className="text-[11px] font-semibold text-zinc-400">Iklan Terpakai</div>
              <div className="text-lg font-black text-white mt-1">
                {formatRupiah(totalAdsPeriod)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-zinc-400">Koin Terpakai</div>
              <div className="text-lg font-black text-white mt-1">
                {formatRupiah(totalCoinPeriod)}
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
                  placeholder="Cari host / admin..."
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
                handleCancelEdit();
                setSubTab('input');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Input Penjualan
            </button>
          </div>

          {/* Sales Records List (Sorted by date desc) */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Daftar Sesi Penjualan Live ({filteredSales.length})
              </h3>
            </div>

            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data penjualan live pada filter ini.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredSales.map(sale => (
                  <div key={sale.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {formatDateIndo(sale.date)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#0b0c10] text-[#25F4EE] text-[10px] font-bold border border-[#25F4EE]/30">
                          {sale.hoursWorked} Jam Live
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Host: <strong className="text-zinc-200">{sale.hostNames?.join(', ') || 'Host'}</strong></span>
                        <span>•</span>
                        <span>Admin: <strong className="text-zinc-200">{sale.adminNames?.join(', ') || sale.adminName || 'Admin Toko'}</strong></span>
                        <span>•</span>
                        <span>{sale.pcsSold} pcs</span>
                        <span>•</span>
                        <span>{sale.packagesSold} paket</span>
                      </div>

                      <div className="text-[11px] text-zinc-500 flex flex-wrap gap-2">
                        <span>Iklan: {formatRupiah(sale.adsUsed || 0)}</span>
                        <span>•</span>
                        <span>Koin: {formatRupiah(sale.coinUsed || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-[#25F4EE]">
                          {formatRupiah(sale.omzet)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Omzet Kotor
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                          title="Edit Penjualan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Hapus Penjualan"
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
