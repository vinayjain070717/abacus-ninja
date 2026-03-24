import { describe, it, expect } from 'vitest';
import { calculatePercentage, formatTime, shouldLevelUp, getGrade } from '../scoring';

describe('calculatePercentage', () => {
  it('returns 0 when total is 0', () => {
    expect(calculatePercentage(5, 0)).toBe(0);
  });

  it('returns 100 for perfect score', () => {
    expect(calculatePercentage(10, 10)).toBe(100);
  });

  it('returns 0 for zero correct', () => {
    expect(calculatePercentage(0, 10)).toBe(0);
  });

  it('rounds correctly', () => {
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(2, 3)).toBe(67);
  });

  it('handles large numbers', () => {
    expect(calculatePercentage(850, 1000)).toBe(85);
  });
});

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats seconds only', () => {
    expect(formatTime(45)).toBe('00:45');
  });

  it('formats exact minute', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('formats large values', () => {
    expect(formatTime(3661)).toBe('61:01');
  });

  it('pads single digits', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });
});

describe('shouldLevelUp', () => {
  it('returns false below 85', () => {
    expect(shouldLevelUp(84)).toBe(false);
    expect(shouldLevelUp(0)).toBe(false);
    expect(shouldLevelUp(50)).toBe(false);
  });

  it('returns true at exactly 85', () => {
    expect(shouldLevelUp(85)).toBe(true);
  });

  it('returns true above 85', () => {
    expect(shouldLevelUp(86)).toBe(true);
    expect(shouldLevelUp(100)).toBe(true);
  });
});

describe('getGrade', () => {
  it('returns Excellent for >= 95', () => {
    expect(getGrade(95)).toEqual({ label: 'Excellent', color: 'text-green-400' });
    expect(getGrade(100)).toEqual({ label: 'Excellent', color: 'text-green-400' });
  });

  it('returns Great for 85-94', () => {
    expect(getGrade(85)).toEqual({ label: 'Great', color: 'text-blue-400' });
    expect(getGrade(94)).toEqual({ label: 'Great', color: 'text-blue-400' });
  });

  it('returns Good for 70-84', () => {
    expect(getGrade(70)).toEqual({ label: 'Good', color: 'text-yellow-400' });
    expect(getGrade(84)).toEqual({ label: 'Good', color: 'text-yellow-400' });
  });

  it('returns Keep Practicing for 50-69', () => {
    expect(getGrade(50)).toEqual({ label: 'Keep Practicing', color: 'text-orange-400' });
    expect(getGrade(69)).toEqual({ label: 'Keep Practicing', color: 'text-orange-400' });
  });

  it('returns Needs Work for below 50', () => {
    expect(getGrade(49)).toEqual({ label: 'Needs Work', color: 'text-red-400' });
    expect(getGrade(0)).toEqual({ label: 'Needs Work', color: 'text-red-400' });
  });
});
