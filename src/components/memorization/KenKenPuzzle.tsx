import { useState, useMemo, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import {
  generateKenKenPuzzle,
  type KenKenPuzzle as KenKenData,
  type KenKenCage,
} from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'playing' | 'results';

const DIFF_PARAMS = {
  easy: { gridSize: 3 },
  medium: { gridSize: 4 },
  hard: { gridSize: 5 },
} as const;

function emptyGrid(size: number): (number | null)[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function validateKenKen(grid: (number | null)[][], cages: KenKenCage[], size: number): { ok: boolean; message: string } {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v === null || v < 1 || v > size) {
        return { ok: false, message: `Fill every cell with a digit from 1 to ${size}.` };
      }
    }
  }

  for (let r = 0; r < size; r++) {
    const row = grid[r].map((x) => x!);
    if (new Set(row).size !== size) {
      return { ok: false, message: 'Each row must use each digit exactly once.' };
    }
  }
  for (let c = 0; c < size; c++) {
    const col = grid.map((row) => row[c]!);
    if (new Set(col).size !== size) {
      return { ok: false, message: 'Each column must use each digit exactly once.' };
    }
  }

  for (const cage of cages) {
    const vals = cage.cells.map(([r, col]) => grid[r][col]!);
    if (cage.operation === '+') {
      const sum = vals.reduce((a, b) => a + b, 0);
      if (sum !== cage.target) {
        return { ok: false, message: 'A cage sum does not match its target.' };
      }
    } else if (cage.operation === '×') {
      const prod = vals.reduce((a, b) => a * b, 1);
      if (prod !== cage.target) {
        return { ok: false, message: 'A cage product does not match its target.' };
      }
    } else if (cage.operation === '-') {
      if (vals.length === 2 && Math.abs(vals[0] - vals[1]) !== cage.target) {
        return { ok: false, message: 'A cage difference does not match its target.' };
      }
    } else if (cage.operation === '÷') {
      if (vals.length === 2) {
        const [a, b] = vals;
        const ok =
          (b !== 0 && a % b === 0 && a / b === cage.target) || (a !== 0 && b % a === 0 && b / a === cage.target);
        if (!ok) {
          return { ok: false, message: 'A cage division does not match its target.' };
        }
      }
    }
  }

  return { ok: true, message: 'Solved! All cages and Latin rules pass.' };
}

function cellCageKey(cages: KenKenCage[], r: number, c: number): number {
  return cages.findIndex((cg) => cg.cells.some(([cr, cc]) => cr === r && cc === c));
}

