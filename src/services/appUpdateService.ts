type UpdateListener = (state: AppUpdateState) => void;

export interface AppUpdateState {
  hasUpdate: boolean;
  isChecking: boolean;
  isApplying: boolean;
  dismissed: boolean;
  currentBuildId: string;
  currentBuiltAt: string;
  remoteBuildId: string | null;
  remoteBuiltAt: string | null;
  lastCheckedAt: number | null;
  source: 'sw' | 'version' | null;
}

const safeCurrentBuildId =
  typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const safeCurrentBuiltAt =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : '';

class AppUpdateServiceClass {
  private state: AppUpdateState = {
    hasUpdate: false,
    isChecking: false,
    isApplying: false,
    dismissed: false,
    currentBuildId: safeCurrentBuildId,
    currentBuiltAt: safeCurrentBuiltAt,
    remoteBuildId: null,
    remoteBuiltAt: null,
    lastCheckedAt: null,
    source: null,
  };

  private listeners = new Set<UpdateListener>();
  private swRegistration: ServiceWorkerRegistration | null = null;
  private updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
  private pollingStarted = false;
  private pollIntervalId: number | null = null;
  private lastCheckTimestamp = 0;

  subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AppUpdateState {
    return { ...this.state };
  }

  private emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch {
        // Ignore subscriber error
      }
    });
  }

  setUpdateSW(fn: (reloadPage?: boolean) => Promise<void>) {
    this.updateSWFn = fn;
  }

  setRegistration(reg: ServiceWorkerRegistration | undefined) {
    if (reg) {
      this.swRegistration = reg;
    }
  }

  markUpdateAvailable(source: 'sw' | 'version', remoteBuildId?: string, remoteBuiltAt?: string) {
    const isNewerRemote =
      Boolean(remoteBuildId) && remoteBuildId !== this.state.remoteBuildId;

    this.state = {
      ...this.state,
      hasUpdate: true,
      dismissed: isNewerRemote ? false : this.state.dismissed,
      remoteBuildId: remoteBuildId || this.state.remoteBuildId,
      remoteBuiltAt: remoteBuiltAt || this.state.remoteBuiltAt,
      source: this.state.source || source,
    };
    this.emit();
  }

  dismissPrompt() {
    this.state = {
      ...this.state,
      dismissed: true,
    };
    this.emit();
  }

  async checkForUpdates(force: boolean = false): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

    const now = Date.now();
    // Throttle automatic checks to at most once every 5 seconds unless forced
    if (!force && now - this.lastCheckTimestamp < 5000) {
      return this.state.hasUpdate;
    }
    this.lastCheckTimestamp = now;

    this.state = { ...this.state, isChecking: true };
    this.emit();

    let foundUpdate = this.state.hasUpdate;

    try {
      // 1. Trigger Service Worker byte-check update if registered
      if ('serviceWorker' in navigator) {
        const reg =
          this.swRegistration ||
          (await navigator.serviceWorker.getRegistration().catch(() => undefined));
        if (reg) {
          this.swRegistration = reg;
          if (reg.waiting) {
            foundUpdate = true;
            this.markUpdateAvailable('sw');
          }
          await Promise.race([
            reg.update().catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ]);
          if (reg.waiting) {
            foundUpdate = true;
            this.markUpdateAvailable('sw');
          }
        }
      }

      // 2. Fetch fresh /version.json bypassing every HTTP & SW cache
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const remoteId = data?.buildId ? String(data.buildId) : null;
          const remoteTime = data?.builtAt ? String(data.builtAt) : null;

          if (
            remoteId &&
            this.state.currentBuildId !== 'dev' &&
            remoteId !== this.state.currentBuildId
          ) {
            foundUpdate = true;
            this.markUpdateAvailable('version', remoteId, remoteTime || undefined);
          }
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch {
      // Silent fail on transient network error
    } finally {
      this.state = {
        ...this.state,
        isChecking: false,
        lastCheckedAt: Date.now(),
      };
      this.emit();
    }

    return foundUpdate;
  }

  async applyInstantUpdate(isHardReset: boolean = false): Promise<void> {
    if (this.state.isApplying) return;

    this.state = {
      ...this.state,
      isApplying: true,
    };
    this.emit();

    const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
      ]);

    try {
      // 1. Delete all CacheStorage caches so stale index.html / assets are wiped
      if (typeof window !== 'undefined' && 'caches' in window) {
        await withTimeout(
          (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)));
          })(),
          1200,
          undefined
        );
      }

      // 2. Activate waiting SW or unregister on hard reset
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        await withTimeout(
          (async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
              try {
                if (isHardReset) {
                  await reg.unregister();
                } else {
                  if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                  await reg.update().catch(() => {});
                }
              } catch {
                // Ignore SW error
              }
            }
          })(),
          1200,
          undefined
        );
      }

      if (!isHardReset && this.updateSWFn) {
        await withTimeout(this.updateSWFn(false).catch(() => {}), 800, undefined);
      }

      // 3. Clear sessionStorage safely (NEVER touch localStorage user data / auth)
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      } catch {
        // Ignore
      }
    } finally {
      // 4. Hard cache-busting navigation so browser loads fresh index.html immediately
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_appv', Date.now().toString());
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    }
  }

  startAutoPolling() {
    if (this.pollingStarted || typeof window === 'undefined') return;
    this.pollingStarted = true;

    // Initial check shortly after boot
    window.setTimeout(() => {
      this.checkForUpdates(false);
    }, 1500);

    // Frequent check every 15 seconds while tab is active
    this.pollIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates(false);
      }
    }, 15000);

    // Check immediately when returning to app / regaining focus / reconnecting
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates(false);
      }
    });
    window.addEventListener('focus', () => {
      this.checkForUpdates(false);
    });
    window.addEventListener('online', () => {
      this.checkForUpdates(true);
    });
  }

  stopAutoPolling() {
    if (this.pollIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    this.pollingStarted = false;
  }
}

export const appUpdateService = new AppUpdateServiceClass();
