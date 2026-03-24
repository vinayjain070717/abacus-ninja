import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { digitCount: 3, target: 20 },
  medium: { digitCount: 4, target: 50 },
  hard: { digitCount: 5, target: 100 },
} as const;

interface EqProblem {
  digits: number[];
  target: number;
}

interface RoundResult {
  problem: EqProblem;
  expr: string;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function extractSingleDigits(expr: string): number[] | null {
  const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
  const matches = normalized.match(/\d+/g);
  if (!matches) return null;
  for (const m of matches) {
    if (m.length !== 1) return null;
  }
  return matches.map(Number);
}

function evalExprSafe(expr: string): number | null {
  try {
    let normalized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    normalized = normalized.replace(/\s/g, '');
    if (!/^[0-9+\-*/().]+$/.test(normalized)) return null;
    const result = Function(`"use strict"; return (${normalized})`)();
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function validateExpression(expr: string, digits: number[], target: number): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return false;
  const used = extractSingleDigits(trimmed);
  if (!used || !multisetEqual(used, digits)) return false;
  const v = evalExprSafe(trimmed);
  return v !== null && Math.abs(v - target) < 1e-9;
}

function generateDigits(count: number): number[] {
  return Array.from({ length: count }, () => randInt(0, 9));
}

function tryOps(a: number, b: number): number[] {
  return [a + b, a - b, b - a, a * b, b !== 0 ? a / b : NaN, a !== 0 ? b / a : NaN];
}

function hasObviousSolution(nums: number[], target: number): boolean {
  if (nums.length === 0) return false;
  if (nums.length === 1) return Math.abs(nums[0] - target) < 1e-9;
  if (nums.length === 2) {
    return tryOps(nums[0], nums[1]).some((x) => Number.isFinite(x) && Math.abs(x - target) < 1e-9);
  }
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const rest = nums.filter((_, k) => k !== i && k !== j);
      for (const x of tryOps(nums[i], nums[j])) {
        if (!Number.isFinite(x)) continue;
        if (hasObviousSolution([x, ...rest], target)) return true;
      }
    }
  }
  return false;
}

function generateProblem(p: { digitCount: number; target: number }): EqProblem {
  for (let t = 0; t < 60; t++) {
    const digits = generateDigits(p.digitCount);
    if (hasObviousSolution(digits, p.target)) {
      return { digits, target: p.target };
    }
  }
  const fallback = Array.from({ length: p.digitCount }, (_, i) => ((i % 9) + 1) % 10);
  return { digits: fallback, target: p.target };
}

function generateAllProblems(rounds: number, diff: Difficulty): EqProblem[] {
  const p = DIFF_PARAMS[diff];
  return Array.from({ length: rounds }, () => generateProblem(p));
}

export default function EquationBuilder({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const initialDiff = (worksheetMode?.difficulty ?? 'medium') as Difficulty;
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 6);
  const [allProblems, setAllProblems] = useState<EqProblem[]>(() =>
    worksheetMode ? generateAllProblems(worksheetMode.rounds, initialDiff) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [expr, setExpr] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    setAllProblems(generateAllProblems(totalRounds, effectiveDiff));
    setCurrentIdx(0);
    setExpr('');
    setResults([]);
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const trimmed = expr.trim();
    const correct = validateExpression(trimmed, problem.digits, problem.target);
    const result: RoundResult = { problem, expr: trimmed, correct };
    setResults((prev) => [...prev, result]);
    setExpr('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const score = results.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, results.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult) {
    const pr = lastResult.problem;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Equation builder</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            Digits [{pr.digits.join(', ')}] → {pr.target}
          </p>
          <p className="text-gray-400 font-mono text-xs mt-1">Your expression: {lastResult.expr || '—'}</p>
          {!lastResult.correct && (
            <p className="text-gray-500 text-xs mt-2">
              Each digit must appear exactly once as a single-digit number. Use + − × ÷ and parentheses.
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Equation builder — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
        </div>
        <div className="space-y-2 mb-6 text-left max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="text-gray-300">
                [{r.problem.digits.join(', ')}] → {r.problem.target}
              </div>
              <div className="font-mono text-gray-400 text-xs mt-1">{r.expr || '—'}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark text-white"
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
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Equation builder</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">
            Use each digit exactly once as a single-digit number with +, −, ×, ÷ and parentheses.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {problem.digits.map((d, i) => (
              <span
                key={`${i}-${d}`}
                className="px-4 py-2 rounded-xl bg-surface-light font-mono font-bold text-lg border border-gray-600"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">Target</span>
            <div className="text-4xl font-bold font-mono text-accent">{problem.target}</div>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. (3 + 5) × 2"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-lg font-mono focus:outline-none focus:border-primary text-white"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="w-full py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Equation builder</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Build an expression that hits the target using every digit once.</p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
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
