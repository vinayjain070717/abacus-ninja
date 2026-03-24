import { useState, useEffect, useRef } from 'react';
import { generateSortingRound, type SortingRound } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  round: SortingRound;
  userOrder: number[];
  correct: boolean;
}

const DIFF_PARAMS = {
  easy: { count: 5, maxValue: 50 },
  medium: { count: 7, maxValue: 200 },
  hard: { count: 10, maxValue: 999 },
} as const;

export default function NumberSorting({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const wsP = DIFF_PARAMS[worksheetMode?.difficulty ?? 'medium'];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? gameDifficulty;
  const [numCount, setNumCount] = useState<number>(DIFF_PARAMS.medium.count);
  const [maxDigits, setMaxDigits] = useState(2);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allRounds, setAllRounds] = useState<SortingRound[]>(() =>
    worksheetMode ? Array.from({ length: worksheetMode.rounds }, () => generateSortingRound(wsP.count, 2, wsP.maxValue)) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[gameDifficulty];
    setNumCount(p.count);
  }, [gameDifficulty, worksheetMode]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setNumCount(p.count);
    const rs = Array.from({ length: totalRounds }, () => generateSortingRound(p.count, maxDigits, p.maxValue));
    setAllRounds(rs);
    setCurrentIdx(0);
    setPicked([]);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    setPicked([]);
    if (currentIdx + 1 < allRounds.length) {
      setCurrentIdx(currentIdx + 1);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter(r => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, prev.length);
        return;
      }
      setPhase('results');
    }
  };

  const pickNumber = (num: number) => {
    if (picked.includes(num)) return;
    const newPicked = [...picked, num];
    setPicked(newPicked);

    const round = allRounds[currentIdx];
    if (newPicked.length === round.numbers.length) {
      const correct = newPicked.every((n, i) => n === round.sorted[i]);
      const newResults = [...results, { round, userOrder: newPicked, correct }];
      setResults(newResults);
      setLastResult({ round, userOrder: newPicked, correct });
      setPhase('feedback');
    }
  };

  const resetPicks = () => setPicked([]);

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allRounds.length}
          </span>
          <span>{lastResult.round.direction === 'asc' ? 'Ascending ↑' : 'Descending ↓'}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allRounds.length}
        >
          <p className="text-gray-300">{lastResult.round.direction === 'asc' ? 'Ascending ↑' : 'Descending ↓'}</p>
          <p className="text-gray-400 font-mono">Correct order: {lastResult.round.sorted.join(', ')}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your order: {lastResult.userOrder.join(', ')}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter(r => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Sorting Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{score}/{results.length}</div>
        </div>
        <div className="space-y-2 mb-6">
          {results.map((r, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm font-mono ${r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              <span className="text-gray-400">{r.round.direction === 'asc' ? '↑' : '↓'}</span> {r.round.sorted.join(', ')}
              {!r.correct && <span className="text-red-400 ml-2">(You: {r.userOrder.join(', ')})</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">Play Again</button>
          {!worksheetMode && <button onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">Settings</button>}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && allRounds.length > 0) {
    const round = allRounds[currentIdx];
    const allPicked = picked.length === round.numbers.length;
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Round {currentIdx + 1} / {allRounds.length}</span>
          <span>{round.direction === 'asc' ? 'Ascending ↑' : 'Descending ↓'}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          {picked.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Your order:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {picked.map((n, i) => (
                  <div key={i} className="w-12 h-10 flex items-center justify-center bg-primary rounded-lg text-sm font-bold">{n}</div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mb-2">Tap numbers in {round.direction === 'asc' ? 'ascending' : 'descending'} order:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {round.numbers.map((n, i) => {
              const isPicked = picked.includes(n);
              return (
                <button
                  key={i}
                  onClick={() => pickNumber(n)}
                  disabled={isPicked || allPicked}
                  className={`w-14 h-12 rounded-xl text-lg font-bold transition-all ${
                    isPicked
                      ? 'bg-gray-700 text-gray-500 cursor-default'
                      : 'bg-surface-light text-white hover:bg-accent hover:text-white'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        {!allPicked && picked.length > 0 && (
          <button onClick={resetPicks} className="text-sm text-gray-400 hover:text-white">Reset</button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Number Sorting</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Tap numbers in ascending or descending order.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Numbers per round</label>
          <div className="flex gap-2">
            {[5, 6, 7, 8, 10].map(n => (
              <button key={n} onClick={() => setNumCount(n)} className={`flex-1 py-2 rounded-lg font-bold text-sm ${numCount === n ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Digit size</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(d => (
              <button key={d} onClick={() => setMaxDigits(d)} className={`flex-1 py-2 rounded-lg font-bold ${maxDigits === d ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{d}-digit</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select value={totalRounds} onChange={e => setTotalRounds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <DifficultySelector value={gameDifficulty} onChange={setGameDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
