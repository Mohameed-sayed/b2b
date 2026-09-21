// Synthesized Web Audio API sound effects for iSchool Workshop Platform
// Zero external audio files required, 100% reliable in any browser environment

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Subtle rhythmic tick for countdown timer
   */
  public playTick(isUrgent: boolean = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 440, ctx.currentTime);

      gain.gain.setValueAtTime(isUrgent ? 0.15 : 0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Juicy tactile pop sound when participant selects an option
   */
  public playPop(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Uplifting harmonic arpeggio fanfare for correct answer
   */
  public playCorrect(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Chord frequencies: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Gentle low buzzer for incorrect answer (supportive tone, not harsh)
   */
  public playBuzzer(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Energetic victory chord progression / celebratory fanfare for finale & podium
   */
  public playCelebration(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const chords = [
        [523.25, 659.25, 783.99],          // C major
        [587.33, 739.99, 880.00],          // D major
        [659.25, 830.61, 987.77],          // E major
        [783.99, 987.77, 1174.66, 1567.98] // G major triumph
      ];

      chords.forEach((chord, chordIdx) => {
        const chordStart = ctx.currentTime + chordIdx * 0.18;
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, chordStart);

          const duration = chordIdx === chords.length - 1 ? 0.8 : 0.22;
          gain.gain.setValueAtTime(0.12, chordStart);
          gain.gain.exponentialRampToValueAtTime(0.001, chordStart + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(chordStart);
          osc.stop(chordStart + duration + 0.05);
        });
      });
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Resonant gong / chime when new question round begins
   */
  public playStartChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {
      // AudioContext error handling
    }
  }
}

export const sound = new SoundEffects();
