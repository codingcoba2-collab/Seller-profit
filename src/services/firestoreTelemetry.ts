import { db, collection, getCountFromServer, getDocs } from './firebase';

export interface FirestoreOperationLog {
  id: string;
  timestamp: number;
  type: 'read' | 'write' | 'delete' | 'scan';
  collection: string;
  count: number;
  description: string;
}

export interface CollectionStat {
  name: string;
  label: string;
  count: number;
  estimatedBytes: number;
  averageDocBytes: number;
}

export interface FirestoreUsageSummary {
  date: string;
  // Daily Quotas
  readsToday: number;
  maxDailyReads: number;
  readPercentage: number;
  
  writesToday: number;
  maxDailyWrites: number;
  writePercentage: number;
  
  deletesToday: number;
  
  // Storage Quota
  totalDocuments: number;
  totalStorageBytes: number;
  totalStorageKB: number;
  totalStorageMB: number;
  maxStorageKB: number; // 1 GB = 1.048.576 KB
  storagePercentage: number;
  
  // Breakdown
  collections: CollectionStat[];
  lastScanTimestamp: number;
  isScanning?: boolean;
}

const STORAGE_KEY_USAGE = 'seller_profit_firestore_telemetry_v1';
const STORAGE_KEY_LOGS = 'seller_profit_firestore_logs_v1';

// Spark Free Tier Limits
export const FIRESTORE_LIMITS = {
  DAILY_READS: 50000,
  DAILY_WRITES: 20000,
  DAILY_DELETES: 20000,
  MAX_STORAGE_KB: 1024 * 1024, // 1 GB in KB
  MAX_STORAGE_BYTES: 1024 * 1024 * 1024, // 1 GB
};

// Collection definitions with metadata and average document size
export const MONITORED_COLLECTIONS: { name: string; label: string; avgBytes: number }[] = [
  { name: 'sales', label: 'Transaksi Penjualan (Live & Reguler)', avgBytes: 950 },
  { name: 'inventory_balls', label: 'Modal Stok & HPP (Ball/Seri)', avgBytes: 850 },
  { name: 'cashflow', label: 'Arus Kas Operasional Toko', avgBytes: 700 },
  { name: 'attendance', label: 'Presensi & Kehadiran Shift', avgBytes: 600 },
  { name: 'employees', label: 'Pegawai, Role & Konfigurasi Insentif', avgBytes: 1500 },
  { name: 'stores', label: 'Akun Toko & Pengaturan Biaya Admin', avgBytes: 2100 },
  { name: 'returns', label: 'Data Retur & Paket Dibatalkan', avgBytes: 650 },
  { name: 'steam_sortir', label: 'QC, Steam & Sortir Finishing', avgBytes: 800 },
  { name: 'ads_coins', label: 'Deposit Saldo Iklan & Koin Live', avgBytes: 550 },
  { name: 'announcements', label: 'Pengumuman Penting (Live Info)', avgBytes: 600 },
  { name: 'chat_messages', label: 'Obrolan Tim Live Chat', avgBytes: 400 },
];

type TelemetryListener = (summary: FirestoreUsageSummary) => void;

export class FirestoreTelemetry {
  private static listeners: Set<TelemetryListener> = new Set();
  private static cachedSummary: FirestoreUsageSummary | null = null;

