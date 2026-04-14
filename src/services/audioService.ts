/**
 * Simple Audio Service using Web Audio API to synthesize game show sounds
 * to avoid external dependencies.
 */

class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playReveal() {
    // Ding sound
    this.playTone(880, 'sine', 0.5, 0.2);
    setTimeout(() => this.playTone(1109, 'sine', 0.5, 0.2), 100);
  }

  playStrike() {
    // Buzzer sound
    this.playTone(100, 'sawtooth', 0.8, 0.3);
    this.playTone(110, 'sawtooth', 0.8, 0.3);
  }

  playWin() {
    // Fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 'triangle', 0.6, 0.2), i * 150);
    });
  }

  playSwitch() {
    this.playTone(440, 'sine', 0.1, 0.1);
  }
}

export const audioService = new AudioService();
