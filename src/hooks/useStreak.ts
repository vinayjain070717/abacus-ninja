import { useState, useCallback } from 'react';

const STORAGE_KEY = 'abacus_streak';

interface StreakData {
  dates: string[];
  bestStreak: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch { /* corrupted data */ }
  return { dates: [], bestStreak: 0 };
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const todayStr = today();
  if (sorted[0] !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (sorted[0] !== yesterday.toISOString().slice(0, 10)) return 0;
  }
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diffMs = curr.getTime() - prev.getTime();
    if (Math.round(diffMs / 86400000) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useStreak() {
  const [data, setData] = useState<StreakData>(load);

  const currentStreak = calcStreak(data.dates);
  const hasPracticedToday = data.dates.includes(today());

  const recordPractice = useCallback(() => {
    setData((prev) => {
      const todayStr = today();
      if (prev.dates.includes(todayStr)) return prev;
      const next: StreakData = {
        dates: [...prev.dates, todayStr],
        bestStreak: prev.bestStreak,
      };
      const streak = calcStreak(next.dates);
      if (streak > next.bestStreak) next.bestStreak = streak;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { currentStreak, bestStreak: data.bestStreak, hasPracticedToday, recordPractice };
}
