import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { SalesRecord, CurrentUser, Employee, SalesType, SalesChannel, FashionCategory, PaymentMethod, SaleFormat } from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  formatDateIndo, 
  getTodayString, 
  salesChannelLabels, 
  fashionCategoryLabels, 
  paymentMethodLabels 
} from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
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
  Edit3, 
  ArrowLeft, 
  Filter, 
  Search,
  Store,
  Video,
  ShoppingBag,
  Layers,
  FileSpreadsheet,
  Download,
  CreditCard,
  Tag,
  ExternalLink,
  ChevronDown,
  Printer,
  Sparkles,
  Eye,
  X
} from 'lucide-react';

interface PenjualanViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PenjualanSubTab = 'rekap' | 'input_live' | 'input_non_live';

export const PenjualanView: React.FC<PenjualanViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<PenjualanSubTab>('rekap');
  const [salesList, setSalesList] = useState<SalesRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDetailSale, setViewingDetailSale] = useState<SalesRecord | null>(null);

  // Filter states for Rekap tab
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'non_live'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  // FORM STATES: Common & Live
  const [date, setDate] = useState(getTodayString());
  const [category, setCategory] = useState<FashionCategory>('pakaian_jadi');
  const [omzet, setOmzet] = useState<number>(3500000);
  const [pcsSold, setPcsSold] = useState<number>(50);
  const [packagesSold, setPackagesSold] = useState<number>(35);
  const [notes, setNotes] = useState<string>('');

  // FORM STATES: Live Format Penjualan (Satuan / Bundling / Campuran)
  const [saleFormat, setSaleFormat] = useState<SaleFormat>('bundling');
  const [satuanPcs, setSatuanPcs] = useState<number>(0);
  const [satuanPackages, setSatuanPackages] = useState<number>(0);
  const [bundlingPcs, setBundlingPcs] = useState<number>(0);
  const [bundlingPackages, setBundlingPackages] = useState<number>(0);

  // FORM STATES: Live specific
  const [liveChannel, setLiveChannel] = useState<SalesChannel>('tiktok_live');
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [coinUsed, setCoinUsed] = useState<number>(50000);
  const [adsUsed, setAdsUsed] = useState<number>(100000);

  // FORM STATES: Non-Live specific
  const [nonLiveChannel, setNonLiveChannel] = useState<SalesChannel>('shopee_reguler');
  const [selectedCashierAdminIds, setSelectedCashierAdminIds] = useState<string[]>([]);
  const [nonLiveAdsUsed, setNonLiveAdsUsed] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');

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
    const admins = empList.filter(e => e.roles.includes('admin_toko') || e.roles.includes('owner'));
    if (admins.length > 0 && selectedAdminIds.length === 0) {
      setSelectedAdminIds([admins[0].id]);
      setSelectedCashierAdminIds([admins[0].id]);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const toggleHost = (hostId: string) => {
    if (selectedHostIds.includes(hostId)) {
      if (selectedHostIds.length === 1) return; // minimal 1 host
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

  const toggleCashierAdmin = (adminId: string) => {
    if (selectedCashierAdminIds.includes(adminId)) {
      setSelectedCashierAdminIds(selectedCashierAdminIds.filter(id => id !== adminId));
    } else {
      setSelectedCashierAdminIds([...selectedCashierAdminIds, adminId]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayString());
    setCategory('pakaian_jadi');
    setOmzet(3500000);
    setPcsSold(50);
    setPackagesSold(35);
    setSaleFormat('bundling');
    setSatuanPcs(0);
    setSatuanPackages(0);
    setBundlingPcs(0);
    setBundlingPackages(0);
    setHoursWorked(4);
    setCoinUsed(50000);
    setAdsUsed(100000);
    setNonLiveAdsUsed(0);
    setNotes('');
    setPaymentMethod('transfer');
    setLiveChannel('tiktok_live');
    setNonLiveChannel('shopee_reguler');

    const admins = employees.filter(e => e.roles.includes('admin_toko'));
    setSelectedAdminIds(admins.length > 0 ? [admins[0].id] : []);
    setSelectedCashierAdminIds(admins.length > 0 ? [admins[0].id] : []);
    setErrorMessage('');
  };

  const handleStartEdit = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !currentUser.isOwner) {
      onNotify('Hanya Owner Toko yang dapat mengedit data penjualan tanggal lampau!', 'error');
      return;
    }

    setEditingId(sale.id);
    setDate(sale.date);
    setCategory((sale.category as FashionCategory) || 'pakaian_jadi');
    setOmzet(sale.omzet || 0);
    setPcsSold(sale.pcsSold || 0);
    setPackagesSold(sale.packagesSold || 0);
    setSaleFormat(sale.saleFormat || 'bundling');
    setSatuanPcs(sale.satuanPcs || 0);
    setSatuanPackages(sale.satuanPackages || 0);
    setBundlingPcs(sale.bundlingPcs || 0);
    setBundlingPackages(sale.bundlingPackages || 0);
    setNotes(sale.notes || '');

    const isNonLive = sale.salesType === 'non_live';

    if (isNonLive) {
      setNonLiveChannel((sale.salesChannel as SalesChannel) || 'shopee_reguler');
      setSelectedCashierAdminIds(sale.adminIds || (sale.adminId ? [sale.adminId] : []));
      setNonLiveAdsUsed(sale.adsUsed || 0);
      setPaymentMethod((sale.paymentMethod as PaymentMethod) || 'transfer');
      setSubTab('input_non_live');
    } else {
      setLiveChannel((sale.salesChannel as SalesChannel) || 'tiktok_live');
      setSelectedHostIds(sale.hostIds || []);
      setSelectedAdminIds(sale.adminIds || (sale.adminId ? [sale.adminId] : []));
      setHoursWorked(sale.hoursWorked || 4);
      setCoinUsed(sale.coinUsed || 0);
      setAdsUsed(sale.adsUsed || 0);
      setSubTab('input_live');
    }

    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setSubTab('rekap');
  };

  const handleSubmitLive = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedHostIds.length === 0) {
      setErrorMessage('Pilih minimal 1 Host Live yang bertugas!');
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
      setErrorMessage(`Sisa saldo iklan tidak mencukupi! Sisa: ${formatRupiah(availableAds)}, diinput: ${formatRupiah(adsUsed)}`);
      return;
    }

    if (coinUsed > availableCoins) {
      setErrorMessage(`Sisa saldo koin tidak mencukupi! Sisa: ${formatRupiah(availableCoins)}, diinput: ${formatRupiah(coinUsed)}`);
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

    const channelMeta = salesChannelLabels[liveChannel] || { label: 'Marketplace Live' };

    const finalSatuanPcs = saleFormat === 'satuan' ? pcsSold : (saleFormat === 'bundling' ? 0 : satuanPcs);
    const finalSatuanPkgs = saleFormat === 'satuan' ? packagesSold : (saleFormat === 'bundling' ? 0 : satuanPackages);
    const finalSatuanOmzet = saleFormat === 'satuan' ? omzet : (saleFormat === 'bundling' ? 0 : Math.round((satuanPackages / Math.max(1, packagesSold)) * omzet));

    const finalBundlingPcs = saleFormat === 'bundling' ? pcsSold : (saleFormat === 'satuan' ? 0 : bundlingPcs);
    const finalBundlingPkgs = saleFormat === 'bundling' ? packagesSold : (saleFormat === 'satuan' ? 0 : bundlingPackages);
    const finalBundlingOmzet = saleFormat === 'bundling' ? omzet : (saleFormat === 'satuan' ? 0 : Math.max(0, omzet - finalSatuanOmzet));

    const record: SalesRecord = {
      id: editingId || 'sale-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      salesType: 'live',
      salesChannel: liveChannel,
      channelName: channelMeta.label,
      category,
      saleFormat,
      satuanPcs: finalSatuanPcs,
      satuanPackages: finalSatuanPkgs,
      satuanOmzet: finalSatuanOmzet,
      bundlingPcs: finalBundlingPcs,
      bundlingPackages: finalBundlingPkgs,
      bundlingOmzet: finalBundlingOmzet,
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
      notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      StorageService.updateSale(record);
      onNotify('Data penjualan Live berhasil diperbarui!', 'success');
    } else {
      StorageService.addSale(record);
      onNotify('Data penjualan sesi Live berhasil disimpan!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('rekap');
  };

  const handleSubmitNonLive = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (omzet <= 0) {
      setErrorMessage('Nominal omzet penjualan harus lebih dari Rp 0!');
      return;
    }

    const adminNames = selectedCashierAdminIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? emp.name : 'Admin / Kasir';
    });

    const channelMeta = salesChannelLabels[nonLiveChannel] || { label: 'Non-Live Marketplace' };

    const record: SalesRecord = {
      id: editingId || 'sale-nonlive-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      salesType: 'non_live',
      salesChannel: nonLiveChannel,
      channelName: channelMeta.label,
      category,
      adminIds: selectedCashierAdminIds,
      adminNames,
      adminId: selectedCashierAdminIds[0] || '',
      adminName: adminNames[0] || '',
      omzet,
      pcsSold,
      packagesSold,
      adsUsed: nonLiveAdsUsed,
      coinUsed: 0,
      paymentMethod,
      notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      StorageService.updateSale(record);
      onNotify('Data penjualan Non-Live berhasil diperbarui!', 'success');
    } else {
      StorageService.addSale(record);
      onNotify('Data penjualan Non-Live berhasil dicatat!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('rekap');
  };

  const handleDelete = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !currentUser.isOwner) {
      onNotify('Hanya Owner Toko yang dapat menghapus data penjualan tanggal lampau!', 'error');
      return;
    }
    if (confirm(`Hapus data penjualan ${sale.channelName || 'ini'} tanggal ${formatDateIndo(sale.date)}?`)) {
      StorageService.deleteSale(sale.id);
      loadData();
      onNotify('Data penjualan berhasil dihapus.', 'info');
      if (editingId === sale.id) {
        handleCancelEdit();
      }
    }
  };

  // Filtered & Sorted Sales Data
  const filteredSales = useMemo(() => {
    return salesList
      .filter(s => {
        // Type filter (Live vs Non-Live)
        if (typeFilter === 'live' && s.salesType === 'non_live') return false;
        if (typeFilter === 'non_live' && (s.salesType === 'live' || !s.salesType)) return false;

        // Channel filter
        if (channelFilter !== 'all' && s.salesChannel !== channelFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

        // Period filter
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
  }, [salesList, typeFilter, channelFilter, categoryFilter, periodFilter, startDate, endDate, todayStr]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalOmzet = filteredSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalPcs = filteredSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
    const totalPackages = filteredSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
    const totalAds = filteredSales.reduce((acc, s) => acc + (s.adsUsed || 0), 0);
    const totalCoin = filteredSales.reduce((acc, s) => acc + (s.coinUsed || 0), 0);

    const liveSales = filteredSales.filter(s => s.salesType === 'live' || !s.salesType);
    const nonLiveSales = filteredSales.filter(s => s.salesType === 'non_live');

    const liveOmzet = liveSales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const nonLiveOmzet = nonLiveSales.reduce((acc, s) => acc + (s.omzet || 0), 0);

    const avgBasketSize = totalPackages > 0 ? Math.round(totalOmzet / totalPackages) : 0;
    const avgPcsPerOrder = totalPackages > 0 ? (totalPcs / totalPackages).toFixed(1) : '0';

    return {
      totalOmzet,
      totalPcs,
      totalPackages,
      totalAds,
      totalCoin,
      liveCount: liveSales.length,
      liveOmzet,
      nonLiveCount: nonLiveSales.length,
      nonLiveOmzet,
      avgBasketSize,
      avgPcsPerOrder,
      totalTransactions: filteredSales.length,
    };
  }, [filteredSales]);

  // Export CSV Handler
  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      onNotify('Tidak ada data penjualan untuk diekspor!', 'error');
      return;
    }

    const headers = [
      'ID',
      'Tanggal',
      'Tipe',
      'Channel',
      'Kategori Fashion',
      'Omzet (Rp)',
      'Pcs Terjual',
      'Paket Terjual',
      'Host Live',
      'Admin / Kasir',
      'Iklan (Rp)',
      'Koin Live (Rp)',
      'Metode Bayar',
      'Catatan',
      'Dicatat Oleh',
    ];

    const rows = filteredSales.map(s => [
      `"${s.id}"`,
      `"${s.date}"`,
      `"${s.salesType === 'non_live' ? 'Non-Live' : 'Live'}"`,
      `"${s.channelName || s.salesChannel || '-'}"`,
      `"${fashionCategoryLabels[s.category as FashionCategory] || s.category || '-'}"`,
      s.omzet || 0,
      s.pcsSold || 0,
      s.packagesSold || 0,
      `"${(s.hostNames || []).join(', ') || '-'}"`,
      `"${(s.adminNames || [s.adminName || '']).filter(Boolean).join(', ') || '-'}"`,
      s.adsUsed || 0,
      s.coinUsed || 0,
      `"${paymentMethodLabels[s.paymentMethod as PaymentMethod] || s.paymentMethod || '-'}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
      `"${s.recordedBy || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Penjualan_${currentUser.storeName.replace(/\s+/g, '_')}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify('File CSV Rekap Penjualan berhasil diunduh!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const hostEmployees = employees.filter(e => e.roles.includes('host') || e.roles.includes('owner'));
  const adminEmployees = employees.filter(e => e.roles.includes('admin_toko') || e.roles.includes('owner'));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
        <button
          id="btn-back-dashboard-penjualan"
          onClick={onBackToDashboard}
          className="p-2.5 rounded-2xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-2 text-xs font-bold"
          title="Kembali ke Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161823] border border-white/10 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              if (editingId) handleCancelEdit();
              setSubTab('rekap');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'rekap'
                ? 'bg-gradient-to-r from-[#25F4EE] to-teal-400 text-[#0b0c10] shadow-lg shadow-[#25F4EE]/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Semua Data Penjualan</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-bold">
              {salesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (editingId && subTab !== 'input_live') resetForm();
              setSubTab('input_live');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'input_live'
                ? 'bg-gradient-to-r from-[#FE2C55] to-pink-500 text-white shadow-lg shadow-[#FE2C55]/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 text-[#FE2C55]" />
            <span>{editingId && subTab === 'input_live' ? '✏️ Edit Live' : '+ Input Live'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (editingId && subTab !== 'input_non_live') resetForm();
              setSubTab('input_non_live');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'input_non_live'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0b0c10] shadow-lg shadow-emerald-400/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>{editingId && subTab === 'input_non_live' ? '✏️ Edit Non-Live' : '+ Non-Live / Offline'}</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: REKAP SEMUA DATA PENJUALAN ================= */}
      {subTab === 'rekap' && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Omzet */}
            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Total Omzet Penjualan</span>
                <TrendingUp className="w-4 h-4 text-[#25F4EE]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {formatRupiah(metrics.totalOmzet)}
              </div>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-400 font-medium">
                <span className="text-[#FE2C55] font-bold">🔴 Live: {formatRupiah(metrics.liveOmzet)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">🏪 Non-Live: {formatRupiah(metrics.nonLiveOmzet)}</span>
              </div>
            </div>

            {/* Total Pcs Terjual */}
            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Total Pcs Barang Terjual</span>
                <PackageCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {formatNumber(metrics.totalPcs)} <span className="text-xs font-semibold text-zinc-400">pcs</span>
              </div>
              <div className="text-[10px] text-zinc-400 pt-1">
                Dari total <strong className="text-zinc-200">{formatNumber(metrics.totalPackages)}</strong> paket / order
              </div>
            </div>

            {/* Rata-Rata Order */}
            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Rata-Rata per Order (AOV)</span>
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300">
                {formatRupiah(metrics.avgBasketSize)}
              </div>
              <div className="text-[10px] text-zinc-400 pt-1">
                Rata-rata volume: <strong className="text-zinc-200">{metrics.avgPcsPerOrder} pcs/paket</strong>
              </div>
            </div>

            {/* Biaya Iklan & Koin */}
            <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Biaya Iklan &amp; Koin/Diskon</span>
                <Megaphone className="w-4 h-4 text-[#FE2C55]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#FE2C55]">
                {formatRupiah(metrics.totalAds + metrics.totalCoin)}
              </div>
              <div className="text-[10px] text-zinc-400 pt-1">
                Ads: {formatRupiah(metrics.totalAds)} • Koin: {formatRupiah(metrics.totalCoin)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#25F4EE]" />
                <span className="text-xs font-black text-white">Filter Data Penjualan</span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
                title="Cetak Laporan Penjualan"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Print</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
              {/* Periode */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Periode Waktu
                </label>
                <select
                  value={periodFilter}
                  onChange={e => setPeriodFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium focus:outline-hidden focus:border-[#25F4EE]"
                >
                  <option value="all">Semua Waktu</option>
                  <option value="today">Hari Ini</option>
                  <option value="weekly">7 Hari Terakhir</option>
                  <option value="monthly">Bulan Ini</option>
                  <option value="range">Rentang Tanggal</option>
                </select>
              </div>

              {/* Tipe Penjualan */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Tipe Penjualan
                </label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium focus:outline-hidden focus:border-[#25F4EE]"
                >
                  <option value="all">Semua Tipe (Live &amp; Non-Live)</option>
                  <option value="live">🔴 Live Streaming Saja</option>
                  <option value="non_live">🏪 Non-Live / Marketplace / Offline</option>
                </select>
              </div>

              {/* Channel */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Channel Penjualan
                </label>
                <select
                  value={channelFilter}
                  onChange={e => setChannelFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium focus:outline-hidden focus:border-[#25F4EE]"
                >
                  <option value="all">Semua Channel</option>
                  {Object.entries(salesChannelLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Fashion */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Kategori Fashion
                </label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium focus:outline-hidden focus:border-[#25F4EE]"
                >
                  <option value="all">Semua Kategori Fashion</option>
                  {Object.entries(fashionCategoryLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range picker if selected */}
              {periodFilter === 'range' && (
                <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center gap-1.5">
                  <div className="flex-1">
                    <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-0.5">Dari</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#0b0c10] border border-white/10 text-[11px] text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] text-zinc-400 font-bold uppercase mb-0.5">Sampai</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#0b0c10] border border-white/10 text-[11px] text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table / List View */}
          <div className="rounded-3xl bg-[#161823] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#25F4EE]" />
                <span>Daftar Transaksi Penjualan ({filteredSales.length})</span>
              </h3>
              <div className="text-xs text-zinc-400">
                Menampilkan data terurut dari tanggal terbaru
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-zinc-300">
                  Tidak Ada Data Penjualan Ditemukan
                </div>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Silakan ubah filter pencarian atau input data penjualan baru via tab Live / Non-Live di atas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#0b0c10] text-[11px] uppercase tracking-wider text-zinc-400 font-bold border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">Tanggal &amp; Channel</th>
                      <th className="px-4 py-3.5">Tipe &amp; Kategori</th>
                      <th className="px-4 py-3.5">Host / Admin</th>
                      <th className="px-4 py-3.5 text-right">Pcs / Paket</th>
                      <th className="px-4 py-3.5 text-right">Biaya Iklan/Koin</th>
                      <th className="px-4 py-3.5 text-right">Omzet Total</th>
                      <th className="px-4 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSales.map(sale => {
                      const isLive = sale.salesType === 'live' || !sale.salesType;
                      const channelInfo = salesChannelLabels[sale.salesChannel as SalesChannel] || {
                        label: sale.channelName || (isLive ? 'Marketplace Live' : 'Marketplace Reguler'),
                        color: isLive ? 'from-[#FE2C55] to-[#25F4EE]' : 'from-blue-500 to-indigo-600',
                      };

                      return (
                        <tr key={sale.id} className="hover:bg-white/5 transition">
                          {/* Tanggal & Channel */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white leading-tight">
                              {formatDateIndo(sale.date)}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-zinc-200 border border-white/10">
                                {channelInfo.label}
                              </span>
                              {sale.notes && (
                                <span className="text-[10px] text-zinc-400 truncate max-w-[120px]" title={sale.notes}>
                                  📝 {sale.notes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Tipe & Kategori */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FE2C55]/15 text-[#FE2C55] border border-[#FE2C55]/30">
                                  <Video className="w-3 h-3" />
                                  <span>LIVE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <Store className="w-3 h-3" />
                                  <span>NON-LIVE</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                              {fashionCategoryLabels[sale.category as FashionCategory] || sale.category || 'Fashion Umum'}
                            </div>
                          </td>

                          {/* Host / Admin */}
                          <td className="px-4 py-3.5">
                            {isLive ? (
                              <div>
                                <div className="font-semibold text-zinc-200">
                                  🎤 {(sale.hostNames || []).join(', ') || 'Host Live'}
                                </div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                  📦 Admin: {(sale.adminNames || [sale.adminName || '']).filter(Boolean).join(', ') || '-'}
                                  {sale.hoursWorked ? ` (${sale.hoursWorked} jam)` : ''}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-zinc-200">
                                  💼 {(sale.adminNames || [sale.adminName || '']).filter(Boolean).join(', ') || 'Kasir / Admin'}
                                </div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                  💳 Bayar: {paymentMethodLabels[sale.paymentMethod as PaymentMethod] || sale.paymentMethod || 'Transfer'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Pcs / Paket */}
                          <td className="px-4 py-3.5 text-right font-semibold">
                            <div className="text-white font-black">
                              {formatNumber(sale.pcsSold)} <span className="text-[10px] text-zinc-400">pcs</span>
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {formatNumber(sale.packagesSold)} paket
                            </div>
                          </td>

                          {/* Biaya Iklan / Koin */}
                          <td className="px-4 py-3.5 text-right">
                            {(sale.adsUsed || 0) > 0 || (sale.coinUsed || 0) > 0 ? (
                              <div>
                                <div className="text-zinc-300 font-bold">
                                  Rp {formatNumber((sale.adsUsed || 0) + (sale.coinUsed || 0))}
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                  Ads: {formatNumber(sale.adsUsed || 0)} {sale.coinUsed ? `• Koin: ${formatNumber(sale.coinUsed)}` : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>

                          {/* Omzet Total */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="text-sm font-black text-[#25F4EE]">
                              {formatRupiah(sale.omzet)}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Detail Modal */}
                              <button
                                type="button"
                                onClick={() => setViewingDetailSale(sale)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                                title="Lihat Detail Transaksi"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(sale)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-[#25F4EE]/20 text-zinc-300 hover:text-[#25F4EE] transition cursor-pointer"
                                title="Edit Data Penjualan"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              {(sale.date === todayStr || currentUser.isOwner) && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(sale)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-zinc-400 hover:text-[#FE2C55] transition cursor-pointer"
                                  title="Hapus Data Penjualan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: INPUT PENJUALAN LIVE ================= */}
      {subTab === 'input_live' && (
        <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-[#FE2C55]" />
              <span>{editingId ? 'Edit Data Sesi Live Streaming' : 'Input Penjualan Live Marketplace'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-xl bg-white/5 border border-white/10 transition cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLive} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Tanggal Live <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  disabled={!currentUser.isOwner && editingId !== null && date !== todayStr}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-[#25F4EE] font-medium disabled:opacity-50"
                  required
                />
              </div>

              {/* Channel Live */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Platform Live Streaming <span className="text-[#FE2C55]">*</span>
                </label>
                <select
                  value={liveChannel}
                  onChange={e => setLiveChannel(e.target.value as SalesChannel)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-[#25F4EE] font-medium"
                >
                  <option value="tiktok_live">TikTok Live</option>
                  <option value="shopee_live">Shopee Live</option>
                  <option value="tokopedia_live">Tokopedia Live</option>
                  <option value="instagram_live">Instagram Live</option>
                </select>
              </div>

              {/* Kategori Fashion */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Kategori Produk Fashion yang Dijual
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as FashionCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-[#25F4EE] font-medium"
                >
                  {Object.entries(fashionCategoryLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pemilihan Host Live (Bisa Multi Host) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Pilih Host Live yang Bertugas <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {hostEmployees.map(emp => {
                  const isSelected = selectedHostIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleHost(emp.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FE2C55]/15 border-[#FE2C55] text-white shadow-lg shadow-[#FE2C55]/10'
                          : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{emp.name}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Host Live</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FE2C55] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pemilihan Admin Toko Pendamping */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Pilih Admin Catat &amp; Packing (Opsional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {adminEmployees.map(emp => {
                  const isSelected = selectedAdminIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleAdmin(emp.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#25F4EE]/15 border-[#25F4EE] text-white shadow-lg shadow-[#25F4EE]/10'
                          : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{emp.name}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Admin Toko</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#25F4EE] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opsi Jual Satuan atau Bundling (Penentu Perhitungan Insentif) */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#0b0c10] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block text-xs font-black text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#25F4EE]" />
                  <span>Format Penjualan Live (Opsi Satuan / Bundling)</span>
                  <span className="text-[#FE2C55]">*</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Insentif Host Live dihitung otomatis berdasarkan opsi yang dipilih
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Opsi Bundling */}
                <button
                  type="button"
                  onClick={() => setSaleFormat('bundling')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    saleFormat === 'bundling'
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : 'bg-[#161823] border-white/10 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      📦 Jual Bundling (Paket)
                    </span>
                    {saleFormat === 'bundling' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Sesi live menjual paket bundling. Insentif host dihitung per paket dan tarif berjenjang bundling.
                  </p>
                </button>

                {/* Opsi Satuan */}
                <button
                  type="button"
                  onClick={() => setSaleFormat('satuan')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    saleFormat === 'satuan'
                      ? 'bg-[#25F4EE]/15 border-[#25F4EE] text-white shadow-lg shadow-[#25F4EE]/10 ring-1 ring-[#25F4EE]'
                      : 'bg-[#161823] border-white/10 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-[#25F4EE] flex items-center gap-1.5">
                      🏷️ Jual Satuan (Pcs)
                    </span>
                    {saleFormat === 'satuan' && <CheckCircle2 className="w-4 h-4 text-[#25F4EE] shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Sesi live menjual produk eceran/satuan. Insentif host dihitung per pcs dan tarif berjenjang satuan.
                  </p>
                </button>

                {/* Opsi Campuran */}
                <button
                  type="button"
                  onClick={() => setSaleFormat('campuran')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    saleFormat === 'campuran'
                      ? 'bg-purple-500/15 border-purple-400 text-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-400'
                      : 'bg-[#161823] border-white/10 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                      🔀 Campuran Satuan &amp; Bundling
                    </span>
                    {saleFormat === 'campuran' && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Sesi live menjual kombinasi produk satuan dan paket bundling sekaligus.
                  </p>
                </button>
              </div>

              {/* Rincian Porsi jika Campuran */}
              {saleFormat === 'campuran' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-[#25F4EE]/20 space-y-2">
                    <span className="text-xs font-bold text-[#25F4EE]">🏷️ Porsi Jual Satuan</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Pcs Satuan</label>
                        <CommaNumberInput
                          value={satuanPcs}
                          onChange={setSatuanPcs}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Paket/Order Satuan</label>
                        <CommaNumberInput
                          value={satuanPackages}
                          onChange={setSatuanPackages}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
                    <span className="text-xs font-bold text-amber-300">📦 Porsi Jual Bundling</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Pcs Bundling</label>
                        <CommaNumberInput
                          value={bundlingPcs}
                          onChange={setBundlingPcs}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Paket Bundling</label>
                        <CommaNumberInput
                          value={bundlingPackages}
                          onChange={setBundlingPackages}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {/* Omzet */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Total Omzet Live (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={omzet}
                  onChange={setOmzet}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-black text-[#25F4EE] focus:outline-hidden focus:border-[#25F4EE]"
                  placeholder="0"
                />
              </div>

              {/* Pcs Terjual */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Jumlah Pcs Terjual <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={pcsSold}
                  onChange={setPcsSold}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-[#25F4EE]"
                  placeholder="0"
                />
              </div>

              {/* Paket Terjual */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Jumlah Paket Terjual <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={packagesSold}
                  onChange={setPackagesSold}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-[#25F4EE]"
                  placeholder="0"
                />
              </div>

              {/* Durasi Jam Live */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Durasi Live (Jam)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hoursWorked}
                  onChange={e => setHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-[#25F4EE]"
                />
              </div>

              {/* Saldo Iklan Terpakai */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Biaya Iklan Live (Rp)
                </label>
                <CommaNumberInput
                  value={adsUsed}
                  onChange={setAdsUsed}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-[#25F4EE]"
                  placeholder="0"
                />
                <div className="text-[10px] text-zinc-500 mt-1">
                  Sisa saldo ads: {formatRupiah(adsCoinInfo.remainingAds)}
                </div>
              </div>

              {/* Saldo Koin Terpakai */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Biaya Koin Live (Rp)
                </label>
                <CommaNumberInput
                  value={coinUsed}
                  onChange={setCoinUsed}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-[#25F4EE]"
                  placeholder="0"
                />
                <div className="text-[10px] text-zinc-500 mt-1">
                  Sisa saldo koin: {formatRupiah(adsCoinInfo.remainingCoin)}
                </div>
              </div>
            </div>

            {/* Catatan Sesi */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Catatan Sesi Live (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Misal: Tema Flash Sale Baju Rajut, Launching Koleksi Baru, dll."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#25F4EE]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FE2C55] to-pink-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-[#FE2C55]/25 hover:opacity-95 active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingId ? 'Simpan Perubahan Live' : 'Simpan Penjualan Live'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: INPUT PENJUALAN NON-LIVE (MARKETPLACE REGULER / OFFLINE) ================= */}
      {subTab === 'input_non_live' && (
        <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-400" />
              <span>{editingId ? 'Edit Data Penjualan Non-Live' : 'Input Penjualan Non-Live (Marketplace / Offline / WA)'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-xl bg-white/5 border border-white/10 transition cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitNonLive} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Tanggal Transaksi <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  disabled={!currentUser.isOwner && editingId !== null && date !== todayStr}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-medium disabled:opacity-50"
                  required
                />
              </div>

              {/* Channel Non-Live */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Channel Penjualan <span className="text-[#FE2C55]">*</span>
                </label>
                <select
                  value={nonLiveChannel}
                  onChange={e => setNonLiveChannel(e.target.value as SalesChannel)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-medium"
                >
                  <option value="shopee_reguler">Shopee Marketplace Reguler</option>
                  <option value="tiktok_shop_reguler">TikTok Shop Reguler</option>
                  <option value="tokopedia_reguler">Tokopedia Reguler</option>
                  <option value="offline_store">Toko Offline / Butik Fashion</option>
                  <option value="whatsapp_order">WhatsApp / Chat Order</option>
                  <option value="dm_instagram">DM Instagram / Sosmed</option>
                  <option value="website">Website / Olshop</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              {/* Kategori Fashion */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Kategori Produk Fashion
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as FashionCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-medium"
                >
                  {Object.entries(fashionCategoryLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-medium"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS / E-Wallet</option>
                  <option value="cash">Tunai / Cash Toko</option>
                  <option value="cod">COD (Bayar di Tempat)</option>
                  <option value="marketplace_balance">Saldo Rekening Marketplace</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Admin / Kasir yang Memproses */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Pilih Admin Toko / Kasir yang Memproses
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {adminEmployees.map(emp => {
                  const isSelected = selectedCashierAdminIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleCashierAdmin(emp.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{emp.name}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Admin / Kasir</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metrics Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {/* Omzet */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Total Omzet Penjualan (Rp) <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={omzet}
                  onChange={setOmzet}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-black text-emerald-400 focus:outline-hidden focus:border-emerald-400"
                  placeholder="0"
                />
              </div>

              {/* Pcs Terjual */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Jumlah Pcs Terjual <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={pcsSold}
                  onChange={setPcsSold}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-emerald-400"
                  placeholder="0"
                />
              </div>

              {/* Paket / Resi */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Jumlah Paket / Transaksi <span className="text-[#FE2C55]">*</span>
                </label>
                <CommaNumberInput
                  value={packagesSold}
                  onChange={setPackagesSold}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-emerald-400"
                  placeholder="0"
                />
              </div>

              {/* Biaya Iklan Marketplace Reguler */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Biaya Iklan / Ads Marketplace (Opsional, jika ada)
                </label>
                <CommaNumberInput
                  value={nonLiveAdsUsed}
                  onChange={setNonLiveAdsUsed}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs font-bold text-white focus:outline-hidden focus:border-emerald-400"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Catatan / No Invoice */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Catatan / Nomor Invoice / Nama Pelanggan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Misal: Pesanan Grosir Butik Bandung, No. Resi #INV-9821, dll."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0b0c10] text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-400/25 hover:opacity-95 active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingId ? 'Simpan Perubahan Non-Live' : 'Simpan Penjualan Non-Live'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DETAIL MODAL ================= */}
      {viewingDetailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161823] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Detail Transaksi Penjualan</h3>
                  <p className="text-xs text-zinc-400">{formatDateIndo(viewingDetailSale.date)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDetailSale(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#0b0c10] border border-white/10">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Tipe Penjualan</span>
                  <span className="font-bold text-white text-sm">
                    {viewingDetailSale.salesType === 'non_live' ? '🏪 Non-Live / Marketplace / Offline' : '🔴 Live Streaming'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Channel Penjualan</span>
                  <span className="font-bold text-[#25F4EE] text-sm">
                    {viewingDetailSale.channelName || viewingDetailSale.salesChannel || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Kategori Fashion</span>
                  <span className="font-bold text-zinc-200">
                    {fashionCategoryLabels[viewingDetailSale.category as FashionCategory] || viewingDetailSale.category || 'Fashion Umum'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Total Omzet</span>
                  <span className="font-black text-base text-[#25F4EE]">
                    {formatRupiah(viewingDetailSale.omzet)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Jumlah Pcs Terjual:</span>
                  <span className="font-bold text-white">{formatNumber(viewingDetailSale.pcsSold)} pcs</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Jumlah Paket / Order:</span>
                  <span className="font-bold text-white">{formatNumber(viewingDetailSale.packagesSold)} paket</span>
                </div>
                {viewingDetailSale.hostNames && viewingDetailSale.hostNames.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">Host Live Bertugas:</span>
                    <span className="font-bold text-pink-400">{viewingDetailSale.hostNames.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Admin Toko / Kasir:</span>
                  <span className="font-bold text-sky-400">
                    {(viewingDetailSale.adminNames || [viewingDetailSale.adminName || '']).filter(Boolean).join(', ') || '-'}
                  </span>
                </div>
                {(viewingDetailSale.adsUsed || 0) > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">Biaya Iklan Terpakai:</span>
                    <span className="font-bold text-[#FE2C55]">{formatRupiah(viewingDetailSale.adsUsed)}</span>
                  </div>
                )}
                {(viewingDetailSale.coinUsed || 0) > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">Biaya Koin / Diskon:</span>
                    <span className="font-bold text-amber-400">{formatRupiah(viewingDetailSale.coinUsed)}</span>
                  </div>
                )}
                {viewingDetailSale.notes && (
                  <div className="py-2">
                    <span className="text-zinc-400 block mb-1">Catatan / No. Invoice:</span>
                    <p className="text-zinc-200 bg-[#0b0c10] p-3 rounded-xl border border-white/10 font-mono">
                      {viewingDetailSale.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const s = viewingDetailSale;
                  setViewingDetailSale(null);
                  handleStartEdit(s);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Edit Transaksi Ini
              </button>
              <button
                type="button"
                onClick={() => setViewingDetailSale(null)}
                className="px-5 py-2 rounded-xl bg-[#25F4EE] text-[#0b0c10] font-black text-xs transition hover:opacity-90 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
