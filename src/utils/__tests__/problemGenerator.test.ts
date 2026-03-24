import { describe, it, expect } from 'vitest';
import {
  generateAddSubProblem, generateAddSubMixed,
  generateMultiplication, generateDivision,
  generateMemorySequence, generateNumberGrid, generateMentalMathChain,
  generateMissingOperatorProblem, generateTwentyFourNumbers,
  generateFlashSumProblem, generateComparisonPair,
  generateNumberSequence, generatePairMatchBoard, generateSortingRound,
  generateRunningTotalProblem, generateEstimationProblem,
  generatePercentageProblem, generateFractionProblem,
  generateDoubleHalveChain, generateTimesTableProblem,
  generateDigitSpanOperation, generateNBackSequence,
  generateWhatChangedGrid, generateMagicSquare,
  generateOddOneOut, generateBaseConversion,
  generatePrimeOrNotProblem, generateCountdownProblem,
  generateNumberBingoBoard, generateClosestTo100Problem,
  generateNumberCrossword, generateKenKenPuzzle,
  generateSquareRootProblem, generateFactoringProblem, generateComplementProblem,
  generatePercentageChangeProblem, generateGcdLcmProblem, generateDigitSumProblem,
  generateVedicProblem, generatePowerOf2Problem, generateDualNBackSequence,
  generateAuditorySequence, generateCalendarProblem, generateRomanProblem,
  generateAnagramProblem, generateMatrixPattern,
} from '../problemGenerator';

function digitCount(n: number): number {
  return Math.abs(n).toString().length;
}

function replayAddSub(numbers: number[], operations: ('+' | '-')[]): number {
  let result = numbers[0];
  for (let i = 0; i < operations.length; i++) {
    result = operations[i] === '+' ? result + numbers[i + 1] : result - numbers[i + 1];
  }
  return result;
}

const RUNS = 25;

describe('generateAddSubProblem', () => {
  it('produces correct number of rows', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubProblem({ digits: 2, rowCount: 5 });
      expect(p.numbers).toHaveLength(5);
      expect(p.operations).toHaveLength(4);
    }
  });

  it('answer matches recomputation', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubProblem({ digits: 2, rowCount: 4 });
      expect(replayAddSub(p.numbers, p.operations)).toBe(p.answer);
    }
  });

  it('does not produce negative when allowNegativeResult is false', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubProblem({ digits: 1, rowCount: 10, allowNegativeResult: false });
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('numbers have correct digit count', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubProblem({ digits: 3, rowCount: 3 });
      p.numbers.forEach((n) => expect(digitCount(n)).toBe(3));
    }
  });
});

describe('generateAddSubMixed', () => {
  it('number count within range', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubMixed({ minDigits: 1, maxDigits: 3, minNumbers: 3, maxNumbers: 5 });
      expect(p.numbers.length).toBeGreaterThanOrEqual(3);
      expect(p.numbers.length).toBeLessThanOrEqual(5);
    }
  });

  it('digits within range', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubMixed({ minDigits: 1, maxDigits: 2, minNumbers: 2, maxNumbers: 3 });
      p.numbers.forEach((n) => {
        expect(digitCount(n)).toBeGreaterThanOrEqual(1);
        expect(digitCount(n)).toBeLessThanOrEqual(2);
      });
    }
  });

  it('answer matches recomputation', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAddSubMixed({ minDigits: 1, maxDigits: 3, minNumbers: 3, maxNumbers: 6 });
      expect(replayAddSub(p.numbers, p.operations)).toBe(p.answer);
    }
  });
});

describe('generateMultiplication', () => {
  it('answer is product of num1 and num2', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMultiplication({ digits1: 3, digits2: 2 });
      expect(p.answer).toBe(p.num1 * p.num2);
    }
  });

  it('numbers have correct digit counts', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMultiplication({ digits1: 2, digits2: 1 });
      expect(digitCount(p.num1)).toBe(2);
      expect(digitCount(p.num2)).toBe(1);
    }
  });
});

