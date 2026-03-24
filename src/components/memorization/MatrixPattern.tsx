import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateMatrixPattern, type MatrixPatternProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS: Record<Difficulty, { gridSize: number }> = {
  easy: { gridSize: 3 },
  medium: { gridSize: 3 },
  hard: { gridSize: 4 },
};

interface RoundResult {
  problem: MatrixPatternProblem;
  userAnswer: string;
  correct: boolean;
}

export default function MatrixPattern({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<MatrixPatternProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateMatrixPattern(DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty].gridSize)
        )
      : []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;
  const inputRef = useRef<HTMLInputElement>(null);

  const problem = allProblems[currentIdx];

  const startGame = () => {
    const ps = Array.from({ length: totalRounds }, () =>
      generateMatrixPattern(DIFF_PARAMS[effectiveDiff].gridSize)
    );
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setAnswer('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    if (!problem) return;
    const n = parseInt(answer.replace(/[^0-9-]/g, ''), 10);
    const correct = !Number.isNaN(n) && n === problem.answer;
    const row: RoundResult = { problem, userAnswer: answer, correct };
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
    setLastResult(row);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setAnswer('');
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, Math.max(1, prev.length));
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Matrix Pattern</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2 text-primary tabular-nums">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Correct</p>
        </div>
        <div className="space-y-3 mb-6 text-left text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                r.correct ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'
              }`}
            >
              <div className="text-gray-400 mb-1">Missing: {r.problem.answer}</div>
              {!r.correct && <div className="text-red-400 font-mono">You: {r.userAnswer || '—'}</div>}
            </div>
          ))}
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

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Pattern</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-400">Missing value: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">You: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'playing' && problem) {
    const { grid, missingRow, missingCol } = problem;
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">{grid.length}×{grid.length} grid</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-gray-700/50 mb-4">
          <p className="text-gray-400 text-sm mb-4">Each row and column follows a linear pattern. Find the missing number.</p>
          <div
            className="inline-grid gap-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 3}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isMissing = r === missingRow && c === missingCol;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg font-bold text-lg border-2 ${
                      isMissing
                        ? 'border-dashed border-accent bg-surface-light/50 text-accent'
                        : 'border-gray-600 bg-surface-light text-primary'
                    }`}
                  >
                    {isMissing ? '?' : cell}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/[^0-9-]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Missing number"
          className="w-full max-w-xs px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary text-primary"
          autoFocus
        />
        <div className="mt-4">
          <button type="button" onClick={submit} className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Matrix Pattern</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Numbers increase by a fixed step along rows and columns. One cell is hidden — type the value that completes the pattern.
        </p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 12, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
