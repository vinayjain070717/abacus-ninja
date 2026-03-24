function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDigitNumber(digits: number): number {
  if (digits <= 0) return 0;
  const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randInt(min, max);
}

export interface AddSubProblem {
  numbers: number[];
  operations: ('+' | '-')[];
  answer: number;
  display: string;
}

export function generateAddSubProblem(config: {
  digits: number;
  rowCount: number;
  allowNegativeResult?: boolean;
}): AddSubProblem {
  const { digits, rowCount, allowNegativeResult = false } = config;
  const numbers: number[] = [];
  const operations: ('+' | '-')[] = [];

  numbers.push(randDigitNumber(digits));
  let running = numbers[0];

  for (let i = 1; i < rowCount; i++) {
    const num = randDigitNumber(digits);
    let op: '+' | '-';

    if (!allowNegativeResult && running - num < 0) {
      op = '+';
    } else {
      op = Math.random() < 0.5 ? '+' : '-';
    }

    operations.push(op);
    numbers.push(num);
    running = op === '+' ? running + num : running - num;
  }

  const parts = [String(numbers[0])];
  for (let i = 0; i < operations.length; i++) {
    parts.push(operations[i] === '+' ? '+' : '-');
    parts.push(String(numbers[i + 1]));
  }

  return { numbers, operations, answer: running, display: parts.join(' ') };
}

export function generateAddSubMixed(config: {
  minDigits: number;
  maxDigits: number;
  minNumbers: number;
  maxNumbers: number;
}): AddSubProblem {
  const rowCount = randInt(config.minNumbers, config.maxNumbers);
  const numbers: number[] = [];
  const operations: ('+' | '-')[] = [];

  const firstDigits = randInt(config.minDigits, config.maxDigits);
  numbers.push(randDigitNumber(firstDigits));
  let running = numbers[0];

  for (let i = 1; i < rowCount; i++) {
    const d = randInt(config.minDigits, config.maxDigits);
    const num = randDigitNumber(d);
    let op: '+' | '-';
    if (running - num < 0) {
      op = '+';
    } else {
      op = Math.random() < 0.5 ? '+' : '-';
    }
    operations.push(op);
    numbers.push(num);
    running = op === '+' ? running + num : running - num;
  }

  const parts = [String(numbers[0])];
  for (let i = 0; i < operations.length; i++) {
    parts.push(operations[i] === '+' ? '+' : '-');
    parts.push(String(numbers[i + 1]));
  }

  return { numbers, operations, answer: running, display: parts.join(' ') };
}

export interface MultiplyProblem {
  num1: number;
  num2: number;
  answer: number;
  display: string;
}

export function generateMultiplication(config: {
  digits1: number;
  digits2: number;
}): MultiplyProblem {
  const num1 = randDigitNumber(config.digits1);
  const num2 = randDigitNumber(config.digits2);
  return {
    num1,
    num2,
    answer: num1 * num2,
    display: `${num1.toLocaleString()} × ${num2.toLocaleString()}`,
  };
}

export interface DivisionProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  display: string;
}

export function generateDivision(config: {
  dividendDigits: number;
  divisorDigits: number;
  allowRemainder?: boolean;
}): DivisionProblem {
  const { dividendDigits, divisorDigits, allowRemainder = false } = config;

  if (!allowRemainder) {
    const divisor = randDigitNumber(divisorDigits);
    const maxQ = Math.pow(10, dividendDigits) - 1;
    const minQ = Math.pow(10, dividendDigits - 1);
    const qMin = Math.max(1, Math.ceil(minQ / divisor));
    const qMax = Math.floor(maxQ / divisor);
    if (qMin > qMax) {
      const q = randInt(2, 99);
      const dividend = divisor * q;
      return {
        dividend, divisor, quotient: q, remainder: 0,
        display: `${dividend.toLocaleString()} ÷ ${divisor.toLocaleString()}`,
      };
    }
    const quotient = randInt(qMin, qMax);
    const dividend = divisor * quotient;
    return {
      dividend, divisor, quotient, remainder: 0,
      display: `${dividend.toLocaleString()} ÷ ${divisor.toLocaleString()}`,
    };
  }

  const dividend = randDigitNumber(dividendDigits);
  const divisor = randDigitNumber(divisorDigits);
  const safeDivisor = divisor === 0 ? 1 : divisor;
  return {
    dividend,
    divisor: safeDivisor,
    quotient: Math.floor(dividend / safeDivisor),
    remainder: dividend % safeDivisor,
    display: `${dividend.toLocaleString()} ÷ ${safeDivisor.toLocaleString()}`,
  };
}

export function generateMemorySequence(count: number): number[] {
  return Array.from({ length: count }, () => randInt(0, 9));
}

export function generateNumberGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randInt(0, 9))
  );
}

export interface MentalMathStep {
  operation: '+' | '-' | '×';
  value: number;
}

export function generateMentalMathChain(length: number, maxDigits: number): {
  start: number;
  steps: MentalMathStep[];
  answer: number;
} {
  const max = maxDigits === 1 ? 9 : 99;
  let current = randInt(1, max);
  const start = current;
  const steps: MentalMathStep[] = [];
  const ops: MentalMathStep['operation'][] = ['+', '-', '×'];

  for (let i = 0; i < length; i++) {
    const op = ops[randInt(0, 2)];
    let value: number;

    if (op === '×') {
      value = randInt(2, 9);
      current = current * value;
    } else if (op === '-') {
      value = randInt(1, Math.min(current, max));
      current = current - value;
    } else {
      value = randInt(1, max);
      current = current + value;
    }
    steps.push({ operation: op, value });
  }

  return { start, steps, answer: current };
}

// --- Missing Operator ---

export interface MissingOperatorProblem {
  operands: number[];
  operators: string[];
  answer: number;
  display: string;
}