describe('generateDivision', () => {
  it('quotient*divisor+remainder == dividend', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDivision({ dividendDigits: 4, divisorDigits: 2, allowRemainder: true });
      expect(p.quotient * p.divisor + p.remainder).toBe(p.dividend);
    }
  });

  it('remainder is 0 when not allowed', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDivision({ dividendDigits: 3, divisorDigits: 1, allowRemainder: false });
      expect(p.remainder).toBe(0);
      expect(p.quotient * p.divisor).toBe(p.dividend);
    }
  });
});

describe('generateMemorySequence', () => {
  it('returns correct count', () => {
    expect(generateMemorySequence(7)).toHaveLength(7);
    expect(generateMemorySequence(3)).toHaveLength(3);
  });

  it('all values are 0-9', () => {
    const seq = generateMemorySequence(20);
    seq.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(9);
    });
  });
});

describe('generateNumberGrid', () => {
  it('has correct dimensions', () => {
    const grid = generateNumberGrid(4, 5);
    expect(grid).toHaveLength(4);
    grid.forEach((row) => expect(row).toHaveLength(5));
  });

  it('all values are 0-9', () => {
    const grid = generateNumberGrid(3, 3);
    grid.flat().forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(9);
    });
  });
});

describe('generateMentalMathChain', () => {
  it('chain length matches', () => {
    const chain = generateMentalMathChain(5, 1);
    expect(chain.steps).toHaveLength(5);
  });

  it('replaying steps yields answer', () => {
    for (let r = 0; r < RUNS; r++) {
      const chain = generateMentalMathChain(4, 1);
      let result = chain.start;
      for (const step of chain.steps) {
        if (step.operation === '+') result += step.value;
        else if (step.operation === '-') result -= step.value;
        else if (step.operation === '×') result *= step.value;
      }
      expect(result).toBe(chain.answer);
    }
  });
});

describe('generateMissingOperatorProblem', () => {
  it('has correct operand count', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMissingOperatorProblem(1, 3);
      expect(p.operands).toHaveLength(4);
      expect(p.operators).toHaveLength(3);
    }
  });

  it('operators are valid', () => {
    const validOps = ['+', '-', '×', '÷'];
    for (let r = 0; r < RUNS; r++) {
      const p = generateMissingOperatorProblem(1, 2);
      p.operators.forEach((op) => expect(validOps).toContain(op));
    }
  });
});

describe('generateTwentyFourNumbers', () => {
  it('returns 4 numbers each 1-9', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateTwentyFourNumbers();
      expect(p.numbers).toHaveLength(4);
      p.numbers.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9);
      });
    }
  });

  it('has a solution hint', () => {
    const p = generateTwentyFourNumbers();
    expect(typeof p.solutionHint).toBe('string');
    expect(p.solutionHint.length).toBeGreaterThan(0);
  });
});

describe('generateFlashSumProblem', () => {
  it('has correct count and answer is sum', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateFlashSumProblem(5, 1);
      expect(p.numbers).toHaveLength(5);
      expect(p.answer).toBe(p.numbers.reduce((a, b) => a + b, 0));
    }
  });
});

describe('generateComparisonPair', () => {
  it('correctAnswer matches actual comparison', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateComparisonPair(1);
      const expected = p.leftValue > p.rightValue ? '>' : p.leftValue < p.rightValue ? '<' : '=';
      expect(p.correctAnswer).toBe(expected);
    }
  });
});

describe('generateNumberSequence', () => {
  it('returns a sequence with an answer and rule', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateNumberSequence(2);
      expect(p.sequence.length).toBeGreaterThanOrEqual(4);
      expect(typeof p.answer).toBe('number');
      expect(typeof p.rule).toBe('string');
    }
  });
});

