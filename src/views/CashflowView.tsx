import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CashflowRecord, CashflowPillar, CurrentUser, Employee, TagihanRecord } from '../types';
import { formatRupiah, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { 
  Wallet, 
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
  HandCoins,
  BookOpen,
  Briefcase,
  TrendingUp,
  FolderOpen,
  ArrowUpDown,
  Clock,
  Receipt
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { ThemedSelect } from '../components/ThemedSelect';
import { TagihanSection } from '../components/TagihanSection';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type MainCashflowSubMenu = 'hub' | 'input' | 'catatan_kas' | 'riwayat_pos' | 'jurnal';
export type PosSubCategory = 'menu' | 'operasional' | 'investasi' | 'pendanaan';

export const CATEGORY_LABELS: Record<string, string> = {
  // Operasional
  modal_ball: 'Modal Ball / Belanja Stok Barang',
  ongkir: 'Ongkos Kirim Stok / Ekspedisi',
  operasional: 'Biaya Operasional Toko',
  topup_iklan: 'Top-Up Saldo Iklan Marketplace',
  packing: 'Bahan Packing (Lakban, Plastik, Bubble)',
  makan_minum: 'Konsumsi Harian & Lembur Tim',
  listrik_wifi: 'Listrik, Air & Internet WiFi',
  sewa_tempat: 'Sewa Tempat / Ruko Toko',
  gaji_pegawai: 'Gaji & Insentif Pegawai',
  gaji: 'Gaji Pegawai',
  penarikan_shopee: 'Penarikan Saldo Marketplace / Penjualan',
  penarikan_marketplace: 'Penarikan Saldo Marketplace',
  
  // Investasi
  investasi_aset: 'Pembelian Aset / Barang Jangka Panjang',

  // Pendanaan
  kasbon: 'Kasbon Pegawai',
  suntikan_modal: 'Suntikan Modal Tambahan (Owner / Investor)',
  dana_talang: 'Dana Talang / Kas Talangan',
  konsumsi_pribadi: 'Konsumsi Pribadi (Prive Owner)',

  lainnya: 'Lain-lain',
};

export function getCashflowPillar(record: CashflowRecord): CashflowPillar {
  if (record.pillar) return record.pillar;
  
  const cat = record.category as string;
  const desc = (record.description || '').toLowerCase();

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

  return 'operasional';
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  // ALUR CASHFLOW:
  // 1. Ringkasan Saldo Cashflow (Total Kas Masuk, Total Kas Keluar, Saldo Kas)
  // 2. Tombol: + Input Kas
  // 3. 3 Menu:
  //    - Catatan Kas = daftar seluruh kas masuk dan keluar
  //    - Riwayat Pos Cashflow = Operasional, Investasi, dan Pendanaan
  //    - Jurnal = daftar Debit dan Kredit
  const [activeMenu, setActiveMenu] = useState<MainCashflowSubMenu>('hub');
  const [activePosSub, setActivePosSub] = useState<PosSubCategory>('menu');

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
  const [catatanKasTypeFilter, setCatatanKasTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [jurnalPillarFilter, setJurnalPillarFilter] = useState<'all' | CashflowPillar>('all');
  const [jurnalTypeFilter, setJurnalTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [sortOrder, setSortOrder] = useState<'input_desc' | 'input_asc' | 'date_desc' | 'date_asc'>('input_desc');

  // Format tanggal & waktu input untuk tampilan kartu
  const formatInputDateTime = (createdAt?: string, fallbackDate?: string) => {
    if (!createdAt && !fallbackDate) return '-';
    const target = createdAt || fallbackDate || '';
    try {
      const d = new Date(target);
      if (isNaN(d.getTime())) return formatDateIndo(target);
      const dateFormatted = formatDateIndo(target.slice(0, 10));
      if (createdAt && createdAt.includes('T')) {
        const timeFormatted = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${dateFormatted} • ${timeFormatted}`;
      }
      return dateFormatted;
    } catch {
      return formatDateIndo(target);
    }
  };

  // Input Form States (3 Pos: Operasional, Investasi, Pendanaan)
  const [selectedPillar, setSelectedPillar] = useState<CashflowPillar>('operasional');
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');
  const [date, setDate] = useState(getTodayString());
  const [amount, setAmount] = useState<number>(150000);
  const [category, setCategory] = useState<CashflowRecord['category']>('packing');
  const [description, setDescription] = useState('Beli lakban, plastik packing polymailer & bubble wrap');
  
  // Pegawai detail
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
    setSelectedPillar(chosenPillar);
    setType('outflow');
    setProofImageUrl('');

    if (chosenPillar === 'operasional') {
      setAmount(150000);
      setCategory('packing');
      setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    } else if (chosenPillar === 'investasi') {
      setAmount(1200000);
      setCategory('investasi_aset');
      setDescription('Pembelian mesin steamer / rak pakaian');
    } else if (chosenPillar === 'pendanaan') {
      setAmount(300000);
      setCategory('kasbon');
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
    setSelectedPillar(recordPillar);
    setCategory(item.category);
    setPaymentType(item.paymentType || (item.description?.toLowerCase().includes('kasbon') ? 'kasbon' : 'gaji_insentif'));
    setDescription(item.description || '');
    setEmployeeId(item.employeeId || (employees[0]?.id || ''));
    setEmployeeName(item.employeeName || (employees[0]?.name || ''));
    setPeriodMonth(item.periodMonth || getTodayString().slice(0, 7));
    setProofImageUrl(item.proofImageUrl || '');
    setActiveMenu('input');
  };

  const handlePillarChange = (newPillar: CashflowPillar) => {
    setSelectedPillar(newPillar);
    if (newPillar === 'operasional') {
      if (type === 'outflow') {
        setCategory('packing');
        setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
      } else {
        setCategory('penarikan_shopee');
        setDescription('Pencairan saldo penjualan marketplace');
      }
    } else if (newPillar === 'investasi') {
      setCategory('investasi_aset');
      setDescription(type === 'outflow' ? 'Pembelian mesin steamer / rak / display' : 'Penjualan aset / mesin bekas');
    } else if (newPillar === 'pendanaan') {
      if (type === 'outflow') {
        setCategory('kasbon');
        setDescription('Kasbon Pegawai');
      } else {
        setCategory('suntikan_modal');
        setDescription('Suntikan modal kas tambahan');
      }
    }
  };

  const handleTypeChange = (newType: 'inflow' | 'outflow') => {
    setType(newType);
    if (selectedPillar === 'operasional') {
      if (newType === 'outflow') {
        setCategory('packing');
        setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
      } else {
        setCategory('penarikan_shopee');
        setDescription('Pencairan saldo penjualan marketplace');
      }
    } else if (selectedPillar === 'investasi') {
      setCategory('investasi_aset');
      setDescription(newType === 'outflow' ? 'Pembelian mesin steamer / rak / display' : 'Penjualan aset / mesin bekas');
    } else if (selectedPillar === 'pendanaan') {
      if (newType === 'outflow') {
        setCategory('kasbon');
        setDescription('Kasbon Pegawai');
      } else {
        setCategory('suntikan_modal');
        setDescription('Suntikan modal kas tambahan');
      }
    }
  };

  const handleCategorySelection = (catValue: CashflowRecord['category']) => {
    setCategory(catValue);
    if (catValue === 'gaji_pegawai') {
      const emp = employees.find(e => e.id === employeeId) || employees[0];
      if (emp) {
        setEmployeeId(emp.id);
        setEmployeeName(emp.name);
        const prefix = paymentType === 'kasbon' ? 'Kasbon' : 'Pembayaran Gaji & Insentif';
        setDescription(`${prefix} - ${emp.name} (Periode ${periodMonth})`);
      } else {
        setDescription('Pembayaran Gaji & Insentif Pegawai');
      }
    } else if (catValue === 'kasbon') {
      const emp = employees.find(e => e.id === employeeId) || employees[0];
      if (emp) {
        setEmployeeId(emp.id);
        setEmployeeName(emp.name);
        setDescription(`Kasbon Pegawai - ${emp.name}`);
      } else {
        setDescription('Kasbon Pegawai');
      }
    } else if (catValue === 'packing') {
      setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
    } else if (catValue === 'makan_minum') {
      setDescription('Makan minum & konsumsi tim operasional');
    } else if (catValue === 'listrik_wifi') {
      setDescription('Tagihan listrik & internet WiFi ruko');
    } else if (catValue === 'sewa_tempat') {
      setDescription('Pembayaran sewa ruko / studio live');
    } else if (catValue === 'modal_ball') {
      setDescription('Belanja stok pakaian / barang jualan');
    } else if (catValue === 'ongkir') {
      setDescription('Ongkos kirim ekspedisi pengiriman stok');
    } else if (catValue === 'topup_iklan') {
      setDescription('Top-up saldo iklan & promosi');
    } else if (catValue === 'operasional') {
      setDescription('Kebutuhan operasional harian toko');
    } else if (catValue === 'investasi_aset') {
      setDescription(type === 'outflow' ? 'Pembelian mesin steamer / rak / display' : 'Penjualan aset / mesin bekas');
    } else if (catValue === 'dana_talang') {
      setDescription(type === 'outflow' ? 'Pelunasan dana talang operasional' : 'Penerimaan dana talang toko');
    } else if (catValue === 'suntikan_modal') {
      setDescription('Suntikan modal kas tambahan');
    } else if (catValue === 'konsumsi_pribadi') {
      setDescription('Prive penarikan kas pribadi pemilik');
    } else if (catValue === 'penarikan_shopee') {
      setDescription('Pencairan saldo penjualan marketplace');
    } else {
      setDescription('Catatan kas lain-lain');
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
            onNotify('Foto nota berhasil dilampirkan.', 'info');
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

    let finalCategory = category;
    if (selectedPillar === 'pendanaan') {
      if (category === 'gaji_pegawai' && paymentType === 'kasbon') {
        finalCategory = 'kasbon';
      }
    } else if (selectedPillar === 'investasi') {
      finalCategory = 'investasi_aset';
    }

    const record: CashflowRecord = {
      id: editingItem ? editingItem.id : 'cf-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      type,
      amount,
      category: finalCategory,
      pillar: selectedPillar,
      description,
      recordedBy: currentUser.name,
      createdAt: editingItem?.createdAt ? editingItem.createdAt : new Date().toISOString(),
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
          
          // Sinkronisasi otomatis ke Tagihan
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
        resetForm();
        // Arahkan ke Catatan Kas untuk melihat daftar transaksi
        setActiveMenu('catatan_kas');
      } catch (err: any) {
        console.error('Error saving cashflow:', err);
        onNotify('Gagal menyimpan transaksi kas: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
    };

    setConfirmModal({
      isOpen: true,
      title: editingItem ? 'Konfirmasi Simpan Perubahan Transaksi' : 'Konfirmasi Catat Transaksi Kas',
      message: editingItem
        ? `Apakah Anda yakin ingin menyimpan perubahan transaksi "${description}" sebesar ${formatRupiah(amount)}?`
        : `Apakah Anda yakin ingin mencatat ${type === 'inflow' ? 'kas masuk' : 'kas keluar'} "${description}" sebesar ${formatRupiah(amount)}?`,
      type: editingItem ? 'edit' : 'create',
      confirmText: editingItem ? 'Ya, Simpan Perubahan' : 'Ya, Catat Transaksi',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, desc: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Transaksi Kas',
      message: `Apakah Anda yakin ingin menghapus transaksi "${desc}"? Saldo kas akan disesuaikan kembali.`,
      type: 'delete',
      confirmText: 'Ya, Hapus Transaksi',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          StorageService.deleteCashflow(id);
          loadData();
          onNotify('Transaksi kas berhasil dihapus!', 'info');
        } catch (err: any) {
          onNotify('Gagal menghapus transaksi: ' + (err?.message || 'Terjadi kesalahan.'), 'error');
        }
      },
    });
  };

  // Filter list by period & search query, serta urutkan sesuai tanggal input
  const filteredList = useMemo(() => {
    return cashflowList
      .filter(item => {
        if (periodFilter === 'today') {
          if (item.date !== getTodayString()) return false;
        } else if (periodFilter === 'specific') {
          if (item.date !== specificDate) return false;
        } else if (periodFilter === 'range') {
          if (item.date < startDate || item.date > endDate) return false;
        } else if (periodFilter === 'weekly') {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          const minDate = d.toISOString().slice(0, 10);
          if (item.date < minDate) return false;
        } else if (periodFilter === 'monthly') {
          const curMonth = getTodayString().slice(0, 7);
          if (!item.date.startsWith(curMonth)) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const descMatch = (item.description || '').toLowerCase().includes(q);
          const empMatch = (item.employeeName || '').toLowerCase().includes(q);
          const catMatch = (CATEGORY_LABELS[item.category] || item.category).toLowerCase().includes(q);
          const amountMatch = item.amount.toString().includes(q);
          if (!descMatch && !empMatch && !catMatch && !amountMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const getInputTime = (rec: CashflowRecord) => {
          if (rec.createdAt) {
            const t = new Date(rec.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (rec.id) {
            const m = rec.id.match(/\d{10,}/);
            if (m) {
              const num = parseInt(m[0], 10);
              if (!isNaN(num) && num > 1000000000) return num;
            }
          }
          if (rec.date) {
            const t = new Date(rec.date).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          return 0;
        };

        const getTxDateTime = (rec: CashflowRecord) => {
          if (rec.date) {
            const t = new Date(rec.date).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          return 0;
        };

        if (sortOrder === 'input_desc') {
          return getInputTime(b) - getInputTime(a);
        } else if (sortOrder === 'input_asc') {
          return getInputTime(a) - getInputTime(b);
        } else if (sortOrder === 'date_desc') {
          const diff = getTxDateTime(b) - getTxDateTime(a);
          return diff !== 0 ? diff : getInputTime(b) - getInputTime(a);
        } else if (sortOrder === 'date_asc') {
          const diff = getTxDateTime(a) - getTxDateTime(b);
          return diff !== 0 ? diff : getInputTime(a) - getInputTime(b);
        }
        return getInputTime(b) - getInputTime(a);
      });
  }, [cashflowList, periodFilter, specificDate, startDate, endDate, searchQuery, sortOrder]);

  // Pillar lists
  const operasionalList = useMemo(() => {
    return filteredList.filter(item => getCashflowPillar(item) === 'operasional');
  }, [filteredList]);

  const investasiList = useMemo(() => {
    return filteredList.filter(item => getCashflowPillar(item) === 'investasi');
  }, [filteredList]);

  const pendanaanList = useMemo(() => {
    return filteredList.filter(item => getCashflowPillar(item) === 'pendanaan');
  }, [filteredList]);

  // Catatan Kas list (Seluruh kas masuk & keluar)
  const catatanKasList = useMemo(() => {
    return filteredList.filter(item => {
      if (catatanKasTypeFilter !== 'all' && item.type !== catatanKasTypeFilter) return false;
      return true;
    });
  }, [filteredList, catatanKasTypeFilter]);

  // Jurnal list (Seluruh transaksi debit & kredit)
  const jurnalList = useMemo(() => {
    return filteredList.filter(item => {
      const itemPillar = getCashflowPillar(item);
      if (jurnalPillarFilter !== 'all' && itemPillar !== jurnalPillarFilter) return false;
      if (jurnalTypeFilter !== 'all' && item.type !== jurnalTypeFilter) return false;
      return true;
    });
  }, [filteredList, jurnalPillarFilter, jurnalTypeFilter]);

  // Totals calculations
  const totalInflow = filteredList.filter(i => i.type === 'inflow').reduce((a, b) => a + b.amount, 0);
  const totalOutflow = filteredList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0);
  const netCash = totalInflow - totalOutflow;

  const renderPillarBadge = (p: CashflowPillar) => {
    switch (p) {
      case 'operasional':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30">
            Operasional
          </span>
        );
      case 'investasi':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
            Investasi
          </span>
        );
      case 'pendanaan':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-400/10 text-purple-400 border border-purple-400/30">
            Pendanaan
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
      {/* ================= TOP CLEAN HEADER BAR ================= */}
      <div className="p-2.5 sm:p-3 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activeMenu !== 'hub' ? (
            <button
              type="button"
              onClick={() => {
                if (activeMenu === 'riwayat_pos' && activePosSub !== 'menu') {
                  setActivePosSub('menu');
                } else {
                  setActiveMenu('hub');
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>
                {activeMenu === 'riwayat_pos' && activePosSub !== 'menu'
                  ? 'Riwayat Pos'
                  : 'Menu Cashflow'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Dashboard</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#25F4EE]" />
            <span className="text-xs sm:text-sm font-black text-white">
              {activeMenu === 'hub' && 'Cashflow & Arus Kas Toko'}
              {activeMenu === 'input' && (editingItem ? 'Edit Transaksi Kas' : 'Input Kas')}
              {activeMenu === 'catatan_kas' && 'Catatan Kas (Kas Masuk & Keluar)'}
              {activeMenu === 'riwayat_pos' && (
                activePosSub === 'menu' ? 'Riwayat Pos Cashflow' :
                activePosSub === 'operasional' ? 'Riwayat Pos: Operasional' :
                activePosSub === 'investasi' ? 'Riwayat Pos: Investasi' : 'Riwayat Pos: Pendanaan'
              )}
              {activeMenu === 'jurnal' && 'Jurnal Transaksi Kas (Debit & Kredit)'}
            </span>
          </div>
        </div>

        {/* Quick Input Button in Header when in list views */}
        {activeMenu !== 'hub' && activeMenu !== 'input' && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveMenu('input');
            }}
            className="px-3 py-1.5 rounded-xl bg-[#25F4EE] hover:bg-[#20e3de] text-[#0b0c10] font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#25F4EE]/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Input Kas</span>
            <span className="sm:hidden">Input</span>
          </button>
        )}
      </div>

      {/* Filter Bar (Khusus Tampilan Daftar Transaksi) */}
      {(activeMenu === 'catatan_kas' || activeMenu === 'jurnal' || (activeMenu === 'riwayat_pos' && (activePosSub === 'operasional' || activePosSub === 'investasi'))) && (
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
              <input
                type="date"
                value={specificDate}
                onChange={e => setSpecificDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white"
              />
            )}

            {periodFilter === 'range' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white"
                />
                <span className="text-zinc-500">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white"
                />
              </div>
            )}

            {/* Selector Urutan (Urutkan Sesuai Tanggal Input) */}
            <div className="flex items-center gap-1.5 pl-2 sm:border-l border-white/10">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#25F4EE]" />
                Urutan:
              </span>
              <ThemedSelect
                value={sortOrder}
                onChange={val => setSortOrder(val as any)}
                title="Pilih Urutan Transaksi"
                options={[
                  { value: 'input_desc', label: 'Tanggal Input (Terbaru) ↓' },
                  { value: 'input_asc', label: 'Tanggal Input (Terlama) ↑' },
                  { value: 'date_desc', label: 'Tanggal Transaksi (Terbaru)' },
                  { value: 'date_asc', label: 'Tanggal Transaksi (Terlama)' },
                ]}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
              />
            </div>
          </div>

          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#25F4EE]"
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          HALAMAN UTAMA CASHFLOW (RINGKASAN & 3 MENU)
          ========================================================================= */}
      {activeMenu === 'hub' && (
        <div className="space-y-4">
          {/* Ringkasan Saldo Cashflow */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#25F4EE]" />
              <h3 className="text-sm font-black text-white">Ringkasan Saldo Cashflow</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[11px] font-bold text-zinc-400 block">Total Kas Masuk</span>
                <span className="text-base sm:text-lg font-black text-[#25F4EE]">+{formatRupiah(totalInflow)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[11px] font-bold text-zinc-400 block">Total Kas Keluar</span>
                <span className="text-base sm:text-lg font-black text-[#FE2C55]">-{formatRupiah(totalOutflow)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[11px] font-bold text-zinc-400 block">Saldo Kas</span>
                <span className={`text-base sm:text-lg font-black ${netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
                  {formatRupiah(netCash)}
                </span>
              </div>
            </div>
          </div>

          {/* Di bawahnya tombol: + Input Kas */}
          <button
            type="button"
            id="btn-input-kas-hub"
            onClick={() => {
              resetForm();
              setActiveMenu('input');
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#25F4EE] via-[#20e3de] to-[#14c7c2] text-[#0b0c10] font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#25F4EE]/20 hover:opacity-95 hover:shadow-xl hover:shadow-[#25F4EE]/30 active:scale-[0.99] transition cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#0b0c10]" />
            <span>+ Input Kas</span>
          </button>

          {/* Kemudian 3 menu:
              1. Catatan Kas
              2. Riwayat Pos Cashflow
              3. Jurnal */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Catatan Kas */}
              <div
                id="menu-catatan-kas"
                onClick={() => setActiveMenu('catatan_kas')}
                className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 text-[#25F4EE] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-[#25F4EE] transition">
                      1. Catatan Kas
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Catatan Kas = daftar seluruh kas masuk dan keluar.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-500 font-semibold">{filteredList.length} Transaksi</span>
                  <span className="font-bold text-[#25F4EE] group-hover:underline">Buka Catatan Kas &rarr;</span>
                </div>
              </div>

              {/* 2. Riwayat Pos Cashflow */}
              <div
                id="menu-riwayat-pos"
                onClick={() => {
                  setActivePosSub('menu');
                  setActiveMenu('riwayat_pos');
                }}
                className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-cyan-300 transition">
                      2. Riwayat Pos Cashflow
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Riwayat Pos Cashflow = Operasional, Investasi, dan Pendanaan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-500 font-semibold">3 Pos Arus Kas</span>
                  <span className="font-bold text-cyan-400 group-hover:underline">Buka Pos Cashflow &rarr;</span>
                </div>
              </div>

              {/* 3. Jurnal */}
              <div
                id="menu-jurnal"
                onClick={() => setActiveMenu('jurnal')}
                className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-purple-300 transition">
                      3. Jurnal
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Jurnal = daftar Debit dan Kredit.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-500 font-semibold">Debit (+) & Kredit (-)</span>
                  <span className="font-bold text-purple-400 group-hover:underline">Buka Jurnal &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. SUB MENU: INPUT KAS (CATATAN KAS) - HANYA FORMULIR INPUT SAJA
          ========================================================================= */}
      {activeMenu === 'input' && (
        <div className="max-w-2xl mx-auto space-y-3.5">
          <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#25F4EE]" />
                <span>{editingItem ? 'Edit Transaksi Kas' : 'Input Kas'}</span>
              </h3>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveMenu('catatan_kas');
                  }}
                  className="text-[11px] text-[#FE2C55] hover:underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {/* A. PILIH POS ARUS KAS: 3 POS SAJA */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Pilih Pos Kas <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePillarChange('operasional')}
                  className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedPillar === 'operasional'
                      ? 'bg-[#25F4EE]/15 border-[#25F4EE] text-[#25F4EE] shadow-md shadow-[#25F4EE]/10'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Operasional</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePillarChange('investasi')}
                  className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedPillar === 'investasi'
                      ? 'bg-amber-400/15 border-amber-400 text-amber-400 shadow-md shadow-amber-400/10'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Investasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePillarChange('pendanaan')}
                  className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedPillar === 'pendanaan'
                      ? 'bg-purple-400/15 border-purple-400 text-purple-400 shadow-md shadow-purple-400/10'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <HandCoins className="w-4 h-4" />
                  <span>Pendanaan</span>
                </button>
              </div>
            </div>

            {/* B. JENIS TRANSAKSI: KAS KELUAR vs KAS MASUK */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Jenis Transaksi <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('outflow')}
                  className={`p-3 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    type === 'outflow'
                      ? 'bg-[#FE2C55]/15 border-[#FE2C55] text-[#FE2C55] shadow-md shadow-[#FE2C55]/10'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🔻 Pengeluaran (Kredit)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('inflow')}
                  className={`p-3 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    type === 'inflow'
                      ? 'bg-[#25F4EE]/15 border-[#25F4EE] text-[#25F4EE] shadow-md shadow-[#25F4EE]/10'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🔺 Pemasukan (Debit)</span>
                </button>
              </div>
            </div>

            {/* C. TANGGAL TRANSAKSI */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Tanggal Transaksi <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-hidden focus:border-[#25F4EE]"
              />
            </div>

            {/* D. KATEGORI TRANSAKSI */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Kategori Transaksi <span className="text-[#FE2C55]">*</span>
              </label>
              <select
                value={category}
                onChange={e => handleCategorySelection(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-hidden focus:border-[#25F4EE]"
              >
                {selectedPillar === 'operasional' && (
                  type === 'outflow' ? (
                    <>
                      <option value="packing" className="bg-[#161823] text-white">Bahan Packing (Lakban, Plastik, Bubble)</option>
                      <option value="makan_minum" className="bg-[#161823] text-white">Konsumsi Harian &amp; Lembur Tim</option>
                      <option value="listrik_wifi" className="bg-[#161823] text-white">Listrik, Air &amp; Internet WiFi</option>
                      <option value="sewa_tempat" className="bg-[#161823] text-white">Sewa Tempat / Ruko Toko</option>
                      <option value="gaji_pegawai" className="bg-[#161823] text-white">Gaji &amp; Insentif Pegawai</option>
                      <option value="modal_ball" className="bg-[#161823] text-white">Modal Stok / Belanja Barang Dagangan</option>
                      <option value="ongkir" className="bg-[#161823] text-white">Ongkos Kirim Stok / Ekspedisi</option>
                      <option value="topup_iklan" className="bg-[#161823] text-white">Iklan &amp; Saldo Promosi Marketplace</option>
                      <option value="operasional" className="bg-[#161823] text-white">Operasional Rutin Toko Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="penarikan_shopee" className="bg-[#161823] text-white">Penarikan Saldo Marketplace / Penjualan</option>
                      <option value="operasional" className="bg-[#161823] text-white">Pemasukan Operasional Toko Lainnya</option>
                    </>
                  )
                )}

                {selectedPillar === 'investasi' && (
                  type === 'outflow' ? (
                    <option value="investasi_aset" className="bg-[#161823] text-white">Pembelian Aset / Barang Jangka Panjang (Mesin, Display, Gadget)</option>
                  ) : (
                    <option value="investasi_aset" className="bg-[#161823] text-white">Penjualan Aset / Mesin / Barang Bekas</option>
                  )
                )}

                {selectedPillar === 'pendanaan' && (
                  type === 'outflow' ? (
                    <>
                      <option value="kasbon" className="bg-[#161823] text-white">Pinjaman Kasbon Pegawai</option>
                      <option value="dana_talang" className="bg-[#161823] text-white">Pengembalian Dana Talang Toko</option>
                      <option value="konsumsi_pribadi" className="bg-[#161823] text-white">Konsumsi Pribadi (Prive Owner)</option>
                      <option value="lainnya" className="bg-[#161823] text-white">Pengeluaran Pendanaan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="suntikan_modal" className="bg-[#161823] text-white">Suntikan Modal Pemilik / Investor</option>
                      <option value="dana_talang" className="bg-[#161823] text-white">Penerimaan Dana Talang Toko</option>
                      <option value="kasbon" className="bg-[#161823] text-white">Pengembalian / Pelunasan Kasbon Pegawai</option>
                      <option value="lainnya" className="bg-[#161823] text-white">Pemasukan Pendanaan Lainnya</option>
                    </>
                  )
                )}
              </select>
            </div>

            {/* E. KHUSUS PEGAWAI JIKA KASBON ATAU GAJI */}
            {(category === 'gaji_pegawai' || category === 'kasbon') && (
              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Pilih Pegawai:</label>
                    <select
                      value={employeeId}
                      onChange={e => {
                        setEmployeeId(e.target.value);
                        const emp = employees.find(x => x.id === e.target.value);
                        if (emp) {
                          setEmployeeName(emp.name);
                          setDescription(`${category === 'kasbon' ? 'Kasbon' : 'Gaji'} - ${emp.name} (${periodMonth})`);
                        }
                      }}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-[#161823] text-white">
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Periode Bulan:</label>
                    <input
                      type="month"
                      value={periodMonth}
                      onChange={e => {
                        setPeriodMonth(e.target.value);
                        if (employeeName) {
                          setDescription(`${category === 'kasbon' ? 'Kasbon' : 'Gaji'} - ${employeeName} (${e.target.value})`);
                        }
                      }}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* F. NOMINAL TRANSAKSI (RP) */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nominal Transaksi (Rp) <span className="text-[#FE2C55]">*</span>
              </label>
              <CommaNumberInput
                value={amount}
                onChange={setAmount}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-black text-sm focus:outline-hidden focus:border-[#25F4EE]"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Terbilang: <strong className="text-white">{formatRupiah(amount)}</strong>
              </span>
            </div>

            {/* G. KETERANGAN TRANSAKSI */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Keterangan Transaksi <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tulis keterangan transaksi..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-hidden focus:border-[#25F4EE]"
              />
            </div>

            {/* H. FOTO NOTA / BUKTI TRANSFER */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
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
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-[#25F4EE] hover:underline cursor-pointer"
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
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl bg-[#0b0c10] border border-dashed border-white/10 hover:border-[#25F4EE]/40 transition text-center cursor-pointer"
                >
                  <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <span className="text-xs text-zinc-300 font-bold block">Klik untuk Unggah Foto Nota</span>
                  <span className="text-[10px] text-zinc-500">JPG, PNG maksimal 10MB</span>
                </button>
              )}
            </div>

            {/* TOMBOL SIMPAN */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => resetForm()}
                className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition cursor-pointer"
              >
                Reset Form
              </button>

              <button
                id="btn-submit-cashflow-transaction"
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Transaksi Kas'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          1. SUB MENU: CATATAN KAS (DAFTAR SELURUH KAS MASUK DAN KELUAR)
          ========================================================================= */}
      {activeMenu === 'catatan_kas' && (
        <div className="space-y-3">
          {/* Filter Jenis Kas & Ringkasan */}
          <div className="p-3.5 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-zinc-300">Tampilkan:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCatatanKasTypeFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      catatanKasTypeFilter === 'all'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Semua ({filteredList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatatanKasTypeFilter('inflow')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      catatanKasTypeFilter === 'inflow'
                        ? 'bg-[#25F4EE]/20 text-[#25F4EE] border border-[#25F4EE]/40'
                        : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Kas Masuk ({filteredList.filter(i => i.type === 'inflow').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatatanKasTypeFilter('outflow')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      catatanKasTypeFilter === 'outflow'
                        ? 'bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/40'
                        : 'bg-[#0b0c10] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Kas Keluar ({filteredList.filter(i => i.type === 'outflow').length})
                  </button>
                </div>
              </div>

              {/* Ringkasan Cepat di Catatan Kas */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span>Total Masuk: <strong className="text-[#25F4EE]">+{formatRupiah(totalInflow)}</strong></span>
                <span>Total Keluar: <strong className="text-[#FE2C55]">-{formatRupiah(totalOutflow)}</strong></span>
                <span className="font-bold pl-2 sm:border-l sm:border-white/10">
                  Saldo: <strong className={netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}>{formatRupiah(netCash)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Daftar Catatan Kas Masuk & Keluar */}
          <div className="space-y-2">
            {catatanKasList.length === 0 ? (
              <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs space-y-2">
                <p>Belum ada catatan kas masuk atau keluar pada periode ini.</p>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveMenu('input');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#25F4EE] text-[#0b0c10] font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Input Kas Sekarang
                </button>
              </div>
            ) : (
              catatanKasList.map(item => {
                const isInflow = item.type === 'inflow';
                const itemPillar = getCashflowPillar(item);
                const categoryLabel = CATEGORY_LABELS[item.category] || item.category;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300" title="Tanggal Transaksi">
                          Tgl: {formatDateIndo(item.date)}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/5 text-zinc-400 flex items-center gap-1" title="Tanggal & Waktu Input Transaksi">
                          <Clock className="w-2.5 h-2.5 text-[#25F4EE]" />
                          Input: {formatInputDateTime(item.createdAt, item.date)}
                        </span>
                        {renderPillarBadge(itemPillar)}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isInflow ? 'bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30' : 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/30'
                        }`}>
                          {isInflow ? 'Kas Masuk' : 'Kas Keluar'}
                        </span>
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

      {/* =========================================================================
          2. SUB MENU: RIWAYAT POS CASHFLOW (OPERASIONAL, INVESTASI, PENDANAAN)
          ========================================================================= */}
      {activeMenu === 'riwayat_pos' && (
        <div className="space-y-4">
          {activePosSub === 'menu' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Pilih Pos Cashflow:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Pos Operasional */}
                <div
                  id="card-pos-operasional"
                  onClick={() => setActivePosSub('operasional')}
                  className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-[#25F4EE]/30 text-[#25F4EE] flex items-center justify-center shrink-0">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white group-hover:text-[#25F4EE] transition">
                        Operasional
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {operasionalList.length} Transaksi Operasional
                      </p>
                    </div>
                  </div>
                  <div className="text-right pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-[#25F4EE] group-hover:underline">Buka Daftar &rarr;</span>
                  </div>
                </div>

                {/* Pos Investasi */}
                <div
                  id="card-pos-investasi"
                  onClick={() => setActivePosSub('investasi')}
                  className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-amber-400/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white group-hover:text-amber-400 transition">
                        Investasi
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {investasiList.length} Transaksi Aset
                      </p>
                    </div>
                  </div>
                  <div className="text-right pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-amber-400 group-hover:underline">Buka Daftar &rarr;</span>
                  </div>
                </div>

                {/* Pos Pendanaan */}
                <div
                  id="card-pos-pendanaan"
                  onClick={() => setActivePosSub('pendanaan')}
                  className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-purple-400/50 transition cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-purple-400/30 text-purple-400 flex items-center justify-center shrink-0">
                      <HandCoins className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white group-hover:text-purple-400 transition">
                        Pendanaan
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {tagihanList.length} Data Tagihan &amp; Kasbon
                      </p>
                    </div>
                  </div>
                  <div className="text-right pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-purple-400 group-hover:underline">Buka Daftar &rarr;</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DAFTAR: POS OPERASIONAL */}
          {activePosSub === 'operasional' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                <span>Daftar Transaksi Operasional ({operasionalList.length}):</span>
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300" title="Tanggal Transaksi">
                            Tgl: {formatDateIndo(item.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/5 text-zinc-400 flex items-center gap-1" title="Tanggal & Waktu Input Transaksi">
                            <Clock className="w-2.5 h-2.5 text-[#25F4EE]" />
                            Input: {formatInputDateTime(item.createdAt, item.date)}
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
          )}

          {/* DAFTAR: POS INVESTASI */}
          {activePosSub === 'investasi' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                <span>Daftar Transaksi Pembelian Aset ({investasiList.length}):</span>
              </div>

              {investasiList.length === 0 ? (
                <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
                  Belum ada transaksi pembelian aset / investasi pada periode ini.
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300" title="Tanggal Transaksi">
                            Tgl: {formatDateIndo(item.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/5 text-zinc-400 flex items-center gap-1" title="Tanggal & Waktu Input Transaksi">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            Input: {formatInputDateTime(item.createdAt, item.date)}
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
          )}

          {/* DAFTAR: POS PENDANAAN (BUKU TAGIHAN & DANA TALANG) */}
          {activePosSub === 'pendanaan' && (
            <TagihanSection
              currentUser={currentUser}
              employees={employees}
              tagihanList={tagihanList}
              onRefresh={loadData}
              onBackToMenu={() => setActivePosSub('menu')}
              onNotify={onNotify}
            />
          )}
        </div>
      )}

      {/* =========================================================================
          3. SUB MENU: JURNAL (SELURUH TRANSAKSI DEBIT & KREDIT DITUMPUK DI SINI)
          ========================================================================= */}
      {activeMenu === 'jurnal' && (
        <div className="space-y-3">
          {/* Filter Pos & Jenis Jurnal */}
          <div className="p-3.5 rounded-3xl bg-[#161823] border border-white/10 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
                  Debit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setJurnalTypeFilter('outflow')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jurnalTypeFilter === 'outflow' ? 'bg-[#FE2C55]/20 text-[#FE2C55]' : 'bg-[#0b0c10] text-zinc-400'
                  }`}
                >
                  Kredit (-)
                </button>
              </div>
            </div>

            {/* Total Balance Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
              <div className="text-zinc-400">
                Total: <strong className="text-white">{jurnalList.length}</strong> transaksi jurnal
              </div>
              <div className="flex items-center gap-3">
                <span>Debit: <strong className="text-[#25F4EE]">+{formatRupiah(totalInflow)}</strong></span>
                <span>Kredit: <strong className="text-[#FE2C55]">-{formatRupiah(totalOutflow)}</strong></span>
                <span className="font-bold pl-2 border-l border-white/10">
                  Saldo: <strong className={netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}>{formatRupiah(netCash)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* List Kartu Jurnal Mutasi */}
          <div className="space-y-2">
            {jurnalList.length === 0 ? (
              <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs">
                Tidak ada data transaksi jurnal pada filter yang dipilih.
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300" title="Tanggal Transaksi">
                          Tgl: {formatDateIndo(item.date)}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/5 text-zinc-400 flex items-center gap-1" title="Tanggal & Waktu Input Transaksi">
                          <Clock className="w-2.5 h-2.5 text-[#25F4EE]" />
                          Input: {formatInputDateTime(item.createdAt, item.date)}
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
