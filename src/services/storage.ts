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
  SteamSortirRecord
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
};

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
      host: { type: 'per_pcs_sold', rate: 1000, description: 'Rp 1.000 per pcs terjual saat live' },
      admin_toko: { type: 'per_package_sold', rate: 500, description: 'Rp 500 per paket diproses' },
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

  // Sync a single record to cloud firestore
  private static async syncToCloud(collectionName: string, docId: string, data: any) {
    if (!db) return;
    try {
      await setDoc(doc(db, collectionName, docId), data, { merge: true });
    } catch (e) {
      console.warn(`Cloud sync write notice for ${collectionName}:`, e);
    }
  }

  // Delete a record from cloud firestore
  private static async deleteFromCloud(collectionName: string, docId: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (e) {
      console.warn(`Cloud sync delete notice for ${collectionName}:`, e);
    }
  }

  /**
   * Fetch all stores and employees from Firestore so that newly registered
   * usernames/stores from any other phone are instantly available on this phone.
   */
  public static async syncStoresAndEmployeesFromCloud(): Promise<boolean> {
    if (!db) return false;
    try {
      // 1. Sync Stores
      const storesSnap = await getDocs(collection(db, 'stores'));
      if (!storesSnap.empty) {
        const cloudStores: StoreAccount[] = [];
        storesSnap.forEach(d => {
          cloudStores.push(d.data() as StoreAccount);
        });
        if (cloudStores.length > 0) {
          localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(cloudStores));
        }
      } else {
        // Seed default store to Firestore if empty
        const localStores = this.getStores();
        for (const st of localStores) {
          await this.syncToCloud('stores', st.id, st);
        }
      }

      // 2. Sync Employees
      const empSnap = await getDocs(collection(db, 'employees'));
      if (!empSnap.empty) {
        const cloudEmployees: Employee[] = [];
        empSnap.forEach(d => {
          cloudEmployees.push(d.data() as Employee);
        });
        if (cloudEmployees.length > 0) {
          localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(cloudEmployees));
        }
      } else {
        // Seed default employees to Firestore if empty
        const localEmps = this.getAllEmployeesRaw();
        for (const emp of localEmps) {
          await this.syncToCloud('employees', emp.id, emp);
        }
      }

      this.notifyListeners('stores_and_employees');
      return true;
    } catch (err) {
      console.warn('Sync stores & employees failed, using local cache:', err);
      return false;
    }
  }

  /**
   * Comprehensive fetch for all store collections
   */
  public static async syncAllFromCloud(storeId?: string): Promise<boolean> {
    if (!db) return false;
    this.isSyncing = true;
    try {
      await this.syncStoresAndEmployeesFromCloud();

      const currentStoreId = storeId || this.getCurrentUser()?.storeId;
      if (currentStoreId) {
        // Sync inventory
        const invSnap = await getDocs(collection(db, 'inventory_balls'));
        if (!invSnap.empty) {
          const invList: BallInventory[] = [];
          invSnap.forEach(d => invList.push(d.data() as BallInventory));
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(invList));
        }

        // Sync attendance
        const attSnap = await getDocs(collection(db, 'attendance'));
        if (!attSnap.empty) {
          const attList: AttendanceRecord[] = [];
          attSnap.forEach(d => attList.push(d.data() as AttendanceRecord));
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attList));
        }

        // Sync sales
        const salesSnap = await getDocs(collection(db, 'sales'));
        if (!salesSnap.empty) {
          const salesList: SalesRecord[] = [];
          salesSnap.forEach(d => salesList.push(d.data() as SalesRecord));
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesList));
        }

        // Sync returns
        const returnsSnap = await getDocs(collection(db, 'returns'));
        if (!returnsSnap.empty) {
          const returnsList: ReturnRecord[] = [];
          returnsSnap.forEach(d => returnsList.push(d.data() as ReturnRecord));
          localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returnsList));
        }

        // Sync ads & coins
        const adsSnap = await getDocs(collection(db, 'ads_coins'));
        if (!adsSnap.empty) {
          const adsList: AdsCoinDeposit[] = [];
          adsSnap.forEach(d => adsList.push(d.data() as AdsCoinDeposit));
          localStorage.setItem(STORAGE_KEYS.ADS_COINS, JSON.stringify(adsList));
        }

        // Sync cashflow
        const cashflowSnap = await getDocs(collection(db, 'cashflow'));
        if (!cashflowSnap.empty) {
          const cashList: CashflowRecord[] = [];
          cashflowSnap.forEach(d => cashList.push(d.data() as CashflowRecord));
          localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(cashList));
        }

        // Sync steam sortir
        const steamSnap = await getDocs(collection(db, 'steam_sortir'));
        if (!steamSnap.empty) {
          const steamList: SteamSortirRecord[] = [];
          steamSnap.forEach(d => steamList.push(d.data() as SteamSortirRecord));
          localStorage.setItem(STORAGE_KEYS.STEAM_SORTIR, JSON.stringify(steamList));
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
   * This automatically receives real-time updates when any phone creates or changes data.
   */
  public static startRealtimeSync(storeId?: string): () => void {
    if (!db) return () => {};

    // Clear existing listeners
    this.stopRealtimeSync();

    try {
      // 1. Realtime listener for Stores
      const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
        if (!snapshot.empty) {
          const list: StoreAccount[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as StoreAccount));
          localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(list));
          this.notifyListeners('stores');
        }
      }, (err) => console.warn('Realtime stores listener notice:', err));
      this.activeUnsubscribes.push(unsubStores);

      // 2. Realtime listener for Employees
      const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Employee[] = [];
          snapshot.forEach(docSnap => list.push(docSnap.data() as Employee));
          localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
          this.notifyListeners('employees');
        }
      }, (err) => console.warn('Realtime employees listener notice:', err));
      this.activeUnsubscribes.push(unsubEmployees);

      // 3. Realtime listener for Sales
      const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
        const list: SalesRecord[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as SalesRecord));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(list));
          this.notifyListeners('sales');
        }
      }, (err) => console.warn('Realtime sales listener notice:', err));
      this.activeUnsubscribes.push(unsubSales);

      // 4. Realtime listener for Inventory
      const unsubInventory = onSnapshot(collection(db, 'inventory_balls'), (snapshot) => {
        const list: BallInventory[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as BallInventory));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(list));
          this.notifyListeners('inventory');
        }
      }, (err) => console.warn('Realtime inventory listener notice:', err));
      this.activeUnsubscribes.push(unsubInventory);

      // 5. Realtime listener for Attendance
      const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as AttendanceRecord));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
          this.notifyListeners('attendance');
        }
      }, (err) => console.warn('Realtime attendance listener notice:', err));
      this.activeUnsubscribes.push(unsubAttendance);

      // 6. Realtime listener for Returns
      const unsubReturns = onSnapshot(collection(db, 'returns'), (snapshot) => {
        const list: ReturnRecord[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as ReturnRecord));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(list));
          this.notifyListeners('returns');
        }
      }, (err) => console.warn('Realtime returns listener notice:', err));
      this.activeUnsubscribes.push(unsubReturns);

      // 7. Realtime listener for Ads & Coins
      const unsubAds = onSnapshot(collection(db, 'ads_coins'), (snapshot) => {
        const list: AdsCoinDeposit[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as AdsCoinDeposit));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ADS_COINS, JSON.stringify(list));
          this.notifyListeners('ads_coins');
        }
      }, (err) => console.warn('Realtime ads_coins listener notice:', err));
      this.activeUnsubscribes.push(unsubAds);

      // 8. Realtime listener for Cashflow
      const unsubCashflow = onSnapshot(collection(db, 'cashflow'), (snapshot) => {
        const list: CashflowRecord[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as CashflowRecord));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(list));
          this.notifyListeners('cashflow');
        }
      }, (err) => console.warn('Realtime cashflow listener notice:', err));
      this.activeUnsubscribes.push(unsubCashflow);

      // 9. Realtime listener for Steam & Sortir
      const unsubSteam = onSnapshot(collection(db, 'steam_sortir'), (snapshot) => {
        const list: SteamSortirRecord[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as SteamSortirRecord));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.STEAM_SORTIR, JSON.stringify(list));
          this.notifyListeners('steam_sortir');
        }
      }, (err) => console.warn('Realtime steam_sortir listener notice:', err));
      this.activeUnsubscribes.push(unsubSteam);

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

  // EMPLOYEES
  private static getAllEmployeesRaw(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let all: Employee[] = raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES;
    if (!raw) {
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
    const all: SalesRecord[] = raw ? JSON.parse(raw) : [];
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
  }

  static deleteCashflow(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
    let all: CashflowRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(all));
    this.deleteFromCloud('cashflow', id);
    this.notifyListeners('cashflow');
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
    const isOwnerTaken = stores.some(s => 
      s.id !== excludeStoreId && 
      s.ownerUsername.trim().toLowerCase().replace(/\s+/g, '') === cleanUsername
    );
    if (isOwnerTaken) return true;

    // Check across all employees in all stores
    let allEmployees: Employee[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (stored) {
        allEmployees = JSON.parse(stored);
      }
    } catch {
      allEmployees = [];
    }

    const isEmpTaken = allEmployees.some(e => 
      e.id !== excludeEmployeeId && 
      e.username.trim().toLowerCase().replace(/\s+/g, '') === cleanUsername
    );

    return isEmpTaken;
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
}
