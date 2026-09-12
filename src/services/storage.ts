import { 
  StoreAccount, 
  Employee, 
  BallInventory, 
  AttendanceRecord, 
  SalesRecord, 
  ReturnRecord, 
  AdsCoinDeposit, 
  CashflowRecord,
  CurrentUser,
  SteamSortirRecord,
  ChannelFeeConfig,
  PersonalBudgetAllocation,
  PersonalExpenseRecord,
  PersonalBudgetCategory,
  ChatMessage,
  StoreAnnouncement
} from '../types';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  type Unsubscribe 
} from './firebase';
import { FirestoreTelemetry } from './firestoreTelemetry';

const STORAGE_KEYS = {
  STORES: 'shopee_lr_stores',
  CURRENT_USER: 'shopee_lr_current_user',
  EMPLOYEES: 'shopee_lr_employees',
  INVENTORY: 'shopee_lr_inventory',
  ATTENDANCE: 'shopee_lr_attendance',
  SALES: 'shopee_lr_sales',
  RETURNS: 'shopee_lr_returns',
  ADS_COINS: 'shopee_lr_adscoins',
  CASHFLOW: 'shopee_lr_cashflow',
  STEAM_SORTIR: 'shopee_lr_steamsortir',
  PERSONAL_BUDGET: 'seller_profit_personal_budget',
  PERSONAL_EXPENSES: 'seller_profit_personal_expenses',
  CHAT_MESSAGES: 'seller_profit_chat_messages',
  ANNOUNCEMENTS: 'seller_profit_announcements',
  USER_PROFILES: 'seller_profit_user_profiles',
};

export const DEFAULT_CHANNEL_FEES: ChannelFeeConfig[] = [
  { id: 'ch-shopee', channel: 'shopee', name: 'Shopee (Live & Reguler)', adminPercentage: 8.5, serviceFeePerOrder: 1250, isActive: true },
  { id: 'ch-tiktok', channel: 'tiktok', name: 'TikTok Shop & Live', adminPercentage: 7.5, serviceFeePerOrder: 2000, isActive: true },
  { id: 'ch-tokopedia', channel: 'tokopedia', name: 'Tokopedia', adminPercentage: 6.5, serviceFeePerOrder: 1000, isActive: true },
  { id: 'ch-offline', channel: 'offline', name: 'Toko Offline / Toko Fisik', adminPercentage: 0, serviceFeePerOrder: 0, isActive: true },
  { id: 'ch-whatsapp', channel: 'whatsapp', name: 'WhatsApp / Chat Order', adminPercentage: 0, serviceFeePerOrder: 0, isActive: true },
  { id: 'ch-lainnya', channel: 'lainnya', name: 'Marketplace Lainnya (Lazada, dll)', adminPercentage: 6.0, serviceFeePerOrder: 1000, isActive: true },
];

