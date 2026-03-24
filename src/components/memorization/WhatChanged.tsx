import { useState, useEffect } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateWhatChangedGrid, type WhatChangedProblem } from '../../utils/problemGenerator';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { gridSize: 3, changes: 1, displayTime: 5 },
  medium: { gridSize: 4, changes: 2, displayTime: 4 },
  hard: { gridSize: 5, changes: 3, displayTime: 3 },
} as const;

type Phase = 'config' | 'memorize' | 'pick' | 'feedback' | 'results';

interface RoundResult {
  problem: WhatChangedProblem;
  score: number;
}

function scoreSelection(changedPositions: number[], selected: Set<number>): number {
  return changedPositions.filter((p) => selected.has(p)).length;
}

export default function WhatChanged({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'memorize' : 'config');
  const [difficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [gridSize, setGridSize] = useState(4);
  const [changesCount, setChangesCount] = useState(4);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 6);
  const [memorizeMs, setMemorizeMs] = useState(() =>
    worksheetMode ? DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].displayTime * 1000 : 5000
  );

  const [allProblems, setAllProblems] = useState<WhatChangedProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => {
          const p = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
          return generateWhatChangedGrid(p.gridSize, Math.min(p.changes, p.gridSize * p.gridSize - 1));
        })
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastFeedback, setLastFeedback] = useState<{
    problem: WhatChangedProblem;
    score: number;
    selected: Set<number>;
  } | null>(null);

  const problem = allProblems[currentIdx];

  useEffect(() => {
    if (phase !== 'memorize' || allProblems.length === 0) return;
    const t = setTimeout(() => setPhase('pick'), memorizeMs);
    return () => clearTimeout(t);
  }, [phase, currentIdx, allProblems.length, memorizeMs]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setMemorizeMs(p.displayTime * 1000);
    const ps = Array.from({ length: totalRounds }, () =>
      generateWhatChangedGrid(p.gridSize, Math.min(p.changes, p.gridSize * p.gridSize - 1))
    );
    setAllProblems(ps);
    setCurrentIdx(0);
    setSelected(new Set());
    setResults([]);
    setLastFeedback(null);
    setPhase('memorize');
  };

  const advanceFromFeedback = () => {
    setLastFeedback(null);
    setSelected(new Set());
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setPhase('memorize');
    } else {
      const totalScore = results.reduce((s, r) => s + r.score, 0);
      const totalPossible = results.reduce((s, r) => s + r.problem.changedPositions.length, 0);
      if (worksheetMode && onComplete) {
        onComplete(totalScore, totalPossible);
        return;
      }
      setPhase('results');
    }
  };

  const toggleCell = (idx: number) => {
    if (phase !== 'pick') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const submitRound = () => {
    if (!problem) return;
    const sc = scoreSelection(problem.changedPositions, selected);
    const newResults = [...results, { problem, score: sc }];
    setResults(newResults);
    setLastFeedback({ problem, score: sc, selected: new Set(selected) });
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastFeedback) {
    const correct = lastFeedback.score === lastFeedback.problem.changedPositions.length;
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Round recap</span>
        </div>
        <RoundFeedback
          correct={correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            Changed cells: {lastFeedback.problem.changedPositions.length} · You found: {lastFeedback.score}
          </p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    const totalPossible = results.reduce((s, r) => s + r.problem.changedPositions.length, 0);
    return (
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">What Changed — Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2 text-primary">
            {totalScore}/{totalPossible}
          </div>
          <p className="text-gray-400 text-sm">Changed cells you found</p>
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

  const cols = problem ? Math.round(Math.sqrt(problem.original.length)) : gridSize;

  const renderGrid = (values: number[], onCell?: (i: number) => void) => (
    <div
      className="grid gap-2 mx-auto w-max"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {values.map((v, i) => {
        const isSel = selected.has(i);
        const interactive = Boolean(onCell);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onCell?.(i)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg font-bold text-lg flex items-center justify-center border transition-colors ${
              interactive
                ? isSel
                  ? 'bg-primary border-primary text-white ring-2 ring-accent'
                  : 'bg-surface-light border-gray-600 text-primary hover:border-primary'
                : 'bg-surface-light border-gray-600 text-primary'
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );

  if ((phase === 'memorize' || phase === 'pick') && problem) {
    const values = phase === 'memorize' ? problem.original : problem.changed;
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">{phase === 'memorize' ? 'Memorize' : 'Spot changes'}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-gray-700/50">
          <p className="text-gray-400 mb-4 text-sm">
            {phase === 'memorize'
              ? `Study the grid — it will change in ${Math.round(memorizeMs / 1000)} seconds.`
              : 'Tap every cell that changed from the first grid.'}
          </p>
          {renderGrid(values, phase === 'pick' ? toggleCell : undefined)}
        </div>
        {phase === 'pick' && (
          <button
            type="button"
            onClick={submitRound}
            className="mt-6 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
          >
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">What Changed?</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Memorize a number grid, then mark every cell whose value changed.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Grid size (N×N)</label>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}×{n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Number of changes</label>
          <select
            value={changesCount}
            onChange={(e) => setChangesCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[2, 3, 4, 5, 6, 8].map((n) => (
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
            {[4, 6, 8, 10].map((n) => (
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
