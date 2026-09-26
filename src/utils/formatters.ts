/**
 * Helper functions for formatting numbers, currency, and dates
 */
import { BallQualityGrade } from '../types';

export const formatRupiah = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) || 0 : amount || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (val: number | string | undefined | null): string => {
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0 : val || 0;
  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Format string with commas for inputs
 * e.g. 1000000 -> 1,000,000 or 1.000.000
 */
export const formatInputComma = (val: number | string): string => {
  if (val === '' || val === null || val === undefined) return '';
  let cleanStr = String(val).replace(/[^0-9]/g, '');
  // Strip leading zeros unless it's just '0'
  cleanStr = cleanStr.replace(/^0+(?=\d)/, '');
  if (!cleanStr) return '';
  return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseInputComma = (val: string | number): number => {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/,/g, '').replace(/\./g, '').trim();
  return parseFloat(clean) || 0;
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const roleLabels: Record<string, string> = {
  owner: 'Owner Toko',
  manager: 'Manager Toko',
  investor: 'Investor',
  host: 'Host Live',
  admin_toko: 'Admin Toko',
  sortir: 'Sortir',
  steam: 'Steam',
  multi_role: 'Bonus Rangkap Role',
  monthly_bonus: 'Bonus Target Omzet Bulanan',
};

export const roleBadgeColors: Record<string, string> = {
  owner: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  manager: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  investor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  host: 'bg-[#FE2C55]/15 text-[#FE2C55] border-[#FE2C55]/30',
  admin_toko: 'bg-[#25F4EE]/15 text-[#25F4EE] border-[#25F4EE]/30',
  sortir: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  steam: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  multi_role: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export const fashionCategoryLabels: Record<string, string> = {
  semua_fashion: 'Semua Kategori Fashion',
  thrift_vintage: 'Thrift / Vintage Import',
  pakaian_jadi: 'Pakaian Jadi / Konveksi Baru',
  hijab_muslim: 'Gamis, Hijab & Busana Muslim',
  kaos_distro: 'Kaos, Distro & Streetwear',
  kemeja_celana: 'Kemeja, Celana & Formal',
  sepatu_sandal: 'Sepatu, Sandal & Footwear',
  tas_dompet: 'Tas, Ransel & Dompet',
  aksesoris: 'Aksesoris & Pelengkap',
  custom_jahit: 'Custom / Jahit / Handmade',
  umum_fashion: 'Fashion Umum & Lainnya',
};

export const salesChannelLabels: Record<string, { label: string; type: 'live' | 'non_live'; color: string }> = {
  shopee: { label: 'Shopee', type: 'non_live', color: 'from-orange-500 to-amber-500' },
  tiktok: { label: 'TikTok', type: 'live', color: 'from-[#FE2C55] to-[#25F4EE]' },
  tokopedia: { label: 'Tokopedia', type: 'non_live', color: 'from-emerald-500 to-teal-500' },
  offline: { label: 'Offline', type: 'non_live', color: 'from-blue-500 to-indigo-600' },
  whatsapp: { label: 'WhatsApp', type: 'non_live', color: 'from-emerald-500 to-green-500' },
  instagram: { label: 'Instagram', type: 'non_live', color: 'from-purple-500 to-pink-500' },
  website: { label: 'Website', type: 'non_live', color: 'from-sky-500 to-blue-600' },
  lainnya: { label: 'Lainnya', type: 'non_live', color: 'from-zinc-500 to-zinc-600' },
  // Backward compatibility keys for existing records:
  tiktok_live: { label: 'TikTok', type: 'live', color: 'from-[#FE2C55] to-[#25F4EE]' },
  shopee_live: { label: 'Shopee', type: 'live', color: 'from-orange-500 to-amber-500' },
  tokopedia_live: { label: 'Tokopedia', type: 'live', color: 'from-emerald-500 to-teal-500' },
  instagram_live: { label: 'Instagram', type: 'live', color: 'from-pink-500 to-purple-600' },
  shopee_reguler: { label: 'Shopee', type: 'non_live', color: 'from-orange-500 to-orange-600' },
  tiktok_shop_reguler: { label: 'TikTok', type: 'non_live', color: 'from-zinc-900 to-zinc-700' },
  tokopedia_reguler: { label: 'Tokopedia', type: 'non_live', color: 'from-emerald-600 to-green-600' },
  offline_store: { label: 'Offline', type: 'non_live', color: 'from-blue-500 to-indigo-600' },
  whatsapp_order: { label: 'WhatsApp', type: 'non_live', color: 'from-emerald-500 to-green-500' },
  dm_instagram: { label: 'Instagram', type: 'non_live', color: 'from-purple-500 to-pink-500' },
};

export const inventoryUnitLabels: Record<string, string> = {
  ball_karung: 'Ball / Karung (100 - 500 pcs)',
  grosir_seri: 'Grosir / Seri Model',
  lusin: 'Lusin (12 pcs)',
  kodi: 'Kodi (20 pcs)',
  satuan_pcs: 'Satuan Pcs',
};

export const paymentMethodLabels: Record<string, string> = {
  transfer: 'Transfer Bank',
  qris: 'QRIS / E-Wallet',
  cash: 'Tunai / Cash',
  cod: 'COD (Bayar di Tempat)',
  marketplace_balance: 'Saldo Marketplace',
  lainnya: 'Lainnya',
};

export const formatAttendanceRole = (roleStr: string | undefined): string => {
  if (!roleStr) return '-';
  const parts = roleStr.split(',').map(r => r.trim()).filter(Boolean);
  if (parts.length === 0) return '-';
  if (parts.length === 1) {
    return roleLabels[parts[0]] || parts[0];
  }
  return parts.map(p => roleLabels[p] || p).join(' & ');
};

/**
 * Evaluasi Kualitas Ball berdasarkan jumlah Kepala dan total Isi barang:
 * - Jika kepala > 100 dan isi > 270 -> Sangat Bagus
 * - Jika kepala > 70 s/d 100 dan isi > 270 -> Bagus
 * - Jika kepala > 100 dan isi <= 270 -> Bagus
 * - Jika kepala > 70 s/d 100 dan isi <= 270 -> Biasa
 * - Jika kepala <= 70 dan isi > 270 -> Biasa
 * - Jika kepala <= 70 dan isi < 250 (atau <= 270) -> Jelek
 */
export const evaluateBallQuality = (pcsKepala: number, pcsTotal: number): BallQualityGrade => {
  const kepala = Number(pcsKepala) || 0;
  const isi = Number(pcsTotal) || 0;

  if (kepala > 100 && isi > 270) {
    return 'sangat_bagus';
  }
  if ((kepala >= 70 && kepala <= 100 && isi > 270) || (kepala > 100 && isi <= 270)) {
    return 'bagus';
  }
  if ((kepala >= 70 && kepala <= 100 && isi <= 270) || (kepala < 70 && isi > 270)) {
    return 'biasa';
  }
  return 'jelek';
};

export const ballQualityMeta: Record<
  BallQualityGrade,
  {
    label: string;
    badgeClass: string;
    textClass: string;
    description: string;
  }
> = {
  sangat_bagus: {
    label: 'Sangat Bagus',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    textClass: 'text-emerald-400',
    description: 'Kepala > 100 pcs & Isi > 270 pcs',
  },
  bagus: {
    label: 'Bagus',
    badgeClass: 'bg-[#25F4EE]/15 text-[#25F4EE] border-[#25F4EE]/40',
    textClass: 'text-[#25F4EE]',
    description: '(Kepala 70–100 & Isi > 270) atau (Kepala > 100 & Isi < 270)',
  },
  biasa: {
    label: 'Biasa',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    textClass: 'text-amber-400',
    description: '(Kepala 70–100 & Isi < 270) atau (Kepala < 70 & Isi > 270)',
  },
  jelek: {
    label: 'Jelek',
    badgeClass: 'bg-[#FE2C55]/15 text-[#FE2C55] border-[#FE2C55]/40',
    textClass: 'text-[#FE2C55]',
    description: 'Kepala < 70 pcs & Isi < 250 pcs',
  },
};


