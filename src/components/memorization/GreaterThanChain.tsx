import { useState, useEffect, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface PairProblem {
  left: number;
  right: number;
}

interface RoundResult {
  problem: PairProblem;
  picked: 'left' | 'right';
  correct: boolean;
  timeMs: number;
}

const DIFF_PARAMS = {
  easy: { maxDigits: 2 },
  medium: { maxDigits: 3 },
  hard: { maxDigits: 5 },
} as const;

function boundsForDigits(d: number): { min: number; max: number } {
  const min = 10 ** (d - 1);
  const max = 10 ** d - 1;
  return { min, max };
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generatePair(maxDigits: number): PairProblem {
  const { min, max } = boundsForDigits(maxDigits);
  let left = randomInt(min, max);
  let right = randomInt(min, max);
  while (right === left) right = randomInt(min, max);
  return { left, right };
}

export default function GreaterThanChain({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [maxDigits, setMaxDigits] = useState(DIFF_PARAMS.medium.maxDigits);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 20);

  const [allProblems, setAllProblems] = useState<PairProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generatePair(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].maxDigits)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;
  const roundStart = useRef(Date.now());

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setMaxDigits(p.maxDigits);
  }, [difficulty, worksheetMode]);

  useEffect(() => {
    if (phase === 'playing') roundStart.current = Date.now();
  }, [phase, currentIdx]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setMaxDigits(p.maxDigits);
    const ps = Array.from({ length: totalRounds }, () => generatePair(p.maxDigits));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    resultsRef.current = [];
    setPhase('playing');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    const prev = resultsRef.current;
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, prev.length);
        return;
      }
      setPhase('results');
    }
  };

  const pick = (side: 'left' | 'right') => {
    const problem = allProblems[currentIdx];
    const greaterIsLeft = problem.left > problem.right;
    const correct = (side === 'left' && greaterIsLeft) || (side === 'right' && !greaterIsLeft);
    const timeMs = Date.now() - roundStart.current;
    const result: RoundResult = { problem, picked: side, correct, timeMs };
    const next = [...resultsRef.current, result];
    resultsRef.current = next;
    setResults(next);
    setLastResult(result);
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult && allProblems.length > 0) {
    const { problem } = lastResult;
    const greater = problem.left > problem.right ? problem.left : problem.right;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
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
            {problem.left} vs {problem.right} → larger is <span className="text-accent font-bold">{greater}</span>
          </p>
          {!lastResult.correct && (
            <p className="text-red-400 text-sm">You tapped the smaller number.</p>
          )}
          <p className="text-gray-500 text-xs">Response: {lastResult.timeMs}ms</p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    const avgTime =
      results.length > 0 ? Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length) : 0;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2 text-accent">{score}/{results.length}</div>
          <div className="text-gray-400 text-sm">Avg response: {avgTime}ms</div>
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
      <div className="max-w-lg mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <h2 className="text-xl font-bold mb-4">Tap the larger number</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => pick('left')}
            className="bg-surface-light hover:bg-accent rounded-xl py-10 text-3xl sm:text-4xl font-mono font-bold border border-gray-600 transition-colors"
          >
            {problem.left}
          </button>
          <button
            type="button"
            onClick={() => pick('right')}
            className="bg-surface-light hover:bg-accent rounded-xl py-10 text-3xl sm:text-4xl font-mono font-bold border border-gray-600 transition-colors"
          >
            {problem.right}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Greater-than chain</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Two numbers appear side by side. Tap the larger one as fast as you can.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <p className="text-xs text-gray-500">
          Digits per number: easy {DIFF_PARAMS.easy.maxDigits}, medium {DIFF_PARAMS.medium.maxDigits}, hard{' '}
          {DIFF_PARAMS.hard.maxDigits}
        </p>
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
