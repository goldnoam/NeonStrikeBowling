
class SoundManager {
  private ctx: AudioContext | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPowerUp() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playExpire() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playHit() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playPinCollision() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  toggleMusic(state: boolean) {
    this.init();
    if (!this.ctx) return;

    if (state && !this.isMusicPlaying) {
      this.musicOsc = this.ctx.createOscillator();
      this.musicGain = this.ctx.createGain();
      this.musicOsc.type = 'sine';
      this.musicOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
      
      // Add a slight drone modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(this.musicOsc.frequency);
      lfo.start();

      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);
      this.musicOsc.connect(this.musicGain);
      this.musicGain.connect(this.ctx.destination);
      this.musicOsc.start();
      this.isMusicPlaying = true;
    } else if (!state && this.isMusicPlaying) {
      if (this.musicGain) {
        this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        const ref = this.musicOsc;
        setTimeout(() => {
          try { ref?.stop(); } catch(e) {}
          this.isMusicPlaying = false;
        }, 500);
      }
    }
  }
}

export const soundManager = new SoundManager();
