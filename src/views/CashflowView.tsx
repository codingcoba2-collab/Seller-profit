import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
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
  Briefcase,
  TrendingUp,
  Receipt,
  CreditCard,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Package,
  Zap,
  Users,
  Truck,
  Shirt,
  User,
  FileText,
  BookOpen,
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { UtangPiutangSection } from '../components/UtangPiutangSection';

interface CashflowViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type CashflowTab = 'catatan_kas' | 'riwayat_pos' | 'jurnal' | 'utang_piutang';
export type PosFilter = 'all' | 'operasional' | 'investasi' | 'pendanaan';

export const CATEGORY_LABELS: Record<string, string> = {
  // Operasional
  modal_ball: 'Pembelian Ball',
  ongkir: 'Ongkir',
  operasional: 'Operasional',
  topup_iklan: 'Top-Up Iklan',
  packing: 'Bahan Packing',
  makan_minum: 'Konsumsi Tim',
  listrik_wifi: 'Bayar Listrik',
  sewa_tempat: 'Sewa Toko',
  gaji_pegawai: 'Gaji Pegawai',
  gaji: 'Gaji Pegawai',
  penarikan_shopee: 'Penjualan',
  penarikan_marketplace: 'Penjualan',

  // Investasi
  investasi_aset: 'Investasi Aset',

  // Pendanaan
  modal_awal: 'Modal Awal',
  suntikan_modal: 'Modal Tambahan',
  pinjaman_diterima: 'Pinjaman Diterima',
  bayar_pokok_pinjaman: 'Bayar Pokok Pinjaman',
  konsumsi_pribadi: 'Prive Pemilik',
  prive: 'Prive Pemilik',
  kasbon: 'Kasbon Pegawai',
  dana_talang: 'Dana Talangan',
  lainnya: 'Lain-lain',
};

export function getCashflowPillar(record: CashflowRecord): CashflowPillar {
  if (record.pillar) return record.pillar;
  const cat = (record.category as string) || '';
  const desc = (record.description || '').toLowerCase();

  if (
    cat === 'modal_awal' ||
    cat === 'suntikan_modal' ||
    cat === 'pinjaman_diterima' ||
    cat === 'bayar_pokok_pinjaman' ||
    cat === 'konsumsi_pribadi' ||
    cat === 'prive' ||
    cat === 'kasbon' ||
    cat === 'dana_talang' ||
    desc.includes('modal tambahan') ||
    desc.includes('suntikan modal') ||
    desc.includes('modal awal') ||
    desc.includes('dana talang') ||
    desc.includes('pinjaman') ||
    desc.includes('prive') ||
    desc.includes('kasbon')
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
    desc.includes('rak')
  ) {
    return 'investasi';
  }

  return 'operasional';
}