export function generateMissingOperatorProblem(
  operandDigits: number,
  operatorCount: number,
  maxOperand?: number
): MissingOperatorProblem {
  const ops = ['+', '-', '×', '÷'];
  const nextOperand = () =>
    maxOperand !== undefined ? randInt(1, maxOperand) : randDigitNumber(operandDigits);

  for (let attempt = 0; attempt < 50; attempt++) {
    const operands: number[] = [];
    const operators: string[] = [];

    for (let i = 0; i <= operatorCount; i++) {
      operands.push(nextOperand());
    }
    for (let i = 0; i < operatorCount; i++) {
      operators.push(ops[randInt(0, 3)]);
    }

    let result = operands[0];
    let valid = true;
    for (let i = 0; i < operators.length; i++) {
      const op = operators[i];
      const val = operands[i + 1];
      if (op === '+') result += val;
      else if (op === '-') result -= val;
      else if (op === '×') result *= val;
      else if (op === '÷') {
        if (val === 0 || result % val !== 0) { valid = false; break; }
        result /= val;
      }
    }

    if (valid && result >= 0 && Number.isInteger(result)) {
      const parts: string[] = [String(operands[0])];
      for (let i = 0; i < operators.length; i++) {
        parts.push('___');
        parts.push(String(operands[i + 1]));
      }
      parts.push('=', String(result));
      return { operands, operators, answer: result, display: parts.join(' ') };
    }
  }

  const operands = [randInt(1, 9), randInt(1, 9)];
  const operators = ['+'];
  return { operands, operators, answer: operands[0] + operands[1], display: `${operands[0]} ___ ${operands[1]} = ${operands[0] + operands[1]}` };
}

// --- Twenty Four Game ---

export interface TwentyFourProblem {
  numbers: number[];
  solutionHint: string;
}

function evaluate24(a: number, b: number, op: string): number | null {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') return b !== 0 && a % b === 0 ? a / b : null;
  return null;
}

function find24Solution(nums: number[]): string | null {
  const ops = ['+', '-', '*', '/'];
  const perms: number[][] = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      if (j !== i)
        for (let k = 0; k < 4; k++)
          if (k !== i && k !== j)
            for (let l = 0; l < 4; l++)
              if (l !== i && l !== j && l !== k)
                perms.push([i, j, k, l]);

  for (const p of perms) {
    const [w, x, y, z] = p.map(i => nums[i]);
    for (const o1 of ops) {
      for (const o2 of ops) {
        for (const o3 of ops) {
          // ((w o1 x) o2 y) o3 z
          const r1 = evaluate24(w, x, o1);
          if (r1 !== null) {
            const r2 = evaluate24(r1, y, o2);
            if (r2 !== null) {
              const r3 = evaluate24(r2, z, o3);
              if (r3 === 24) return `((${w} ${o1} ${x}) ${o2} ${y}) ${o3} ${z}`;
            }
          }
          // (w o1 (x o2 y)) o3 z
          const r4 = evaluate24(x, y, o2);
          if (r4 !== null) {
            const r5 = evaluate24(w, r4, o1);
            if (r5 !== null) {
              const r6 = evaluate24(r5, z, o3);
              if (r6 === 24) return `(${w} ${o1} (${x} ${o2} ${y})) ${o3} ${z}`;
            }
          }
        }
      }
    }
  }
  return null;
}

export function generateTwentyFourNumbers(maxNumber: number = 9): TwentyFourProblem {
  const cap = Math.max(1, Math.floor(maxNumber));
  for (let attempt = 0; attempt < 200; attempt++) {
    const numbers = [randInt(1, cap), randInt(1, cap), randInt(1, cap), randInt(1, cap)];
    const sol = find24Solution(numbers);
    if (sol) return { numbers, solutionHint: sol };
  }
  return { numbers: [1, 2, 3, 4], solutionHint: '1 * 2 * 3 * 4' };
}

// --- Flash Sum ---

export interface FlashSumProblem {
  numbers: number[];
  answer: number;
}

export function generateFlashSumProblem(count: number, maxDigits: number): FlashSumProblem {
  const numbers = Array.from({ length: count }, () => randDigitNumber(maxDigits));
  return { numbers, answer: numbers.reduce((a, b) => a + b, 0) };
}

// --- Greater/Less/Equal ---

export interface ComparisonProblem {
  leftDisplay: string;
  rightDisplay: string;
  leftValue: number;
  rightValue: number;
  correctAnswer: '>' | '<' | '=';
}

export function generateComparisonPair(complexity: number): ComparisonProblem {
  const digits = Math.max(1, complexity);

  const makeExpr = (): { display: string; value: number } => {
    const a = randDigitNumber(digits);
    const b = randDigitNumber(digits);
    const op = Math.random() < 0.5 ? '+' : '-';
    if (op === '-' && a < b) {
      return { display: `${a} + ${b}`, value: a + b };
    }
    return op === '+'
      ? { display: `${a} + ${b}`, value: a + b }
      : { display: `${a} - ${b}`, value: a - b };
  };

  const left = makeExpr();
  const right = makeExpr();
  const correctAnswer = left.value > right.value ? '>' : left.value < right.value ? '<' : '=';

  return { leftDisplay: left.display, rightDisplay: right.display, leftValue: left.value, rightValue: right.value, correctAnswer };
}

// --- Number Sequence ---

export interface SequenceProblem {
  sequence: number[];
  answer: number;
  rule: string;
}

