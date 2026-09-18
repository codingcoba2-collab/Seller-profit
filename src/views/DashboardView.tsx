import React, { useState, useEffect } from 'react';
import { CurrentUser, StoreAnnouncement } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CATEGORIES, RoutePath } from '../services/navigation';
import {
  TrendingUp,
  Wallet,
  Coins,
  Megaphone,
  Package,
  Layers,
  Flame,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';
import { RunningTextBanner } from '../components/RunningTextBanner';
import { NeonCorners } from '../components/NeonCorners';
import { MarqueeText } from '../components/MarqueeText';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onOpenInstallGuide: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenInstallGuide,
  onNotify,
}) => {
  const store = StorageService.getStoreById(currentUser.storeId);
  const [stockInfo, setStockInfo] = useState(() => StorageService.calculateStock(currentUser.storeId));
  const [adsCoinInfo, setAdsCoinInfo] = useState(() => StorageService.calculateAdsAndCoins(currentUser.storeId));
  const [hppInfo, setHppInfo] = useState(() => StorageService.calculateHPP(currentUser.storeId));
  const [salesList, setSalesList] = useState(() => StorageService.getSales(currentUser.storeId));
  const [roiInfo, setRoiInfo] = useState(() => StorageService.calculateReturnOnInvestment(currentUser.storeId));

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = salesList.filter((s) => s.date === todayStr);
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

  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>(() =>
    StorageService.getActiveAnnouncements(currentUser.storeId)
  );

  useEffect(() => {
    const refreshAll = () => {
      setStockInfo(StorageService.calculateStock(currentUser.storeId));
      setAdsCoinInfo(StorageService.calculateAdsAndCoins(currentUser.storeId));
      setHppInfo(StorageService.calculateHPP(currentUser.storeId));
      setSalesList(StorageService.getSales(currentUser.storeId));
      setRoiInfo(StorageService.calculateReturnOnInvestment(currentUser.storeId));
      setAnnouncements(StorageService.getActiveAnnouncements(currentUser.storeId));
    };

    const unsub = StorageService.subscribe((event) => {
      refreshAll();
    });
    return () => unsub();
  }, [currentUser.storeId]);

  // Running text ticker items: strictly contains only whatever is typed by the Owner (no default dummy metrics)
  const runningMessages = announcements.length > 0
    ? announcements.map((a) => `${a.title ? `${a.title}: ` : ''}${a.content}`)
    : [
        currentUser.isOwner
          ? 'Live Info belum diisi. Ketuk di sini atau buka menu Informasi > Pengumuman untuk menulis pesan teks berjalan toko Anda.'
          : 'Belum ada pesan Live Info aktif dari Owner toko.'
      ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-5 text-white font-sans overflow-x-hidden">
      {/* 1. Tulisan Berjalan (Running Marquee Banner Ticker) */}
      <div 
        onClick={() => onNavigate('/informasi/pengumuman')}
        className="cursor-pointer active:scale-[0.99] transition-transform"
        title="Klik untuk membuka menu Pengumuman Toko (Live Info)"
      >
        <RunningTextBanner messages={runningMessages} speed={20} iconType="volume" badgeText="LIVE INFO" />
      </div>

      {/* 2. METRIK UTAMA DASHBOARD (5 KARTU SESUAI PERMINTAAN USER & SCREENSHOT):
          - Omzet Hari Ini
          - HPP
          - Sisa Stok
          - Sisa Saldo Iklan
          - Sisa Saldo Koin
          Layout: 2 kolom pada mobile (grid-cols-2), responsif 3-5 kolom pada layar besar
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Card 1: Omzet Hari Ini - Variasi Kabel Samping Magenta */}
        <div 
          id="card-stat-omzet-hari-ini"
          onClick={() => onNavigate('/penjualan/transaksi')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-[#FE2C55]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="side-left" color="magenta" />
          <div className="flex items-center justify-between gap-1 relative z-10 w-full overflow-hidden">
            <MarqueeText
              text="Omzet Hari Ini"
              className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors"
            />
            <div className="w-6 h-6 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55] shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10 w-full overflow-hidden">
            <div className="text-lg sm:text-xl font-black text-[#FE2C55] tracking-tight truncate">
              {formatRupiah(todayOmzet)}
            </div>
            <MarqueeText
              text={`${formatNumber(todayPcs)} pcs (${formatNumber(todayPackages)} paket)`}
              speed={16}
              className="text-[11px] text-zinc-400 mt-0.5"
            />
          </div>
        </div>

        {/* Card 2: HPP - Variasi Kabel Samping Cyan */}
        <div 
          id="card-stat-hpp"
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-[#25F4EE]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="side-left" color="cyan" />
          <div className="flex items-center justify-between gap-1 relative z-10 w-full overflow-hidden">
            <MarqueeText
              text="HPP (Harga Pokok)"
              className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors"
            />
            <div className="w-6 h-6 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10 w-full overflow-hidden">
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatRupiah(hppInfo.weightedAverageHpp)}
            </div>
            <MarqueeText
              text="Rata-rata modal per pcs"
              speed={16}
              className="text-[11px] text-zinc-400 mt-0.5"
            />
          </div>
        </div>

        {/* Card 3: Sisa Stok - Variasi Kabel Samping Emerald */}
        <div 
          id="card-stat-sisa-stok"
          onClick={() => onNavigate('/persiapan/modal-stok')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-emerald-500/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="side-left" color="emerald" />
          <div className="flex items-center justify-between gap-1 relative z-10 w-full overflow-hidden">
            <MarqueeText
              text="Sisa Stok Barang"
              className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors"
            />
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10 w-full overflow-hidden">
            <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {formatNumber(stockInfo.remainingStock)} <span className="text-xs font-normal text-zinc-400">pcs</span>
            </div>
            <MarqueeText
              text={`Terjual: ${formatNumber(stockInfo.totalPcsSold)} pcs`}
              speed={16}
              className="text-[11px] text-zinc-400 mt-0.5"
            />
          </div>
        </div>

        {/* Card 4: Net Profit (Laba Bersih Toko) - Variasi Kabel Ujung Atas Cyan */}
        <div 
          id="card-stat-net-profit"
          onClick={() => onNavigate('/keuangan/laba-bersih')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-[#25F4EE]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group overflow-hidden"
        >
          <NeonCorners variant="corner-top-left" color="cyan" />
          <div className="flex items-center justify-between gap-1 relative z-10 w-full overflow-hidden">
            <MarqueeText
              text="Net Profit Toko"
              className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors"
            />
            <div className="w-6 h-6 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10 w-full overflow-hidden">
            <div className={`text-lg sm:text-xl font-black tracking-tight truncate ${roiInfo.totalNetProfit >= 0 ? 'text-[#25F4EE]' : 'text-[#FE2C55]'}`}>
              {formatRupiah(roiInfo.totalNetProfit)}
            </div>
            <MarqueeText
              text={`Margin: ${roiInfo.totalOmzetKotor > 0 ? ((roiInfo.totalNetProfit / roiInfo.totalOmzetKotor) * 100).toFixed(1) : '0'}% | Omzet: ${formatRupiah(roiInfo.totalOmzetKotor)}`}
              speed={16}
              className="text-[11px] text-zinc-400 mt-0.5"
            />
          </div>
        </div>

        {/* Card 5: Sisa Balik Modal (BEP) - Variasi Kabel Samping Amber */}
        <div 
          id="card-stat-sisa-balik-modal"
          onClick={() => onNavigate('/keuangan/laba-bersih')}
          className="spatial-card relative p-3.5 sm:p-4 rounded-2xl hover:border-amber-400/40 transition-all cursor-pointer shadow-md flex flex-col justify-between gap-2.5 active:scale-[0.99] group col-span-2 sm:col-span-1 overflow-hidden"
        >
          <NeonCorners variant="side-left" color="amber" />
          <div className="flex items-center justify-between gap-1 relative z-10 w-full overflow-hidden">
            <MarqueeText
              text="Sisa Balik Modal"
              className="text-xs text-zinc-400 font-bold group-hover:text-white transition-colors"
            />
            <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative z-10 w-full overflow-hidden">
            <div className={`text-lg sm:text-xl font-black tracking-tight truncate ${roiInfo.isBreakEven ? 'text-emerald-400' : 'text-amber-400'}`}>
              {formatRupiah(roiInfo.sisaBalikModal)}
            </div>
            <MarqueeText
              text={roiInfo.isBreakEven ? 'Lunas (BEP 100%) Modal Investasi Balik' : `${roiInfo.progressPercentage}% Balik (Modal: ${formatRupiah(roiInfo.totalModalInvestasi)})`}
              speed={16}
              className="text-[11px] text-zinc-400 mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* 3. MENU UTAMA: TAMPILKAN 4 KATEGORI UTAMA (PERSIAPAN, PENJUALAN, KEUANGAN, INFORMASI) */}
      <div className="pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;

            return (
              <div
                key={cat.key}
                id={`card-main-menu-${cat.key}`}
                onClick={() => onNavigate(cat.path)}
                className={`spatial-card relative group p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99] flex flex-col justify-between gap-3.5 overflow-hidden ${cat.hoverBorder} ${cat.borderAccent}`}
              >
                <NeonCorners 
                  variant={cat.key === 'persiapan' ? 'corner-top-left' : 'side-left'} 
                  color={cat.key === 'persiapan' ? 'cyan' : cat.key === 'penjualan' ? 'magenta' : cat.key === 'informasi' ? 'cyan' : 'emerald'} 
                />
                <div className="flex items-center gap-3 relative z-10">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 ${cat.iconColor} shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
                  >
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 w-full overflow-hidden">
                    <MarqueeText
                      text={cat.title}
                      className="text-sm sm:text-base font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                    />
                    <MarqueeText
                      text={cat.description}
                      speed={20}
                      className="text-xs text-zinc-400 mt-1 leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-semibold group-hover:text-zinc-400 transition-colors">
                    {cat.items.length} Sub-Menu
                  </span>
                  <span className="font-bold text-[#25F4EE] group-hover:translate-x-0.5 transition-transform">
                    Buka →
                  </span>
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