describe('generatePairMatchBoard', () => {
  it('has correct card count', () => {
    const cards = generatePairMatchBoard(8, 10);
    expect(cards).toHaveLength(16);
  });

  it('each pairId appears exactly twice', () => {
    const cards = generatePairMatchBoard(6, 10);
    const counts: Record<number, number> = {};
    cards.forEach((c) => { counts[c.pairId] = (counts[c.pairId] || 0) + 1; });
    Object.values(counts).forEach((count) => expect(count).toBe(2));
  });

  it('paired cards sum to target', () => {
    const cards = generatePairMatchBoard(8, 10);
    const byPair: Record<number, number[]> = {};
    cards.forEach((c) => { (byPair[c.pairId] ??= []).push(c.value); });
    Object.values(byPair).forEach((vals) => {
      expect(vals[0] + vals[1]).toBe(10);
    });
  });

  it('all card values are between 1 and targetSum-1', () => {
    for (let r = 0; r < RUNS; r++) {
      const cards = generatePairMatchBoard(6, 20);
      cards.forEach((c) => {
        expect(c.value).toBeGreaterThanOrEqual(1);
        expect(c.value).toBeLessThanOrEqual(19);
      });
    }
  });

  it('any two cards summing to target form a valid match', () => {
    const targetSum = 10;
    const cards = generatePairMatchBoard(6, targetSum);
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].value + cards[j].value === targetSum) {
          expect(cards[i].value + cards[j].value).toBe(targetSum);
        }
      }
    }
  });
});

describe('generateSortingRound', () => {
  it('sorted matches direction', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = generateSortingRound(6, 2);
      expect(round.numbers).toHaveLength(6);
      expect(round.sorted).toHaveLength(6);
      const sorted = [...round.numbers].sort((a, b) =>
        round.direction === 'asc' ? a - b : b - a
      );
      expect(round.sorted).toEqual(sorted);
    }
  });

  it('all numbers are unique', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = generateSortingRound(5, 2);
      expect(new Set(round.numbers).size).toBe(5);
    }
  });
});

// ── NEW GENERATOR TESTS ─────────────────────────────────────

describe('generateRunningTotalProblem', () => {
  it('produces correct number of operations and valid answer', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateRunningTotalProblem(6, 1);
      expect(p.operations).toHaveLength(6);
      let total = 0;
      for (const op of p.operations) {
        total = op.op === '+' ? total + op.value : total - op.value;
      }
      expect(p.answer).toBe(total);
    }
  });

  it('first operation is always +', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateRunningTotalProblem(4, 2);
      expect(p.operations[0].op).toBe('+');
    }
  });
});

describe('generateEstimationProblem', () => {
  it('has 4 choices with exactly one correct', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateEstimationProblem(2);
      expect(p.choices).toHaveLength(4);
      expect(p.correctIndex).toBeGreaterThanOrEqual(0);
      expect(p.correctIndex).toBeLessThan(4);
      expect(p.choices[p.correctIndex]).toBe(p.exactAnswer);
    }
  });

  it('expression is a non-empty string', () => {
    const p = generateEstimationProblem(3);
    expect(p.expression.length).toBeGreaterThan(0);
  });
});

describe('generatePercentageProblem', () => {
  it('answer equals percentage of base', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generatePercentageProblem(500, [10, 20, 25, 50]);
      const expected = (p.percentage / 100) * p.baseValue;
      expect(p.answer).toBe(expected);
    }
  });

  it('baseValue is a multiple of 10', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generatePercentageProblem(200, [15]);
      expect(p.baseValue % 10).toBe(0);
    }
  });
});

describe('generateFractionProblem', () => {
  it('numerator < denominator', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateFractionProblem(12);
      expect(p.numerator).toBeLessThan(p.denominator);
      expect(p.numerator).toBeGreaterThan(0);
    }
  });

  it('answer is rounded to 3 decimal places', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateFractionProblem(8);
      const decimalPlaces = (p.answer.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(3);
    }
  });
});

describe('generateDoubleHalveChain', () => {
  it('answer matches replayed chain', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDoubleHalveChain(4, 50);
      let current = p.start;
      for (const step of p.steps) {
        current = step === 'double' ? current * 2 : Math.floor(current / 2);
      }
      expect(p.answer).toBe(current);
    }
  });

  it('start is always even', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDoubleHalveChain(3, 40);
      expect(p.start % 2).toBe(0);
    }
  });
});

