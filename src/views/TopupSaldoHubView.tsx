import React, { useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser } from '../types';
import { formatRupiah } from '../utils/formatters';
import { RoutePath } from '../services/navigation';
import { MarqueeText } from '../components/MarqueeText';
import {
  Coins,
  Megaphone,
  TrendingUp,
  ArrowLeft,
  PlusCircle,
  History,
  Sparkles,
  Wallet
} from 'lucide-react';

interface TopupSaldoHubViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TopupSaldoHubView: React.FC<TopupSaldoHubViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const adsCoinInfo = StorageService.calculateAdsAndCoins(currentUser.storeId);
  const salesList = StorageService.getSales(currentUser.storeId);

  // ROAS (Return On Ad Spend) Calculation
  const roasMetrics = useMemo(() => {
    const totalOmzet = salesList.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalAdsUsed = adsCoinInfo.totalAdsUsed || 0;
    const totalCoinUsed = adsCoinInfo.totalCoinUsed || 0;
    const totalMarketingSpend = totalAdsUsed + totalCoinUsed;

    const roasAdsOnly = totalAdsUsed > 0 ? (totalOmzet / totalAdsUsed) : 0;
    const roasTotalMarketing = totalMarketingSpend > 0 ? (totalOmzet / totalMarketingSpend) : 0;
    const adCostPerOrder = salesList.length > 0 && totalAdsUsed > 0 
      ? Math.round(totalAdsUsed / salesList.reduce((acc, s) => acc + (s.packagesSold || 1), 0)) 
      : 0;

    return {
      totalOmzet,
      totalAdsUsed,
      totalCoinUsed,
      totalMarketingSpend,
      roasAdsOnly: roasAdsOnly.toFixed(2),
      roasTotalMarketing: roasTotalMarketing.toFixed(2),
      adCostPerOrder,
    };
  }, [salesList, adsCoinInfo]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#161823] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-to-persiapan-from-topup"
            onClick={() => onNavigate('/persiapan')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition border border-white/10 cursor-pointer active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
            <span>← Kembali ke Persiapan</span>
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-wider">
              Modul Promosi
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Saldo Biaya Iklan &amp; Koin Live
            </h2>
          </div>
        </div>

        <span className="text-xs font-bold text-zinc-300 px-3 py-1 rounded-full bg-white/5 border border-white/10 self-start sm:self-auto">
          Top Up Saldo Hub
        </span>
      </div>

      {/* ROAS & Saldo Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ROAS Metric Card */}
        <div className="p-6 rounded-3xl bg-[#161823] text-white border border-[#25F4EE]/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/40">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">ROAS Iklan Live</h3>
                <span className="text-[11px] text-zinc-400">Return On Ad Spend</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              parseFloat(roasMetrics.roasAdsOnly) >= 4 
                ? 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/30' 
                : parseFloat(roasMetrics.roasAdsOnly) >= 2 
                ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                : 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30'
            }`}>
              {parseFloat(roasMetrics.roasAdsOnly) >= 4 ? 'Menguntungkan' : parseFloat(roasMetrics.roasAdsOnly) >= 2 ? 'Moderat' : 'Optimasi'}
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-zinc-400">Rasio Omzet vs Iklan:</div>
            <div className="text-3xl font-black text-[#25F4EE] mt-1 flex items-baseline gap-1">
              <span>{roasMetrics.roasAdsOnly}x</span>
              <span className="text-xs text-zinc-400 font-semibold">ROAS</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2">
              Tiap Rp 1 biaya iklan menghasilkan Rp {roasMetrics.roasAdsOnly} omzet.
            </div>
          </div>
        </div>

        {/* Iklan Marketplace */}
        <div className="p-6 rounded-3xl bg-[#161823] text-white border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Saldo Marketplace Ads</h3>
                <span className="text-[11px] text-zinc-400">Kredit Iklan Aktif</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
              Realtime
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-zinc-400">Sisa Saldo Iklan:</div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-[#25F4EE]">
              {formatRupiah(adsCoinInfo.remainingAds)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
              <div>Topup: <strong className="text-white">{formatRupiah(adsCoinInfo.totalAdsTopup)}</strong></div>
              <div>Terpakai: <strong className="text-white">{formatRupiah(adsCoinInfo.totalAdsUsed)}</strong></div>
            </div>
          </div>
        </div>

        {/* Koin Marketplace */}
        <div className="p-6 rounded-3xl bg-[#161823] text-white border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-amber-400 border border-white/10">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Saldo Koin Live</h3>
                <span className="text-[11px] text-zinc-400">Koin Live Reward</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Realtime
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-zinc-400">Sisa Saldo Koin Live:</div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-amber-400">
              {formatRupiah(adsCoinInfo.remainingCoin)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
              <div>Topup: <strong className="text-white">{formatRupiah(adsCoinInfo.totalCoinTopup)}</strong></div>
              <div>Terpakai: <strong className="text-white">{formatRupiah(adsCoinInfo.totalCoinUsed)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* DUA PILIHAN UTAMA TOP UP SALDO */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#25F4EE]" />
            <span>Aksi Kelola Saldo</span>
          </h3>
          <span className="text-[11px] text-zinc-500 font-semibold">
            Pilih tindakan topup
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Input Topup Saldo Card */}
          <div
            id="card-nav-topup-input"
            onClick={() => onNavigate('/topup-saldo/input')}
            className="group rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-[#161823] hover:bg-[#1c1f2e] hover:border-emerald-400 transition-all duration-200 cursor-pointer flex items-center gap-3.5 shadow-md active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 text-emerald-400 shrink-0 shadow-inner">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <MarqueeText
                text="Input Top-Up Saldo"
                as="h4"
                className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors leading-tight"
              />
              <MarqueeText
                text="Tambah saldo iklan marketplace atau koin live"
                as="p"
                speed={12}
                className="text-xs text-zinc-400 leading-snug mt-0.5"
              />
            </div>
          </div>

          {/* 2. Riwayat Topup Saldo Card */}
          <div
            id="card-nav-topup-riwayat"
            onClick={() => onNavigate('/topup-saldo/riwayat')}
            className="group rounded-2xl p-4 sm:p-5 border border-[#25F4EE]/30 bg-[#161823] hover:bg-[#1c1f2e] hover:border-[#25F4EE] transition-all duration-200 cursor-pointer flex items-center gap-3.5 shadow-md active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 text-[#25F4EE] shrink-0 shadow-inner">
              <History className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <MarqueeText
                text="Riwayat & Mutasi Saldo"
                as="h4"
                className="text-sm sm:text-base font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
              />
              <MarqueeText
                text="Daftar transaksi, mutasi, filter tanggal & edit"
                as="p"
                speed={12}
                className="text-xs text-zinc-400 leading-snug mt-0.5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