export function generateNumberSequence(difficulty: number): SequenceProblem {
  const patterns: (() => SequenceProblem)[] = [
    // arithmetic
    () => {
      const start = randInt(1, 20);
      const diff = randInt(2, Math.max(3, difficulty * 3));
      const seq = Array.from({ length: 5 }, (_, i) => start + diff * i);
      return { sequence: seq.slice(0, 4), answer: seq[4], rule: `+${diff}` };
    },
    // geometric
    () => {
      const start = randInt(1, 5);
      const ratio = randInt(2, 4);
      const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i));
      return { sequence: seq.slice(0, 4), answer: seq[4], rule: `×${ratio}` };
    },
    // squares
    () => {
      const offset = randInt(1, 5);
      const seq = Array.from({ length: 5 }, (_, i) => (i + offset) * (i + offset));
      return { sequence: seq.slice(0, 4), answer: seq[4], rule: 'squares' };
    },
    // fibonacci-like
    () => {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      const seq = [a, b];
      for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]);
      return { sequence: seq.slice(0, 5), answer: seq[5], rule: 'fibonacci' };
    },
    // alternating add
    () => {
      const start = randInt(1, 10);
      const d1 = randInt(2, 6);
      const d2 = randInt(1, 4);
      const seq = [start];
      for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 === 1 ? d1 : d2));
      return { sequence: seq.slice(0, 5), answer: seq[5], rule: `+${d1}/+${d2}` };
    },
  ];

  const maxIdx = Math.min(patterns.length, 1 + difficulty);
  return patterns[randInt(0, maxIdx - 1)]();
}

// --- Pair Match Board ---

export interface PairMatchCard {
  id: number;
  value: number;
  pairId: number;
}

export function generatePairMatchBoard(pairCount: number, targetSum: number): PairMatchCard[] {
  const cards: PairMatchCard[] = [];
  for (let i = 0; i < pairCount; i++) {
    const a = randInt(1, targetSum - 1);
    const b = targetSum - a;
    cards.push({ id: i * 2, value: a, pairId: i });
    cards.push({ id: i * 2 + 1, value: b, pairId: i });
  }
  // shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// --- Number Sorting ---

export interface SortingRound {
  numbers: number[];
  sorted: number[];
  direction: 'asc' | 'desc';
}

export function generateSortingRound(count: number, maxDigits: number, maxValue?: number): SortingRound {
  const set = new Set<number>();
  if (maxValue !== undefined) {
    while (set.size < count) set.add(randInt(1, maxValue));
  } else {
    while (set.size < count) set.add(randDigitNumber(maxDigits));
  }
  const numbers = Array.from(set);
  // shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  const direction: 'asc' | 'desc' = Math.random() < 0.5 ? 'asc' : 'desc';
  const sorted = [...numbers].sort((a, b) => direction === 'asc' ? a - b : b - a);
  return { numbers, sorted, direction };
}

// ── NEW GENERATORS (18 games) ───────────────────────────────

export interface RunningTotalProblem {
  operations: { op: '+' | '-'; value: number }[];
  answer: number;
}

export function generateRunningTotalProblem(count: number, maxDigits: number): RunningTotalProblem {
  const operations: { op: '+' | '-'; value: number }[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const op: '+' | '-' = i === 0 || Math.random() < 0.5 ? '+' : '-';
    const value = randDigitNumber(maxDigits);
    operations.push({ op, value });
    total = op === '+' ? total + value : total - value;
  }
  return { operations, answer: total };
}

export interface EstimationProblem {
  expression: string;
  exactAnswer: number;
  choices: number[];
  correctIndex: number;
}

export function generateEstimationProblem(maxDigits: number): EstimationProblem {
  const a = randDigitNumber(maxDigits);
  const b = randDigitNumber(Math.max(1, maxDigits - 1));
  const ops = ['+', '-', '×'] as const;
  const op = ops[randInt(0, 2)];
  let exactAnswer: number;
  let expression: string;
  if (op === '×') {
    exactAnswer = a * b;
    expression = `${a} × ${b}`;
  } else if (op === '+') {
    exactAnswer = a + b;
    expression = `${a} + ${b}`;
  } else {
    exactAnswer = a - b;
    expression = `${a} - ${b}`;
  }
  const correctIndex = randInt(0, 3);
  const choices: number[] = [];
  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      choices.push(exactAnswer);
    } else {
      const offset = randInt(1, Math.max(10, Math.abs(Math.floor(exactAnswer * 0.3))));
      choices.push(exactAnswer + (Math.random() < 0.5 ? offset : -offset));
    }
  }
  return { expression, exactAnswer, choices, correctIndex };
}

export interface PercentageProblem {
  percentage: number;
  baseValue: number;
  answer: number;
  display: string;
}

export function generatePercentageProblem(maxBase: number, percentages: number[]): PercentageProblem {
  const percentage = percentages[randInt(0, percentages.length - 1)];
  const baseValue = randInt(10, maxBase);
  const roundedBase = Math.round(baseValue / 10) * 10;
  const answer = (percentage / 100) * roundedBase;
  return { percentage, baseValue: roundedBase, answer, display: `${percentage}% of ${roundedBase}` };
}

export interface FractionProblem {
  numerator: number;
  denominator: number;
  answer: number;
  display: string;
}

export function generateFractionProblem(maxDenominator: number): FractionProblem {
  const denominator = randInt(2, maxDenominator);
  const numerator = randInt(1, denominator - 1);
  const answer = Math.round((numerator / denominator) * 1000) / 1000;
  return { numerator, denominator, answer, display: `${numerator}/${denominator}` };
}

export interface DoubleHalveProblem {
  start: number;
  steps: ('double' | 'halve')[];
  answer: number;
}

export function generateDoubleHalveChain(stepCount: number, maxStart: number): DoubleHalveProblem {
  let start = randInt(2, maxStart);
  if (start % 2 !== 0) start++;
  let current = start;
  const steps: ('double' | 'halve')[] = [];
  for (let i = 0; i < stepCount; i++) {
    const action: 'double' | 'halve' = i % 2 === 0 ? 'double' : 'halve';
    steps.push(action);
    current = action === 'double' ? current * 2 : Math.floor(current / 2);
  }
  return { start, steps, answer: current };
}

export interface TimesTableProblem {
  num1: number;
  num2: number;
  answer: number;
  display: string;
}

export function generateTimesTableProblem(maxFactor: number): TimesTableProblem {
  const num1 = randInt(2, maxFactor);
  const num2 = randInt(2, maxFactor);
  return { num1, num2, answer: num1 * num2, display: `${num1} × ${num2}` };
}

export interface DigitSpanProblem {
  original: number[];
  transformed: number[];
}