describe('generateTimesTableProblem', () => {
  it('answer = num1 * num2', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateTimesTableProblem(12);
      expect(p.answer).toBe(p.num1 * p.num2);
      expect(p.num1).toBeGreaterThanOrEqual(2);
      expect(p.num2).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('generateDigitSpanOperation', () => {
  it('transformed is reverse of original with +1 mod 10', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDigitSpanOperation(5);
      expect(p.original).toHaveLength(5);
      expect(p.transformed).toHaveLength(5);
      const expected = [...p.original].reverse().map((d) => (d + 1) % 10);
      expect(p.transformed).toEqual(expected);
    }
  });

  it('all original digits are 0-8', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDigitSpanOperation(6);
      p.original.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(8);
      });
    }
  });
});

describe('generateNBackSequence', () => {
  it('matchPositions are valid n-back matches', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateNBackSequence(20, 2);
      expect(p.sequence).toHaveLength(20);
      expect(p.nBack).toBe(2);
      for (const pos of p.matchPositions) {
        expect(pos).toBeGreaterThanOrEqual(2);
        expect(p.sequence[pos]).toBe(p.sequence[pos - 2]);
      }
    }
  });

  it('all match positions are actually in the sequence', () => {
    const p = generateNBackSequence(15, 1);
    for (const pos of p.matchPositions) {
      expect(pos).toBeLessThan(p.sequence.length);
    }
  });
});

describe('generateWhatChangedGrid', () => {
  it('changed positions have different values', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateWhatChangedGrid(3, 2);
      expect(p.original).toHaveLength(9);
      expect(p.changed).toHaveLength(9);
      expect(p.changedPositions).toHaveLength(2);
      for (const pos of p.changedPositions) {
        expect(p.original[pos]).not.toBe(p.changed[pos]);
      }
    }
  });

  it('non-changed positions stay the same', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateWhatChangedGrid(4, 3);
      for (let i = 0; i < p.original.length; i++) {
        if (!p.changedPositions.includes(i)) {
          expect(p.original[i]).toBe(p.changed[i]);
        }
      }
    }
  });
});

describe('generateMagicSquare', () => {
  it('solution rows/cols/diags all sum to magicSum', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMagicSquare();
      expect(p.magicSum).toBe(15);
      for (let i = 0; i < 3; i++) {
        expect(p.solution[i].reduce((a, b) => a + b, 0)).toBe(15);
        expect(p.solution[0][i] + p.solution[1][i] + p.solution[2][i]).toBe(15);
      }
      expect(p.solution[0][0] + p.solution[1][1] + p.solution[2][2]).toBe(15);
      expect(p.solution[0][2] + p.solution[1][1] + p.solution[2][0]).toBe(15);
    }
  });

  it('has 3-5 blanks', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMagicSquare();
      expect(p.blanks.length).toBeGreaterThanOrEqual(3);
      expect(p.blanks.length).toBeLessThanOrEqual(5);
    }
  });
});

describe('generateOddOneOut', () => {
  it('oddIndex is valid and within range', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateOddOneOut();
      expect(p.numbers).toHaveLength(5);
      expect(p.oddIndex).toBeGreaterThanOrEqual(0);
      expect(p.oddIndex).toBeLessThan(5);
      expect(p.rule.length).toBeGreaterThan(0);
    }
  });
});

describe('generateBaseConversion', () => {
  it('answer is consistent with question', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateBaseConversion(255);
      expect(p.question.length).toBeGreaterThan(0);
      expect(p.answer.length).toBeGreaterThan(0);
      if (p.fromBase === 'decimal' && p.toBase === 'binary') {
        expect(p.answer).toBe(p.decimalValue.toString(2));
      } else if (p.fromBase === 'decimal' && p.toBase === 'hex') {
        expect(p.answer).toBe(p.decimalValue.toString(16).toUpperCase());
      } else if (p.toBase === 'decimal') {
        expect(p.answer).toBe(String(p.decimalValue));
      }
    }
  });
});

