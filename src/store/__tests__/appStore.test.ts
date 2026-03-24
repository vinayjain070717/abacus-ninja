import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      settings: {
        defaultSpeeds: { 1: 120, 2: 60, 3: 30, 4: 15, 5: 10 },
        defaultRows: { 1: 10, 2: 7, 3: 5, 4: 4, 5: 3 },
        defaultProblems: 10,
        soundEnabled: true,
      },
    });
  });

  describe('updateSpeed', () => {
    it('updates speed for given digit', () => {
      useAppStore.getState().updateSpeed(2, 80);
      expect(useAppStore.getState().settings.defaultSpeeds[2]).toBe(80);
    });

    it('does not affect other digits', () => {
      useAppStore.getState().updateSpeed(3, 50);
      expect(useAppStore.getState().settings.defaultSpeeds[2]).toBe(60);
      expect(useAppStore.getState().settings.defaultSpeeds[3]).toBe(50);
    });
  });

  describe('updateRows', () => {
    it('updates rows for given digit', () => {
      useAppStore.getState().updateRows(1, 15);
      expect(useAppStore.getState().settings.defaultRows[1]).toBe(15);
    });
  });

  describe('updateDefaultProblems', () => {
    it('sets default problems', () => {
      useAppStore.getState().updateDefaultProblems(25);
      expect(useAppStore.getState().settings.defaultProblems).toBe(25);
    });
  });

  describe('toggleSound', () => {
    it('flips sound on/off', () => {
      expect(useAppStore.getState().settings.soundEnabled).toBe(true);
      useAppStore.getState().toggleSound();
      expect(useAppStore.getState().settings.soundEnabled).toBe(false);
      useAppStore.getState().toggleSound();
      expect(useAppStore.getState().settings.soundEnabled).toBe(true);
    });
  });
});
