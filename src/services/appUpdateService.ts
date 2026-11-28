type UpdateListener = (state: AppUpdateState) => void;

export interface AppUpdateState {
  hasUpdate: boolean;
  justUpdated: boolean;
  isChecking: boolean;
  isApplying: boolean;
  dismissed: boolean;
  currentBuildId: string;
  currentBuiltAt: string;
  remoteBuildId: string | null;
  remoteBuiltAt: string | null;
  lastCheckedAt: number | null;
  source: 'sw' | 'version' | 'html' | null;
}

const LAST_BUILD_STORAGE_KEY = 'sp_last_build_id';

const safeCurrentBuildId =
  typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const safeCurrentBuiltAt =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : '';

function detectJustUpdatedOnBoot(): boolean {
  if (typeof window === 'undefined' || safeCurrentBuildId === 'dev') return false;
  try {
    const prev = window.localStorage.getItem(LAST_BUILD_STORAGE_KEY);
    window.localStorage.setItem(LAST_BUILD_STORAGE_KEY, safeCurrentBuildId);
    return Boolean(prev && prev !== safeCurrentBuildId);
  } catch {
    return false;
  }
}

function getCurrentMainAssetSrc(): string | null {
  if (typeof document === 'undefined') return null;
  const scripts = Array.from(document.querySelectorAll('script[type="module"][src]'));
  const entryScript = scripts.find((s) => {
    const src = s.getAttribute('src') || '';
    return src.includes('/assets/index-');
  });
  return entryScript?.getAttribute('src') || null;
}

class AppUpdateServiceClass {
  private state: AppUpdateState = {
    hasUpdate: false,
    justUpdated: detectJustUpdatedOnBoot(),
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

  markUpdateAvailable(
    source: 'sw' | 'version' | 'html',
    remoteBuildId?: string,
    remoteBuiltAt?: string
  ) {
    const isNewerRemote =
      Boolean(remoteBuildId) && remoteBuildId !== this.state.remoteBuildId;

    this.state = {
      ...this.state,
      hasUpdate: true,
      justUpdated: false,
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

  dismissJustUpdated() {
    if (!this.state.justUpdated) return;
    this.state = {
      ...this.state,
      justUpdated: false,
    };
    this.emit();
  }

  async checkForUpdates(force: boolean = false): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

    const now = Date.now();
    // Throttle automatic checks to at most once every 2 seconds unless forced
    if (!force && now - this.lastCheckTimestamp < 2000) {
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
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);
          if (reg.waiting || reg.installing) {
            foundUpdate = true;
            this.markUpdateAvailable('sw');
          }
        }
      }

      // 2. Fetch fresh /version.json bypassing every HTTP, CDN & SW cache
      const versionController = new AbortController();
      const versionTimeout = window.setTimeout(() => versionController.abort(), 3000);
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          signal: versionController.signal,
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json') || contentType.includes('text/plain')) {
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
        }
      } catch {
        // Fallback to HTML check below
      } finally {
        window.clearTimeout(versionTimeout);
      }

      // 3. Dual-verification against fresh /index.html (meta build-id & hashed asset bundle)
      if (!foundUpdate && this.state.currentBuildId !== 'dev') {
        const htmlController = new AbortController();
        const htmlTimeout = window.setTimeout(() => htmlController.abort(), 3000);
        try {
          const htmlRes = await fetch(`/index.html?_t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
            signal: htmlController.signal,
          });

          if (htmlRes.ok) {
            const htmlText = await htmlRes.text();
            const metaMatch = htmlText.match(
              /<meta\s+name=["']app-build-id["']\s+content=["']([^"']+)["']/i
            );
            const remoteHtmlBuildId = metaMatch?.[1];
            if (remoteHtmlBuildId && remoteHtmlBuildId !== this.state.currentBuildId) {
              foundUpdate = true;
              this.markUpdateAvailable('html', remoteHtmlBuildId);
            } else {
              const currentAsset = getCurrentMainAssetSrc();
              const scriptMatch = htmlText.match(/src=["'](\/assets\/index-[^"']+\.js)["']/i);
              const remoteAsset = scriptMatch?.[1];
              if (currentAsset && remoteAsset && currentAsset !== remoteAsset) {
                foundUpdate = true;
                this.markUpdateAvailable('html');
              }
            }
          }
        } catch {
          // Ignore transient network error
        } finally {
          window.clearTimeout(htmlTimeout);
        }
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

  async applyInstantUpdate(isHardReset: boolean = true): Promise<void> {
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

      // 2. Unregister existing SWs cleanly so browser fetches 100% fresh index.html on reload
      //    (fresh SW will auto-register immediately after reload in main.tsx)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        await withTimeout(
          (async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
              try {
                if (isHardReset || this.state.source === 'version' || this.state.source === 'html') {
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
        await withTimeout(this.updateSWFn(false).catch(() => {}), 600, undefined);
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

    // Immediate check on boot (300ms)
    window.setTimeout(() => {
      this.checkForUpdates(true);
    }, 300);

    // Frequent check every 4 seconds while tab is active so GitHub deploys are caught in seconds
    this.pollIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates(false);
      }
    }, 4000);

    // Check immediately when returning to app / regaining focus / reconnecting
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates(true);
      }
    });
    window.addEventListener('focus', () => {
      this.checkForUpdates(true);
    });
    window.addEventListener('pageshow', () => {
      this.checkForUpdates(true);
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