describe('generatePrimeOrNotProblem', () => {
  it('correctly identifies primes', () => {
    const knownPrimes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
    for (let r = 0; r < RUNS; r++) {
      const p = generatePrimeOrNotProblem(100);
      expect(p.number).toBeGreaterThanOrEqual(2);
      expect(p.number).toBeLessThanOrEqual(100);
      if (knownPrimes.has(p.number)) {
        expect(p.isPrime).toBe(true);
      } else {
        expect(p.isPrime).toBe(false);
      }
    }
  });
});

describe('generateCountdownProblem', () => {
  it('returns correct number of numbers and valid target', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateCountdownProblem(6);
      expect(p.numbers).toHaveLength(6);
      expect(p.target).toBeGreaterThanOrEqual(100);
      expect(p.target).toBeLessThanOrEqual(999);
    }
  });
});

describe('generateNumberBingoBoard', () => {
  it('grid has unique answers matching questions', () => {
    for (let r = 0; r < 5; r++) {
      const p = generateNumberBingoBoard(4);
      expect(p.grid).toHaveLength(16);
      expect(p.questions).toHaveLength(16);
      const answers = new Set(p.questions.map((q) => q.answer));
      expect(answers.size).toBe(16);
      for (const q of p.questions) {
        expect(p.grid).toContain(q.answer);
      }
    }
  });
});

describe('generateClosestTo100Problem', () => {
  it('returns correct number count and target', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateClosestTo100Problem(4, 100);
      expect(p.numbers).toHaveLength(4);
      expect(p.target).toBe(100);
      p.numbers.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(15);
      });
    }
  });
});

describe('generateNumberCrossword', () => {
  it('clue answers match computation', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateNumberCrossword();
      expect(p.acrossClue.length).toBeGreaterThan(0);
      expect(p.downClue.length).toBeGreaterThan(0);
      expect(typeof p.acrossAnswer).toBe('number');
      expect(typeof p.downAnswer).toBe('number');
    }
  });
});

describe('generateKenKenPuzzle', () => {
  it('solution satisfies Latin square property', () => {
    for (let r = 0; r < 5; r++) {
      const p = generateKenKenPuzzle(4);
      expect(p.size).toBe(4);
      expect(p.solution).toHaveLength(4);
      for (let row = 0; row < 4; row++) {
        expect(new Set(p.solution[row]).size).toBe(4);
        p.solution[row].forEach((v) => {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(4);
        });
      }
      for (let col = 0; col < 4; col++) {
        const colVals = p.solution.map((r) => r[col]);
        expect(new Set(colVals).size).toBe(4);
      }
    }
  });

  it('cages cover all cells', () => {
    const p = generateKenKenPuzzle(3);
    const covered = new Set<string>();
    for (const cage of p.cages) {
      for (const [r, c] of cage.cells) {
        covered.add(`${r},${c}`);
      }
    }
    expect(covered.size).toBe(9);
  });

  it('cage targets are consistent with solution', () => {
    for (let r = 0; r < 5; r++) {
      const p = generateKenKenPuzzle(4);
      for (const cage of p.cages) {
        const vals = cage.cells.map(([row, col]) => p.solution[row][col]);
        if (cage.operation === '+') {
          expect(vals.reduce((a, b) => a + b, 0)).toBe(cage.target);
        } else if (cage.operation === '×') {
          expect(vals.reduce((a, b) => a * b, 1)).toBe(cage.target);
        }
      }
    }
  });
});

// ── ADDITIONAL GENERATOR TESTS (square root, factoring, …) ──

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) return false;
  }
  return true;
}

