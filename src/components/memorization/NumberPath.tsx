import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { gridSize: 4 },
  medium: { gridSize: 5 },
  hard: { gridSize: 6 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

type PathCell = [number, number];

function spiralPath(n: number): PathCell[] {
  const path: PathCell[] = [];
  let top = 0;
  let bottom = n - 1;
  let left = 0;
  let right = n - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) path.push([top, c]);
    top++;
    for (let r = top; r <= bottom; r++) path.push([r, right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) path.push([bottom, c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) path.push([r, left]);
      left++;
    }
  }
  return path;
}

function buildPuzzle(gridSize: number, revealFraction: number) {
  const path = spiralPath(gridSize);
  const solution: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  path.forEach(([r, c], i) => {
    solution[r]![c] = i + 1;
  });
  const flat: PathCell[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) flat.push([r, c]);
  }
  const toHide = Math.floor(flat.length * (1 - revealFraction));
  const shuffled = [...flat].sort(() => Math.random() - 0.5);
  const hidden = new Set(shuffled.slice(0, toHide).map(([r, c]) => `${r},${c}`));
  const display: (number | null)[][] = solution.map((row, r) =>
    row.map((v, c) => (hidden.has(`${r},${c}`) ? null : v))
  );
  return { solution, display, hidden };
}

interface RoundData {
  gridSize: number;
  solution: number[][];
  display: (number | null)[][];
}

interface RoundOutcome {
  correctCells: number;
  totalCells: number;
}

export default function NumberPath({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 1);

  const makeRound = (gs: number): RoundData => {
    const reveal = effectiveDiff === 'easy' ? 0.45 : effectiveDiff === 'medium' ? 0.35 : 0.28;
    const { solution, display } = buildPuzzle(gs, reveal);
    return { gridSize: gs, solution, display };
  };

  const [allRounds, setAllRounds] = useState<RoundData[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          makeRound(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].gridSize)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const round = allRounds[currentIdx];

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const gs = DIFF_PARAMS[effectiveDiff].gridSize;
    setAllRounds(Array.from({ length: totalRounds }, () => makeRound(gs)));
    setCurrentIdx(0);
    setInputs({});
    setResults([]);
    setLastOutcome(null);
    setHint(null);
    setPhase('playing');
  };

  const scoreRound = (r: RoundData): RoundOutcome => {
    let correct = 0;
    const total = r.gridSize * r.gridSize;
    for (let row = 0; row < r.gridSize; row++) {
      for (let col = 0; col < r.gridSize; col++) {
        const want = r.solution[row]![col]!;
        if (r.display[row]![col] != null) {
          if (r.display[row]![col] === want) correct++;
        } else {
          const raw = inputs[`${row},${col}`]?.trim() ?? '';
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n) && n === want) correct++;
        }
      }
    }
    return { correctCells: correct, totalCells: total };
  };

  const submit = () => {
    if (!round || phase !== 'playing') return;
    for (let row = 0; row < round.gridSize; row++) {
      for (let col = 0; col < round.gridSize; col++) {
        if (round.display[row]![col] != null) continue;
        const raw = inputs[`${row},${col}`]?.trim() ?? '';
        if (raw === '' || Number.isNaN(parseInt(raw, 10))) {
          setHint('Fill every empty cell with a number.');
          return;
        }
      }
    }
    setHint(null);
    const out = scoreRound(round);
    setResults((prev) => [...prev, out]);
    setLastOutcome(out);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastOutcome(null);
    setInputs({});
    if (currentIdx + 1 < allRounds.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      setResults((prev) => {
        const score = prev.reduce((s, o) => s + o.correctCells, 0);
        const total = prev.reduce((s, o) => s + o.totalCells, 0);
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
    const perfect = lastOutcome.correctCells === lastOutcome.totalCells;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allRounds.length}
          </span>
          <span>Number path</span>
        </div>
        <RoundFeedback
          correct={perfect}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allRounds.length}
        >
          <p className="text-gray-300">
            Cells correct: {lastOutcome.correctCells}/{lastOutcome.totalCells}
          </p>
          <p className="text-gray-500 text-xs mt-1">Fill consecutive numbers along an 8-connected path.</p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Number Path',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Number Path', icon: '🔢',
        score: results.reduce((s, r) => s + r.correctCells, 0),
        total: results.reduce((s, r) => s + r.totalCells, 0),
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r, i) => ({
          display: `Round ${i + 1}`,
          correct: r.correctCells === r.totalCells,
          correctAnswer: `${r.totalCells} cells`,
          userAnswer: `${r.correctCells}/${r.totalCells} correct`,
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'playing' && round) {
    const { gridSize: gs, display } = round;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allRounds.length}
          </span>
          <span>{gs}×{gs} · 1–{gs * gs}</span>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-gray-700/50 mb-4">
          <p className="text-gray-400 text-sm mb-3 text-center">
            Complete the path: consecutive numbers must touch (including diagonally).
          </p>
          <div
            className="grid gap-1 mx-auto w-max"
            style={{ gridTemplateColumns: `repeat(${gs}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: gs }, (_, row) =>
              Array.from({ length: gs }, (_, col) => {
                const given = display[row]![col];
                const key = `${row},${col}`;
                if (given != null) {
                  return (
                    <div
                      key={key}
                      className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-surface-light font-bold text-lg border border-gray-600"
                    >
                      {given}
                    </div>
                  );
                }
                return (
                  <input
                    key={key}
                    type="text"
                    inputMode="numeric"
                    value={inputs[key] ?? ''}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [key]: e.target.value.replace(/\D/g, '').slice(0, 2),
                      }))
                    }
                    className="w-11 h-11 sm:w-12 sm:h-12 text-center rounded-xl bg-bg border border-gray-600 text-accent font-bold focus:outline-none focus:border-accent"
                  />
                );
              })
            )}
          </div>
          {hint && <p className="text-amber-400 text-sm mt-3 text-center">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={submit}
          className="w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark"
        >
          Check path
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Number path</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Hidato-style: every number from 1 to N² appears once; neighbors along the path touch on sides or corners.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-xl px-3 py-2 text-white"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
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
