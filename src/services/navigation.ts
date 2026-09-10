import React from 'react';
import { CurrentUser, UserRole, ViewState } from '../types';
import {
  Package,
  TrendingUp,
  Wallet,
  Users,
  Scissors,
  Settings,
  Coins,
  Clock,
  BarChart3,
  RotateCcw,
  PieChart,
  Award,
  Receipt,
  Calculator,
  UserCheck,
  PlusCircle,
  History,
  MessageSquare,
  MessageCircle,
  Megaphone
} from 'lucide-react';

export type RoutePath =
  | '/dashboard'
  // Kategori Persiapan
  | '/persiapan'
  | '/persiapan/manajemen-pegawai'
  | '/persiapan/modal-stok'
  | '/persiapan/sortir-qc'
  | '/persiapan/biaya-admin'
  | '/persiapan/saldo-iklan'
  | '/topup-saldo'
  | '/topup-saldo/input'
  | '/topup-saldo/riwayat'
  // Kategori Penjualan
  | '/penjualan'
  | '/penjualan/kehadiran'
  | '/penjualan/transaksi'
  | '/penjualan/statistik'
  | '/penjualan/retur'
  | '/penjualan/laba-rugi'
  | '/penjualan/performa'
  | '/penjualan/kalkulasi-paket'
  // Kategori Keuangan
  | '/keuangan'
  | '/keuangan/gaji'
  | '/keuangan/cashflow'
  | '/keuangan/laba-bersih'
  | '/keuangan/pribadi'
  // Kategori Informasi
  | '/informasi'
  | '/informasi/pengumuman'
  | '/informasi/live-chat';

export interface BreadcrumbItem {
  label: string;
  path: RoutePath;
  isCurrent: boolean;
}

export interface NavigationItem {
  path: RoutePath;
  title: string;
  subtitle: string;
  badgeText?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  allowedRoles: UserRole[];
  allEmployeesCanView?: boolean;
}

