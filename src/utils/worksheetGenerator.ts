import { APP_CONFIG, BRAIN_GAME_IDS, type LevelConfig } from '../config/appConfig';
import {
  generateAddSubMixed,
  generateMultiplication,
  generateDivision,
  type AddSubProblem,
  type MultiplyProblem,
  type DivisionProblem,
} from './problemGenerator';

export interface Worksheet {
  level: number;
  date: string;
  addSubProblems: AddSubProblem[];
  multiplyProblems: MultiplyProblem[];
  divisionProblems: DivisionProblem[];
  brainGames: string[];
}

function pickRandomUnique(pool: readonly string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateWorksheet(level: number): Worksheet {
  const config: LevelConfig = APP_CONFIG.levels[Math.min(level, APP_CONFIG.worksheet.maxLevel) - 1];

  const addSubProblems: AddSubProblem[] = Array.from({ length: APP_CONFIG.worksheet.addSubCount }, () =>
    generateAddSubMixed({
      minDigits: config.addSub.minDigits,
      maxDigits: config.addSub.maxDigits,
      minNumbers: config.addSub.minNumbers,
      maxNumbers: config.addSub.maxNumbers,
    })
  );

  const multiplyProblems: MultiplyProblem[] = Array.from({ length: APP_CONFIG.worksheet.multiplyCount }, () => {
    const mt = config.multiply[Math.floor(Math.random() * config.multiply.length)];
    return generateMultiplication({ digits1: mt.d1, digits2: mt.d2 });
  });

  const divisionProblems: DivisionProblem[] = Array.from({ length: APP_CONFIG.worksheet.divisionCount }, () => {
    const dt = config.divide[Math.floor(Math.random() * config.divide.length)];
    return generateDivision({
      dividendDigits: dt.dividendDigits,
      divisorDigits: dt.divisorDigits,
      allowRemainder: false,
    });
  });

  const brainGames = pickRandomUnique(BRAIN_GAME_IDS, APP_CONFIG.worksheet.brainGameSlots);

  return {
    level,
    date: new Date().toISOString().slice(0, 10),
    addSubProblems,
    multiplyProblems,
    divisionProblems,
    brainGames,
  };
}
