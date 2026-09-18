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
import { calculateHostIncentiveForSale } from '../utils/incentiveCalculator';
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
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';
import { ThemedSelect } from '../components/ThemedSelect';
import { FuturisticEmployeeCard } from '../components/FuturisticEmployeeCard';

interface PenjualanViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PenjualanViewMode = 'menu' | 'rekap' | 'input_live' | 'input_non_live';

export const PenjualanView: React.FC<PenjualanViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<PenjualanViewMode>('menu');
  const [salesList, setSalesList] = useState<SalesRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDetailSale, setViewingDetailSale] = useState<SalesRecord | null>(null);

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
  const [coinUsed, setCoinUsed] = useState<number>(0);
  const [adsUsed, setAdsUsed] = useState<number>(0);

  // FORM STATES: Non-Live specific
  const [nonLiveChannel, setNonLiveChannel] = useState<SalesChannel>('shopee_reguler');
  const [selectedCashierAdminIds, setSelectedCashierAdminIds] = useState<string[]>([]);
  const [nonLiveAdsUsed, setNonLiveAdsUsed] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');

  // FORM STATES: Size tracking (S, M, L, XL, dll.)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [sizeBreakdown, setSizeBreakdown] = useState<{ [size: string]: number }>({ S: 10, M: 15, L: 15, XL: 10 });
  const [sizeNotes, setSizeNotes] = useState<string>('');

  // FORM STEPPERS: Standardisasi Navigasi 'Selanjutnya'
  const [liveFormStep, setLiveFormStep] = useState<number>(1);
  const [nonLiveFormStep, setNonLiveFormStep] = useState<number>(1);

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

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length <= 1) return;
      setSelectedSizes(selectedSizes.filter(s => s !== size));
      const next = { ...sizeBreakdown };
      delete next[size];
      setSizeBreakdown(next);
    } else {
      setSelectedSizes([...selectedSizes, size]);
      setSizeBreakdown({ ...sizeBreakdown, [size]: 0 });
    }
  };

  const distributeSizesEvenly = () => {
    if (selectedSizes.length === 0 || pcsSold <= 0) return;
    const countPerSize = Math.floor(pcsSold / selectedSizes.length);
    const remainder = pcsSold % selectedSizes.length;
    const next: { [size: string]: number } = {};
    selectedSizes.forEach((sz, idx) => {
      next[sz] = countPerSize + (idx === 0 ? remainder : 0);
    });
    setSizeBreakdown(next);
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
    setCoinUsed(0);
    setAdsUsed(0);
    setNonLiveAdsUsed(0);
    setNotes('');
    setSelectedSizes(['S', 'M', 'L', 'XL']);
    setSizeBreakdown({ S: 10, M: 15, L: 15, XL: 10 });
    setSizeNotes('');
    setPaymentMethod('transfer');
    setLiveChannel('tiktok_live');
    setNonLiveChannel('shopee_reguler');

    const hosts = employees.filter(e => e.roles.includes('host') || e.roles.includes('owner'));
    setSelectedHostIds(hosts.length > 0 ? [hosts[0].id] : (currentUser.isOwner ? [currentUser.id] : []));

    const admins = employees.filter(e => e.roles.includes('admin_toko') || e.roles.includes('owner'));
    setSelectedAdminIds(admins.length > 0 ? [admins[0].id] : []);
    setSelectedCashierAdminIds(admins.length > 0 ? [admins[0].id] : []);
    setLiveFormStep(1);
    setNonLiveFormStep(1);
    setErrorMessage('');
  };

  const handleStartEdit = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !currentUser.isOwner) {
      onNotify('Hanya Owner Toko yang dapat mengedit data penjualan tanggal lampau!', 'error');
      return;
    }

    setLiveFormStep(1);
    setNonLiveFormStep(1);
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
    setSelectedSizes(sale.selectedSizes || ['S', 'M', 'L', 'XL']);
    setSizeBreakdown(sale.sizeBreakdown || {});
    setSizeNotes(sale.sizeNotes || '');

    const isNonLive = sale.salesType === 'non_live';

    if (isNonLive) {
      setNonLiveChannel((sale.salesChannel as SalesChannel) || 'shopee_reguler');
      setSelectedCashierAdminIds(sale.adminIds || (sale.adminId ? [sale.adminId] : []));
      setNonLiveAdsUsed(sale.adsUsed || 0);
      setPaymentMethod((sale.paymentMethod as PaymentMethod) || 'transfer');
      setViewMode('input_non_live');
    } else {
      setLiveChannel((sale.salesChannel as SalesChannel) || 'tiktok_live');
      setSelectedHostIds(sale.hostIds || []);
      setSelectedAdminIds(sale.adminIds || (sale.adminId ? [sale.adminId] : []));
      setHoursWorked(sale.hoursWorked || 4);
      setCoinUsed(sale.coinUsed || 0);
      setAdsUsed(sale.adsUsed || 0);
      setViewMode('input_live');
    }

    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setViewMode('rekap');
  };

  const liveIncentivePreview = useMemo(() => {
    if (viewMode !== 'input_live' || selectedHostIds.length === 0) return [];
    const finalSatuanPcs = saleFormat === 'satuan' ? pcsSold : (saleFormat === 'bundling' ? 0 : satuanPcs);
    const finalSatuanPkgs = saleFormat === 'satuan' ? packagesSold : (saleFormat === 'bundling' ? 0 : satuanPackages);
    const finalSatuanOmzet = saleFormat === 'satuan' ? omzet : (saleFormat === 'bundling' ? 0 : Math.round((satuanPackages / Math.max(1, packagesSold || 1)) * omzet));

    const finalBundlingPcs = saleFormat === 'bundling' ? pcsSold : (saleFormat === 'satuan' ? 0 : bundlingPcs);
    const finalBundlingPkgs = saleFormat === 'bundling' ? packagesSold : (saleFormat === 'satuan' ? 0 : bundlingPackages);
    const finalBundlingOmzet = saleFormat === 'bundling' ? omzet : (saleFormat === 'satuan' ? 0 : Math.max(0, omzet - finalSatuanOmzet));

    const tempSale: Partial<SalesRecord> = {
      saleFormat,
      pcsSold,
      packagesSold,
      omzet,
      satuanPcs: finalSatuanPcs,
      satuanPackages: finalSatuanPkgs,
      satuanOmzet: finalSatuanOmzet,
      bundlingPcs: finalBundlingPcs,
      bundlingPackages: finalBundlingPkgs,
      bundlingOmzet: finalBundlingOmzet,
      hostIds: selectedHostIds,
      hostNames: selectedHostIds.map(id => employees.find(e => e.id === id)?.name || id),
    };

    return selectedHostIds.map(id => {
      const emp = employees.find(e => e.id === id);
      if (!emp) return null;
      const res = calculateHostIncentiveForSale(tempSale, emp);
      const hostCfg = emp.incentiveConfigs?.host;
      return {
        emp,
        res,
        hostCfg,
      };
    }).filter(Boolean) as { emp: Employee; res: ReturnType<typeof calculateHostIncentiveForSale>; hostCfg: any }[];
  }, [viewMode, selectedHostIds, saleFormat, pcsSold, packagesSold, omzet, satuanPcs, satuanPackages, bundlingPcs, bundlingPackages, employees]);

  const handleNextLiveStep = () => {
    setErrorMessage('');
    if (liveFormStep === 1) {
      if (selectedHostIds.length === 0) {
        setErrorMessage('Pilih minimal 1 host live yang bertugas!');
        return;
      }
      setLiveFormStep(2);
    } else if (liveFormStep === 2) {
      if (omzet <= 0) {
        setErrorMessage('Nominal omzet penjualan live harus lebih dari Rp 0!');
        return;
      }
      setLiveFormStep(3);
    }
  };

  const handlePrevLiveStep = () => {
    setErrorMessage('');
    if (liveFormStep > 1) {
      setLiveFormStep(prev => prev - 1);
    }
  };

  const handleNextNonLiveStep = () => {
    setErrorMessage('');
    if (nonLiveFormStep === 1) {
      setNonLiveFormStep(2);
    }
  };

  const handlePrevNonLiveStep = () => {
    setErrorMessage('');
    if (nonLiveFormStep > 1) {
      setNonLiveFormStep(prev => prev - 1);
    }
  };

  const handleSubmitLive = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    let effectiveHostIds = [...selectedHostIds];
    if (effectiveHostIds.length === 0) {
      const fallbackHost = employees.find(e => e.roles.includes('host') || e.roles.includes('owner'));
      if (fallbackHost) {
        effectiveHostIds = [fallbackHost.id];
      } else if (currentUser.isOwner) {
        effectiveHostIds = [currentUser.id];
      }
    }

    if (effectiveHostIds.length === 0) {
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

    if (adsUsed > availableAds && availableAds > 0) {
      onNotify(`Catatan: Penggunaan saldo iklan (${formatRupiah(adsUsed)}) melebihi deposit (${formatRupiah(availableAds)}).`, 'info');
    }

    if (coinUsed > availableCoins && availableCoins > 0) {
      onNotify(`Catatan: Penggunaan saldo koin (${formatRupiah(coinUsed)}) melebihi deposit (${formatRupiah(availableCoins)}).`, 'info');
    }

    const hostNames = effectiveHostIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? emp.name : (currentUser.id === id ? currentUser.name : 'Host');
    });

    const effectiveAdminIds = selectedAdminIds.length > 0 ? selectedAdminIds : [currentUser.id];
    const adminNames = effectiveAdminIds.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? emp.name : (currentUser.id === id ? currentUser.name : 'Admin Toko');
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
      hostIds: effectiveHostIds,
      hostNames,
      adminIds: effectiveAdminIds,
      adminNames,
      adminId: effectiveAdminIds[0] || '',
      adminName: adminNames[0] || '',
      omzet,
      pcsSold,
      packagesSold,
      selectedSizes,
      sizeBreakdown,
      sizeNotes,
      hoursWorked,
      coinUsed,
      adsUsed,
      notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingId) {
          StorageService.updateSale(record);
          onNotify('Data penjualan Live berhasil diperbarui!', 'success');
        } else {
          StorageService.addSale(record);
          onNotify('Data penjualan sesi Live berhasil disimpan!', 'success');
        }
        loadData();
        resetForm();
        setViewMode('rekap');
      } catch (err: any) {
        console.error('Error saving live sale:', err);
        onNotify('Gagal menyimpan transaksi penjualan: ' + (err?.message || 'Terjadi gangguan penyimpanan.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Live' : 'Konfirmasi Catat Penjualan Live',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan penjualan ${channelMeta.label} tanggal ${formatDateIndo(date)}?`
        : `Apakah Anda yakin ingin menyimpan data transaksi penjualan live senilai ${formatRupiah(omzet)}?`,
      type: editingId ? 'edit' : 'create',
      confirmText: editingId ? 'Ya, Simpan Perubahan' : 'Ya, Catat Penjualan',
      onConfirm: executeSave,
    });
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
      selectedSizes,
      sizeBreakdown,
      sizeNotes,
      adsUsed: nonLiveAdsUsed,
      coinUsed: 0,
      paymentMethod,
      notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingId) {
          StorageService.updateSale(record);
          onNotify('Data penjualan Non-Live berhasil diperbarui!', 'success');
        } else {
          StorageService.addSale(record);
          onNotify('Data penjualan Non-Live berhasil dicatat!', 'success');
        }
        loadData();
        resetForm();
        setViewMode('rekap');
      } catch (err: any) {
        console.error('Error saving non-live sale:', err);
        onNotify('Gagal mencatat penjualan Non-Live: ' + (err?.message || 'Terjadi gangguan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Non-Live' : 'Konfirmasi Catat Penjualan Non-Live',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan penjualan non-live tanggal ${formatDateIndo(date)}?`
        : `Apakah Anda yakin ingin menyimpan transaksi non-live senilai ${formatRupiah(omzet)}?`,
      type: editingId ? 'edit' : 'create',
      confirmText: editingId ? 'Ya, Simpan Perubahan' : 'Ya, Catat Penjualan',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !currentUser.isOwner) {
      onNotify('Hanya Owner Toko yang dapat menghapus data penjualan tanggal lampau!', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Data Penjualan',
      message: `Apakah Anda yakin ingin menghapus data penjualan ${sale.channelName || 'ini'} tanggal ${formatDateIndo(sale.date)} senilai ${formatRupiah(sale.omzet)}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteSale(sale.id);
        loadData();
        onNotify('Data penjualan berhasil dihapus.', 'info');
        if (editingId === sale.id) {
          handleCancelEdit();
        }
      },
    });
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

  // ================= 1. MENU HUB STATE (Grid Kecil 2 Kesamping) =================
  if (viewMode === 'menu') {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Omzet</div>
            <div className="text-sm sm:text-base font-black text-white">{formatRupiah(metrics.totalOmzet)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Terjual</div>
            <div className="text-sm sm:text-base font-black text-emerald-400">{formatNumber(metrics.totalPcs)} pcs</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Order / Paket</div>
            <div className="text-sm sm:text-base font-black text-amber-300">{formatNumber(metrics.totalPackages)} paket</div>
          </div>
        </div>

        {/* Grid Kecil 2 Kesamping jika tidak cukup sisanya ke bawah */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: Input Live */}
            <div
              id="menu-card-input-live"
              onClick={() => {
                resetForm();
                setViewMode('input_live');
              }}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Input Penjualan Live"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="TikTok Live, Shopee Live, Host & Insentif"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Catat sesi streaming</span>
                <span className="text-[#FE2C55] font-bold">Buka Form</span>
              </div>
            </div>

            {/* Card 2: Input Non-Live */}
            <div
              id="menu-card-input-non-live"
              onClick={() => {
                resetForm();
                setViewMode('input_non_live');
              }}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-emerald-400/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Input Non-Live / Offline"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-400 transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Marketplace reguler, toko offline & kasir"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Catat order offline/reguler</span>
                <span className="text-emerald-400 font-bold">Buka Form</span>
              </div>
            </div>

            {/* Card 3: Rekap Data */}
            <div
              id="menu-card-rekap-sales"
              onClick={() => setViewMode('rekap')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98 col-span-2 sm:col-span-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Riwayat & Rekap Penjualan"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Tabel rekap, filter, print & ekspor CSV"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{salesList.length} Transaksi Tercatat</span>
                <span className="text-[#25F4EE] font-bold">Buka Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* Compact Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          id="btn-back-menu-penjualan"
          onClick={() => {
            if (editingId) handleCancelEdit();
            setViewMode('menu');
          }}
          className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Menu Penjualan</span>
        </button>
      </div>

      {/* ================= TAB 1: REKAP SEMUA DATA PENJUALAN ================= */}
      {viewMode === 'rekap' && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Key Metric Highlights (Compact Modern) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Total Omzet */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Total Omzet Penjualan</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#25F4EE]" />
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                {formatRupiah(metrics.totalOmzet)}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-zinc-400 font-medium truncate">
                <span className="text-[#FE2C55] font-bold">Live: {formatRupiah(metrics.liveOmzet)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Non-Live: {formatRupiah(metrics.nonLiveOmzet)}</span>
              </div>
            </div>

            {/* Total Pcs Terjual */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Pcs Terjual</span>
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                {formatNumber(metrics.totalPcs)} <span className="text-xs font-semibold text-zinc-400">pcs</span>
              </div>
              <div className="text-[10px] text-zinc-400 pt-0.5 truncate">
                Total <strong className="text-zinc-200">{formatNumber(metrics.totalPackages)}</strong> paket / order
              </div>
            </div>

            {/* Rata-Rata Order */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Rata-Rata AOV</span>
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-amber-300">
                {formatRupiah(metrics.avgBasketSize)}
              </div>
              <div className="text-[10px] text-zinc-400 pt-0.5 truncate">
                Rata-rata: <strong className="text-zinc-200">{metrics.avgPcsPerOrder} pcs/paket</strong>
              </div>
            </div>

            {/* Biaya Iklan & Koin */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                <span>Iklan &amp; Koin</span>
                <Megaphone className="w-3.5 h-3.5 text-[#FE2C55]" />
              </div>
              <div className="text-base sm:text-lg font-black text-[#FE2C55]">
                {formatRupiah(metrics.totalAds + metrics.totalCoin)}
              </div>
              <div className="text-[10px] text-zinc-400 pt-0.5 truncate">
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
                <ThemedSelect
                  value={periodFilter}
                  onChange={val => setPeriodFilter(val as any)}
                  title="Pilih Periode Waktu"
                  options={[
                    { value: 'all', label: 'Semua Waktu' },
                    { value: 'today', label: 'Hari Ini' },
                    { value: 'weekly', label: '7 Hari Terakhir' },
                    { value: 'monthly', label: 'Bulan Ini' },
                    { value: 'range', label: 'Rentang Tanggal' },
                  ]}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                />
              </div>

              {/* Tipe Penjualan */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Tipe Penjualan
                </label>
                <ThemedSelect
                  value={typeFilter}
                  onChange={val => setTypeFilter(val as any)}
                  title="Pilih Tipe Penjualan"
                  options={[
                    { value: 'all', label: 'Semua Tipe (Live & Non-Live)' },
                    { value: 'live', label: '🔴 Live Streaming Saja' },
                    { value: 'non_live', label: '🏪 Non-Live / Marketplace / Offline' },
                  ]}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Channel Penjualan
                </label>
                <ThemedSelect
                  value={channelFilter}
                  onChange={val => setChannelFilter(val)}
                  title="Pilih Channel Penjualan"
                  options={[
                    { value: 'all', label: 'Semua Channel' },
                    ...Object.entries(salesChannelLabels).map(([key, val]) => ({
                      value: key,
                      label: val.label,
                    })),
                  ]}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                />
              </div>

              {/* Kategori Fashion */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Kategori Fashion
                </label>
                <ThemedSelect
                  value={categoryFilter}
                  onChange={val => setCategoryFilter(val)}
                  title="Pilih Kategori Fashion"
                  options={[
                    { value: 'all', label: 'Semua Kategori Fashion' },
                    ...Object.entries(fashionCategoryLabels).map(([key, val]) => ({
                      value: key,
                      label: val,
                    })),
                  ]}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                />
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

          {/* Card-Based Transaction List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#25F4EE]" />
                <span>Daftar Transaksi Penjualan ({filteredSales.length})</span>
              </h3>
              <div className="text-[11px] text-zinc-400">
                Terurut dari tanggal terbaru
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-[#161823] rounded-3xl border border-white/10 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-zinc-300">
                  Tidak Ada Data Penjualan Ditemukan
                </div>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Silakan ubah filter pencarian atau input data penjualan baru via menu Live / Non-Live.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSales.map(sale => {
                  const isLive = sale.salesType === 'live' || !sale.salesType;
                  const channelInfo = salesChannelLabels[sale.salesChannel as SalesChannel] || {
                    label: sale.channelName || (isLive ? 'Marketplace Live' : 'Marketplace Reguler'),
                    color: isLive ? 'from-[#FE2C55] to-[#25F4EE]' : 'from-blue-500 to-indigo-600',
                  };
                  const categoryLabel = fashionCategoryLabels[sale.category as FashionCategory] || sale.category || 'Fashion Umum';
                  const hostsOrAdmins = isLive
                    ? (sale.hostNames && sale.hostNames.length > 0 ? sale.hostNames.join(', ') : 'Host Live')
                    : (sale.adminNames && sale.adminNames.length > 0 ? sale.adminNames.filter(Boolean).join(', ') : sale.adminName || 'Admin / Kasir');

                  return (
                    <div
                      key={sale.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition-all shadow-sm space-y-2.5"
                    >
                      {/* Top Row: Badges (Date & Channel / Type) on Left, Action Buttons on Right */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                            {formatDateIndo(sale.date)}
                          </span>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-zinc-300">
                            {channelInfo.label}
                          </span>

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

                          {isLive && sale.saleFormat && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              sale.saleFormat === 'satuan'
                                ? 'bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/30'
                                : sale.saleFormat === 'campuran'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}>
                              {sale.saleFormat === 'satuan' ? '🏷️ Satuan' : sale.saleFormat === 'campuran' ? '🔀 Campuran' : '📦 Bundling'}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewingDetailSale(sale)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(sale)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#25F4EE]/20 text-[#25F4EE] transition cursor-pointer"
                            title="Edit Data Penjualan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {(sale.date === todayStr || currentUser.isOwner) && (
                            <button
                              type="button"
                              onClick={() => handleDelete(sale)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                              title="Hapus Data Penjualan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Row: Bold Omzet on Left, Category & Details on Right */}
                      <div className="flex items-baseline justify-between gap-3">
                        <div>
                          <div className="text-base sm:text-lg font-black text-[#25F4EE] tracking-tight">
                            {formatRupiah(sale.omzet)}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium mt-0.5 flex items-center gap-2">
                            <span>
                              <strong className="text-white font-bold">{formatNumber(sale.pcsSold)}</strong> pcs
                            </span>
                            <span>•</span>
                            <span>{formatNumber(sale.packagesSold)} paket</span>
                          </div>
                        </div>

                        <div className="text-right min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {categoryLabel}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {isLive ? `🎤 ${hostsOrAdmins}` : `💼 ${hostsOrAdmins}`}
                          </div>
                        </div>
                      </div>

                      {/* Optional Info: Size Breakdown or Ads/Coin */}
                      {((sale.selectedSizes && sale.selectedSizes.length > 0) || (sale.adsUsed || 0) > 0 || (sale.coinUsed || 0) > 0) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px]">
                          {sale.selectedSizes && sale.selectedSizes.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-zinc-500">Size:</span>
                              {sale.selectedSizes.map(sz => (
                                <span key={sz} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 font-bold">
                                  {sz}{sale.sizeBreakdown?.[sz] !== undefined ? `:${sale.sizeBreakdown[sz]}` : ''}
                                </span>
                              ))}
                            </div>
                          ) : <div />}

                          {((sale.adsUsed || 0) > 0 || (sale.coinUsed || 0) > 0) && (
                            <div className="text-zinc-400">
                              Ads/Koin: <strong className="text-amber-400">Rp {formatNumber((sale.adsUsed || 0) + (sale.coinUsed || 0))}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Row: Notes */}
                      {sale.notes && (
                        <div className="pt-1.5 border-t border-white/5 text-[11px] text-zinc-400 leading-snug">
                          <span className="text-zinc-500 font-medium">Catatan: </span>
                          <span>{sale.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: INPUT PENJUALAN LIVE (WIZARD STEPPER) ================= */}
      {viewMode === 'input_live' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Header & Sub-step Info */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal / Kembali ke Rekap</span>
            </button>
            <div className="text-xs font-bold text-[#FE2C55] flex items-center gap-1.5">
              <span>{editingId ? 'Edit Data Sesi Live' : 'Input Penjualan Live'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Tahap {liveFormStep}/3</span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 bg-[#161823] p-2.5 sm:p-3 rounded-2xl border border-white/10 text-xs">
            {[
              { step: 1, label: 'Platform & Tim Host', icon: '🎤' },
              { step: 2, label: 'Hasil Penjualan Live', icon: '💰' },
              { step: 3, label: 'Ukuran & Insentif', icon: '🏷️' },
            ].map(item => {
              const isActive = liveFormStep === item.step;
              const isDone = liveFormStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    if (isDone || item.step <= liveFormStep) {
                      setLiveFormStep(item.step);
                    }
                  }}
                  title={`${item.step}. ${item.label}`}
                  className={`p-2 sm:p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#FE2C55]/15 border-[#FE2C55] text-[#FE2C55] font-black'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold cursor-pointer'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-500 font-medium cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm">{isDone ? '✓' : item.icon}</span>
                  <span className="hidden sm:inline font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-[#FE2C55]" />
                <span>
                  {liveFormStep === 1 && 'Tahap 1: Platform & Petugas Live Bertugas'}
                  {liveFormStep === 2 && 'Tahap 2: Hasil Sesi Penjualan & Biaya Live'}
                  {liveFormStep === 3 && 'Tahap 3: Rincian Ukuran Terjual & Sinkronisasi Insentif'}
                </span>
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
              {/* TAHAP 1: PLATFORM & PETUGAS */}
              {liveFormStep === 1 && (
                <div className="space-y-5">
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
                      <ThemedSelect
                        value={liveChannel}
                        onChange={val => setLiveChannel(val as SalesChannel)}
                        title="Pilih Platform Live Streaming"
                        color="magenta"
                        options={[
                          { value: 'tiktok_live', label: 'TikTok Live' },
                          { value: 'shopee_live', label: 'Shopee Live' },
                          { value: 'tokopedia_live', label: 'Tokopedia Live' },
                          { value: 'instagram_live', label: 'Instagram Live' },
                        ]}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                    </div>

                    {/* Kategori Fashion */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        Kategori Produk Fashion yang Dijual
                      </label>
                      <ThemedSelect
                        value={category}
                        onChange={val => setCategory(val as FashionCategory)}
                        title="Pilih Kategori Produk Fashion"
                        color="cyan"
                        options={Object.entries(fashionCategoryLabels).map(([key, val]) => ({
                          value: key,
                          label: val,
                        }))}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Pemilihan Host Live (Bisa Multi Host) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-300">
                        Pilih Host Live yang Bertugas <span className="text-[#FE2C55]">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedHostIds.length} Host Terpilih
                      </span>
                    </div>
                    {/* Grid Card Kecil Nama Pegawai: 2 ke samping, sisanya ke bawah */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {hostEmployees.map(emp => {
                        const isSelected = selectedHostIds.includes(emp.id);
                        return (
                          <FuturisticEmployeeCard
                            key={emp.id}
                            id={`card-host-emp-${emp.id}`}
                            name={emp.name}
                            username={emp.username}
                            roleLabel="Host Live"
                            isSelected={isSelected}
                            color="magenta"
                            variant="checkbox"
                            onClick={() => toggleHost(emp.id)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Pemilihan Admin Toko Pendamping */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-300">
                        Pilih Admin Catat &amp; Packing (Opsional)
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedAdminIds.length} Admin Terpilih
                      </span>
                    </div>
                    {/* Grid Card Kecil Nama Pegawai: 2 ke samping, sisanya ke bawah */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {adminEmployees.map(emp => {
                        const isSelected = selectedAdminIds.includes(emp.id);
                        return (
                          <FuturisticEmployeeCard
                            key={emp.id}
                            id={`card-admin-live-emp-${emp.id}`}
                            name={emp.name}
                            username={emp.username}
                            roleLabel="Admin Toko"
                            isSelected={isSelected}
                            color="cyan"
                            variant="checkbox"
                            onClick={() => toggleAdmin(emp.id)}
                          />
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
                </div>
              )}

              {/* TAHAP 2: HASIL SESI PENJUALAN & BIAYA */}
              {liveFormStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>
              )}

              {/* TAHAP 3: VARIAN UKURAN & SINKRONISASI INSENTIF */}
              {liveFormStep === 3 && (
                <div className="space-y-4">
                  {/* Varian Ukuran & Breakdown Size Terjual Live */}
                  <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="text-[#25F4EE]">🏷️</span>
                          <span>Rincian Ukuran / Size Terjual (S, M, L, XL, dll.)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Pilih varian ukuran yang laku terjual pada sesi Live ini &amp; alokasikan jumlah pcs per size
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={distributeSizesEvenly}
                          className="text-[11px] font-bold text-[#25F4EE] hover:underline bg-[#25F4EE]/10 px-2.5 py-1 rounded-lg border border-[#25F4EE]/30 cursor-pointer"
                        >
                          ⚡ Bagi Rata Sesuai {pcsSold} Pcs
                        </button>
                      </div>
                    </div>

                    {/* Size Tag Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL', 'All Size'].map(sz => {
                        const isChecked = selectedSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                              isChecked
                                ? 'bg-[#25F4EE] text-zinc-950 border-[#25F4EE] shadow-sm'
                                : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
                            }`}
                          >
                            {isChecked ? `✓ Size ${sz}` : `+ ${sz}`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Numeric breakdown per size */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {selectedSizes.map(sz => (
                        <div key={sz} className="p-2.5 rounded-xl bg-[#161823] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-[#25F4EE]">Size {sz}</span>
                            <span className="text-zinc-400">pcs</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={sizeBreakdown[sz] ?? 0}
                            onChange={e => setSizeBreakdown({
                              ...sizeBreakdown,
                              [sz]: Math.max(0, parseInt(e.target.value) || 0)
                            })}
                            className="w-full px-2.5 py-1.5 text-xs font-black text-white bg-[#0b0c10] border border-white/10 rounded-lg focus:border-[#25F4EE]"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Total allocation indicator */}
                    <div className="flex items-center justify-between text-[11px] px-1 text-zinc-400">
                      <span>
                        Total size teralokasi:{' '}
                        <strong className="text-white">
                          {Object.values(sizeBreakdown).reduce((a: number, b: number) => a + (b || 0), 0)} pcs
                        </strong>
                      </span>
                      <span>
                        Target total pcs live:{' '}
                        <strong className="text-[#25F4EE]">{pcsSold} pcs</strong>
                      </span>
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

                  {/* Live Preview Estimasi Insentif Host Sinkron dengan Setting Pegawai */}
                  {liveIncentivePreview.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#25F4EE]" />
                          <span className="text-xs font-black text-white">
                            Sinkronisasi Insentif Host Live
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
                          {saleFormat === 'satuan' ? '🏷️ Format Satuan' : saleFormat === 'bundling' ? '📦 Format Bundling' : '🔀 Format Campuran'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {liveIncentivePreview.map(({ emp, res, hostCfg }) => {
                          const hasSeparate = Boolean(hostCfg?.hasSeparateBundlingSatuan);
                          const activeRate = saleFormat === 'satuan' 
                            ? (hasSeparate ? (hostCfg?.satuanRate || hostCfg?.rate || 0) : (hostCfg?.rate || 0))
                            : (hasSeparate ? (hostCfg?.bundlingRate || hostCfg?.rate || 0) : (hostCfg?.rate || 0));

                          return (
                            <div key={emp.id} className="p-3.5 rounded-xl bg-[#161823] border border-white/10 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#25F4EE]">{emp.name}</span>
                                <span className="text-xs font-black text-emerald-400">
                                  + {formatRupiah(res.totalIncentive)}
                                </span>
                              </div>

                              <div className="text-[11px] text-zinc-300 space-y-1">
                                <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                                  <span>Tarif Profil Pegawai:</span>
                                  <span className="text-white font-bold">
                                    {saleFormat === 'satuan'
                                      ? `Satuan: Rp ${activeRate.toLocaleString('id-ID')} / ${hostCfg?.satuanIncentiveType === 'per_package_sold' ? 'paket' : 'pcs'}`
                                      : saleFormat === 'bundling'
                                      ? `Bundling: Rp ${activeRate.toLocaleString('id-ID')} / ${hostCfg?.bundlingIncentiveType === 'per_pcs_sold' ? 'pcs' : 'paket'}`
                                      : `Satuan @ Rp ${(hostCfg?.satuanRate || 0).toLocaleString('id-ID')} • Bundling @ Rp ${(hostCfg?.bundlingRate || 0).toLocaleString('id-ID')}`}
                                  </span>
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {res.desc}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25F4EE] shrink-0" />
                        <span>
                          Tarif di atas disinkronkan secara otomatis dari <b>Menu Pendaftaran Pegawai &amp; Akses</b>. Gaji dan rekap laporan akan menghitung nilai yang sama persis.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standardized Bottom Stepper Navigation Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                {liveFormStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevLiveStep}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tahap Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Reset Form
                  </button>
                )}

                {liveFormStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextLiveStep}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 active:scale-95 transition cursor-pointer"
                  >
                    <span>Lanjut: {liveFormStep === 1 ? 'Hasil & Biaya Live' : 'Ukuran & Insentif'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#FE2C55] to-pink-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-[#FE2C55]/25 hover:opacity-95 active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingId ? 'Simpan Perubahan Live' : 'Simpan Penjualan Live'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 3: INPUT PENJUALAN NON-LIVE (WIZARD STEPPER) ================= */}
      {viewMode === 'input_non_live' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Header & Sub-step Info */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal / Kembali ke Rekap</span>
            </button>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span>{editingId ? 'Edit Data Non-Live' : 'Input Penjualan Non-Live'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Tahap {nonLiveFormStep}/2</span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-2 gap-2 bg-[#161823] p-2.5 sm:p-3 rounded-2xl border border-white/10 text-xs">
            {[
              { step: 1, label: 'Channel & Petugas Kasir', icon: '🏪' },
              { step: 2, label: 'Nominal & Rincian Ukuran', icon: '🏷️' },
            ].map(item => {
              const isActive = nonLiveFormStep === item.step;
              const isDone = nonLiveFormStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    if (isDone || item.step <= nonLiveFormStep) {
                      setNonLiveFormStep(item.step);
                    }
                  }}
                  title={`${item.step}. ${item.label}`}
                  className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400 font-black'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold cursor-pointer'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-500 font-medium cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm">{isDone ? '✓' : item.icon}</span>
                  <span className="font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>
                  {nonLiveFormStep === 1 && 'Tahap 1: Saluran Penjualan & Petugas Kasir'}
                  {nonLiveFormStep === 2 && 'Tahap 2: Hasil Transaksi, Ukuran & Catatan'}
                </span>
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
              {/* TAHAP 1: CHANNEL & PETUGAS */}
              {nonLiveFormStep === 1 && (
                <div className="space-y-5">
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
                      <ThemedSelect
                        value={nonLiveChannel}
                        onChange={val => setNonLiveChannel(val as SalesChannel)}
                        title="Pilih Channel Penjualan"
                        color="emerald"
                        options={[
                          { value: 'shopee_reguler', label: 'Shopee Marketplace Reguler' },
                          { value: 'tiktok_shop_reguler', label: 'TikTok Shop Reguler' },
                          { value: 'tokopedia_reguler', label: 'Tokopedia Reguler' },
                          { value: 'offline_store', label: 'Toko Offline / Butik Fashion' },
                          { value: 'whatsapp_order', label: 'WhatsApp / Chat Order' },
                          { value: 'dm_instagram', label: 'DM Instagram / Sosmed' },
                          { value: 'website', label: 'Website / Olshop' },
                          { value: 'lainnya', label: 'Lainnya' },
                        ]}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                    </div>

                    {/* Kategori Fashion */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        Kategori Produk Fashion
                      </label>
                      <ThemedSelect
                        value={category}
                        onChange={val => setCategory(val as FashionCategory)}
                        title="Pilih Kategori Produk Fashion"
                        color="cyan"
                        options={Object.entries(fashionCategoryLabels).map(([key, val]) => ({
                          value: key,
                          label: val,
                        }))}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                    </div>

                    {/* Metode Pembayaran */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        Metode Pembayaran
                      </label>
                      <ThemedSelect
                        value={paymentMethod}
                        onChange={val => setPaymentMethod(val as PaymentMethod)}
                        title="Pilih Metode Pembayaran"
                        color="emerald"
                        options={[
                          { value: 'transfer', label: 'Transfer Bank' },
                          { value: 'qris', label: 'QRIS / E-Wallet' },
                          { value: 'cash', label: 'Tunai / Cash Toko' },
                          { value: 'cod', label: 'COD (Bayar di Tempat)' },
                          { value: 'marketplace_balance', label: 'Saldo Rekening Marketplace' },
                          { value: 'lainnya', label: 'Lainnya' },
                        ]}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Admin / Kasir yang Memproses */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-300">
                        Pilih Admin Toko / Kasir yang Memproses
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedCashierAdminIds.length} Petugas Terpilih
                      </span>
                    </div>
                    {/* Grid Card Kecil Nama Pegawai: 2 ke samping, sisanya ke bawah */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {adminEmployees.map(emp => {
                        const isSelected = selectedCashierAdminIds.includes(emp.id);
                        return (
                          <FuturisticEmployeeCard
                            key={emp.id}
                            id={`card-cashier-admin-emp-${emp.id}`}
                            name={emp.name}
                            username={emp.username}
                            roleLabel="Admin / Kasir"
                            isSelected={isSelected}
                            color="emerald"
                            variant="checkbox"
                            onClick={() => toggleCashierAdmin(emp.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAHAP 2: METRICS & UKURAN */}
              {nonLiveFormStep === 2 && (
                <div className="space-y-5">
                  {/* Metrics Form Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  {/* Varian Ukuran & Breakdown Size Terjual Non-Live */}
                  <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="text-emerald-400">🏷️</span>
                          <span>Rincian Ukuran / Size Terjual (S, M, L, XL, dll.)</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Pilih ukuran produk pesanan non-live / marketplace &amp; masukkan rincian pcs per size
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={distributeSizesEvenly}
                          className="text-[11px] font-bold text-emerald-400 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 cursor-pointer"
                        >
                          ⚡ Bagi Rata Sesuai {pcsSold} Pcs
                        </button>
                      </div>
                    </div>

                    {/* Size Tag Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL', 'All Size'].map(sz => {
                        const isChecked = selectedSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSize(sz)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                              isChecked
                                ? 'bg-emerald-400 text-zinc-950 border-emerald-400 shadow-sm'
                                : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
                            }`}
                          >
                            {isChecked ? `✓ Size ${sz}` : `+ ${sz}`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Numeric breakdown per size */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {selectedSizes.map(sz => (
                        <div key={sz} className="p-2.5 rounded-xl bg-[#161823] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-emerald-400">Size {sz}</span>
                            <span className="text-zinc-400">pcs</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={sizeBreakdown[sz] ?? 0}
                            onChange={e => setSizeBreakdown({
                              ...sizeBreakdown,
                              [sz]: Math.max(0, parseInt(e.target.value) || 0)
                            })}
                            className="w-full px-2.5 py-1.5 text-xs font-black text-white bg-[#0b0c10] border border-white/10 rounded-lg focus:border-emerald-400"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Total allocation indicator */}
                    <div className="flex items-center justify-between text-[11px] px-1 text-zinc-400">
                      <span>
                        Total size teralokasi:{' '}
                        <strong className="text-white">
                          {Object.values(sizeBreakdown).reduce((a: number, b: number) => a + (b || 0), 0)} pcs
                        </strong>
                      </span>
                      <span>
                        Target total pcs terjual:{' '}
                        <strong className="text-emerald-400">{pcsSold} pcs</strong>
                      </span>
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
                </div>
              )}

              {/* Standardized Bottom Stepper Navigation Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                {nonLiveFormStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevNonLiveStep}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tahap Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Reset Form
                  </button>
                )}

                {nonLiveFormStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNextNonLiveStep}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition cursor-pointer"
                  >
                    <span>Lanjut: Nominal &amp; Rincian Ukuran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0b0c10] text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-400/25 hover:opacity-95 active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingId ? 'Simpan Perubahan Non-Live' : 'Simpan Penjualan Non-Live'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
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
                {viewingDetailSale.selectedSizes && viewingDetailSale.selectedSizes.length > 0 && (
                  <div className="py-2.5 border-b border-white/5 space-y-2">
                    <span className="text-zinc-400 block font-medium">Distribusi Ukuran / Size Terjual:</span>
                    <div className="flex flex-wrap gap-2">
                      {viewingDetailSale.selectedSizes.map(sz => (
                        <span key={sz} className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
                          Size {sz}: {viewingDetailSale.sizeBreakdown?.[sz] ?? 0} pcs
                        </span>
                      ))}
                    </div>
                    {viewingDetailSale.sizeNotes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Catatan size: {viewingDetailSale.sizeNotes}
                      </p>
                    )}
                  </div>
                )}
                {viewingDetailSale.salesType === 'live' && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">Format Penjualan:</span>
                    <span className="font-bold text-[#25F4EE]">
                      {viewingDetailSale.saleFormat === 'satuan'
                        ? '🏷️ Jual Satuan (Pcs)'
                        : viewingDetailSale.saleFormat === 'campuran'
                        ? '🔀 Campuran Satuan & Bundling'
                        : '📦 Jual Bundling (Paket)'}
                    </span>
                  </div>
                )}
                {viewingDetailSale.hostNames && viewingDetailSale.hostNames.length > 0 && (
                  <div className="py-2 border-b border-white/5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Host Live Bertugas:</span>
                      <span className="font-bold text-pink-400">{viewingDetailSale.hostNames.join(', ')}</span>
                    </div>

                    {/* Rincian Komisi Host per Transaksi ini */}
                    <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#25F4EE]/20 space-y-1.5">
                      <div className="text-[11px] font-bold text-[#25F4EE] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Kalkulasi Insentif Host (Sinkronisasi Profil Pegawai):</span>
                      </div>
                      {viewingDetailSale.hostIds && viewingDetailSale.hostIds.length > 0 ? (
                        viewingDetailSale.hostIds.map(hId => {
                          const hostEmp = employees.find(e => e.id === hId);
                          if (!hostEmp) return null;
                          const calc = calculateHostIncentiveForSale(viewingDetailSale, hostEmp);
                          return (
                            <div key={hId} className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                              <span className="text-zinc-300 font-semibold">{hostEmp.name}:</span>
                              <span className="text-emerald-400 font-bold">{formatRupiah(calc.totalIncentive)} <span className="text-[10px] text-zinc-500 font-normal">({calc.desc})</span></span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[10px] text-zinc-400">
                          Format: {viewingDetailSale.saleFormat || 'satuan'}
                        </div>
                      )}
                    </div>
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

      {/* Pop Up Pertanyaan CRUD Penjualan */}
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
