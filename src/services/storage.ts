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
import { db, doc, setDoc, getDoc } from './firebase';

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
    adminPromoName: 'Shopee Live Cashback Ekstra 8.5%',
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
    roles: ['host', 'admin_toko'], // Rangkap role contoh
    salaryType: 'hourly',
    salaryRate: 35000, // Rp 35.000 / jam
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
    salaryRate: 120000, // Rp 120.000 / hari
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
    hppPerPcs: Math.round((6500000 + 250000 + 150000 + 100000) / 350), // Rp 20.000 / pcs
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
    hppPerPcs: Math.round((5500000 + 200000 + 150000 + 100000) / 300), // Rp 19.833 / pcs
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
    notes: 'Topup awal Shopee Ads & Koin Cashback Live',
    createdAt: new Date().toISOString(),
  }
];

export class StorageService {
  // Sync state with cloud firestore where possible
  private static async syncToCloud(collectionName: string, docId: string, data: any) {
    if (!db) return;
    try {
      await setDoc(doc(db, collectionName, docId), data, { merge: true });
    } catch (e) {
      console.warn(`Cloud sync notice for ${collectionName}: resilient local store active.`);
    }
  }

  // STORES
  static getStores(): StoreAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STORES);
    if (!raw) {
      this.saveStores([DEFAULT_STORE]);
      return [DEFAULT_STORE];
    }
    return JSON.parse(raw);
  }

  static saveStores(stores: StoreAccount[]) {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    stores.forEach(st => this.syncToCloud('stores', st.id, st));
  }

  static updateStore(updatedStore: StoreAccount) {
    const stores = this.getStores();
    const idx = stores.findIndex(s => s.id === updatedStore.id);
    if (idx !== -1) {
      stores[idx] = updatedStore;
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
  }

  static deleteStore(storeId: string) {
    const stores = this.getStores().filter(s => s.id !== storeId);
    this.saveStores(stores);
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
  static getEmployees(storeId: string): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let all: Employee[] = raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES;
    if (!raw) {
      this.saveEmployees(all);
    }
    return all.filter(e => e.storeId === storeId);
  }

  static saveEmployees(employees: Employee[]) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    employees.forEach(emp => this.syncToCloud('employees', emp.id, emp));
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
  }

  static deleteEmployee(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let all: Employee[] = raw ? JSON.parse(raw) : [];
    all = all.filter(e => e.id !== id);
    this.saveEmployees(all);
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
  }

  static deleteAttendance(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let all: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
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
  }

  static updateSale(sale: SalesRecord) {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    let all: SalesRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(s => s.id === sale.id);
    if (idx !== -1) {
      all[idx] = sale;
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
      this.syncToCloud('sales', sale.id, sale);
    }
  }

  static deleteSale(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    let all: SalesRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
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
  }

  static deleteReturn(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.RETURNS);
    let all: ReturnRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(all));
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
  }

  static deleteCashflow(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
    let all: CashflowRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(all));
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
  }

  // CALCULATIONS & BALANCES
  static calculateStock(storeId: string): { totalPcsIn: number; totalPcsSold: number; remainingStock: number } {
    const inventory = this.getInventory(storeId);
    const sales = this.getSales(storeId);
    const totalPcsIn = inventory.reduce((acc, curr) => acc + (curr.pcsCount || 0), 0);
    const totalPcsSold = sales.reduce((acc, curr) => acc + (curr.pcsSold || 0), 0);
    return {
      totalPcsIn,
      totalPcsSold,
      remainingStock: totalPcsIn - totalPcsSold,
    };
  }

  // HPP calculation factoring in modal ball + shipping + steam + sortir costs
  static calculateHPP(storeId: string): {
    totalModalBeli: number;
    totalOngkir: number;
    totalBiayaSteam: number;
    totalBiayaSortir: number;
    totalBiayaModalDanJasa: number;
    totalPcs: number;
    weightedAverageHpp: number;
  } {
    const inventory = this.getInventory(storeId);
    const steamSortirLogs = this.getSteamSortir(storeId);

    const totalModalBeli = inventory.reduce((acc, i) => acc + (i.modalPrice || 0), 0);
    const totalOngkir = inventory.reduce((acc, i) => acc + (i.shippingCost || 0), 0);
    
    // Total steam & sortir cost from inventory + logs
    const inventorySteamCost = inventory.reduce((acc, i) => acc + (i.steamCost || 0), 0);
    const inventorySortirCost = inventory.reduce((acc, i) => acc + (i.sortirCost || 0), 0);
    
    // Additional steam / sortir logs costs if any
    const logsSteamCost = steamSortirLogs
      .filter(l => l.processType === 'steam' || l.processType === 'sortir_dan_steam')
      .reduce((acc, l) => acc + (l.totalCost || 0), 0);
    const logsSortirCost = steamSortirLogs
      .filter(l => l.processType === 'sortir' || l.processType === 'sortir_dan_steam')
      .reduce((acc, l) => acc + (l.totalCost || 0), 0);

    const totalBiayaSteam = Math.max(inventorySteamCost, logsSteamCost);
    const totalBiayaSortir = Math.max(inventorySortirCost, logsSortirCost);

    const totalBiayaModalDanJasa = totalModalBeli + totalOngkir + totalBiayaSteam + totalBiayaSortir;
    const totalPcs = inventory.reduce((acc, i) => acc + (i.pcsCount || 0), 0);
    const weightedAverageHpp = totalPcs > 0 ? Math.round(totalBiayaModalDanJasa / totalPcs) : 0;

    return {
      totalModalBeli,
      totalOngkir,
      totalBiayaSteam,
      totalBiayaSortir,
      totalBiayaModalDanJasa,
      totalPcs,
      weightedAverageHpp,
    };
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
