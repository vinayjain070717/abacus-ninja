import { describe, it, expect } from 'vitest';
import { generateWorksheet } from '../worksheetGenerator';
import { APP_CONFIG, BRAIN_GAME_IDS } from '../../config/appConfig';

describe('generateWorksheet', () => {
  it('returns correct problem counts', () => {
    const ws = generateWorksheet(1);
    expect(ws.addSubProblems).toHaveLength(APP_CONFIG.worksheet.addSubCount);
    expect(ws.multiplyProblems).toHaveLength(APP_CONFIG.worksheet.multiplyCount);
    expect(ws.divisionProblems).toHaveLength(APP_CONFIG.worksheet.divisionCount);
  });

  it('selects correct number of unique brain games', () => {
    const ws = generateWorksheet(5);
    expect(ws.brainGames).toHaveLength(APP_CONFIG.worksheet.brainGameSlots);
    expect(new Set(ws.brainGames).size).toBe(APP_CONFIG.worksheet.brainGameSlots);
  });

  it('brain games are from the valid pool', () => {
    const ws = generateWorksheet(3);
    const pool = new Set<string>(BRAIN_GAME_IDS);
    ws.brainGames.forEach((g) => expect(pool.has(g)).toBe(true));
  });

  it('date is today ISO date', () => {
    const ws = generateWorksheet(1);
    expect(ws.date).toBe(new Date().toISOString().slice(0, 10));
  });

  it('level is stored correctly', () => {
    const ws = generateWorksheet(7);
    expect(ws.level).toBe(7);
  });

  it('does not crash for valid boundary levels', () => {
    expect(() => generateWorksheet(1)).not.toThrow();
    expect(() => generateWorksheet(10)).not.toThrow();
  });

  it('clamps level 11 to level 10 config', () => {
    const ws = generateWorksheet(11);
    expect(ws.addSubProblems).toHaveLength(APP_CONFIG.worksheet.addSubCount);
  });

  it('all addSub problems have valid answer', () => {
    const ws = generateWorksheet(4);
    ws.addSubProblems.forEach((p) => {
      expect(typeof p.answer).toBe('number');
      expect(p.numbers.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('all multiply problems have valid answer', () => {
    const ws = generateWorksheet(4);
    ws.multiplyProblems.forEach((p) => {
      expect(p.answer).toBe(p.num1 * p.num2);
    });
  });

  it('all division problems have zero remainder', () => {
    const ws = generateWorksheet(4);
    ws.divisionProblems.forEach((p) => {
      expect(p.remainder).toBe(0);
      expect(p.quotient * p.divisor).toBe(p.dividend);
    });
  });
});
