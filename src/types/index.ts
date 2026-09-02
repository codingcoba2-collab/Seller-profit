export type UserRole = 'owner' | 'host' | 'admin_toko' | 'sortir' | 'steam';

export type SalaryType = 'hourly' | 'daily';

export type IncentiveType = 
  | 'none'
  | 'per_pcs_sold'      // per isi terjual
  | 'per_package_sold'  // per paket terjual
  | 'per_ball_pcs'      // per isi ball
  | 'fixed_amount'      // ditentukan langsung oleh owner
  | 'profit_percentage';// persentase laba owner

export interface IncentiveConfig {
  type: IncentiveType;
  rate: number; // nominal rupiah or percentage (0-100)
  description?: string;
  // Req 7: Logika tier if penjualan diatas sekian paket insentif berubah
  hasTierRule?: boolean;
  tierThresholdPackages?: number; // threshold target paket penjualan
  tierRate?: number; // tarif insentif baru jika capai target paket
}

// Req 8: Logika if rangkap role dan penjualan diatas sekian paket gaji per jam/per bulan/bonus per paket/pcs berubah
export interface MultiRoleSalesRule {
  active: boolean;
  thresholdPackages: number; // target paket penjualan
  benefitType: 'hourly_rate_override' | 'fixed_monthly_override' | 'bonus_per_package' | 'bonus_per_pcs' | 'fixed_amount';
  benefitValue: number; // nominal pasti rupiah
  description?: string;
}

// Req 9: Logika if omzet mencapai sekian bonus akhir bulan didapat (persentase omzet, persentase laba bersih toko, atau nominal pasti)
export interface MonthlyOmzetBonusRule {
  active: boolean;
  targetOmzet: number; // target minimal omzet
  bonusType: 'percentage' | 'percentage_laba_bersih' | 'fixed'; // persentase omzet kotor, persentase laba bersih toko, atau nominal pasti
  bonusValue: number; // persen (misal: 2% atau 5%) atau rupiah (misal: 1000000)
  description?: string;
}

export interface Employee {
  id: string;
  storeId: string;
  name: string;
  username: string;
  password?: string;
  roles: UserRole[]; // Can have multiple roles (rangkap role)
  salaryType: SalaryType; // per jam or per hari
  salaryRate: number; // nominal gaji per jam atau per hari
  // For double roles, incentive config per role
  incentiveConfigs: {
    [key in UserRole]?: IncentiveConfig;
  };
  // Req 8 & Req 9 rules
  multiRoleSalesRule?: MultiRoleSalesRule;
  monthlyOmzetBonusRule?: MonthlyOmzetBonusRule;
  isActive: boolean;
  createdAt: string;
}

export interface StoreAccount {
  id: string;
  storeName: string;
  ownerUsername: string;
  ownerPassword?: string;
  createdAt: string;
  settings: {
    adminPromoPercentage: number; // e.g. 8.5
    adminPromoName: string;
    serviceFeePerOrder: number; // e.g. 1250
    returnMechanism: 'estimate' | 'detail';
    estimateReturnPercentage: number; // e.g. 5
  };
}

export interface BallInventory {
  id: string;
  storeId: string;
  date: string;
  ballType: string;
  modalPrice: number;
  pcsCount: number; // isi ball
  shippingCost: number; // ongkir ball
  steamCost: number; // biaya steam
  sortirCost: number; // biaya sortir
  hppPerPcs: number; // (modal + ongkir + steam + sortir) / pcs
  returnMechanism: 'estimate' | 'detail';
  estimateReturnPercentage: number;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  storeId: string;
  date: string;
  employeeId: string;
  employeeName: string;
  role: UserRole | string; // Can be single role or combined roles like 'host,admin_toko' or 'steam,sortir'
  rolesExecuted?: UserRole[];
  salaryType: SalaryType;
  hoursWorked: number; // if hourly, e.g. 4.5 hours; if daily: 1 shift
  notes?: string;
  createdAt: string;
}

export interface SalesRecord {
  id: string;
  storeId: string;
  date: string;
  hostIds: string[];
  hostNames: string[];
  adminIds?: string[]; // ID admin toko yang bertugas catat & packing di sesi live ini
  adminNames?: string[]; // Nama admin toko yang bertugas
  adminId?: string; // single fallback
  adminName?: string; // single fallback
  omzet: number;
  pcsSold: number; // jumlah pcs terjual
  packagesSold: number; // jumlah paket terjual
  hoursWorked: number;
  coinUsed: number;
  adsUsed: number;
  recordedBy: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  storeId: string;
  date: string;
  packageCount: number;
  totalAmount: number;
  reason?: string;
  recordedBy: string;
  createdAt: string;
}

export interface AdsCoinDeposit {
  id: string;
  storeId: string;
  date: string;
  adsAmount: number;
  coinAmount: number;
  notes?: string;
  createdAt: string;
}

export interface CashflowRecord {
  id: string;
  storeId: string;
  date: string;
  type: 'inflow' | 'outflow'; // saldo ditarik (inflow) / pengeluaran (outflow)
  amount: number;
  description: string;
  category: 
    | 'penarikan_marketplace' 
    | 'penarikan_shopee' 
    | 'gaji' 
    | 'gaji_pegawai' 
    | 'operasional' 
    | 'packing' 
    | 'makan_minum' 
    | 'listrik_wifi' 
    | 'sewa_tempat' 
    | 'lainnya';
  employeeId?: string; // ID pegawai jika kategori gaji_pegawai
  employeeName?: string; // Nama pegawai jika kategori gaji_pegawai
  periodMonth?: string; // Periode bulan gaji (misal: "2026-09" atau "September 2026")
  proofImageUrl?: string; // Foto bukti transfer / struk pembayaran gaji (base64)
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  username: string;
  isOwner: boolean;
  roles: UserRole[];
  employeeProfile?: Employee;
  isGuest?: boolean;
}

export type ViewState = 
  | 'login'
  | 'dashboard'
  | 'role_management'   // Tahap 2
  | 'modal_stok'        // Tahap 3
  | 'steam_sortir'      // Menu Khusus Role Steam & Sortir
  | 'admin_shopee'      // Tahap 4: Admin Marketplace & Layanan
  | 'kehadiran'         // Tahap 5
  | 'penjualan'         // Tahap 6
  | 'return'            // Tahap 7
  | 'iklan_koin'        // Tahap 8
  | 'gaji'              // Tahap 9
  | 'laba_rugi'         // Tahap 10
  | 'cashflow'          // Tahap 11
  | 'laba_bersih'       // Tahap 12
  | 'index_performa';   // Tahap 13

export interface SteamSortirRecord {
  id: string;
  storeId: string;
  date: string;
  ballInventoryId?: string;
  ballName: string;
  processType: 'sortir' | 'steam' | 'sortir_dan_steam';
  employeeIds: string[];
  employeeNames: string[];
  pcsTotal: number;
  pcsLayakJual: number;
  pcsReject: number;
  costPerPcs?: number; // Optional: jasa per pcs dihapus dari form, upah melalui absensi
  totalCost?: number;
  status: 'proses' | 'selesai';
  notes?: string;
  createdAt: string;
}

export type ActiveTab = ViewState;

export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'all';

