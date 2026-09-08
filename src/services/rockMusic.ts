// Web Audio API Synthesizer for Authentic Rock Instrumental Groove
// Features: Distorted electric guitar power chords, driving bass guitar, punchy rock drum kit

type RockStyle = 'hard_rock' | 'heavy_metal' | 'grunge_punk';

export interface RockTrackInfo {
  id: RockStyle;
  name: string;
  bpm: number;
  description: string;
}

export const ROCK_TRACKS: RockTrackInfo[] = [
  {
    id: 'hard_rock',
    name: '🔥 Hard Rock Anthem',
    bpm: 124,
    description: 'Riff gitar distorsi bertenaga dengan ketukan drum rock klasik',
  },
  {
    id: 'heavy_metal',
    name: '⚡ Heavy Metal Drive',
    bpm: 138,
    description: 'Tempo cepat, double kick punchy, dan power chord agresif',
  },
  {
    id: 'grunge_punk',
    name: '🎸 Grunge Punk Energy',
    bpm: 148,
    description: 'Ketukan cepat bersemangat untuk pacu adrenalin penjualan',
  },
];

class RockMusicService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentStyle: RockStyle = 'hard_rock';
  private volume: number = 0.6; // 0 to 1
  private timerId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private distortionCurve: Float32Array | null = null;
  private listeners: Set<() => void> = new Set();
  private beatListeners: Set<(step: number) => void> = new Set();

  constructor() {
    // Load volume from local storage if available
    try {
      const savedVol = localStorage.getItem('sp_rock_volume');
      if (savedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }
      const savedStyle = localStorage.getItem('sp_rock_style') as RockStyle;
      if (savedStyle && ROCK_TRACKS.some(t => t.id === savedStyle)) {
        this.currentStyle = savedStyle;
      }
    } catch {
      // ignore
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onBeat(cb: (step: number) => void): () => void {
    this.beatListeners.add(cb);
    return () => this.beatListeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private notifyBeat(step: number) {
    this.beatListeners.forEach(cb => cb(step));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentStyle(): RockStyle {
    return this.currentStyle;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('sp_rock_volume', this.volume.toString());
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setStyle(style: RockStyle) {
    this.currentStyle = style;
    try {
      localStorage.setItem('sp_rock_style', style);
    } catch {
      // ignore
    }
    if (this.isPlaying) {
      // Reset step to match tempo smoothly
      this.currentStep = 0;
    }
    this.notify();
  }

  private getBpm(): number {
    const track = ROCK_TRACKS.find(t => t.id === this.currentStyle);
    return track ? track.bpm : 124;
  }

  // Create warm tube amplifier overdrive distortion curve
  private getDistortionCurve(): Float32Array {
    if (this.distortionCurve) return this.distortionCurve;
    const k = 45;
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.distortionCurve = curve;
    return curve;
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesis: Punchy Rock Bass Drum (Kick)
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  // Synthesis: Heavy Rock Snare Drum
  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // 1. Noise burst for snare snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(900, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.2);

    // 2. Tonal body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.1);

    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Synthesis: Rock Hi-Hat
  private playHiHat(time: number, open: boolean = false) {
    if (!this.ctx || !this.masterGain) return;

    const duration = open ? 0.3 : 0.05;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.25 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  // Synthesis: Distorted Electric Guitar Power Chord Riff
  private playGuitarChord(notes: number[], time: number, duration: number, isMuted: boolean = false) {
    if (!this.ctx || !this.masterGain) return;

    const waveShaper = this.ctx.createWaveShaper();
    waveShaper.curve = this.getDistortionCurve() as any;
    waveShaper.oversample = '4x';

    // Marshall guitar amplifier cabinet filter simulation
    const cabFilter = this.ctx.createBiquadFilter();
    cabFilter.type = 'bandpass';
    cabFilter.frequency.setValueAtTime(1600, time);
    cabFilter.Q.setValueAtTime(1.2, time);

    const chordGain = this.ctx.createGain();
    const peakVol = isMuted ? 0.18 : 0.32;
    chordGain.gain.setValueAtTime(peakVol, time);
    chordGain.gain.exponentialRampToValueAtTime(0.001, time + (isMuted ? 0.1 : duration * 0.95));

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      // Dual detuned oscillators for thick heavy rock tone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      // Stagger note pick attack slightly
      const noteTime = time + (idx * 0.008);
      osc1.frequency.setValueAtTime(freq, noteTime);
      osc2.frequency.setValueAtTime(freq * 1.006, noteTime); // subtle detune

      osc1.connect(waveShaper);
      osc2.connect(waveShaper);

      osc1.start(noteTime);
      osc2.start(noteTime);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    });

    waveShaper.connect(cabFilter);
    cabFilter.connect(chordGain);
    chordGain.connect(this.masterGain);
  }

  // Synthesis: Rock Bass Guitar
  private playBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Rock notes in Hz
  // Power Chords: Root + 5th + Octave
  private getChordFreqs(root: string): number[] {
    const chordMap: Record<string, number[]> = {
      E5: [82.41, 123.47, 164.81],   // E2, B2, E3
      G5: [98.00, 146.83, 196.00],   // G2, D3, G3
      A5: [110.00, 164.81, 220.00],  // A2, E3, A3
      C5: [130.81, 196.00, 261.63],  // C3, G3, C4
      D5: [146.83, 220.00, 293.66],  // D3, A3, D4
      F5: [87.31, 130.81, 174.61],   // F2, C3, F3
    };
    return chordMap[root] || chordMap.E5;
  }

  private getBassFreq(root: string): number {
    const bassMap: Record<string, number> = {
      E: 41.20, // E1
      G: 49.00, // G1
      A: 55.00, // A1
      C: 65.41, // C2
      D: 73.42, // D2
      F: 43.65, // F1
    };
    return bassMap[root] || 41.20;
  }

  // 16-step Rock Sequencer loop
  private scheduleNotes() {
    if (!this.ctx || !this.isPlaying) return;

    const bpm = this.getBpm();
    const secondsPerBeat = 60.0 / bpm;
    const secondsPerStep = secondsPerBeat / 4; // 16th note steps

    // Lookahead: schedule up to 0.1s in advance
    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      const step = this.currentStep % 16;
      const bar = Math.floor(this.currentStep / 16) % 4; // 4-bar rock progression
      const time = this.nextStepTime;

      // 1. Rock Drums Pattern (Standard driving 4/4 rock beat)
      // Kick: beats 1, 3, upbeat variations
      const isKick = (step === 0 || step === 8 || step === 10 || (this.currentStyle === 'heavy_metal' && (step === 2 || step === 14)));
      if (isKick) {
        this.playKick(time);
      }

      // Snare: beats 2 and 4 (step 4 and 12)
      if (step === 4 || step === 12) {
        this.playSnare(time);
      }

      // Hi-Hat: 8th notes (0, 2, 4, 6, 8, 10, 12, 14)
      if (step % 2 === 0) {
        const isOpen = (step === 14); // open hi-hat before downbeat
        this.playHiHat(time, isOpen);
      }

      // 2. Electric Guitar & Bass Progression
      // 4-Bar progression based on style
      let currentChord = 'E5';
      let currentBass = 'E';

      if (this.currentStyle === 'hard_rock') {
        // Classic Rock riff: E5 -> G5 -> A5 -> D5
        if (bar === 0) { currentChord = 'E5'; currentBass = 'E'; }
        else if (bar === 1) { currentChord = 'G5'; currentBass = 'G'; }
        else if (bar === 2) { currentChord = 'A5'; currentBass = 'A'; }
        else { currentChord = (step < 8 ? 'C5' : 'D5'); currentBass = (step < 8 ? 'C' : 'D'); }
      } else if (this.currentStyle === 'heavy_metal') {
        // Fast Metal progression: E5 -> E5 -> C5 -> D5
        if (bar === 0 || bar === 1) { currentChord = 'E5'; currentBass = 'E'; }
        else if (bar === 2) { currentChord = 'C5'; currentBass = 'C'; }
        else { currentChord = 'D5'; currentBass = 'D'; }
      } else {
        // Punk / Grunge: A5 -> C5 -> D5 -> F5
        if (bar === 0) { currentChord = 'A5'; currentBass = 'A'; }
        else if (bar === 1) { currentChord = 'C5'; currentBass = 'C'; }
        else if (bar === 2) { currentChord = 'D5'; currentBass = 'D'; }
        else { currentChord = 'F5'; currentBass = 'F'; }
      }

      // Guitar rhythm pattern
      const guitarNotes = this.getChordFreqs(currentChord);
      const isDownbeat = (step === 0 || step === 6 || step === 8 || step === 12);
      const isMuted = (step % 2 === 0 && !isDownbeat);

      if (isDownbeat) {
        this.playGuitarChord(guitarNotes, time, secondsPerStep * 2.8, false);
      } else if (isMuted) {
        this.playGuitarChord(guitarNotes, time, secondsPerStep * 0.9, true);
      }

      // Bass guitar follows with driving 8th notes
      if (step % 2 === 0) {
        this.playBass(this.getBassFreq(currentBass), time, secondsPerStep * 1.8);
      }

      // Trigger beat visualizer
      const localStep = step;
      setTimeout(() => {
        if (this.isPlaying) {
          this.notifyBeat(localStep);
        }
      }, Math.max(0, (time - this.ctx!.currentTime) * 1000));

      this.nextStepTime += secondsPerStep;
      this.currentStep++;
    }

    this.timerId = window.setTimeout(() => this.scheduleNotes(), 25);
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    this.initAudio();
    if (!this.ctx) return;

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduleNotes();
    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public stop() {
    this.pause();
    this.currentStep = 0;
  }
}

export const RockMusic = new RockMusicService();
