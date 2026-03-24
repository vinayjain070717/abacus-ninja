import { APP_CONFIG } from '../config/appConfig';

type SoundName = 'correct' | 'wrong' | 'tick' | 'complete' | 'click';

class SoundManagerClass {
  private ctx: AudioContext | null = null;
  private _enabled: boolean = APP_CONFIG.sounds.enabled;
  private _volume: number = APP_CONFIG.sounds.volume;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) { this.ctx = new AC(); return this.ctx; }
    } catch { /* silent */ }
    return null;
  }

  get enabled() { return this._enabled; }
  set enabled(v: boolean) { this._enabled = v; }
  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }

  play(name: SoundName) {
    if (!this._enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const tone = APP_CONFIG.sounds.tones[name];
      if (!tone) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type;
      osc.frequency.value = tone.frequency;
      gain.gain.value = this._volume * 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.duration / 1000);
      osc.stop(ctx.currentTime + tone.duration / 1000 + 0.05);
    } catch { /* swallow audio errors */ }
  }
}

export const SoundManager = new SoundManagerClass();
