import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
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
  ArrowRight,
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
  X,
  Calendar,
  PlusCircle
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
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'non_live'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const periodLabelMap: Record<string, string> = {
    all: 'Semua Periode',
    today: 'Hari Ini',
    weekly: '7 Hari Terakhir',
    monthly: 'Bulan Ini',
    range: 'Rentang Tanggal',
  };

  const formatScreenshotDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const yearShort = parts[0].slice(-2);
      return `${parseInt(parts[2], 10)} ${months[monthIdx]} '${yearShort}`;
    }
    return dateStr;
  };

  // Permission helper
  const isOwnerOrManager = Boolean(currentUser.isOwner || currentUser.roles?.includes('owner') || currentUser.roles?.includes('manager'));

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
  const [liveChannel, setLiveChannel] = useState<SalesChannel>('tiktok');
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [coinUsed, setCoinUsed] = useState<number>(0);
  const [adsUsed, setAdsUsed] = useState<number>(0);

  // FORM STATES: Non-Live specific
  const [nonLiveChannel, setNonLiveChannel] = useState<SalesChannel>('shopee');
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

  // Fallback lists to ensure host and admin options are never empty
  const availableHosts = useMemo(() => {
    const list = employees.filter(e => e.roles?.includes('host') || e.roles?.includes('owner'));
    if (!list.some(e => e.id === currentUser.id)) {
      list.unshift({
        id: currentUser.id || 'curr-host',
        storeId: currentUser.storeId,
        name: currentUser.name || currentUser.username || 'Host Toko (Saya)',
        username: currentUser.username || 'host',
        roles: currentUser.roles?.length ? currentUser.roles : ['host'],
        salaryType: 'hourly',
        salaryRate: 0,
        incentiveConfigs: {},
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [employees, currentUser]);

  const availableAdmins = useMemo(() => {
    const list = employees.filter(e => e.roles?.includes('admin_toko') || e.roles?.includes('owner'));
    if (!list.some(e => e.id === currentUser.id)) {
      list.unshift({
        id: currentUser.id || 'curr-admin',
        storeId: currentUser.storeId,
        name: currentUser.name || currentUser.username || 'Admin / Kasir (Saya)',
        username: currentUser.username || 'admin',
        roles: currentUser.roles?.length ? currentUser.roles : ['admin_toko'],
        salaryType: 'hourly',
        salaryRate: 0,
        incentiveConfigs: {},
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [employees, currentUser]);

  const loadData = () => {
    const list = StorageService.getSales(currentUser.storeId);
    setSalesList(list);

    const empList = StorageService.getEmployees(currentUser.storeId);
    setEmployees(empList);

    // Default select first host if available
    const hosts = empList.filter(e => e.roles?.includes('host') || e.roles?.includes('owner'));
    const defaultHostId = hosts.length > 0 ? hosts[0].id : currentUser.id;
    if (defaultHostId) {
      setSelectedHostIds(prev => prev.length === 0 ? [defaultHostId] : prev);
    }

    // Default select first admin_toko if available
    const admins = empList.filter(e => e.roles?.includes('admin_toko') || e.roles?.includes('owner'));
    const defaultAdminId = admins.length > 0 ? admins[0].id : currentUser.id;
    if (defaultAdminId) {
      setSelectedAdminIds(prev => prev.length === 0 ? [defaultAdminId] : prev);
      setSelectedCashierAdminIds(prev => prev.length === 0 ? [defaultAdminId] : prev);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = StorageService.subscribe(collection => {
      if (collection === 'sales' || collection === 'employees' || collection === 'all') {
        loadData();
      }
    });
    return () => unsubscribe();
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

    const defaultHostId = availableHosts[0]?.id || currentUser.id;
    setSelectedHostIds(defaultHostId ? [defaultHostId] : []);

    const defaultAdminId = availableAdmins[0]?.id || currentUser.id;
    setSelectedAdminIds(defaultAdminId ? [defaultAdminId] : []);
    setSelectedCashierAdminIds(defaultAdminId ? [defaultAdminId] : []);
    setLiveFormStep(1);
    setNonLiveFormStep(1);
    setErrorMessage('');
  };

  const handleStartEdit = (sale: SalesRecord) => {
    if (sale.date !== todayStr && !isOwnerOrManager) {
      onNotify('Hanya Owner atau Manager Toko yang dapat mengedit data penjualan tanggal lampau!', 'error');
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
      const normKey = StorageService.normalizeChannelKey(sale.salesChannel || sale.channelName);
      setNonLiveChannel((normKey as SalesChannel) || 'shopee');
      setSelectedCashierAdminIds(sale.adminIds || (sale.adminId ? [sale.adminId] : []));
      setNonLiveAdsUsed(sale.adsUsed || 0);
      setPaymentMethod((sale.paymentMethod as PaymentMethod) || 'transfer');
      setViewMode('input_non_live');
    } else {
      const normKey = StorageService.normalizeChannelKey(sale.salesChannel || sale.channelName);
      setLiveChannel((normKey as SalesChannel) || 'tiktok');
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
    setViewMode('menu');
  };

  useEffect(() => {
    registerSubViewBackHandler(() => {
      if (viewMode !== 'menu') {
        resetForm();
        setViewMode('menu');
        return true;
      }
      return false;
    });
    return () => registerSubViewBackHandler(null);
  }, [viewMode]);

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

    const cleanLabel = StorageService.getCleanChannelName(liveChannel);

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
      channelName: cleanLabel,
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
        ? `Apakah Anda yakin ingin menyimpan perubahan penjualan ${cleanLabel} tanggal ${formatDateIndo(date)}?`
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

    const cleanLabel = StorageService.getCleanChannelName(nonLiveChannel);

    const record: SalesRecord = {
      id: editingId || 'sale-nonlive-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      salesType: 'non_live',
      salesChannel: nonLiveChannel,
      channelName: cleanLabel,
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

  const handleDeleteAll = () => {
    if (salesList.length === 0) {
      onNotify('Tidak ada riwayat penjualan untuk dihapus.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Seluruh Riwayat Penjualan',
      message: `Apakah Anda yakin ingin menghapus permanen SEMUA (${salesList.length}) data riwayat transaksi penjualan? Sampel tidak akan dipaksakan lagi jika Anda menghapus semuanya.`,
      type: 'delete',
      confirmText: 'Ya, Hapus Semua Riwayat',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        await StorageService.deleteAllSales(currentUser.storeId);
        loadData();
        onNotify('Seluruh data riwayat penjualan berhasil dihapus.', 'info');
        if (editingId) {
          handleCancelEdit();
        }
      },
    });
  };

  // Filtered & Sorted Sales Data
  const filteredSales = useMemo(() => {
    return salesList
      .filter(s => {
        // Search query filter (Invoice / ID, notes, channel, host, admin, category, recordedBy)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNotes = (s.notes || '').toLowerCase().includes(q);
          const matchChannel = (s.channelName || s.salesChannel || '').toLowerCase().includes(q);
          const matchHosts = s.hostNames?.some(h => h.toLowerCase().includes(q));
          const matchAdmins = s.adminNames?.some(a => a.toLowerCase().includes(q));
          const matchCategory = (fashionCategoryLabels[s.category as FashionCategory] || s.category || '').toLowerCase().includes(q);
          const matchId = s.id.toLowerCase().includes(q);
          const matchRecordedBy = (s.recordedBy || '').toLowerCase().includes(q);
          if (!matchNotes && !matchChannel && !matchHosts && !matchAdmins && !matchCategory && !matchId && !matchRecordedBy) {
            return false;
          }
        }

        // Type filter (Live vs Non-Live)
        if (typeFilter === 'live' && s.salesType === 'non_live') return false;
        if (typeFilter === 'non_live' && (s.salesType === 'live' || !s.salesType)) return false;

        // Channel filter (Normalized comparison for unified channels)
        if (channelFilter !== 'all') {
          const itemKey = StorageService.normalizeChannelKey(s.salesChannel || s.channelName);
          const filterKey = StorageService.normalizeChannelKey(channelFilter);
          if (itemKey !== filterKey) return false;
        }

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
  }, [salesList, searchQuery, typeFilter, channelFilter, categoryFilter, periodFilter, startDate, endDate, todayStr]);

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

  const hostEmployees = availableHosts;
  const adminEmployees = availableAdmins;

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
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* ================= TAB 1: REKAP SEMUA DATA PENJUALAN ================= */}
      {viewMode === 'rekap' && (
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {/* =========================================================================
              TOP HEADER BAR (PERSIS SEPERTI GAMBAR)
              ========================================================================= */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode('menu');
                }}
                className="p-1.5 -ml-1 sm:p-2 sm:-ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition cursor-pointer"
                title="Kembali ke Menu Penjualan"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Rekap Penjualan</h1>
                <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5">Semua riwayat transaksi penjualan live &amp; non-live</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={exportToCSV}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
                title="Ekspor CSV"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
                title="Cetak Laporan"
              >
                <Printer className="w-4 h-4 text-sky-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode('input_live');
                }}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#050811] stroke-[2.5]" />
                <span>Input Penjualan</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              TOP SUMMARY CARDS (SELALU 3 KOLOM SESUAI GAMBAR)
              ========================================================================= */}
          <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
            <div className="grid grid-cols-3 divide-x divide-[#142239]">
              {/* 1. Total Omzet */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00e676]/10 border border-[#00e676] text-[#00e676] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                    Total Omzet
                  </span>
                </div>
                <div className="text-[#00e676] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                  {formatRupiah(metrics.totalOmzet)}
                </div>
              </div>

              {/* 2. Total Pcs Terjual */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] text-[#00f2fe] flex items-center justify-center shrink-0">
                    <PackageCheck className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                    Pcs Terjual
                  </span>
                </div>
                <div className="text-[#00f2fe] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                  {formatNumber(metrics.totalPcs)} pcs
                </div>
              </div>

              {/* 3. Total Order / Paket */}
              <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 text-[#c084fc] flex items-center justify-center shrink-0">
                    <Layers className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                  </div>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                    Total Paket
                  </span>
                </div>
                <div className="text-[#c084fc] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                  {formatNumber(metrics.totalPackages)} pkt
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                typeFilter === 'all'
                  ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                  : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
              }`}
            >
              Semua Penjualan
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('live')}
              className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                typeFilter === 'live'
                  ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                  : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
              }`}
            >
              🔴 Live Streaming
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('non_live')}
              className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                typeFilter === 'non_live'
                  ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                  : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
              }`}
            >
              🏪 Non-Live / Toko
            </button>
          </div>

          {/* Second Row: Periode Dropdown & Search Input */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Periode Picker Dropdown Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-2.5 cursor-pointer transition text-left"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00e5ff] shrink-0" />
                  <div>
                    <span className="text-[7.5px] sm:text-[8.5px] text-slate-400 font-medium block leading-none">Periode</span>
                    <span className="text-[9px] sm:text-[11px] text-white font-semibold block leading-tight mt-0.5 whitespace-nowrap">
                      {periodLabelMap[periodFilter] || 'Semua Periode'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {isPeriodDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-52 sm:w-56 rounded-2xl bg-[#0d1627] border border-[#1b2b48] shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95">
                  {[
                    { key: 'all', label: 'Semua Periode' },
                    { key: 'today', label: 'Hari Ini' },
                    { key: 'weekly', label: '7 Hari Terakhir' },
                    { key: 'monthly', label: 'Bulan Ini' },
                    { key: 'range', label: '📅 Rentang Tanggal' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setPeriodFilter(opt.key as any);
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                        periodFilter === opt.key
                          ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {periodFilter === opt.key && <CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range inputs if selected */}
            {periodFilter === 'range' && (
              <div className="flex items-center gap-1 text-[10px]">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-1.5 py-1 text-[10px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-1.5 py-1 text-[10px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
                />
              </div>
            )}

            {/* Search Box */}
            <div className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 flex-1 min-w-0 transition">
              <Search className="w-3 h-3 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi penjualan..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-[10px] sm:text-xs focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Container (LEBAR PAS KE LAYAR 100% PERSIS SEPERTI GAMBAR) */}
          <div className="bg-[#09111e]/95 border border-[#14233c] rounded-2xl overflow-hidden shadow-2xl w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-[#14233c] text-slate-300 font-semibold text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs bg-[#0a1220]">
                  <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[15%] whitespace-nowrap">Tanggal</th>
                  <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[35%] whitespace-nowrap">Channel &amp; Keterangan</th>
                  <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Pcs</th>
                  <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Paket</th>
                  <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-right w-[17%] whitespace-nowrap">Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132038]">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      Belum ada riwayat transaksi penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => {
                    const isLive = sale.salesType === 'live' || !sale.salesType;
                    const cleanName = StorageService.getCleanChannelName(sale.salesChannel || sale.channelName);
                    const channelInfo = salesChannelLabels[sale.salesChannel as SalesChannel] || {
                      label: cleanName,
                      color: isLive ? 'from-[#FE2C55] to-[#25F4EE]' : 'from-blue-500 to-indigo-600',
                    };
                    const categoryLabel = fashionCategoryLabels[sale.category as FashionCategory] || sale.category || 'Fashion';
                    const hostsOrAdmins = isLive
                      ? (sale.hostNames && sale.hostNames.length > 0 ? sale.hostNames.join(', ') : 'Host Live')
                      : (sale.adminNames && sale.adminNames.length > 0 ? sale.adminNames.filter(Boolean).join(', ') : sale.adminName || 'Admin / Kasir');

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setViewingDetailSale(sale)}
                        className="border-b border-[#132038] last:border-b-0 hover:bg-[#0e1c36] transition cursor-pointer group"
                        title="Klik untuk melihat rincian keterangan detail transaksi"
                      >
                        {/* Tanggal */}
                        <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs font-medium text-slate-300 whitespace-nowrap">
                          <span>{formatScreenshotDate(sale.date)}</span>
                        </td>

                        {/* Channel & Keterangan */}
                        <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2">
                          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
                            <div className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                              isLive 
                                ? 'bg-[#FE2C55]/20 border border-[#FE2C55]/40 text-[#FE2C55]' 
                                : 'bg-[#00f2fe]/20 border border-[#00f2fe]/40 text-[#00f2fe]'
                            }`}>
                              {isLive ? (
                                <Video className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />
                              ) : (
                                <Store className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[7px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs font-bold text-white block leading-tight truncate group-hover:text-cyan-300 transition">
                                {channelInfo.label}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                                <span className={`inline-block text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-bold px-1 py-[0.5px] rounded border ${
                                  isLive
                                    ? 'bg-[#FE2C55]/15 text-[#FE2C55] border-[#FE2C55]/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                } leading-none whitespace-nowrap`}>
                                  {isLive ? 'LIVE' : 'NON-LIVE'}
                                </span>
                                <span className="text-[5.5px] xs:text-[6px] sm:text-[7px] text-slate-400 truncate">
                                  {categoryLabel} • {hostsOrAdmins}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Pcs */}
                        <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                          <span className="text-[#00f2fe] font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                            {formatNumber(sale.pcsSold)} pcs
                          </span>
                        </td>

                        {/* Paket */}
                        <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                          <span className="text-slate-300 font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                            {formatNumber(sale.packagesSold)} pkt
                          </span>
                        </td>

                        {/* Omzet */}
                        <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-right">
                          <span className="text-[#00e676] font-black text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                            {formatRupiah(sale.omzet)}
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

      {/* ================= TAB 2: INPUT PENJUALAN LIVE (WIZARD STEPPER) ================= */}
      {viewMode === 'input_live' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">
                {liveFormStep === 1 && 'Platform & Petugas Live Bertugas'}
                {liveFormStep === 2 && 'Hasil Sesi Penjualan & Biaya Live'}
                {liveFormStep === 3 && 'Rincian Ukuran Terjual & Sinkronisasi Insentif'}
              </h3>
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
                        Platform Saluran Penjualan <span className="text-[#FE2C55]">*</span>
                      </label>
                      <ThemedSelect
                        value={liveChannel}
                        onChange={val => setLiveChannel(val as SalesChannel)}
                        title="Pilih Channel Penjualan"
                        color="magenta"
                        options={[
                          { value: 'tiktok', label: 'TikTok' },
                          { value: 'shopee', label: 'Shopee' },
                          { value: 'tokopedia', label: 'Tokopedia' },
                          { value: 'instagram', label: 'Instagram' },
                          { value: 'offline', label: 'Offline' },
                          { value: 'whatsapp', label: 'WhatsApp' },
                          { value: 'lainnya', label: 'Lainnya' },
                        ]}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                      {(() => {
                        const fee = StorageService.getFeeForChannel(currentUser.storeId, liveChannel);
                        return (
                          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Skema Biaya Channel ({fee.channelName}):</span>
                            <span className="font-bold text-amber-400">
                              Admin {fee.adminPercentage}% {fee.serviceFeePerOrder > 0 ? `• Layanan ${formatRupiah(fee.serviceFeePerOrder)}/paket` : '• Layanan Rp 0'}
                            </span>
                          </div>
                        );
                      })()}
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
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tahap Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 border border-[#FE2C55]/30 text-[#FE2C55] transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#FE2C55] stroke-[2.5]" />
                    <span>Batal</span>
                  </button>
                )}

                {liveFormStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextLiveStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 active:scale-95 transition cursor-pointer"
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
          <div className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">
                {nonLiveFormStep === 1 && 'Saluran Penjualan & Petugas Kasir'}
                {nonLiveFormStep === 2 && 'Hasil Transaksi, Ukuran & Catatan'}
              </h3>
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
                          { value: 'shopee', label: 'Shopee' },
                          { value: 'tiktok', label: 'TikTok' },
                          { value: 'tokopedia', label: 'Tokopedia' },
                          { value: 'offline', label: 'Offline' },
                          { value: 'whatsapp', label: 'WhatsApp' },
                          { value: 'instagram', label: 'Instagram' },
                          { value: 'website', label: 'Website' },
                          { value: 'lainnya', label: 'Lainnya' },
                        ]}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-xs text-white font-medium"
                      />
                      {(() => {
                        const fee = StorageService.getFeeForChannel(currentUser.storeId, nonLiveChannel);
                        return (
                          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Skema Biaya Channel ({fee.channelName}):</span>
                            <span className="font-bold text-amber-400">
                              Admin {fee.adminPercentage}% {fee.serviceFeePerOrder > 0 ? `• Layanan ${formatRupiah(fee.serviceFeePerOrder)}/paket` : '• Layanan Rp 0'}
                            </span>
                          </div>
                        );
                      })()}
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
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tahap Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 border border-[#FE2C55]/30 text-[#FE2C55] transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#FE2C55] stroke-[2.5]" />
                    <span>Batal</span>
                  </button>
                )}

                {nonLiveFormStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNextNonLiveStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 active:scale-95 transition cursor-pointer"
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

              {/* Rincian Biaya Admin Channel untuk Transaksi Ini */}
              {(() => {
                const feeInfo = StorageService.getFeeForChannel(currentUser.storeId, viewingDetailSale.salesChannel || viewingDetailSale.channelName);
                const adminCut = Math.round(((feeInfo.adminPercentage || 0) / 100) * (viewingDetailSale.omzet || 0));
                const serviceCut = (viewingDetailSale.packagesSold || 0) * (feeInfo.serviceFeePerOrder || 0);
                const totalCut = adminCut + serviceCut;
                const netOmzet = (viewingDetailSale.omzet || 0) - totalCut - (viewingDetailSale.adsUsed || 0) - (viewingDetailSale.coinUsed || 0);

                return (
                  <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Skema Biaya Channel: {feeInfo.channelName}</span>
                      <span className="text-amber-400 font-extrabold">Admin {feeInfo.adminPercentage}%</span>
                    </div>
                    <div className="space-y-1 text-xs pt-1 border-t border-white/5">
                      <div className="flex justify-between text-zinc-400">
                        <span>Potongan Admin ({feeInfo.adminPercentage}% x {formatRupiah(viewingDetailSale.omzet || 0)}):</span>
                        <strong className="text-rose-400 font-bold">- {formatRupiah(adminCut)}</strong>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Biaya Layanan ({feeInfo.serviceFeePerOrder === 0 ? 'Rp 0' : `${formatRupiah(feeInfo.serviceFeePerOrder)} x ${viewingDetailSale.packagesSold || 0} paket`}):</span>
                        <strong className="text-rose-400 font-bold">- {formatRupiah(serviceCut)}</strong>
                      </div>
                      <div className="flex justify-between text-zinc-300 font-bold pt-1 border-t border-white/5">
                        <span>Estimasi Omzet Diterima Bersih:</span>
                        <strong className="text-[#25F4EE]">{formatRupiah(netOmzet)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
