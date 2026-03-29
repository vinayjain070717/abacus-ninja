import { Fragment, useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { gridSize: 4 },
  medium: { gridSize: 6 },
  hard: { gridSize: 8 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Each row is a random permutation of 1..n (n ≤ 9). Column sums are shown as extra clues. */
function generateSolution(n: number): number[][] {
  const base = Array.from({ length: n }, (_, i) => i + 1);
  return Array.from({ length: n }, () => shuffle(base));
}

interface Puzzle {
  gridSize: number;
  solution: number[][];
  rowSums: number[];
  colSums: number[];
}

function makePuzzle(n: number): Puzzle {
  const solution = generateSolution(n);
  const rowSums = solution.map((row) => row.reduce((a, b) => a + b, 0));
  const colSums = Array.from({ length: n }, (_, c) =>
    solution.reduce((sum, row) => sum + row[c]!, 0)
  );
  return { gridSize: n, solution, rowSums, colSums };
}

interface RoundOutcome {
  correct: number;
  total: number;
}

function scoreInputs(p: Puzzle, cells: string[][]): RoundOutcome {
  let correct = 0;
  const n = p.gridSize;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = parseInt(cells[r]![c]!.trim(), 10);
      if (!Number.isNaN(v) && v === p.solution[r]![c]) correct++;
    }
  }
  return { correct, total: n * n };
}

export default function Kakuro({
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
  const [cells, setCells] = useState<string[][]>(() =>
    worksheetMode
      ? Array.from({ length: DIFF_PARAMS[wsDiff].gridSize }, () =>
          Array(DIFF_PARAMS[wsDiff].gridSize).fill('')
        )
      : []
  );
  const [results, setResults] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const puzzle = allPuzzles[currentIdx];

  const emptyGrid = (n: number) => Array.from({ length: n }, () => Array(n).fill(''));

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const n = DIFF_PARAMS[effectiveDiff].gridSize;
    setAllPuzzles(Array.from({ length: totalRounds }, () => makePuzzle(n)));
    setCurrentIdx(0);
    setCells(emptyGrid(n));
    setResults([]);
    setLastOutcome(null);
    setHint(null);
    setPhase('playing');
  };

  const submit = () => {
    if (!puzzle || phase !== 'playing') return;
    const n = puzzle.gridSize;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const raw = cells[r]![c]!.trim();
        const v = parseInt(raw, 10);
        if (raw === '' || Number.isNaN(v) || v < 1 || v > 9) {
          setHint('Enter digits 1–9 in every cell.');
          return;
        }
      }
    }
    for (let r = 0; r < n; r++) {
      const rowVals = cells[r]!.map((x) => parseInt(x.trim(), 10));
      if (new Set(rowVals).size !== n) {
        setHint(`Row ${r + 1}: digits must be unique (no repeats in a row).`);
        return;
      }
    }
    setHint(null);
    const out = scoreInputs(puzzle, cells);
    setResults((prev) => [...prev, out]);
    setLastOutcome(out);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastOutcome(null);
    if (currentIdx + 1 < allPuzzles.length) {
      const n = allPuzzles[currentIdx + 1]!.gridSize;
      setCells(emptyGrid(n));
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

  if (phase === 'feedback' && lastOutcome && puzzle) {
    const perfect = lastOutcome.correct === lastOutcome.total;
    return (
      <div className="max-w-2xl mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allPuzzles.length}
          </span>
          <span>Cross-sum</span>
        </div>
        <RoundFeedback
          correct={perfect}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allPuzzles.length}
        >
          <p className="text-gray-300">
            Correct cells: {lastOutcome.correct}/{lastOutcome.total}
          </p>
          <p className="text-gray-500 text-xs mt-1">Each row uses 1–{puzzle.gridSize} once; match row and column sum clues.</p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Kakuro',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Kakuro', icon: '🧩',
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
    return (
      <div className="max-w-2xl mx-auto text-primary overflow-x-auto">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allPuzzles.length}
          </span>
          <span>{n}×{n}</span>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Each row contains digits 1–{n} with no repeats. Row labels = row sums; column labels = column sums.
        </p>
        <div className="inline-block bg-surface rounded-xl p-3 border border-gray-700/50">
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `2.5rem repeat(${n}, minmax(2.25rem, 1fr))`,
            }}
          >
            <div />
            {puzzle.colSums.map((s, c) => (
              <div
                key={`cs-${c}`}
                className="text-xs font-bold text-center text-accent py-1 rounded-lg bg-surface-light"
              >
                ↓{s}
              </div>
            ))}
            {Array.from({ length: n }, (_, r) => (
              <Fragment key={`row-${r}`}>
                <div className="text-xs font-bold flex items-center justify-end pr-1 text-accent bg-surface-light rounded-lg">
                  {puzzle.rowSums[r]}→
                </div>
                {Array.from({ length: n }, (_, c) => (
                  <input
                    key={`${r}-${c}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={cells[r]?.[c] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(-1);
                      setCells((prev) => {
                        const next = prev.map((row) => [...row]);
                        if (!next[r]) next[r] = Array(n).fill('');
                        next[r]![c] = v;
                        return next;
                      });
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 text-center text-sm font-bold rounded-lg bg-bg border border-gray-600 text-primary focus:outline-none focus:border-accent"
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        {hint && <p className="text-amber-400 text-sm mt-3">{hint}</p>}
        <button
          type="button"
          onClick={submit}
          className="mt-4 w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark"
        >
          Check grid
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Cross-sum</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Simplified Kakuro: fill the grid so each row has digits 1–N exactly once, and every row/column matches its sum clue.
        </p>
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