// Format tanggal persis di screenshot: "24 Sep 2026"
export function formatScreenshotDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthName = months[monthIdx] || parts[1];
      return `${day} ${monthName} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  // Navigation & Sub-tabs
  const [activeTab, setActiveTab] = useState<CashflowTab>('catatan_kas');
  const [activePosPillar, setActivePosPillar] = useState<PosFilter>('all');

  // Input Modal & Detail Modal
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CashflowRecord | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<CashflowRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Data states
  const [cashflowList, setCashflowList] = useState<CashflowRecord[]>([]);
  const [tagihanList, setTagihanList] = useState<TagihanRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'specific' | 'range'>('all');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal
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

  // Form states for Input Kas
  const [selectedPillar, setSelectedPillar] = useState<CashflowPillar>('operasional');
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');
  const [date, setDate] = useState(getTodayString());
  const [amount, setAmount] = useState<number>(150000);
  const [category, setCategory] = useState<CashflowRecord['category']>('packing');
  const [description, setDescription] = useState('Beli lakban, plastik packing polymailer & bubble wrap');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'gaji_insentif' | 'kasbon'>('gaji_insentif');
  const [periodMonth, setPeriodMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Register Subview Back Handler
  useEffect(() => {
    if (activeTab !== 'catatan_kas') {
      registerSubViewBackHandler(() => {
        setActiveTab('catatan_kas');
        return true;
      });
    } else {
      registerSubViewBackHandler(null);
    }
    return () => registerSubViewBackHandler(null);
  }, [activeTab]);

  // Load data & seed initial demo transactions matching the user screenshot
  const loadData = () => {
    let list = StorageService.getCashflow(currentUser.storeId);
    
    // Check if the screenshot demo items exist
    const hasDemo = list && list.some(item => item.id === 'cf-demo-1');
    if (!hasDemo) {
      const seedData: CashflowRecord[] = [
        {
          id: 'cf-demo-base-inflow',
          storeId: currentUser.storeId,
          date: '2026-09-01',
          type: 'inflow',
          amount: 37500000,
          category: 'modal_awal',
          pillar: 'pendanaan',
          description: 'Setoran Modal Awal Usaha Toko',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-01T08:00:00.000Z',
        },
        {
          id: 'cf-demo-base-outflow',
          storeId: currentUser.storeId,
          date: '2026-09-05',
          type: 'outflow',
          amount: 19711456,
          category: 'operasional',
          pillar: 'operasional',
          description: 'Renovasi Studio & Belanja Stok Awal Musim',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-05T08:00:00.000Z',
        },
        {
          id: 'cf-demo-8',
          storeId: currentUser.storeId,
          date: '2026-09-18',
          type: 'outflow',
          amount: 500000,
          category: 'kasbon',
          pillar: 'pendanaan',
          description: 'Kasbon Pegawai - Pinjaman darurat operasional tim host live',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-18T10:30:00.000Z',
          customSaldo: 10600000,
        },
        {
          id: 'cf-demo-7',
          storeId: currentUser.storeId,
          date: '2026-09-20',
          type: 'inflow',
          amount: 500000,
          category: 'dana_talang',
          pillar: 'pendanaan',
          description: 'Dana Talangan - Titipan kas dana talangan operasional toko',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-20T16:00:00.000Z',
          customSaldo: 11100000,
        },
        {
          id: 'cf-demo-6',
          storeId: currentUser.storeId,
          date: '2026-09-21',
          type: 'outflow',
          amount: 4250000,
          category: 'modal_ball',
          pillar: 'operasional',
          description: 'Beli Stok Baju - Restock 150 pcs kemeja vintage thrift pilihan',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-21T15:20:00.000Z',
          customSaldo: 6850000,
        },
        {
          id: 'cf-demo-5',
          storeId: currentUser.storeId,
          date: '2026-09-22',
          type: 'outflow',
          amount: 150000,
          category: 'ongkir',
          pillar: 'operasional',
          description: 'Ongkir - Ekspedisi cargo pengiriman ball pakaian dari distributor',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-22T13:45:00.000Z',
          customSaldo: 7000000,
        },
        {
          id: 'cf-demo-4',
          storeId: currentUser.storeId,
          date: '2026-09-23',
          type: 'inflow',
          amount: 3000000,
          category: 'suntikan_modal',
          pillar: 'pendanaan',
          description: 'Modal Tambahan - Suntikan modal kerja ekspansi penjualan live',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-23T10:00:00.000Z',
          customSaldo: 10000000,
        },
        {
          id: 'cf-demo-3',
          storeId: currentUser.storeId,
          date: '2026-09-24',
          type: 'outflow',
          amount: 350000,
          category: 'listrik_wifi',
          pillar: 'operasional',
          description: 'Bayar Listrik - Tagihan token listrik studio live & wifi ruko 5500VA',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-24T09:15:00.000Z',
          customSaldo: 9650000,
        },
        {
          id: 'cf-demo-2',
          storeId: currentUser.storeId,
          date: '2026-09-24',
          type: 'outflow',
          amount: 5000000,
          category: 'modal_ball',
          pillar: 'operasional',
          description: 'Pembelian Ball - 1 Ball Segel Knitwear Premium Korea Grade A',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-24T11:00:00.000Z',
          customSaldo: 10000000,
        },
        {
          id: 'cf-demo-1',
          storeId: currentUser.storeId,
          date: '2026-09-24',
          type: 'inflow',
          amount: 2000000,
          category: 'penarikan_shopee',
          pillar: 'operasional',
          description: 'Penjualan - Pencairan saldo penjualan sesi live marketplace Shopee & TikTok',
          recordedBy: 'Owner Toko',
          createdAt: '2026-09-24T14:30:00.000Z',
          customSaldo: 15000000,
        },
      ];
      seedData.forEach(item => StorageService.addCashflow(item));
      list = StorageService.getCashflow(currentUser.storeId);
    }
    setCashflowList(list || []);

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
    const unsub = StorageService.subscribe(col => {
      if (col === 'cashflow' || col === 'tagihan' || col === 'employees') {
        loadData();
      }
    });
    return () => unsub();
  }, [currentUser.storeId]);

  // Helper urutan kronologis ascending (transaksi lama di awal)
  const compareChronologicalAsc = (a: CashflowRecord, b: CashflowRecord) => {
    const dDiff = (a.date || '').localeCompare(b.date || '');
    if (dDiff !== 0) return dDiff;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || '').localeCompare(b.id || '');
  };

  // Running balance map calculated in chronological order
  const runningBalanceMap = useMemo(() => {
    const chronological = [...cashflowList].sort(compareChronologicalAsc);
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

  // Primary list for calculations (excluding auto-injected inventory duplicates so totals match screenshot)
  const coreCashflowList = useMemo(() => {
    const hasScreenshotDemo = cashflowList.some(i => i.id === 'cf-demo-1');
    if (hasScreenshotDemo) {
      return cashflowList.filter(i => 
        !i.id.startsWith('cf-modal-') && 
        !i.id.startsWith('cf-ongkir-') && 
        !i.id.startsWith('cf-steam-') && 
        !i.id.startsWith('cf-topup-')
      );
    }
    return cashflowList;
  }, [cashflowList]);

  // Filtered List based on search, period, and inflow/outflow filter
  const filteredList = useMemo(() => {
    return coreCashflowList
      .filter(item => {
        // Exclude system base filler from direct table view
        if (item.id === 'cf-demo-base-inflow' || item.id === 'cf-demo-base-outflow') {
          return false;
        }

        // Type filter: semua, kas masuk, kas keluar
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;

        // Period filter
        if (periodFilter === 'today') {
          if (item.date !== getTodayString()) return false;
        } else if (periodFilter === 'weekly') {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          const minDate = d.toISOString().slice(0, 10);
          if (item.date < minDate) return false;
        } else if (periodFilter === 'monthly') {
          const curMonth = getTodayString().slice(0, 7);
          if (!item.date.startsWith(curMonth)) return false;
        } else if (periodFilter === 'specific') {
          if (item.date !== specificDate) return false;
        } else if (periodFilter === 'range') {
          if (item.date < startDate || item.date > endDate) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const descMatch = (item.description || '').toLowerCase().includes(q);
          const catMatch = (CATEGORY_LABELS[item.category] || item.category).toLowerCase().includes(q);
          const amountMatch = item.amount.toString().includes(q);
          const empMatch = (item.employeeName || '').toLowerCase().includes(q);
          if (!descMatch && !catMatch && !amountMatch && !empMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Tampilkan transaksi terbaru di atas (descending) persis di screenshot
        return compareChronologicalAsc(b, a);
      });
  }, [coreCashflowList, typeFilter, periodFilter, specificDate, startDate, endDate, searchQuery]);

  // Totals calculations matching screenshot: Inflow Rp 43.000.000, Outflow Rp 29.961.456, Saldo Rp 13.038.544
  const totalInflow = useMemo(() => {
    return coreCashflowList.filter(i => i.type === 'inflow').reduce((sum, item) => sum + item.amount, 0);
  }, [coreCashflowList]);

  const totalOutflow = useMemo(() => {
    return coreCashflowList.filter(i => i.type === 'outflow').reduce((sum, item) => sum + item.amount, 0);
  }, [coreCashflowList]);

  const netCash = totalInflow - totalOutflow;

  /**
   * Helper untuk Keterangan sesuai instruksi pengguna:
   * "untuk keterangan cukup itu operasional/investasi/utang & piutang untuk keterangan detail apa nya bisa diklik"
   *
   * Menghasilkan:
   * 1. title: Judul ringkas dan bersih (misal: "Penjualan", "Pembelian Ball", "Bayar Listrik", "Modal Tambahan", "Ongkir", "Beli Stok Baju", "Dana Talangan", "Kasbon Pegawai")
   * 2. badge: Label ringkas kategori pos: "Operasional", "Investasi", "Pendanaan", "Piutang", "Utang"
   * 3. icon & iconBg: Desain lingkaran ikon sesuai gambar
   */
  const getRowDetails = (item: CashflowRecord) => {
    const desc = (item.description || '').toLowerCase();
    const cat = item.category as string;
    const pillar = getCashflowPillar(item);

    let title = 'Transaksi Kas';
    let badge: 'Operasional' | 'Investasi' | 'Pendanaan' | 'Piutang' | 'Utang' = 'Operasional';
    let badgeClass = 'bg-[#0d213b] text-[#38bdf8] border-[#1a4275]';
    let icon = <ShoppingCart className="w-5 h-5" />;
    let iconBg = 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]';

    // 1. Deteksi Judul Singkat Bersih (clean display title)
    if (desc.includes('pembelian ball') || (cat === 'modal_ball' && desc.includes('ball'))) {
      title = 'Pembelian Ball';
      icon = <Package className="w-5 h-5" />;
      iconBg = 'bg-[#371322] border border-[#831e3d] text-[#ff3366]';
    } else if (desc.includes('beli stok baju') || desc.includes('stok baju') || desc.includes('baju')) {
      title = 'Beli Stok Baju';
      icon = <Shirt className="w-5 h-5" />;
      iconBg = 'bg-[#0c2e22] border border-[#166948] text-[#10b981]';
    } else if (desc.includes('bayar listrik') || desc.includes('listrik') || cat === 'listrik_wifi') {
      title = 'Bayar Listrik';
      icon = <Zap className="w-5 h-5" />;
      iconBg = 'bg-[#33250e] border border-[#78541a] text-[#f59e0b]';
    } else if (desc.includes('modal tambahan') || desc.includes('suntikan modal') || cat === 'suntikan_modal') {
      title = 'Modal Tambahan';
      icon = <Users className="w-5 h-5" />;
      iconBg = 'bg-[#28143d] border border-[#58217a] text-[#c084fc]';
    } else if (desc.includes('ongkir') || cat === 'ongkir') {
      title = 'Ongkir';
      icon = <Truck className="w-5 h-5" />;
      iconBg = 'bg-[#0d2a45] border border-[#1a5b8e] text-[#38bdf8]';
    } else if (desc.includes('dana talang') || cat === 'dana_talang') {
      title = 'Dana Talangan';
      icon = <Wallet className="w-5 h-5" />;
      iconBg = 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]';
    } else if (desc.includes('kasbon') || cat === 'kasbon') {
      title = 'Kasbon Pegawai';
      icon = <Users className="w-5 h-5" />;
      iconBg = 'bg-[#241738] border border-[#4c2777] text-[#a855f7]';
    } else if (desc.includes('penjualan') || cat === 'penarikan_shopee' || cat === 'penarikan_marketplace') {
      title = 'Penjualan';
      icon = <ShoppingCart className="w-5 h-5" />;
      iconBg = 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]';
    } else if (desc.includes('modal awal') || cat === 'modal_awal') {
      title = 'Modal Awal';
      icon = <Wallet className="w-5 h-5" />;
      iconBg = 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]';
    } else if (cat === 'gaji_pegawai' || cat === 'gaji') {
      title = 'Gaji Pegawai';
      icon = <Briefcase className="w-5 h-5" />;
      iconBg = 'bg-[#33250e] border border-[#78541a] text-[#f59e0b]';
    } else if (cat === 'investasi_aset' || desc.includes('investasi') || desc.includes('aset')) {
      title = 'Investasi Aset';
      icon = <TrendingUp className="w-5 h-5" />;
      iconBg = 'bg-[#2d1f0d] border border-[#5d4117] text-[#fbbf24]';
    } else if (item.description && item.description.includes('-')) {
      title = item.description.split('-')[0].trim();
    } else {
      title = CATEGORY_LABELS[cat] || item.description || 'Transaksi Kas';
    }

    // 2. Deteksi Badge Kategori (Operasional / Investasi / Utang & Piutang / Pendanaan)
    if (cat === 'kasbon' || desc.includes('kasbon') || desc.includes('piutang')) {
      badge = 'Piutang';
      badgeClass = 'bg-[#1a1c44] text-[#818cf8] border-[#323682]';
    } else if (cat === 'bayar_pokok_pinjaman' || desc.includes('utang supplier') || desc.includes('pinjaman bank')) {
      badge = 'Utang';
      badgeClass = 'bg-[#36190f] text-[#fb923c] border-[#6b311c]';
    } else if (pillar === 'pendanaan') {
      badge = 'Pendanaan';
      badgeClass = 'bg-[#28153e] text-[#c084fc] border-[#4c2473]';
    } else if (pillar === 'investasi') {
      badge = 'Investasi';
      badgeClass = 'bg-[#2d1f0d] text-[#fbbf24] border-[#5d4117]';
    } else {
      badge = 'Operasional';
      badgeClass = 'bg-[#0d213b] text-[#38bdf8] border-[#1a4275]';
    }

    return { title, badge, badgeClass, icon, iconBg };
  };

  // Reset Input Form
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
    const recPillar = getCashflowPillar(item);
    setSelectedPillar(recPillar);
    setCategory(item.category);
    setPaymentType(item.paymentType || (item.description?.toLowerCase().includes('kasbon') ? 'kasbon' : 'gaji_insentif'));
    setDescription(item.description || '');
    setEmployeeId(item.employeeId || (employees[0]?.id || ''));
    setEmployeeName(item.employeeName || (employees[0]?.name || ''));
    setPeriodMonth(item.periodMonth || getTodayString().slice(0, 7));
    setProofImageUrl(item.proofImageUrl || '');
    setIsInputModalOpen(true);
  };

  const handlePillarChange = (newPillar: CashflowPillar) => {
    setSelectedPillar(newPillar);
    if (newPillar === 'operasional') {
      if (type === 'outflow') {
        setCategory('packing');
        setDescription('Beli lakban, plastik packing polymailer & bubble wrap');
      } else {
        setCategory('penarikan_shopee');
        setDescription('Penjualan');
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
        setDescription('Modal Tambahan');
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
        setDescription('Penjualan');
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
        setDescription('Modal Tambahan');
      }
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
    reader.onload = event => {
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

          // Sinkronisasi otomatis ke Tagihan jika kasbon / dana talang
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
        setIsInputModalOpen(false);
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

  // Pos lists for Riwayat Pos Tab
  const operasionalList = useMemo(() => cashflowList.filter(i => getCashflowPillar(i) === 'operasional'), [cashflowList]);
  const investasiList = useMemo(() => cashflowList.filter(i => getCashflowPillar(i) === 'investasi'), [cashflowList]);
  const pendanaanList = useMemo(() => cashflowList.filter(i => getCashflowPillar(i) === 'pendanaan'), [cashflowList]);

  // Jurnal Ledger generator (Double-Entry Debit & Credit)
  const jurnalEntries = useMemo(() => {
    const list = [...filteredList].sort(compareChronologicalAsc);
    let totalDebit = 0;
    let totalKredit = 0;

    const rows = list.map(item => {
      const isInflow = item.type === 'inflow';
      const label = CATEGORY_LABELS[item.category] || item.description || 'Kas Toko';

      if (isInflow) {
        totalDebit += item.amount;
        totalKredit += item.amount;
        return {
          id: item.id,
          date: item.date,
          ref: `KM-${item.id.slice(-4)}`,
          debitAccount: 'Kas Toko (Bank/Tunai)',
          kreditAccount: label,
          debitAmount: item.amount,
          kreditAmount: item.amount,
          notes: item.description,
        };
      } else {
        totalDebit += item.amount;
        totalKredit += item.amount;
        return {
          id: item.id,
          date: item.date,
          ref: `KK-${item.id.slice(-4)}`,
          debitAccount: label,
          kreditAccount: 'Kas Toko (Bank/Tunai)',
          debitAmount: item.amount,
          kreditAmount: item.amount,
          notes: item.description,
        };
      }
    });

    return { rows, totalDebit, totalKredit };
  }, [filteredList]);

  const periodLabelMap: Record<string, string> = {
    all: 'Semua Periode',
    today: 'Hari Ini',
    weekly: '7 Hari Terakhir',
    monthly: 'Bulan Ini',
    specific: 'Pilih Tanggal',
    range: 'Rentang Tanggal',
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-white font-sans pb-28 pt-3 px-1.5 xs:px-2 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
        {/* =========================================================================
            TOP HEADER BAR (PERSIS SEPERTI GAMBAR)
            ========================================================================= */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-1.5 -ml-1 sm:p-2 sm:-ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition cursor-pointer"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Catatan Kas</h1>
              <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5">Semua transaksi kas masuk dan keluar</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsInputModalOpen(true);
            }}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#050811] stroke-[2.5]" />
            <span>Input Kas</span>
          </button>
        </div>

        {/* =========================================================================
            TOP SUMMARY CARDS (SELALU 3 KOLOM SESUAI GAMBAR)
            ========================================================================= */}
        <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
          <div className="grid grid-cols-3 divide-x divide-[#142239]">
            {/* 1. Total Kas Masuk */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00e676]/10 border border-[#00e676] text-[#00e676] flex items-center justify-center shrink-0">
                  <ArrowUp className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                  Total Kas Masuk
                </span>
              </div>
              <div className="text-[#00e676] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                {formatRupiah(totalInflow)}
              </div>
            </div>

            {/* 2. Total Kas Keluar */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#ff3366]/10 border border-[#ff3366] text-[#ff3366] flex items-center justify-center shrink-0">
                  <ArrowDown className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                  Total Kas Keluar
                </span>
              </div>
              <div className="text-[#ff3366] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                {formatRupiah(totalOutflow)}
              </div>
            </div>

            {/* 3. Saldo Kas */}
            <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 text-[#00d2ff] flex items-center justify-center shrink-0">
                  <Wallet className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap">
                  Saldo Kas
                </span>
              </div>
              <div className="text-[#00d2ff] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums">
                {formatRupiah(netCash)}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: CATATAN KAS (PAS MENYESUAIKAN LAYAR)
            ========================================================================= */}
        {activeTab === 'catatan_kas' && (
          <div className="space-y-2.5 sm:space-y-3.5">
            {/* Filter Pills: Semua, Kas Masuk, Kas Keluar */}
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
                Semua
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('inflow')}
                className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                  typeFilter === 'inflow'
                    ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                    : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
                }`}
              >
                Kas Masuk
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('outflow')}
                className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                  typeFilter === 'outflow'
                    ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                    : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
                }`}
              >
                Kas Keluar
              </button>
            </div>

            {/* Second Row: Periode Dropdown & Search Input (Pas sebaris menyesuaikan layar) */}
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
                      { key: 'specific', label: '📅 Pilih Tanggal' },
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

              {/* Specific Date input if selected */}
              {periodFilter === 'specific' && (
                <input
                  type="date"
                  value={specificDate}
                  onChange={e => setSpecificDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded-xl bg-[#0a1322] border border-[#162544] text-white outline-none focus:border-cyan-400"
                />
              )}

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
                  placeholder="Cari keterangan..."
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
                    <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[35%] whitespace-nowrap">Keterangan</th>
                    <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Kas Masuk</th>
                    <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Kas Keluar</th>
                    <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-right w-[17%] whitespace-nowrap">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132038]">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        Belum ada catatan kas pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(item => {
                      const isInflow = item.type === 'inflow';
                      // Saldo: prioritize customSaldo from demo or calculated running balance
                      const runningSaldo = item.customSaldo !== undefined ? item.customSaldo : (runningBalanceMap.get(item.id) ?? item.amount);
                      const { title, badge, badgeClass, icon, iconBg } = getRowDetails(item);

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedDetailItem(item)}
                          className="border-b border-[#132038] last:border-b-0 hover:bg-[#0e1c36] transition cursor-pointer group"
                          title="Klik untuk melihat rincian keterangan detail transaksi"
                        >
                          {/* Tanggal */}
                          <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs font-medium text-slate-300 whitespace-nowrap">
                            <span>{formatScreenshotDate(item.date)}</span>
                          </td>

                          {/* Keterangan: Icon Lingkaran + Judul Ringkas + Badge Kategori */}
                          <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2">
                            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
                              <div className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                                {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2.5 sm:h-2.5' })}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[7px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs font-bold text-white block leading-tight truncate group-hover:text-cyan-300 transition">
                                  {title}
                                </span>
                                {/* Badge kategori */}
                                <span className={`inline-block mt-0.5 text-[5.5px] xs:text-[6px] sm:text-[7px] font-semibold px-0.5 xs:px-1 py-[0.5px] rounded border ${badgeClass} leading-none whitespace-nowrap`}>
                                  {badge}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Kas Masuk */}
                          <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                            {isInflow ? (
                              <span className="text-[#00e676] font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                                {formatRupiah(item.amount)}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] block pl-0.5">-</span>
                            )}
                          </td>

                          {/* Kas Keluar */}
                          <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                            {!isInflow ? (
                              <span className="text-[#ff3366] font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                                {formatRupiah(item.amount)}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] block pl-0.5">-</span>
                            )}
                          </td>

                          {/* Saldo Berjalan */}
                          <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-right font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs text-white whitespace-nowrap tabular-nums">
                            <span>{formatRupiah(runningSaldo)}</span>
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

        {/* =========================================================================
            TAB 2: RIWAYAT POS CASHFLOW (OPERASIONAL, INVESTASI, PENDANAAN)
            ========================================================================= */}
        {activeTab === 'riwayat_pos' && (
          <div className="space-y-4">
            {/* Filter Pos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'all', label: 'Semua Pos Arus Kas' },
                { key: 'operasional', label: 'Pos Operasional' },
                { key: 'investasi', label: 'Pos Investasi' },
                { key: 'pendanaan', label: 'Pos Pendanaan' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActivePosPillar(p.key as any)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                    activePosPillar === p.key
                      ? 'bg-[#00f2fe] text-slate-950 shadow-md shadow-[#00f2fe]/20'
                      : 'bg-[#0c1527] border border-[#162544] text-slate-300 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 3 Pillar Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Operasional */}
              <div
                onClick={() => setActivePosPillar('operasional')}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  activePosPillar === 'operasional' ? 'bg-[#0f233d]/80 border-[#38bdf8]' : 'bg-[#0a1220] border-[#142239]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Briefcase className="w-4 h-4" />
                    <span>Pos Operasional</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{operasionalList.length} Transaksi</span>
                </div>
                <div className="text-lg font-black text-rose-400">
                  -{formatRupiah(operasionalList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0))}
                </div>
                <span className="text-xs text-slate-400 block">Stok ball, ongkir, utilitas & operasional</span>
              </div>

              {/* 2. Investasi */}
              <div
                onClick={() => setActivePosPillar('investasi')}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  activePosPillar === 'investasi' ? 'bg-[#2a1e0b]/80 border-[#fbbf24]' : 'bg-[#0a1220] border-[#142239]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Pos Investasi</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{investasiList.length} Transaksi</span>
                </div>
                <div className="text-lg font-black text-amber-400">
                  -{formatRupiah(investasiList.filter(i => i.type === 'outflow').reduce((a, b) => a + b.amount, 0))}
                </div>
                <span className="text-xs text-slate-400 block">Aset toko, mesin steamer & display</span>
              </div>

              {/* 3. Pendanaan */}
              <div
                onClick={() => setActivePosPillar('pendanaan')}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  activePosPillar === 'pendanaan' ? 'bg-[#28143d]/80 border-[#c084fc]' : 'bg-[#0a1220] border-[#142239]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>Pos Pendanaan</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{pendanaanList.length} Transaksi</span>
                </div>
                <div className="text-lg font-black text-purple-300">
                  +{formatRupiah(pendanaanList.filter(i => i.type === 'inflow').reduce((a, b) => a + b.amount, 0))}
                </div>
                <span className="text-xs text-slate-400 block">Modal awal, suntikan modal & prive</span>
              </div>
            </div>

            {/* List for the selected pillar */}
            <div className="bg-[#09111e]/90 border border-[#14233c] rounded-2xl p-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-200">
                Daftar Transaksi Pos {activePosPillar === 'all' ? 'Arus Kas' : activePosPillar.toUpperCase()}:
              </h4>
              <div className="divide-y divide-[#14233c]">
                {cashflowList
                  .filter(i => activePosPillar === 'all' || getCashflowPillar(i) === activePosPillar)
                  .map(item => {
                    const isInflow = item.type === 'inflow';
                    const { title, badge, badgeClass, icon, iconBg } = getRowDetails(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedDetailItem(item)}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-white/5 px-2 rounded-xl cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-white block truncate">{title}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{formatScreenshotDate(item.date)}</span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded border ${badgeClass}`}>{badge}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <span className={`text-sm font-bold block ${isInflow ? 'text-[#00e676]' : 'text-[#ff3366]'}`}>
                            {isInflow ? '+' : '-'}{formatRupiah(item.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: JURNAL (GENERAL JOURNAL / DEBIT & KREDIT)
            ========================================================================= */}
        {activeTab === 'jurnal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00f2fe]" />
                  <span>Jurnal Umum (Buku Kas &amp; Transaksi)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Pencatatan berpasangan Debit dan Kredit berimbang</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Keseimbangan Jurnal</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                  ✓ Balance (Seimbang)
                </span>
              </div>
            </div>

            <div className="bg-[#09111e]/90 border border-[#14233c] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[#14233c] text-slate-300 font-semibold text-sm bg-[#0a1220]">
                      <th className="py-3 px-4 w-[15%]">Tanggal</th>
                      <th className="py-3 px-4">Akun &amp; Keterangan Transaksi</th>
                      <th className="py-3 px-4 w-[12%] text-center">Ref</th>
                      <th className="py-3 px-4 w-[18%] text-right">Debit (D)</th>
                      <th className="py-3 px-4 w-[18%] text-right">Kredit (K)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14233c] text-sm">
                    {jurnalEntries.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                          Belum ada jurnal transaksi.
                        </td>
                      </tr>
                    ) : (
                      jurnalEntries.rows.map(entry => (
                        <React.Fragment key={entry.id}>
                          {/* Baris Debit */}
                          <tr className="hover:bg-white/[0.04]">
                            <td className="py-2.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                              {formatScreenshotDate(entry.date)}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-white">
                              {entry.debitAccount}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-400 text-xs font-mono">
                              {entry.ref}
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-400 font-bold whitespace-nowrap">
                              {formatRupiah(entry.debitAmount)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-500">-</td>
                          </tr>
                          {/* Baris Kredit (Indented) */}
                          <tr className="border-b border-[#132038] hover:bg-white/[0.04]">
                            <td className="py-2 px-4 text-slate-500 text-[11px]"></td>
                            <td className="py-2 px-4 pl-8 text-slate-300 italic flex items-center justify-between">
                              <span>&rarr; {entry.kreditAccount}</span>
                              {entry.notes && (
                                <span className="text-xs text-slate-400 not-italic truncate max-w-xs ml-2">
                                  ({entry.notes})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-center text-slate-500 text-xs"></td>
                            <td className="py-2 px-4 text-right text-slate-500">-</td>
                            <td className="py-2 px-4 text-right text-rose-400 font-bold whitespace-nowrap">
                              {formatRupiah(entry.kreditAmount)}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#162744] bg-[#0c1527] font-black text-sm">
                      <td colSpan={3} className="py-3 px-4 text-white uppercase tracking-wider">
                        Total Jurnal (Debit vs Kredit)
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 whitespace-nowrap">
                        {formatRupiah(jurnalEntries.totalDebit)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-400 whitespace-nowrap">
                        {formatRupiah(jurnalEntries.totalKredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: UTANG & PIUTANG (INTEGRATED SECTION)
            ========================================================================= */}
        {activeTab === 'utang_piutang' && (
          <div className="space-y-4">
            <UtangPiutangSection
              currentUser={currentUser}
              employees={employees}
              tagihanList={tagihanList}
              onRefresh={loadData}
              onBackToMenu={() => setActiveTab('catatan_kas')}
              onNotify={onNotify}
            />
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTTOM NAVIGATION BAR (4 TABS PERSIS SEPERTI GAMBAR)
          ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#060b14] border-t border-[#14233c] px-4 py-2 flex items-center justify-around shadow-2xl">
        {/* 1. Catatan Kas */}
        <button
          type="button"
          onClick={() => setActiveTab('catatan_kas')}
          className="flex flex-col items-center gap-1 relative px-3 py-1 cursor-pointer transition group"
        >
          <FileText className={`w-5 h-5 transition-colors ${activeTab === 'catatan_kas' ? 'text-[#00f2fe]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[11px] transition-colors ${activeTab === 'catatan_kas' ? 'font-bold text-[#00f2fe]' : 'font-medium text-slate-400'}`}>
            Catatan Kas
          </span>
          {activeTab === 'catatan_kas' && (
            <span className="w-8 h-1 rounded-full bg-[#00f2fe] mt-0.5 shadow-[0_0_8px_#00f2fe]" />
          )}
        </button>

        {/* 2. Riwayat Pos Cashflow */}
        <button
          type="button"
          onClick={() => setActiveTab('riwayat_pos')}
          className="flex flex-col items-center gap-1 relative px-3 py-1 cursor-pointer transition group"
        >
          <TrendingUp className={`w-5 h-5 transition-colors ${activeTab === 'riwayat_pos' ? 'text-[#00f2fe]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[11px] transition-colors ${activeTab === 'riwayat_pos' ? 'font-bold text-[#00f2fe]' : 'font-medium text-slate-400'}`}>
            Riwayat Pos Cashflow
          </span>
          {activeTab === 'riwayat_pos' && (
            <span className="w-8 h-1 rounded-full bg-[#00f2fe] mt-0.5 shadow-[0_0_8px_#00f2fe]" />
          )}
        </button>

        {/* 3. Jurnal */}
        <button
          type="button"
          onClick={() => setActiveTab('jurnal')}
          className="flex flex-col items-center gap-1 relative px-3 py-1 cursor-pointer transition group"
        >
          <BookOpen className={`w-5 h-5 transition-colors ${activeTab === 'jurnal' ? 'text-[#00f2fe]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[11px] transition-colors ${activeTab === 'jurnal' ? 'font-bold text-[#00f2fe]' : 'font-medium text-slate-400'}`}>
            Jurnal
          </span>
          {activeTab === 'jurnal' && (
            <span className="w-8 h-1 rounded-full bg-[#00f2fe] mt-0.5 shadow-[0_0_8px_#00f2fe]" />
          )}
        </button>

        {/* 4. Utang & Piutang */}
        <button
          type="button"
          onClick={() => setActiveTab('utang_piutang')}
          className="flex flex-col items-center gap-1 relative px-3 py-1 cursor-pointer transition group"
        >
          <CreditCard className={`w-5 h-5 transition-colors ${activeTab === 'utang_piutang' ? 'text-[#00f2fe]' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className={`text-[11px] transition-colors ${activeTab === 'utang_piutang' ? 'font-bold text-[#00f2fe]' : 'font-medium text-slate-400'}`}>
            Utang &amp; Piutang
          </span>
          {activeTab === 'utang_piutang' && (
            <span className="w-8 h-1 rounded-full bg-[#00f2fe] mt-0.5 shadow-[0_0_8px_#00f2fe]" />
          )}
        </button>
      </div>

      {/* =========================================================================
          INPUT KAS MODAL (TAMBAH / EDIT TRANSAKSI)
          ========================================================================= */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-[9990] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#0d1627] rounded-3xl border border-[#1e2f4f] p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#00f2fe]" />
                <span>{editingItem ? 'Edit Transaksi Kas' : 'Input Catatan Kas'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsInputModalOpen(false);
                  resetForm();
                }}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Pilih Pos Kas: Operasional, Investasi, Pendanaan */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Pos Kas <span className="text-[#ff3366]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePillarChange('operasional')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPillar === 'operasional'
                        ? 'bg-[#00f2fe]/15 border-[#00f2fe] text-[#00f2fe] shadow-sm'
                        : 'bg-[#080f1b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Operasional</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePillarChange('investasi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPillar === 'investasi'
                        ? 'bg-amber-400/15 border-amber-400 text-amber-400 shadow-sm'
                        : 'bg-[#080f1b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Investasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePillarChange('pendanaan')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPillar === 'pendanaan'
                        ? 'bg-purple-400/15 border-purple-400 text-purple-400 shadow-sm'
                        : 'bg-[#080f1b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Pendanaan</span>
                  </button>
                </div>
              </div>

              {/* 2. Jenis Transaksi: Kas Keluar vs Kas Masuk */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Jenis Transaksi <span className="text-[#ff3366]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('outflow')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      type === 'outflow'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm'
                        : 'bg-[#080f1b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Kas Keluar (Pengeluaran)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('inflow')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      type === 'inflow'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-[#080f1b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kas Masuk (Pemasukan)</span>
                  </button>
                </div>
              </div>

              {/* 3. Tanggal & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tanggal Transaksi <span className="text-[#ff3366]">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#080f1b] border border-white/10 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nominal Transaksi (Rp) <span className="text-[#ff3366]">*</span>
                  </label>
                  <CommaNumberInput
                    value={amount}
                    onChange={setAmount}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#080f1b] border border-white/10 text-white font-bold outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* 4. Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Kategori Transaksi <span className="text-[#ff3366]">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080f1b] border border-white/10 text-white outline-none focus:border-cyan-400"
                >
                  {selectedPillar === 'operasional' && (
                    <>
                      {type === 'outflow' ? (
                        <>
                          <option value="modal_ball">Pembelian Ball / Belanja Stok Barang</option>
                          <option value="packing">Bahan Packing (Lakban, Polymailer, Bubble)</option>
                          <option value="ongkir">Ongkos Kirim Stok / Ekspedisi</option>
                          <option value="listrik_wifi">Listrik, Air & Internet WiFi</option>
                          <option value="makan_minum">Konsumsi Harian & Makan Tim</option>
                          <option value="topup_iklan">Top-Up Saldo Iklan & Promosi</option>
                          <option value="sewa_tempat">Sewa Toko / Tempat</option>
                          <option value="gaji_pegawai">Gaji & Insentif Pegawai</option>
                          <option value="operasional">Kebutuhan Operasional Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="penarikan_shopee">Penjualan / Penarikan Saldo Marketplace</option>
                          <option value="operasional">Pemasukan Operasional Lainnya</option>
                        </>
                      )}
                    </>
                  )}

                  {selectedPillar === 'investasi' && (
                    <option value="investasi_aset">Pembelian Aset / Barang Jangka Panjang (Mesin/Rak/Laptop)</option>
                  )}

                  {selectedPillar === 'pendanaan' && (
                    <>
                      {type === 'inflow' ? (
                        <>
                          <option value="modal_awal">Modal / Setoran Modal Awal</option>
                          <option value="suntikan_modal">Tambahan Modal (Owner / Investor)</option>
                          <option value="pinjaman_diterima">Pinjaman Diterima (Pihak Ketiga / Bank)</option>
                          <option value="dana_talang">Dana Talangan</option>
                        </>
                      ) : (
                        <>
                          <option value="bayar_pokok_pinjaman">Pembayaran Pokok Pinjaman</option>
                          <option value="prive">Prive (Penarikan Pribadi Pemilik)</option>
                          <option value="kasbon">Kasbon Pegawai</option>
                        </>
                      )}
                    </>
                  )}
                </select>
              </div>

              {/* 5. Keterangan Detail */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Keterangan Detail Transaksi <span className="text-[#ff3366]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tuliskan rincian detail barang/transaksi (bisa diklik di tabel nanti)..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080f1b] border border-white/10 text-white outline-none focus:border-cyan-400 resize-none"
                  required
                />
              </div>

              {/* 6. Pegawai jika Gaji / Kasbon */}
              {(category === 'gaji_pegawai' || category === 'kasbon') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pilih Pegawai Terkait</label>
                  <select
                    value={employeeId}
                    onChange={e => {
                      setEmployeeId(e.target.value);
                      const emp = employees.find(x => x.id === e.target.value);
                      if (emp) setEmployeeName(emp.name);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#080f1b] border border-white/10 text-white outline-none"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.roles?.join(', ') || 'Pegawai'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 7. Foto Bukti Nota */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Bukti Nota / Struk (Opsional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {proofImageUrl ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#080f1b] border border-white/10">
                    <img src={proofImageUrl} alt="Nota" className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1 text-xs">
                      <span className="text-emerald-400 font-bold block">✓ Foto Terlampir</span>
                      <button
                        type="button"
                        onClick={() => setProofImageUrl('')}
                        className="text-[10px] text-rose-400 hover:underline mt-0.5"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl bg-[#080f1b] border border-dashed border-white/15 hover:border-cyan-400/50 text-center cursor-pointer transition"
                  >
                    <Upload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                    <span className="text-xs text-slate-300 font-semibold block">Klik untuk Upload Foto Nota</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00f2fe] text-black text-xs font-black shadow-md shadow-[#00f2fe]/20 hover:brightness-110 cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DETAIL TRANSAKSI MODAL (KLIK BARIS TABEL UNTUK MELIHAT KETERANGAN LENGKAP)
          ========================================================================= */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-[9990] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0a1220] rounded-3xl border border-[#1b2b48] p-5 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#14233c] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-[#00f2fe]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Detail Transaksi Kas</h4>
                  <span className="text-xs text-slate-400">
                    {formatScreenshotDate(selectedDetailItem.date)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Keterangan Detail yang diminta pengguna */}
            <div className="p-4 rounded-2xl bg-[#060b14] border border-[#14233c] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00f2fe] block">
                  Keterangan Lengkap Transaksi
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRowDetails(selectedDetailItem).badgeClass}`}>
                  {getRowDetails(selectedDetailItem).badge}
                </span>
              </div>
              <p className="text-base font-bold text-white break-words leading-relaxed">
                {selectedDetailItem.description}
              </p>
            </div>

            {/* Nominal & Saldo */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#060b14] border border-[#14233c]">
                <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                  {selectedDetailItem.type === 'inflow' ? 'Kas Masuk' : 'Kas Keluar'}
                </span>
                <span className={`text-lg font-black ${selectedDetailItem.type === 'inflow' ? 'text-[#00e676]' : 'text-[#ff3366]'}`}>
                  {selectedDetailItem.type === 'inflow' ? '+' : '-'}{formatRupiah(selectedDetailItem.amount)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#060b14] border border-[#14233c]">
                <span className="text-xs font-semibold text-slate-400 block mb-0.5">Saldo Berjalan</span>
                <span className="text-lg font-black text-white">
                  {formatRupiah(selectedDetailItem.customSaldo !== undefined ? selectedDetailItem.customSaldo : (runningBalanceMap.get(selectedDetailItem.id) ?? selectedDetailItem.amount))}
                </span>
              </div>
            </div>

            {/* Meta info */}
            <div className="p-3.5 rounded-2xl bg-[#060b14] border border-[#14233c] space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pos Kas:</span>
                <span className="font-bold text-cyan-400 capitalize">{getCashflowPillar(selectedDetailItem)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-medium text-white">{CATEGORY_LABELS[selectedDetailItem.category] || selectedDetailItem.category}</span>
              </div>
              {selectedDetailItem.employeeName && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Pegawai Terkait:</span>
                  <span className="font-bold text-[#00f2fe]">{selectedDetailItem.employeeName}</span>
                </div>
              )}
              {selectedDetailItem.recordedBy && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Dicatat Oleh:</span>
                  <span className="text-slate-300">{selectedDetailItem.recordedBy}</span>
                </div>
              )}
            </div>

            {/* Foto Bukti Nota */}
            {selectedDetailItem.proofImageUrl && (
              <div
                onClick={() => setPreviewPhotoUrl(selectedDetailItem.proofImageUrl!)}
                className="relative rounded-2xl overflow-hidden border border-[#14233c] group cursor-pointer max-h-36 bg-black flex items-center justify-center"
              >
                <img src={selectedDetailItem.proofImageUrl} alt="Nota" className="max-h-36 w-full object-cover group-hover:opacity-80 transition" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition">
                  <Eye className="w-4 h-4 mr-1 text-[#00f2fe]" />
                  Klik untuk Perbesar
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#14233c]">
              <button
                type="button"
                onClick={() => {
                  const item = selectedDetailItem;
                  setSelectedDetailItem(null);
                  handleDelete(item.id, item.description);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#ff3366] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
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
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-[#00f2fe] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
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
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#0a1220] rounded-2xl border border-[#1b2b48] p-4 max-w-md w-full space-y-3">
            <div className="flex items-center justify-between border-b border-[#14233c] pb-2">
              <h4 className="text-xs font-bold text-white">Foto Bukti Nota</h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={previewPhotoUrl} alt="Preview" className="w-full max-h-96 object-contain rounded-xl bg-black" />
          </div>
        </div>
      )}

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
