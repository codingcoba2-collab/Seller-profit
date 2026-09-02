export type UserRole = 'owner' | 'host' | 'admin_toko' | 'sortir' | 'steam';

export type SalaryType = 'hourly' | 'daily';

export type IncentiveType = 
  | 'none'
  | 'per_pcs_sold'      // per isi terjual
  | 'per_package_sold'  // per paket terjual
  | 'per_ball_pcs'      // per isi ball
  | 'fixed_amount'      // ditentukan langsung oleh owner
  | 'profit_percentage';// persentase laba owner

export type TierCalculationMode = 'excess_only' | 'all_units';

export interface IncentiveConfig {
  type: IncentiveType;
  rate: number; // nominal rupiah or percentage (0-100)
  description?: string;
  // Req: Logika tier if penjualan diatas sekian paket insentif berubah
  hasTierRule?: boolean;
  tierThresholdPackages?: number; // threshold target paket penjualan (misal 15 paket)
  tierRate?: number; // tarif insentif baru/tambahan jika capai target paket (misal 3000)
  tierCalculationMode?: TierCalculationMode; // 'excess_only' (hanya kelebihan selisih paket > target) vs 'all_units' (semua paket jika capai target)
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

export type FashionCategory = 
  | 'semua_fashion'
  | 'thrift_vintage'
  | 'pakaian_jadi'
  | 'hijab_muslim'
  | 'kaos_distro'
  | 'kemeja_celana'
  | 'sepatu_sandal'
  | 'tas_dompet'
  | 'aksesoris'
  | 'custom_jahit'
  | 'umum_fashion';

export type InventoryUnitType = 
  | 'ball_karung'
  | 'grosir_seri'
  | 'lusin'
  | 'kodi'
  | 'satuan_pcs';

export type SalesType = 'live' | 'non_live';

export type SalesChannel = 
  | 'tiktok_live'
  | 'shopee_live'
  | 'tokopedia_live'
  | 'instagram_live'
  | 'shopee_reguler'
  | 'tiktok_shop_reguler'
  | 'tokopedia_reguler'
  | 'offline_store'
  | 'whatsapp_order'
  | 'dm_instagram'
  | 'website'
  | 'lainnya';

export type PaymentMethod = 'transfer' | 'qris' | 'cash' | 'cod' | 'marketplace_balance' | 'lainnya';

export type ThemeMode = 'dark' | 'light';

export type ThemePalette = 'neon' | 'emerald' | 'violet' | 'coral' | 'ocean' | 'minimalist';

export interface ThemeConfig {
  mode: ThemeMode;
  palette: ThemePalette;
}

export interface AIEmployeeEvaluation {
  employeeId: string;
  employeeName: string;
  overallScore: number;
  performanceGrade: string;
  efficiencyRating: {
    productivity: number;
    salesContribution: number;
    discipline: number;
    qualityControl: number;
  };
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  actionableRecommendations: string[];
  suggestedShiftStrategy: string;
  evaluatedAt?: string;
}

export interface BallInventory {
  id: string;
  storeId: string;
  date: string;
  ballType: string; // nama stok / kode / nama ball / seri
  category?: FashionCategory; // Kategori fashion (Thrift, Baju Baru, Hijab, Distro, dll.)
  unitType?: InventoryUnitType; // Ball karung, Lusin, Seri, Satuan, dll.
  modalPrice: number;
  pcsCount: number; // isi pcs total
  shippingCost: number; // ongkir
  steamCost: number; // biaya steam / finishing
  sortirCost: number; // biaya sortir / QC
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
  salesType?: SalesType; // 'live' vs 'non_live'
  salesChannel?: SalesChannel | string; // 'shopee_live', 'tiktok_live', 'offline_store', 'shopee_reguler', 'whatsapp_order', etc.
  channelName?: string; // Display channel label e.g. "Shopee Reguler", "Toko Offline", "WhatsApp"
  category?: FashionCategory | string; // Fashion category e.g. 'pakaian_jadi', 'hijab_muslim', 'thrift_vintage'
  hostIds?: string[];
  hostNames?: string[];
  adminIds?: string[]; // ID admin toko / kasir
  adminNames?: string[]; // Nama admin toko / kasir
  adminId?: string; // single fallback
  adminName?: string; // single fallback
  omzet: number;
  pcsSold: number; // jumlah pcs terjual
  packagesSold: number; // jumlah paket / order terjual
  hoursWorked?: number; // jam durasi live (jika live)
  coinUsed?: number; // koin live / voucher diskon toko
  adsUsed?: number; // iklan marketplace live / ads non-live
  paymentMethod?: PaymentMethod | string;
  notes?: string; // Catatan invoice / pesanan pelanggan
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
  paymentType?: 'gaji_insentif' | 'kasbon'; // Opsi pembayaran gaji & insentif vs kasbon
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

