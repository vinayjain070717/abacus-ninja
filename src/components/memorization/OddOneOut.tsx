import { useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateOddOneOut, type OddOneOutProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'playing' | 'results';

interface RoundResult {
  problem: OddOneOutProblem;
  pickedIndex: number;
  correct: boolean;
}

export default function OddOneOut({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<OddOneOutProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => generateOddOneOut())
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [answered, setAnswered] = useState<RoundResult | null>(null);

  const problem = allProblems[currentIdx];

  const startGame = () => {
    const ps = Array.from({ length: totalRounds }, () => generateOddOneOut());
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setAnswered(null);
    setPhase('playing');
  };

  const pick = (idx: number) => {
    if (!problem || answered) return;
    const correct = idx === problem.oddIndex;
    const entry: RoundResult = { problem, pickedIndex: idx, correct };
    setAnswered(entry);
  };

  const next = () => {
    if (!answered) return;
    const newResults = [...results, answered];
    setResults(newResults);
    setAnswered(null);

    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const score = newResults.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, newResults.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Odd One Out</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2 text-primary">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Rounds correct</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">
            Play Again
          </button>
          {!worksheetMode && (
            <button type="button" onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && problem) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Find the outlier</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-4">One number does not belong with the others.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {problem.numbers.map((n, idx) => {
              const chosen = answered?.pickedIndex === idx;
              const isOdd = idx === problem.oddIndex;
              let ring = 'border-gray-600';
              if (answered) {
                if (isOdd) ring = 'border-green-500 ring-2 ring-green-500/50';
                else if (chosen && !isOdd) ring = 'border-red-500 ring-2 ring-red-500/40';
              }
              return (
                <button
                  key={`${idx}-${n}`}
                  type="button"
                  disabled={Boolean(answered)}
                  onClick={() => pick(idx)}
                  className={`min-w-[4.5rem] px-4 py-3 rounded-xl text-xl font-bold bg-surface-light text-primary border-2 hover:border-primary disabled:opacity-90 ${ring}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="mt-6 p-4 rounded-xl bg-surface-light border border-gray-600 text-left">
              <p className={`font-semibold mb-1 ${answered.correct ? 'text-green-400' : 'text-amber-400'}`}>
                {answered.correct ? 'Correct!' : 'Not quite.'}
              </p>
              <p className="text-gray-300 text-sm">
                <span className="text-gray-500">Rule: </span>
                {answered.problem.rule}
              </p>
              <button type="button" onClick={next} className="mt-4 w-full py-2 bg-accent rounded-lg font-bold hover:bg-accent-dark">
                {currentIdx + 1 < allProblems.length ? 'Next round' : 'See results'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Odd One Out</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Five numbers appear — tap the one that breaks the pattern. The rule is revealed after you answer.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
