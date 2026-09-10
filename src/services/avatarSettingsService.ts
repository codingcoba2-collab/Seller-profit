// Avatar Studio & Multi-Device Cloud Synchronization Service
import { db, doc, setDoc, getDoc, onSnapshot, type Unsubscribe } from './firebase';

export interface AvatarStudioConfig {
  engineMode: 'meshy' | 'webgl' | 'scan';
  modelUrl: string;
  modelName: string;
  skinTone: string;
  skinToneId: string;
  hairColor: string;
  hairColorId: string;
  eyeColor: string;
  eyeColorId: string;
  jerseyColor: string;
  accentColor: string;
  shortsColor: string;
  backNumber: string;
  backName: string;
  materialFinish: 'matte' | 'satin' | 'glossy' | 'metallic';
  lightingPreset: 'stadium' | 'neon' | 'sunset' | 'showroom';
  pose: 'idle' | 'greeting' | 'celebration' | 'business';
  scale: number;
  offsetY: number;
  isCloudSynced?: boolean;
  updatedAt: number;
}

export const SKIN_TONE_PRESETS = [
  { id: 'fair', name: 'Fair Light', color: '#FFF5EE', description: 'Kulit cerah alami' },
  { id: 'warm', name: 'Warm Beige', color: '#E8BEAC', description: 'Kuning langsat natural' },
  { id: 'tan', name: 'Sunkissed Tan', color: '#C68642', description: 'Sawo matang atletis' },
  { id: 'bronze', name: 'Deep Bronze', color: '#8D5524', description: 'Eksotis gelap maskulin' },
  { id: 'chrome', name: 'Cyber Titanium', color: '#94A3B8', description: 'Metalik perak futuristik' },
  { id: 'gold', name: 'Cyber Gold', color: '#F59E0B', description: 'Android emas digital' },
];

export const HAIR_COLOR_PRESETS = [
  { id: 'black', name: 'Jet Black', color: '#16100E', description: 'Hitam pekat natural' },
  { id: 'espresso', name: 'Dark Espresso', color: '#3E2723', description: 'Cokelat tua elegan' },
  { id: 'blonde', name: 'Platinum Blonde', color: '#F3E5AB', description: 'Pirang platinum' },
  { id: 'crimson', name: 'MU Crimson Red', color: '#B91C1C', description: 'Merah khas Setan Merah' },
  { id: 'neon', name: 'Cyber Neon Cyan', color: '#06B6D4', description: 'Biru neon futuristik' },
];

export const EYE_COLOR_PRESETS = [
  { id: 'brown', name: 'Deep Obsidian', color: '#1E1B18', description: 'Cokelat pekat hangat' },
  { id: 'hazel', name: 'Warm Hazel', color: '#4D6E42', description: 'Hazel kehijauan' },
  { id: 'cyber-blue', name: 'Ice Cyber Blue', color: '#38BDF8', description: 'Biru es bercahaya' },
  { id: 'gold', name: 'Golden Amber', color: '#F59E0B', description: 'Emas bernyawa' },
];

export const JERSEY_COLOR_PRESETS = [
  { name: 'Merah MU Home', base: '#C70101', accent: '#FFFFFF', shorts: '#FFFFFF' },
  { name: 'Hitam Midnight Away', base: '#111827', accent: '#38BDF8', shorts: '#111827' },
  { name: 'Putih Retro Third', base: '#F8FAFC', accent: '#C70101', shorts: '#111827' },
  { name: 'Emas Juara', base: '#D97706', accent: '#111827', shorts: '#111827' },
  { name: 'Cyber Cyan Neon', base: '#06B6D4', accent: '#FE2C55', shorts: '#0F172A' },
  { name: 'Hijau Rumput Old Trafford', base: '#059669', accent: '#FFFFFF', shorts: '#FFFFFF' },
];

export const LIGHTING_PRESETS = [
  { id: 'stadium', name: 'Old Trafford Night', icon: 'stadium', desc: 'Sorot megah malam hari di stadion kebanggaan' },
  { id: 'neon', name: 'Cyberpunk Neon', icon: 'neon', desc: 'Sinar rim-light cyan & magenta futuristik' },
  { id: 'sunset', name: 'Golden Hour Studio', icon: 'sunset', desc: 'Cahaya hangat senja profesional & estetik' },
  { id: 'showroom', name: 'Clean Showroom', icon: 'showroom', desc: 'Terang benderang merata untuk melihat detail warna' },
];

