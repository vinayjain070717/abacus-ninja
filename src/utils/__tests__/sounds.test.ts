import { describe, it, expect } from 'vitest';
import { SoundManager } from '../sounds';

describe('SoundManager', () => {
  it('does not throw when playing with sound disabled', () => {
    SoundManager.enabled = false;
    expect(() => SoundManager.play('correct')).not.toThrow();
    expect(() => SoundManager.play('wrong')).not.toThrow();
  });

  it('respects volume setting', () => {
    SoundManager.volume = 0.8;
    expect(SoundManager.volume).toBe(0.8);
    SoundManager.volume = -1;
    expect(SoundManager.volume).toBe(0);
    SoundManager.volume = 2;
    expect(SoundManager.volume).toBe(1);
  });

  it('can toggle enabled state', () => {
    SoundManager.enabled = true;
    expect(SoundManager.enabled).toBe(true);
    SoundManager.enabled = false;
    expect(SoundManager.enabled).toBe(false);
  });
});
