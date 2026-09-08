import React, { useState } from 'react';
import { CurrentUser, ViewState, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatNumber } from '../utils/formatters';
import {
  Users,
  Package,
  Settings,
  Clock,
  TrendingUp,
  RotateCcw,
  Coins,
  Receipt,
  PieChart,
  Wallet,
  Calculator,
  Award,
  Smartphone,
  Lock,
  Scissors,
  BarChart3,
  Cloud,
  RefreshCw,
  Palette,
  ShoppingBag,
  Tag,
  Layers,
  CircleDollarSign,
  UserCheck,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onNavigate: (tab: ViewState) => void;
  onOpenInstallGuide: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type MenuCategory = 'persiapan' | 'penjualan' | 'keuangan';

interface MenuItem {
  tab: ViewState;
  title: string;
  subtitle: string;
  category: MenuCategory;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badgeText?: string;
  allowedRoles: UserRole[];
  allEmployeesCanView?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenInstallGuide,
  onNotify,
}) => {
  const store = StorageService.getStoreById(currentUser.storeId);
  const stockInfo = StorageService.calculateStock(currentUser.storeId);
  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);
  const hppInfo = StorageService.calculateHPP(currentUser.storeId);
  const salesList = StorageService.getSales(currentUser.storeId);

  // Default: null (hanya menampilkan 3 menu utama: Persiapan, Penjualan, Keuangan di awal)
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = salesList.filter(s => s.date === todayStr);
  const todayOmzet = todaySales.reduce((acc, curr) => acc + (curr.omzet || 0), 0);
  const todayPcs = todaySales.reduce((acc, curr) => acc + (curr.pcsSold || 0), 0);
  const todayPackages = todaySales.reduce((acc, curr) => acc + (curr.packagesSold || 0), 0);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const ok = await StorageService.syncAllFromCloud(currentUser.storeId);
      if (ok) {
        onNotify?.('Data berhasil disinkronkan dengan Cloud Firestore.', 'success');
      } else {
        onNotify?.('Koneksi sinkronisasi lokal aktif.', 'info');
      }
    } catch {
      onNotify?.('Gagal menyinkronkan data cloud.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Menu items grouped strictly into 3 categories requested by user:
  // 1. Persiapan
  // 2. Penjualan
  // 3. Keuangan
  const menuItems: MenuItem[] = [
    // --- KATEGORI 1: PERSIAPAN ---
    {
      tab: 'role_management',
      category: 'persiapan',
      title: 'Manajemen Pegawai & Stok',
      subtitle: 'Akun tim, role, gaji & skema insentif bundling/satuan',
      icon: Users,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Tim & Role',
      allowedRoles: ['owner'],
    },
    {
      tab: 'modal_stok',
      category: 'persiapan',
      title: 'Modal & Stok (HPP)',
      subtitle: 'Input ball/grosir, ukuran S-XL, ongkir & HPP otomatis',
      icon: Package,
      iconColor: 'text-emerald-400',
      badgeText: 'HPP & Stok',
      allowedRoles: ['owner'],
    },
    {
      tab: 'steam_sortir',
      category: 'persiapan',
      title: 'Sortir, QC dan Finishing',
      subtitle: 'Pencatatan pcs layak jual, reject & upah pengerjaan',
      icon: Scissors,
      iconColor: 'text-teal-400',
      badgeText: 'Sortir & QC',
      allowedRoles: ['owner', 'sortir', 'steam'],
    },
    {
      tab: 'admin_shopee',
      category: 'persiapan',
      title: 'Biaya Admin Marketplace',
      subtitle: 'Pengaturan biaya admin per channel: TikTok, Shopee, Offline',
      icon: Settings,
      iconColor: 'text-sky-400',
      badgeText: 'Biaya Channel',
      allowedRoles: ['owner'],
    },
    {
      tab: 'iklan_koin',
      category: 'persiapan',
      title: 'Saldo Biaya Iklan & Koin Live',
      subtitle: 'Topup deposit, pemakaian promosi & sisa saldo koin',
      icon: Coins,
      iconColor: 'text-amber-400',
      badgeText: 'Iklan & Promo',
      allowedRoles: ['owner'],
    },

    // --- KATEGORI 2: PENJUALAN ---
    {
      tab: 'kehadiran',
      category: 'penjualan',
      title: 'Presensi & Kehadiran Shift',
      subtitle: 'Absensi shift, jam kerja host, admin toko & staf',
      icon: Clock,
      iconColor: 'text-blue-400',
      badgeText: 'Presensi Tim',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'penjualan',
      category: 'penjualan',
      title: 'Data Penjualan (Live & Non-Live)',
      subtitle: 'Input transaksi, channel penjualan & pilihan ukuran S-XL',
      icon: TrendingUp,
      iconColor: 'text-[#FE2C55]',
      badgeText: 'Input Order',
      allowedRoles: ['owner', 'admin_toko'],
    },
    {
      tab: 'statistik',
      category: 'penjualan',
      title: 'Statistik & Analisis Penjualan',
      subtitle: 'Tren omzet, perbandingan channel & performa top host',
      icon: BarChart3,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Analisis Tren',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'return',
      category: 'penjualan',
      title: 'Data Return & Paket Return',
      subtitle: 'Pencatatan paket retur barang, alasan & pengembalian',
      icon: RotateCcw,
      iconColor: 'text-rose-400',
      badgeText: 'Retur Paket',
      allowedRoles: ['owner', 'admin_toko'],
    },
    {
      tab: 'laba_rugi',
      category: 'penjualan',
      title: 'Laporan & Laba Rugi Sesi',
      subtitle: 'Evaluasi margin profit sesi live, HPP terjual & komisi',
      icon: PieChart,
      iconColor: 'text-violet-400',
      badgeText: 'Laba per Sesi',
      allowedRoles: ['owner'],
    },
    {
      tab: 'index_performa',
      category: 'penjualan',
      title: 'Index Performa & Efektivitas AI',
      subtitle: 'Evaluasi kinerja host, admin & tim dengan asistensi AI',
      icon: Award,
      iconColor: 'text-amber-400',
      badgeText: 'Evaluasi AI',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },

    // --- KATEGORI 3: KEUANGAN ---
    {
      tab: 'gaji',
      category: 'keuangan',
      title: 'Slip Gaji & Insentif',
      subtitle: 'Kalkulasi gaji pokok, shift, insentif pcs/paket & kasbon',
      icon: Receipt,
      iconColor: 'text-cyan-400',
      badgeText: 'Payroll Tim',
      allowedRoles: ['owner', 'admin_toko', 'host', 'sortir', 'steam'],
      allEmployeesCanView: true,
    },
    {
      tab: 'cashflow',
      category: 'keuangan',
      title: 'Cashflow & Arus Kas Toko',
      subtitle: 'Pencatatan tarik saldo, operasional & konsumsi pribadi',
      icon: Wallet,
      iconColor: 'text-emerald-400',
      badgeText: 'Arus Kas Toko',
      allowedRoles: ['owner'],
    },
    {
      tab: 'laba_bersih',
      category: 'keuangan',
      title: 'Laporan Laba Bersih Toko',
      subtitle: 'Rekapitulasi profit akhir setelah beban operasional & gaji',
      icon: Calculator,
      iconColor: 'text-[#25F4EE]',
      badgeText: 'Laba Bersih',
      allowedRoles: ['owner'],
    },
    {
      tab: 'keuangan_pribadi',
      category: 'keuangan',
      title: 'Cashflow & Keuangan Pribadi',
      subtitle: 'Alokasi uang pribadi: sehari-hari, utang, tabungan & investasi',
      icon: UserCheck,
      iconColor: 'text-purple-400',
      badgeText: 'Uang Pribadi',
      allowedRoles: ['owner'],
    },
  ];

  const categoriesMeta: {
    key: MenuCategory;
    number: number;
    title: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    gradientBg: string;
    hoverBorder: string;
  }[] = [
    {
      key: 'persiapan',
      number: 1,
      title: 'Persiapan',
      description: 'Manajemen pegawai & stok, modal & stok (HPP), sortir, QC & finishing, biaya admin marketplace, dan deposit saldo iklan & koin live.',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      borderAccent: 'border-emerald-500/30',
      icon: Package,
      iconColor: 'text-emerald-400',
      gradientBg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      hoverBorder: 'hover:border-emerald-500/60',
    },
    {
      key: 'penjualan',
      number: 2,
      title: 'Penjualan',
      description: 'Presensi kehadiran shift, data penjualan live & non-live (S-XL), statistik penjualan, paket retur, laba rugi sesi, dan evaluasi performa AI.',
      badgeBg: 'bg-[#FE2C55]/15',
      badgeText: 'text-[#FE2C55]',
      borderAccent: 'border-[#FE2C55]/30',
      icon: TrendingUp,
      iconColor: 'text-[#FE2C55]',
      gradientBg: 'from-[#FE2C55]/15 via-[#FE2C55]/5 to-transparent',
      hoverBorder: 'hover:border-[#FE2C55]/60',
    },
    {
      key: 'keuangan',
      number: 3,
      title: 'Keuangan',
      description: 'Slip gaji & insentif, cashflow arus kas toko (konsumsi pribadi otomatis sinkron), laba bersih toko, dan cashflow keuangan pribadi owner.',
      badgeBg: 'bg-[#25F4EE]/15',
      badgeText: 'text-[#25F4EE]',
      borderAccent: 'border-[#25F4EE]/30',
      icon: Wallet,
      iconColor: 'text-[#25F4EE]',
      gradientBg: 'from-[#25F4EE]/15 via-[#25F4EE]/5 to-transparent',
      hoverBorder: 'hover:border-[#25F4EE]/60',
    },
  ];

  // Helper check permission
  const canAccess = (item: MenuItem) => {
    if (currentUser.isOwner) return true;
    if (item.allEmployeesCanView) return true;
    return currentUser.roles.some(r => item.allowedRoles.includes(r));
  };

  const currentCat = activeCategory ? categoriesMeta.find(c => c.key === activeCategory) : null;
  const currentCatItems = activeCategory ? menuItems.filter(m => m.category === activeCategory) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Top Banner / Store Overview */}
      <div className="rounded-3xl bg-[#161823] p-6 sm:p-7 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-semibold backdrop-blur-xs text-zinc-300 border border-white/10">
              <ShoppingBag className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>{store?.storeName || 'Fashion Store Official'}</span>
            </div>

            {/* Greeting + Theme and Cloud quick actions */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Halo, {currentUser.name}</span>
              </h2>

              {/* Theme & Cloud Quick Action Pills */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-halo-cloud-sync"
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer shadow-xs active:scale-95"
                  title="Sinkronisasi Cloud Firestore"
                >
                  <Cloud className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span className="text-[11px]">Cloud</span>
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                </button>

                <button
                  id="btn-halo-theme-switcher"
                  type="button"
                  onClick={() => setShowThemeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-xs"
                  title="Pilih Tema Warna Aplikasi"
                >
                  <Palette className="w-3.5 h-3.5 text-[#25F4EE]" />
                  <span className="text-[11px]">Tema</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Dashboard operasional toko fashion, live streaming, multi-channel marketplace &amp; offline, HPP otomatis, serta pengelolaan arus kas pribadi dan bisnis.
            </p>
          </div>

          <button
            id="btn-dashboard-install-guide"
            onClick={onOpenInstallGuide}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-[#25F4EE]/15 hover:bg-[#25F4EE]/25 text-[#25F4EE] font-bold px-4 py-2.5 rounded-2xl text-xs border border-[#25F4EE]/40 shadow-lg shadow-[#25F4EE]/10 transition active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#25F4EE]" />
            <span>Install di HP</span>
          </button>
        </div>

        {/* Live Key Metrics Grid */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Sisa Stok Layak Jual */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Stok Layak Jual</span>
              <Package className="w-3.5 h-3.5 text-[#25F4EE]" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-semibold text-zinc-400">pcs</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Terjual: {formatNumber(stockInfo.totalPcsSold)} pcs {stockInfo.totalPcsReject > 0 && `• Reject: ${formatNumber(stockInfo.totalPcsReject)}`}
            </div>
          </div>

          {/* 2. Sisa Saldo Iklan */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Saldo Iklan</span>
              <Coins className="w-3.5 h-3.5 text-[#25F4EE]" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
              Rp {formatNumber(adsCoinInfo.remainingAds)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Terpakai: Rp {formatNumber(adsCoinInfo.totalAdsUsed)}
            </div>
          </div>

          {/* 3. Sisa Saldo Koin Live */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Sisa Saldo Koin Live</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
              Rp {formatNumber(adsCoinInfo.remainingCoin)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Terpakai: Rp {formatNumber(adsCoinInfo.totalCoinUsed)}
            </div>
          </div>

          {/* 4. Omzet Hari Ini */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Omzet Hari Ini</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#FE2C55]" />
            </div>
            <div className="text-base sm:text-lg font-black text-[#FE2C55] mt-1 truncate">
              {formatRupiah(todayOmzet)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              {formatNumber(todayPcs)} pcs ({formatNumber(todayPackages)} paket)
            </div>
          </div>

          {/* 5. Rata-rata HPP Toko */}
          <div className="bg-[#0b0c10] border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
              <span>Rata-rata HPP</span>
              <Tag className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-[#25F4EE] mt-1 truncate">
              {formatRupiah(hppInfo.weightedAverageHpp)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
              Modal / pcs fashion
            </div>
          </div>
        </div>
      </div>

      {/* TAMPILAN MENU: 
          Jika activeCategory === null -> HANYA 3 MENU UTAMA (Persiapan, Penjualan, Keuangan).
          Jika activeCategory !== null -> Halaman Sub-Menu dari kategori terpilih.
      */}
      {activeCategory === null ? (
        <div className="space-y-4 pt-2">
          {/* Header Dashboard Awal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#25F4EE]" />
                <span>Pilih Menu Utama</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dashboard awal diringkas menjadi 3 menu utama. Klik salah satu menu untuk membuka sub-menu modul terkait:
              </p>
            </div>

            <span className="text-xs font-bold text-zinc-300 px-3 py-1 rounded-full bg-white/5 border border-white/10 self-start sm:self-auto">
              3 Kategori Menu
            </span>
          </div>

          {/* 3 Main Menu Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {categoriesMeta.map((cat) => {
              const catItems = menuItems.filter((m) => m.category === cat.key);
              const CatIcon = cat.icon;

              return (
                <div
                  key={cat.key}
                  id={`card-main-menu-${cat.key}`}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`group relative rounded-3xl p-6 sm:p-7 border bg-[#161823] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between gap-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] ${cat.hoverBorder} ${cat.borderAccent}`}
                >
                  {/* Ambient Glow */}
                  <div
                    className={`absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none bg-gradient-to-br ${cat.gradientBg}`}
                  />

                  <div className="space-y-4 relative z-10">
                    {/* Top Number Badge & Sub-menu Count */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border ${cat.badgeBg} ${cat.badgeText} ${cat.borderAccent} shadow-md`}
                      >
                        0{cat.number}
                      </span>
                      <span
                        className={`text-[11px] font-black px-3 py-1 rounded-full border ${cat.badgeBg} ${cat.badgeText} ${cat.borderAccent}`}
                      >
                        {catItems.length} Sub-Menu
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="space-y-2.5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${cat.iconColor} group-hover:scale-110 transition-transform shadow-inner`}
                      >
                        <CatIcon className="w-7 h-7" />
                      </div>
                      <h4 className="text-xl font-black text-white group-hover:text-white tracking-tight flex items-center gap-2">
                        <span>{cat.title}</span>
                      </h4>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-300 leading-relaxed min-h-[44px]">
                      {cat.description}
                    </p>

                    {/* Preview of modules list */}
                    <div className="pt-3 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                        Daftar Sub-Menu di dalamnya:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {catItems.map((item) => (
                          <span
                            key={item.tab}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-zinc-300 font-medium truncate max-w-[200px]"
                          >
                            {item.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="relative z-10 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-black text-white group-hover:text-[#25F4EE] transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
                      <span>Buka Sub-Menu {cat.title}</span>
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-[#25F4EE] group-hover:text-zinc-950 flex items-center justify-center transition-all shadow-md">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* HALAMAN SUB-MENU SETELAH MENU UTAMA DI-PENCET */
        <div className="space-y-6 pt-1">
          {/* Top Back & Category Switcher Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-back-to-main-dashboard"
                type="button"
                onClick={() => setActiveCategory(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition border border-white/10 cursor-pointer shadow-md active:scale-95 group"
              >
                <ArrowLeft className="w-4 h-4 text-[#25F4EE] group-hover:-translate-x-0.5 transition-transform" />
                <span>← Kembali ke 3 Menu Utama</span>
              </button>

              <div className="h-6 w-px bg-white/10 hidden sm:block" />

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">
                  Halaman Sub-Menu
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>
                    Kategori {currentCat?.number}: {currentCat?.title}
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick Switch Tabs between the 3 main categories */}
            <div className="flex items-center gap-1.5 self-start md:self-auto bg-[#0b0c10] p-1.5 rounded-2xl border border-white/10">
              {categoriesMeta.map((c) => (
                <button
                  key={c.key}
                  id={`btn-switch-cat-${c.key}`}
                  type="button"
                  onClick={() => setActiveCategory(c.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === c.key
                      ? 'bg-white text-zinc-950 shadow-sm font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>
                    {c.number}. {c.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Category Header Banner */}
          {currentCat && (
            <div
              className={`p-5 sm:p-6 rounded-3xl border bg-gradient-to-r ${currentCat.gradientBg} bg-[#161823] ${currentCat.borderAccent} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${currentCat.iconColor} shrink-0 shadow-inner`}
                >
                  <currentCat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    Daftar Sub-Menu Kategori {currentCat.title}
                  </h4>
                  <p className="text-xs text-zinc-300 max-w-2xl mt-0.5 leading-relaxed">
                    {currentCat.description}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-black px-3.5 py-1.5 rounded-xl border ${currentCat.badgeBg} ${currentCat.badgeText} ${currentCat.borderAccent} shrink-0 self-start sm:self-auto`}
              >
                {currentCatItems.length} Sub-Menu Tersedia
              </span>
            </div>
          )}

          {/* Sub-menu Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {currentCatItems.map((item) => {
              const accessible = canAccess(item);
              const Icon = item.icon;

              return (
                <button
                  key={item.tab}
                  id={`menu-card-${item.tab}`}
                  type="button"
                  onClick={() => {
                    if (accessible) {
                      onNavigate(item.tab);
                    } else {
                      onNotify?.('Akses menu ini dibatasi untuk peran Anda.', 'error');
                    }
                  }}
                  className={`text-center p-4 rounded-2xl transition-all duration-200 relative overflow-hidden flex flex-col items-center justify-between gap-3 group border cursor-pointer min-h-[160px] ${
                    accessible
                      ? 'bg-[#161823] hover:bg-[#1c1f2e] border-white/10 hover:border-[#25F4EE]/50 shadow-md hover:shadow-xl hover:shadow-[#25F4EE]/10 active:scale-95'
                      : 'bg-[#12141c]/60 border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Top Badge or Lock */}
                  <div className="w-full flex items-center justify-between">
                    {item.badgeText ? (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border truncate max-w-[85%] ${
                          accessible
                            ? 'bg-white/5 text-zinc-300 border-white/10'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    ) : (
                      <span />
                    )}

                    {!accessible && <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                  </div>

                  {/* Centered Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0b0c10] border border-white/10 group-hover:scale-110 group-hover:border-[#25F4EE]/40 transition-transform shadow-inner ${
                      accessible ? item.iconColor : 'text-zinc-500'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Subtitle */}
                  <div className="w-full space-y-1">
                    <h5 className="text-xs font-bold text-white group-hover:text-[#25F4EE] transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h5>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onNotify={onNotify || (() => {})}
      />
    </div>
  );
};