export interface CategoryDefinition {
  key: 'persiapan' | 'penjualan' | 'keuangan' | 'informasi';
  path: RoutePath;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  gradientBg: string;
  borderAccent: string;
  hoverBorder: string;
  badgeBg: string;
  badgeText: string;
  items: NavigationItem[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'persiapan',
    path: '/persiapan',
    title: 'Persiapan',
    description: 'Manajemen tim & role pegawai, modal & stok (HPP), sortir QC & finishing, biaya admin channel marketplace, dan deposit saldo iklan & koin live.',
    icon: Package,
    iconColor: 'text-emerald-400',
    gradientBg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderAccent: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    items: [
      {
        path: '/persiapan/manajemen-pegawai',
        title: 'Manajemen Pegawai & Role',
        subtitle: 'Akun tim, role, gaji & skema insentif bundling/satuan',
        badgeText: 'Tim & Role',
        icon: Users,
        iconColor: 'text-[#25F4EE]',
        allowedRoles: ['owner'],
      },
      {
        path: '/persiapan/modal-stok',
        title: 'Modal & Stok (HPP)',
        subtitle: 'Input ball/grosir, ukuran S-XL, ongkir & HPP otomatis',
        badgeText: 'HPP & Stok',
        icon: Package,
        iconColor: 'text-emerald-400',
        allowedRoles: ['owner'],
      },
      {
        path: '/persiapan/sortir-qc',
        title: 'Sortir, QC & Finishing',
        subtitle: 'Pencatatan pcs layak jual, reject & upah pengerjaan',
        badgeText: 'Sortir & QC',
        icon: Scissors,
        iconColor: 'text-teal-400',
        allowedRoles: ['owner', 'sortir', 'steam'],
      },
      {
        path: '/persiapan/biaya-admin',
        title: 'Biaya Admin Marketplace',
        subtitle: 'Pengaturan biaya admin per channel: TikTok, Shopee, Offline',
        badgeText: 'Biaya Channel',
        icon: Settings,
        iconColor: 'text-sky-400',
        allowedRoles: ['owner'],
      },
      {
        path: '/persiapan/saldo-iklan',
        title: 'Saldo Biaya Iklan & Koin Live',
        subtitle: 'Topup deposit, pemakaian promosi & sisa saldo koin',
        badgeText: 'Iklan & Promo',
        icon: Coins,
        iconColor: 'text-amber-400',
        allowedRoles: ['owner'],
      },
    ],
  },
  {
    key: 'penjualan',
    path: '/penjualan',
    title: 'Penjualan',
    description: 'Presensi kehadiran shift, data penjualan live & non-live (S-XL), statistik penjualan, paket retur, laba rugi sesi, dan evaluasi performa AI.',
    icon: TrendingUp,
    iconColor: 'text-[#FE2C55]',
    gradientBg: 'from-[#FE2C55]/15 via-[#FE2C55]/5 to-transparent',
    borderAccent: 'border-[#FE2C55]/30',
    hoverBorder: 'hover:border-[#FE2C55]/60',
    badgeBg: 'bg-[#FE2C55]/15',
    badgeText: 'text-[#FE2C55]',
    items: [
      {
        path: '/penjualan/kehadiran',
        title: 'Presensi & Kehadiran Shift',
        subtitle: 'Absensi shift, jam kerja host, admin toko & staf',
        badgeText: 'Presensi Tim',
        icon: Clock,
        iconColor: 'text-blue-400',
        allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
        allEmployeesCanView: true,
      },
      {
        path: '/penjualan/transaksi',
        title: 'Data Penjualan (Live & Non-Live)',
        subtitle: 'Input transaksi, channel penjualan & pilihan ukuran S-XL',
        badgeText: 'Input Order',
        icon: TrendingUp,
        iconColor: 'text-[#FE2C55]',
        allowedRoles: ['owner', 'admin_toko'],
      },
      {
        path: '/penjualan/statistik',
        title: 'Statistik & Analisis Penjualan',
        subtitle: 'Tren omzet, perbandingan channel & performa top host',
        badgeText: 'Analisis Tren',
        icon: BarChart3,
        iconColor: 'text-[#25F4EE]',
        allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
        allEmployeesCanView: true,
      },
      {
        path: '/penjualan/retur',
        title: 'Data Return & Paket Return',
        subtitle: 'Pencatatan paket retur barang, alasan & pengembalian',
        badgeText: 'Retur Paket',
        icon: RotateCcw,
        iconColor: 'text-rose-400',
        allowedRoles: ['owner', 'admin_toko'],
      },
      {
        path: '/penjualan/laba-rugi',
        title: 'Laporan & Laba Rugi Sesi',
        subtitle: 'Evaluasi margin profit sesi live, HPP terjual & komisi',
        badgeText: 'Laba per Sesi',
        icon: PieChart,
        iconColor: 'text-violet-400',
        allowedRoles: ['owner'],
      },
      {
        path: '/penjualan/performa',
        title: 'Index Performa & Efektivitas AI',
        subtitle: 'Evaluasi kinerja host, admin & tim dengan asistensi AI',
        badgeText: 'Evaluasi AI',
        icon: Award,
        iconColor: 'text-amber-400',
        allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
        allEmployeesCanView: true,
      },
      {
        path: '/penjualan/kalkulasi-paket',
        title: 'Kalkulasi Harga & Paket Terjual',
        subtitle: 'Simulasi bundling, target laba harian, iklan & koin berbasis AI',
        badgeText: 'AI Bundling',
        icon: Calculator,
        iconColor: 'text-emerald-400',
        allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
        allEmployeesCanView: true,
      },
    ],
  },
  {
    key: 'keuangan',
    path: '/keuangan',
    title: 'Keuangan',
    description: 'Slip gaji & insentif, cashflow arus kas toko (konsumsi pribadi otomatis sinkron), laba bersih toko, dan cashflow keuangan pribadi owner.',
    icon: Wallet,
    iconColor: 'text-[#25F4EE]',
    gradientBg: 'from-[#25F4EE]/15 via-[#25F4EE]/5 to-transparent',
    borderAccent: 'border-[#25F4EE]/30',
    hoverBorder: 'hover:border-[#25F4EE]/60',
    badgeBg: 'bg-[#25F4EE]/15',
    badgeText: 'text-[#25F4EE]',
    items: [
      {
        path: '/keuangan/gaji',
        title: 'Slip Gaji & Insentif',
        subtitle: 'Kalkulasi gaji pokok, shift, insentif pcs/paket & kasbon',
        badgeText: 'Payroll Tim',
        icon: Receipt,
        iconColor: 'text-cyan-400',
        allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
        allEmployeesCanView: true,
      },
      {
        path: '/keuangan/cashflow',
        title: 'Cashflow & Arus Kas Toko',
        subtitle: 'Pencatatan tarik saldo, operasional & konsumsi pribadi',
        badgeText: 'Arus Kas Toko',
        icon: Wallet,
        iconColor: 'text-emerald-400',
        allowedRoles: ['owner'],
      },
      {
        path: '/keuangan/laba-bersih',
        title: 'Laporan Laba Bersih Toko',
        subtitle: 'Rekapitulasi profit akhir setelah beban operasional & gaji',
        badgeText: 'Laba Bersih',
        icon: Calculator,
        iconColor: 'text-[#25F4EE]',
        allowedRoles: ['owner'],
      },
      {
        path: '/keuangan/pribadi',
        title: 'Cashflow & Keuangan Pribadi',
        subtitle: 'Alokasi uang pribadi: sehari-hari, utang, tabungan & investasi',
        badgeText: 'Uang Pribadi',
        icon: UserCheck,
        iconColor: 'text-purple-400',
        allowedRoles: ['owner'],
      },
    ],
  },
  {
    key: 'informasi',
    path: '/informasi',
    title: 'Informasi',
    description: 'Pusat koordinasi informasi khusus owner toko, live chat real-time, dan pemantauan operasional marketplace.',
    icon: MessageSquare,
    iconColor: 'text-[#25F4EE]',
    gradientBg: 'from-[#25F4EE]/15 via-[#25F4EE]/5 to-transparent',
    borderAccent: 'border-[#25F4EE]/30',
    hoverBorder: 'hover:border-[#25F4EE]/60',
    badgeBg: 'bg-[#25F4EE]/15',
    badgeText: 'text-[#25F4EE]',
    items: [
      {
        path: '/informasi/pengumuman',
        title: 'Pengumuman Toko (Live Info)',
        subtitle: 'Input dan broadcast pengumuman penting owner ke running text Live Info & tim toko',
        badgeText: 'Live Info',
        icon: Megaphone,
        iconColor: 'text-[#FE2C55]',
        allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
        allEmployeesCanView: true,
      },
      {
        path: '/informasi/live-chat',
        title: 'Live Chat Real-Time',
        subtitle: 'Live chat & saluran informasi koordinasi khusus Owner toko',
        badgeText: 'Khusus Owner',
        icon: MessageCircle,
        iconColor: 'text-[#25F4EE]',
        allowedRoles: ['owner'],
      },
    ],
  },
];

