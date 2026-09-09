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

export type SaleFormat = 'satuan' | 'bundling' | 'campuran';

export interface IncentiveConfig {
  type: IncentiveType;
  rate: number; // nominal rupiah or percentage (0-100)
  description?: string;
  // Req: Logika tier if penjualan diatas sekian paket insentif berubah
  hasTierRule?: boolean;
  tierThresholdPackages?: number; // threshold target paket penjualan (misal 15 paket)
  tierRate?: number; // tarif insentif berjenjang default / bundling (misal 3000)
  tierRateBundling?: number; // tarif insentif berjenjang (Bundling) (Rp)
  tierRateSatuan?: number; // tarif insentif berjenjang (Satuan) (Rp)
  tierCalculationMode?: TierCalculationMode; // 'excess_only' (hanya kelebihan selisih paket > target) vs 'all_units' (semua paket jika capai target)
  // Req 4: Pengaturan Insentif Terpisah Penjualan Satuan & Bundling untuk Host Live
  hasSeparateBundlingSatuan?: boolean;
  satuanRate?: number; // misal Rp 1.000 per pcs satuan atau per paket satuan
  satuanIncentiveType?: 'per_pcs_sold' | 'per_package_sold' | 'percentage';
  bundlingRate?: number; // misal Rp 2.500 per paket bundling atau per pcs
  bundlingIncentiveType?: 'per_package_sold' | 'per_pcs_sold' | 'percentage';
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

export interface ChannelFeeConfig {
  id: string;
  channel: string; // 'shopee' | 'tiktok' | 'tokopedia' | 'offline' | 'whatsapp' | 'lainnya'
  name: string; // e.g. 'Shopee Live & Marketplace', 'TikTok Shop', 'Toko Offline / Fisik'
  adminPercentage: number; // e.g. 8.5
  serviceFeePerOrder: number; // e.g. 1250
  isActive: boolean;
  notes?: string;
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
    averagePackingCost?: number; // e.g. 1500
    channelFees?: ChannelFeeConfig[];
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

export type ThemePalette = 'arcteryx' | 'neon' | 'emerald' | 'violet' | 'coral' | 'ocean' | 'minimalist';

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
  sizes?: string[]; // Pilihan ukuran e.g. ['S', 'M', 'L', 'XL']
  sizeBreakdown?: { [size: string]: number }; // e.g. { S: 50, M: 100, L: 100, XL: 50 }
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
  saleFormat?: SaleFormat; // 'satuan' | 'bundling' | 'campuran'
  satuanPcs?: number; // Pcs dari penjualan satuan
  satuanPackages?: number; // Paket / order satuan
  satuanOmzet?: number; // Omzet dari penjualan satuan
  bundlingPcs?: number; // Pcs total dari bundling (misal 1 paket isi 3 pcs)
  bundlingPackages?: number; // Jumlah paket bundling
  bundlingOmzet?: number; // Omzet dari bundling
  selectedSizes?: string[]; // Ukuran produk yang terjual: ['S', 'M', 'L', 'XL']
  sizeBreakdown?: { [size: string]: number };
  sizeNotes?: string;
  hostIds?: string[];
  hostNames?: string[];
  adminIds?: string[]; // ID admin toko / kasir
  adminNames?: string[]; // Nama admin toko / kasir
  adminId?: string; // single fallback
  adminName?: string; // single fallback
  omzet: number;
  pcsSold: number; // jumlah pcs terjual (total)
  packagesSold: number; // jumlah paket / order terjual (total)
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
    | 'konsumsi_pribadi' // Pengeluaran Konsumsi Pribadi (Prive Pemilik)
    | 'lainnya';
  employeeId?: string; // ID pegawai jika kategori gaji_pegawai
  employeeName?: string; // Nama pegawai jika kategori gaji_pegawai
  periodMonth?: string; // Periode bulan gaji (misal: "2026-09" atau "September 2026")
  paymentType?: 'gaji_insentif' | 'kasbon'; // Opsi pembayaran gaji & insentif vs kasbon
  proofImageUrl?: string; // Foto bukti transfer / struk pembayaran gaji (base64)
  personalBudgetCategory?: PersonalBudgetCategory; // Optional: kategori pos pribadi ('sehari_hari', 'utang', dll)
  recordedBy?: string;
  createdAt: string;
}

// ARUS KEUANGAN PRIBADI
export type PersonalBudgetCategory = 'sehari_hari' | 'utang' | 'tabungan' | 'investasi_toko';

export interface PersonalBudgetAllocation {
  totalIncome: number; // Uang pribadi masuk misal Rp 1.000.000
  sehariHariPercent: number; // misal 50%
  utangPercent: number; // misal 20%
  tabunganPercent: number; // misal 15%
  investasiTokoPercent: number; // misal 15%
  updatedAt?: string;
}

export interface PersonalExpenseRecord {
  id: string;
  storeId: string;
  date: string;
  category: PersonalBudgetCategory;
  amount: number;
  description: string;
  sourceCashflowId?: string; // Jika otomatis disinkronkan dari kas konsumsi pribadi
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
  | 'category_persiapan'
  | 'category_penjualan'
  | 'category_keuangan'
  | 'role_management'   // Persiapan: Manajemen Pegawai & Role
  | 'modal_stok'        // Persiapan: Modal & Stok (HPP)
  | 'steam_sortir'      // Persiapan: Sortir, QC dan Finishing
  | 'admin_shopee'      // Persiapan: Biaya Admin Marketplace
  | 'iklan_koin'        // Persiapan: Saldo Biaya Iklan & Koin Live
  | 'topup_saldo_input' // Topup Saldo Form Input
  | 'topup_saldo_riwayat' // Topup Saldo Riwayat
  | 'kehadiran'         // Penjualan: Presensi & Kehadiran Shift
  | 'penjualan'         // Penjualan: Data Penjualan (Live & Non-Live)
  | 'statistik'         // Penjualan: Statistik & Analisis Penjualan
  | 'return'            // Penjualan: Data Return & Paket Return
  | 'laba_rugi'         // Penjualan: Laporan & Laba Rugi Sesi
  | 'index_performa'    // Penjualan: Index Performa & Efektivitas AI
  | 'gaji'              // Keuangan: Slip Gaji & Insentif
  | 'cashflow'          // Keuangan: Cashflow & Arus Kas
  | 'laba_bersih'       // Keuangan: Laporan Laba Bersih Toko
  | 'keuangan_pribadi' // Keuangan: Cashflow & Keuangan Pribadi
  | 'kalkulasi_paket'; // Penjualan / AI: Kalkulasi Harga & Paket Terjual

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