export function generateDigitSpanOperation(digits: number): DigitSpanProblem {
  const original = Array.from({ length: digits }, () => randInt(0, 8));
  const transformed = [...original].reverse().map((d) => (d + 1) % 10);
  return { original, transformed };
}

export interface NBackSequence {
  sequence: number[];
  nBack: number;
  matchPositions: number[];
}

export function generateNBackSequence(length: number, nBack: number): NBackSequence {
  const sequence: number[] = [];
  const matchPositions: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= nBack && Math.random() < 0.3) {
      sequence.push(sequence[i - nBack]);
      matchPositions.push(i);
    } else {
      sequence.push(randInt(1, 9));
    }
  }
  return { sequence, nBack, matchPositions };
}

export interface WhatChangedProblem {
  original: number[];
  changed: number[];
  changedPositions: number[];
}

export function generateWhatChangedGrid(size: number, changesCount: number): WhatChangedProblem {
  const original = Array.from({ length: size * size }, () => randInt(1, 9));
  const changed = [...original];
  const positions = Array.from({ length: original.length }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const changedPositions = positions.slice(0, changesCount);
  for (const pos of changedPositions) {
    let newVal;
    do { newVal = randInt(1, 9); } while (newVal === original[pos]);
    changed[pos] = newVal;
  }
  return { original, changed, changedPositions: changedPositions.sort((a, b) => a - b) };
}

export interface MagicSquareProblem {
  size: number;
  solution: number[][];
  blanks: [number, number][];
  magicSum: number;
}

export function generateMagicSquare(): MagicSquareProblem {
  const base = [
    [2, 7, 6],
    [9, 5, 1],
    [4, 3, 8],
  ];
  const transforms = [
    (g: number[][]) => g,
    (g: number[][]) => g.map((r) => [...r].reverse()),
    (g: number[][]) => g[0].map((_, c) => g.map((r) => r[c])),
    (g: number[][]) => [...g].reverse(),
  ];
  const solution = transforms[randInt(0, 3)](base.map((r) => [...r]));
  const allPos: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) allPos.push([r, c]);
  for (let i = allPos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPos[i], allPos[j]] = [allPos[j], allPos[i]];
  }
  const blanks = allPos.slice(0, randInt(3, 5));
  return { size: 3, solution, blanks, magicSum: 15 };
}

export interface OddOneOutProblem {
  numbers: number[];
  oddIndex: number;
  rule: string;
}

export function generateOddOneOut(): OddOneOutProblem {
  const ruleType = randInt(0, 2);
  if (ruleType === 0) {
    const evens = Array.from({ length: 4 }, () => randInt(1, 25) * 2);
    const odd = randInt(1, 25) * 2 - 1;
    const oddIndex = randInt(0, 4);
    const numbers = [...evens];
    numbers.splice(oddIndex, 0, odd);
    return { numbers, oddIndex, rule: 'Not even' };
  } else if (ruleType === 1) {
    const multiples = Array.from({ length: 4 }, () => randInt(1, 15) * 5);
    let outlier;
    do { outlier = randInt(1, 75); } while (outlier % 5 === 0);
    const oddIndex = randInt(0, 4);
    const numbers = [...multiples];
    numbers.splice(oddIndex, 0, outlier);
    return { numbers, oddIndex, rule: 'Not a multiple of 5' };
  } else {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const picked = [];
    const used = new Set<number>();
    while (picked.length < 4) {
      const p = primes[randInt(0, primes.length - 1)];
      if (!used.has(p)) { picked.push(p); used.add(p); }
    }
    const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
    const outlier = composites[randInt(0, composites.length - 1)];
    const oddIndex = randInt(0, 4);
    const numbers = [...picked];
    numbers.splice(oddIndex, 0, outlier);
    return { numbers, oddIndex, rule: 'Not prime' };
  }
}

export interface BaseConversionProblem {
  decimalValue: number;
  fromBase: 'decimal' | 'binary' | 'hex';
  toBase: 'decimal' | 'binary' | 'hex';
  question: string;
  answer: string;
}

export function generateBaseConversion(maxDecimal: number): BaseConversionProblem {
  const decimalValue = randInt(2, maxDecimal);
  const conversions = [
    { from: 'decimal' as const, to: 'binary' as const },
    { from: 'binary' as const, to: 'decimal' as const },
    { from: 'decimal' as const, to: 'hex' as const },
    { from: 'hex' as const, to: 'decimal' as const },
  ];
  const conv = conversions[randInt(0, conversions.length - 1)];
  let question: string;
  let answer: string;
  if (conv.from === 'decimal' && conv.to === 'binary') {
    question = `${decimalValue} to binary`;
    answer = decimalValue.toString(2);
  } else if (conv.from === 'binary' && conv.to === 'decimal') {
    question = `${decimalValue.toString(2)} to decimal`;
    answer = String(decimalValue);
  } else if (conv.from === 'decimal' && conv.to === 'hex') {
    question = `${decimalValue} to hex`;
    answer = decimalValue.toString(16).toUpperCase();
  } else {
    question = `${decimalValue.toString(16).toUpperCase()} to decimal`;
    answer = String(decimalValue);
  }
  return { decimalValue, fromBase: conv.from, toBase: conv.to, question, answer };
}

export function generatePrimeOrNotProblem(maxNumber: number): { number: number; isPrime: boolean } {
  const n = randInt(2, maxNumber);
  let isPrime = true;
  if (n < 2) isPrime = false;
  else {
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) { isPrime = false; break; }
    }
  }
  return { number: n, isPrime };
}

export interface CountdownProblem {
  numbers: number[];
  target: number;
  solution: string;
}

