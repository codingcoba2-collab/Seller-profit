// Centralized Global Processing Pop-up Event Service
// Triggers a sci-fi holographic processing HUD popup for all operations outside menu navigation

export interface ProcessingRequest {
  id: string;
  title: string;
  message?: string;
  durationMs?: number;
  onComplete?: () => void;
}

type Listener = (request: ProcessingRequest | null) => void;

class GlobalProcessingService {
  private listeners: Set<Listener> = new Set();
  private currentRequest: ProcessingRequest | null = null;
  private timeoutId: any = null;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentRequest);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentRequest));
  }

  /**
   * Shows a holographic processing popup with automated or manual completion
   */
  public show(options: {
    title: string;
    message?: string;
    durationMs?: number;
    onComplete?: () => void;
  }): string {
    const id = 'proc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    if (this.timeoutId) clearTimeout(this.timeoutId);

    const duration = options.durationMs ?? 1400;

    this.currentRequest = {
      id,
      title: options.title,
      message: options.message || 'Memproses sistem data & sinkronisasi...',
      durationMs: duration,
      onComplete: options.onComplete
    };

    this.notify();

    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Manually dismiss or complete a running processing request
   */
  public dismiss(id?: string) {
    if (!this.currentRequest) return;
    if (id && this.currentRequest.id !== id) return;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const callback = this.currentRequest.onComplete;
    this.currentRequest = null;
    this.notify();

    if (callback) {
      try {
        callback();
      } catch (err) {
        console.error('Processing completion callback error:', err);
      }
    }
  }

  public isProcessing(): boolean {
    return this.currentRequest !== null;
  }
}

export const ProcessingService = new GlobalProcessingService();