function gcdTest(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcmTest(a: number, b: number): number {
  return Math.abs(a * b) / gcdTest(a, b);
}

function digitalRootExpected(n: number): number {
  let sum = n;
  while (sum >= 10) {
    sum = String(sum)
      .split('')
      .reduce((acc, d) => acc + Number(d), 0);
  }
  return sum;
}

function romanToInt(s: string): number {
  const map: Record<string, number> = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let i = 0;
  let n = 0;
  const keys = Object.keys(map).sort((a, b) => map[b] - map[a]);
  while (i < s.length) {
    let matched = false;
    for (const k of keys) {
      if (s.slice(i, i + k.length) === k) {
        n += map[k];
        i += k.length;
        matched = true;
        break;
      }
    }
    if (!matched) throw new Error(`Bad roman: ${s}`);
  }
  return n;
}

function multisetEqualDigits(a: number[], b: number): boolean {
  const sa = [...a].sort((x, y) => x - y);
  const sb = String(b)
    .split('')
    .map(Number)
    .sort((x, y) => x - y);
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

function expectedAnagramAnswer(digits: number[], mode: 'smallest' | 'largest'): number {
  const sorted = [...digits].sort((a, b) => (mode === 'smallest' ? a - b : b - a));
  if (mode === 'smallest' && sorted[0] === 0) {
    const firstNonZero = sorted.findIndex((d) => d > 0);
    if (firstNonZero > 0) [sorted[0], sorted[firstNonZero]] = [sorted[firstNonZero], sorted[0]];
  }
  return Number(sorted.join(''));
}

describe('generateSquareRootProblem', () => {
  it('returns number and answer with expected shape', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateSquareRootProblem(50);
      expect(typeof p.number).toBe('number');
      expect(typeof p.answer).toBe('number');
      expect(p.number).toBeGreaterThanOrEqual(1);
      expect(p.number).toBeLessThanOrEqual(50);
    }
  });

  it('answer equals sqrt(number) rounded to 2 decimals', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateSquareRootProblem(200);
      expect(p.answer).toBe(Math.round(Math.sqrt(p.number) * 100) / 100);
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateSquareRootProblem(10)).not.toThrow();
    }
  });
});

describe('generateFactoringProblem', () => {
  it('returns number, factors array with length >= 2', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateFactoringProblem(80);
      expect(Array.isArray(p.factors)).toBe(true);
      expect(p.factors.length).toBeGreaterThanOrEqual(2);
      expect(p.number).toBeGreaterThanOrEqual(4);
    }
  });

  it('factors are prime and multiply to number', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateFactoringProblem(100);
      expect(p.factors.every(isPrime)).toBe(true);
      expect(p.factors.reduce((a, b) => a * b, 1)).toBe(p.number);
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateFactoringProblem(30)).not.toThrow();
    }
  });
});

describe('generateComplementProblem', () => {
  it('returns number, target, answer', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateComplementProblem();
      expect([100, 1000]).toContain(p.target);
      expect(p.number).toBeGreaterThanOrEqual(1);
      expect(p.number).toBeLessThan(p.target);
    }
  });

  it('number + answer equals target', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateComplementProblem(1000);
      expect(p.number + p.answer).toBe(p.target);
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateComplementProblem(100)).not.toThrow();
    }
  });
});

describe('generatePercentageChangeProblem', () => {
  it('returns from, to, answer, direction, display', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generatePercentageChangeProblem(150);
      expect(p.from).toBeGreaterThan(0);
      expect(['increase', 'decrease']).toContain(p.direction);
      expect(typeof p.display).toBe('string');
      expect(p.display.length).toBeGreaterThan(0);
    }
  });

  it('answer and direction match computed percentage change', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generatePercentageChangeProblem(300);
      const pct = Math.round(((p.to - p.from) / p.from) * 1000) / 10;
      expect(p.answer).toBe(Math.round(Math.abs(pct) * 10) / 10);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.direction).toBe(pct >= 0 ? 'increase' : 'decrease');
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generatePercentageChangeProblem(100)).not.toThrow();
    }
  });
});

describe('generateGcdLcmProblem', () => {
  it('returns a, b, mode, answer, display', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateGcdLcmProblem(40, 'gcd');
      expect(['gcd', 'lcm']).toContain(p.mode);
      expect(typeof p.answer).toBe('number');
      expect(p.display).toContain(String(p.a));
    }
  });

  it('gcd mode: answer divides both a and b and equals gcd', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateGcdLcmProblem(60, 'gcd');
      expect(p.a % p.answer).toBe(0);
      expect(p.b % p.answer).toBe(0);
      expect(p.answer).toBe(gcdTest(p.a, p.b));
    }
  });

  it('lcm mode: a and b divide answer and answer equals lcm', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateGcdLcmProblem(50, 'lcm');
      expect(p.answer % p.a).toBe(0);
      expect(p.answer % p.b).toBe(0);
      expect(p.answer).toBe(lcmTest(p.a, p.b));
    }
  });
});