function buildCountdownSolution(nums: number[]): { target: number; solution: string } | null {
  if (nums.length === 1) return { target: nums[0], solution: String(nums[0]) };

  for (let attempt = 0; attempt < 200; attempt++) {
    const indices = [...Array(nums.length).keys()];
    for (let k = indices.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [indices[k], indices[j]] = [indices[j], indices[k]];
    }
    const shuffled = indices.map(i => nums[i]);

    let result = shuffled[0];
    let expr = String(shuffled[0]);
    let valid = true;

    for (let i = 1; i < shuffled.length; i++) {
      const n = shuffled[i];
      const op = randInt(0, 3);
      switch (op) {
        case 0:
          expr = `${expr} + ${n}`;
          result = result + n;
          break;
        case 1:
          if (result - n > 0) {
            expr = `${expr} - ${n}`;
            result = result - n;
          } else {
            expr = `${n} - (${expr})`;
            result = n - result;
          }
          break;
        case 2:
          expr = `(${expr}) * ${n}`;
          result = result * n;
          break;
        case 3:
          if (n !== 0 && result % n === 0) {
            expr = `(${expr}) / ${n}`;
            result = result / n;
          } else if (result !== 0 && n % result === 0) {
            expr = `${n} / (${expr})`;
            result = Math.floor(n / result);
          } else {
            expr = `${expr} + ${n}`;
            result = result + n;
          }
          break;
      }
      if (!Number.isFinite(result) || result <= 0) { valid = false; break; }
    }

    if (valid && Number.isInteger(result) && result >= 10 && result <= 999) {
      return { target: result, solution: `${expr} = ${result}` };
    }
  }
  return null;
}

export function generateCountdownProblem(numberCount: number): CountdownProblem {
  const largePool = [25, 50, 75, 100];

  for (let attempt = 0; attempt < 50; attempt++) {
    const numbers: number[] = [];
    const largePick = randInt(0, 2);
    for (let i = 0; i < largePick; i++) {
      numbers.push(largePool[randInt(0, largePool.length - 1)]);
    }
    while (numbers.length < numberCount) {
      numbers.push(randInt(1, 10));
    }

    const built = buildCountdownSolution(numbers);
    if (built) {
      return { numbers, target: built.target, solution: built.solution };
    }
  }

  const fallbackNumbers = [10, 5, 3, 2].slice(0, numberCount);
  return {
    numbers: fallbackNumbers,
    target: 25,
    solution: '(10 - 5) * (3 + 2) = 25',
  };
}

export interface NumberBingoBoard {
  grid: number[];
  questions: { expression: string; answer: number }[];
}

export function generateNumberBingoBoard(gridSize: number): NumberBingoBoard {
  const total = gridSize * gridSize;
  const questions: { expression: string; answer: number }[] = [];
  const answers = new Set<number>();
  while (questions.length < total) {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    const ans = a * b;
    if (!answers.has(ans)) {
      answers.add(ans);
      questions.push({ expression: `${a} × ${b}`, answer: ans });
    }
  }
  const grid = questions.map((q) => q.answer);
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  return { grid, questions };
}

export interface ClosestTo100Problem {
  numbers: number[];
  target: number;
}

export function generateClosestTo100Problem(numberCount: number, target: number): ClosestTo100Problem {
  const numbers = Array.from({ length: numberCount }, () => randInt(1, 15));
  return { numbers, target };
}

export interface NumberCrosswordProblem {
  acrossClue: string;
  acrossAnswer: number;
  downClue: string;
  downAnswer: number;
}

export function generateNumberCrossword(gridSize: number = 4): NumberCrosswordProblem {
  const g = Math.min(5, Math.max(3, Math.round(gridSize)));
  const ranges =
    g <= 3
      ? { a1: [5, 25] as const, a2: [2, 8] as const, d1: [5, 25] as const, d2: [2, 8] as const }
      : g === 4
        ? { a1: [10, 50] as const, a2: [2, 10] as const, d1: [10, 50] as const, d2: [2, 10] as const }
        : { a1: [15, 99] as const, a2: [2, 12] as const, d1: [15, 99] as const, d2: [2, 12] as const };
  const a1 = randInt(ranges.a1[0], ranges.a1[1]);
  const a2 = randInt(ranges.a2[0], ranges.a2[1]);
  const acrossAnswer = a1 * a2;
  const d1 = randInt(ranges.d1[0], ranges.d1[1]);
  const d2 = randInt(ranges.d2[0], ranges.d2[1]);
  const downAnswer = d1 + d2;
  return {
    acrossClue: `${a1} × ${a2}`,
    acrossAnswer,
    downClue: `${d1} + ${d2}`,
    downAnswer,
  };
}

export interface KenKenCage {
  cells: [number, number][];
  target: number;
  operation: '+' | '-' | '×' | '÷';
}

export interface KenKenPuzzle {
  size: number;
  solution: number[][];
  cages: KenKenCage[];
}

export function generateKenKenPuzzle(size: number): KenKenPuzzle {
  const solution: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(((r + c) % size) + 1);
    }
    solution.push(row);
  }
  const cages: KenKenCage[] = [];
  const used = Array.from({ length: size }, () => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (used[r][c]) continue;
      const cells: [number, number][] = [[r, c]];
      used[r][c] = true;
      if (c + 1 < size && !used[r][c + 1] && Math.random() < 0.6) {
        cells.push([r, c + 1]);
        used[r][c + 1] = true;
      }
      if (cells.length === 1) {
        cages.push({ cells, target: solution[r][c], operation: '+' });
      } else {
        const v1 = solution[cells[0][0]][cells[0][1]];
        const v2 = solution[cells[1][0]][cells[1][1]];
        const op = Math.random() < 0.5 ? '+' : '×';
        const target = op === '+' ? v1 + v2 : v1 * v2;
        cages.push({ cells, target, operation: op as '+' | '×' });
      }
    }
  }
  return { size, solution, cages };
}

// ── TYPES (additional generators) ──────────────────────────

export interface SquareRootProblem {
  number: number;
  answer: number; // Math.sqrt rounded to 2 decimal places
}

export interface FactoringProblem {
  number: number;
  factors: number[]; // sorted prime factors with repetition, e.g. [2,2,3,7]
}

export interface ComplementProblem {
  number: number;
  target: number; // 100 or 1000
  answer: number; // target - number
}