export const POSE_PRESETS = [
  { id: 'idle', name: 'Bernapas Santai', desc: 'Siklus bernapas alami santai' },
  { id: 'greeting', name: 'Menyapa Ramah', desc: 'Gerakan menyambut hangat pengunjung toko' },
  { id: 'celebration', name: 'Selebrasi Juara', desc: 'Pose kemenangan merayakan rekor omset tercapai' },
  { id: 'business', name: 'Siaga Bisnis', desc: 'Pose mantap profesional siap closing penjualan' },
];

export const DEFAULT_AVATAR_CONFIG: AvatarStudioConfig = {
  engineMode: 'meshy', // Default to 3D Meshy Model so anyone opening on other phones immediately sees the 3D mesh!
  modelUrl: '/meshy_mu_athlete.glb',
  modelName: 'Meshy 3D Athlete Pro (Official MU)',
  skinTone: '#FFF5EE',
  skinToneId: 'fair',
  hairColor: '#16100E',
  hairColorId: 'black',
  eyeColor: '#38BDF8',
  eyeColorId: 'cyber-blue',
  jerseyColor: '#C70101',
  accentColor: '#FFFFFF',
  shortsColor: '#FFFFFF',
  backNumber: '7',
  backName: 'SELLER PROFIT',
  materialFinish: 'satin',
  lightingPreset: 'stadium',
  pose: 'idle',
  scale: 1.0,
  offsetY: 0.0,
  isCloudSynced: true,
  updatedAt: Date.now(),
};

const LOCAL_STORAGE_KEY = 'seller_profit_avatar_studio_v5';

export const AvatarSettingsService = {
  /**
   * Retrieves active config with synchronous fallback to localStorage / defaults
   */
  getConfig(): AvatarStudioConfig {
    if (typeof window === 'undefined') return { ...DEFAULT_AVATAR_CONFIG };
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(cached) };
      }
    } catch {}
    return { ...DEFAULT_AVATAR_CONFIG };
  },

  /**
   * Saves config to local storage
   */
  saveToLocal(config: AvatarStudioConfig) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    } catch {}
  },

  /**
   * Saves config to Firebase Firestore so ALL OTHER DEVICES immediately receive it
   */
  async saveToCloud(config: AvatarStudioConfig): Promise<boolean> {
    const updated: AvatarStudioConfig = {
      ...config,
      isCloudSynced: true,
      updatedAt: Date.now(),
    };
    this.saveToLocal(updated);

    if (!db) {
      console.info('Firebase not initialized; saved to local persistence.');
      return true;
    }

    try {
      const docRef = doc(db, 'system_settings', 'avatar_studio');
      await setDoc(docRef, updated, { merge: true });
      return true;
    } catch (err) {
      console.warn('Failed to sync avatar settings to Firestore:', err);
      return false;
    }
  },

  /**
   * Subscribes to realtime updates from Firestore so any change made on one device
   * is instantly broadcasted and rendered on all other devices/phones!
   */
  subscribeToCloud(callback: (config: AvatarStudioConfig) => void): Unsubscribe | null {
    if (!db) return null;
    try {
      const docRef = doc(db, 'system_settings', 'avatar_studio');
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<AvatarStudioConfig>;
            const merged: AvatarStudioConfig = {
              ...DEFAULT_AVATAR_CONFIG,
              ...data,
              isCloudSynced: true,
            };
            this.saveToLocal(merged);
            callback(merged);
          }
        },
        (err) => {
          console.warn('Realtime avatar subscription warning:', err);
        }
      );
    } catch (err) {
      console.warn('Error subscribing to avatar cloud config:', err);
      return null;
    }
  },

  /**
   * Fetches latest config from Firestore once
   */
  async fetchFromCloud(): Promise<AvatarStudioConfig> {
    if (!db) return this.getConfig();
    try {
      const docRef = doc(db, 'system_settings', 'avatar_studio');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<AvatarStudioConfig>;
        const merged: AvatarStudioConfig = {
          ...DEFAULT_AVATAR_CONFIG,
          ...data,
          isCloudSynced: true,
        };
        this.saveToLocal(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Could not fetch cloud avatar config:', err);
    }
    return this.getConfig();
  },
};