  private static getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private static initOrGetDailyState(): {
    date: string;
    readsToday: number;
    writesToday: number;
    deletesToday: number;
    lastScanTimestamp: number;
    collections: CollectionStat[];
  } {
    const today = this.getTodayStr();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          return parsed;
        } else {
          // Reset daily counters on date change while preserving collections snapshot
          return {
            date: today,
            readsToday: 0,
            writesToday: 0,
            deletesToday: 0,
            lastScanTimestamp: parsed.lastScanTimestamp || Date.now(),
            collections: parsed.collections || [],
          };
        }
      }
    } catch {}

    return {
      date: today,
      readsToday: 0,
      writesToday: 0,
      deletesToday: 0,
      lastScanTimestamp: 0,
      collections: [],
    };
  }

  private static saveState(state: any): void {
    try {
      localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(state));
    } catch {}
    this.notifySubscribers();
  }

  public static getSummary(): FirestoreUsageSummary {
    const state = this.initOrGetDailyState();
    
    // Calculate storage from collections
    let totalDocs = 0;
    let totalBytes = 0;

    const collections: CollectionStat[] = MONITORED_COLLECTIONS.map(mc => {
      const existing = (state.collections || []).find((c: any) => c.name === mc.name);
      const count = existing ? existing.count : 0;
      const estimatedBytes = count * mc.avgBytes;
      totalDocs += count;
      totalBytes += estimatedBytes;
      return {
        name: mc.name,
        label: mc.label,
        count,
        estimatedBytes,
        averageDocBytes: mc.avgBytes,
      };
    });

    const totalStorageKB = Math.round(totalBytes / 1024);
    const totalStorageMB = Number((totalBytes / (1024 * 1024)).toFixed(3));
    const storagePercentage = Number(((totalStorageKB / FIRESTORE_LIMITS.MAX_STORAGE_KB) * 100).toFixed(4));
    
    const readPercentage = Number(((state.readsToday / FIRESTORE_LIMITS.DAILY_READS) * 100).toFixed(2));
    const writePercentage = Number(((state.writesToday / FIRESTORE_LIMITS.DAILY_WRITES) * 100).toFixed(2));

    const summary: FirestoreUsageSummary = {
      date: state.date,
      readsToday: state.readsToday,
      maxDailyReads: FIRESTORE_LIMITS.DAILY_READS,
      readPercentage,
      writesToday: state.writesToday,
      maxDailyWrites: FIRESTORE_LIMITS.DAILY_WRITES,
      writePercentage,
      deletesToday: state.deletesToday,
      totalDocuments: totalDocs,
      totalStorageBytes: totalBytes,
      totalStorageKB,
      totalStorageMB,
      maxStorageKB: FIRESTORE_LIMITS.MAX_STORAGE_KB,
      storagePercentage,
      collections,
      lastScanTimestamp: state.lastScanTimestamp,
    };

    this.cachedSummary = summary;
    return summary;
  }

  /**
   * Record Firestore document read operations
   */
  public static recordReads(count: number, collectionName: string, description: string = 'Query Firestore'): void {
    if (count <= 0) return;
    const state = this.initOrGetDailyState();
    state.readsToday += count;
    this.saveState(state);
    this.addLog('read', collectionName, count, description);
  }

  /**
   * Record Firestore document write operations
   */
  public static recordWrites(count: number, collectionName: string, description: string = 'Simpan/Update Firestore'): void {
    if (count <= 0) return;
    const state = this.initOrGetDailyState();
    state.writesToday += count;
    this.saveState(state);
    this.addLog('write', collectionName, count, description);
  }

  /**
   * Record Firestore document delete operations
   */
  public static recordDeletes(count: number, collectionName: string, description: string = 'Hapus Dokumen Firestore'): void {
    if (count <= 0) return;
    const state = this.initOrGetDailyState();
    state.deletesToday += count;
    this.saveState(state);
    this.addLog('delete', collectionName, count, description);
  }

  /**
   * Real-time scan of actual documents in Firestore Cloud database
   * using getCountFromServer (1 read operation per up to 1000 docs)
   */
  public static async scanDatabase(): Promise<FirestoreUsageSummary> {
    const state = this.initOrGetDailyState();
    const updatedCollections: CollectionStat[] = [];
    let totalDocsScanned = 0;

    if (db) {
      for (const mc of MONITORED_COLLECTIONS) {
        try {
          const colRef = collection(db, mc.name);
          // High-efficiency aggregation query: uses 1 read per 1000 index items
          const countSnap = await getCountFromServer(colRef);
          const count = countSnap.data().count;
          totalDocsScanned += count;
          updatedCollections.push({
            name: mc.name,
            label: mc.label,
            count,
            estimatedBytes: count * mc.avgBytes,
            averageDocBytes: mc.avgBytes,
          });
          // 1 aggregation read operation recorded per collection
          state.readsToday += 1;
        } catch (err) {
          // Fallback to reading collection snapshot or keeping current
          try {
            const colRef = collection(db, mc.name);
            const snap = await getDocs(colRef);
            const count = snap.size;
            totalDocsScanned += count;
            updatedCollections.push({
              name: mc.name,
              label: mc.label,
              count,
              estimatedBytes: count * mc.avgBytes,
              averageDocBytes: mc.avgBytes,
            });
            state.readsToday += count;
          } catch {
            const existing = (state.collections || []).find((c: any) => c.name === mc.name);
            updatedCollections.push(existing || {
              name: mc.name,
              label: mc.label,
              count: 0,
              estimatedBytes: 0,
              averageDocBytes: mc.avgBytes,
            });
          }
        }
      }
    } else {
      // Offline fallback: read from local cache keys
      for (const mc of MONITORED_COLLECTIONS) {
        let count = 0;
        try {
          const keyMap: Record<string, string> = {
            sales: 'shopee_lr_sales',
            inventory_balls: 'shopee_lr_inventory',
            cashflow: 'shopee_lr_cashflow',
            attendance: 'shopee_lr_attendance',
            employees: 'shopee_lr_employees',
            stores: 'shopee_lr_stores',
            returns: 'shopee_lr_returns',
            steam_sortir: 'shopee_lr_steamsortir',
            ads_coins: 'shopee_lr_adscoins',
            announcements: 'seller_profit_announcements',
          };
          const storageKey = keyMap[mc.name];
          if (storageKey) {
            const localData = localStorage.getItem(storageKey);
            if (localData) {
              const arr = JSON.parse(localData);
              if (Array.isArray(arr)) count = arr.length;
            }
          }
        } catch {}
        updatedCollections.push({
          name: mc.name,
          label: mc.label,
          count,
          estimatedBytes: count * mc.avgBytes,
          averageDocBytes: mc.avgBytes,
        });
      }
    }

    state.collections = updatedCollections;
    state.lastScanTimestamp = Date.now();
    this.saveState(state);
    this.addLog('scan', 'Semua Koleksi', totalDocsScanned, 'Pindai realtime kapasitas Cloud Firestore');

    return this.getSummary();
  }

  /**
   * Reset daily telemetry counters (for developer testing & simulation)
   */
  public static resetDailyUsage(): void {
    const state = this.initOrGetDailyState();
    state.readsToday = 0;
    state.writesToday = 0;
    state.deletesToday = 0;
    this.saveState(state);
    this.addLog('scan', 'Sistem', 0, 'Reset meter penggunaan harian');
  }

  /**
   * Operation logs
   */
  private static addLog(type: 'read' | 'write' | 'delete' | 'scan', collection: string, count: number, description: string): void {
    try {
      const logs = this.getLogs();
      const newLog: FirestoreOperationLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        type,
        collection,
        count,
        description,
      };
      // Keep maximum 40 recent logs
      const updated = [newLog, ...logs].slice(0, 40);
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    } catch {}
  }

  public static getLogs(): FirestoreOperationLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public static clearLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch {}
    this.notifySubscribers();
  }

  /**
   * Event subscribe
   */
  public static subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    // Emit initial
    listener(this.getSummary());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifySubscribers(): void {
    const summary = this.getSummary();
    this.listeners.forEach(cb => {
      try {
        cb(summary);
      } catch {}
    });
  }
}
