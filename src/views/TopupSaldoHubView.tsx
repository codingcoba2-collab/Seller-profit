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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 space-y-3 text-white font-sans">
      {/* ROAS & Saldo Summary Cards - Compact & Space-Saving */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
        {/* ROAS Metric Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] text-white border border-[#25F4EE]/30 shadow-md space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/40">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white">ROAS Iklan Live</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
              parseFloat(roasMetrics.roasAdsOnly) >= 4 
                ? 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/30' 
                : parseFloat(roasMetrics.roasAdsOnly) >= 2 
                ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' 
                : 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30'
            }`}>
              {parseFloat(roasMetrics.roasAdsOnly) >= 4 ? 'Menguntungkan' : parseFloat(roasMetrics.roasAdsOnly) >= 2 ? 'Moderat' : 'Optimasi'}
            </span>
          </div>

          <div className="pt-1.5 border-t border-white/10">
            <div className="text-[11px] text-zinc-400">Rasio Omzet vs Iklan:</div>
            <div className="text-xl sm:text-2xl font-black text-[#25F4EE] flex items-baseline gap-1">
              <span>{roasMetrics.roasAdsOnly}x</span>
              <span className="text-[10px] text-zinc-400 font-semibold">ROAS</span>
            </div>
          </div>
        </div>

        {/* Iklan Marketplace */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] text-white border border-white/10 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Saldo Marketplace Ads</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
              Realtime
            </span>
          </div>

          <div className="pt-1.5 border-t border-white/10">
            <div className="text-[11px] text-zinc-400">Sisa Saldo Iklan:</div>
            <div className="text-xl sm:text-2xl font-black text-[#25F4EE]">
              {formatRupiah(adsCoinInfo.remainingAds)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-white/5 text-[10px] text-zinc-400">
              <div>Topup: <strong className="text-white">{formatRupiah(adsCoinInfo.totalAdsTopup)}</strong></div>
              <div>Terpakai: <strong className="text-white">{formatRupiah(adsCoinInfo.totalAdsUsed)}</strong></div>
            </div>
          </div>
        </div>

        {/* Koin Marketplace */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161823] text-white border border-white/10 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#0b0c10] text-amber-400 border border-white/10">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Saldo Koin Live</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Realtime
            </span>
          </div>

          <div className="pt-1.5 border-t border-white/10">
            <div className="text-[11px] text-zinc-400">Sisa Saldo Koin Live:</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {formatRupiah(adsCoinInfo.remainingCoin)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-white/5 text-[10px] text-zinc-400">
              <div>Topup: <strong className="text-white">{formatRupiah(adsCoinInfo.totalCoinTopup)}</strong></div>
              <div>Terpakai: <strong className="text-white">{formatRupiah(adsCoinInfo.totalCoinUsed)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* DUA PILIHAN UTAMA TOP UP SALDO - Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          {/* 1. Input Topup Saldo Card */}
          <div
            id="card-nav-topup-input"
            onClick={() => onNavigate('/topup-saldo/input')}
            className="group rounded-xl p-3 sm:p-3.5 border border-emerald-500/30 bg-[#161823] hover:bg-[#1c1f2e] hover:border-emerald-400 transition-all duration-200 cursor-pointer flex items-center gap-3 shadow-md active:scale-[0.99]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 text-emerald-400 shrink-0 shadow-inner">
              <PlusCircle className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1 w-full overflow-hidden">
              <MarqueeText
                text="Input Top-Up Saldo"
                className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition-colors leading-tight"
              />
              <MarqueeText
                text="Catat penambahan saldo modal iklan & koin live dari transfer bank atau e-wallet"
                speed={20}
                className="text-[11px] text-zinc-400 mt-0.5 leading-snug"
              />
            </div>
          </div>

          {/* 2. Riwayat Topup Saldo Card */}
          <div
            id="card-nav-topup-riwayat"
            onClick={() => onNavigate('/topup-saldo/riwayat')}
            className="group rounded-xl p-3 sm:p-3.5 border border-[#25F4EE]/30 bg-[#161823] hover:bg-[#1c1f2e] hover:border-[#25F4EE] transition-all duration-200 cursor-pointer flex items-center gap-3 shadow-md active:scale-[0.99]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 text-[#25F4EE] shrink-0 shadow-inner">
              <History className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1 w-full overflow-hidden">
              <MarqueeText
                text="Riwayat & Mutasi Saldo"
                className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
              />
              <MarqueeText
                text="Daftar histori mutasi deposit, bukti transfer, dan filter riwayat tanggal top-up"
                speed={20}
                className="text-[11px] text-zinc-400 mt-0.5 leading-snug"
              />
            </div>
          </div>
      </div>
    </div>
  );
};
