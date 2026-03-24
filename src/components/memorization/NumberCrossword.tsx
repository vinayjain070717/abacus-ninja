import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateNumberCrossword, type NumberCrosswordProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { gridSize: 3 },
  medium: { gridSize: 4 },
  hard: { gridSize: 5 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: NumberCrosswordProblem;
  across: string;
  down: string;
  correct: boolean;
}

export default function NumberCrossword({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<NumberCrosswordProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateNumberCrossword(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].gridSize)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [across, setAcross] = useState('');
  const [down, setDown] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const acrossRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    const gs = DIFF_PARAMS[effectiveDiff].gridSize;
    const ps = Array.from({ length: totalRounds }, () => generateNumberCrossword(gs));
    setAllProblems(ps);
    setCurrentIdx(0);
    setAcross('');
    setDown('');
    setResults([]);
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => acrossRef.current?.focus(), 50);
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const a = parseInt(across.trim(), 10);
    const d = parseInt(down.trim(), 10);
    const correct = !Number.isNaN(a) && !Number.isNaN(d) && a === problem.acrossAnswer && d === problem.downAnswer;
    const newResults = [...results, { problem, across: across.trim(), down: down.trim(), correct }];
    setResults(newResults);
    setLastResult({ problem, across: across.trim(), down: down.trim(), correct });
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setAcross('');
      setDown('');
      setTimeout(() => acrossRef.current?.focus(), 50);
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

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Number crossword</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4 space-y-6">
          <div className="rounded-xl bg-surface-light p-4 border border-gray-600">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Across</p>
            <p className="text-xl font-mono font-semibold">{problem.acrossClue}</p>
            <label className="block text-sm text-gray-400 mt-3 mb-1">Answer</label>
            <input
              ref={acrossRef}
              type="number"
              value={across}
              onChange={(e) => setAcross(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-gray-600 rounded-lg font-mono focus:outline-none focus:border-primary text-white"
            />
          </div>
          <div className="rounded-xl bg-surface-light p-4 border border-gray-600">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Down</p>
            <p className="text-xl font-mono font-semibold">{problem.downClue}</p>
            <label className="block text-sm text-gray-400 mt-3 mb-1">Answer</label>
            <input
              type="number"
              value={down}
              onChange={(e) => setDown(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full px-3 py-2 bg-surface border border-gray-600 rounded-lg font-mono focus:outline-none focus:border-primary text-white"
            />
          </div>
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

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Number crossword</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            Across: {lastResult.problem.acrossClue} = {lastResult.problem.acrossAnswer}
          </p>
          <p className="text-gray-300">
            Down: {lastResult.problem.downClue} = {lastResult.problem.downAnswer}
          </p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">
              You entered: {lastResult.across || '—'} / {lastResult.down || '—'}
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
        <h2 className="text-2xl font-bold mb-4">Number crossword — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
        </div>
        <div className="space-y-2 mb-6 text-left max-h-72 overflow-y-auto text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div>Across {r.problem.acrossClue} → {r.problem.acrossAnswer}</div>
              <div>Down {r.problem.downClue} → {r.problem.downAnswer}</div>
              {!r.correct && (
                <div className="text-gray-400 mt-1">
                  You: {r.across || '—'} / {r.down || '—'}
                </div>
              )}
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

  return (
    <div className="max-w-lg mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Number crossword</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Solve both clues — enter the numeric answers.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 10, 15, 20].map((n) => (
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
