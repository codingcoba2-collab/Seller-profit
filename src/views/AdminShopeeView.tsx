import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { Settings, Percent, ShoppingCart, ShieldCheck, Tag, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AdminShopeeViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminShopeeView: React.FC<AdminShopeeViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [adminPromoPercentage, setAdminPromoPercentage] = useState<number>(8.5);
  const [serviceFeePerOrder, setServiceFeePerOrder] = useState<number>(1250);

  useEffect(() => {
    const store = StorageService.getStoreById(currentUser.storeId);
    if (store?.settings) {
      setAdminPromoPercentage(store.settings.adminPromoPercentage ?? 8.5);
      setServiceFeePerOrder(store.settings.serviceFeePerOrder ?? 1250);
    }
  }, [currentUser.storeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateStoreSettings(currentUser.storeId, {
      adminPromoPercentage,
      serviceFeePerOrder,
    });
    onNotify('Pengaturan biaya admin & layanan Marketplace berhasil disimpan!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-adminshopee"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pengaturan Biaya Admin &amp; Layanan Marketplace
            </h2>
          </div>
        </div>
      </div>

      <div className="bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Persentase Admin Marketplace */}
          <div className="p-5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#FE2C55]" />
                <span>Jumlah Biaya Admin / Komisi Marketplace (%)</span>
              </label>
              <span className="text-xs font-black text-[#25F4EE] bg-[#25F4EE]/10 border border-[#25F4EE]/30 px-2.5 py-0.5 rounded-lg">
                {adminPromoPercentage}%
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Persentase ini otomatis memotong total omzet kotor saat live untuk menghitung omzet bersih pada laporan laba &amp; rugi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <input
                  id="input-admin-percentage"
                  type="number"
                  step="0.05"
                  min="0"
                  max="100"
                  required
                  value={adminPromoPercentage}
                  onChange={e => setAdminPromoPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-[#161823] px-3.5 py-2.5 text-sm font-bold text-white focus:border-[#25F4EE]"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[6.5, 7.5, 8.5, 9.0, 10.0].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAdminPromoPercentage(pct)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      adminPromoPercentage === pct
                        ? 'bg-[#25F4EE] text-black border-[#25F4EE]'
                        : 'bg-[#161823] text-zinc-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Biaya Layanan per Pesanan */}
          <div className="p-5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#25F4EE]" />
                <span>Biaya Layanan Per Pesanan / Paket (Standar: Rp 1.250 / paket)</span>
              </label>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Biaya tetap yang dikenakan Marketplace untuk setiap nomor resi/paket terkirim.
            </p>

            <CommaNumberInput
              id="input-service-fee"
              value={serviceFeePerOrder}
              onChange={setServiceFeePerOrder}
              className="w-full rounded-xl border border-white/10 bg-[#161823] px-3.5 py-2.5 text-sm font-bold text-white focus:border-[#25F4EE]"
            />
          </div>

          <button
            id="btn-save-admin-settings"
            type="submit"
            className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Simpan Pengaturan Biaya Marketplace</span>
          </button>
        </form>
      </div>
    </div>
  );
};
