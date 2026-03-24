import { describe, it, expect } from 'vitest';
import { APP_CONFIG, BRAIN_GAME_IDS } from '../../config/appConfig';

describe('APP_CONFIG.levels', () => {
  it('has exactly 10 levels', () => {
    expect(APP_CONFIG.levels).toHaveLength(10);
  });

  it('each level has required shape', () => {
    APP_CONFIG.levels.forEach((cfg, i) => {
      expect(cfg.level).toBe(i + 1);
      expect(cfg.addSub.minDigits).toBeGreaterThan(0);
      expect(cfg.addSub.maxDigits).toBeGreaterThanOrEqual(cfg.addSub.minDigits);
      expect(cfg.addSub.minNumbers).toBeGreaterThanOrEqual(2);
      expect(cfg.addSub.maxNumbers).toBeGreaterThanOrEqual(cfg.addSub.minNumbers);
      expect(cfg.multiply.length).toBeGreaterThan(0);
      expect(cfg.divide.length).toBeGreaterThan(0);
      expect(cfg.memoryNumbers).toBeGreaterThan(0);
    });
  });
});

describe('BRAIN_GAME_IDS', () => {
  it('matches brainGames registry size', () => {
    expect(BRAIN_GAME_IDS).toHaveLength(Object.keys(APP_CONFIG.brainGames).length);
  });

  it('all entries are unique', () => {
    const unique = new Set(BRAIN_GAME_IDS);
    expect(unique.size).toBe(BRAIN_GAME_IDS.length);
  });
});

describe('APP_CONFIG.brainGames', () => {
  it('has label and config for every brain game', () => {
    BRAIN_GAME_IDS.forEach((game) => {
      const cfg = APP_CONFIG.brainGames[game];
      expect(cfg).toBeDefined();
      expect(typeof cfg.label).toBe('string');
      expect(cfg.label.length).toBeGreaterThan(0);
      expect(cfg.worksheet.rounds).toBeGreaterThan(0);
      expect(typeof cfg.worksheet.description).toBe('string');
    });
  });
});

describe('APP_CONFIG.multiplication.types', () => {
  it('has valid digit values', () => {
    APP_CONFIG.multiplication.types.forEach((t) => {
      expect(t.d1).toBeGreaterThan(0);
      expect(t.d2).toBeGreaterThan(0);
      expect(t.d1).toBeGreaterThanOrEqual(t.d2);
      expect(typeof t.label).toBe('string');
    });
  });
});

describe('APP_CONFIG.division.types', () => {
  it('has valid digit values', () => {
    APP_CONFIG.division.types.forEach((t) => {
      expect(t.dividendDigits).toBeGreaterThan(0);
      expect(t.divisorDigits).toBeGreaterThan(0);
      expect(t.dividendDigits).toBeGreaterThanOrEqual(t.divisorDigits);
      expect(typeof t.label).toBe('string');
    });
  });
});

describe('APP_CONFIG.additionSubtraction', () => {
  it('has entries for digits 1-5', () => {
    for (let d = 1; d <= 5; d++) {
      expect(APP_CONFIG.additionSubtraction.defaultSpeeds[d]).toBeGreaterThan(0);
      expect(APP_CONFIG.additionSubtraction.defaultRows[d]).toBeGreaterThan(0);
    }
  });
});

describe('APP_CONFIG.scoring.grades', () => {
  it('grades are ordered from highest to lowest min', () => {
    const mins = APP_CONFIG.scoring.grades.map((g) => g.min);
    for (let i = 1; i < mins.length; i++) {
      expect(mins[i]).toBeLessThan(mins[i - 1]);
    }
  });
});
