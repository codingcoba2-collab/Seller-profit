import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdsCoinDeposit, CurrentUser } from '../types';
import { formatRupiah, formatDateIndo, getTodayString } from '../utils/formatters';
import { RoutePath } from '../services/navigation';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { 
  History, 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  Coins, 
  Megaphone,
  Filter,
  ArrowLeft
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
    type: 'delete',
    onConfirm: () => {},
  });

  const loadData = () => {
    const list = StorageService.getAdsCoins(currentUser.storeId);
    setDepositList(list);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const handleDelete = (id: string, noteText?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Riwayat Top-Up',
      message: `Apakah Anda yakin ingin menghapus data riwayat top-up ${noteText ? `"${noteText}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteAdsCoin(id);
        loadData();
        onNotify('Data top-up berhasil dihapus.', 'info');
      },
    });
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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
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

      {/* Riwayat List Cards */}
      <div className="space-y-2">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#161823] rounded-3xl border border-white/10 shadow-xl">
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
          filteredList.map((item) => {
            const total = item.adsAmount + item.coinAmount;
            return (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#161823] border border-white/10 hover:border-white/20 transition-all shadow-sm space-y-2"
              >
                {/* Top Row: Date badge on Left, Action buttons on Right */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#0b0c10] border border-white/10 text-zinc-300">
                    {formatDateIndo(item.date)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('/topup-saldo/input', item.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                      title="Edit data ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.notes || `Rp ${formatRupiah(total)}`)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                      title="Hapus data"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Row: Nominal Total on Left, Sub-breakdown on Right */}
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-base sm:text-lg font-black text-white tracking-tight">
                      {formatRupiah(total)}
                    </div>
                  </div>

                  <div className="text-right min-w-0 flex-1 flex flex-wrap items-center justify-end gap-2 text-xs">
                    {item.adsAmount > 0 && (
                      <span className="text-[#25F4EE] font-bold">
                        Iklan: {formatRupiah(item.adsAmount)}
                      </span>
                    )}
                    {item.adsAmount > 0 && item.coinAmount > 0 && (
                      <span className="text-zinc-600">•</span>
                    )}
                    {item.coinAmount > 0 && (
                      <span className="text-amber-400 font-bold">
                        Koin: {formatRupiah(item.coinAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Description / Catatan if present */}
                {item.notes && (
                  <div className="pt-1.5 border-t border-white/5 text-[11px] sm:text-xs text-zinc-400 leading-snug">
                    <span className="text-zinc-500 font-medium">Catatan: </span>
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

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
