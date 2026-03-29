import { useState, useCallback } from 'react';

const STORAGE_KEY = 'abacus_pb';

interface PBEntry {
  score: number;
  total: number;
  pct: number;
  date: string;
}

type PBMap = Record<string, PBEntry>;

function load(): PBMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PBMap;
  } catch { /* corrupted */ }
  return {};
}

export function usePersonalBest(gameId: string | undefined) {
  const [data, setData] = useState<PBMap>(load);

  const entry = gameId ? data[gameId] : undefined;
  const bestPct = entry?.pct ?? 0;
  const bestDate = entry?.date ?? '';

  const recordScore = useCallback((score: number, total: number) => {
    if (!gameId || total === 0) return false;
    const pct = Math.round((score / total) * 100);
    setData((prev) => {
      const existing = prev[gameId];
      if (existing && existing.pct >= pct) return prev;
      const next = { ...prev, [gameId]: { score, total, pct, date: new Date().toISOString().slice(0, 10) } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const existing = data[gameId];
    return !existing || pct > existing.pct;
  }, [gameId, data]);

  return { bestPct, bestDate, recordScore };
}

export function getAllPersonalBests(): PBMap {
  return load();
}