// Normalize incoming path string (handles query params, aliases, trailing slashes)
export function normalizePath(path: string): RoutePath {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/dashboard';

  switch (clean) {
    case '/':
    case '/dashboard':
      return '/dashboard';

    // Persiapan
    case '/persiapan':
      return '/persiapan';
    case '/persiapan/manajemen-pegawai':
    case '/persiapan/pegawai':
      return '/persiapan/manajemen-pegawai';
    case '/persiapan/modal-stok':
    case '/persiapan/stok':
      return '/persiapan/modal-stok';
    case '/persiapan/sortir-qc':
    case '/persiapan/sortir':
      return '/persiapan/sortir-qc';
    case '/persiapan/biaya-admin':
    case '/persiapan/admin':
      return '/persiapan/biaya-admin';
    case '/persiapan/saldo-iklan':
    case '/topup-saldo':
      return '/topup-saldo';
    case '/topup-saldo/input':
    case '/persiapan/saldo-iklan/input':
      return '/topup-saldo/input';
    case '/topup-saldo/riwayat':
    case '/persiapan/saldo-iklan/riwayat':
      return '/topup-saldo/riwayat';

    // Penjualan
    case '/penjualan':
      return '/penjualan';
    case '/penjualan/kehadiran':
    case '/penjualan/presensi':
      return '/penjualan/kehadiran';
    case '/penjualan/transaksi':
    case '/penjualan/input':
      return '/penjualan/transaksi';
    case '/penjualan/statistik':
    case '/penjualan/analisis':
      return '/penjualan/statistik';
    case '/penjualan/retur':
    case '/penjualan/return':
    case '/penjualan/pesanan':
      return '/penjualan/retur';
    case '/penjualan/laba-rugi':
      return '/penjualan/laba-rugi';
    case '/penjualan/performa':
    case '/penjualan/index-performa':
      return '/penjualan/performa';
    case '/penjualan/kalkulasi-paket':
    case '/penjualan/kalkulasi':
    case '/penjualan/bundling':
    case '/kalkulasi-paket':
    case '/kalkulasi':
      return '/penjualan/kalkulasi-paket';

    // Keuangan
    case '/keuangan':
      return '/keuangan';
    case '/keuangan/gaji':
    case '/keuangan/payroll':
      return '/keuangan/gaji';
    case '/keuangan/cashflow':
    case '/keuangan/arus-kas':
    case '/keuangan/kas':
    case '/keuangan/pengeluaran':
      return '/keuangan/cashflow';
    case '/keuangan/laba-bersih':
      return '/keuangan/laba-bersih';
    case '/keuangan/pribadi':
    case '/keuangan/keuangan-pribadi':
      return '/keuangan/pribadi';

    // Informasi
    case '/informasi':
      return '/informasi';
    case '/informasi/pengumuman':
    case '/pengumuman':
      return '/informasi/pengumuman';
    case '/informasi/live-chat':
    case '/informasi/chat':
    case '/live-chat':
    case '/chat':
      return '/informasi/live-chat';

    default:
      return '/dashboard';
  }
}

