import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CashflowRecord, CashflowPillar, CurrentUser, Employee, TagihanRecord } from '../types';
import { formatRupiah, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Search,
  Upload,
  X,
  Eye,
  PlusCircle,
  Calendar,
  Layers,
  Building2,
  HandCoins,
  BookOpen,
  Briefcase,
  TrendingUp,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';
import { ThemedSelect } from '../components/ThemedSelect';
import { TagihanSection } from '../components/TagihanSection';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type CashflowMenu = 'catatan_transaksi' | 'operasional' | 'investasi' | 'pendanaan' | 'jurnal';

export const CATEGORY_LABELS: Record<string, string> = {
  // Operasional
  modal_ball: 'Modal Ball / Pembelian Stok Fashion',
  ongkir: 'Ongkos Kirim Stok / Ekspedisi',
  operasional: 'Biaya Steam & Operasional Toko',
  topup_iklan: 'Top-Up Saldo Iklan & Promosi (Marketplace/Live)',
  packing: 'Bahan Packing (Lakban, Plastik, Bubble Wrap)',
  makan_minum: 'Konsumsi / Makan & Minum Tim',
  listrik_wifi: 'Listrik, Air & Internet WiFi',
  sewa_tempat: 'Sewa Tempat / Ruko Live',
  gaji_pegawai: 'Gaji & Insentif Pegawai',
  gaji: 'Gaji Pegawai',
  penarikan_shopee: 'Penarikan Saldo Marketplace / Penjualan',
  penarikan_marketplace: 'Penarikan Saldo Marketplace',
  
  // Investasi
  investasi_aset: 'Pembelian Aset / Barang Jangka Panjang',

  // Pendanaan
  kasbon: 'Kasbon Pegawai',
  suntikan_modal: 'Suntikan Modal Tambahan (Owner / Investor)',
  dana_talang: 'Dana Talang / Suntikan Kas Talangan',
  konsumsi_pribadi: 'Konsumsi Pribadi (Prive Owner)',

  lainnya: 'Lainnya',
};

// Helper untuk menentukan pos/pillar arus kas secara otomatis & akurat
export function getCashflowPillar(record: CashflowRecord): CashflowPillar {
  if (record.pillar) return record.pillar;
  
  const cat = record.category as string;
  const desc = (record.description || '').toLowerCase();

  // Pendanaan (Kasbon, Suntikan Modal, Dana Talang, Prive)
  if (
    cat === 'dana_talang' ||
    cat === 'konsumsi_pribadi' ||
    cat === 'suntikan_modal' ||
    cat === 'kasbon' ||
    record.paymentType === 'kasbon' ||
    desc.includes('kasbon') ||
    desc.includes('suntikan') ||
    desc.includes('talang') ||
    desc.includes('prive')
  ) {
    return 'pendanaan';
  }

  // Investasi (Pembelian barang modal jangka panjang / aset)
  if (
    cat === 'investasi_aset' ||
    cat.includes('investasi') ||
    desc.includes('investasi') ||
    desc.includes('mesin') ||
    desc.includes('aset') ||
    desc.includes('renovasi') ||
    desc.includes('laptop') ||
    desc.includes('komputer') ||
    desc.includes('lighting') ||
    desc.includes('kamera') ||
    desc.includes('manekin') ||
    desc.includes('etalase')
  ) {
    return 'investasi';
  }

  // Operasional (default)
  return 'operasional';
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  // 5 Main Menu State ('hub' is overview, or directly one of the 5 menus)
  const [activeMenu, setActiveMenu] = useState<CashflowMenu | 'hub'>('hub');
  const [pendanaanSubTab, setPendanaanSubTab] = useState<'mutasi' | 'tagihan'>('mutasi');

  // Input Stepper: 1 (Jenis & Kategori), 2 (Nominal, Deskripsi & Foto Nota)
  const [inputStep, setInputStep] = useState<number>(1);
  const [cashflowList, setCashflowList] = useState<CashflowRecord[]>([]);
  const [tagihanList, setTagihanList] = useState<TagihanRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingItem, setEditingItem] = useState<CashflowRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'specific' | 'range' | 'weekly' | 'monthly'>('all');
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');
  const [jurnalPillarFilter, setJurnalPillarFilter] = useState<'all' | CashflowPillar>('all');
  const [jurnalTypeFilter, setJurnalTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');

  // Form states
  const [pillar, setPillar] = useState<CashflowPillar>('operasional');
  const [date, setDate] = useState(getTodayString());
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');
  const [amount, setAmount] = useState<number>(150000);
  const [category, setCategory] = useState<CashflowRecord['category']>('packing');
  const [description, setDescription] = useState('Beli lakban, plastik packing polymailer & bubble wrap');
  
  // Gaji Pegawai / Kasbon specific states
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'gaji_insentif' | 'kasbon'>('gaji_insentif');
  const [periodMonth, setPeriodMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const list = StorageService.getCashflow(currentUser.storeId);
    setCashflowList(list);
    const tagihans = StorageService.getTagihan(currentUser.storeId);
    setTagihanList(tagihans);
    const emps = StorageService.getEmployees(currentUser.storeId);
    setEmployees(emps);
    if (emps.length > 0 && !employeeId) {
      setEmployeeId(emps[0].id);
      setEmployeeName(emps[0].name);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const resetForm = (targetPillar?: CashflowPillar) => {
    setEditingItem(null);
    setDate(getTodayString());
    const chosenPillar = targetPillar || 'operasional';
    setPillar(chosenPillar);
    setType('outflow');
    setProofImageUrl('');
    setInputStep(1);

    if (chosenPillar === 'operasional') {
      setAmount(150000);
      setCategory('packing');
      setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    } else if (chosenPillar === 'investasi') {
      setAmount(1200000);
      setCategory('investasi_aset');
      setDescription('Pembelian mesin steamer uap / rak pakaian jangka panjang');
    } else if (chosenPillar === 'pendanaan') {
      setAmount(300000);
      setCategory('gaji_pegawai');
      setPaymentType('kasbon');
      const emp = employees[0];
      if (emp) {
        setEmployeeId(emp.id);
        setEmployeeName(emp.name);
        setDescription(`Kasbon Pegawai - ${emp.name}`);
      } else {
        setDescription('Kasbon Pegawai');
      }
    }

    const now = new Date();
    setPeriodMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleStartEdit = (item: CashflowRecord) => {
    setEditingItem(item);
    setDate(item.date);
    setType(item.type);
    setAmount(item.amount);
    const recordPillar = getCashflowPillar(item);
    setPillar(recordPillar);
    setCategory(item.category);
    setPaymentType(item.paymentType || (item.description?.toLowerCase().includes('kasbon') ? 'kasbon' : 'gaji_insentif'));
    setDescription(item.description || '');
    setEmployeeId(item.employeeId || (employees[0]?.id || ''));
    setEmployeeName(item.employeeName || (employees[0]?.name || ''));
    setPeriodMonth(item.periodMonth || getTodayString().slice(0, 7));
    setProofImageUrl(item.proofImageUrl || '');
    setInputStep(1);
    setActiveMenu('catatan_transaksi');
  };

  const handlePillarChange = (newPillar: CashflowPillar) => {
    setPillar(newPillar);
    if (newPillar === 'operasional') {
      if (type === 'outflow') {
        setCategory('packing');
        setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
      } else {
        setCategory('penarikan_shopee');
        setDescription('Penarikan Saldo Hasil Penjualan Marketplace');
      }
    } else if (newPillar === 'investasi') {
      setCategory('investasi_aset');
      if (type === 'outflow') {
        setDescription('Pembelian peralatan live / mesin steam / rak barang jangka panjang');
      } else {
        setDescription('Penjualan aset / pengembalian modal investasi barang');
      }
    } else if (newPillar === 'pendanaan') {
      if (type === 'outflow') {
        setCategory('gaji_pegawai');
        setPaymentType('kasbon');
        const emp = employees.find(e => e.id === employeeId) || employees[0];
        const empName = emp ? emp.name : 'Pegawai';
        setDescription(`Kasbon Pegawai - ${empName}`);
      } else {
        setCategory('dana_talang');
        setDescription('Suntikan Modal Kas / Dana Talang Masuk');
      }
    }
  };

  const handleTypeChange = (newType: 'inflow' | 'outflow') => {
    setType(newType);
    if (pillar === 'operasional') {
      if (newType === 'outflow') {
        setCategory('packing');
        setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
      } else {
        setCategory('penarikan_shopee');
        setDescription('Penarikan Saldo Marketplace');
      }
    } else if (pillar === 'investasi') {
      setCategory('investasi_aset');
      setDescription(newType === 'outflow' ? 'Pembelian barang investasi jangka panjang' : 'Pengembalian / penjualan aset');
    } else if (pillar === 'pendanaan') {
      if (newType === 'outflow') {
        setCategory('gaji_pegawai');
        setPaymentType('kasbon');
        setDescription(`Kasbon Pegawai - ${employeeName || 'Pegawai'}`);
      } else {
        setCategory('dana_talang');
        setDescription('Suntikan Modal Kas / Dana Talang Masuk');
      }
    }
  };

  const handleCategoryChange = (newCat: CashflowRecord['category']) => {
    setCategory(newCat);
    if (newCat === 'topup_iklan') {
      setDescription('Top-Up Saldo Iklan & Promosi Marketplace');
      setAmount(500000);
    } else if (newCat === 'gaji_pegawai') {
      const selectedEmp = employees.find(e => e.id === employeeId) || employees[0];
      if (selectedEmp) {
        setEmployeeId(selectedEmp.id);
        setEmployeeName(selectedEmp.name);
        const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
        setDescription(`${prefix} - ${selectedEmp.name} (Periode ${periodMonth})`);
      }
    } else if (newCat === 'investasi_aset') {
      setDescription('Pembelian peralatan live / mesin steam / display jangka panjang');
    } else if (newCat === 'konsumsi_pribadi') {
      setDescription('Prive / Pengeluaran konsumsi pribadi owner');
    } else if (newCat === 'suntikan_modal') {
      setDescription('Suntikan Modal Tambahan Toko');
    } else if (newCat === 'dana_talang') {
      setDescription(type === 'inflow' ? 'Dana Talang Masuk (Suntikan Kas)' : 'Pembayaran Pelunasan Dana Talang');
    } else if (newCat === 'packing') {
      setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    }
  };

  const handlePaymentTypeChange = (newType: 'gaji_insentif' | 'kasbon') => {
    setPaymentType(newType);
    if (newType === 'kasbon') {
      setPillar('pendanaan');
    }
    if (employeeName) {
      const prefix = newType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
      setDescription(`${prefix} - ${employeeName} (Periode ${periodMonth})`);
    }
  };

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setEmployeeName(emp.name);
      const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
      setDescription(`${prefix} - ${emp.name} (Periode ${periodMonth})`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onNotify('Ukuran file foto maksimal 10MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.65);
            setProofImageUrl(compressed);
            onNotify('Foto nota berhasil dikompres & siap disimpan.', 'info');
          } else {
            setProofImageUrl(dataUrl);
          }
        } catch {
          setProofImageUrl(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      onNotify('Nominal transaksi harus lebih dari Rp 0!', 'error');
      return;
    }

    // Pastikan konsistensi pos & kategori
    let finalPillar = pillar;
    let finalCategory = category;

    if (finalPillar === 'pendanaan') {
      if (category === 'gaji_pegawai' && paymentType === 'kasbon') {
        finalCategory = 'kasbon';
      }
    } else if (finalPillar === 'investasi') {
      finalCategory = 'investasi_aset';
    }

    const record: CashflowRecord = {
      id: editingItem ? editingItem.id : 'cf-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      type,
      amount,
      category: finalCategory,
      pillar: finalPillar,
      description,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
      employeeId: (finalCategory === 'gaji_pegawai' || finalCategory === 'kasbon') ? employeeId : undefined,
      employeeName: (finalCategory === 'gaji_pegawai' || finalCategory === 'kasbon') ? employeeName : undefined,
      paymentType: (finalCategory === 'gaji_pegawai' || finalCategory === 'kasbon') ? paymentType : undefined,
      periodMonth: (finalCategory === 'gaji_pegawai' || finalCategory === 'kasbon') ? periodMonth : undefined,
      proofImageUrl: proofImageUrl || undefined,
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        if (editingItem) {
          StorageService.updateCashflow(record);
          onNotify('Perubahan transaksi kas berhasil disimpan!', 'success');
        } else {
          StorageService.addCashflow(record);
          
          // Sinkronisasi otomatis ke Tagihan (Skema perputaran arus sama seperti sebelumnya)
          if ((record.category === 'kasbon' || (record.category === 'gaji_pegawai' && record.paymentType === 'kasbon')) && record.type === 'outflow') {
            StorageService.createKasbonRecord({
              storeId: currentUser.storeId,
              date: record.date,
              amount: record.amount,
              employeeId: record.employeeId || '',
              employeeName: record.employeeName || 'Pegawai',
              notes: record.description,
              proofImageUrl: record.proofImageUrl,
              recordToCashflow: false,
            });
          } else if (record.category === 'dana_talang' && record.type === 'inflow') {
            const tagihanRecord: TagihanRecord = {
              id: `tagihan-dt-${record.id}`,
              storeId: record.storeId,
              date: record.date,
              type: 'dana_talang',
              title: record.description || 'Dana Talang Operasional',
              initialAmount: record.amount,
              currentBalance: -record.amount,
              status: 'unpaid',
              notes: record.description,
              proofImageUrl: record.proofImageUrl,
              sourceRefId: record.id,
              createdAt: new Date().toISOString(),
            };
            StorageService.addTagihan(tagihanRecord);
          }

          onNotify('Transaksi kas berhasil dicatat!', 'success');
        }

        loadData();
        resetForm(finalPillar);
        // Kembali ke jurnal atau pos terkait agar pengguna bisa langsung memeriksa mutasinya
        if (editingItem) {
          setActiveMenu('jurnal');
        }
      } catch (err: any) {
        console.error('Error saving cashflow:', err);
        onNotify('Gagal menyimpan transaksi kas: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingItem ? 'Konfirmasi Simpan Perubahan Transaksi' : 'Konfirmasi Catat Transaksi Kas',
      message: editingItem
        ? `Apakah Anda yakin ingin menyimpan perubahan transaksi ${formatRupiah(amount)}?`
        : `Apakah Anda yakin ingin mencatat transaksi kas ${type === 'inflow' ? 'pemasukan' : 'pengeluaran'} (${finalPillar.toUpperCase()}) sebesar ${formatRupiah(amount)}?`,
      type: editingItem ? 'edit' : 'create',
      confirmText: editingItem ? 'Ya, Simpan Perubahan' : 'Ya, Catat Transaksi',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, desc?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Transaksi Kas',
      message: `Apakah Anda yakin ingin menghapus transaksi ${desc ? `"${desc}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Transaksi',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteCashflow(id);
        loadData();
        onNotify('Transaksi berhasil dihapus.', 'info');
        if (editingItem?.id === id) {
          resetForm();
        }
      },
    });
  };

  // Filter list umum berdasarkan periode & search query
  const filteredList = useMemo(() => {
    return cashflowList
      .filter(item => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCat = (CATEGORY_LABELS[item.category] || item.category)?.toLowerCase().includes(q);
          const matchEmp = item.employeeName?.toLowerCase().includes(q);
          const matchDateRaw = item.date?.toLowerCase().includes(q);
          const matchDateIndo = formatDateIndo(item.date).toLowerCase().includes(q);
          const matchAmount = item.amount?.toString().includes(q);
          const matchPillar = getCashflowPillar(item).toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchEmp && !matchDateRaw && !matchDateIndo && !matchAmount && !matchPillar) return false;
        }
        if (periodFilter === 'today') return item.date === getTodayString();
        if (periodFilter === 'specific') return item.date === specificDate;
        if (periodFilter === 'range') return item.date >= startDate && item.date <= endDate;
        if (periodFilter === 'weekly') {
          const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
          return item.date >= weekAgo && item.date <= getTodayString();
        }
        if (periodFilter === 'monthly') return item.date.startsWith(getTodayString().slice(0, 7));

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [cashflowList, searchQuery, periodFilter, specificDate, startDate, endDate]);

  // Pos Operasional Filtered
  const operasionalList = useMemo(() => {
    return filteredList.filter(item => getCashflowPillar(item) === 'operasional');
  }, [filteredList]);

  // Pos Investasi Filtered
  const investasiList = useMemo(() => {
    return filteredList.filter(item => getCashflowPillar(item) === 'investasi');
  }, [filteredList]);

  // Pos Pendanaan Filtered
  const pendanaanList = useMemo(() => {
    return filteredList.filter(item => getCashflowPillar(item) === 'pendanaan');
  }, [filteredList]);

  // Jurnal Filtered (mendukung filter pos & inflow/outflow)
  const jurnalList = useMemo(() => {
    return filteredList.filter(item => {
      if (jurnalPillarFilter !== 'all' && getCashflowPillar(item) !== jurnalPillarFilter) return false;
      if (jurnalTypeFilter !== 'all' && item.type !== jurnalTypeFilter) return false;
      return true;
    });
  }, [filteredList, jurnalPillarFilter, jurnalTypeFilter]);

  // Hitungan Agregat Perputaran Kas
  const totalInflow = filteredList.filter(c => c.type === 'inflow').reduce((acc, c) => acc + c.amount, 0);
  const totalOutflow = filteredList.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
  const netCash = totalInflow - totalOutflow;

  // Operasional metrics
  const opInflow = operasionalList.filter(c => c.type === 'inflow').reduce((acc, c) => acc + c.amount, 0);
  const opOutflow = operasionalList.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
  const opNet = opInflow - opOutflow;

  // Investasi metrics
  const invInflow = investasiList.filter(c => c.type === 'inflow').reduce((acc, c) => acc + c.amount, 0);
  const invOutflow = investasiList.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
  const invNet = invInflow - invOutflow;

  // Pendanaan metrics
  const fundInflow = pendanaanList.filter(c => c.type === 'inflow').reduce((acc, c) => acc + c.amount, 0);
  const fundOutflow = pendanaanList.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
  const fundNet = fundInflow - fundOutflow;

  // Tagihan metrics
  const activeKasbonTotal = tagihanList
    .filter(t => t.type === 'kasbon' && t.currentBalance > 0)
    .reduce((acc, t) => acc + t.currentBalance, 0);
  const activeTalangTotal = tagihanList
    .filter(t => t.type === 'dana_talang' && t.currentBalance < 0)
    .reduce((acc, t) => acc + Math.abs(t.currentBalance), 0);

  // Helper render badge pilar
  const renderPillarBadge = (recordPillar: CashflowPillar) => {
    switch (recordPillar) {
      case 'operasional':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
            Operasional
          </span>
        );
      case 'investasi':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Investasi Aset
          </span>
        );
      case 'pendanaan':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Pendanaan
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* ================= TOP NAVIGATION BAR (5 MENU UTAMA) ================= */}
      <div className="p-2 sm:p-2.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activeMenu !== 'hub' ? (
            <button
              type="button"
              onClick={() => setActiveMenu('hub')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span className="hidden sm:inline">Menu Utama</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#25F4EE]" />
            <span className="text-xs sm:text-sm font-black text-white">Arus Kas (Cashflow)</span>
          </div>
        </div>

        {/* 5 Tab Quick Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full no-scrollbar">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveMenu('catatan_transaksi');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeMenu === 'catatan_transaksi'
                ? 'bg-[#25F4EE] text-black shadow-md shadow-[#25F4EE]/20'
                : 'bg-[#0b0c10] text-zinc-300 hover:text-white border border-white/5'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Catatan Transaksi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('operasional')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeMenu === 'operasional'
                ? 'bg-[#25F4EE] text-black shadow-md shadow-[#25F4EE]/20'
                : 'bg-[#0b0c10] text-zinc-300 hover:text-white border border-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('investasi')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeMenu === 'investasi'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-[#0b0c10] text-zinc-300 hover:text-white border border-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Investasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('pendanaan')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeMenu === 'pendanaan'
                ? 'bg-purple-400 text-black shadow-md shadow-purple-400/20'
                : 'bg-[#0b0c10] text-zinc-300 hover:text-white border border-white/5'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Pendanaan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('jurnal')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeMenu === 'jurnal'
                ? 'bg-[#FE2C55] text-white shadow-md shadow-[#FE2C55]/20'
                : 'bg-[#0b0c10] text-zinc-300 hover:text-white border border-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Jurnal</span>
          </button>
        </div>
      </div>

      {/* Global Quick Period & Filter Bar (shown on views with lists) */}
      {activeMenu !== 'catatan_transaksi' && (
        <div className="p-3 bg-[#161823] rounded-2xl border border-white/10 shadow flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#25F4EE]" />
              Filter Periode:
            </span>
            <ThemedSelect
              value={periodFilter}
              onChange={val => setPeriodFilter(val as any)}
              title="Pilih Periode Kas"
              options={[
                { value: 'all', label: 'Semua Periode' },
                { value: 'today', label: 'Hari Ini' },
                { value: 'specific', label: '📅 Pilih Tanggal' },
                { value: 'range', label: '📅 Rentang Tanggal' },
                { value: 'weekly', label: '7 Hari Terakhir' },
                { value: 'monthly', label: 'Bulan Ini' },
              ]}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
            />

            {periodFilter === 'specific' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0b0c10] border border-[#25F4EE]/40 text-xs text-white">
                <input
                  type="date"
                  value={specificDate}
                  onChange={e => setSpecificDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {periodFilter === 'range' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-[#0b0c10] border border-[#25F4EE]/40 rounded-xl text-white text-xs font-semibold focus:outline-none cursor-pointer"
                />
                <span className="text-zinc-500 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-[#0b0c10] border border-[#25F4EE]/40 rounded-xl text-white text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(periodFilter !== 'all' || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setPeriodFilter('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] border border-white/10 text-[11px] font-bold transition cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <div className="relative min-w-[150px] sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= 0. MENU UTAMA (HUB VIEW: 5 KARTU UTAMA) ================= */}
      {activeMenu === 'hub' && (
        <div className="space-y-4">
          {/* Ringkasan Saldo Utama (Perputaran Arus Tetap Sama) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow">
              <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                <ArrowDownCircle className="w-3.5 h-3.5 text-[#25F4EE]" />
                Total Kas Masuk
              </div>
              <div className="text-base sm:text-lg font-black text-[#25F4EE] mt-0.5">
                +{formatRupiah(totalInflow)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow">
              <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                <ArrowUpCircle className="w-3.5 h-3.5 text-[#FE2C55]" />
                Total Kas Keluar
              </div>
              <div className="text-base sm:text-lg font-black text-[#FE2C55] mt-0.5">
                -{formatRupiah(totalOutflow)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow">
              <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-white" />
                Saldo Bersih (Net)
              </div>
              <div className={`text-base sm:text-lg font-black mt-0.5 ${netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                {formatRupiah(netCash)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow">
              <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                Total Tagihan Aktif
              </div>
              <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
                {formatRupiah(activeKasbonTotal + activeTalangTotal)}
              </div>
            </div>
          </div>

          {/* GRID 5 MENU UTAMA CASHFLOW */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#25F4EE]" />
              <span>5 Menu Utama Arus Kas:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Menu 1: Catatan Transaksi Kas */}
              <div
                id="menu-card-catatan-transaksi"
                onClick={() => {
                  resetForm('operasional');
                  setActiveMenu('catatan_transaksi');
                }}
                className="group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0 group-hover:scale-105 transition">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white group-hover:text-[#25F4EE] transition">
                      1. Catatan Transaksi Kas
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Hanya input saja semua ditumpuk disini (Operasional, Investasi &amp; Pendanaan).
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span className="text-zinc-500">Formulir Kas Masuk/Keluar</span>
                  <span className="text-[#25F4EE] font-bold group-hover:underline">Buka Input &rarr;</span>
                </div>
              </div>

              {/* Menu 2: Operasional */}
              <div
                id="menu-card-operasional"
                onClick={() => setActiveMenu('operasional')}
                className="group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0 group-hover:scale-105 transition">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white group-hover:text-[#25F4EE] transition">
                      2. Operasional
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Operasional sehari-hari: bahan packing, konsumsi tim, listrik, sewa ruko, gaji harian/shift, modal stok, ongkir &amp; iklan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span>{operasionalList.length} Transaksi Operasional</span>
                  <span className="text-[#25F4EE] font-bold group-hover:underline">Buka Pos &rarr;</span>
                </div>
              </div>

              {/* Menu 3: Investasi */}
              <div
                id="menu-card-investasi"
                onClick={() => setActiveMenu('investasi')}
                className="group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-amber-400/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white group-hover:text-amber-400 transition">
                      3. Investasi
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Pembelian barang jangka panjang: mesin steamer, rak baju, display manekin, lighting live, gadget admin, renovasi studio.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span>{investasiList.length} Transaksi Investasi</span>
                  <span className="text-amber-400 font-bold group-hover:underline">Buka Pos &rarr;</span>
                </div>
              </div>

              {/* Menu 4: Pendanaan */}
              <div
                id="menu-card-pendanaan"
                onClick={() => setActiveMenu('pendanaan')}
                className="group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-purple-400/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition">
                    <HandCoins className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white group-hover:text-purple-400 transition">
                      4. Pendanaan
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Kasbon &amp; suntikkan: kasbon pegawai, suntikan modal owner/investor, dana talang &amp; penarikan prive.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span>{pendanaanList.length} Mutasi &amp; Tagihan</span>
                  <span className="text-purple-400 font-bold group-hover:underline">Buka Pos &rarr;</span>
                </div>
              </div>

              {/* Menu 5: Jurnal */}
              <div
                id="menu-card-jurnal"
                onClick={() => setActiveMenu('jurnal')}
                className="group p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98 sm:col-span-2 lg:col-span-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0 group-hover:scale-105 transition">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white group-hover:text-[#FE2C55] transition">
                      5. Jurnal
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Pos keluar masuk seluruh transaksi kas terpadu (Operasional, Investasi &amp; Pendanaan) lengkap dengan bukti nota dan mutasi saldo.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span>{filteredList.length} Total Transaksi Tercatat</span>
                  <span className="text-[#FE2C55] font-bold group-hover:underline">Buka Jurnal Kas &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 1. MENU 1: CATATAN TRANSAKSI KAS (HANYA INPUT SAJA) ================= */}
      {activeMenu === 'catatan_transaksi' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => setActiveMenu('hub')}
              className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali ke 5 Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">
                {editingItem ? '✏️ Edit Transaksi Kas' : 'Catatan Transaksi Kas'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
                Tahap {inputStep} dari 2
              </span>
            </div>
          </div>

          {/* Stepper Pills */}
          <div className="grid grid-cols-2 gap-2 bg-[#161823] p-2 rounded-2xl border border-white/10 text-xs">
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
              <span>Pos &amp; Jenis Transaksi</span>
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
              <span>Nominal, Keterangan &amp; Nota</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
            {inputStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#25F4EE]" />
                    <span>Tahap 1: Tentukan Pos Kas, Jenis &amp; Tanggal</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Semua transaksi kas (Operasional, Investasi barang jangka panjang, maupun Pendanaan) diinput dan ditumpuk di sini.
                  </p>
                </div>

                {/* Pilih Pos Arus Kas: Operasional vs Investasi vs Pendanaan */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Pilih Pos Arus Kas <span className="text-[#FE2C55]">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePillarChange('operasional')}
                      className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        pillar === 'operasional'
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-[#25F4EE] shadow-md shadow-[#25F4EE]/10'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Operasional</span>
                      <span className="text-[9px] font-normal text-zinc-500">Sehari-hari</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePillarChange('investasi')}
                      className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        pillar === 'investasi'
                          ? 'bg-amber-400/10 border-amber-400 text-amber-400 shadow-md shadow-amber-400/10'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Investasi</span>
                      <span className="text-[9px] font-normal text-zinc-500">Barang Jangka Panjang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePillarChange('pendanaan')}
                      className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        pillar === 'pendanaan'
                          ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <HandCoins className="w-4 h-4" />
                      <span>Pendanaan</span>
                      <span className="text-[9px] font-normal text-zinc-500">Kasbon &amp; Suntikan</span>
                    </button>
                  </div>
                </div>

                {/* Jenis Mutasi: Kas Keluar vs Kas Masuk */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Jenis Mutasi Kas <span className="text-[#FE2C55]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('outflow')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        type === 'outflow'
                          ? 'bg-[#FE2C55]/10 border-[#FE2C55] text-[#FE2C55]'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Kas Keluar (Pengeluaran)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('inflow')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        type === 'inflow'
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-[#25F4EE]'
                          : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      <span>Kas Masuk (Pemasukan)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Tanggal Transaksi <span className="text-[#FE2C55]">*</span>
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
                      Kategori Transaksi <span className="text-[#FE2C55]">*</span>
                    </label>
                    <ThemedSelect
                      value={category}
                      onChange={val => handleCategoryChange(val as any)}
                      title="Pilih Kategori Transaksi"
                      options={
                        pillar === 'operasional'
                          ? type === 'outflow'
                            ? [
                                { value: 'packing', label: 'Bahan Packing (Lakban, Plastik, Bubble)' },
                                { value: 'makan_minum', label: 'Konsumsi / Makan & Minum Tim' },
                                { value: 'listrik_wifi', label: 'Listrik, Air & Internet WiFi' },
                                { value: 'sewa_tempat', label: 'Sewa Tempat / Ruko Live' },
                                { value: 'gaji_pegawai', label: 'Gaji & Insentif Pegawai' },
                                { value: 'operasional', label: 'Biaya Steam & Operasional Toko' },
                                { value: 'ongkir', label: 'Ongkos Kirim Stok / Ekspedisi' },
                                { value: 'modal_ball', label: 'Modal Ball / Pembelian Stok Fashion' },
                                { value: 'topup_iklan', label: 'Top-Up Saldo Iklan & Promosi' },
                                { value: 'lainnya', label: 'Operasional Harian Lainnya' },
                              ]
                            : [
                                { value: 'penarikan_shopee', label: 'Penarikan Saldo Marketplace / Penjualan' },
                                { value: 'penarikan_marketplace', label: 'Penarikan Saldo Toko / Marketplace Lain' },
                                { value: 'operasional', label: 'Pemasukan Operasional Toko Lainnya' },
                              ]
                          : pillar === 'investasi'
                          ? type === 'outflow'
                            ? [
                                { value: 'investasi_aset', label: 'Pembelian Aset / Barang Jangka Panjang (Steamer, Rak, HP Live, Dekor)' },
                                { value: 'sewa_tempat', label: 'Sewa Jangka Panjang / Renovasi Tempat' },
                              ]
                            : [
                                { value: 'investasi_aset', label: 'Penjualan Aset / Pengembalian Investasi Barang' },
                              ]
                          : type === 'outflow'
                          ? [
                              { value: 'kasbon', label: 'Pemberian Kasbon Pegawai' },
                              { value: 'dana_talang', label: 'Pembayaran / Pelunasan Dana Talang Perusahaan' },
                              { value: 'konsumsi_pribadi', label: 'Konsumsi Pribadi (Prive Owner)' },
                            ]
                          : [
                              { value: 'dana_talang', label: 'Dana Talang Masuk (Suntikan Kas / Talangan)' },
                              { value: 'suntikan_modal', label: 'Suntikan Modal Tambahan (Owner / Investor)' },
                              { value: 'kasbon', label: 'Pengembalian / Cicilan Kasbon Pegawai' },
                            ]
                      }
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                    />
                  </div>
                </div>

                {/* Sub-form Pegawai jika kategori Gaji / Kasbon */}
                {(category === 'gaji_pegawai' || category === 'kasbon') && (
                  <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-purple-500/30 space-y-3">
                    <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <HandCoins className="w-3.5 h-3.5" />
                      <span>Rincian Pembayaran Pegawai</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Pilih Pegawai</label>
                        <ThemedSelect
                          value={employeeId}
                          onChange={val => handleEmployeeChange(val)}
                          title="Pilih Pegawai"
                          options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                          className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Tipe Pembayaran</label>
                        <ThemedSelect
                          value={paymentType}
                          onChange={val => handlePaymentTypeChange(val as any)}
                          title="Pilih Tipe Pembayaran"
                          options={[
                            { value: 'gaji_insentif', label: 'Gaji / Insentif (Operasional)' },
                            { value: 'kasbon', label: 'Kasbon Pegawai (Pendanaan)' },
                          ]}
                          className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Periode Bulan</label>
                        <input
                          type="month"
                          value={periodMonth}
                          onChange={e => {
                            setPeriodMonth(e.target.value);
                            if (employeeName) {
                              const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
                              setDescription(`${prefix} - ${employeeName} (Periode ${e.target.value})`);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setInputStep(2)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                  >
                    <span>Lanjut ke Tahap 2: Nominal &amp; Nota</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {inputStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#25F4EE]" />
                    <span>Tahap 2: Masukkan Nominal Transaksi &amp; Foto Nota</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Lengkapi besaran nominal, deskripsi catatan detail, serta foto nota bukti kas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nominal Transaksi (Rp) <span className="text-[#FE2C55]">*</span>
                  </label>
                  <CommaNumberInput
                    value={amount}
                    onChange={setAmount}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Terbilang: <strong className="text-white">{formatRupiah(amount)}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Keterangan / Deskripsi Transaksi <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Contoh: Beli lakban 5 roll & plastik polymailer"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                  />
                </div>

                {/* Upload Bukti Nota */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Foto Nota / Bukti Transfer (Opsional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {proofImageUrl ? (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0b0c10] border border-white/10">
                      <img
                        src={proofImageUrl}
                        alt="Bukti Nota"
                        className="w-14 h-14 object-cover rounded-xl border border-white/10"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="text-emerald-400 font-bold block">✓ Foto Bukti Terlampir</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] text-[#25F4EE] hover:underline cursor-pointer mr-3"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setProofImageUrl('')}
                          className="text-[10px] text-[#FE2C55] hover:underline cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 rounded-2xl bg-[#0b0c10] border border-dashed border-white/10 hover:border-[#25F4EE]/40 transition text-center cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                      <span className="text-xs text-zinc-300 font-bold block">Klik untuk Unggah Foto Nota</span>
                      <span className="text-[10px] text-zinc-500">JPG, PNG maksimal 10MB (otomatis dikompres)</span>
                    </button>
                  )}
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
                    id="btn-submit-cashflow-transaction"
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingItem ? 'Simpan Perubahan' : 'Catat & Tumpuk Transaksi'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Bagian Bawah: Feed Transaksi yang Baru Saja Diinput/Ditumpuk */}
          <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 space-y-2.5 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#25F4EE]" />
                Riwayat Transaksi Baru Saja Ditumpuk:
              </span>
              <button
                type="button"
                onClick={() => setActiveMenu('jurnal')}
                className="text-[11px] text-[#25F4EE] hover:underline font-bold"
              >
                Lihat Semua di Jurnal &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {cashflowList.slice(0, 4).map(item => {
                const itemPillar = getCashflowPillar(item);
                const isInflow = item.type === 'inflow';
                return (
                  <div key={item.id} className="p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {renderPillarBadge(itemPillar)}
                        <span className="text-zinc-400 text-[10px]">{formatDateIndo(item.date)}</span>
                      </div>
                      <div className="text-white font-medium truncate mt-0.5">{item.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-black ${isInflow ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                        {isInflow ? '+' : '-'}{formatRupiah(item.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. MENU 2: OPERASIONAL (OPERASIONAL SEHARI-HARI) ================= */}
      {activeMenu === 'operasional' && (
        <div className="space-y-3.5">
          {/* Header Pos Operasional */}
          <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#25F4EE]" />
                  <span>Pos Arus Kas: Operasional Sehari-hari</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Mencatat seluruh beban operasional rutin toko: packing, konsumsi, listrik &amp; wifi, sewa ruko, gaji pegawai harian, modal stok, ongkir &amp; iklan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm('operasional');
                  setActiveMenu('catatan_transaksi');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catat Kas Operasional</span>
              </button>
            </div>

            {/* Metrics Operasional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Pemasukan Operasional</span>
                <span className="text-base font-black text-[#25F4EE]">+{formatRupiah(opInflow)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Pengeluaran Operasional</span>
                <span className="text-base font-black text-[#FE2C55]">-{formatRupiah(opOutflow)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Arus Kas Operasional Bersih</span>
                <span className={`text-base font-black ${opNet >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                  {formatRupiah(opNet)}
                </span>
              </div>
            </div>
          </div>

          {/* List Transaksi Operasional */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-400 px-1">
              Daftar Transaksi Operasional ({operasionalList.length}):
            </div>

            {operasionalList.length === 0 ? (
              <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
                Belum ada transaksi operasional pada periode ini.
              </div>
            ) : (
              operasionalList.map(item => {
                const isInflow = item.type === 'inflow';
                const catLabel = CATEGORY_LABELS[item.category] || item.category;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                          {formatDateIndo(item.date)}
                        </span>
                        <span className="text-xs text-zinc-300 font-bold">{catLabel}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.proofImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE]"
                            title="Lihat Bukti Nota"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE]"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.description)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55]"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <div className={`text-base font-black ${isInflow ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                        {isInflow ? '+' : '-'}{formatRupiah(item.amount)}
                      </div>
                      <div className="text-right text-xs text-zinc-300 truncate font-medium flex-1">
                        {item.description}
                      </div>
                    </div>

                    {item.employeeName && (
                      <div className="text-[11px] text-[#25F4EE] pt-1 border-t border-white/5">
                        Pegawai Terkait: <strong>{item.employeeName}</strong> {item.periodMonth ? `(Periode ${item.periodMonth})` : ''}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= 3. MENU 3: INVESTASI (PEMBELIAN BARANG JANGKA PANJANG) ================= */}
      {activeMenu === 'investasi' && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>Pos Arus Kas: Investasi (Barang Jangka Panjang)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pembelian aset &amp; inventaris toko berumur manfaat lebih dari 1 tahun: Mesin steamer, rak baju, display manekin, lighting live, gadget admin &amp; renovasi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm('investasi');
                  setActiveMenu('catatan_transaksi');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-400/20 hover:bg-amber-400/90 transition cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catat Pembelian Investasi / Aset</span>
              </button>
            </div>

            {/* Metrics Investasi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Pengeluaran Pembelian Aset</span>
                <span className="text-base font-black text-[#FE2C55]">-{formatRupiah(invOutflow)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Penjualan Aset / Pengembalian</span>
                <span className="text-base font-black text-amber-400">+{formatRupiah(invInflow)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Arus Kas Investasi Bersih</span>
                <span className={`text-base font-black ${invNet >= 0 ? 'text-amber-400' : 'text-[#FE2C55]'}`}>
                  {formatRupiah(invNet)}
                </span>
              </div>
            </div>
          </div>

          {/* List Transaksi Investasi */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-400 px-1">
              Daftar Pembelian &amp; Transaksi Barang Investasi ({investasiList.length}):
            </div>

            {investasiList.length === 0 ? (
              <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
                Belum ada transaksi investasi / pembelian barang jangka panjang pada periode ini.
              </div>
            ) : (
              investasiList.map(item => {
                const isInflow = item.type === 'inflow';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-amber-400/40 transition shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                          {formatDateIndo(item.date)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                          Aset Jangka Panjang
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.proofImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400"
                            title="Lihat Nota Aset"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.description)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55]"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <div className={`text-base font-black ${isInflow ? 'text-amber-400' : 'text-[#FE2C55]'}`}>
                        {isInflow ? '+' : '-'}{formatRupiah(item.amount)}
                      </div>
                      <div className="text-right text-xs text-zinc-300 truncate font-semibold flex-1">
                        {item.description}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= 4. MENU 4: PENDANAAN (KASBON & SUNTIKKAN) ================= */}
      {activeMenu === 'pendanaan' && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-purple-400" />
                  <span>Pos Arus Kas: Pendanaan (Kasbon &amp; Suntikan)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Kelola kasbon pegawai, suntikan dana talang operasional, suntikan modal pemilik / investor, dan prive penarikan kas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm('pendanaan');
                  setActiveMenu('catatan_transaksi');
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 hover:bg-purple-600 transition cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catat Kasbon / Suntikan Kas</span>
              </button>
            </div>

            {/* Metrics Pendanaan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Suntikan Kas / Modal (+)</span>
                <span className="text-base font-black text-purple-300">+{formatRupiah(fundInflow)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Kasbon Keluar / Prive (-)</span>
                <span className="text-base font-black text-[#FE2C55]">-{formatRupiah(fundOutflow)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Sisa Tagihan Kasbon</span>
                <span className="text-base font-black text-amber-400">{formatRupiah(activeKasbonTotal)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] text-zinc-400 font-semibold block">Sisa Dana Talang Toko</span>
                <span className="text-base font-black text-[#25F4EE]">{formatRupiah(activeTalangTotal)}</span>
              </div>
            </div>

            {/* Sub-Switch: Mutasi Pendanaan vs Buku Tagihan */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => setPendanaanSubTab('mutasi')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pendanaanSubTab === 'mutasi'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-[#0b0c10] text-zinc-400 border border-white/5 hover:text-white'
                }`}
              >
                Daftar Mutasi Kasbon &amp; Suntikan ({pendanaanList.length})
              </button>
              <button
                type="button"
                onClick={() => setPendanaanSubTab('tagihan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pendanaanSubTab === 'tagihan'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#0b0c10] text-zinc-400 border border-white/5 hover:text-white'
                }`}
              >
                Buku Tagihan &amp; Dana Talang ({tagihanList.length})
              </button>
            </div>
          </div>

          {/* Sub-View 1: Mutasi Kasbon & Suntikan */}
          {pendanaanSubTab === 'mutasi' && (
            <div className="space-y-2">
              {pendanaanList.length === 0 ? (
                <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
                  Belum ada transaksi kasbon atau suntikan dana pada periode ini.
                </div>
              ) : (
                pendanaanList.map(item => {
                  const isInflow = item.type === 'inflow';
                  const catLabel = CATEGORY_LABELS[item.category] || item.category;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-purple-500/40 transition shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                            {formatDateIndo(item.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            {catLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {item.proofImageUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400"
                              title="Lihat Bukti"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.description)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55]"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between gap-3">
                        <div className={`text-base font-black ${isInflow ? 'text-purple-300' : 'text-[#FE2C55]'}`}>
                          {isInflow ? '+' : '-'}{formatRupiah(item.amount)}
                        </div>
                        <div className="text-right text-xs text-zinc-300 truncate font-semibold flex-1">
                          {item.description}
                        </div>
                      </div>

                      {item.employeeName && (
                        <div className="text-[11px] text-purple-300 pt-1 border-t border-white/5">
                          Nama Pegawai: <strong>{item.employeeName}</strong>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sub-View 2: TagihanSection */}
          {pendanaanSubTab === 'tagihan' && (
            <TagihanSection
              currentUser={currentUser}
              employees={employees}
              tagihanList={tagihanList}
              onRefresh={loadData}
              onBackToMenu={() => setActiveMenu('pendanaan')}
              onNotify={onNotify}
            />
          )}
        </div>
      )}

      {/* ================= 5. MENU 5: JURNAL (POS KELUAR MASUK SELURUH TRANSAKSI) ================= */}
      {activeMenu === 'jurnal' && (
        <div className="space-y-3.5">
          {/* Header & Quick Summary */}
          <div className="p-4 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#FE2C55]" />
                  <span>Jurnal Umum Arus Kas Terpadu</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pos keluar masuk seluruh transaksi kas dari Operasional, Investasi aset &amp; Pendanaan secara lengkap.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveMenu('catatan_transaksi');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FE2C55] text-white font-extrabold text-xs shadow-md shadow-[#FE2C55]/20 hover:bg-[#FE2C55]/90 transition cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catat Transaksi Baru</span>
              </button>
            </div>

            {/* Filter Pos & Jenis Jurnal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-zinc-400">Filter Pos:</span>
                <button
                  type="button"
                  onClick={() => setJurnalPillarFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalPillarFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                  }`}
                >
                  Semua Pos ({filteredList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJurnalPillarFilter('operasional')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalPillarFilter === 'operasional'
                      ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/40'
                      : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                  }`}
                >
                  Operasional ({operasionalList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJurnalPillarFilter('investasi')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalPillarFilter === 'investasi'
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                      : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                  }`}
                >
                  Investasi ({investasiList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJurnalPillarFilter('pendanaan')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalPillarFilter === 'pendanaan'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                  }`}
                >
                  Pendanaan ({pendanaanList.length})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setJurnalTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalTypeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#0b0c10] text-zinc-400'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setJurnalTypeFilter('inflow')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalTypeFilter === 'inflow' ? 'bg-[#25F4EE]/20 text-[#25F4EE]' : 'bg-[#0b0c10] text-zinc-400'
                  }`}
                >
                  Kas Masuk (+)
                </button>
                <button
                  type="button"
                  onClick={() => setJurnalTypeFilter('outflow')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalTypeFilter === 'outflow' ? 'bg-[#FE2C55]/20 text-[#FE2C55]' : 'bg-[#0b0c10] text-zinc-400'
                  }`}
                >
                  Kas Keluar (-)
                </button>
              </div>
            </div>

            {/* Total Balance Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
              <div className="text-zinc-400">
                Menampilkan: <strong className="text-white">{jurnalList.length}</strong> transaksi jurnal
              </div>
              <div className="flex items-center gap-3">
                <span>Masuk: <strong className="text-[#25F4EE]">+{formatRupiah(totalInflow)}</strong></span>
                <span>Keluar: <strong className="text-[#FE2C55]">-{formatRupiah(totalOutflow)}</strong></span>
                <span className="font-bold pl-2 border-l border-white/10">
                  Saldo Kas: <strong className={netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}>{formatRupiah(netCash)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* List Kartu Jurnal Mutasi */}
          <div className="space-y-2">
            {jurnalList.length === 0 ? (
              <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
                Tidak ada data jurnal transaksi pada filter yang dipilih.
              </div>
            ) : (
              jurnalList.map(item => {
                const isInflow = item.type === 'inflow';
                const itemPillar = getCashflowPillar(item);
                const categoryLabel = CATEGORY_LABELS[item.category] || item.category;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                          {formatDateIndo(item.date)}
                        </span>
                        {renderPillarBadge(itemPillar)}
                        <span className="text-xs text-zinc-400 font-semibold">{categoryLabel}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.proofImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                            title="Lihat Bukti Nota"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                          title="Edit Transaksi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.description)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <div className={`text-base sm:text-lg font-black tracking-tight ${
                        isInflow ? 'text-[#25F4EE]' : 'text-[#FE2C55]'
                      }`}>
                        {isInflow ? '+' : '-'}{formatRupiah(item.amount)}
                      </div>

                      <div className="text-right min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate">
                          {item.description}
                        </div>
                        {item.employeeName && (
                          <div className="text-[11px] text-[#25F4EE] font-medium truncate">
                            Pegawai: {item.employeeName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#161823] rounded-2xl border border-white/10 p-4 max-w-md w-full space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-white">Foto Bukti Nota</h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewPhotoUrl}
              alt="Preview Nota"
              className="w-full max-h-96 object-contain rounded-xl border border-white/5 bg-black"
            />
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
