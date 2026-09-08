import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdsCoinDeposit, CurrentUser } from '../types';
import { formatRupiah, formatDateIndo, getTodayString } from '../utils/formatters';
import { RoutePath } from '../services/navigation';
import { 
  History, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  Coins, 
  Megaphone,
  Filter
} from 'lucide-react';

interface TopupSaldoRiwayatViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath, editId?: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TopupSaldoRiwayatView: React.FC<TopupSaldoRiwayatViewProps> = ({
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const [depositList, setDepositList] = useState<AdsCoinDeposit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  const loadData = () => {
    const list = StorageService.getAdsCoins(currentUser.storeId);
    setDepositList(list);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const handleDelete = (id: string) => {
    if (confirm('Hapus riwayat topup ini?')) {
      StorageService.deleteAdsCoin(id);
      loadData();
      onNotify('Data top-up berhasil dihapus.', 'info');
    }
  };

  // Filter & sort list by date desc
  const filteredList = depositList
    .filter((d) => {
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

  const totalTopupAds = filteredList.reduce((acc, curr) => acc + (curr.adsAmount || 0), 0);
  const totalTopupCoins = filteredList.reduce((acc, curr) => acc + (curr.coinAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Segmented Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#161823] border border-white/10 shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-back-to-hub-from-riwayat"
            onClick={() => onNavigate('/topup-saldo')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
            title="Kembali ke Hub Saldo"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Hub Saldo</span>
          </button>
          <span className="text-sm font-black text-white px-1">
            Riwayat Top-Up Saldo
          </span>
        </div>

        {/* Tab Switcher between Input and Riwayat */}
        <div className="flex items-center gap-1 bg-[#0b0c10] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            id="btn-add-new-topup-from-riwayat"
            onClick={() => onNavigate('/topup-saldo/input')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Input Baru</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg text-xs font-black bg-white text-zinc-950 shadow-sm flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Riwayat Data</span>
          </div>
        </div>
      </div>

      {/* Filter & Summary Bar */}
      <div className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Period Filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0b0c10] p-1.5 rounded-2xl border border-white/10">
            {(['all', 'today', 'weekly', 'monthly', 'range'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPeriodFilter(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  periodFilter === mode
                    ? 'bg-white text-zinc-950 shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'all' && 'Semua'}
                {mode === 'today' && 'Hari Ini'}
                {mode === 'weekly' && '7 Hari Terakhir'}
                {mode === 'monthly' && 'Bulan Ini'}
                {mode === 'range' && 'Rentang Tanggal'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan top-up..."
              className="w-full bg-[#0b0c10] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-hidden focus:border-[#25F4EE]"
            />
          </div>
        </div>

        {/* Date range inputs if range selected */}
        {periodFilter === 'range' && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-zinc-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Dari:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-1.5 text-white"
            />
            <span className="text-zinc-400 font-bold">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#0b0c10] border border-white/10 rounded-xl px-3 py-1.5 text-white"
            />
          </div>
        )}

        {/* Quick summary numbers */}
        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-zinc-400">
            Total Riwayat: <strong className="text-white">{filteredList.length} transaksi</strong>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-zinc-400">
              Total Iklan:{' '}
              <strong className="text-[#25F4EE]">{formatRupiah(totalTopupAds)}</strong>
            </span>
            <span className="text-zinc-400">
              Total Koin:{' '}
              <strong className="text-amber-400">{formatRupiah(totalTopupCoins)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Riwayat List / Table */}
      <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-400">Belum ada riwayat top-up pada filter ini.</p>
            <button
              type="button"
              onClick={() => onNavigate('/topup-saldo/input')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#25F4EE] border border-white/10 text-xs font-bold transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Top-Up Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c10] text-zinc-400 border-b border-white/10 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Saldo Iklan</th>
                  <th className="py-3.5 px-4">Koin Live</th>
                  <th className="py-3.5 px-4">Total Topup</th>
                  <th className="py-3.5 px-4">Catatan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((item) => {
                  const total = item.adsAmount + item.coinAmount;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        {formatDateIndo(item.date)}
                      </td>
                      <td className="py-3.5 px-4 text-[#25F4EE] font-black whitespace-nowrap">
                        {formatRupiah(item.adsAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-black whitespace-nowrap">
                        {formatRupiah(item.coinAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-white font-extrabold whitespace-nowrap">
                        {formatRupiah(total)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigate('/topup-saldo/input', item.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
                            title="Edit data ini"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#25F4EE]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-zinc-400 hover:text-[#FE2C55] border border-white/10 transition cursor-pointer"
                            title="Hapus data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
