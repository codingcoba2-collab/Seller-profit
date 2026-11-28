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
    listener(this.isOnline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
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

    // Optimistically reflect browser online state immediately, then verify
    if (!this.isOnline) {
      this.isOnline = true;
      this.notify();
    }
    await this.checkConnection();
  }

  private async probeEndpoint(url: string, timeoutMs: number): Promise<'ok' | 'abort' | 'network_error'> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      // Any reachable HTTP response (< 500, including 200/304/404) proves network transit succeeded
      return res.status > 0 && res.status < 500 ? 'ok' : 'network_error';
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        return 'abort';
      }
      return 'network_error';
    }
  }

  public async checkConnection(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (this.isOnline !== false) {
        this.isOnline = false;
        this.notify();
      }
      return false;
    }

    if (this.checkPromise) {
      return this.checkPromise;
    }

    this.checkPromise = (async () => {
      try {
        const ts = Date.now();
        // Probe static/runtime endpoints available across Vite dev, Node server, and Vercel
        const primary = await this.probeEndpoint(`/version.json?_net=${ts}`, 4000);
        if (primary === 'ok') {
          if (this.isOnline !== true) {
            this.isOnline = true;
            this.notify();
          }
          return true;
        }

        const fallback = await this.probeEndpoint(`/index.html?_net=${ts}`, 4000);
        if (fallback === 'ok') {
          if (this.isOnline !== true) {
            this.isOnline = true;
            this.notify();
          }
          return true;
        }

        // On slow networks (AbortError) or browser online status, avoid false offline lock
        const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
        const resolved =
          primary === 'abort' || fallback === 'abort' ? browserOnline : false;

        if (this.isOnline !== resolved) {
          this.isOnline = resolved;
          this.notify();
        }
        return resolved;
      } finally {
        this.checkPromise = null;
      }
    })();

    return this.checkPromise;
  }
}

export const networkService = NetworkService.getInstance();
