import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { variables: 3 },
  medium: { variables: 4 },
  hard: { variables: 5 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const CATEGORY_POOL = ['Drink', 'Snack', 'Hobby', 'Pet', 'City'] as const;
const VALUE_POOL: Record<string, string[]> = {
  Drink: ['Tea', 'Coffee', 'Juice', 'Milk', 'Water'],
  Snack: ['Cookie', 'Fruit', 'Nuts', 'Chips', 'Crackers'],
  Hobby: ['Chess', 'Music', 'Sports', 'Reading', 'Garden'],
  Pet: ['Cat', 'Dog', 'Bird', 'Fish', 'Rabbit'],
  City: ['Paris', 'Tokyo', 'Delhi', 'Cairo', 'Oslo'],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Clue =
  | { type: 'direct'; person: number; cat: number; value: number }
  | { type: 'adjacent'; a: number; b: number };

interface Puzzle {
  n: number;
  /** solution[person][cat] = value index */
  solution: number[][];
  /** position in line 0..n-1 */
  linePos: number[];
  clues: Clue[];
  categoryLabels: string[];
  valueLabels: string[][];
}

function makePuzzle(n: number): Puzzle {
  const categoryLabels = CATEGORY_POOL.slice(0, n) as string[];
  const valueLabels = categoryLabels.map((cat) => VALUE_POOL[cat]!.slice(0, n));
  const solution: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let c = 0; c < n; c++) {
    const perm = shuffle(Array.from({ length: n }, (_, i) => i));
    for (let p = 0; p < n; p++) solution[p]![c] = perm[p]!;
  }
  const linePos = shuffle(Array.from({ length: n }, (_, i) => i));
  const invPos = Array(n).fill(0);
  linePos.forEach((person, slot) => {
    invPos[person] = slot;
  });

  const clues: Clue[] = [];
  const used = new Set<string>();
  for (let t = 0; t < n + 2; t++) {
    const p = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    const key = `d-${p}-${c}`;
    if (!used.has(key)) {
      used.add(key);
      clues.push({ type: 'direct', person: p, cat: c, value: solution[p]![c]! });
    }
  }
  let addedAdj = false;
  for (let a = 0; a < n && !addedAdj; a++) {
    for (let b = a + 1; b < n; b++) {
      if (Math.abs(invPos[a]! - invPos[b]!) === 1) {
        clues.push({ type: 'adjacent', a, b });
        addedAdj = true;
        break;
      }
    }
  }
  shuffle(clues);
  return { n, solution, linePos, clues, categoryLabels, valueLabels };
}

function clueText(p: Puzzle, clue: Clue): string {
  if (clue.type === 'direct') {
    const cat = p.categoryLabels[clue.cat]!;
    const val = p.valueLabels[clue.cat]![clue.value]!;
    return `Person ${clue.person + 1}'s ${cat} is ${val}.`;
  }
  return `Person ${clue.a + 1} is next to Person ${clue.b + 1} in the lineup.`;
}

interface RoundOutcome {
  correct: number;
  total: number;
}

function emptyUserGrid(n: number) {
  return Array.from({ length: n }, () => Array(n).fill(-1));
}

export default function LogicGridPuzzle({
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
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 3);

  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => makePuzzle(DIFF_PARAMS[wsDiff].variables))
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [user, setUser] = useState<number[][]>(() =>
    worksheetMode ? emptyUserGrid(DIFF_PARAMS[wsDiff].variables) : []
  );
  const [results, setResults] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const puzzle = allPuzzles[currentIdx];

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const n = DIFF_PARAMS[effectiveDiff].variables;
    setAllPuzzles(Array.from({ length: totalRounds }, () => makePuzzle(n)));
    setCurrentIdx(0);
    setUser(emptyUserGrid(n));
    setResults([]);
    setLastOutcome(null);
    setHint(null);
    setPhase('playing');
  };

  const setCell = (person: number, cat: number, valueIdx: number) => {
    setUser((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[person]) return prev;
      next[person]![cat] = valueIdx;
      return next;
    });
  };

  const submit = () => {
    if (!puzzle) return;
    const n = puzzle.n;
    for (let p = 0; p < n; p++) {
      for (let c = 0; c < n; c++) {
        if (user[p]?.[c] == null || user[p]![c]! < 0) {
          setHint('Choose a value for every cell.');
          return;
        }
      }
    }
    setHint(null);
    let correct = 0;
    const total = n * n;
    for (let p = 0; p < n; p++) {
      for (let c = 0; c < n; c++) {
        if (user[p]![c] === puzzle.solution[p]![c]) correct++;
      }
    }
    const out: RoundOutcome = { correct, total };
    setResults((prev) => [...prev, out]);
    setLastOutcome(out);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastOutcome(null);
    if (currentIdx + 1 < allPuzzles.length) {
      const n = allPuzzles[currentIdx + 1]!.n;
      setUser(emptyUserGrid(n));
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
      <div className="max-w-3xl mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allPuzzles.length}
          </span>
          <span>Logic grid</span>
        </div>
        <RoundFeedback
          correct={perfect}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allPuzzles.length}
        >
          <p className="text-gray-300">
            Correct assignments: {lastOutcome.correct}/{lastOutcome.total}
          </p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Logic Grid Puzzle',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Logic Grid Puzzle', icon: '🧩',
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
    const n = puzzle.n;

    return (
      <div className="max-w-3xl mx-auto text-primary overflow-x-auto">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allPuzzles.length}
          </span>
          <span>{n} people · {n} traits</span>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-gray-700/50 mb-4">
          <p className="text-gray-400 text-sm mb-2 font-semibold">Clues</p>
          <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
            {puzzle.clues.map((clue, i) => (
              <li key={i}>{clueText(puzzle, clue)}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Lineup (left → right):{' '}
            {puzzle.linePos.map((personId) => `P${personId + 1}`).join(' · ')}
          </p>
        </div>
        <div className="bg-surface-light rounded-xl p-3 border border-gray-700/50 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-gray-400">Person</th>
                {puzzle.categoryLabels.map((lab, c) => (
                  <th key={c} className="p-2 text-accent font-semibold">
                    {lab}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, p) => (
                <tr key={p}>
                  <td className="p-2 font-medium text-primary">Person {p + 1}</td>
                  {Array.from({ length: n }, (_, c) => (
                    <td key={c} className="p-1">
                      <select
                        value={user[p]?.[c] != null && user[p]![c]! >= 0 ? String(user[p]![c]) : ''}
                        onChange={(e) => setCell(p, c, parseInt(e.target.value, 10))}
                        className="w-full min-w-[6rem] bg-bg border border-gray-600 rounded-lg px-2 py-1.5 text-primary"
                      >
                        <option value="">—</option>
                        {puzzle.valueLabels[c]!.map((label, v) => (
                          <option key={v} value={v}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hint && <p className="text-amber-400 text-sm mt-2">{hint}</p>}
        <button
          type="button"
          onClick={submit}
          className="mt-4 w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark"
        >
          Check solution
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Logic grid</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Use the clues to fill each person&apos;s attributes. Lineup shows who stands next to whom.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-xl px-3 py-2 text-white"
          >
            {[2, 3, 4, 5].map((x) => (
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
