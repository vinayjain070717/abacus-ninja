import { useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateEstimationProblem, type EstimationProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { maxDigits: 1 },
  medium: { maxDigits: 2 },
  hard: { maxDigits: 3 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: EstimationProblem;
  pickedIndex: number;
  correct: boolean;
}

export default function EstimationStation({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [maxDigits, setMaxDigits] = useState(2);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 12);

  const [allProblems, setAllProblems] = useState<EstimationProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateEstimationProblem(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].maxDigits)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const problem = allProblems[currentIdx];

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
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

  const startGame = () => {
    const ps = Array.from({ length: totalRounds }, () => generateEstimationProblem(maxDigits));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const pick = (choiceIndex: number) => {
    if (phase !== 'playing' || !problem) return;
    const correct = choiceIndex === problem.correctIndex;
    const result: RoundResult = { problem, pickedIndex: choiceIndex, correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult) {
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
          <p className="text-gray-300 font-mono">{lastResult.problem.expression}</p>
          <p className="text-gray-400">Exact answer: {lastResult.problem.exactAnswer}</p>
          <p className="text-gray-400">You chose: {lastResult.problem.choices[lastResult.pickedIndex]}</p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Estimation station</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{score}/{results.length}</div>
          <p className="text-gray-400 text-sm">Pick the choice closest to the exact value.</p>
        </div>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto text-left">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="font-mono text-gray-200">{r.problem.expression}</div>
              <div className="text-gray-400 mt-1">Exact: {r.problem.exactAnswer}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold text-white hover:bg-primary-dark"
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

  if (phase === 'playing' && problem) {
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 mb-6 transition-[box-shadow]">
          <p className="text-gray-400 text-sm mb-2">Which is closest?</p>
          <p className="text-3xl font-mono font-bold text-primary">{problem.expression}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {problem.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              className="py-4 px-3 rounded-xl font-mono text-lg font-bold bg-surface-light border border-gray-600 hover:bg-primary/20 hover:border-primary transition-colors disabled:opacity-90"
            >
              {c.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Estimation station</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Expressions are shown with four answer choices. Tap the value closest to the exact answer.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Difficulty (digit size)</label>
          <select
            value={maxDigits}
            onChange={(e) => setMaxDigits(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[1, 2, 3].map((d) => (
              <option key={d} value={d}>
                {d} digit{d > 1 ? 's' : ''}
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
            {[8, 12, 15, 20].map((n) => (
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
