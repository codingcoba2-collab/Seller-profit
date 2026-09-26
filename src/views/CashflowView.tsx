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
  Briefcase,
  TrendingUp,
  FolderOpen,
  ArrowUpDown,
  Clock,
  Receipt,
  CreditCard
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { ThemedSelect } from '../components/ThemedSelect';
import { TagihanSection } from '../components/TagihanSection';
import { UtangPiutangSection } from '../components/UtangPiutangSection';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type MainCashflowSubMenu = 'hub' | 'input' | 'catatan_kas' | 'riwayat_pos' | 'utang_piutang';
export type PosSubCategory = 'menu' | 'operasional' | 'investasi' | 'pendanaan';

export const CATEGORY_LABELS: Record<string, string> = {
  // 1. Operasional
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
  
  // 2. Investasi
  investasi_aset: 'Pembelian Aset / Barang Jangka Panjang',

  // 3. Pendanaan (HANYA berisi Modal, Tambahan Modal, Pinjaman Diterima, Pembayaran Pokok Pinjaman, dan Prive)
  modal_awal: 'Modal / Setoran Modal Awal',
  suntikan_modal: 'Tambahan Modal (Owner / Investor)',
  pinjaman_diterima: 'Pinjaman Diterima (Pihak Ketiga / Bank)',
  bayar_pokok_pinjaman: 'Pembayaran Pokok Pinjaman',
  konsumsi_pribadi: 'Prive (Penarikan Pribadi Pemilik)',
  prive: 'Prive (Penarikan Pribadi Pemilik)',

  lainnya: 'Lain-lain',
};