// Convert ViewState to RoutePath
export function viewStateToPath(view: ViewState): RoutePath {
  switch (view) {
    case 'dashboard': return '/dashboard';
    case 'category_persiapan': return '/persiapan';
    case 'category_penjualan': return '/penjualan';
    case 'category_keuangan': return '/keuangan';
    case 'category_informasi': return '/informasi';
    case 'role_management': return '/persiapan/manajemen-pegawai';
    case 'modal_stok': return '/persiapan/modal-stok';
    case 'steam_sortir': return '/persiapan/sortir-qc';
    case 'admin_shopee': return '/persiapan/biaya-admin';
    case 'iklan_koin': return '/topup-saldo';
    case 'kehadiran': return '/penjualan/kehadiran';
    case 'penjualan': return '/penjualan/transaksi';
    case 'statistik': return '/penjualan/statistik';
    case 'return': return '/penjualan/retur';
    case 'laba_rugi': return '/penjualan/laba-rugi';
    case 'index_performa': return '/penjualan/performa';
    case 'kalkulasi_paket': return '/penjualan/kalkulasi-paket';
    case 'gaji': return '/keuangan/gaji';
    case 'cashflow': return '/keuangan/cashflow';
    case 'laba_bersih': return '/keuangan/laba-bersih';
    case 'keuangan_pribadi': return '/keuangan/pribadi';
    case 'live_chat': return '/informasi/live-chat';
    case 'pengumuman': return '/informasi/pengumuman';
    default: return '/dashboard';
  }
}