export default function KenKenPuzzle({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [size, setSize] = useState(3);
  const [puzzleCount, setPuzzleCount] = useState(worksheetMode?.rounds ?? 1);
  const sessionGridRef = useRef(3);

  const wsRounds = worksheetMode?.rounds;
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const initialPuzzle = useMemo(() => {
    if (wsRounds == null) return null;
    const gs = DIFF_PARAMS[wsDiff].gridSize;
    sessionGridRef.current = gs;
    return generateKenKenPuzzle(gs);
  }, [wsRounds, wsDiff]);

  const [puzzle, setPuzzle] = useState<KenKenData | null>(() => initialPuzzle);
  const [grid, setGrid] = useState<(number | null)[][]>(() => emptyGrid(initialPuzzle?.size ?? 3));
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [checking, setChecking] = useState(false);

  const startSession = (firstSize: number, count: number) => {
    sessionGridRef.current = firstSize;
    const p = generateKenKenPuzzle(firstSize);
    setPuzzle(p);
    setGrid(emptyGrid(p.size));
    setFeedback(null);
    setSolvedCount(0);
    setAttempted(0);
    setChecking(false);
    setPuzzleCount(count);
    setPhase('playing');
  };

  const applyCell = (r: number, c: number, v: string) => {
    if (!puzzle) return;
    setFeedback(null);
    if (v === '') {
      setGrid((g) => {
        const next = g.map((row) => [...row]);
        next[r][c] = null;
        return next;
      });
      return;
    }
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return;
    if (n < 1 || n > puzzle.size) return;
    setGrid((g) => {
      const next = g.map((row) => [...row]);
      next[r][c] = n;
      return next;
    });
  };

  const check = () => {
    if (checking) return;
    if (!puzzle) return;
    const nextAttempted = attempted + 1;
    setAttempted(nextAttempted);
    const res = validateKenKen(grid, puzzle.cages, puzzle.size);
    setFeedback(res);
    if (!res.ok) return;

    setChecking(true);
    const nextSolved = solvedCount + 1;
    setSolvedCount(nextSolved);

    if (worksheetMode && onComplete) {
      onComplete(nextSolved, puzzleCount);
      setChecking(false);
      return;
    }

    if (nextSolved >= puzzleCount) {
      setPhase('results');
      setChecking(false);
      return;
    }

    const p = generateKenKenPuzzle(sessionGridRef.current);
    setPuzzle(p);
    setGrid(emptyGrid(p.size));
    setFeedback(null);
    setChecking(false);
  };

  if (phase === 'results' && puzzle) {
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">KenKen — session complete</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {solvedCount}/{puzzleCount}
          </div>
          <p className="text-gray-400 text-sm">Puzzles validated successfully.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              setPhase('config');
              setPuzzle(null);
            }}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark text-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && puzzle) {
    const { cages, size: n } = puzzle;
    const cageColors = [
      'border-amber-600/80 bg-amber-950/30',
      'border-sky-600/80 bg-sky-950/30',
      'border-emerald-600/80 bg-emerald-950/30',
      'border-violet-600/80 bg-violet-950/30',
      'border-rose-600/80 bg-rose-950/30',
    ];

    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Puzzle {solvedCount + 1} / {worksheetMode?.rounds ?? puzzleCount}
          </span>
          <span>
            Size {n}×{n}
          </span>
        </div>
        <div className="bg-surface rounded-2xl p-4 sm:p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">
            Fill with 1–{n} so each row and column has unique digits. Heavy borders group cages — the small label is
            target + operation.
          </p>
          <div
            className="grid gap-1 mx-auto w-fit"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 3.5rem))` }}
          >
            {Array.from({ length: n * n }, (_, i) => {
              const r = Math.floor(i / n);
              const c = i % n;
              const ck = cellCageKey(cages, r, c);
              const isFirstInCage =
                ck >= 0 && cages[ck].cells[0][0] === r && cages[ck].cells[0][1] === c;
              const cage = ck >= 0 ? cages[ck] : null;
              const opLabel =
                cage && cage.cells.length === 1 ? '=' : cage?.operation === '×' ? '×' : cage?.operation ?? '';
              const colorIdx = ck >= 0 ? ck % cageColors.length : 0;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`relative rounded-lg border-2 p-1 ${ck >= 0 ? cageColors[colorIdx] : 'border-gray-600 bg-surface-light'}`}
                >
                  {isFirstInCage && cage && (
                    <span className="absolute left-1 top-0.5 text-[10px] font-bold text-gray-300 leading-none z-10">
                      {cage.target}
                      {opLabel}
                    </span>
                  )}
                  <input
                    type="number"
                    min={1}
                    max={n}
                    value={grid[r][c] ?? ''}
                    onChange={(e) => applyCell(r, c, e.target.value)}
                    className="mt-3 w-full h-10 bg-surface border border-gray-600 rounded-md text-center text-lg font-mono focus:outline-none focus:border-primary text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              );
            })}
          </div>
          {feedback && (
            <p
              className={`mt-4 text-sm text-center rounded-lg px-3 py-2 ${
                feedback.ok ? 'bg-green-900/30 text-green-200' : 'bg-red-900/30 text-red-200'
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="w-full py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark disabled:opacity-50 disabled:pointer-events-none"
        >
          Check
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">KenKen</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Mini Latin square with cage arithmetic. Press Check when you think it is valid.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Grid size</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 4, 5].map((s) => (
              <option key={s} value={s}>
                {s} × {s}
              </option>
            ))}
          </select>
        </div>
        {!worksheetMode && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Puzzles in a row</label>
            <select
              value={puzzleCount}
              onChange={(e) => setPuzzleCount(Number(e.target.value))}
              className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button
          type="button"
          onClick={() =>
            startSession(DIFF_PARAMS[effectiveDiff].gridSize, worksheetMode?.rounds ?? puzzleCount)
          }
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          Start
        </button>
      </div>
    </div>
  );
}
