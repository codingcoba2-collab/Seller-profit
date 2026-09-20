type NetworkListener = (isOnline: boolean) => void;

class NetworkService {
  private static instance: NetworkService;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<NetworkListener> = new Set();
  private checkPromise: Promise<boolean> | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));
      // Initial active check
      this.checkConnection();
    }
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.isOnline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.isOnline);
      } catch (err) {
        console.error('Error in network listener:', err);
      }
    });
  }

  private async handleStatusChange(browserReportedOnline: boolean) {
    if (!browserReportedOnline) {
      this.isOnline = false;
      this.notify();
      return;
    }

    // When browser says online, actively ping the health endpoint to confirm real internet transit
    const verified = await this.checkConnection();
    this.isOnline = verified;
    this.notify();
  }

  public async checkConnection(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline = false;
      this.notify();
      return false;
    }

    if (this.checkPromise) {
      return this.checkPromise;
    }

    this.checkPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // Ping local endpoint or fallback timestamp
        const res = await fetch(`/api/health?t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const ok = res.status >= 200 && res.status < 400;
        const prev = this.isOnline;
        this.isOnline = ok;
        if (prev !== ok) {
          this.notify();
        }
        return ok;
      } catch (e) {
        // If fetch aborted or failed, we are disconnected
        const prev = this.isOnline;
        this.isOnline = false;
        if (prev !== false) {
          this.notify();
        }
        return false;
      } finally {
        this.checkPromise = null;
      }
    })();

    return this.checkPromise;
  }
}

export const networkService = NetworkService.getInstance();