// Check if user has permission to view route
export function isRouteAllowed(route: RoutePath, user: CurrentUser): boolean {
  if (user.isOwner) return true;

  // Live chat in information sub-menu is strictly reserved for the owner
  if (route === '/informasi/live-chat') {
    return user.isOwner;
  }

  // Dashboard, category hubs are viewable by any authenticated user
  if (route === '/dashboard' || 
      route === '/persiapan' || 
      route === '/penjualan' || 
      route === '/keuangan' || 
      route === '/informasi') {
    return true;
  }

  // Persiapan
  if (route === '/persiapan/manajemen-pegawai' ||
      route === '/persiapan/modal-stok' ||
      route === '/persiapan/biaya-admin' ||
      route === '/persiapan/saldo-iklan' ||
      route === '/topup-saldo' ||
      route === '/topup-saldo/input' ||
      route === '/topup-saldo/riwayat') {
    return user.isOwner;
  }

  if (route === '/persiapan/sortir-qc') {
    return user.isOwner || user.roles.includes('sortir') || user.roles.includes('steam');
  }

  // Penjualan
  if (route === '/penjualan/kehadiran' || route === '/penjualan/statistik' || route === '/penjualan/performa' || route === '/penjualan/kalkulasi-paket') {
    return true;
  }

  if (route === '/penjualan/transaksi' || route === '/penjualan/retur') {
    return user.isOwner || user.roles.includes('admin_toko');
  }

  if (route === '/penjualan/laba-rugi') {
    return user.isOwner;
  }

  // Keuangan
  if (route === '/keuangan/gaji') {
    return true;
  }

  if (route === '/keuangan/cashflow' || route === '/keuangan/laba-bersih' || route === '/keuangan/pribadi') {
    return user.isOwner;
  }

  return true;
}

// Get Page Title for route
export function getPageTitle(route: RoutePath): string {
  switch (route) {
    case '/dashboard': return 'Beranda';
    case '/persiapan': return 'Persiapan';
    case '/persiapan/manajemen-pegawai': return 'Manajemen Pegawai & Role';
    case '/persiapan/modal-stok': return 'Modal & Stok (HPP)';
    case '/persiapan/sortir-qc': return 'Sortir, QC & Finishing';
    case '/persiapan/biaya-admin': return 'Biaya Admin Marketplace';
    case '/persiapan/saldo-iklan':
    case '/topup-saldo': return 'Saldo Biaya Iklan & Koin Live';
    case '/topup-saldo/input': return 'Input Topup Saldo';
    case '/topup-saldo/riwayat': return 'Riwayat Topup Saldo';
    case '/penjualan': return 'Penjualan';
    case '/penjualan/kehadiran': return 'Presensi & Kehadiran Shift';
    case '/penjualan/transaksi': return 'Data Penjualan (Live & Non-Live)';
    case '/penjualan/statistik': return 'Statistik & Analisis Penjualan';
    case '/penjualan/retur': return 'Data Retur & Paket Return';
    case '/penjualan/laba-rugi': return 'Laporan & Laba Rugi Sesi';
    case '/penjualan/performa': return 'Index Performa & Efektivitas AI';
    case '/penjualan/kalkulasi-paket': return 'Kalkulasi Harga & Paket Terjual';
    case '/keuangan': return 'Keuangan';
    case '/keuangan/gaji': return 'Slip Gaji & Insentif';
    case '/keuangan/cashflow': return 'Cashflow & Arus Kas Toko';
    case '/keuangan/laba-bersih': return 'Laporan Laba Bersih Toko';
    case '/keuangan/pribadi': return 'Cashflow & Keuangan Pribadi';
    case '/informasi': return 'Informasi';
    case '/informasi/pengumuman': return 'Pengumuman Toko (Live Info)';
    case '/informasi/live-chat': return 'Live Chat Real-Time';
    default: return 'Seller Profit';
  }
}

