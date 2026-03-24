import { create } from 'zustand';
import { APP_CONFIG } from '../config/appConfig';

interface AppState {
  settings: {
    defaultSpeeds: Record<number, number>;
    defaultRows: Record<number, number>;
    defaultProblems: number;
    soundEnabled: boolean;
  };
  updateSpeed: (digits: number, speed: number) => void;
  updateRows: (digits: number, rows: number) => void;
  updateDefaultProblems: (count: number) => void;
  toggleSound: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  settings: {
    defaultSpeeds: { ...APP_CONFIG.additionSubtraction.defaultSpeeds },
    defaultRows: { ...APP_CONFIG.additionSubtraction.defaultRows },
    defaultProblems: APP_CONFIG.additionSubtraction.defaultProblems,
    soundEnabled: true,
  },

  updateSpeed: (digits, speed) =>
    set((s) => ({
      settings: {
        ...s.settings,
        defaultSpeeds: { ...s.settings.defaultSpeeds, [digits]: speed },
      },
    })),

  updateRows: (digits, rows) =>
    set((s) => ({
      settings: {
        ...s.settings,
        defaultRows: { ...s.settings.defaultRows, [digits]: rows },
      },
    })),

  updateDefaultProblems: (count) =>
    set((s) => ({
      settings: { ...s.settings, defaultProblems: count },
    })),

  toggleSound: () =>
    set((s) => ({
      settings: { ...s.settings, soundEnabled: !s.settings.soundEnabled },
    })),
}));