// Default initial dummy data for realistic store demonstration
const DEFAULT_STORE: StoreAccount = {
  id: 'store-shopee-01',
  storeName: 'Fashion Thrift & Apparel Official',
  ownerUsername: 'owner',
  ownerPassword: '123',
  createdAt: new Date().toISOString(),
  settings: {
    adminPromoName: 'Marketplace Live Cashback Ekstra 8.5%',
    adminPromoPercentage: 8.5,
    serviceFeePerOrder: 1250,
    returnMechanism: 'detail',
    estimateReturnPercentage: 3.0,
    channelFees: DEFAULT_CHANNEL_FEES,
  }
};

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    storeId: 'store-shopee-01',
    name: 'Siti Rahma',
    username: 'siti_host',
    password: '123',
    roles: ['host', 'admin_toko'],
    salaryType: 'hourly',
    salaryRate: 35000,
    incentiveConfigs: {
      host: { 
        type: 'per_pcs_sold', 
        rate: 1000, 
        description: 'Rp 1.000 per pcs terjual saat live',
        hasSeparateBundlingSatuan: true,
        satuanRate: 1000,
        satuanIncentiveType: 'per_pcs_sold',
        bundlingRate: 2500,
        bundlingIncentiveType: 'per_package_sold',
        hasTierRule: true,
        tierThresholdPackages: 15,
        tierRate: 3000,
        tierRateBundling: 3000,
        tierRateSatuan: 1500,
        tierCalculationMode: 'excess_only',
      },
      admin_toko: { 
        type: 'per_package_sold', 
        rate: 500, 
        description: 'Rp 500 per paket diproses',
        hasTierRule: true,
        tierThresholdPackages: 15,
        tierRate: 1500,
        tierRateBundling: 1500,
        tierRateSatuan: 1000,
        tierCalculationMode: 'excess_only',
      },
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    storeId: 'store-shopee-01',
    name: 'Budi Santoso',
    username: 'budi_sortir',
    password: '123',
    roles: ['sortir'],
    salaryType: 'daily',
    salaryRate: 120000,
    incentiveConfigs: {
      sortir: { type: 'per_ball_pcs', rate: 150, description: 'Rp 150 per pcs sortir' },
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    storeId: 'store-shopee-01',
    name: 'Dina Steam',
    username: 'dina_steam',
    password: '123',
    roles: ['steam'],
    salaryType: 'daily',
    salaryRate: 110000,
    incentiveConfigs: {
      steam: { type: 'per_ball_pcs', rate: 200, description: 'Rp 200 per pcs steam' },
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-4',
    storeId: 'store-shopee-01',
    name: 'Owner Toko (Bambang)',
    username: 'owner',
    password: '123',
    roles: ['owner'],
    salaryType: 'daily',
    salaryRate: 250000,
    incentiveConfigs: {
      owner: { type: 'profit_percentage', rate: 0, description: 'Owner Profit' },
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_INVENTORY: BallInventory[] = [
  {
    id: 'ball-01',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    ballType: 'Ball Knit Import Korea Grade A',
    modalPrice: 6500000,
    pcsCount: 350,
    shippingCost: 250000,
    steamCost: 150000,
    sortirCost: 100000,
    hppPerPcs: Math.round((6500000 + 250000 + 150000 + 100000) / 350),
    returnMechanism: 'detail',
    estimateReturnPercentage: 3.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ball-02',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
    ballType: 'Ball Cardigan & Blouse Japan',
    modalPrice: 5500000,
    pcsCount: 300,
    shippingCost: 200000,
    steamCost: 150000,
    sortirCost: 100000,
    hppPerPcs: Math.round((5500000 + 200000 + 150000 + 100000) / 300),
    returnMechanism: 'detail',
    estimateReturnPercentage: 3.0,
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_ADS_COIN: AdsCoinDeposit[] = [
  {
    id: 'adscoin-1',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
    adsAmount: 1500000,
    coinAmount: 500000,
    notes: 'Topup awal Marketplace Ads & Koin Cashback Live',
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_SALES: SalesRecord[] = [
  {
    id: 'sale-demo-1',
    storeId: 'store-shopee-01',
    date: new Date().toISOString().slice(0, 10),
    salesType: 'live',
    salesChannel: 'tiktok_live',
    channelName: 'TikTok Live',
    category: 'pakaian_jadi',
    saleFormat: 'bundling',
    bundlingPcs: 60,
    bundlingPackages: 30,
    bundlingOmzet: 3600000,
    satuanPcs: 0,
    satuanPackages: 0,
    satuanOmzet: 0,
    hostIds: ['emp-1'],
    hostNames: ['Siti Rahma'],
    adminIds: ['emp-1'],
    adminNames: ['Siti Rahma'],
    adminId: 'emp-1',
    adminName: 'Siti Rahma',
    omzet: 3600000,
    pcsSold: 60,
    packagesSold: 30,
    hoursWorked: 4,
    coinUsed: 50000,
    adsUsed: 100000,
    notes: 'Sesi Siang Live Promo Bundling Knitwear',
    recordedBy: 'Owner Toko (Bambang)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sale-demo-2',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
    salesType: 'live',
    salesChannel: 'shopee_live',
    channelName: 'Shopee Live',
    category: 'hijab_muslim',
    saleFormat: 'satuan',
    satuanPcs: 45,
    satuanPackages: 35,
    satuanOmzet: 2800000,
    bundlingPcs: 0,
    bundlingPackages: 0,
    bundlingOmzet: 0,
    hostIds: ['emp-1'],
    hostNames: ['Siti Rahma'],
    adminIds: ['emp-1'],
    adminNames: ['Siti Rahma'],
    adminId: 'emp-1',
    adminName: 'Siti Rahma',
    omzet: 2800000,
    pcsSold: 45,
    packagesSold: 35,
    hoursWorked: 3.5,
    coinUsed: 40000,
    adsUsed: 80000,
    notes: 'Live Malam Flash Sale Satuan Blouse & Hijab',
    recordedBy: 'Owner Toko (Bambang)',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'sale-demo-3',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    salesType: 'live',
    salesChannel: 'tiktok_live',
    channelName: 'TikTok Live',
    category: 'thrift_vintage',
    saleFormat: 'campuran',
    satuanPcs: 25,
    satuanPackages: 20,
    satuanOmzet: 1500000,
    bundlingPcs: 40,
    bundlingPackages: 20,
    bundlingOmzet: 2500000,
    hostIds: ['emp-1'],
    hostNames: ['Siti Rahma'],
    adminIds: ['emp-1'],
    adminNames: ['Siti Rahma'],
    adminId: 'emp-1',
    adminName: 'Siti Rahma',
    omzet: 4000000,
    pcsSold: 65,
    packagesSold: 40,
    hoursWorked: 4.5,
    coinUsed: 60000,
    adsUsed: 120000,
    notes: 'Live Thrift Spesial Campuran Satuan & Paket',
    recordedBy: 'Owner Toko (Bambang)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sale-demo-4',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
    salesType: 'non_live',
    salesChannel: 'shopee_reguler',
    channelName: 'Shopee Reguler',
    category: 'pakaian_jadi',
    omzet: 2200000,
    pcsSold: 32,
    packagesSold: 28,
    adsUsed: 50000,
    coinUsed: 0,
    paymentMethod: 'shopeepay',
    notes: 'Order Masuk Reguler Marketplace',
    recordedBy: 'Owner Toko (Bambang)',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'sale-demo-5',
    storeId: 'store-shopee-01',
    date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
    salesType: 'non_live',
    salesChannel: 'offline_store',
    channelName: 'Toko Offline',
    category: 'pakaian_jadi',
    omzet: 3500000,
    pcsSold: 48,
    packagesSold: 30,
    adsUsed: 0,
    coinUsed: 0,
    paymentMethod: 'cash',
    notes: 'Penjualan Pengunjung Toko Fisik Weekend',
    recordedBy: 'Owner Toko (Bambang)',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

type SyncListener = (collectionName: string) => void;

export class StorageService {
  private static listeners: Set<SyncListener> = new Set();
  private static activeUnsubscribes: Unsubscribe[] = [];
  private static isSyncing = false;
  private static lastSyncTime = 0;

  public static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(collectionName: string) {
    this.listeners.forEach(fn => {
      try {
        fn(collectionName);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seller_profit_data_updated', {
        detail: { collectionName, timestamp: Date.now() }
      }));
    }
  }

  // Helper to remove any undefined fields before sending to Firestore
  public static cleanForFirestore<T>(data: T): T {
    if (data === undefined || data === null) return data;
    return JSON.parse(JSON.stringify(data));
  }

  // Helper to merge cloud and local lists without losing newly added local items
  private static mergeLists<T extends { id: string }>(cloudItems: T[], localItems: T[]): T[] {
    const map = new Map<string, T>();
    // Seed with local items
    (localItems || []).forEach(item => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    // Cloud items take precedence and overwrite
    (cloudItems || []).forEach(item => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  // Sync a single record to cloud firestore safely without undefined errors
  public static async syncToCloud(collectionName: string, docId: string, data: any): Promise<boolean> {
    if (!db) return false;
    try {
      const cleanData = this.cleanForFirestore(data);
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
      FirestoreTelemetry.recordWrites(1, collectionName, `Tulis ${collectionName} (${docId})`);
      return true;
    } catch (e) {
      console.warn(`Cloud sync write notice for ${collectionName}/${docId}:`, e);
      return false;
    }
  }

  // Delete a record from cloud firestore
  public static async deleteFromCloud(collectionName: string, docId: string): Promise<boolean> {
    if (!db) return false;
    try {
      await deleteDoc(doc(db, collectionName, docId));
      FirestoreTelemetry.recordDeletes(1, collectionName, `Hapus ${collectionName} (${docId})`);
      return true;
    } catch (e) {
      console.warn(`Cloud sync delete notice for ${collectionName}/${docId}:`, e);
      return false;
    }
  }

  /**
   * Fetch all stores and employees from Firestore with smart merging
   * so newly registered stores/employees from any phone persist and are available.
   */
  public static async syncStoresAndEmployeesFromCloud(): Promise<boolean> {
    if (!db) return false;
    try {
      // 1. Sync Stores
      const storesSnap = await getDocs(collection(db, 'stores'));
      FirestoreTelemetry.recordReads(storesSnap.size || 1, 'stores', 'Sinkronisasi daftar toko');
      const localStores = this.getStores();
      if (!storesSnap.empty) {
        const cloudStores: StoreAccount[] = [];
        storesSnap.forEach(d => {
          cloudStores.push(d.data() as StoreAccount);
        });
        const mergedStores = this.mergeLists(cloudStores, localStores);
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(mergedStores));
        // Push any local stores missing in cloud
        localStores.forEach(st => {
          if (!cloudStores.some(c => c.id === st.id)) {
            this.syncToCloud('stores', st.id, st);
          }
        });
      } else {
        // Seed local stores to Firestore if cloud empty
        for (const st of localStores) {
          await this.syncToCloud('stores', st.id, st);
        }
      }

      // 2. Sync Employees
      const empSnap = await getDocs(collection(db, 'employees'));
      FirestoreTelemetry.recordReads(empSnap.size || 1, 'employees', 'Sinkronisasi daftar pegawai');
      const localEmps = this.getAllEmployeesRaw();
      if (!empSnap.empty) {
        const cloudEmployees: Employee[] = [];
        empSnap.forEach(d => {
          cloudEmployees.push(d.data() as Employee);
        });
        const mergedEmps = this.mergeLists(cloudEmployees, localEmps);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(mergedEmps));
        // Push any local employees missing in cloud so they NEVER get deleted!
        localEmps.forEach(emp => {
          if (!cloudEmployees.some(c => c.id === emp.id)) {
            this.syncToCloud('employees', emp.id, emp);
          }
        });
      } else {
        // Seed local employees to Firestore if empty
        for (const emp of localEmps) {
          await this.syncToCloud('employees', emp.id, emp);
        }
      }

      this.notifyListeners('stores_and_employees');
      this.notifyListeners('employees');
      this.notifyListeners('stores');
      return true;
    } catch (err) {
      console.warn('Sync stores & employees notice:', err);
      return false;
    }
  }

  /**
   * Comprehensive fetch for all store collections with smart merging
   */
  public static async syncAllFromCloud(storeId?: string): Promise<boolean> {
    if (!db) return false;
    this.isSyncing = true;
    try {
      await this.syncStoresAndEmployeesFromCloud();

      const currentStoreId = storeId || this.getCurrentUser()?.storeId;
      if (currentStoreId) {
        // 1. Sync inventory
        const invSnap = await getDocs(collection(db, 'inventory_balls'));
        FirestoreTelemetry.recordReads(invSnap.size || 1, 'inventory_balls', 'Sinkronisasi modal stok HPP');
        const localInvRaw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        const localInv: BallInventory[] = localInvRaw ? JSON.parse(localInvRaw) : DEFAULT_INVENTORY;
        if (!invSnap.empty) {
          const cloudInv: BallInventory[] = [];
          invSnap.forEach(d => cloudInv.push(d.data() as BallInventory));
          const merged = this.mergeLists(cloudInv, localInv);
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(merged));
          localInv.forEach(i => {
            if (!cloudInv.some(c => c.id === i.id)) {
              this.syncToCloud('inventory_balls', i.id, i);
            }
          });
        } else if (localInv.length > 0) {
          localInv.forEach(i => this.syncToCloud('inventory_balls', i.id, i));
        }

        // 2. Sync attendance
        const attSnap = await getDocs(collection(db, 'attendance'));
        FirestoreTelemetry.recordReads(attSnap.size || 1, 'attendance', 'Sinkronisasi kehadiran shift');
        const localAttRaw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        const localAtt: AttendanceRecord[] = localAttRaw ? JSON.parse(localAttRaw) : [];
        if (!attSnap.empty) {
          const cloudAtt: AttendanceRecord[] = [];
          attSnap.forEach(d => cloudAtt.push(d.data() as AttendanceRecord));
          const merged = this.mergeLists(cloudAtt, localAtt);
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(merged));
          localAtt.forEach(a => {
            if (!cloudAtt.some(c => c.id === a.id)) {
              this.syncToCloud('attendance', a.id, a);
            }
          });
        }

        // 3. Sync sales
        const salesSnap = await getDocs(collection(db, 'sales'));
        FirestoreTelemetry.recordReads(salesSnap.size || 1, 'sales', 'Sinkronisasi transaksi penjualan');
        const localSalesRaw = localStorage.getItem(STORAGE_KEYS.SALES);
        const localSales: SalesRecord[] = localSalesRaw ? JSON.parse(localSalesRaw) : [];
        if (!salesSnap.empty) {
          const cloudSales: SalesRecord[] = [];
          salesSnap.forEach(d => cloudSales.push(d.data() as SalesRecord));
          const merged = this.mergeLists(cloudSales, localSales);
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(merged));
          localSales.forEach(s => {
            if (!cloudSales.some(c => c.id === s.id)) {
              this.syncToCloud('sales', s.id, s);
            }
          });
        }

        // 4. Sync returns
        const returnsSnap = await getDocs(collection(db, 'returns'));
        FirestoreTelemetry.recordReads(returnsSnap.size || 1, 'returns', 'Sinkronisasi data retur');
        const localRetRaw = localStorage.getItem(STORAGE_KEYS.RETURNS);
        const localRet: ReturnRecord[] = localRetRaw ? JSON.parse(localRetRaw) : [];
        if (!returnsSnap.empty) {
          const cloudRet: ReturnRecord[] = [];
          returnsSnap.forEach(d => cloudRet.push(d.data() as ReturnRecord));
          const merged = this.mergeLists(cloudRet, localRet);
          localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(merged));
          localRet.forEach(r => {
            if (!cloudRet.some(c => c.id === r.id)) {
              this.syncToCloud('returns', r.id, r);
            }
          });
        }

        // 5. Sync ads & coins
        const adsSnap = await getDocs(collection(db, 'ads_coins'));
        FirestoreTelemetry.recordReads(adsSnap.size || 1, 'ads_coins', 'Sinkronisasi deposit iklan & koin');
        const localAdsRaw = localStorage.getItem(STORAGE_KEYS.ADS_COINS);
        const localAds: AdsCoinDeposit[] = localAdsRaw ? JSON.parse(localAdsRaw) : [];
        if (!adsSnap.empty) {
          const cloudAds: AdsCoinDeposit[] = [];
          adsSnap.forEach(d => cloudAds.push(d.data() as AdsCoinDeposit));
          const merged = this.mergeLists(cloudAds, localAds);
          localStorage.setItem(STORAGE_KEYS.ADS_COINS, JSON.stringify(merged));
          localAds.forEach(a => {
            if (!cloudAds.some(c => c.id === a.id)) {
              this.syncToCloud('ads_coins', a.id, a);
            }
          });
        }

        // 6. Sync cashflow
        const cashflowSnap = await getDocs(collection(db, 'cashflow'));
        FirestoreTelemetry.recordReads(cashflowSnap.size || 1, 'cashflow', 'Sinkronisasi arus kas');
        const localCashRaw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
        const localCash: CashflowRecord[] = localCashRaw ? JSON.parse(localCashRaw) : [];
        if (!cashflowSnap.empty) {
          const cloudCash: CashflowRecord[] = [];
          cashflowSnap.forEach(d => cloudCash.push(d.data() as CashflowRecord));
          const merged = this.mergeLists(cloudCash, localCash);
          localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(merged));
          localCash.forEach(c => {
            if (!cloudCash.some(cloud => cloud.id === c.id)) {
              this.syncToCloud('cashflow', c.id, c);
            }
          });
        }

        // 7. Sync steam sortir
        const steamSnap = await getDocs(collection(db, 'steam_sortir'));
        FirestoreTelemetry.recordReads(steamSnap.size || 1, 'steam_sortir', 'Sinkronisasi sortir & steam');
        const localSteamRaw = localStorage.getItem(STORAGE_KEYS.STEAM_SORTIR);
        const localSteam: SteamSortirRecord[] = localSteamRaw ? JSON.parse(localSteamRaw) : [];
        if (!steamSnap.empty) {
          const cloudSteam: SteamSortirRecord[] = [];
          steamSnap.forEach(d => cloudSteam.push(d.data() as SteamSortirRecord));
          const merged = this.mergeLists(cloudSteam, localSteam);
          localStorage.setItem(STORAGE_KEYS.STEAM_SORTIR, JSON.stringify(merged));
          localSteam.forEach(s => {
            if (!cloudSteam.some(c => c.id === s.id)) {
              this.syncToCloud('steam_sortir', s.id, s);
            }
          });
        }

        this.notifyListeners('all');
      }

      this.lastSyncTime = Date.now();
      return true;
    } catch (err) {
      console.warn('Comprehensive cloud sync notice:', err);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Set up real-time Firebase Firestore listeners (onSnapshot)
   * This automatically receives real-time updates when any device creates or changes data.
   */
  public static startRealtimeSync(storeId?: string): () => void {
    if (!db) return () => {};

    // Clear existing listeners to prevent duplicates
    this.stopRealtimeSync();

    try {
      // 1. Realtime listener for Stores
      const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'stores', 'Pembaruan realtime Toko');
        const cloudStores: StoreAccount[] = [];
        snapshot.forEach(docSnap => cloudStores.push(docSnap.data() as StoreAccount));
        const localStores = this.getStores();
        const merged = this.mergeLists(cloudStores, localStores);
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(merged));
        this.notifyListeners('stores');
        this.notifyListeners('stores_and_employees');
      }, (err) => console.warn('Realtime stores listener notice:', err));
      this.activeUnsubscribes.push(unsubStores);

      // 2. Realtime listener for Employees
      const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'employees', 'Pembaruan realtime Pegawai');
        const cloudEmps: Employee[] = [];
        snapshot.forEach(docSnap => cloudEmps.push(docSnap.data() as Employee));
        const localEmps = this.getAllEmployeesRaw();
        const merged = this.mergeLists(cloudEmps, localEmps);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(merged));
        this.notifyListeners('employees');
        this.notifyListeners('stores_and_employees');
      }, (err) => console.warn('Realtime employees listener notice:', err));
      this.activeUnsubscribes.push(unsubEmployees);

      // 3. Realtime listener for Sales
      const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'sales', 'Pembaruan realtime Penjualan');
        const cloudSales: SalesRecord[] = [];
        snapshot.forEach(docSnap => cloudSales.push(docSnap.data() as SalesRecord));
        const localRaw = localStorage.getItem(STORAGE_KEYS.SALES);
        const localSales: SalesRecord[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudSales, localSales);
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(merged));
        this.notifyListeners('sales');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime sales listener notice:', err));
      this.activeUnsubscribes.push(unsubSales);

      // 4. Realtime listener for Inventory
      const unsubInventory = onSnapshot(collection(db, 'inventory_balls'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'inventory_balls', 'Pembaruan realtime Stok HPP');
        const cloudInv: BallInventory[] = [];
        snapshot.forEach(docSnap => cloudInv.push(docSnap.data() as BallInventory));
        const localRaw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        const localInv: BallInventory[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudInv, localInv);
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(merged));
        this.notifyListeners('inventory');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime inventory listener notice:', err));
      this.activeUnsubscribes.push(unsubInventory);

      // 5. Realtime listener for Attendance
      const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'attendance', 'Pembaruan realtime Kehadiran');
        const cloudAtt: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => cloudAtt.push(docSnap.data() as AttendanceRecord));
        const localRaw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        const localAtt: AttendanceRecord[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudAtt, localAtt);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(merged));
        this.notifyListeners('attendance');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime attendance listener notice:', err));
      this.activeUnsubscribes.push(unsubAttendance);

      // 6. Realtime listener for Returns
      const unsubReturns = onSnapshot(collection(db, 'returns'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'returns', 'Pembaruan realtime Retur');
        const cloudRet: ReturnRecord[] = [];
        snapshot.forEach(docSnap => cloudRet.push(docSnap.data() as ReturnRecord));
        const localRaw = localStorage.getItem(STORAGE_KEYS.RETURNS);
        const localRet: ReturnRecord[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudRet, localRet);
        localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(merged));
        this.notifyListeners('returns');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime returns listener notice:', err));
      this.activeUnsubscribes.push(unsubReturns);

      // 7. Realtime listener for Ads & Coins
      const unsubAds = onSnapshot(collection(db, 'ads_coins'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'ads_coins', 'Pembaruan realtime Iklan & Koin');
        const cloudAds: AdsCoinDeposit[] = [];
        snapshot.forEach(docSnap => cloudAds.push(docSnap.data() as AdsCoinDeposit));
        const localRaw = localStorage.getItem(STORAGE_KEYS.ADS_COINS);
        const localAds: AdsCoinDeposit[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudAds, localAds);
        localStorage.setItem(STORAGE_KEYS.ADS_COINS, JSON.stringify(merged));
        this.notifyListeners('ads_coins');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime ads_coins listener notice:', err));
      this.activeUnsubscribes.push(unsubAds);

      // 8. Realtime listener for Cashflow
      const unsubCashflow = onSnapshot(collection(db, 'cashflow'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'cashflow', 'Pembaruan realtime Arus Kas');
        const cloudCash: CashflowRecord[] = [];
        snapshot.forEach(docSnap => cloudCash.push(docSnap.data() as CashflowRecord));
        const localRaw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
        const localCash: CashflowRecord[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudCash, localCash);
        localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(merged));
        this.notifyListeners('cashflow');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime cashflow listener notice:', err));
      this.activeUnsubscribes.push(unsubCashflow);

      // 9. Realtime listener for Steam & Sortir
      const unsubSteam = onSnapshot(collection(db, 'steam_sortir'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'steam_sortir', 'Pembaruan realtime Steam & Sortir');
        const cloudSteam: SteamSortirRecord[] = [];
        snapshot.forEach(docSnap => cloudSteam.push(docSnap.data() as SteamSortirRecord));
        const localRaw = localStorage.getItem(STORAGE_KEYS.STEAM_SORTIR);
        const localSteam: SteamSortirRecord[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudSteam, localSteam);
        localStorage.setItem(STORAGE_KEYS.STEAM_SORTIR, JSON.stringify(merged));
        this.notifyListeners('steam_sortir');
        this.notifyListeners('all');
      }, (err) => console.warn('Realtime steam_sortir listener notice:', err));
      this.activeUnsubscribes.push(unsubSteam);

      // 10. Realtime listener for Announcements
      const unsubAnnounce = onSnapshot(collection(db, 'announcements'), (snapshot) => {
        const changes = snapshot.docChanges().length;
        if (changes > 0) FirestoreTelemetry.recordReads(changes, 'announcements', 'Pembaruan realtime Pengumuman');
        const cloudAnn: StoreAnnouncement[] = [];
        snapshot.forEach(docSnap => cloudAnn.push(docSnap.data() as StoreAnnouncement));
        const localRaw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
        const localAnn: StoreAnnouncement[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = this.mergeLists(cloudAnn, localAnn);
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(merged));
        this.notifyListeners('announcements');
      }, (err) => console.warn('Realtime announcements listener notice:', err));
      this.activeUnsubscribes.push(unsubAnnounce);

    } catch (err) {
      console.warn('Setup realtime sync listeners notice:', err);
    }

    return () => this.stopRealtimeSync();
  }

  public static stopRealtimeSync() {
    this.activeUnsubscribes.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    });
    this.activeUnsubscribes = [];
  }

  // STORES
  static getStores(): StoreAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STORES);
    if (!raw) {
      this.saveStores([DEFAULT_STORE]);
      return [DEFAULT_STORE];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_STORE];
    } catch {
      return [DEFAULT_STORE];
    }
  }

  static saveStores(stores: StoreAccount[]) {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    stores.forEach(st => this.syncToCloud('stores', st.id, st));
    this.notifyListeners('stores');
  }

  static updateStore(updatedStore: StoreAccount) {
    const stores = this.getStores();
    const idx = stores.findIndex(s => s.id === updatedStore.id);
    if (idx !== -1) {
      stores[idx] = updatedStore;
    } else {
      stores.push(updatedStore);
    }
    this.saveStores(stores);
    
    // Also update owner employee password if username matches
    const employees = this.getEmployees(updatedStore.id);
    const ownerEmp = employees.find(e => e.roles.includes('owner') || e.username === updatedStore.ownerUsername);
    if (ownerEmp) {
      ownerEmp.password = updatedStore.ownerPassword;
      ownerEmp.username = updatedStore.ownerUsername;
      if (updatedStore.storeName) {
        ownerEmp.name = 'Owner ' + updatedStore.storeName;
      }
      this.addOrUpdateEmployee(ownerEmp);
    }
  }

  static deleteStore(storeId: string) {
    const stores = this.getStores().filter(s => s.id !== storeId);
    this.saveStores(stores);
    this.deleteFromCloud('stores', storeId);
  }

  static getStoreById(storeId: string): StoreAccount | null {
    const stores = this.getStores();
    return stores.find(s => s.id === storeId) || null;
  }

  static updateStoreSettings(storeId: string, settings: Partial<StoreAccount['settings']>) {
    const stores = this.getStores();
    const idx = stores.findIndex(s => s.id === storeId);
    if (idx !== -1) {
      stores[idx].settings = { ...stores[idx].settings, ...settings };
      this.saveStores(stores);
    }
  }

  static getChannelFees(storeId: string): ChannelFeeConfig[] {
    const store = this.getStoreById(storeId);
    if (store?.settings?.channelFees && store.settings.channelFees.length > 0) {
      return store.settings.channelFees;
    }
    return DEFAULT_CHANNEL_FEES;
  }

  static saveChannelFees(storeId: string, channelFees: ChannelFeeConfig[]) {
    this.updateStoreSettings(storeId, { channelFees });
  }

  // CURRENT USER
  static getCurrentUser(): CurrentUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  }

  static setCurrentUser(user: CurrentUser | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static updateUserProfile(updates: Partial<CurrentUser>): CurrentUser | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updatedUser: CurrentUser = { ...current, ...updates };
    this.setCurrentUser(updatedUser);

    try {
      // If this user is an employee, update in employees list
      if (!current.isOwner) {
        const employees = this.getEmployees(current.storeId);
        const empIdx = employees.findIndex(e => e.id === current.id || e.username === current.username);
        if (empIdx !== -1) {
          employees[empIdx] = {
            ...employees[empIdx],
            name: updates.name || employees[empIdx].name,
            avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : employees[empIdx].avatarUrl,
            whatsapp: updates.whatsapp !== undefined ? updates.whatsapp : employees[empIdx].whatsapp,
            bio: updates.bio !== undefined ? updates.bio : employees[empIdx].bio,
          };
          this.saveEmployees(employees);
        }
      } else {
        // If owner, persist owner profile in user profiles cache & sync
        const rawProfiles = localStorage.getItem(STORAGE_KEYS.USER_PROFILES);
        const profiles = rawProfiles ? JSON.parse(rawProfiles) : {};
        profiles[current.id] = { ...profiles[current.id], ...updates };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
        this.syncToCloud('stores', current.storeId, {
          ...this.getStoreById(current.storeId),
          ownerProfile: updates,
        });
      }
    } catch (err) {
      console.warn('Update user profile notice:', err);
    }

    this.notifyListeners('user_profile');
    return updatedUser;
  }

  // ANNOUNCEMENTS (Pengumuman Toko / Live Info)
  static getAnnouncements(storeId: string): StoreAnnouncement[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (!raw) {
        return [];
      }
      const all: StoreAnnouncement[] = JSON.parse(raw);
      // Filter out any previous mock defaults and return only store announcements created by owner
      return all.filter(a => a.storeId === storeId && !a.id.startsWith('ann-default-'));
    } catch {
      return [];
    }
  }

  static saveAnnouncements(announcements: StoreAnnouncement[]) {
    const storeId = this.getCurrentUser()?.storeId;
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    let all: StoreAnnouncement[] = raw ? JSON.parse(raw) : [];
    if (storeId) {
      all = all.filter(a => a.storeId !== storeId).concat(announcements);
    } else {
      all = announcements;
    }
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(all));
    announcements.forEach(a => this.syncToCloud('announcements', a.id, a));
    this.notifyListeners('announcements');
  }

  static addOrUpdateAnnouncement(item: StoreAnnouncement) {
    const list = this.getAnnouncements(item.storeId);
    const idx = list.findIndex(a => a.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    this.saveAnnouncements(list);
  }

  static deleteAnnouncement(id: string, storeId: string) {
    const list = this.getAnnouncements(storeId).filter(a => a.id !== id);
    this.saveAnnouncements(list);
    this.deleteFromCloud('announcements', id);
  }

  static getActiveAnnouncements(storeId: string): StoreAnnouncement[] {
    return this.getAnnouncements(storeId).filter(a => a.isActive);
  }

  // EMPLOYEES
  private static getAllEmployeesRaw(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let all: Employee[] = raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES;
    let hasMigration = false;

    all = all.map(emp => {
      if (emp.roles?.includes('host') && emp.incentiveConfigs?.host) {
        const hostCfg = emp.incentiveConfigs.host;
        if (hostCfg.satuanRate === undefined || hostCfg.bundlingRate === undefined) {
          hasMigration = true;
          return {
            ...emp,
            incentiveConfigs: {
              ...emp.incentiveConfigs,
              host: {
                ...hostCfg,
                hasSeparateBundlingSatuan: hostCfg.hasSeparateBundlingSatuan ?? true,
                satuanRate: hostCfg.satuanRate ?? hostCfg.rate ?? 1000,
                satuanIncentiveType: hostCfg.satuanIncentiveType ?? (hostCfg.type === 'per_package_sold' ? 'per_package_sold' : 'per_pcs_sold'),
                bundlingRate: hostCfg.bundlingRate ?? hostCfg.rate ?? 2500,
                bundlingIncentiveType: hostCfg.bundlingIncentiveType ?? 'per_package_sold',
                tierRateSatuan: hostCfg.tierRateSatuan ?? hostCfg.tierRate ?? 1500,
                tierRateBundling: hostCfg.tierRateBundling ?? hostCfg.tierRate ?? 3000,
              }
            }
          };
        }
      }
      return emp;
    });

    if (!raw || hasMigration) {
      this.saveEmployees(all);
    }
    return all;
  }

  static getEmployees(storeId: string): Employee[] {
    const all = this.getAllEmployeesRaw();
    return all.filter(e => e.storeId === storeId);
  }

  static saveEmployees(employees: Employee[]) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    employees.forEach(emp => this.syncToCloud('employees', emp.id, emp));
    this.notifyListeners('employees');
  }

  static addOrUpdateEmployee(emp: Employee) {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let all: Employee[] = raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES;
    const idx = all.findIndex(e => e.id === emp.id);
    if (idx !== -1) {
      all[idx] = emp;
    } else {
      all.push(emp);
    }
    this.saveEmployees(all);
    this.syncToCloud('employees', emp.id, emp);
  }

  static deleteEmployee(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let all: Employee[] = raw ? JSON.parse(raw) : [];
    all = all.filter(e => e.id !== id);
    this.saveEmployees(all);
    this.deleteFromCloud('employees', id);
  }

  // INVENTORY (BALL MODAL & STOK)
  static getInventory(storeId: string): BallInventory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    let all: BallInventory[] = raw ? JSON.parse(raw) : DEFAULT_INVENTORY;
    if (!raw) {
      this.saveInventory(all);
    }
    return all.filter(i => i.storeId === storeId);
  }

  static saveInventory(list: BallInventory[]) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(list));
    list.forEach(inv => this.syncToCloud('inventory_balls', inv.id, inv));
    this.notifyListeners('inventory');
  }

  static addInventory(inv: BallInventory) {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    let all: BallInventory[] = raw ? JSON.parse(raw) : DEFAULT_INVENTORY;
    all.unshift(inv);
    this.saveInventory(all);
    this.syncToCloud('inventory_balls', inv.id, inv);
  }

  static updateInventory(inv: BallInventory) {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    let all: BallInventory[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(i => i.id === inv.id);
    if (idx !== -1) {
      all[idx] = inv;
    } else {
      all.unshift(inv);
    }
    this.saveInventory(all);
    this.syncToCloud('inventory_balls', inv.id, inv);
  }

  static deleteInventory(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    let all: BallInventory[] = raw ? JSON.parse(raw) : [];
    all = all.filter(i => i.id !== id);
    this.saveInventory(all);
    this.deleteFromCloud('inventory_balls', id);
  }

  // ATTENDANCE
  static getAttendance(storeId: string): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const all: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
    return all.filter(a => a.storeId === storeId);
  }

  static addAttendance(att: AttendanceRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let all: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(att);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
    this.syncToCloud('attendance', att.id, att);
    this.notifyListeners('attendance');
  }

  static deleteAttendance(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let all: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
    this.deleteFromCloud('attendance', id);
    this.notifyListeners('attendance');
  }

  // SALES
  static getSales(storeId: string): SalesRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    let all: SalesRecord[] = raw ? JSON.parse(raw) : [];
    if (!raw || all.length === 0) {
      all = DEFAULT_SALES;
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
    }
    return all.filter(s => s.storeId === storeId);
  }

  static addSale(sale: SalesRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    let all: SalesRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
    this.syncToCloud('sales', sale.id, sale);
    this.notifyListeners('sales');
  }

  static updateSale(sale: SalesRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    let all: SalesRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(s => s.id === sale.id);
    if (idx !== -1) {
      all[idx] = sale;
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
      this.syncToCloud('sales', sale.id, sale);
      this.notifyListeners('sales');
    }
  }

  static deleteSale(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    let all: SalesRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
    this.deleteFromCloud('sales', id);
    this.notifyListeners('sales');
  }

  // RETURNS
  static getReturns(storeId: string): ReturnRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RETURNS);
    const all: ReturnRecord[] = raw ? JSON.parse(raw) : [];
    return all.filter(r => r.storeId === storeId);
  }

  static addReturn(ret: ReturnRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.RETURNS);
    let all: ReturnRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(ret);
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(all));
    this.syncToCloud('returns', ret.id, ret);
    this.notifyListeners('returns');
  }

  static deleteReturn(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.RETURNS);
    let all: ReturnRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(all));
    this.deleteFromCloud('returns', id);
    this.notifyListeners('returns');
  }

  // ADS & COINS
  static getAdsCoins(storeId: string): AdsCoinDeposit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ADS_COINS);
    let all: AdsCoinDeposit[] = raw ? JSON.parse(raw) : DEFAULT_ADS_COIN;
    if (!raw) {
      this.saveAdsCoins(all);
    }
    return all.filter(a => a.storeId === storeId);
  }

  static saveAdsCoins(list: AdsCoinDeposit[]) {
    localStorage.setItem(STORAGE_KEYS.ADS_COINS, JSON.stringify(list));
    list.forEach(item => this.syncToCloud('ads_coins', item.id, item));
    this.notifyListeners('ads_coins');
  }

  static addAdsCoin(item: AdsCoinDeposit) {
    const raw = localStorage.getItem(STORAGE_KEYS.ADS_COINS);
    let all: AdsCoinDeposit[] = raw ? JSON.parse(raw) : DEFAULT_ADS_COIN;
    all.unshift(item);
    this.saveAdsCoins(all);
  }

  static deleteAdsCoin(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.ADS_COINS);
    let all: AdsCoinDeposit[] = raw ? JSON.parse(raw) : [];
    all = all.filter(a => a.id !== id);
    this.saveAdsCoins(all);
    this.deleteFromCloud('ads_coins', id);
  }

  // CASHFLOW
  static getCashflow(storeId: string): CashflowRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
    const all: CashflowRecord[] = raw ? JSON.parse(raw) : [];
    return all.filter(c => c.storeId === storeId);
  }

  static addCashflow(c: CashflowRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
    let all: CashflowRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(c);
    localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(all));
    this.syncToCloud('cashflow', c.id, c);
    this.notifyListeners('cashflow');

    // Otomatis sinkronkan konsumsi pribadi kas toko ke total alokasi keuangan pribadi owner
    if (c.type === 'outflow' && c.category === 'konsumsi_pribadi') {
      this.syncKonsumsiPribadiToPersonalAllocation(c.storeId);
    }
  }

  static updateCashflow(c: CashflowRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
    let all: CashflowRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(item => item.id === c.id);
    if (idx !== -1) {
      all[idx] = c;
      localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(all));
      this.syncToCloud('cashflow', c.id, c);
      this.notifyListeners('cashflow');

      // Update sinkronisasi konsumsi pribadi ke alokasi keuangan pribadi
      this.syncKonsumsiPribadiToPersonalAllocation(c.storeId);
    }
  }

  static deleteCashflow(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
    let all: CashflowRecord[] = raw ? JSON.parse(raw) : [];
    const target = all.find(c => c.id === id);
    all = all.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(all));
    this.deleteFromCloud('cashflow', id);
    this.notifyListeners('cashflow');

    if (target) {
      this.syncKonsumsiPribadiToPersonalAllocation(target.storeId);
    }
  }

  // Helper untuk sinkronisasi konsumsi pribadi dari cashflow ke alokasi total keuangan pribadi
  static syncKonsumsiPribadiToPersonalAllocation(storeId: string) {
    const totalKonsumsi = this.getTotalKonsumsiPribadi(storeId);
    const alloc = this.getPersonalBudgetAllocation(storeId);
    alloc.totalIncome = totalKonsumsi;
    alloc.updatedAt = new Date().toISOString();
    this.savePersonalBudgetAllocation(storeId, alloc);
  }

  static getTotalKonsumsiPribadi(storeId: string, filterDateFn?: (date: string) => boolean): number {
    const cashflows = this.getCashflow(storeId);
    const filtered = cashflows.filter(c => 
      c.type === 'outflow' && 
      c.category === 'konsumsi_pribadi' && 
      (!filterDateFn || filterDateFn(c.date))
    );
    return filtered.reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  static cleanupLegacyPriveExpenses(storeId: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
    if (!raw) return;
    try {
      const all: PersonalExpenseRecord[] = JSON.parse(raw);
      const filtered = all.filter(e => !(e.id.startsWith('pexp-cf-') || (e as any).sourceCashflowId));
      if (filtered.length !== all.length) {
        this.savePersonalExpenses(filtered);
      }
    } catch {
      // ignore
    }
  }

  // PERSONAL FINANCE & CASHFLOW (Arus Keuangan Pribadi)
  static getPersonalBudgetAllocation(storeId: string): PersonalBudgetAllocation {
    const totalKonsumsi = this.getTotalKonsumsiPribadi(storeId);
    const raw = localStorage.getItem(`${STORAGE_KEYS.PERSONAL_BUDGET}_${storeId}`);
    let alloc: PersonalBudgetAllocation = {
      totalIncome: totalKonsumsi > 0 ? totalKonsumsi : 0,
      sehariHariPercent: 50,
      utangPercent: 20,
      tabunganPercent: 15,
      investasiTokoPercent: 15,
      updatedAt: new Date().toISOString(),
    };
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        alloc = { ...alloc, ...parsed };
      } catch (e) {
        // fallback
      }
    }
    if (totalKonsumsi > 0) {
      alloc.totalIncome = totalKonsumsi;
    }
    return alloc;
  }

  static savePersonalBudgetAllocation(storeId: string, allocation: PersonalBudgetAllocation) {
    localStorage.setItem(`${STORAGE_KEYS.PERSONAL_BUDGET}_${storeId}`, JSON.stringify(allocation));
    this.syncToCloud('personal_budget', storeId, { ...allocation, storeId });
    this.notifyListeners('personal_budget');
  }

  static getPersonalExpenses(storeId: string): PersonalExpenseRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
    const all: PersonalExpenseRecord[] = raw ? JSON.parse(raw) : [];
    return all.filter(e => e.storeId === storeId);
  }

  static savePersonalExpenses(list: PersonalExpenseRecord[]) {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_EXPENSES, JSON.stringify(list));
    list.forEach(item => this.syncToCloud('personal_expenses', item.id, item));
    this.notifyListeners('personal_expenses');
  }

  static addPersonalExpense(item: PersonalExpenseRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
    let all: PersonalExpenseRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(item);
    this.savePersonalExpenses(all);
  }

  static updatePersonalExpense(item: PersonalExpenseRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
    let all: PersonalExpenseRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(e => e.id === item.id);
    if (idx !== -1) {
      all[idx] = item;
      this.savePersonalExpenses(all);
    }
  }

  static deletePersonalExpense(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_EXPENSES);
    let all: PersonalExpenseRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(e => e.id !== id);
    this.savePersonalExpenses(all);
    this.deleteFromCloud('personal_expenses', id);
  }

  static calculatePersonalFinance(storeId: string, filterDateFn?: (date: string) => boolean) {
    const allocation = this.getPersonalBudgetAllocation(storeId);
    let expenses = this.getPersonalExpenses(storeId);
    if (filterDateFn) {
      expenses = expenses.filter(e => filterDateFn(e.date));
    }

    const filteredIncome = this.getTotalKonsumsiPribadi(storeId, filterDateFn);
    const totalIncome = filteredIncome > 0 ? filteredIncome : (allocation.totalIncome || 0);

    // Alokasi Saldo per Pos
    const alokasiSehariHari = Math.round((allocation.sehariHariPercent / 100) * totalIncome);
    const alokasiUtang = Math.round((allocation.utangPercent / 100) * totalIncome);
    const alokasiTabungan = Math.round((allocation.tabunganPercent / 100) * totalIncome);
    const alokasiInvestasi = Math.round((allocation.investasiTokoPercent / 100) * totalIncome);

    // Pengeluaran per Pos (ditotalkan otomatis saat ada pengeluaran di bagian cashflow & arus kas untuk pengeluaran pribadi)
    const expSehariHari = expenses
      .filter(e => e.category === 'sehari_hari')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expUtang = expenses
      .filter(e => e.category === 'utang')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expTabungan = expenses
      .filter(e => e.category === 'tabungan')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expInvestasi = expenses
      .filter(e => e.category === 'investasi_toko')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalExpense = expSehariHari + expUtang + expTabungan + expInvestasi;

    return {
      allocation,
      totalIncome,
      totalExpense,
      totalRemaining: totalIncome - totalExpense,
      summary: {
        sehari_hari: {
          name: 'Sehari-hari',
          percent: allocation.sehariHariPercent,
          allocation: alokasiSehariHari,
          expense: expSehariHari,
          remaining: alokasiSehariHari - expSehariHari,
        },
        utang: {
          name: 'Utang / Kewajiban',
          percent: allocation.utangPercent,
          allocation: alokasiUtang,
          expense: expUtang,
          remaining: alokasiUtang - expUtang,
        },
        tabungan: {
          name: 'Tabungan Pribadi',
          percent: allocation.tabunganPercent,
          allocation: alokasiTabungan,
          expense: expTabungan,
          remaining: alokasiTabungan - expTabungan,
        },
        investasi_toko: {
          name: 'Investasi & Pengembangan Toko',
          percent: allocation.investasiTokoPercent,
          allocation: alokasiInvestasi,
          expense: expInvestasi,
          remaining: alokasiInvestasi - expInvestasi,
        },
      }
    };
  }

  // STEAM & SORTIR RECORDS
  static getSteamSortir(storeId: string): SteamSortirRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STEAM_SORTIR);
    const all: SteamSortirRecord[] = raw ? JSON.parse(raw) : [];
    return all.filter(s => s.storeId === storeId);
  }

  static saveSteamSortir(list: SteamSortirRecord[]) {
    localStorage.setItem(STORAGE_KEYS.STEAM_SORTIR, JSON.stringify(list));
    list.forEach(item => this.syncToCloud('steam_sortir', item.id, item));
    this.notifyListeners('steam_sortir');
  }

  static addSteamSortir(item: SteamSortirRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.STEAM_SORTIR);
    let all: SteamSortirRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(item);
    this.saveSteamSortir(all);
  }

  static updateSteamSortir(item: SteamSortirRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.STEAM_SORTIR);
    let all: SteamSortirRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(s => s.id === item.id);
    if (idx !== -1) {
      all[idx] = item;
      this.saveSteamSortir(all);
    }
  }

  static deleteSteamSortir(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.STEAM_SORTIR);
    let all: SteamSortirRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(s => s.id !== id);
    this.saveSteamSortir(all);
    this.deleteFromCloud('steam_sortir', id);
  }

  // CALCULATIONS & BALANCES
  static calculateStock(storeId: string): { 
    totalPcsIn: number; 
    totalPcsReject: number;
    totalPcsLayakJual: number;
    totalPcsSold: number; 
    remainingStock: number;
  } {
    const inventory = this.getInventory(storeId);
    const steamSortir = this.getSteamSortir(storeId);
    const sales = this.getSales(storeId);

    // Total pcs awal yang dibeli / masuk dari ball inventory
    const totalPcsAwal = inventory.reduce((acc, curr) => acc + (curr.pcsCount || 0), 0);
    
    // Total pcs reject dari seluruh riwayat pengerjaan sortir & steam
    const totalPcsReject = steamSortir.reduce((acc, curr) => acc + (curr.pcsReject || 0), 0);
    
    // Stok masuk tersedia murni dari barang yang LAYAK JUAL (reject tidak dianggap/diabaikan)
    const totalPcsLayakJual = Math.max(0, totalPcsAwal - totalPcsReject);
    
    // Total pcs yang telah terjual
    const totalPcsSold = sales.reduce((acc, curr) => acc + (curr.pcsSold || 0), 0);

    return {
      totalPcsIn: totalPcsLayakJual, // Stok masuk efektif layak jual
      totalPcsReject,
      totalPcsLayakJual,
      totalPcsSold,
      remainingStock: totalPcsLayakJual - totalPcsSold,
    };
  }

  static calculateHPP(storeId: string, filterDateFn?: (date: string) => boolean): {
    totalModalBeli: number;
    totalOngkir: number;
    totalBiayaSteam: number;
    totalBiayaSortir: number;
    totalBiayaSortirKehadiran: number;
    totalBiayaSteamKehadiran: number;
    totalInsentifSortir: number;
    totalInsentifSteam: number;
    totalBiayaModalDanJasa: number;
    totalPcs: number;
    weightedAverageHpp: number;
  } {
    let inventory = this.getInventory(storeId);
    let steamSortirLogs = this.getSteamSortir(storeId);
    let attendance = this.getAttendance(storeId);
    const employees = this.getEmployees(storeId);

    if (filterDateFn) {
      inventory = inventory.filter(i => filterDateFn(i.date));
      steamSortirLogs = steamSortirLogs.filter(s => filterDateFn(s.date));
      attendance = attendance.filter(a => filterDateFn(a.date));
    }

    const totalModalBeli = inventory.reduce((acc, i) => acc + (i.modalPrice || 0), 0);
    const totalOngkir = inventory.reduce((acc, i) => acc + (i.shippingCost || 0), 0);
    
    const inventorySteamCost = inventory.reduce((acc, i) => acc + (i.steamCost || 0), 0);
    const inventorySortirCost = inventory.reduce((acc, i) => acc + (i.sortirCost || 0), 0);
    
    const logsSteamCost = steamSortirLogs
      .filter(l => l.processType === 'steam' || l.processType === 'sortir_dan_steam')
      .reduce((acc, l) => acc + (l.totalCost || 0), 0);
    const logsSortirCost = steamSortirLogs
      .filter(l => l.processType === 'sortir' || l.processType === 'sortir_dan_steam')
      .reduce((acc, l) => acc + (l.totalCost || 0), 0);

    // Hitung biaya kehadiran pekerja role sortir & steam sebagai penambah HPP Final
    let totalBiayaSortirKehadiran = 0;
    let totalBiayaSteamKehadiran = 0;

    attendance.forEach(att => {
      const emp = employees.find(e => e.id === att.employeeId || e.name?.toLowerCase() === att.employeeName?.toLowerCase());
      if (!emp) return;

      const salaryRate = emp.salaryRate || 0;
      const hoursWorked = att.hoursWorked || 0;
      const shiftCost = att.salaryType === 'hourly' || emp.salaryType === 'hourly'
        ? hoursWorked * salaryRate
        : salaryRate;

      const attRoleStr = (att.role || '').toLowerCase();
      const rolesExec = (att.rolesExecuted || []).map(r => r.toLowerCase());

      const isSortir = attRoleStr.includes('sortir') || 
                       rolesExec.includes('sortir') || 
                       (emp.roles.length === 1 && emp.roles[0] === 'sortir') ||
                       (!att.role && emp.roles.includes('sortir'));

      const isSteam = attRoleStr.includes('steam') || 
                      rolesExec.includes('steam') || 
                      (emp.roles.length === 1 && emp.roles[0] === 'steam') ||
                      (!att.role && emp.roles.includes('steam'));

      if (isSortir && isSteam) {
        totalBiayaSortirKehadiran += Math.round(shiftCost / 2);
        totalBiayaSteamKehadiran += Math.round(shiftCost / 2);
      } else if (isSortir) {
        totalBiayaSortirKehadiran += shiftCost;
      } else if (isSteam) {
        totalBiayaSteamKehadiran += shiftCost;
      }
    });

    // Hitung biaya Insentif tim sortir & steam sebagai komponen penambah HPP Final (HANYA DARI BARANG LAYAK JUAL)
    let totalInsentifSortir = 0;
    let totalInsentifSteam = 0;

    employees.forEach(emp => {
      if (emp.roles.includes('sortir')) {
        const config = emp.incentiveConfigs?.sortir;
        if (config && config.type !== 'none') {
          const workerLogs = steamSortirLogs.filter(log => {
            const isMatchRole = log.processType === 'sortir' || log.processType === 'sortir_dan_steam';
            const isMatchEmp = log.employeeIds?.includes(emp.id) || 
              log.employeeNames?.some(en => en.toLowerCase().includes(emp.name.toLowerCase()));
            return isMatchRole && isMatchEmp;
          });
          // Hanya hitung pcs yang layak jual (reject tidak dihitung)
          const totalPcsWorked = workerLogs.reduce((acc, l) => {
            const pcsLayak = l.pcsLayakJual !== undefined ? l.pcsLayakJual : Math.max(0, (l.pcsTotal || 0) - (l.pcsReject || 0));
            return acc + pcsLayak;
          }, 0);

          if (config.type === 'per_ball_pcs') {
            totalInsentifSortir += totalPcsWorked * (config.rate || 0);
          } else if (config.type === 'fixed_amount') {
            totalInsentifSortir += (config.rate || 0);
          }
        }
      }

      if (emp.roles.includes('steam')) {
        const config = emp.incentiveConfigs?.steam;
        if (config && config.type !== 'none') {
          const workerLogs = steamSortirLogs.filter(log => {
            const isMatchRole = log.processType === 'steam' || log.processType === 'sortir_dan_steam';
            const isMatchEmp = log.employeeIds?.includes(emp.id) || 
              log.employeeNames?.some(en => en.toLowerCase().includes(emp.name.toLowerCase()));
            return isMatchRole && isMatchEmp;
          });
          // Hanya hitung pcs yang layak jual (reject tidak dihitung)
          const totalPcsWorked = workerLogs.reduce((acc, l) => {
            const pcsLayak = l.pcsLayakJual !== undefined ? l.pcsLayakJual : Math.max(0, (l.pcsTotal || 0) - (l.pcsReject || 0));
            return acc + pcsLayak;
          }, 0);

          if (config.type === 'per_ball_pcs') {
            totalInsentifSteam += totalPcsWorked * (config.rate || 0);
          } else if (config.type === 'fixed_amount') {
            totalInsentifSteam += (config.rate || 0);
          }
        }
      }
    });

    const totalBiayaSteam = inventorySteamCost + logsSteamCost + totalBiayaSteamKehadiran + totalInsentifSteam;
    const totalBiayaSortir = inventorySortirCost + logsSortirCost + totalBiayaSortirKehadiran + totalInsentifSortir;

    const totalBiayaModalDanJasa = totalModalBeli + totalOngkir + totalBiayaSteam + totalBiayaSortir;
    
    // Total pcs efektif yang layak jual (jika ada reject, dibagi atas barang layak jual yang bisa menghasilkan omzet)
    const totalPcsAwal = inventory.reduce((acc, i) => acc + (i.pcsCount || 0), 0);
    const totalReject = steamSortirLogs.reduce((acc, s) => acc + (s.pcsReject || 0), 0);
    const totalPcsLayak = Math.max(0, totalPcsAwal - totalReject);
    const effectivePcs = totalPcsLayak > 0 ? totalPcsLayak : totalPcsAwal;

    const weightedAverageHpp = effectivePcs > 0 ? Math.round(totalBiayaModalDanJasa / effectivePcs) : 0;

    return {
      totalModalBeli,
      totalOngkir,
      totalBiayaSteam,
      totalBiayaSortir,
      totalBiayaSortirKehadiran,
      totalBiayaSteamKehadiran,
      totalInsentifSortir,
      totalInsentifSteam,
      totalBiayaModalDanJasa,
      totalPcs: effectivePcs,
      weightedAverageHpp,
    };
  }

  static calculateStorePayroll(storeId: string, filterDateFn?: (date: string) => boolean) {
    const employees = this.getEmployees(storeId);
    let attendance = this.getAttendance(storeId);
    let sales = this.getSales(storeId);
    let steamSortirLogs = this.getSteamSortir(storeId);

    if (filterDateFn) {
      attendance = attendance.filter(a => filterDateFn(a.date));
      sales = sales.filter(s => filterDateFn(s.date));
      steamSortirLogs = steamSortirLogs.filter(s => filterDateFn(s.date));
    }

    const totalStoreOmzet = sales.reduce((acc, s) => acc + (s.omzet || 0), 0);
    const totalStorePackages = sales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
    const totalStorePcs = sales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);

    // Initial pass for employee base salary, incentives, and multi-role bonus
    const employeeDrafts = employees.map(emp => {
      const empAttendance = attendance.filter(a => a.employeeId === emp.id || a.employeeName?.toLowerCase() === emp.name.toLowerCase());
      
      let operationalBaseSalary = 0;
      let hppLaborSalary = 0;
      let hoursWorked = 0;
      let daysPresent = 0;

      empAttendance.forEach(att => {
        const isHourly = att.salaryType === 'hourly' || emp.salaryType === 'hourly';
        const shiftCost = isHourly ? (att.hoursWorked || 0) * (emp.salaryRate || 0) : (emp.salaryRate || 0);

        if (isHourly) {
          hoursWorked += (att.hoursWorked || 0);
        } else {
          daysPresent += 1;
        }

        const attRoleStr = (att.role || '').toLowerCase();
        const rolesExec = (att.rolesExecuted || []).map(r => r.toLowerCase());
        const isSortirOrSteam = attRoleStr.includes('sortir') || 
                                attRoleStr.includes('steam') || 
                                rolesExec.includes('sortir') || 
                                rolesExec.includes('steam') ||
                                (!att.role && emp.roles.every(r => r === 'sortir' || r === 'steam'));

        if (isSortirOrSteam) {
          hppLaborSalary += shiftCost;
        } else {
          operationalBaseSalary += shiftCost;
        }
      });

      let totalIncentives = 0;
      let operationalIncentives = 0; // Host & Admin
      let hppSortirSteamIncentives = 0; // Sortir & Steam (allocated to HPP)
      const incentiveBreakdowns: { role: string; desc: string; amount: number; isHppIncentive?: boolean }[] = [];
      let empTotalPackages = 0;
      let empTotalPcs = 0;

      emp.roles.forEach(role => {
        const config = emp.incentiveConfigs?.[role];
        if (!config || config.type === 'none') return;

        if (role === 'host') {
          const mySales = sales.filter(s => 
            s.hostIds?.includes(emp.id) || 
            s.hostNames?.some(hn => hn.toLowerCase().includes(emp.name.toLowerCase()))
          );
          const hostPkgs = mySales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
          const hostPcs = mySales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
          empTotalPackages += hostPkgs;
          empTotalPcs += hostPcs;

          // Req: Perhitungan Terpisah Penjualan Satuan & Bundling
          if (config.hasSeparateBundlingSatuan || (config.bundlingRate !== undefined && config.bundlingRate > 0) || (config.satuanRate !== undefined && config.satuanRate > 0)) {
            let hostSatuanPcs = 0;
            let hostSatuanPkgs = 0;
            let hostSatuanOmzet = 0;
            let hostBundlingPcs = 0;
            let hostBundlingPkgs = 0;
            let hostBundlingOmzet = 0;

            mySales.forEach(s => {
              const hostCount = s.hostIds && s.hostIds.length > 0 ? s.hostIds.length : (s.hostNames && s.hostNames.length > 0 ? s.hostNames.length : 1);
              if (s.saleFormat === 'bundling') {
                hostBundlingPcs += (s.pcsSold || 0) / hostCount;
                hostBundlingPkgs += (s.packagesSold || 0) / hostCount;
                hostBundlingOmzet += (s.omzet || 0) / hostCount;
              } else if (s.saleFormat === 'campuran') {
                hostSatuanPcs += (s.satuanPcs || 0) / hostCount;
                hostSatuanPkgs += (s.satuanPackages || 0) / hostCount;
                hostSatuanOmzet += (s.satuanOmzet || 0) / hostCount;
                hostBundlingPcs += (s.bundlingPcs || 0) / hostCount;
                hostBundlingPkgs += (s.bundlingPackages || 0) / hostCount;
                hostBundlingOmzet += (s.bundlingOmzet || 0) / hostCount;
              } else {
                // Default 'satuan'
                hostSatuanPcs += (s.pcsSold || 0) / hostCount;
                hostSatuanPkgs += (s.packagesSold || 0) / hostCount;
                hostSatuanOmzet += (s.omzet || 0) / hostCount;
              }
            });

            const threshold = config.tierThresholdPackages || 0;
            const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && hostPkgs >= threshold);
            const tierMode = config.tierCalculationMode || 'excess_only';

            // 1. Hitung Insentif Satuan
            const satuanRate = config.satuanRate || 0;
            const satuanTierRate = config.tierRateSatuan || config.tierRate || satuanRate;
            const satuanType = config.satuanIncentiveType || 'per_pcs_sold';
            let satuanAmount = 0;
            let satuanDesc = '';

            if (satuanType === 'per_pcs_sold') {
              if (isTierAchieved && tierMode === 'excess_only') {
                const excessRatio = hostPkgs > 0 ? Math.max(0, hostPkgs - threshold) / hostPkgs : 0;
                const excessPcs = Math.round(hostSatuanPcs * excessRatio);
                const basePcs = Math.max(0, hostSatuanPcs - excessPcs);
                satuanAmount = Math.round((basePcs * satuanRate) + (excessPcs * satuanTierRate));
                satuanDesc = `📦 Insentif Satuan (${basePcs} pcs dasar x Rp ${satuanRate.toLocaleString('id-ID')} + ${excessPcs} pcs tier x Rp ${satuanTierRate.toLocaleString('id-ID')})`;
              } else if (isTierAchieved && tierMode === 'all_units') {
                satuanAmount = Math.round(hostSatuanPcs * satuanTierRate);
                satuanDesc = `✨ Target Tier Tercapai: Insentif Satuan (${hostSatuanPcs.toFixed(0)} pcs x Rp ${satuanTierRate.toLocaleString('id-ID')})`;
              } else {
                satuanAmount = Math.round(hostSatuanPcs * satuanRate);
                satuanDesc = `📦 Insentif Satuan (${hostSatuanPcs.toFixed(0)} pcs x Rp ${satuanRate.toLocaleString('id-ID')})`;
              }
            } else if (satuanType === 'per_package_sold') {
              if (isTierAchieved && tierMode === 'excess_only') {
                const excessRatio = hostPkgs > 0 ? Math.max(0, hostPkgs - threshold) / hostPkgs : 0;
                const excessPkgs = Math.round(hostSatuanPkgs * excessRatio);
                const basePkgs = Math.max(0, hostSatuanPkgs - excessPkgs);
                satuanAmount = Math.round((basePkgs * satuanRate) + (excessPkgs * satuanTierRate));
                satuanDesc = `📦 Insentif Satuan (${basePkgs} paket dasar x Rp ${satuanRate.toLocaleString('id-ID')} + ${excessPkgs} paket tier x Rp ${satuanTierRate.toLocaleString('id-ID')})`;
              } else if (isTierAchieved && tierMode === 'all_units') {
                satuanAmount = Math.round(hostSatuanPkgs * satuanTierRate);
                satuanDesc = `✨ Target Tier Tercapai: Insentif Satuan (${hostSatuanPkgs.toFixed(0)} paket x Rp ${satuanTierRate.toLocaleString('id-ID')})`;
              } else {
                satuanAmount = Math.round(hostSatuanPkgs * satuanRate);
                satuanDesc = `📦 Insentif Satuan (${hostSatuanPkgs.toFixed(0)} paket x Rp ${satuanRate.toLocaleString('id-ID')})`;
              }
            } else if (satuanType === 'percentage') {
              satuanAmount = Math.round((satuanRate / 100) * hostSatuanOmzet);
              satuanDesc = `📦 Insentif Satuan (${satuanRate}% dari Omzet Rp ${Math.round(hostSatuanOmzet).toLocaleString('id-ID')})`;
            }

            // 2. Hitung Insentif Bundling
            const bundlingRate = config.bundlingRate || 0;
            const bundlingTierRate = config.tierRateBundling || config.tierRate || bundlingRate;
            const bundlingType = config.bundlingIncentiveType || 'per_package_sold';
            let bundlingAmount = 0;
            let bundlingDesc = '';

            if (bundlingType === 'per_package_sold') {
              if (isTierAchieved && tierMode === 'excess_only') {
                const excessRatio = hostPkgs > 0 ? Math.max(0, hostPkgs - threshold) / hostPkgs : 0;
                const excessPkgs = Math.round(hostBundlingPkgs * excessRatio);
                const basePkgs = Math.max(0, hostBundlingPkgs - excessPkgs);
                bundlingAmount = Math.round((basePkgs * bundlingRate) + (excessPkgs * bundlingTierRate));
                bundlingDesc = `🎁 Insentif Bundling (${basePkgs} paket dasar x Rp ${bundlingRate.toLocaleString('id-ID')} + ${excessPkgs} paket tier x Rp ${bundlingTierRate.toLocaleString('id-ID')})`;
              } else if (isTierAchieved && tierMode === 'all_units') {
                bundlingAmount = Math.round(hostBundlingPkgs * bundlingTierRate);
                bundlingDesc = `✨ Target Tier Tercapai: Insentif Bundling (${hostBundlingPkgs.toFixed(0)} paket x Rp ${bundlingTierRate.toLocaleString('id-ID')})`;
              } else {
                bundlingAmount = Math.round(hostBundlingPkgs * bundlingRate);
                bundlingDesc = `🎁 Insentif Bundling (${hostBundlingPkgs.toFixed(0)} paket x Rp ${bundlingRate.toLocaleString('id-ID')})`;
              }
            } else if (bundlingType === 'per_pcs_sold') {
              if (isTierAchieved && tierMode === 'excess_only') {
                const excessRatio = hostPkgs > 0 ? Math.max(0, hostPkgs - threshold) / hostPkgs : 0;
                const excessPcs = Math.round(hostBundlingPcs * excessRatio);
                const basePcs = Math.max(0, hostBundlingPcs - excessPcs);
                bundlingAmount = Math.round((basePcs * bundlingRate) + (excessPcs * bundlingTierRate));
                bundlingDesc = `🎁 Insentif Bundling (${basePcs} pcs dasar x Rp ${bundlingRate.toLocaleString('id-ID')} + ${excessPcs} pcs tier x Rp ${bundlingTierRate.toLocaleString('id-ID')})`;
              } else if (isTierAchieved && tierMode === 'all_units') {
                bundlingAmount = Math.round(hostBundlingPcs * bundlingTierRate);
                bundlingDesc = `✨ Target Tier Tercapai: Insentif Bundling (${hostBundlingPcs.toFixed(0)} pcs x Rp ${bundlingTierRate.toLocaleString('id-ID')})`;
              } else {
                bundlingAmount = Math.round(hostBundlingPcs * bundlingRate);
                bundlingDesc = `🎁 Insentif Bundling (${hostBundlingPcs.toFixed(0)} pcs x Rp ${bundlingRate.toLocaleString('id-ID')})`;
              }
            } else if (bundlingType === 'percentage') {
              bundlingAmount = Math.round((bundlingRate / 100) * hostBundlingOmzet);
              bundlingDesc = `🎁 Insentif Bundling (${bundlingRate}% dari Omzet Rp ${Math.round(hostBundlingOmzet).toLocaleString('id-ID')})`;
            }

            const totalHostInc = satuanAmount + bundlingAmount;
            totalIncentives += totalHostInc;
            operationalIncentives += totalHostInc;

            if (satuanAmount > 0 || bundlingAmount === 0) {
              incentiveBreakdowns.push({
                role: 'host',
                desc: satuanDesc,
                amount: satuanAmount,
              });
            }
            if (bundlingAmount > 0) {
              incentiveBreakdowns.push({
                role: 'host',
                desc: bundlingDesc,
                amount: bundlingAmount,
              });
            }
          } else {
            // Standard / Tier Calculation
            const threshold = config.tierThresholdPackages || 0;
            const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && hostPkgs >= threshold);
            const tierMode = config.tierCalculationMode || 'excess_only';
            const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : (config.rate || 0);

            if (config.type === 'per_pcs_sold') {
              let amount = 0;
              let desc = '';
              if (isTierAchieved && tierMode === 'excess_only') {
                const excessRatio = hostPkgs > 0 ? Math.max(0, hostPkgs - threshold) / hostPkgs : 0;
                const excessPcs = Math.round(hostPcs * excessRatio);
                const basePcs = Math.max(0, hostPcs - excessPcs);
                amount = (basePcs * (config.rate || 0)) + (excessPcs * (config.tierRate || 0));
                desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePcs} pcs dasar x Rp ${(config.rate || 0).toLocaleString('id-ID')} + ${excessPcs} pcs selisih x Rp ${(config.tierRate || 0).toLocaleString('id-ID')}`;
              } else if (isTierAchieved && tierMode === 'all_units') {
                amount = hostPcs * effectiveRate;
                desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${hostPcs} pcs x Rp ${effectiveRate.toLocaleString('id-ID')}`;
              } else {
                amount = hostPcs * (config.rate || 0);
                desc = `${hostPcs} pcs terjual live x Rp ${(config.rate || 0).toLocaleString('id-ID')}`;
              }
              totalIncentives += amount;
              operationalIncentives += amount;
              incentiveBreakdowns.push({
                role: 'host',
                desc,
                amount,
              });
            } else if (config.type === 'per_package_sold') {
              let amount = 0;
              let desc = '';
              if (isTierAchieved && tierMode === 'excess_only') {
                const basePkgs = Math.min(hostPkgs, threshold);
                const excessPkgs = Math.max(0, hostPkgs - threshold);
                amount = (basePkgs * (config.rate || 0)) + (excessPkgs * (config.tierRate || 0));
                desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePkgs} paket dasar x Rp ${(config.rate || 0).toLocaleString('id-ID')} + ${excessPkgs} paket selisih x Rp ${(config.tierRate || 0).toLocaleString('id-ID')}`;
              } else if (isTierAchieved && tierMode === 'all_units') {
                amount = hostPkgs * effectiveRate;
                desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${hostPkgs} paket x Rp ${effectiveRate.toLocaleString('id-ID')}`;
              } else {
                amount = hostPkgs * (config.rate || 0);
                desc = `${hostPkgs} paket live x Rp ${(config.rate || 0).toLocaleString('id-ID')}`;
              }
              totalIncentives += amount;
              operationalIncentives += amount;
              incentiveBreakdowns.push({
                role: 'host',
                desc,
                amount,
              });
            } else if (config.type === 'fixed_amount') {
              const amount = effectiveRate;
              totalIncentives += amount;
              operationalIncentives += amount;
              incentiveBreakdowns.push({
                role: 'host',
                desc: isTierAchieved ? `✨ Target Tier: Insentif Host Flat Rp ${effectiveRate.toLocaleString('id-ID')}` : `Insentif Tetap Host`,
                amount,
              });
            }
          }
        } else if (role === 'admin_toko') {
          const adminSales = sales.filter(s => 
            s.adminIds?.includes(emp.id) || 
            s.adminId === emp.id || 
            s.adminNames?.some(an => an.toLowerCase().includes(emp.name.toLowerCase())) ||
            (s.adminName && s.adminName.toLowerCase().includes(emp.name.toLowerCase()))
          );
          const adminPkgs = adminSales.reduce((acc, s) => acc + (s.packagesSold || 0), 0);
          const adminPcs = adminSales.reduce((acc, s) => acc + (s.pcsSold || 0), 0);
          empTotalPackages += adminPkgs;
          empTotalPcs += adminPcs;

          const threshold = config.tierThresholdPackages || 0;
          const isTierAchieved = Boolean(config.hasTierRule && threshold > 0 && adminPkgs >= threshold);
          const tierMode = config.tierCalculationMode || 'excess_only';
          const effectiveRate = isTierAchieved && config.tierRate ? config.tierRate : (config.rate || 0);

          if (config.type === 'per_package_sold') {
            let amount = 0;
            let desc = '';
            if (isTierAchieved && tierMode === 'excess_only') {
              const basePkgs = Math.min(adminPkgs, threshold);
              const excessPkgs = Math.max(0, adminPkgs - threshold);
              amount = (basePkgs * (config.rate || 0)) + (excessPkgs * (config.tierRate || 0));
              desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePkgs} paket dasar x Rp ${(config.rate || 0).toLocaleString('id-ID')} + ${excessPkgs} paket selisih x Rp ${(config.tierRate || 0).toLocaleString('id-ID')}`;
            } else if (isTierAchieved && tierMode === 'all_units') {
              amount = adminPkgs * effectiveRate;
              desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${adminPkgs} paket dicatat x Rp ${effectiveRate.toLocaleString('id-ID')}`;
            } else {
              amount = adminPkgs * (config.rate || 0);
              desc = `${adminPkgs} paket dicatat & packing x Rp ${(config.rate || 0).toLocaleString('id-ID')}`;
            }
            totalIncentives += amount;
            operationalIncentives += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc,
              amount,
            });
          } else if (config.type === 'per_pcs_sold') {
            let amount = 0;
            let desc = '';
            if (isTierAchieved && tierMode === 'excess_only') {
              const excessRatio = adminPkgs > 0 ? Math.max(0, adminPkgs - threshold) / adminPkgs : 0;
              const excessPcs = Math.round(adminPcs * excessRatio);
              const basePcs = Math.max(0, adminPcs - excessPcs);
              amount = (basePcs * (config.rate || 0)) + (excessPcs * (config.tierRate || 0));
              desc = `✨ Tier Progresif (Target ${threshold} paket): ${basePcs} pcs dasar x Rp ${(config.rate || 0).toLocaleString('id-ID')} + ${excessPcs} pcs selisih x Rp ${(config.tierRate || 0).toLocaleString('id-ID')}`;
            } else if (isTierAchieved && tierMode === 'all_units') {
              amount = adminPcs * effectiveRate;
              desc = `✨ Target Tier Tercapai (≥ ${threshold} paket): ${adminPcs} pcs dicatat x Rp ${effectiveRate.toLocaleString('id-ID')}`;
            } else {
              amount = adminPcs * (config.rate || 0);
              desc = `${adminPcs} pcs dicatat x Rp ${(config.rate || 0).toLocaleString('id-ID')}`;
            }
            totalIncentives += amount;
            operationalIncentives += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc,
              amount,
            });
          } else if (config.type === 'fixed_amount') {
            const amount = effectiveRate;
            totalIncentives += amount;
            operationalIncentives += amount;
            incentiveBreakdowns.push({
              role: 'admin_toko',
              desc: isTierAchieved ? `✨ Target Tier: Insentif Admin Flat Rp ${effectiveRate.toLocaleString('id-ID')}` : `Insentif Tetap Admin Toko`,
              amount,
            });
          }
        } else if (role === 'sortir' || role === 'steam') {
          const workerLogs = steamSortirLogs.filter(log => {
            const isMatchRole = log.processType === role || log.processType === 'sortir_dan_steam';
            const isMatchEmp = log.employeeIds?.includes(emp.id) || 
              log.employeeNames?.some(en => en.toLowerCase().includes(emp.name.toLowerCase()));
            return isMatchRole && isMatchEmp;
          });
          // Hanya hitung pcs yang layak jual (reject tidak dihitung)
          const totalPcsWorked = workerLogs.reduce((acc, l) => {
            const pcsLayak = l.pcsLayakJual !== undefined ? l.pcsLayakJual : Math.max(0, (l.pcsTotal || 0) - (l.pcsReject || 0));
            return acc + pcsLayak;
          }, 0);

          if (config.type === 'per_ball_pcs') {
            const amount = totalPcsWorked * (config.rate || 0);
            totalIncentives += amount;
            hppSortirSteamIncentives += amount;
            incentiveBreakdowns.push({
              role,
              desc: `${totalPcsWorked} pcs layak jual (${role}) x Rp ${(config.rate || 0).toLocaleString('id-ID')} (Masuk HPP)`,
              amount,
              isHppIncentive: true,
            });
          } else if (config.type === 'fixed_amount') {
            const amount = config.rate || 0;
            totalIncentives += amount;
            hppSortirSteamIncentives += amount;
            incentiveBreakdowns.push({
              role,
              desc: `Insentif Tetap ${role} (Masuk HPP)`,
              amount,
              isHppIncentive: true,
            });
          }
        }
      });

      // Bonus Rangkap Role Penjualan Paket
      let multiRoleBonus = 0;
      let multiRoleBonusDesc = '';
      if (emp.roles.length > 1 && emp.multiRoleSalesRule?.active) {
        const rule = emp.multiRoleSalesRule;
        const evaluatedPackages = empTotalPackages > 0 ? empTotalPackages : totalStorePackages;
        const evaluatedPcs = empTotalPcs > 0 ? empTotalPcs : totalStorePcs;

        if (evaluatedPackages >= (rule.thresholdPackages || 0)) {
          if (rule.benefitType === 'bonus_per_package') {
            multiRoleBonus = evaluatedPackages * (rule.benefitValue || 0);
            multiRoleBonusDesc = `Bonus Rangkap Role (${evaluatedPackages} paket x Rp ${(rule.benefitValue || 0).toLocaleString('id-ID')})`;
          } else if (rule.benefitType === 'bonus_per_pcs') {
            multiRoleBonus = evaluatedPcs * (rule.benefitValue || 0);
            multiRoleBonusDesc = `Bonus Rangkap Role (${evaluatedPcs} pcs x Rp ${(rule.benefitValue || 0).toLocaleString('id-ID')})`;
          } else if (rule.benefitType === 'hourly_rate_override') {
            multiRoleBonus = hoursWorked * (rule.benefitValue || 0);
            multiRoleBonusDesc = `Kenaikan Gaji Pokok Rangkap Role (${hoursWorked} jam x Rp ${(rule.benefitValue || 0).toLocaleString('id-ID')})`;
          } else {
            multiRoleBonus = rule.benefitValue || 0;
            multiRoleBonusDesc = `Bonus Tetap Rangkap Role (Tembus ${rule.thresholdPackages} paket)`;
          }
        }
      }

      return {
        employee: emp,
        operationalBaseSalary,
        hppLaborSalary,
        baseSalary: operationalBaseSalary,
        hoursWorked,
        daysPresent,
        incentiveBreakdowns,
        totalIncentives,
        operationalIncentives,
        hppSortirSteamIncentives,
        multiRoleBonus,
        multiRoleBonusDesc,
      };
    });

    // Calculate Store Net Profit before monthly bonus for 'percentage_laba_bersih' evaluation
    const subtotalOperBaseSalary = employeeDrafts.reduce((acc, e) => acc + e.operationalBaseSalary, 0);
    const subtotalOperIncentives = employeeDrafts.reduce((acc, e) => acc + e.operationalIncentives, 0);
    const subtotalMultiRoleBonus = employeeDrafts.reduce((acc, e) => acc + e.multiRoleBonus, 0);

    const hppData = this.calculateHPP(storeId, filterDateFn);
    const avgHpp = hppData.weightedAverageHpp > 0 ? hppData.weightedAverageHpp : 20000;
    const modalTerjual = totalStorePcs * avgHpp;
    const store = this.getStoreById(storeId);
    const adminPct = store?.settings?.adminPromoPercentage ?? 8.5;
    const totalAdminShopee = Math.round((adminPct / 100) * totalStoreOmzet);
    const serviceFee = totalStorePackages * (store?.settings?.serviceFeePerOrder ?? 1250);
    const totalAds = sales.reduce((acc, s) => acc + (s.adsUsed || 0), 0);
    const totalCoin = sales.reduce((acc, s) => acc + (s.coinUsed || 0), 0);
    const allReturns = this.getReturns(storeId).filter(r => !filterDateFn || filterDateFn(r.date));
    const returnAmount = store?.settings?.returnMechanism === 'estimate' 
      ? Math.round(((store?.settings?.estimateReturnPercentage ?? 3) / 100) * totalStoreOmzet)
      : allReturns.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const labaKotor = totalStoreOmzet - modalTerjual - totalAdminShopee - serviceFee - totalAds - totalCoin - returnAmount;
    const allCashflows = this.getCashflow(storeId).filter(c => !filterDateFn || filterDateFn(c.date));
    const pengeluaranKas = allCashflows.filter(c => c.type === 'outflow').reduce((acc, c) => acc + c.amount, 0);
    const estimatedStoreNetProfit = Math.max(0, labaKotor - pengeluaranKas - (subtotalOperBaseSalary + subtotalOperIncentives + subtotalMultiRoleBonus));

    // Calculate Monthly Omzet Bonus for each employee
    const employeeSalaries = employeeDrafts.map(draft => {
      const emp = draft.employee;
      let monthlyOmzetBonus = 0;
      let monthlyOmzetBonusDesc = '';

      if (emp.monthlyOmzetBonusRule?.active) {
        const rule = emp.monthlyOmzetBonusRule;
        if (totalStoreOmzet >= (rule.targetOmzet || 0)) {
          if (rule.bonusType === 'percentage') {
            monthlyOmzetBonus = Math.round(((rule.bonusValue || 0) / 100) * totalStoreOmzet);
            monthlyOmzetBonusDesc = `Bonus Target Omzet Toko (${rule.bonusValue}% dari Omzet Rp ${totalStoreOmzet.toLocaleString('id-ID')})`;
          } else if (rule.bonusType === 'percentage_laba_bersih') {
            monthlyOmzetBonus = Math.round(((rule.bonusValue || 0) / 100) * estimatedStoreNetProfit);
            monthlyOmzetBonusDesc = `Bonus Target Omzet (${rule.bonusValue}% dari Laba Bersih Toko Rp ${estimatedStoreNetProfit.toLocaleString('id-ID')})`;
          } else {
            monthlyOmzetBonus = rule.bonusValue || 0;
            monthlyOmzetBonusDesc = `Bonus Target Omzet Bulanan (Tembus Target)`;
          }
        }
      }

      // Total take home pay includes full earnings: base + hpp labor + all incentives + bonuses
      const totalTakeHomePay = draft.operationalBaseSalary + draft.hppLaborSalary + draft.totalIncentives + draft.multiRoleBonus + monthlyOmzetBonus;

      return {
        employee: emp,
        operationalBaseSalary: draft.operationalBaseSalary,
        hppLaborSalary: draft.hppLaborSalary,
        baseSalary: draft.operationalBaseSalary, // Beban gaji operasional toko (Sortir/Steam masuk HPP Final)
        hoursWorked: draft.hoursWorked,
        daysPresent: draft.daysPresent,
        incentiveBreakdowns: draft.incentiveBreakdowns,
        totalIncentives: draft.totalIncentives,
        operationalIncentives: draft.operationalIncentives,
        hppSortirSteamIncentives: draft.hppSortirSteamIncentives,
        multiRoleBonus: draft.multiRoleBonus,
        multiRoleBonusDesc: draft.multiRoleBonusDesc,
        monthlyOmzetBonus,
        monthlyOmzetBonusDesc,
        totalTakeHomePay,
      };
    });

    const totalBaseSalary = employeeSalaries.reduce((acc, e) => acc + e.operationalBaseSalary, 0);
    const totalHppLaborSalary = employeeSalaries.reduce((acc, e) => acc + e.hppLaborSalary, 0);
    const totalOperationalIncentives = employeeSalaries.reduce((acc, e) => acc + e.operationalIncentives, 0);
    const totalSortirSteamIncentives = employeeSalaries.reduce((acc, e) => acc + e.hppSortirSteamIncentives, 0);
    const totalIncentives = employeeSalaries.reduce((acc, e) => acc + e.totalIncentives, 0);
    const totalMultiRoleBonus = employeeSalaries.reduce((acc, e) => acc + e.multiRoleBonus, 0);
    const totalMonthlyBonus = employeeSalaries.reduce((acc, e) => acc + e.monthlyOmzetBonus, 0);
    
    // Total Beban Gaji Operasional Toko (tanpa upah & insentif sortir/steam karena sudah masuk modal HPP barang)
    const totalOperationalSalary = totalBaseSalary + totalOperationalIncentives + totalMultiRoleBonus + totalMonthlyBonus;
    const totalPayroll = totalOperationalSalary; // Digunakan di Laba Bersih
    const totalAllEmployeePayout = totalOperationalSalary + totalHppLaborSalary + totalSortirSteamIncentives; // Total dana keluar untuk gaji

    return {
      employeeSalaries,
      totalBaseSalary,
      totalHppLaborSalary,
      totalOperationalIncentives,
      totalSortirSteamIncentives,
      totalIncentives,
      totalMultiRoleBonus,
      totalMonthlyBonus,
      totalOperationalSalary,
      totalPayroll,
      totalAllEmployeePayout,
    };
  }

  /**
   * Helper to retrieve salary payment records and remaining unpaid balance for an employee
   */
  static getEmployeeSalaryPaymentSummary(
    storeId: string, 
    employeeId: string, 
    totalGrandSalary: number,
    filterDateFn?: (date: string) => boolean
  ): {
    totalPaid: number;
    totalGajiPaid: number;
    totalKasbon: number;
    hasKasbon: boolean;
    remainingUnpaid: number;
    status: 'paid' | 'partial' | 'unpaid' | 'kasbon_exceeded';
    payments: CashflowRecord[];
    paymentRecords: CashflowRecord[];
  } {
    let cashflows = this.getCashflow(storeId);
    if (filterDateFn) {
      cashflows = cashflows.filter(c => filterDateFn(c.date));
    }

    const paymentRecords = cashflows.filter(c => 
      c.type === 'outflow' && 
      (c.category === 'gaji' || c.category === 'gaji_pegawai') &&
      (c.employeeId === employeeId || (!c.employeeId && c.description?.toLowerCase().includes(employeeId.toLowerCase())))
    );

    const isKasbonRecord = (c: CashflowRecord) => 
      c.paymentType === 'kasbon' || 
      (c.description && c.description.toLowerCase().includes('kasbon'));

    const totalKasbon = paymentRecords
      .filter(c => isKasbonRecord(c))
      .reduce((acc, c) => acc + (c.amount || 0), 0);

    const totalGajiPaid = paymentRecords
      .filter(c => !isKasbonRecord(c))
      .reduce((acc, c) => acc + (c.amount || 0), 0);

    const totalPaid = totalGajiPaid + totalKasbon;
    // Sisa belum dibayar / sisa gaji bersih: jika kasbon/pembayaran melebihi hak gaji, nilai menjadi minus
    const remainingUnpaid = totalGrandSalary - totalPaid;
    const hasKasbon = totalKasbon > 0;

    let status: 'paid' | 'partial' | 'unpaid' | 'kasbon_exceeded' = 'unpaid';
    if (remainingUnpaid < 0) {
      status = 'kasbon_exceeded';
    } else if (remainingUnpaid === 0 && (totalGrandSalary > 0 || totalPaid > 0)) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }

    return {
      totalPaid,
      totalGajiPaid,
      totalKasbon,
      hasKasbon,
      remainingUnpaid,
      status,
      payments: paymentRecords,
      paymentRecords,
    };
  }

  /**
   * Validation helpers for duplicate usernames and store names
   */
  static isUsernameTaken(username: string, excludeEmployeeId?: string, excludeStoreId?: string): boolean {
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) return false;

    // Check across all stores' owner usernames
    const stores = this.getStores();
    const isOwnerTaken = stores.some(s => {
      const ownerClean = s.ownerUsername.trim().toLowerCase().replace(/\s+/g, '');
      if (ownerClean !== cleanUsername) return false;
      // If we are editing a store owner account, allow retaining their own username
      if (excludeStoreId && s.id === excludeStoreId && !excludeEmployeeId) {
        return false;
      }
      return true;
    });
    if (isOwnerTaken) return true;

    // Check across all employees in all stores
    const allEmployees = this.getAllEmployeesRaw();
    const isEmpTaken = allEmployees.some(e => 
      e.id !== excludeEmployeeId && 
      e.username.trim().toLowerCase().replace(/\s+/g, '') === cleanUsername
    );

    return isEmpTaken;
  }

  /**
   * Asynchronous validation helper that also checks Firestore directly
   * to guarantee no cross-device duplicate username registrations can happen.
   */
  static async checkUsernameAvailabilityAsync(
    username: string, 
    excludeEmployeeId?: string, 
    excludeStoreId?: string
  ): Promise<{ isTaken: boolean; reason?: string }> {
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      return { isTaken: false };
    }

    // 1. Check local cache
    if (this.isUsernameTaken(cleanUsername, excludeEmployeeId, excludeStoreId)) {
      return { 
        isTaken: true, 
        reason: `Username "${cleanUsername}" sudah digunakan di sistem.` 
      };
    }

    // 2. Query Firestore live collections to detect freshly created usernames on other devices
    if (db) {
      try {
        // Query employees collection
        const empQuery = query(collection(db, 'employees'), where('username', '==', cleanUsername));
        const empSnap = await getDocs(empQuery);
        const hasOtherEmp = empSnap.docs.some(d => d.id !== excludeEmployeeId);
        if (hasOtherEmp) {
          return { 
            isTaken: true, 
            reason: `Username "${cleanUsername}" sudah terdaftar pada akun pegawai lain di Cloud.` 
          };
        }

        // Query stores collection
        const storeQuery = query(collection(db, 'stores'), where('ownerUsername', '==', cleanUsername));
        const storeSnap = await getDocs(storeQuery);
        const hasOtherOwner = storeSnap.docs.some(d => {
          if (excludeStoreId && d.id === excludeStoreId && !excludeEmployeeId) {
            return false;
          }
          return true;
        });
        if (hasOtherOwner) {
          return { 
            isTaken: true, 
            reason: `Username "${cleanUsername}" sudah digunakan sebagai akun Owner Toko di Cloud.` 
          };
        }
      } catch (err) {
        console.warn('Live cloud username availability check notice:', err);
      }
    }

    return { isTaken: false };
  }

  static isStoreNameTaken(storeName: string, excludeStoreId?: string): boolean {
    const cleanName = storeName.trim().toLowerCase();
    if (!cleanName) return false;

    const stores = this.getStores();
    return stores.some(s => 
      s.id !== excludeStoreId && 
      s.storeName.trim().toLowerCase() === cleanName
    );
  }

  static calculateAdsAndCoins(storeId: string): {
    totalAdsTopup: number;
    totalCoinTopup: number;
    totalAdsUsed: number;
    totalCoinUsed: number;
    remainingAds: number;
    remainingCoin: number;
  } {
    const deposits = this.getAdsCoins(storeId);
    const sales = this.getSales(storeId);

    const totalAdsTopup = deposits.reduce((acc, curr) => acc + (curr.adsAmount || 0), 0);
    const totalCoinTopup = deposits.reduce((acc, curr) => acc + (curr.coinAmount || 0), 0);

    const totalAdsUsed = sales.reduce((acc, curr) => acc + (curr.adsUsed || 0), 0);
    const totalCoinUsed = sales.reduce((acc, curr) => acc + (curr.coinUsed || 0), 0);

    return {
      totalAdsTopup,
      totalCoinTopup,
      totalAdsUsed,
      totalCoinUsed,
      remainingAds: totalAdsTopup - totalAdsUsed,
      remainingCoin: totalCoinTopup - totalCoinUsed,
    };
  }

  // ==========================================
  // REAL-TIME OPTIMIZED LIVE CHAT TIM TOKO
  // ==========================================
  static getChatMessages(storeId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CHAT_MESSAGES}_${storeId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}

    // Initial default greeting to keep chat active and welcoming
    const initialWelcome: ChatMessage[] = [
      {
        id: 'msg-welcome-sys',
        storeId,
        senderId: 'system-bot',
        senderName: 'Seller Robot AI',
        senderRole: 'Sistem',
        text: 'Selamat datang di Live Chat Toko! Ruang koordinasi real-time untuk Owner, Host Live, Admin Toko, Steam, & Sortir.',
        timestamp: Date.now() - 3600000,
        tag: 'umum',
      },
    ];
    return initialWelcome;
  }

  static saveChatMessagesLocally(storeId: string, messages: ChatMessage[]): void {
    try {
      // Keep strictly maximum 80 messages to keep memory and storage feather-light
      const capped = messages.slice(-80);
      localStorage.setItem(`${STORAGE_KEYS.CHAT_MESSAGES}_${storeId}`, JSON.stringify(capped));
    } catch {}
  }

  static async sendChatMessage(
    storeId: string,
    messageData: {
      senderId: string;
      senderName: string;
      senderRole: string;
      text: string;
      tag?: 'umum' | 'urgent' | 'live' | 'shift';
    }
  ): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      storeId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      text: messageData.text.trim(),
      timestamp: Date.now(),
      tag: messageData.tag || 'umum',
    };

    // 1. Optimistic instant local save for 0ms UI latency
    const current = this.getChatMessages(storeId);
    const updated = [...current, newMsg].slice(-80);
    this.saveChatMessagesLocally(storeId, updated);

    // 2. Sync to Firestore in background if available
    if (db) {
      try {
        const chatRef = doc(db, 'stores', storeId, 'chat_messages', newMsg.id);
        await setDoc(chatRef, newMsg);
      } catch (err) {
        console.warn('Firestore chat message sync skipped (running offline/local mode):', err);
      }
    }

    return newMsg;
  }

  static subscribeChatMessages(
    storeId: string,
    onMessages: (messages: ChatMessage[]) => void
  ): () => void {
    // Return initial local data immediately
    const initial = this.getChatMessages(storeId);
    onMessages(initial);

    // Cross-tab broadcast listener via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEYS.CHAT_MESSAGES}_${storeId}`) {
        try {
          if (e.newValue) {
            onMessages(JSON.parse(e.newValue));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // If Firestore is available, attach live onSnapshot listener with lean query
    let firestoreUnsub: (() => void) | null = null;
    if (db) {
      try {
        const colRef = collection(db, 'stores', storeId, 'chat_messages');
        firestoreUnsub = onSnapshot(
          colRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const remoteMsgs: ChatMessage[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as ChatMessage;
                if (data && data.text) {
                  remoteMsgs.push(data);
                }
              });

              if (remoteMsgs.length > 0) {
                // Sort by timestamp ascending
                remoteMsgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                const capped = remoteMsgs.slice(-80);
                this.saveChatMessagesLocally(storeId, capped);
                onMessages(capped);
              }
            }
          },
          (err) => {
            console.warn('Firestore chat onSnapshot note:', err);
          }
        );
      } catch (err) {
        console.warn('Firestore live chat listener fallback to local:', err);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (firestoreUnsub) {
        firestoreUnsub();
      }
    };
  }

  static async clearChatMessages(storeId: string): Promise<void> {
    const welcome = [
      {
        id: 'msg-welcome-sys',
        storeId,
        senderId: 'system-bot',
        senderName: 'Seller Robot AI',
        senderRole: 'Sistem',
        text: 'Riwayat obrolan telah dibersihkan oleh Owner.',
        timestamp: Date.now(),
        tag: 'umum' as const,
      },
    ];
    this.saveChatMessagesLocally(storeId, welcome);

    if (db) {
      try {
        const colRef = collection(db, 'stores', storeId, 'chat_messages');
        const snap = await getDocs(colRef);
        snap.forEach(async (d) => {
          await deleteDoc(d.ref).catch(() => {});
        });
      } catch {}
    }
  }
}