// Get Parent Route for Back navigation
export function getParentRoute(route: RoutePath): { path: RoutePath; label: string } | null {
  if (route === '/dashboard') return null;

  // Top level categories go back to /dashboard
  if (route === '/persiapan' || route === '/penjualan' || route === '/keuangan' || route === '/informasi') {
    return { path: '/dashboard', label: 'Beranda' };
  }

  // Topup sub-routes go back to /topup-saldo
  if (route === '/topup-saldo/input' || route === '/topup-saldo/riwayat') {
    return { path: '/topup-saldo', label: 'Saldo Iklan & Koin' };
  }

  // Persiapan features go back to /persiapan
  if (route.startsWith('/persiapan') || route === '/topup-saldo') {
    return { path: '/persiapan', label: 'Persiapan' };
  }

  // Penjualan features go back to /penjualan
  if (route.startsWith('/penjualan')) {
    return { path: '/penjualan', label: 'Penjualan' };
  }

  // Keuangan features go back to /keuangan
  if (route.startsWith('/keuangan')) {
    return { path: '/keuangan', label: 'Keuangan' };
  }

  // Informasi features go back to /informasi
  if (route.startsWith('/informasi')) {
    return { path: '/informasi', label: 'Informasi' };
  }

  return { path: '/dashboard', label: 'Beranda' };
}

// Generate Breadcrumb items for route
export function getBreadcrumbs(route: RoutePath): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Beranda', path: '/dashboard', isCurrent: route === '/dashboard' }
  ];

  if (route === '/dashboard') return items;

  // Persiapan group
  if (route.startsWith('/persiapan') || route.startsWith('/topup-saldo')) {
    items.push({
      label: 'Persiapan',
      path: '/persiapan',
      isCurrent: route === '/persiapan'
    });

    if (route === '/topup-saldo') {
      items.push({
        label: 'Saldo Iklan & Koin',
        path: '/topup-saldo',
        isCurrent: true
      });
    } else if (route === '/topup-saldo/input') {
      items.push({
        label: 'Saldo Iklan & Koin',
        path: '/topup-saldo',
        isCurrent: false
      });
      items.push({
        label: 'Input Topup Saldo',
        path: '/topup-saldo/input',
        isCurrent: true
      });
    } else if (route === '/topup-saldo/riwayat') {
      items.push({
        label: 'Saldo Iklan & Koin',
        path: '/topup-saldo',
        isCurrent: false
      });
      items.push({
        label: 'Riwayat Topup Saldo',
        path: '/topup-saldo/riwayat',
        isCurrent: true
      });
    } else if (route !== '/persiapan') {
      items.push({
        label: getPageTitle(route),
        path: route,
        isCurrent: true
      });
    }
    return items;
  }

  // Penjualan group
  if (route.startsWith('/penjualan')) {
    items.push({
      label: 'Penjualan',
      path: '/penjualan',
      isCurrent: route === '/penjualan'
    });

    if (route !== '/penjualan') {
      items.push({
        label: getPageTitle(route),
        path: route,
        isCurrent: true
      });
    }
    return items;
  }

  // Keuangan group
  if (route.startsWith('/keuangan')) {
    items.push({
      label: 'Keuangan',
      path: '/keuangan',
      isCurrent: route === '/keuangan'
    });

    if (route !== '/keuangan') {
      items.push({
        label: getPageTitle(route),
        path: route,
        isCurrent: true
      });
    }
    return items;
  }

  // Informasi group
  if (route.startsWith('/informasi')) {
    items.push({
      label: 'Informasi',
      path: '/informasi',
      isCurrent: route === '/informasi'
    });

    if (route !== '/informasi') {
      items.push({
        label: getPageTitle(route),
        path: route,
        isCurrent: true
      });
    }
    return items;
  }

  return items;
}
