// Futuristic Sci-Fi Audio Synthesis Engine using Web Audio API & Speech Synthesis
// Zero external asset dependencies, zero network latency, 100% offline-ready.

class SoundFxService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private lastClickTime: number = 0;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Initializes global tactile robot audio for all button presses across the app
   */
  public initGlobalButtonSound() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    const handleClick = (e: MouseEvent) => {
      // Resume audio context on any user gesture
      this.getContext();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if clicked element or any parent is a button or clickable interactive element
      const clickable = target.closest('button, [role="button"], a, input[type="submit"], input[type="button"], .clickable-sound');
      if (clickable) {
        // Debounce slightly to prevent double audio on rapid clicks
        const now = Date.now();
        if (now - this.lastClickTime > 40) {
          this.lastClickTime = now;
          this.playRobotButtonClick();
        }
      }
    };

    window.addEventListener('click', handleClick, true);
  }

  /**
   * Sci-fi Robot tactile click / beep whenever any button is pressed
   */
  public playRobotButtonClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Main robotic beep oscillator
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1450, now);
      osc1.frequency.exponentialRampToValueAtTime(720, now + 0.055);

      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      // High cyber chirp transient
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2800, now);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.035);

      gain2.gain.setValueAtTime(0.06, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      // Cyber bandpass filter for mechanical robotic texture
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(3.5, now);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.06);
      osc2.stop(now + 0.04);
    } catch {
      // Non-blocking in sandboxed environments
    }
  }

  /**
   * Sound effect like entering a time machine / quantum warp drive when opening app
   */
  public playTimeMachineWarp() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const duration = 2.4; // 2.4 seconds rich warp sequence

      // 1. Deep Sub-Bass Riser (Quantum Reactor Charging)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(45, now);
      subOsc.frequency.exponentialRampToValueAtTime(380, now + duration * 0.85);
      subOsc.frequency.exponentialRampToValueAtTime(120, now + duration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.22, now + 0.4);
      subGain.gain.linearRampToValueAtTime(0.28, now + duration * 0.7);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(90, now);
      subFilter.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.8);
      subFilter.frequency.exponentialRampToValueAtTime(250, now + duration);

      subOsc.connect(subGain);
      subGain.connect(subFilter);
      subFilter.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + duration);

      // 2. Phased Time-Vortex Sweeper (Portal Opening)
      const warpOsc = ctx.createOscillator();
      const warpGain = ctx.createGain();
      warpOsc.type = 'sine';
      warpOsc.frequency.setValueAtTime(220, now);
      warpOsc.frequency.linearRampToValueAtTime(880, now + 0.9);
      warpOsc.frequency.linearRampToValueAtTime(440, now + 1.6);
      warpOsc.frequency.linearRampToValueAtTime(1760, now + duration * 0.9);

      // LFO Tremolo / Phase distortion for time machine sound
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(8, now);
      lfo.frequency.linearRampToValueAtTime(28, now + duration);
      lfoGain.gain.setValueAtTime(90, now);
      lfo.connect(warpOsc.frequency);

      warpGain.gain.setValueAtTime(0.001, now);
      warpGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
      warpGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      warpOsc.connect(warpGain);
      warpGain.connect(ctx.destination);

      lfo.start(now);
      warpOsc.start(now);
      lfo.stop(now + duration);
      warpOsc.stop(now + duration);

      // 3. Futuristic High-Energy Warp Pulse Burst at climax (1.6s)
      setTimeout(() => {
        try {
          const pCtx = this.getContext();
          if (!pCtx) return;
          const pNow = pCtx.currentTime;
          const chordFreqs = [523.25, 659.25, 783.99, 1046.50]; // C Major Sci-Fi Chord
          chordFreqs.forEach((freq, idx) => {
            const chordOsc = pCtx.createOscillator();
            const chordGain = pCtx.createGain();
            chordOsc.type = 'triangle';
            chordOsc.frequency.setValueAtTime(freq, pNow + idx * 0.05);

            chordGain.gain.setValueAtTime(0.08, pNow + idx * 0.05);
            chordGain.gain.exponentialRampToValueAtTime(0.001, pNow + 0.8);

            chordOsc.connect(chordGain);
            chordGain.connect(pCtx.destination);

            chordOsc.start(pNow + idx * 0.05);
            chordOsc.stop(pNow + 0.85);
          });
        } catch {}
      }, 1600);

    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Unlocks AudioContext and SpeechSynthesis on user gesture
   */
  public unlockAudio() {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    } catch {}
  }

  /**
   * Synthesized robotic chime and voice greeting in English:
   * "Welcome to Seller Profit, [name]! Please enjoy your sale."
   */
  public playRobotVoiceWelcome(userName: string = 'User') {
    if (this.isMuted) return;

    // Normalize user name nicely
    const cleanName = (userName || 'User').replace(/^(owner\s*|pegawai\s*)/i, '').trim() || 'User';
    const speechText = `Welcome to Seller Profit, ${cleanName}! Please enjoy your sale.`;

    // Step 1: Robotic synthesizer intro chime (Arpeggiated futuristic harmonics)
    try {
      const ctx = this.getContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);

          gain.gain.setValueAtTime(0.001, now + i * 0.07);
          gain.gain.linearRampToValueAtTime(0.12, now + i * 0.07 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.38);
        });
      }
    } catch {}

    // Step 2: Speech Synthesis with Robotic modulation parameters
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const speak = () => {
        try {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel(); // Stop any previous speech

          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = 'en-US';

          // Select best English or Robotic voice available
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            const robotVoice = voices.find(v => 
              v.name.toLowerCase().includes('robot') || 
              v.name.toLowerCase().includes('zarvox') ||
              v.name.toLowerCase().includes('google us english') ||
              v.name.toLowerCase().includes('google uk english male') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('david') ||
              (v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) ||
              v.lang.startsWith('en')
            ) || voices[0];

            if (robotVoice) {
              utterance.voice = robotVoice;
            }
          }

          utterance.pitch = 0.72; // Metallic robotic pitch
          utterance.rate = 0.92;  // Deliberate robotic cadence
          utterance.volume = 1.0;

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Speech synthesis robot voice note:', err);
        }
      };

      // If voices are already loaded, speak after short chime delay
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setTimeout(speak, 350);
      } else {
        // Wait for voices to populate
        window.speechSynthesis.onvoiceschanged = () => {
          setTimeout(speak, 350);
        };
        // Fallback timeout in case onvoiceschanged does not fire
        setTimeout(speak, 500);
      }
    }
  }

  /**
   * Sound effect when touching the 3D woman avatar on beranda
   */
  public playAvatarTouchReaction() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;

      // Cute playful sci-fi sparkle chord
      const freqs = [784, 987.77, 1174.66, 1567.98];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + idx * 0.04 + 0.12);

        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.16);
      });
    } catch {}
  }

  /**
   * Sound effect for holographic popup activation
   */
  public playHologramOpen() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Holographic laser emitter sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.22);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(5.0, now);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  /**
   * Subtle mechanical gyroscope hum for 360 degree jersey rotation
   */
  public playJerseyRotateTick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const SoundFx = new SoundFxService();