export function getCashflowPillar(record: CashflowRecord): CashflowPillar {
  if (record.pillar) return record.pillar;
  
  const cat = record.category as string;
  const desc = (record.description || '').toLowerCase();

  // Pendanaan: HANYA Modal, Tambahan Modal, Pinjaman Diterima, Pembayaran Pokok Pinjaman, dan Prive
  // Tagihan, Piutang, atau Kasbon TIDAK dimasukkan ke dalam Pendanaan!
  if (
    cat === 'modal_awal' ||
    cat === 'suntikan_modal' ||
    cat === 'pinjaman_diterima' ||
    cat === 'bayar_pokok_pinjaman' ||
    cat === 'konsumsi_pribadi' ||
    cat === 'prive' ||
    desc.includes('suntikan modal') ||
    desc.includes('tambahan modal') ||
    desc.includes('modal awal') ||
    desc.includes('pinjaman diterima') ||
    desc.includes('pokok pinjaman') ||
    desc.includes('prive')
  ) {
    return 'pendanaan';
  }

  // Investasi
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

  // Sisanya masuk ke Operasional
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
  const [selectedDetailItem, setSelectedDetailItem] = useState<CashflowRecord | null>(null);

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
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'input_desc' | 'input_asc'>('date_desc');

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

  // Format tanggal pendek khusus tabel buku kas (misal: "24 Sep", "23 Sep")
  const formatTableDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const monthName = months[monthIdx] || parts[1];
        return `${day} ${monthName}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper untuk mendapatkan timestamp waktu input / pembuatan transaksi secara presisi
  const getCashflowInputTime = (rec: CashflowRecord): number => {
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
    return 0;
  };

  // Urutan Kronologis Baku: Dari transaksi paling lama (paling awal) ke paling baru
  // (Ascending: 8 Sep dulu, lalu 10 Sep transaksi 1, lalu 10 Sep transaksi 2, dst.)
  const compareCashflowChronologicalAsc = (a: CashflowRecord, b: CashflowRecord): number => {
    // 1. Urutkan berdasarkan tanggal transaksi (YYYY-MM-DD)
    const dateDiff = (a.date || '').localeCompare(b.date || '');
    if (dateDiff !== 0) return dateDiff;

    // 2. Jika tanggal transaksi persis sama, urutkan berdasarkan urutan waktu input pembuatan
    const timeA = getCashflowInputTime(a);
    const timeB = getCashflowInputTime(b);
    if (timeA !== timeB) return timeA - timeB;

    // 3. ID sebagai penentu akhir jika waktu sama
    return (a.id || '').localeCompare(b.id || '');
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
      setAmount(1000000);
      setType('inflow');
      setCategory('modal_awal');
      setDescription('Setoran modal awal usaha toko');
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
        setCategory('bayar_pokok_pinjaman');
        setDescription('Pembayaran pokok pinjaman');
      } else {
        setCategory('suntikan_modal');
        setDescription('Tambahan modal pemilik / investor');
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
        setCategory('bayar_pokok_pinjaman');
        setDescription('Pembayaran pokok pinjaman');
      } else {
        setCategory('suntikan_modal');
        setDescription('Tambahan modal pemilik / investor');
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
    } else if (catValue === 'modal_awal') {
      setDescription('Setoran modal awal usaha toko');
    } else if (catValue === 'suntikan_modal') {
      setDescription('Tambahan modal pemilik / investor');
    } else if (catValue === 'pinjaman_diterima') {
      setDescription('Penerimaan pinjaman usaha / kreditur');
    } else if (catValue === 'bayar_pokok_pinjaman') {
      setDescription('Pembayaran pokok pinjaman');
    } else if (catValue === 'konsumsi_pribadi' || catValue === 'prive') {
      setDescription('Prive (Penarikan kas pribadi pemilik)');
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
        if (sortOrder === 'date_desc') {
          // Tanggal transaksi: Paling lama di bawah (artinya terbaru di atas, terlama di bawah)
          return compareCashflowChronologicalAsc(b, a);
        } else if (sortOrder === 'date_asc') {
          // Tanggal transaksi: Paling lama di atas
          return compareCashflowChronologicalAsc(a, b);
        } else if (sortOrder === 'input_desc') {
          const timeDiff = getCashflowInputTime(b) - getCashflowInputTime(a);
          return timeDiff !== 0 ? timeDiff : (b.id || '').localeCompare(a.id || '');
        } else if (sortOrder === 'input_asc') {
          const timeDiff = getCashflowInputTime(a) - getCashflowInputTime(b);
          return timeDiff !== 0 ? timeDiff : (a.id || '').localeCompare(b.id || '');
        }
        return compareCashflowChronologicalAsc(b, a);
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

  // Running balance (Saldo Berjalan) untuk Catatan Kas
  // Dihitung berurutan secara kronologis dari transaksi paling awal / lama ke paling baru
  const runningBalanceMap = useMemo(() => {
    const chronological = [...cashflowList].sort(compareCashflowChronologicalAsc);

    const map = new Map<string, number>();
    let currentBalance = 0;
    for (const item of chronological) {
      if (item.type === 'inflow') {
        currentBalance += item.amount;
      } else {
        currentBalance -= item.amount;
      }
      map.set(item.id, currentBalance);
    }
    return map;
  }, [cashflowList]);

  // Totals calculations
  const totalInflow = filteredList.filter(i => i.type === 'inflow').reduce((a, b) => a + b.amount, 0);
  const totalOutflow = filteredList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0);
  const netCash = totalInflow - totalOutflow;

  // Total Biaya Operasional & Investasi
  const totalBiayaOperasional = useMemo(
    () => operasionalList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0),
    [operasionalList]
  );
  const totalMasukOperasional = useMemo(
    () => operasionalList.filter(i => i.type === 'inflow').reduce((a, b) => a + b.amount, 0),
    [operasionalList]
  );
  const totalBiayaInvestasi = useMemo(
    () => investasiList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0),
    [investasiList]
  );
  const totalMasukInvestasi = useMemo(
    () => investasiList.filter(i => i.type === 'inflow').reduce((a, b) => a + b.amount, 0),
    [investasiList]
  );

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
      {/* ================= TOP CLEAN HEADER BAR (HANYA DI HUB) ================= */}
      {activeMenu === 'hub' && (
        <div className="p-2.5 sm:p-3 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Dashboard</span>
            </button>

            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#25F4EE]" />
              <span className="text-xs sm:text-sm font-black text-white">
                Cashflow &amp; Arus Kas Toko
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar (Khusus Tampilan Daftar Transaksi) */}
      {(activeMenu === 'catatan_kas' || (activeMenu === 'riwayat_pos' && (activePosSub === 'operasional' || activePosSub === 'investasi' || activePosSub === 'pendanaan'))) && (
        <div className="p-2.5 sm:p-3 bg-[#161823] rounded-2xl border border-white/10 shadow flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {activeMenu === 'catatan_kas' ? (
              <button
                type="button"
                onClick={() => setActiveMenu('hub')}
                className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                title="Kembali ke Menu Cashflow"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span className="hidden sm:inline">Menu Cashflow</span>
              </button>
            ) : activeMenu === 'riwayat_pos' && activePosSub !== 'menu' ? (
              <button
                type="button"
                onClick={() => setActivePosSub('menu')}
                className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                title="Kembali ke Riwayat Pos"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span className="hidden sm:inline">Riwayat Pos</span>
              </button>
            ) : null}

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
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#25F4EE]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveMenu('input');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#25F4EE] hover:bg-[#20e3de] text-[#0b0c10] font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-md shadow-[#25F4EE]/20 shrink-0"
              title="Input Transaksi Kas"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Input</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          HALAMAN UTAMA CASHFLOW (RINGKASAN & 3 MENU)
          ========================================================================= */}
      {activeMenu === 'hub' && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Ringkasan Saldo Cashflow (Compact / Perkecil Sesuai Permintaan) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#25F4EE]" />
                <h3 className="text-xs font-black text-white">Ringkasan Saldo Cashflow</h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold">{filteredList.length} Transaksi</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] font-semibold text-zinc-400 block truncate">Kas Masuk</span>
                <span className="text-xs sm:text-sm font-black text-[#25F4EE] block truncate">+{formatRupiah(totalInflow)}</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] font-semibold text-zinc-400 block truncate">Kas Keluar</span>
                <span className="text-xs sm:text-sm font-black text-[#FE2C55] block truncate">-{formatRupiah(totalOutflow)}</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] font-semibold text-zinc-400 block truncate">Saldo Kas</span>
                <span className={`text-xs sm:text-sm font-black block truncate ${netCash >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
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
              3. Utang & Piutang */}
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

              {/* 3. Utang & Piutang */}
              <div
                id="menu-utang-piutang"
                onClick={() => setActiveMenu('utang_piutang')}
                className="group p-5 rounded-3xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg active:scale-99"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b0c10] border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-amber-300 transition">
                      3. Utang &amp; Piutang
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Piutang, Kasbon Pegawai, Utang Supplier, dan Pinjaman.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-zinc-500 font-semibold">{tagihanList.length} Catatan</span>
                  <span className="font-bold text-amber-400 group-hover:underline">Buka Utang &amp; Piutang &rarr;</span>
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
                      <option value="bayar_pokok_pinjaman" className="bg-[#161823] text-white">Pembayaran Pokok Pinjaman</option>
                      <option value="konsumsi_pribadi" className="bg-[#161823] text-white">Prive (Penarikan Pribadi Pemilik)</option>
                    </>
                  ) : (
                    <>
                      <option value="modal_awal" className="bg-[#161823] text-white">Modal / Setoran Modal Awal</option>
                      <option value="suntikan_modal" className="bg-[#161823] text-white">Tambahan Modal (Owner / Investor)</option>
                      <option value="pinjaman_diterima" className="bg-[#161823] text-white">Pinjaman Diterima (Pihak Ketiga / Bank)</option>
                    </>
                  )
                )}
              </select>
            </div>

            {/* E. KHUSUS PEGAWAI JIKA GAJI */}
            {category === 'gaji_pegawai' && (
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
                          setDescription(`Gaji - ${emp.name} (${periodMonth})`);
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
          {/* Tabel Catatan Kas (Format Buku Kas: Tanggal | Kas Masuk | Kas Keluar | Saldo) */}

          {/* Tabel Catatan Kas (Format Buku Kas: Tanggal | Kas Masuk | Kas Keluar | Saldo) */}
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
            <div className="space-y-2">
              <div className="rounded-2xl sm:rounded-3xl bg-[#0b0c10] border border-white/10 shadow-2xl overflow-hidden">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-white/20 text-white font-bold text-xs sm:text-base bg-[#161823]/70">
                      <th className="py-3 sm:py-4 px-2 sm:px-5 w-[22%] text-left whitespace-nowrap">Tanggal</th>
                      <th className="py-3 sm:py-4 px-1.5 sm:px-4 w-[26%] text-right whitespace-nowrap">Kas Masuk</th>
                      <th className="py-3 sm:py-4 px-1.5 sm:px-4 w-[26%] text-right whitespace-nowrap">Kas Keluar</th>
                      <th className="py-3 sm:py-4 px-2 sm:px-5 w-[26%] text-right whitespace-nowrap">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white text-xs sm:text-base">
                    {catatanKasList.map(item => {
                      const isInflow = item.type === 'inflow';
                      const runningSaldo = runningBalanceMap.get(item.id) ?? item.amount;
                      const formattedAmount = formatRupiah(item.amount).replace(/\s/g, '');
                      const formattedSaldo = formatRupiah(runningSaldo).replace(/\s/g, '');

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedDetailItem(item)}
                          className="hover:bg-white/[0.08] active:bg-white/[0.14] transition-colors cursor-pointer group"
                          title="Klik untuk melihat keterangan & rincian transaksi"
                        >
                          <td className="py-3 sm:py-4 px-2 sm:px-5 font-semibold whitespace-nowrap text-white">
                            <div className="flex items-center gap-1 truncate">
                              <span>{formatTableDate(item.date)}</span>
                              {item.proofImageUrl && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#25F4EE] shrink-0" title="Ada foto bukti" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-1.5 sm:px-4 text-right whitespace-nowrap font-medium text-white truncate">
                            {isInflow ? (
                              <span className="text-[#25F4EE] font-semibold">{formattedAmount}</span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-1.5 sm:px-4 text-right whitespace-nowrap font-medium text-white truncate">
                            {!isInflow ? (
                              <span className="text-[#FE2C55] font-semibold">{formattedAmount}</span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-5 text-right whitespace-nowrap font-bold text-white truncate">
                            {formattedSaldo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {catatanKasList.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-white/20 bg-[#161823]/90 font-black text-xs sm:text-base">
                        <td className="py-3 sm:py-4 px-2 sm:px-5 text-white whitespace-nowrap">
                          Total
                        </td>
                        <td className="py-3 sm:py-4 px-1.5 sm:px-4 text-right text-[#25F4EE] whitespace-nowrap truncate">
                          +{formatRupiah(totalInflow).replace(/\s/g, '')}
                        </td>
                        <td className="py-3 sm:py-4 px-1.5 sm:px-4 text-right text-[#FE2C55] whitespace-nowrap truncate">
                          -{formatRupiah(totalOutflow).replace(/\s/g, '')}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-5 text-right text-white whitespace-nowrap truncate">
                          {formatRupiah(netCash).replace(/\s/g, '')}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <p className="text-[11px] text-zinc-400 px-1 flex items-center justify-between">
                <span>💡 Sentuh / klik baris transaksi untuk melihat keterangan &amp; detail.</span>
                <span className="text-zinc-500 hidden sm:inline">{catatanKasList.length} Transaksi</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          2. SUB MENU: RIWAYAT POS CASHFLOW (OPERASIONAL, INVESTASI, PENDANAAN)
          ========================================================================= */}
      {activeMenu === 'riwayat_pos' && (
        <div className="space-y-4">
          {activePosSub === 'menu' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setActiveMenu('hub')}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span>Menu Cashflow</span>
                </button>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Pilih Pos Cashflow:
                </h4>
              </div>

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
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-black text-white group-hover:text-[#25F4EE] transition">
                        Operasional
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {operasionalList.length} Transaksi Operasional
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Total Biaya:</span>
                    <span className="font-black text-[#FE2C55]">-{formatRupiah(totalBiayaOperasional)}</span>
                  </div>
                  <div className="text-right pt-1 border-t border-white/5">
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
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-black text-white group-hover:text-amber-400 transition">
                        Investasi
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {investasiList.length} Transaksi Aset
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Total Biaya:</span>
                    <span className="font-black text-[#FE2C55]">-{formatRupiah(totalBiayaInvestasi)}</span>
                  </div>
                  <div className="text-right pt-1 border-t border-white/5">
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
                        {pendanaanList.length} Transaksi Pendanaan (Modal, Pinjaman, Prive)
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
            <div className="space-y-3">
              {/* Ringkasan Total Biaya Operasional */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-[#25F4EE]/30 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-[#25F4EE]/30 text-[#25F4EE] flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-400">Total Biaya Operasional</div>
                    <div className="text-base sm:text-lg font-black text-[#FE2C55]">
                      -{formatRupiah(totalBiayaOperasional)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {totalMasukOperasional > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Kas Masuk Operasional</span>
                      <span className="font-black text-[#25F4EE]">+{formatRupiah(totalMasukOperasional)}</span>
                    </div>
                  )}
                  <div className="text-right pl-3 border-l border-white/10">
                    <span className="text-[10px] text-zinc-400 block">Jumlah Catatan</span>
                    <span className="font-black text-white">{operasionalList.length} Transaksi</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs font-bold text-zinc-400 px-1 gap-2">
                <span>Daftar Transaksi Operasional ({operasionalList.length}):</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#FE2C55]">
                    Total Biaya: -{formatRupiah(totalBiayaOperasional)}
                  </span>
                  {totalMasukOperasional > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-[#25F4EE]">
                        Masuk: +{formatRupiah(totalMasukOperasional)}
                      </span>
                    </>
                  )}
                </div>
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
            <div className="space-y-3">
              {/* Ringkasan Total Biaya Investasi */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] border border-amber-400/30 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-400">Total Biaya Investasi (Pembelian Aset)</div>
                    <div className="text-base sm:text-lg font-black text-[#FE2C55]">
                      -{formatRupiah(totalBiayaInvestasi)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {totalMasukInvestasi > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Penjualan Aset</span>
                      <span className="font-black text-amber-400">+{formatRupiah(totalMasukInvestasi)}</span>
                    </div>
                  )}
                  <div className="text-right pl-3 border-l border-white/10">
                    <span className="text-[10px] text-zinc-400 block">Jumlah Catatan</span>
                    <span className="font-black text-white">{investasiList.length} Transaksi</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs font-bold text-zinc-400 px-1 gap-2">
                <span>Daftar Transaksi Pembelian Aset ({investasiList.length}):</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#FE2C55]">
                    Total Biaya: -{formatRupiah(totalBiayaInvestasi)}
                  </span>
                  {totalMasukInvestasi > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400">
                        Masuk: +{formatRupiah(totalMasukInvestasi)}
                      </span>
                    </>
                  )}
                </div>
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

          {/* DAFTAR: POS PENDANAAN (HANYA MODAL, TAMBAHAN MODAL, PINJAMAN DITERIMA, POKOK PINJAMAN, DAN PRIVE) */}
          {activePosSub === 'pendanaan' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between text-xs font-bold text-zinc-400 px-1 gap-2">
                <span>Daftar Transaksi Pendanaan ({pendanaanList.length}):</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#25F4EE]">
                    Masuk: +{formatRupiah(pendanaanList.filter(i => i.type === 'inflow').reduce((a, b) => a + b.amount, 0))}
                  </span>
                  <span>•</span>
                  <span className="text-[#FE2C55]">
                    Keluar: -{formatRupiah(pendanaanList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0))}
                  </span>
                </div>
              </div>

              {pendanaanList.length === 0 ? (
                <div className="p-8 text-center bg-[#161823] rounded-2xl border border-white/10 text-zinc-500 text-xs space-y-2">
                  <p>Belum ada transaksi pos pendanaan (Modal, Tambahan Modal, Pinjaman Diterima, Pokok Pinjaman, atau Prive) pada periode ini.</p>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm('pendanaan');
                      setActiveMenu('input');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Input Kas Pendanaan
                  </button>
                </div>
              ) : (
                pendanaanList.map(item => {
                  const isInflow = item.type === 'inflow';
                  const catLabel = CATEGORY_LABELS[item.category] || item.category;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-purple-400/40 transition shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300" title="Tanggal Transaksi">
                            Tgl: {formatDateIndo(item.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/5 text-zinc-400 flex items-center gap-1" title="Tanggal & Waktu Input Transaksi">
                            <Clock className="w-2.5 h-2.5 text-purple-400" />
                            Input: {formatInputDateTime(item.createdAt, item.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-400/10 text-purple-400 border border-purple-400/30">
                            Pendanaan
                          </span>
                          <span className="text-xs text-zinc-300 font-bold">{catLabel}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {item.proofImageUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(item.proofImageUrl!)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400"
                              title="Lihat Bukti Nota"
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
                        <div className={`text-base font-black ${isInflow ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
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
        </div>
      )}

      {/* =========================================================================
          3. SUB MENU: UTANG & PIUTANG (PIUTANG, KASBON PEGAWAI, UTANG SUPPLIER, PINJAMAN)
          ========================================================================= */}
      {activeMenu === 'utang_piutang' && (
        <UtangPiutangSection
          currentUser={currentUser}
          employees={employees}
          tagihanList={tagihanList}
          onRefresh={loadData}
          onBackToMenu={() => setActiveMenu('hub')}
          onNotify={onNotify}
        />
      )}

      {/* Pop-up Detail Keterangan & Rincian Transaksi Catatan Kas */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-[9990] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#161823] rounded-3xl border border-white/10 p-5 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#25F4EE]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">Detail Transaksi Kas</h4>
                  <span className="text-[11px] text-zinc-400">
                    {formatDateIndo(selectedDetailItem.date)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Keterangan Transaksi (Fokus Utama yang Diminta User) */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#25F4EE] block">
                Keterangan Transaksi
              </span>
              <p className="text-base sm:text-lg font-black text-white leading-relaxed break-words">
                {selectedDetailItem.description || '-'}
              </p>
            </div>

            {/* Nominal & Saldo Kas */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                  {selectedDetailItem.type === 'inflow' ? 'Kas Masuk' : 'Kas Keluar'}
                </span>
                <span className={`text-base sm:text-lg font-black tracking-tight ${
                  selectedDetailItem.type === 'inflow' ? 'text-[#25F4EE]' : 'text-[#FE2C55]'
                }`}>
                  {selectedDetailItem.type === 'inflow' ? '+' : '-'}{formatRupiah(selectedDetailItem.amount)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5">
                <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">Saldo Berjalan</span>
                <span className="text-base sm:text-lg font-black text-white tracking-tight">
                  {formatRupiah(runningBalanceMap.get(selectedDetailItem.id) ?? selectedDetailItem.amount)}
                </span>
              </div>
            </div>

            {/* Detail Tambahan: Pos, Kategori, Waktu Input, Pegawai */}
            <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Pos Cashflow:</span>
                <div>{renderPillarBadge(getCashflowPillar(selectedDetailItem))}</div>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Kategori:</span>
                <span className="font-semibold text-right text-white">
                  {CATEGORY_LABELS[selectedDetailItem.category] || selectedDetailItem.category}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Waktu Input:</span>
                <span className="font-medium text-zinc-400">
                  {formatInputDateTime(selectedDetailItem.createdAt, selectedDetailItem.date)}
                </span>
              </div>
              {selectedDetailItem.employeeName && (
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">Pegawai Terkait:</span>
                  <span className="font-bold text-[#25F4EE]">{selectedDetailItem.employeeName}</span>
                </div>
              )}
            </div>

            {/* Bukti Foto Nota jika ada */}
            {selectedDetailItem.proofImageUrl && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bukti Nota:</span>
                <div
                  onClick={() => setPreviewPhotoUrl(selectedDetailItem.proofImageUrl!)}
                  className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer max-h-32 bg-black flex items-center justify-center"
                >
                  <img
                    src={selectedDetailItem.proofImageUrl}
                    alt="Bukti Nota"
                    className="max-h-32 w-full object-cover group-hover:opacity-80 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition">
                    <Eye className="w-4 h-4 mr-1 text-[#25F4EE]" />
                    Klik untuk Perbesar
                  </div>
                </div>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const item = selectedDetailItem;
                  setSelectedDetailItem(null);
                  handleDelete(item.id, item.description);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#FE2C55]/20 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = selectedDetailItem;
                  setSelectedDetailItem(null);
                  handleStartEdit(item);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-[#25F4EE]/20 text-[#25F4EE] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#25F4EE]/20 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
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
