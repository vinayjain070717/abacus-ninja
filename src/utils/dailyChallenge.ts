import { BRAIN_GAME_IDS } from '../config/appConfig';

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyChallenge() {
  const today = new Date().toISOString().slice(0, 10);
  const hash = hashDate(today);
  const gameIdx = hash % BRAIN_GAME_IDS.length;
  const gameId = BRAIN_GAME_IDS[gameIdx];
  return { date: today, gameId, seed: hash };
}
