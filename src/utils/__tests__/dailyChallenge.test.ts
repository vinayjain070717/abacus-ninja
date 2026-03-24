import { describe, it, expect } from 'vitest';
import { getDailyChallenge } from '../dailyChallenge';

describe('getDailyChallenge', () => {
  it('returns a challenge with gameId and date', () => {
    const challenge = getDailyChallenge();
    expect(challenge.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof challenge.gameId).toBe('string');
    expect(challenge.gameId.length).toBeGreaterThan(0);
  });

  it('returns same challenge for same call (deterministic within day)', () => {
    const c1 = getDailyChallenge();
    const c2 = getDailyChallenge();
    expect(c1.gameId).toBe(c2.gameId);
    expect(c1.seed).toBe(c2.seed);
  });
});
