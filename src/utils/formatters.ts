/**
 * Helper functions for formatting numbers, currency, and dates
 */

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
  host: 'Host Live',
  admin_toko: 'Admin Toko',
  sortir: 'Sortir',
  steam: 'Steam',
  multi_role: 'Bonus Rangkap Role',
  monthly_bonus: 'Bonus Target Omzet Bulanan',
};

export const roleBadgeColors: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 border-amber-300',
  host: 'bg-pink-100 text-pink-800 border-pink-300',
  admin_toko: 'bg-sky-100 text-sky-800 border-sky-300',
  sortir: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  steam: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  multi_role: 'bg-purple-100 text-purple-800 border-purple-300',
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
