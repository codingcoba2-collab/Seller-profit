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
  UserCheck
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

  const [selectedCategory, setSelectedCategory] = useState<'all' | MenuCategory>('all');
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
  }[] = [
    {
      key: 'persiapan',
      number: 1,
      title: 'Persiapan',
      description: 'Manajemen pegawai & stok, modal & stok (HPP), sortir, QC & finishing, biaya admin channel marketplace, dan saldo iklan',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      borderAccent: 'border-emerald-500/30',
    },
    {
      key: 'penjualan',
      number: 2,
      title: 'Penjualan',
      description: 'Presensi kehadiran shift, data penjualan live & non-live (S-XL), statistik penjualan, paket retur, laba rugi sesi & index AI',
      badgeBg: 'bg-[#FE2C55]/15',
      badgeText: 'text-[#FE2C55]',
      borderAccent: 'border-[#FE2C55]/30',
    },
    {
      key: 'keuangan',
      number: 3,
      title: 'Keuangan',
      description: 'Slip gaji & insentif, cashflow arus kas toko (konsumsi pribadi), laba bersih toko, dan cashflow keuangan pribadi',
      badgeBg: 'bg-[#25F4EE]/15',
      badgeText: 'text-[#25F4EE]',
      borderAccent: 'border-[#25F4EE]/30',
    },
  ];

  // Helper check permission
  const canAccess = (item: MenuItem) => {
    if (currentUser.isOwner) return true;
    if (item.allEmployeesCanView) return true;
    return currentUser.roles.some(r => item.allowedRoles.includes(r));
  };

  const filteredCategories = selectedCategory === 'all' 
    ? categoriesMeta 
    : categoriesMeta.filter(c => c.key === selectedCategory);

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

      {/* CATEGORY NAV TABS (Requirement 1: Satukan beberapa menu ke dalam kategori agar dashboard tidak terlalu banyak menu) */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#25F4EE]" />
              <span>Kategori Menu Dashboard</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pilih kategori atau lihat seluruh modul yang terorganisasi rapi.
            </p>
          </div>

          {/* Category Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="filter-cat-all"
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'all'
                  ? 'bg-white text-zinc-900 border-white shadow-md'
                  : 'bg-[#161823] hover:bg-[#1f2232] text-zinc-300 border-white/10'
              }`}
            >
              <span>Semua Menu</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'all' ? 'bg-zinc-200 text-zinc-800' : 'bg-white/10 text-zinc-300'
              }`}>
                {menuItems.length}
              </span>
            </button>

            <button
              id="filter-cat-persiapan"
              type="button"
              onClick={() => setSelectedCategory('persiapan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'persiapan'
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-[#161823] hover:bg-[#1f2232] text-emerald-400 border-white/10'
              }`}
            >
              <span>1. Persiapan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'persiapan' ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {menuItems.filter(m => m.category === 'persiapan').length}
              </span>
            </button>

            <button
              id="filter-cat-penjualan"
              type="button"
              onClick={() => setSelectedCategory('penjualan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'penjualan'
                  ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-md shadow-[#FE2C55]/20'
                  : 'bg-[#161823] hover:bg-[#1f2232] text-[#FE2C55] border-white/10'
              }`}
            >
              <span>2. Penjualan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'penjualan' ? 'bg-black/40 text-white' : 'bg-[#FE2C55]/20 text-[#FE2C55]'
              }`}>
                {menuItems.filter(m => m.category === 'penjualan').length}
              </span>
            </button>

            <button
              id="filter-cat-keuangan"
              type="button"
              onClick={() => setSelectedCategory('keuangan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'keuangan'
                  ? 'bg-[#25F4EE] text-zinc-950 border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                  : 'bg-[#161823] hover:bg-[#1f2232] text-[#25F4EE] border-white/10'
              }`}
            >
              <span>3. Keuangan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'keuangan' ? 'bg-teal-950 text-teal-100' : 'bg-[#25F4EE]/20 text-[#25F4EE]'
              }`}>
                {menuItems.filter(m => m.category === 'keuangan').length}
              </span>
            </button>
          </div>
        </div>

        {/* CATEGORIZED SECTIONS */}
        <div className="space-y-6">
          {filteredCategories.map(cat => {
            const catItems = menuItems.filter(m => m.category === cat.key);

            return (
              <div
                key={cat.key}
                id={`section-category-${cat.key}`}
                className="bg-[#12141d] rounded-2xl p-4 sm:p-5 border border-white/5 space-y-4"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border ${cat.badgeBg} ${cat.badgeText} ${cat.borderAccent}`}>
                      {cat.number}
                    </span>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>Kategori {cat.number}: {cat.title}</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-zinc-400 font-semibold self-start sm:self-auto bg-[#161823] px-2.5 py-1 rounded-lg border border-white/10">
                    {catItems.length} Menu
                  </span>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                  {catItems.map((item) => {
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
                        className={`text-center p-3.5 sm:p-4 rounded-2xl transition-all duration-200 relative overflow-hidden flex flex-col items-center justify-between gap-2.5 group border cursor-pointer min-h-[140px] sm:min-h-[148px] ${
                          accessible
                            ? 'bg-[#161823] hover:bg-[#1c1f2e] border-white/10 hover:border-[#25F4EE]/50 shadow-md hover:shadow-lg hover:shadow-[#25F4EE]/10 active:scale-95'
                            : 'bg-[#12141c]/60 border-white/5 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {/* Top Badge or Lock */}
                        <div className="w-full flex items-center justify-between">
                          {item.badgeText ? (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate max-w-[85%] ${
                                accessible
                                  ? 'bg-white/5 text-zinc-300 border-white/10'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                              }`}
                            >
                              {item.badgeText}
                            </span>
                          ) : <span />}

                          {!accessible && <Lock className="w-3 h-3 text-zinc-500 shrink-0" />}
                        </div>

                        {/* Centered Icon */}
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-[#0b0c10] border border-white/10 group-hover:scale-110 group-hover:border-[#25F4EE]/40 transition-transform shadow-inner ${
                            accessible ? item.iconColor : 'text-zinc-500'
                          }`}
                        >
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        {/* Title & Subtitle */}
                        <div className="w-full">
                          <h5 className="text-xs font-bold text-white group-hover:text-[#25F4EE] transition-colors leading-snug line-clamp-2">
                            {item.title}
                          </h5>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onNotify={onNotify || (() => {})}
      />
    </div>
  );
};
