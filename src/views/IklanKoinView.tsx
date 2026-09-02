import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { AdsCoinDeposit, CurrentUser } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, getTodayString } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  Coins, 
  Megaphone, 
  Trash2, 
  Wallet, 
  CheckCircle2, 
  Edit3, 
  ArrowLeft, 
  Search,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface IklanKoinViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const IklanKoinView: React.FC<IklanKoinViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [depositList, setDepositList] = useState<AdsCoinDeposit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [adsAmount, setAdsAmount] = useState<number>(1000000);
  const [coinAmount, setCoinAmount] = useState<number>(500000);
  const [notes, setNotes] = useState('Topup Shopee Ads & Koin Live');

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

  const loadData = () => {
    const list = StorageService.getAdsCoins(currentUser.storeId);
    setDepositList(list);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const resetForm = () => {
    setEditingId(null);
    setDate(getTodayString());
    setAdsAmount(1000000);
    setCoinAmount(500000);
    setNotes('Topup Shopee Ads & Koin Live');
  };

  const handleStartEdit = (item: AdsCoinDeposit) => {
    setEditingId(item.id);
    setDate(item.date);
    setAdsAmount(item.adsAmount);
    setCoinAmount(item.coinAmount);
    setNotes(item.notes || '');
    setSubTab('input');
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adsAmount <= 0 && coinAmount <= 0) {
      onNotify('Masukkan nominal topup iklan atau koin!', 'error');
      return;
    }

    const newDeposit: AdsCoinDeposit = {
      id: editingId || 'adscoin-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      adsAmount,
      coinAmount,
      notes,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      const all = StorageService.getAdsCoins(currentUser.storeId);
      const updated = all.map(d => d.id === editingId ? newDeposit : d);
      localStorage.setItem('shopee_lr_adscoins', JSON.stringify(updated));
      onNotify('Perubahan saldo topup iklan/koin berhasil disimpan!', 'success');
    } else {
      StorageService.addAdsCoin(newDeposit);
      onNotify('Top-up saldo iklan/koin berhasil dicatat!', 'success');
    }

    loadData();
    resetForm();
    setSubTab('output');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus riwayat topup ini?')) {
      StorageService.deleteAdsCoin(id);
      loadData();
      onNotify('Data top-up berhasil dihapus.', 'info');
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & sort list by date desc
  const filteredList = depositList
    .filter(d => {
      if (searchQuery.trim()) {
        if (!d.notes?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      if (periodFilter === 'today') return d.date === getTodayString();
      if (periodFilter === 'range') return d.date >= startDate && d.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return d.date >= weekAgo && d.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return d.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-iklan"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Saldo Iklan &amp; Koin Cashback Shopee
            </h2>
          </div>
        </div>
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

        {/* Iklan Shopee */}
        <div className="p-6 rounded-3xl bg-[#161823] text-white border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-[#25F4EE] border border-white/10">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Saldo Shopee Ads</h3>
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

        {/* Koin Shopee */}
        <div className="p-6 rounded-3xl bg-[#161823] text-white border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#0b0c10] text-amber-400 border border-white/10">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Saldo Koin Cashback</h3>
                <span className="text-[11px] text-zinc-400">Koin Live Reward</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Realtime
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-zinc-400">Sisa Saldo Koin:</div>
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

      {/* Sub Navigation */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Topup' : 'Input Topup Saldo'}
        outputTitle="Riwayat Topup Saldo"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-3xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <Wallet className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingId ? 'Edit Data Top-Up Saldo' : 'Form Top-Up Saldo Iklan & Koin'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tanggal Top-Up <span className="text-[#FE2C55]">*</span>
              </label>
              <input
                id="input-topup-date"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nominal Topup Shopee Ads / Iklan (Rp)
                </label>
                <CommaNumberInput
                  id="input-topup-ads"
                  value={adsAmount}
                  onChange={setAdsAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-black focus:border-[#25F4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nominal Topup Koin Cashback (Rp)
                </label>
                <CommaNumberInput
                  id="input-topup-coin"
                  value={coinAmount}
                  onChange={setCoinAmount}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-amber-400 font-black focus:border-[#25F4EE]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Keterangan / Sumber Dana Topup
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Topup via BCA / Saldo Penjual"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />
            </div>

            <button
              id="btn-submit-topup"
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{editingId ? 'Simpan Perubahan Top-up' : 'Simpan Transaksi Top-Up'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & LAPORAN */}
      {subTab === 'output' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari keterangan..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
                />
              </div>

              <select
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
              >
                <option value="all">Semua Periode</option>
                <option value="today">Hari Ini</option>
                <option value="weekly">7 Hari</option>
                <option value="monthly">Bulan Ini</option>
              </select>
            </div>

            <button
              onClick={() => {
                resetForm();
                setSubTab('input');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Input Topup
            </button>
          </div>

          {/* List of Topups (Sorted by date desc) */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Riwayat Top-up Saldo ({filteredList.length})
              </h3>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data top-up pada filter ini.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {formatDateIndo(item.date)}
                        </span>
                        {item.adsAmount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#25F4EE]/10 text-[#25F4EE] text-[10px] font-bold border border-[#25F4EE]/30">
                            Iklan: {formatRupiah(item.adsAmount)}
                          </span>
                        )}
                        {item.coinAmount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                            Koin: {formatRupiah(item.coinAmount)}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-400">
                        {item.notes}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-white">
                          {formatRupiah(item.adsAmount + item.coinAmount)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Total Topup
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                          title="Edit Topup"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Hapus Topup"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