describe('generateDigitSumProblem', () => {
  it('returns number and single-digit answer 1-9', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDigitSumProblem(4);
      expect(p.answer).toBeGreaterThanOrEqual(1);
      expect(p.answer).toBeLessThanOrEqual(9);
      expect(p.number).toBeGreaterThanOrEqual(1000);
    }
  });

  it('answer matches digital root recomputation', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDigitSumProblem(5);
      expect(p.answer).toBe(digitalRootExpected(p.number));
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateDigitSumProblem(3)).not.toThrow();
    }
  });
});

describe('generateVedicProblem', () => {
  it('returns type, question, answer, explanation', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateVedicProblem();
      expect(typeof p.type).toBe('string');
      expect(p.type.length).toBeGreaterThan(0);
      expect(typeof p.question).toBe('string');
      expect(p.question.length).toBeGreaterThan(0);
      expect(typeof p.explanation).toBe('string');
      expect(p.explanation.length).toBeGreaterThan(0);
      expect(typeof p.answer).toBe('number');
    }
  });

  it('answer is correct for fixed types', () => {
    const p11 = generateVedicProblem('multiply-by-11');
    const m = p11.question.match(/^(\d+) × 11$/);
    expect(m).not.toBeNull();
    expect(p11.answer).toBe(Number(m![1]) * 11);

    const p99 = generateVedicProblem('ekanyunena-multiply-9s');
    const m99 = p99.question.match(/^(\d+) × 99$/);
    expect(m99).not.toBeNull();
    expect(p99.answer).toBe(Number(m99![1]) * 99);
  });

  it('runs without error for each known type', () => {
    const types = [
      'ekadhikena-square-5',
      'nikhilam-multiply-near-base',
      'ekanyunena-multiply-9s',
      'multiply-by-11',
      'yavadunam-square-near-base',
    ];
    for (const t of types) {
      for (let r = 0; r < 5; r++) {
        expect(() => generateVedicProblem(t)).not.toThrow();
      }
    }
  });
});

describe('generatePowerOf2Problem', () => {
  it('value equals 2^exponent and fields are present', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generatePowerOf2Problem(12, 'value-from-exp');
      expect(p.base).toBe(2);
      expect(p.value).toBe(Math.pow(2, p.exponent));
      expect(typeof p.question).toBe('string');
    }
  });

  it('answer matches mode', () => {
    for (let r = 0; r < RUNS; r++) {
      const pv = generatePowerOf2Problem(10, 'value-from-exp');
      expect(pv.answer).toBe(pv.value);
      const pe = generatePowerOf2Problem(10, 'exp-from-value');
      expect(pe.answer).toBe(pe.exponent);
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generatePowerOf2Problem(8)).not.toThrow();
    }
  });
});

describe('generateDualNBackSequence', () => {
  it('sequence length and nBack match', () => {
    const p = generateDualNBackSequence(18, 3);
    expect(p.sequence).toHaveLength(18);
    expect(p.nBack).toBe(3);
    expect(p.numberMatches).toHaveLength(18);
    expect(p.positionMatches).toHaveLength(18);
  });

  it('match flags match sequence semantics', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateDualNBackSequence(25, 2);
      for (let i = 0; i < p.sequence.length; i++) {
        const nMatch = i >= p.nBack && p.sequence[i].number === p.sequence[i - p.nBack].number;
        const pMatch = i >= p.nBack && p.sequence[i].position === p.sequence[i - p.nBack].position;
        expect(p.numberMatches[i]).toBe(nMatch);
        expect(p.positionMatches[i]).toBe(pMatch);
      }
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateDualNBackSequence(15, 1)).not.toThrow();
    }
  });
});

describe('generateAuditorySequence', () => {
  it('digits length matches requested len', () => {
    expect(generateAuditorySequence(7).digits).toHaveLength(7);
    expect(generateAuditorySequence(1).digits).toHaveLength(1);
  });

  it('all digits are 0-9', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAuditorySequence(12);
      p.digits.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(9);
      });
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateAuditorySequence(8)).not.toThrow();
    }
  });
});

