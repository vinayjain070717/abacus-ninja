import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

type RawOp = '+' | '-' | '*' | '/';

const DIFF_PARAMS = {
  easy: { maxVal: 20, ops: ['+'] as RawOp[] },
  medium: { maxVal: 50, ops: ['+', '-', '*'] as RawOp[] },
  hard: { maxVal: 100, ops: ['+', '-', '*', '/'] as RawOp[] },
} as const;

interface Problem {
  display: string;
  answer: number;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function toSymbol(op: RawOp): string {
  if (op === '*') return '×';
  if (op === '/') return '÷';
  if (op === '-') return '−';
  return '+';
}

export function generateMissingDigitProblem(maxVal: number, ops: RawOp[]): Problem {
  for (let attempt = 0; attempt < 100; attempt++) {
    const op = ops[randomInt(0, ops.length - 1)]!;
    const hole = randomInt(0, 2);
    const sym = toSymbol(op);

    if (op === '+') {
      const a = randomInt(1, maxVal);
      const b = randomInt(1, maxVal);
      const res = a + b;
      if (hole === 0) {
        if (res - b >= 1 && res - b <= maxVal) return { display: `? ${sym} ${b} = ${res}`, answer: res - b };
      } else if (hole === 1) {
        if (res - a >= 1 && res - a <= maxVal) return { display: `${a} ${sym} ? = ${res}`, answer: res - a };
      } else {
        return { display: `${a} ${sym} ${b} = ?`, answer: res };
      }
    }

    if (op === '-') {
      let a = randomInt(1, maxVal);
      let b = randomInt(1, maxVal);
      if (b > a) [a, b] = [b, a];
      const res = a - b;
      if (res < 0) continue;
      if (hole === 0) {
        const x = res + b;
        if (x >= 1 && x <= maxVal) return { display: `? ${sym} ${b} = ${res}`, answer: x };
      } else if (hole === 1) {
        const x = a - res;
        if (x >= 1 && x <= maxVal) return { display: `${a} ${sym} ? = ${res}`, answer: x };
      } else {
        return { display: `${a} ${sym} ${b} = ?`, answer: res };
      }
    }

    if (op === '*') {
      const cap = Math.min(12, maxVal);
      const a = randomInt(2, Math.max(2, cap));
      const b = randomInt(2, Math.max(2, cap));
      const res = a * b;
      if (hole === 0) {
        if (res % b === 0) {
          const x = res / b;
          if (x >= 1 && x <= maxVal) return { display: `? ${sym} ${b} = ${res}`, answer: x };
        }
      } else if (hole === 1) {
        if (res % a === 0) {
          const x = res / a;
          if (x >= 1 && x <= maxVal) return { display: `${a} ${sym} ? = ${res}`, answer: x };
        }
      } else {
        return { display: `${a} ${sym} ${b} = ?`, answer: res };
      }
    }

    if (op === '/') {
      const b = randomInt(2, Math.min(12, maxVal));
      const q = randomInt(1, Math.max(1, Math.floor(maxVal / b)));
      const a = b * q;
      if (hole === 0) {
        return { display: `? ${sym} ${b} = ${q}`, answer: a };
      }
      if (hole === 1) {
        return { display: `${a} ${sym} ? = ${q}`, answer: b };
      }
      return { display: `${a} ${sym} ${b} = ?`, answer: q };
    }
  }

  const a = randomInt(1, Math.min(9, maxVal));
  const b = randomInt(1, Math.min(9, maxVal));
  return { display: `${a} + ? = ${a + b}`, answer: b };
}

interface RoundResult {
  problem: Problem;
  userAnswer: string;
  correct: boolean;
}

export default function MissingDigit({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const wsP = DIFF_PARAMS[wsDiff];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 12);

  const initialProblems =
    worksheetMode !== undefined
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateMissingDigitProblem(wsP.maxVal, wsP.ops)
        )
      : [];
  const [allProblems, setAllProblems] = useState<Problem[]>(initialProblems);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    const ps = Array.from({ length: totalRounds }, () => generateMissingDigitProblem(p.maxVal, p.ops));
    setAllProblems(ps);
    setCurrentIdx(0);
    setUserAnswer('');
    setResults([]);
    setLastResult(null);
    resultsRef.current = [];
    setPhase('playing');
    window.setTimeout(() => inputRef.current?.focus(), 100);
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    const prev = resultsRef.current;
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setUserAnswer('');
      setPhase('playing');
      window.setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, prev.length);
        return;
      }
      setPhase('results');
    }
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const trimmed = userAnswer.trim();
    const n = trimmed === '' ? NaN : Number(trimmed);
    const correct = n === problem.answer;
    const row: RoundResult = { problem, userAnswer: trimmed, correct };
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
    setLastResult(row);
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult && allProblems.length > 0) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300 font-mono text-lg">
            {lastResult.problem.display.replace('?', String(lastResult.problem.answer))}
          </p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono mt-2">You answered: {lastResult.userAnswer || '(empty)'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2 text-accent">{score}/{results.length}</div>
        </div>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto text-left">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm font-mono ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              {r.problem.display} → {r.problem.answer}
              {!r.correct && <span className="text-red-400 ml-2">(you: {r.userAnswer || '—'})</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark"
          >
            Play again
          </button>
          {!worksheetMode && (
            <button
              type="button"
              onClick={() => setPhase('config')}
              className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600"
            >
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <h2 className="text-xl font-bold mb-4">Missing number</h2>
        <div className="bg-surface rounded-2xl p-8 mb-4">
          <p className="text-3xl sm:text-4xl font-mono font-bold text-primary mb-6">{problem.display}</p>
          <input
            ref={inputRef}
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full max-w-xs mx-auto px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Missing digit</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Find the number that replaces ? to make the equation true.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[8, 10, 12, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button
          type="button"
          onClick={startGame}
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          Start
        </button>
      </div>
    </div>
  );
}
