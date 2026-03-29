import { useEffect, useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { gridSize: 3, cells: 3 },
  medium: { gridSize: 4, cells: 5 },
  hard: { gridSize: 5, cells: 8 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';
type PlayingStep = 'memorize' | 'recall';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomIndices(totalCells: number, count: number): Set<number> {
  const idx = shuffle(Array.from({ length: totalCells }, (_, i) => i));
  return new Set(idx.slice(0, count));
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function countMatched(target: Set<number>, selected: Set<number>): number {
  let n = 0;
  for (const x of target) if (selected.has(x)) n++;
  return n;
}

interface RoundData {
  gridSize: number;
  cells: number;
  target: Set<number>;
}

interface RoundResult {
  round: RoundData;
  selected: Set<number>;
  matched: number;
  correct: boolean;
}

export default function SpatialMemoryGrid({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [playingStep, setPlayingStep] = useState<PlayingStep>('memorize');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [roundsData, setRoundsData] = useState<RoundData[]>(() => {
    if (!worksheetMode) return [];
    const p = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
    const n = p.gridSize * p.gridSize;
    return Array.from({ length: worksheetMode.rounds }, () => ({
      gridSize: p.gridSize,
      cells: p.cells,
      target: pickRandomIndices(n, Math.min(p.cells, n)),
    }));
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [memorizeLeft, setMemorizeLeft] = useState(2000);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const buildRounds = (rounds: number, diff: Difficulty): RoundData[] => {
    const p = DIFF_PARAMS[diff];
    const n = p.gridSize * p.gridSize;
    return Array.from({ length: rounds }, () => ({
      gridSize: p.gridSize,
      cells: p.cells,
      target: pickRandomIndices(n, Math.min(p.cells, n)),
    }));
  };

  useEffect(() => {
    if (phase !== 'playing' || playingStep !== 'memorize') return;
    setMemorizeLeft(2000);
    const start = Date.now();
    const id = setInterval(() => {
      setMemorizeLeft(Math.max(0, 2000 - (Date.now() - start)));
    }, 50);
    const t = setTimeout(() => {
      clearInterval(id);
      setPlayingStep('recall');
    }, 2000);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [phase, playingStep, currentIdx]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const data = buildRounds(totalRounds, effectiveDiff);
    setRoundsData(data);
    setCurrentIdx(0);
    setSelected(new Set());
    setResults([]);
    setLastResult(null);
    setPlayingStep('memorize');
    setPhase('playing');
  };

  const toggleCell = (idx: number) => {
    if (phase !== 'playing' || playingStep !== 'recall') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const submitPattern = () => {
    if (phase !== 'playing' || playingStep !== 'recall' || roundsData.length === 0) return;
    const round = roundsData[currentIdx];
    const matched = countMatched(round.target, selected);
    const correct = setsEqual(round.target, selected);
    const result: RoundResult = { round, selected: new Set(selected), matched, correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < roundsData.length) {
      setCurrentIdx((i) => i + 1);
      setSelected(new Set());
      setPlayingStep('memorize');
      setPhase('playing');
    } else {
      const score = results.reduce((s, r) => s + r.matched, 0);
      const totalPts = results.reduce((s, r) => s + r.round.cells, 0);
      if (worksheetMode && onComplete) {
        onComplete(score, totalPts);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult && roundsData.length > 0) {
    const { round, matched, correct, selected: sel } = lastResult;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {roundsData.length}
          </span>
          <span>
            Points: {results.reduce((s, r) => s + r.matched, 0)} /{' '}
            {results.reduce((s, r) => s + r.round.cells, 0)}
          </span>
        </div>
        <RoundFeedback
          correct={correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= roundsData.length}
        >
          <p>
            Matched {matched} of {round.cells} highlighted cells.
          </p>
          {!correct && (
            <p className="text-gray-400 text-xs mt-2">
              Your selection: {sel.size} cells — pattern must match exactly.
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Spatial Memory Grid',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Spatial Memory Grid', icon: '🧠',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: 'problem' in r && r.problem && typeof r.problem === 'object' && 'display' in r.problem ? String((r.problem as any).display) : 'Round',
          correct: r.correct,
          correctAnswer: 'problem' in r && r.problem && typeof r.problem === 'object' && 'answer' in r.problem ? String((r.problem as any).answer) : '',
          userAnswer: 'userAnswer' in r ? String((r as any).userAnswer ?? '—') : '',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'playing' && roundsData.length > 0) {
    const round = roundsData[currentIdx];
    const { gridSize, target } = round;
    const totalCells = gridSize * gridSize;

    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {roundsData.length}
          </span>
          <span>
            Points: {results.reduce((s, r) => s + r.matched, 0)} /{' '}
            {results.reduce((s, r) => s + r.round.cells, 0)}
          </span>
        </div>
        {playingStep === 'memorize' ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Memorize the highlighted cells</p>
            <div
              className="inline-grid gap-2 p-4 bg-surface rounded-xl"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalCells }, (_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-gray-600 ${
                    target.has(i) ? 'bg-accent' : 'bg-surface-light'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Next in {(memorizeLeft / 1000).toFixed(1)}s…</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">Tap the same cells</p>
            <div
              className="inline-grid gap-2 p-4 bg-surface rounded-xl mb-6"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalCells }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleCell(i)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 transition-colors ${
                    selected.has(i)
                      ? 'bg-accent border-accent'
                      : 'bg-surface-light border-gray-600 hover:border-gray-400'
                  }`}
                  aria-pressed={selected.has(i)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={submitPattern}
              className="w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark"
            >
              Check pattern
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Spatial memory grid</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          A pattern flashes for 2 seconds. Reproduce it by tapping the same cells.
        </p>
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
        <button
          type="button"
          onClick={startGame}
          className="w-full py-3 bg-accent rounded-xl font-bold text-lg hover:bg-accent-dark"
        >
          Start
        </button>
      </div>
    </div>
  );
}
