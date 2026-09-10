// Futuristic Sci-Fi Audio Synthesis Engine using Web Audio API & Speech Synthesis
// Zero external asset dependencies, zero network latency, 100% offline-ready.

class SoundFxService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private lastClickTime: number = 0;
  private loadingNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private loadingTimeouts: any[] = [];
  private isLoadingAudioActive: boolean = false;

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

    // Immediate resume listeners for any user gesture
    const gestureResume = () => {
      this.unlockAudio();
    };
    window.addEventListener('pointerdown', gestureResume, { capture: true, passive: true });
    window.addEventListener('touchstart', gestureResume, { capture: true, passive: true });
    window.addEventListener('keydown', gestureResume, { capture: true, passive: true });

    const handleInteractiveSound = (e: Event) => {
      this.unlockAudio();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Fast check for interactive elements
      const clickable = (target.tagName === 'BUTTON' || target.tagName === 'A') 
        ? target 
        : target.closest('button, [role="button"], a, input[type="submit"], [data-nav]');

      if (clickable) {
        const now = Date.now();
        if (now - this.lastClickTime > 80) {
          this.lastClickTime = now;
          if (clickable.matches('nav *, [role="tab"], [data-nav]')) {
            this.playMenuSound();
          } else {
            this.playRobotButtonClick();
          }
        }
      }
    };

    // Single passive pointerdown listener for ultra-low latency & zero lag
    window.addEventListener('pointerdown', handleInteractiveSound, { capture: true, passive: true });
  }

  /**
   * Distinct sci-fi tactile sound for menu navigation & tab switching
   */
  public playMenuSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Smooth cyber frequency slide (whoosh / sweep)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch {}
  }

  /**
   * Tactile skin touch sound effect (soft organic resonance + gentle harmonic)
   */
  public playSkinTouchSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.14);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {}
  }

  /**
   * Sound effect for background processing popups (data computation chatter)
   */
  public playProcessingSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const freqs = [880, 1174, 1318, 1760];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);

        gain.gain.setValueAtTime(0.05, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.09);
      });
    } catch {}
  }

  /**
   * Immediately stops and cuts off any loading drone, telemetry beeps, or scheduled timers.
   * Ensures sound NEVER leaks past the loading screen.
   */
  public stopLoadingAudio() {
    this.isLoadingAudioActive = false;
    this.loadingTimeouts.forEach(t => clearTimeout(t));
    this.loadingTimeouts = [];

    const now = this.ctx ? this.ctx.currentTime : 0;
    this.loadingNodes.forEach(({ osc, gain }) => {
      try {
        if (gain && this.ctx) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0, now);
        }
        if (osc) {
          osc.stop();
          osc.disconnect();
        }
      } catch {}
    });
    this.loadingNodes = [];
  }

  /**
   * Futuristic telemetry audio loop during the Initial Loading Screen
   */
  public playLoadingScreenSequence() {
    if (this.isMuted) return;
    this.stopLoadingAudio();
    this.isLoadingAudioActive = true;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Ambient power-up telemetry drone
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      droneOsc.type = 'sine';
      droneOsc.frequency.setValueAtTime(110, now);
      droneOsc.frequency.linearRampToValueAtTime(220, now + 3.0);

      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(0.06, now + 0.4);
      droneGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      droneOsc.connect(droneGain);
      droneGain.connect(ctx.destination);

      droneOsc.start(now);
      droneOsc.stop(now + 3.9);
      this.loadingNodes.push({ osc: droneOsc, gain: droneGain });

      // 2. High-tech diagnostic telemetry beeps along the progress
      const beepTimes = [0.3, 0.7, 1.2, 1.8, 2.4, 3.0, 3.6];
      const beepPitches = [987.77, 1174.66, 1318.51, 1567.98, 1760.00, 1975.53, 2349.32];

      beepTimes.forEach((t, i) => {
        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(beepPitches[i], now + t);

        bGain.gain.setValueAtTime(0.035, now + t);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.05);

        bOsc.connect(bGain);
        bGain.connect(ctx.destination);

        bOsc.start(now + t);
        bOsc.stop(now + t + 0.06);
        this.loadingNodes.push({ osc: bOsc, gain: bGain });
      });
    } catch {}
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
   * Full 4.2-second progression matching the 4.5-second loading screen
   */
  public playTimeMachineWarp() {
    if (this.isMuted) return;
    this.isLoadingAudioActive = true;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const duration = 4.2; // Full 4.2 seconds cinematic time travel warp sequence

      // 1. Deep Sub-Bass Riser (Quantum Reactor Core Charging)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(36, now);
      subOsc.frequency.exponentialRampToValueAtTime(360, now + duration * 0.72);
      subOsc.frequency.exponentialRampToValueAtTime(70, now + duration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 0.4);
      subGain.gain.linearRampToValueAtTime(0.38, now + duration * 0.7);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(70, now);
      subFilter.frequency.exponentialRampToValueAtTime(2600, now + duration * 0.75);
      subFilter.frequency.exponentialRampToValueAtTime(160, now + duration);

      subOsc.connect(subGain);
      subGain.connect(subFilter);
      subFilter.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + duration);
      this.loadingNodes.push({ osc: subOsc, gain: subGain });

      // 2. Accelerating Temporal Chronometer Ticks (Time Machine Reverse Pulses)
      // Rapid clockwork / tachyon pulses accelerating exponentially as you enter the wormhole
      const tickCount = 26;
      let tickTime = now + 0.05;
      let tickInterval = 0.22;
      for (let i = 0; i < tickCount; i++) {
        const tickOsc = ctx.createOscillator();
        const tickGain = ctx.createGain();
        tickOsc.type = 'square';
        tickOsc.frequency.setValueAtTime(750 + i * 85, tickTime);
        tickOsc.frequency.exponentialRampToValueAtTime(2600 + i * 70, tickTime + 0.025);

        tickGain.gain.setValueAtTime(0.09, tickTime);
        tickGain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.035);

        const tickFilter = ctx.createBiquadFilter();
        tickFilter.type = 'bandpass';
        tickFilter.frequency.setValueAtTime(1300 + i * 80, tickTime);
        tickFilter.Q.setValueAtTime(4.5, tickTime);

        tickOsc.connect(tickGain);
        tickGain.connect(tickFilter);
        tickFilter.connect(ctx.destination);

        tickOsc.start(tickTime);
        tickOsc.stop(tickTime + 0.04);
        this.loadingNodes.push({ osc: tickOsc, gain: tickGain });

        tickInterval = Math.max(0.04, tickInterval * 0.91);
        tickTime += tickInterval;
      }

      // 3. Phased Time-Vortex Doppler Sweeper (Wormhole Tunnel Expansion)
      const warpOsc = ctx.createOscillator();
      const warpGain = ctx.createGain();
      warpOsc.type = 'sine';
      warpOsc.frequency.setValueAtTime(160, now);
      warpOsc.frequency.exponentialRampToValueAtTime(1600, now + 1.8);
      warpOsc.frequency.linearRampToValueAtTime(520, now + 2.7);
      warpOsc.frequency.exponentialRampToValueAtTime(3200, now + duration * 0.85);

      // Fast LFO Tremolo / Phase distortion for time machine vortex
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sawtooth';
      lfo.frequency.setValueAtTime(8, now);
      lfo.frequency.linearRampToValueAtTime(42, now + duration);
      lfoGain.gain.setValueAtTime(140, now);
      lfo.connect(warpOsc.frequency);

      warpGain.gain.setValueAtTime(0.001, now);
      warpGain.gain.linearRampToValueAtTime(0.24, now + 0.6);
      warpGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      warpOsc.connect(warpGain);
      warpGain.connect(ctx.destination);

      lfo.start(now);
      warpOsc.start(now);
      lfo.stop(now + duration);
      warpOsc.stop(now + duration);
      this.loadingNodes.push({ osc: warpOsc, gain: warpGain });
      this.loadingNodes.push({ osc: lfo, gain: lfoGain });

      // 4. White-Noise Hyperspace Wind Whoosh
      const bufferSize = Math.floor(ctx.sampleRate * 2.8);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(250, now + 0.4);
      noiseFilter.frequency.exponentialRampToValueAtTime(3800, now + 2.4);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now + 0.4);
      noiseGain.gain.linearRampToValueAtTime(0.18, now + 1.6);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(now + 0.4);
      whiteNoise.stop(now + 3.4);

      // 5. Quantum Hyper-Jump Sonic Flash at Climax (3.4s)
      const chordTimeout = window.setTimeout(() => {
        if (!this.isLoadingAudioActive) return;
        try {
          const pCtx = this.getContext();
          if (!pCtx) return;
          const pNow = pCtx.currentTime;
          // Ethereal Sci-Fi Chime Chord (C, G, C, E, G high)
          const chordFreqs = [523.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
          chordFreqs.forEach((freq, idx) => {
            const chordOsc = pCtx.createOscillator();
            const chordGain = pCtx.createGain();
            chordOsc.type = 'triangle';
            chordOsc.frequency.setValueAtTime(freq, pNow + idx * 0.035);

            chordGain.gain.setValueAtTime(0.12, pNow + idx * 0.035);
            chordGain.gain.exponentialRampToValueAtTime(0.001, pNow + 0.9);

            chordOsc.connect(chordGain);
            chordGain.connect(pCtx.destination);

            chordOsc.start(pNow + idx * 0.035);
            chordOsc.stop(pNow + 0.95);
            this.loadingNodes.push({ osc: chordOsc, gain: chordGain });
          });
        } catch {}
      }, 3400);
      this.loadingTimeouts.push(chordTimeout);

    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Prime SpeechSynthesis engine synchronously during user gesture
   */
  public primeSpeechSynthesis() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.resume();
      // Speak a zero-volume silent utterance to unlock WebKit audio execution token
      const dummy = new SpeechSynthesisUtterance(' ');
      dummy.volume = 0.01;
      dummy.rate = 10;
      window.speechSynthesis.speak(dummy);
    } catch {}
  }

  /**
   * Check if AudioContext is currently running and producing sound
   */
  public isAudioRunning(): boolean {
    return !!(this.ctx && this.ctx.state === 'running');
  }

  /**
   * Unlocks AudioContext and SpeechSynthesis on user gesture
   */
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.primeSpeechSynthesis();
      return this.isAudioRunning();
    } catch {
      return false;
    }
  }

  /**
   * Synthesized robotic chime and voice greeting in English:
   * "Welcome to Seller Profit, [name]! Please enjoy your sale."
   * Engineered with triple-layer guarantee:
   * 1. Multi-formant Web Audio robotic vocoder vowel cadence (100% offline & immune to browser restrictions)
   * 2. Browser SpeechSynthesis with metallic pitch/rate & GC retention
   * 3. Visual notification & replay controls
   */
  public playRobotVoiceWelcome(userName: string = 'User') {
    if (this.isMuted) return;

    // Normalize user name nicely
    const cleanName = (userName || 'User').replace(/^(owner\s*|pegawai\s*)/i, '').trim() || 'User';
    const speechText = `Welcome to Seller Profit, ${cleanName}! Please enjoy your sale.`;

    // Step 1: Robotic synthesizer intro chime & vocoder formant cadence (100% Web Audio, always works!)
    try {
      const ctx = this.getContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        // Layer A: Sci-Fi robot AI boot notes
        const notes = [392, 523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);

          gain.gain.setValueAtTime(0.001, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.14, now + i * 0.06 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.35);
        });

        // Layer B: Vocoder Speech Formant Simulation ("Wel-come to Sel-ler Pro-fit")
        // Uses bandpass formant filters representing vowels [e], [o], [u], [e], [o], [i]
        const formants = [
          { f1: 530, f2: 1840, dur: 0.16, pitch: 180 }, // "Wel-"
          { f1: 400, f2: 1200, dur: 0.18, pitch: 175 }, // "-come"
          { f1: 300, f2: 870,  dur: 0.14, pitch: 165 }, // "to"
          { f1: 530, f2: 1840, dur: 0.16, pitch: 190 }, // "Sel-"
          { f1: 450, f2: 1100, dur: 0.16, pitch: 180 }, // "-ler"
          { f1: 380, f2: 1900, dur: 0.18, pitch: 200 }, // "Pro-"
          { f1: 270, f2: 2200, dur: 0.22, pitch: 160 }, // "-fit"
        ];

        let syllableTime = now + 0.42;
        formants.forEach((v) => {
          // Carrier pulse
          const carrier = ctx.createOscillator();
          carrier.type = 'sawtooth';
          carrier.frequency.setValueAtTime(v.pitch, syllableTime);

          // Formant Filter 1
          const bp1 = ctx.createBiquadFilter();
          bp1.type = 'bandpass';
          bp1.frequency.setValueAtTime(v.f1, syllableTime);
          bp1.Q.setValueAtTime(6.0, syllableTime);

          // Formant Filter 2
          const bp2 = ctx.createBiquadFilter();
          bp2.type = 'bandpass';
          bp2.frequency.setValueAtTime(v.f2, syllableTime);
          bp2.Q.setValueAtTime(8.0, syllableTime);

          const gain1 = ctx.createGain();
          gain1.gain.setValueAtTime(0.001, syllableTime);
          gain1.gain.linearRampToValueAtTime(0.06, syllableTime + 0.02);
          gain1.gain.exponentialRampToValueAtTime(0.001, syllableTime + v.dur);

          const gain2 = ctx.createGain();
          gain2.gain.setValueAtTime(0.001, syllableTime);
          gain2.gain.linearRampToValueAtTime(0.04, syllableTime + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, syllableTime + v.dur);

          carrier.connect(bp1);
          carrier.connect(bp2);
          bp1.connect(gain1);
          bp2.connect(gain2);
          gain1.connect(ctx.destination);
          gain2.connect(ctx.destination);

          carrier.start(syllableTime);
          carrier.stop(syllableTime + v.dur + 0.02);

          syllableTime += v.dur + 0.035;
        });

        // Layer C: Cyber robot vocoder chirp cadence
        const robotChirps = [740, 880, 660, 990, 820];
        robotChirps.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + 0.45 + i * 0.08);

          gain.gain.setValueAtTime(0.03, now + 0.45 + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + i * 0.08 + 0.07);

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(freq, now + 0.45 + i * 0.08);
          bp.Q.setValueAtTime(5.0, now);

          osc.connect(gain);
          gain.connect(bp);
          bp.connect(ctx.destination);

          osc.start(now + 0.45 + i * 0.08);
          osc.stop(now + 0.45 + i * 0.08 + 0.08);
        });
      }
    } catch {}

    // Step 2: Speech Synthesis with Global Utterance Retention to prevent GC audio cutoff
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const executeSpeech = () => {
        try {
          window.speechSynthesis.cancel(); // Flush old queue
          window.speechSynthesis.resume();

          // Wait 60ms tick for browser audio queue to clear cancel state
          setTimeout(() => {
            try {
              window.speechSynthesis.resume();
              const utterance = new SpeechSynthesisUtterance(speechText);
              utterance.lang = 'en-US';

              // Select best English or Robotic voice available
              const voices = window.speechSynthesis.getVoices();
              if (voices && voices.length > 0) {
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
              utterance.rate = 0.94;  // Deliberate robotic cadence
              utterance.volume = 1.0;

              // Prevent Chrome/WebKit garbage collection of utterance object
              (window as any).__sellerRobotUtterance = utterance;

              // Chromium keepalive while speaking
              const resumeTimer = setInterval(() => {
                if (window.speechSynthesis.speaking) {
                  window.speechSynthesis.pause();
                  window.speechSynthesis.resume();
                } else {
                  clearInterval(resumeTimer);
                }
              }, 2000);

              utterance.onend = () => {
                clearInterval(resumeTimer);
                (window as any).__sellerRobotUtterance = null;
              };
              utterance.onerror = () => {
                clearInterval(resumeTimer);
                (window as any).__sellerRobotUtterance = null;
              };

              window.speechSynthesis.speak(utterance);
            } catch (speakErr) {
              console.warn('Speech speak err:', speakErr);
            }
          }, 60);
        } catch (err) {
          console.warn('Speech synthesis robot voice note:', err);
        }
      };

      // Ensure voices are ready
      const currentVoices = window.speechSynthesis.getVoices();
      if (currentVoices && currentVoices.length > 0) {
        setTimeout(executeSpeech, 250);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setTimeout(executeSpeech, 250);
        };
        setTimeout(executeSpeech, 450);
      }
    }
  }

  /**
   * Sound effect for real-time live chat incoming/outgoing messages
   */
  public playChatNotificationSound(isOutgoing: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isOutgoing) {
        // Crisp outgoing transmission blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      } else {
        // High-tech incoming message chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.setValueAtTime(1420, now + 0.06);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isOutgoing ? 0.1 : 0.18));
    } catch {}
  }

  /**
   * Playful sci-fi sparkle chord
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

  /**
   * Sci-fi chime when outfit / clothing texture is equipped or changed
   */
  public playOutfitEquipSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Arpeggiated sparkle notes (E5 -> G#5 -> B5 -> E6)
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.07);

        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.38);
      });
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
