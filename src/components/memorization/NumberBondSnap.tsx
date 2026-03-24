import { useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { target: 10, pairCount: 4 },
  medium: { target: 50, pairCount: 6 },
  hard: { target: 100, pairCount: 8 },
} as const;

interface BondRound {
  numbers: number[];
  /** index pairs [a,b] with a < b */
  solutionPairs: [number, number][];
}

interface RoundResult {
  round: BondRound;
  userPairs: [number, number][];
  correct: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound(target: number, pairCount: number): BondRound {
  const numPairs = pairCount / 2;
  const nums: number[] = [];
  const solutionPairs: [number, number][] = [];
  const used = new Set<string>();

  for (let p = 0; p < numPairs; p++) {
    let a = 0;
    let b = 0;
    for (let t = 0; t < 60; t++) {
      a = Math.floor(Math.random() * (target - 1)) + 1;
      b = target - a;
      if (b < 1 || b > target) continue;
      const key = a <= b ? `${a},${b}` : `${b},${a}`;
      if (!used.has(key)) {
        used.add(key);
        nums.push(a, b);
        solutionPairs.push(a < b ? [nums.length - 2, nums.length - 1] : [nums.length - 1, nums.length - 2]);
        break;
      }
    }
  }

  const order = shuffle(nums.map((_, i) => i));
  const permuted = order.map((i) => nums[i]);
  const inv = new Map(order.map((oldIdx, newPos) => [oldIdx, newPos]));
  const remapped: [number, number][] = solutionPairs.map(([i, j]) => {
    const ni = inv.get(i)!;
    const nj = inv.get(j)!;
    return ni < nj ? [ni, nj] : [nj, ni];
  });

  return { numbers: permuted, solutionPairs: remapped.sort((x, y) => x[0] - y[0] || x[1] - y[1]) };
}

function pairsEqual(
  a: [number, number][],
  b: [number, number][]
): boolean {
  if (a.length !== b.length) return false;
  const norm = (p: [number, number][]) =>
    p
      .map(([x, y]) => (x < y ? `${x},${y}` : `${y},${x}`))
      .sort()
      .join('|');
  return norm(a) === norm(b);
}

function generateAllRounds(rounds: number, diff: Difficulty): BondRound[] {
  const { target, pairCount } = DIFF_PARAMS[diff];
  return Array.from({ length: rounds }, () => generateRound(target, pairCount));
}

export default function NumberBondSnap({
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
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);
  const [allRounds, setAllRounds] = useState<BondRound[]>(() =>
    worksheetMode ? generateAllRounds(worksheetMode.rounds, initialDiff) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [used, setUsed] = useState<Set<number>>(() => new Set());
  const [userPairs, setUserPairs] = useState<[number, number][]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const target = DIFF_PARAMS[effectiveDiff].target;

  const startGame = () => {
    setAllRounds(generateAllRounds(totalRounds, effectiveDiff));
    setCurrentIdx(0);
    setSelectedIdx(null);
    setUsed(new Set());
    setUserPairs([]);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const resetRoundUi = () => {
    setSelectedIdx(null);
    setUsed(new Set());
    setUserPairs([]);
  };

  const submit = () => {
    const round = allRounds[currentIdx];
    const correct = pairsEqual(userPairs, round.solutionPairs);
    const result: RoundResult = { round, userPairs: [...userPairs], correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allRounds.length) {
      setCurrentIdx((i) => i + 1);
      resetRoundUi();
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

  const onNumberClick = (idx: number) => {
    if (used.has(idx)) return;
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }
    const a = selectedIdx;
    const b = idx;
    const n1 = allRounds[currentIdx].numbers[a];
    const n2 = allRounds[currentIdx].numbers[b];
    if (n1 + n2 !== target) {
      setSelectedIdx(null);
      return;
    }
    const pair: [number, number] = a < b ? [a, b] : [b, a];
    setUserPairs((prev) => [...prev, pair]);
    setUsed((prev) => new Set([...prev, a, b]));
    setSelectedIdx(null);
  };

  if (phase === 'feedback' && lastResult) {
    const r = lastResult.round;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allRounds.length}
          </span>
          <span>Number bond snap</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allRounds.length}
        >
          <p className="text-gray-300">Target sum: {target}</p>
          <p className="text-gray-400 text-xs mt-1 font-mono">
            Numbers: [{r.numbers.join(', ')}]
          </p>
          {!lastResult.correct && (
            <p className="text-gray-500 text-xs mt-2">
              Correct pairs (indices):{' '}
              {r.solutionPairs.map((p) => `[${p[0]},${p[1]}]`).join(' · ')}
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((x) => x.correct).length;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Number bond snap — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
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

  if (phase === 'playing' && allRounds.length > 0) {
    const round = allRounds[currentIdx];
    const allPaired = used.size === round.numbers.length;

    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allRounds.length}
          </span>
          <span>Target {target}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">
            Tap two numbers that sum to {target}. Pair all numbers, then submit.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {round.numbers.map((n, idx) => {
              const isUsed = used.has(idx);
              const isSel = selectedIdx === idx;
              return (
                <button
                  key={`${idx}-${n}`}
                  type="button"
                  disabled={isUsed}
                  onClick={() => onNumberClick(idx)}
                  className={`min-w-[3.5rem] px-4 py-3 rounded-xl font-mono font-bold text-lg border transition-colors ${
                    isUsed
                      ? 'bg-green-900/40 border-green-700 text-green-200 opacity-60'
                      : isSel
                        ? 'bg-accent/30 border-accent text-white ring-2 ring-accent'
                        : 'bg-surface-light border-gray-600 hover:border-primary text-white'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!allPaired}
          className="w-full py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Number bond snap</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Pair every number so each pair sums to the target.</p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 6, 8, 10, 12].map((n) => (
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