export interface PercentageChangeProblem {
  from: number;
  to: number;
  answer: number; // percentage change rounded to 1 decimal
  direction: 'increase' | 'decrease';
  display: string;
}

export interface GcdLcmProblem {
  a: number;
  b: number;
  mode: 'gcd' | 'lcm';
  answer: number;
  display: string;
}

export interface DigitSumProblem {
  number: number;
  answer: number; // digital root
}

export interface VedicProblem {
  type: string;
  question: string;
  answer: number;
  explanation: string;
}

export interface PowerOf2Problem {
  mode: 'value-from-exp' | 'exp-from-value';
  base: number; // always 2
  exponent: number;
  value: number;
  question: string;
  answer: number;
}

export interface DualNBackStep {
  number: number;
  position: number; // 0-8 for 3x3 grid
}

export interface DualNBackProblem {
  sequence: DualNBackStep[];
  nBack: number;
  numberMatches: boolean[];
  positionMatches: boolean[];
}

export interface AuditorySequenceProblem {
  digits: number[];
}

export interface CalendarProblem {
  date: { year: number; month: number; day: number };
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  display: string; // e.g. "March 15, 2019"
}

export interface RomanNumeralProblem {
  mode: 'to-roman' | 'from-roman';
  decimal: number;
  roman: string;
  question: string;
  answer: string;
}

export interface AnagramProblem {
  digits: number[];
  mode: 'smallest' | 'largest';
  answer: number;
  display: string;
}

export interface MatrixPatternProblem {
  grid: (number | null)[][]; // null = missing cell
  missingRow: number;
  missingCol: number;
  answer: number;
  fullGrid: number[][];
}

// ── GENERATORS (additional) ────────────────────────────────

export function generateSquareRootProblem(maxN: number = 400): SquareRootProblem {
  const n = randInt(1, Math.max(1, maxN));
  return { number: n, answer: Math.round(Math.sqrt(n) * 100) / 100 };
}

export function generateFactoringProblem(maxN: number = 100): FactoringProblem {
  const clamped = Math.max(4, Math.min(maxN, 10000));
  // Generate a composite number
  for (let attempt = 0; attempt < 200; attempt++) {
    const n = randInt(4, clamped);
    const factors = primeFactors(n);
    if (factors.length >= 2) return { number: n, factors };
  }
  return { number: 12, factors: [2, 2, 3] };
}

function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let rem = n;
  for (let d = 2; d * d <= rem; d++) {
    while (rem % d === 0) {
      factors.push(d);
      rem /= d;
    }
  }
  if (rem > 1) factors.push(rem);
  return factors;
}

export function generateComplementProblem(target: number = 100): ComplementProblem {
  const t = target === 1000 ? 1000 : target === 10 ? 10 : 100;
  const n = t <= 1 ? 0 : randInt(1, t - 1);
  return { number: n, target: t, answer: t - n };
}

