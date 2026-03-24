import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateClosestTo100Problem, type ClosestTo100Problem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { cardCount: 3 },
  medium: { cardCount: 4 },
  hard: { cardCount: 5 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: ClosestTo100Problem;
  userValue: number | null;
  distance: number;
  point: boolean;
}

const TARGET = 100;
const FULL_POINT_WITHIN = 5;

export default function ClosestTo100({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [numberCount, setNumberCount] = useState(4);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<ClosestTo100Problem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateClosestTo100Problem(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].cardCount, TARGET)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    const cc = DIFF_PARAMS[effectiveDiff].cardCount;
    const ps = Array.from({ length: totalRounds }, () => generateClosestTo100Problem(cc, TARGET));
    setAllProblems(ps);
    setCurrentIdx(0);
    setAnswer('');
    setResults([]);
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const raw = answer.trim();
    const userValue = raw === '' || Number.isNaN(Number(raw)) ? null : Number(raw);
    const distance = userValue === null ? Infinity : Math.abs(userValue - problem.target);
    const point = userValue !== null && distance <= FULL_POINT_WITHIN;
    const result = { problem, userValue, distance, point };
    setResults((prev) => [...prev, result]);
    setAnswer('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const score = results.filter((r) => r.point).length;
      if (worksheetMode && onComplete) {
        onComplete(score, results.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Target: {lastResult.problem.target}</span>
        </div>
        <RoundFeedback
          correct={lastResult.point}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">Numbers: [{lastResult.problem.numbers.join(', ')}]</p>
          <p className="text-gray-400 font-mono">
            Target: {lastResult.problem.target} · Your answer: {lastResult.userValue ?? '—'} · Distance:{' '}
            {lastResult.distance === Infinity ? '—' : lastResult.distance}
          </p>
          {lastResult.point && (
            <p className="text-green-400 text-xs">Within {FULL_POINT_WITHIN} — point awarded!</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.point).length;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Closest to {TARGET} — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Full point when within {FULL_POINT_WITHIN} of {TARGET}.</p>
        </div>
        <div className="space-y-2 mb-6 text-left max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                r.point ? 'bg-green-900/30 border border-green-800' : 'bg-surface-light border border-gray-600'
              }`}
            >
              <div className="font-mono text-gray-300">[{r.problem.numbers.join(', ')}]</div>
              <div className="mt-1">
                You: {r.userValue ?? '—'} · distance {r.distance === Infinity ? '—' : r.distance}
              </div>
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
          <span>Target: {problem.target}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">
            Use these numbers (each at most once, with + − × ÷) to get as close to {problem.target} as you can. Enter
            your best numeric result.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {problem.numbers.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="px-4 py-2 rounded-xl bg-surface-light font-mono font-bold text-lg border border-gray-600"
              >
                {n}
              </span>
            ))}
          </div>
          <label className="block text-sm text-gray-400 mb-2">Your answer</label>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-xl font-mono focus:outline-none focus:border-primary text-white"
            placeholder="e.g. 98"
          />
          <p className="text-xs text-gray-500 mt-3">
            1 point if your value is within {FULL_POINT_WITHIN} of {problem.target}.
          </p>
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
      <h2 className="text-2xl font-bold mb-6 text-center">Closest to {TARGET}</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Combine the given numbers to approach the target. You only enter your final number; scoring is by distance.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">How many numbers</label>
          <select
            value={numberCount}
            onChange={(e) => setNumberCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 15].map((n) => (
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
