import { useState, useEffect } from 'react';
import { generatePairMatchBoard, type PairMatchCard } from '../../utils/problemGenerator';
import { formatTime } from '../../utils/scoring';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'playing' | 'results';

const DIFF_PARAMS = {
  easy: { pairCount: 4, targetSum: 10 },
  medium: { pairCount: 6, targetSum: 10 },
  hard: { pairCount: 8, targetSum: 20 },
} as const;

export default function NumberPairMatch({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const wsP = DIFF_PARAMS[worksheetMode?.difficulty ?? 'medium'];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? gameDifficulty;
  const [pairCount, setPairCount] = useState<number>(worksheetMode ? wsP.pairCount : DIFF_PARAMS.medium.pairCount);
  const [targetSum, setTargetSum] = useState<number>(worksheetMode ? wsP.targetSum : DIFF_PARAMS.medium.targetSum);

  const [cards, setCards] = useState<PairMatchCard[]>(() =>
    worksheetMode ? generatePairMatchBoard(wsP.pairCount, wsP.targetSum) : []
  );
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[gameDifficulty];
    setPairCount(p.pairCount);
    setTargetSum(p.targetSum);
  }, [gameDifficulty, worksheetMode]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0) {
      const score = Math.max(1, cards.length / 2 - Math.max(0, attempts - cards.length / 2));
      const total = cards.length / 2;
      if (worksheetMode && onComplete) { onComplete(Math.round(score), total); return; }
      setPhase('results');
    }
  }, [matched, cards.length, worksheetMode, onComplete, attempts]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setPairCount(p.pairCount);
    setTargetSum(p.targetSum);
    const c = generatePairMatchBoard(p.pairCount, p.targetSum);
    setCards(c);
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    setAttempts(0);
    setSeconds(0);
    setPhase('playing');
  };

  const flipCard = (idx: number) => {
    if (flipped.has(idx) || matched.has(idx) || selected.length >= 2) return;

    const newSelected = [...selected, idx];
    setSelected(newSelected);
    setFlipped(prev => new Set([...prev, idx]));

    if (newSelected.length === 2) {
      setAttempts(a => a + 1);
      const [i, j] = newSelected;
      const c1 = cards[i];
      const c2 = cards[j];

      if (c1.value + c2.value === targetSum) {
        setTimeout(() => {
          setMatched(prev => new Set([...prev, i, j]));
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped(prev => {
            const n = new Set(prev);
            n.delete(i);
            n.delete(j);
            return n;
          });
          setSelected([]);
        }, 800);
      }
    }
  };

  if (phase === 'results') {
    const pairsFound = matched.size / 2;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Pair Match Complete!</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{pairsFound} pairs</div>
          <div className="text-gray-400">Time: {formatTime(seconds)} | Attempts: {attempts}</div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">Play Again</button>
          {!worksheetMode && <button onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">Settings</button>}
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const cols = cards.length <= 12 ? 4 : cards.length <= 16 ? 4 : 5;
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Pairs: {matched.size / 2}/{cards.length / 2}</span>
          <span>Target sum: {targetSum}</span>
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {cards.map((card, idx) => {
            const isFlipped = flipped.has(idx) || matched.has(idx);
            const isMatched = matched.has(idx);
            return (
              <button
                key={idx}
                onClick={() => flipCard(idx)}
                disabled={isMatched}
                className={`w-14 h-14 rounded-xl text-lg font-bold transition-all ${
                  isMatched
                    ? 'bg-green-700 text-white cursor-default'
                    : isFlipped
                      ? 'bg-primary text-white'
                      : 'bg-surface-light text-transparent hover:bg-gray-600 border border-gray-600'
                }`}
              >
                {isFlipped || isMatched ? card.value : '?'}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Number Pair Match</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Find pairs of numbers that add up to the target sum.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pairs</label>
          <div className="flex gap-2">
            {[6, 8, 10].map(n => (
              <button key={n} onClick={() => setPairCount(n)} className={`flex-1 py-2 rounded-lg font-bold ${pairCount === n ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{n} pairs</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Target sum</label>
          <div className="flex gap-2">
            {[10, 20, 50, 100].map(n => (
              <button key={n} onClick={() => setTargetSum(n)} className={`flex-1 py-2 rounded-lg font-bold text-sm ${targetSum === n ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{n}</button>
            ))}
          </div>
        </div>
        <DifficultySelector value={gameDifficulty} onChange={setGameDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
