// IndexedDB storage service for local 3D GLB/GLTF models (e.g. from Meshy AI)

const DB_NAME = 'seller_profit_meshy_db';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const ACTIVE_KEY = 'active_meshy_model';

interface StoredModel {
  id: string;
  name: string;
  buffer: ArrayBuffer;
  size: number;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export const MeshyModelStorage = {
  async saveModel(name: string, buffer: ArrayBuffer): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredModel = {
        id: ACTIVE_KEY,
        name,
        buffer,
        size: buffer.byteLength,
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async loadModel(): Promise<{ name: string; buffer: ArrayBuffer; size: number } | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(ACTIVE_KEY);
        req.onsuccess = () => {
          if (req.result && req.result.buffer) {
            resolve({
              name: req.result.name,
              buffer: req.result.buffer,
              size: req.result.size || req.result.buffer.byteLength,
            });
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  },

  async clearModel(): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(ACTIVE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  },
};
