import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { gridSize: 5 },
  medium: { gridSize: 8 },
  hard: { gridSize: 10 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

function lineClues(line: boolean[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const filled of line) {
    if (filled) run++;
    else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length ? clues : [0];
}

function makePuzzle(n: number) {
  const solution: boolean[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Math.random() > 0.52)
  );
  const rowClues = solution.map((row) => lineClues(row));
  const colClues = Array.from({ length: n }, (_, c) => lineClues(solution.map((row) => row[c]!)));
  return { gridSize: n, solution, rowClues, colClues };
}

interface Puzzle {
  gridSize: number;
  solution: boolean[][];
  rowClues: number[][];
  colClues: number[][];
}

interface RoundOutcome {
  correct: number;
  total: number;
}

export default function NonogramNumbers({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const wsDiff = (worksheetMode?.difficulty ?? 'medium') as Difficulty;
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 1);

  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          makePuzzle(DIFF_PARAMS[wsDiff].gridSize)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [user, setUser] = useState<boolean[][]>(() => {
    if (!worksheetMode) return [];
    const n = DIFF_PARAMS[wsDiff].gridSize;
    return Array.from({ length: n }, () => Array(n).fill(false));
  });
  const [results, setResults] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);

  const puzzle = allPuzzles[currentIdx];

  const emptyUser = (n: number) => Array.from({ length: n }, () => Array(n).fill(false));

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const n = DIFF_PARAMS[effectiveDiff].gridSize;
    setAllPuzzles(Array.from({ length: totalRounds }, () => makePuzzle(n)));
    setCurrentIdx(0);
    setUser(emptyUser(n));
    setResults([]);
    setLastOutcome(null);
    setPhase('playing');
  };

  const toggle = (r: number, c: number) => {
    setUser((prev) => {
      const next = prev.map((row) => [...row]);
      next[r]![c] = !next[r]![c];
      return next;
    });
  };

  const submit = () => {
    if (!puzzle) return;
    const n = puzzle.gridSize;
    let correct = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (user[r]![c] === puzzle.solution[r]![c]) correct++;
      }
    }
    const out: RoundOutcome = { correct, total: n * n };
    setResults((prev) => [...prev, out]);
    setLastOutcome(out);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastOutcome(null);
    if (currentIdx + 1 < allPuzzles.length) {
      const n = allPuzzles[currentIdx + 1]!.gridSize;
      setUser(emptyUser(n));
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      setResults((prev) => {
        const score = prev.reduce((s, o) => s + o.correct, 0);
        const total = prev.reduce((s, o) => s + o.total, 0);
        if (worksheetMode && onComplete) {
          queueMicrotask(() => onComplete(score, total));
        } else {
          queueMicrotask(() => setPhase('results'));
        }
        return prev;
      });
    }
  };

  if (phase === 'feedback' && lastOutcome) {
    const perfect = lastOutcome.correct === lastOutcome.total;
    return (
      <div className="max-w-4xl mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allPuzzles.length}
          </span>
          <span>Nonogram</span>
        </div>
        <RoundFeedback
          correct={perfect}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allPuzzles.length}
        >
          <p className="text-gray-300">
            Matching cells: {lastOutcome.correct}/{lastOutcome.total}
          </p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Nonogram Numbers',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Nonogram Numbers', icon: '🔢',
        score: results.reduce((s, o) => s + o.correct, 0), total: results.reduce((s, o) => s + o.total, 0),
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r, i) => ({
          display: `Round ${i + 1}`,
          correct: r.correct === r.total,
          correctAnswer: `${r.total} cells`,
          userAnswer: `${r.correct}/${r.total} correct`,
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'playing' && puzzle) {
    const n = puzzle.gridSize;
    const maxColClueLen = Math.max(...puzzle.colClues.map((x) => x.length), 1);
    const rowClueWidth = 'min-w-[4.5rem]';
    const cell = 'w-7 h-7 sm:w-8 sm:h-8 shrink-0';

    return (
      <div className="max-w-4xl mx-auto text-primary overflow-x-auto">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allPuzzles.length}
          </span>
          <span>
            {n}×{n}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-2">Tap cells to fill. Numbers show lengths of consecutive filled runs.</p>
        <div className="inline-block bg-surface rounded-xl p-3 border border-gray-700/50">
          <div className="flex">
            <div className={`${rowClueWidth} shrink-0`} aria-hidden />
            <div className="flex gap-0.5">
              {Array.from({ length: n }, (_, c) => (
                <div key={`col-${c}`} className="flex flex-col justify-end gap-0.5 w-7 sm:w-8">
                  {Array.from({ length: maxColClueLen }, (_, ri) => {
                    const colClue = puzzle.colClues[c]!;
                    const idx = ri - (maxColClueLen - colClue.length);
                    const val = idx >= 0 ? colClue[idx] : null;
                    return (
                      <div
                        key={ri}
                        className={`${cell} flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-accent bg-surface-light rounded-md border border-gray-700/40`}
                      >
                        {val ?? ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {Array.from({ length: n }, (_, r) => (
            <div key={`row-${r}`} className="flex gap-0.5 mt-0.5">
              <div
                className={`${rowClueWidth} shrink-0 flex items-center justify-end gap-0.5 pr-1 bg-surface-light rounded-md border border-gray-700/40`}
              >
                {puzzle.rowClues[r]!.map((num, i) => (
                  <span key={i} className="text-[10px] sm:text-xs font-mono font-bold text-accent">
                    {num}
                  </span>
                ))}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: n }, (_, c) => (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => toggle(r, c)}
                    className={`${cell} rounded-md border transition-colors ${
                      user[r]![c]
                        ? 'bg-accent border-accent text-white'
                        : 'bg-bg border-gray-600 hover:border-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-4 w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark max-w-md mx-auto block"
        >
          Check pattern
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Nonogram</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Binary grid puzzle: row and column numbers count blocks of filled cells.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-xl px-3 py-2 text-white"
          >
            {[1, 2, 3].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-xl font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