export function generatePercentageChangeProblem(maxVal: number = 200): PercentageChangeProblem {
  const from = randInt(10, Math.max(20, maxVal));
  const changePct = randInt(-50, 80);
  const to = Math.round(from * (1 + changePct / 100));
  const actual = to <= 0 ? from + randInt(1, 20) : to;
  const pct = Math.round(((actual - from) / from) * 1000) / 10;
  const dir = pct >= 0 ? 'increase' : 'decrease';
  return {
    from,
    to: actual,
    answer: Math.round(Math.abs(pct) * 10) / 10,
    direction: dir,
    display: `${from} → ${actual}`,
  };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function generateGcdLcmProblem(maxN: number = 100, mode?: 'gcd' | 'lcm'): GcdLcmProblem {
  const m = mode || (Math.random() < 0.5 ? 'gcd' : 'lcm');
  const a = randInt(2, Math.max(4, maxN));
  const b = randInt(2, Math.max(4, maxN));
  const answer = m === 'gcd' ? gcd(a, b) : lcm(a, b);
  return { a, b, mode: m, answer, display: `${m.toUpperCase()}(${a}, ${b})` };
}

export function generateDigitSumProblem(maxDigits: number = 6): DigitSumProblem {
  const digits = Math.max(2, Math.min(maxDigits, 10));
  const n = randInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
  let sum = n;
  while (sum >= 10) {
    sum = String(sum)
      .split('')
      .reduce((a, d) => a + Number(d), 0);
  }
  return { number: n, answer: sum };
}

export function generateVedicProblem(type?: string): VedicProblem {
  const types = [
    'ekadhikena-square-5',
    'nikhilam-multiply-near-base',
    'ekanyunena-multiply-9s',
    'multiply-by-11',
    'yavadunam-square-near-base',
    'urdhva-tiryagbhyam',
    'anurupyena',
    'puranapuranabhyam',
  ];
  const t = type && types.includes(type) ? type : types[randInt(0, types.length - 1)];

  switch (t) {
    case 'ekadhikena-square-5': {
      const tens = randInt(1, 19);
      const n = tens * 10 + 5;
      const leftPart = tens * (tens + 1);
      return {
        type: t,
        question: `${n}²`,
        answer: n * n,
        explanation:
          `Ekadhikena: Square of number ending in 5\n` +
          `Step 1: Digits before 5 → a = ${tens}\n` +
          `Step 2: a × (a+1) = ${tens} × ${tens + 1} = ${leftPart}\n` +
          `Step 3: Append 25 → ${leftPart}25\n` +
          `Answer: ${n}² = ${n * n}`,
      };
    }
    case 'nikhilam-multiply-near-base': {
      const base = Math.random() < 0.5 ? 100 : 1000;
      const a = base - randInt(1, Math.min(15, base - 1));
      const b = base - randInt(1, Math.min(15, base - 1));
      const dA = base - a;
      const dB = base - b;
      const leftPart = a - dB;
      const rightPart = dA * dB;
      const padWidth = base === 100 ? 2 : 3;
      const rightStr = String(rightPart).padStart(padWidth, '0');
      return {
        type: t,
        question: `${a} × ${b}`,
        answer: a * b,
        explanation:
          `Nikhilam: Multiply near base ${base}\n` +
          `Step 1: Deficiencies: ${a} → ${dA}, ${b} → ${dB}\n` +
          `Step 2: Cross-subtract: ${a} − ${dB} = ${leftPart}\n` +
          `Step 3: Deficiency product: ${dA} × ${dB} = ${rightPart} → ${rightStr}\n` +
          `Step 4: Combine: ${leftPart}|${rightStr} = ${a * b}`,
      };
    }
    case 'ekanyunena-multiply-9s': {
      const n = randInt(11, 99);
      const nines = 99;
      const leftPart = n - 1;
      const rightPart = 100 - n;
      return {
        type: t,
        question: `${n} × ${nines}`,
        answer: n * nines,
        explanation:
          `Ekanyunena: Multiply by 99 (one less than 100)\n` +
          `Step 1: Left part = n − 1 = ${n} − 1 = ${leftPart}\n` +
          `Step 2: Right part = 100 − n = 100 − ${n} = ${rightPart}\n` +
          `Step 3: Combine: ${leftPart}|${String(rightPart).padStart(2, '0')} = ${n * nines}`,
      };
    }
    case 'multiply-by-11': {
      const n = randInt(11, 99);
      const d1 = Number(String(n)[0]);
      const d2 = Number(String(n)[1]);
      const mid = d1 + d2;
      const result = n * 11;
      const carryNote = mid >= 10 ? `\nNote: ${mid} ≥ 10, so carry 1 to hundreds` : '';
      return {
        type: t,
        question: `${n} × 11`,
        answer: result,
        explanation:
          `Multiply by 11: insert sum of digits\n` +
          `Step 1: Digits of ${n}: ${d1} and ${d2}\n` +
          `Step 2: Sum = ${d1} + ${d2} = ${mid}\n` +
          `Step 3: Insert between digits: ${d1}|${mid}|${d2}${carryNote}\n` +
          `Answer: ${result}`,
      };
    }
    case 'yavadunam-square-near-base': {
      const base = 100;
      const diff = randInt(-12, 12);
      if (diff === 0) {
        return {
          type: t,
          question: '100²',
          answer: 10000,
          explanation: 'Yavadunam: 100 is exactly the base\nDeficiency = 0\n100² = 10000',
        };
      }
      const n = base + diff;
      const label = diff > 0 ? 'excess' : 'deficiency';
      const absDiff = Math.abs(diff);
      const leftPart = diff > 0 ? n + absDiff : n - absDiff;
      const rightPart = absDiff * absDiff;
      const rightStr = String(rightPart).padStart(2, '0');
      const op = diff > 0 ? '+' : '−';
      return {
        type: t,
        question: `${n}²`,
        answer: n * n,
        explanation:
          `Yavadunam: Square near base ${base}\n` +
          `Step 1: ${label} = ${absDiff}\n` +
          `Step 2: Left part: ${n} ${op} ${absDiff} = ${leftPart}\n` +
          `Step 3: Right part: ${absDiff}² = ${rightPart} → ${rightStr}\n` +
          `Step 4: Combine: ${leftPart}|${rightStr} = ${n * n}`,
      };
    }
    case 'urdhva-tiryagbhyam': {
      const a = randInt(11, 99);
      const b = randInt(11, 99);
      const a1 = Math.floor(a / 10), a2 = a % 10;
      const b1 = Math.floor(b / 10), b2 = b % 10;
      const right = a2 * b2;
      const cross = a1 * b2 + a2 * b1;
      const left = a1 * b1;
      const r0 = right % 10;
      const c1 = Math.floor(right / 10);
      const mid = cross + c1;
      const m0 = mid % 10;
      const c2 = Math.floor(mid / 10);
      const l = left + c2;
      return {
        type: t,
        question: `${a} × ${b}`,
        answer: a * b,
        explanation:
          `Urdhva-Tiryagbhyam: Vertically & crosswise\n` +
          `Digits: ${a} → (${a1},${a2}), ${b} → (${b1},${b2})\n` +
          `Step 1 (Right): ${a2}×${b2} = ${right} → write ${r0}, carry ${c1}\n` +
          `Step 2 (Cross): ${a1}×${b2} + ${a2}×${b1} = ${a1*b2}+${a2*b1} = ${cross}, +carry = ${mid} → write ${m0}, carry ${c2}\n` +
          `Step 3 (Left): ${a1}×${b1} = ${left}, +carry = ${l}\n` +
          `Answer: ${l}${m0}${r0} = ${a * b}`,
      };
    }
    case 'anurupyena': {
      const scalings = [
        { factor: 25, friendly: 100, div: 4, label: '×25 = ×100÷4' },
        { factor: 50, friendly: 100, div: 2, label: '×50 = ×100÷2' },
        { factor: 125, friendly: 1000, div: 8, label: '×125 = ×1000÷8' },
        { factor: 5, friendly: 10, div: 2, label: '×5 = ×10÷2' },
      ];
      const s = scalings[randInt(0, scalings.length - 1)];
      const n = randInt(4, 99);
      const bigProduct = n * s.friendly;
      const answer = bigProduct / s.div;
      return {
        type: t,
        question: `${n} × ${s.factor}`,
        answer,
        explanation:
          `Anurupyena: Scale proportionately (${s.label})\n` +
          `Step 1: ${n} × ${s.friendly} = ${bigProduct}\n` +
          `Step 2: ${bigProduct} ÷ ${s.div} = ${answer}\n` +
          `Answer: ${n} × ${s.factor} = ${answer}`,
      };
    }
    case 'puranapuranabhyam': {
      const bases = [30, 50, 70, 100, 200];
      const base = bases[randInt(0, bases.length - 1)];
      const diff = randInt(1, Math.min(5, base - 1));
      const sign = Math.random() < 0.5 ? 1 : -1;
      const n = base + sign * diff;
      const op = sign > 0 ? '+' : '−';
      const answer = n * n;
      const baseSq = base * base;
      const crossTerm = 2 * base * diff * sign;
      const diffSq = diff * diff;
      return {
        type: t,
        question: `${n}²`,
        answer,
        explanation:
          `Puranapuranabhyam: Complete to ${base}\n` +
          `Step 1: ${n} = ${base} ${op} ${diff}\n` +
          `Step 2: ${base}² = ${baseSq}\n` +
          `Step 3: 2 × ${base} × ${diff} = ${2 * base * diff} (${sign > 0 ? 'add' : 'subtract'})\n` +
          `Step 4: ${diff}² = ${diffSq} (add)\n` +
          `Step 5: ${baseSq} ${sign > 0 ? '+' : '−'} ${2 * base * diff} + ${diffSq} = ${baseSq + crossTerm + diffSq}\n` +
          `Answer: ${n}² = ${answer}`,
      };
    }
    default:
      return {
        type: 'multiply-by-11',
        question: '23 × 11',
        answer: 253,
        explanation: 'Multiply by 11: insert sum of digits\nDigits: 2 and 3\nSum = 5\nInsert: 2|5|3 = 253',
      };
  }
}

export function generatePowerOf2Problem(maxExp: number = 16, mode?: string): PowerOf2Problem {
  const exp = randInt(0, Math.min(maxExp, 30));
  const val = Math.pow(2, exp);
  const m =
    mode === 'value-from-exp' || mode === 'exp-from-value'
      ? mode
      : Math.random() < 0.5
        ? 'value-from-exp'
        : 'exp-from-value';

  if (m === 'value-from-exp') {
    return { mode: m, base: 2, exponent: exp, value: val, question: `2^${exp} = ?`, answer: val };
  }
  return { mode: m, base: 2, exponent: exp, value: val, question: `${val} = 2^?`, answer: exp };
}

export function generateDualNBackSequence(length: number = 20, nBack: number = 2): DualNBackProblem {
  const seq: DualNBackStep[] = [];
  const numMatches: boolean[] = [];
  const posMatches: boolean[] = [];

  for (let i = 0; i < length; i++) {
    let num = randInt(1, 9);
    let pos = randInt(0, 8);

    // ~30% chance of match
    if (i >= nBack) {
      if (Math.random() < 0.3) num = seq[i - nBack].number;
      if (Math.random() < 0.3) pos = seq[i - nBack].position;
    }

    seq.push({ number: num, position: pos });
    numMatches.push(i >= nBack && num === seq[i - nBack].number);
    posMatches.push(i >= nBack && pos === seq[i - nBack].position);
  }

  return { sequence: seq, nBack, numberMatches: numMatches, positionMatches: posMatches };
}

export function generateAuditorySequence(length: number = 5): AuditorySequenceProblem {
  const digits = Array.from({ length: Math.max(1, length) }, () => randInt(0, 9));
  return { digits };
}

export function generateCalendarProblem(yearRange: [number, number] = [1900, 2099]): CalendarProblem {
  const year = randInt(yearRange[0], yearRange[1]);
  const month = randInt(1, 12);
  const maxDay = new Date(year, month, 0).getDate();
  const day = randInt(1, maxDay);
  const date = new Date(year, month - 1, day);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return {
    date: { year, month, day },
    dayOfWeek: days[date.getDay()],
    display: `${months[month - 1]} ${day}, ${year}`,
  };
}

export function generateRomanProblem(maxVal: number = 3999, mode?: string): RomanNumeralProblem {
  const n = randInt(1, Math.min(maxVal, 3999));
  const roman = toRoman(n);
  const m =
    mode === 'to-roman' || mode === 'from-roman' ? mode : Math.random() < 0.5 ? 'to-roman' : 'from-roman';

  if (m === 'to-roman') {
    return { mode: m, decimal: n, roman, question: `${n} = ?`, answer: roman };
  }
  return { mode: m, decimal: n, roman, question: `${roman} = ?`, answer: String(n) };
}

function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  let n = num;
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

export function generateAnagramProblem(
  minDigits: number = 3,
  maxDigits: number = 6,
  mode?: string
): AnagramProblem {
  const len = randInt(Math.max(2, minDigits), Math.max(minDigits, maxDigits));
  const digits: number[] = [];
  digits.push(randInt(1, 9)); // first digit non-zero
  for (let i = 1; i < len; i++) digits.push(randInt(0, 9));
  // shuffle
  for (let i = digits.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  const m =
    mode === 'smallest' || mode === 'largest' ? mode : Math.random() < 0.5 ? 'smallest' : 'largest';
  const sorted = [...digits].sort((a, b) => (m === 'smallest' ? a - b : b - a));
  // For smallest, ensure no leading zero
  if (m === 'smallest' && sorted[0] === 0) {
    const firstNonZero = sorted.findIndex((d) => d > 0);
    if (firstNonZero > 0) [sorted[0], sorted[firstNonZero]] = [sorted[firstNonZero], sorted[0]];
  }
  const answer = Number(sorted.join(''));
  return { digits, mode: m, answer, display: digits.join(' ') };
}

export function generateMatrixPattern(size: number = 3): MatrixPatternProblem {
  const s = Math.max(3, Math.min(size, 5));
  const fullGrid: number[][] = [];
  const baseRow = randInt(1, 5);
  const addPerCol = randInt(1, 4);
  const addPerRow = randInt(1, 4);

  for (let r = 0; r < s; r++) {
    const row: number[] = [];
    for (let c = 0; c < s; c++) {
      row.push(baseRow + r * addPerRow + c * addPerCol);
    }
    fullGrid.push(row);
  }

  const mr = randInt(0, s - 1);
  const mc = randInt(0, s - 1);
  const answer = fullGrid[mr][mc];
  const grid = fullGrid.map((row, r) => row.map((v, c) => (r === mr && c === mc ? null : v)));

  return { grid, missingRow: mr, missingCol: mc, answer, fullGrid };
}