describe('generateCalendarProblem', () => {
  it('returns date, dayOfWeek, display', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateCalendarProblem([2000, 2020]);
      expect(p.date.year).toBeGreaterThanOrEqual(2000);
      expect(p.date.year).toBeLessThanOrEqual(2020);
      expect(p.date.month).toBeGreaterThanOrEqual(1);
      expect(p.date.month).toBeLessThanOrEqual(12);
      expect(typeof p.dayOfWeek).toBe('string');
      expect(p.display).toMatch(/\d{4}/);
    }
  });

  it('dayOfWeek matches Date for the given calendar date', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateCalendarProblem([1995, 2005]);
      const d = new Date(p.date.year, p.date.month - 1, p.date.day);
      const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      expect(p.dayOfWeek).toBe(names[d.getDay()]);
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateCalendarProblem([2010, 2015])).not.toThrow();
    }
  });
});

describe('generateRomanProblem', () => {
  it('returns mode, decimal, roman, question, answer', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateRomanProblem(500, 'to-roman');
      expect(['to-roman', 'from-roman']).toContain(p.mode);
      expect(p.decimal).toBeGreaterThanOrEqual(1);
      expect(p.decimal).toBeLessThanOrEqual(500);
      expect(p.roman.length).toBeGreaterThan(0);
    }
  });

  it('roman parses back to decimal', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateRomanProblem(888);
      expect(romanToInt(p.roman)).toBe(p.decimal);
    }
  });

  it('answer matches mode', () => {
    for (let r = 0; r < RUNS; r++) {
      const toR = generateRomanProblem(200, 'to-roman');
      expect(toR.answer).toBe(toR.roman);
      const fromR = generateRomanProblem(200, 'from-roman');
      expect(fromR.answer).toBe(String(fromR.decimal));
    }
  });
});

describe('generateAnagramProblem', () => {
  it('returns digits, mode, answer, display', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAnagramProblem(3, 5, 'smallest');
      expect(p.digits.length).toBeGreaterThanOrEqual(2);
      expect(['smallest', 'largest']).toContain(p.mode);
      expect(typeof p.answer).toBe('number');
      expect(p.display.split(' ').length).toBe(p.digits.length);
    }
  });

  it('answer uses same multiset of digits as input', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateAnagramProblem(3, 5);
      expect(multisetEqualDigits(p.digits, p.answer)).toBe(true);
    }
  });

  it('smallest/largest matches expected permutation extrema', () => {
    for (let r = 0; r < RUNS; r++) {
      const ps = generateAnagramProblem(3, 5, 'smallest');
      expect(ps.answer).toBe(expectedAnagramAnswer(ps.digits, 'smallest'));
      const pl = generateAnagramProblem(3, 5, 'largest');
      expect(pl.answer).toBe(expectedAnagramAnswer(pl.digits, 'largest'));
    }
  });
});

describe('generateMatrixPattern', () => {
  it('grid has null only at missing cell with correct dimensions', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMatrixPattern(4);
      expect(p.grid).toHaveLength(4);
      p.grid.forEach((row) => expect(row).toHaveLength(4));
      expect(p.fullGrid).toHaveLength(4);
      let nullCount = 0;
      for (let r0 = 0; r0 < 4; r0++) {
        for (let c0 = 0; c0 < 4; c0++) {
          if (p.grid[r0][c0] === null) nullCount++;
        }
      }
      expect(nullCount).toBe(1);
      expect(p.grid[p.missingRow][p.missingCol]).toBeNull();
    }
  });

  it('answer equals fullGrid at missing position', () => {
    for (let r = 0; r < RUNS; r++) {
      const p = generateMatrixPattern(3);
      expect(p.answer).toBe(p.fullGrid[p.missingRow][p.missingCol]);
    }
  });

  it('runs without error many times', () => {
    for (let r = 0; r < RUNS; r++) {
      expect(() => generateMatrixPattern(5)).not.toThrow();
    }
  });
});
