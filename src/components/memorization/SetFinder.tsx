import { useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { properties: 2 as const },
  medium: { properties: 3 as const },
  hard: { properties: 4 as const },
} as const;

const SHAPES = ['●', '■', '▲'] as const;
const COLORS = ['text-red-400', 'text-green-400', 'text-blue-400'] as const;
const FILLS = ['solid', 'striped', 'open'] as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

type Card = { count: number; shape: number; color: number; fill: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValidSet(a: Card, b: Card, c: Card, propCount: 2 | 3 | 4): boolean {
  const all = [
    [a.count, b.count, c.count],
    [a.shape, b.shape, c.shape],
    [a.color, b.color, c.color],
    [a.fill, b.fill, c.fill],
  ] as [number, number, number][];
  const triples = all.slice(0, propCount);
  for (const [x, y, z] of triples) {
    const allSame = x === y && y === z;
    const allDiff = x !== y && y !== z && x !== z;
    if (!allSame && !allDiff) return false;
  }
  return true;
}

function randomCard(propCount: 2 | 3 | 4): Card {
  const card: Card = {
    count: Math.floor(Math.random() * 3),
    shape: Math.floor(Math.random() * 3),
    color: Math.floor(Math.random() * 3),
    fill: Math.floor(Math.random() * 3),
  };
  if (propCount <= 2) {
    card.color = 0;
    card.fill = 0;
  } else if (propCount === 3) {
    card.fill = 0;
  }
  return card;
}

function findAnySet(cards: Card[], propCount: 2 | 3 | 4): [number, number, number] | null {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidSet(cards[i]!, cards[j]!, cards[k]!, propCount)) return [i, j, k];
      }
    }
  }
  return null;
}

function dealBoard(cardCount: number, propCount: 2 | 3 | 4): Card[] {
  for (let t = 0; t < 400; t++) {
    const cards = Array.from({ length: cardCount }, () => randomCard(propCount));
    if (findAnySet(cards, propCount)) return cards;
  }
  const a: Card = { count: 0, shape: 0, color: 0, fill: 0 };
  const b: Card = { count: 1, shape: 1, color: 0, fill: 0 };
  const c: Card = { count: 2, shape: 2, color: 0, fill: 0 };
  if (propCount >= 3) {
    a.color = 0;
    b.color = 1;
    c.color = 2;
  }
  if (propCount >= 4) {
    a.fill = 0;
    b.fill = 1;
    c.fill = 2;
  }
  const rest = Array.from({ length: Math.max(0, cardCount - 3) }, () => randomCard(propCount));
  return shuffle([a, b, c, ...rest]).slice(0, cardCount);
}

function CardFace({ card, propCount }: { card: Card; propCount: 2 | 3 | 4 }) {
  const n = card.count + 1;
  const shapeChar = SHAPES[card.shape];
  const colorCls = propCount >= 3 ? COLORS[card.color] : 'text-primary';
  const fill = FILLS[card.fill];
  const stripe = propCount >= 4 && fill === 'striped' ? 'opacity-70' : '';
  const open = propCount >= 4 && fill === 'open' ? 'opacity-40' : '';

  return (
    <div
      className={`rounded-xl border-2 border-gray-600 bg-surface-light p-2 min-h-[5.5rem] flex flex-col items-center justify-center gap-1 ${colorCls}`}
    >
      <div className={`flex flex-wrap justify-center gap-0.5 text-xl font-bold ${open}`}>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className={stripe}>
            {shapeChar}
          </span>
        ))}
      </div>
      {propCount >= 4 && <span className="text-[10px] text-gray-500 uppercase tracking-wide">{fill}</span>}
    </div>
  );
}

interface RoundState {
  cards: Card[];
  propCount: 2 | 3 | 4;
}

export default function SetFinder({
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
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);
  const [cardCount, setCardCount] = useState(9);

  const [allRounds, setAllRounds] = useState<RoundState[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => {
          const pc = DIFF_PARAMS[wsDiff].properties;
          return { cards: dealBoard(9, pc), propCount: pc };
        })
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const round = allRounds[currentIdx];

  const startGame = () => {
    const pc = DIFF_PARAMS[effectiveDiff].properties;
    setAllRounds(
      Array.from({ length: totalRounds }, () => ({
        cards: dealBoard(cardCount, pc),
        propCount: pc,
      }))
    );
    setCurrentIdx(0);
    setSelected([]);
    setResults([]);
    setLastCorrect(null);
    setPhase('playing');
  };

  const toggleSelect = (idx: number) => {
    if (phase !== 'playing' || !round) return;
    setSelected((prev) => {
      if (prev.includes(idx)) return prev.filter((i) => i !== idx);
      if (prev.length >= 3) return [idx];
      return [...prev, idx];
    });
  };

  const trySet = () => {
    if (!round || selected.length !== 3) return;
    const [i, j, k] = selected;
    const ok = isValidSet(round.cards[i]!, round.cards[j]!, round.cards[k]!, round.propCount);
    setResults((prev) => [...prev, ok]);
    setLastCorrect(ok);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastCorrect(null);
    setSelected([]);
    if (currentIdx + 1 < allRounds.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      setResults((prev) => {
        const score = prev.filter(Boolean).length;
        if (worksheetMode && onComplete) {
          queueMicrotask(() => onComplete(score, prev.length));
        } else {
          queueMicrotask(() => setPhase('results'));
        }
        return prev;
      });
    }
  };

  if (phase === 'feedback' && lastCorrect !== null && round) {
    return (
      <div className="max-w-2xl mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allRounds.length}
          </span>
          <span>Set finder</span>
        </div>
        <RoundFeedback
          correct={lastCorrect}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allRounds.length}
        >
          <p className="text-gray-300">
            {lastCorrect
              ? 'Those three cards form a valid set.'
              : 'Those three do not form a set — each property must be all same or all different.'}
          </p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter(Boolean).length;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Set finder</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Rounds correct</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={startGame} className="px-6 py-2 bg-accent rounded-xl font-semibold hover:bg-accent-dark">
            Play Again
          </button>
          {!worksheetMode && (
            <button
              type="button"
              onClick={() => setPhase('config')}
              className="px-6 py-2 bg-surface-light rounded-xl font-semibold hover:bg-gray-600"
            >
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && round) {
    const pc = round.propCount;
    return (
      <div className="max-w-2xl mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allRounds.length}
          </span>
          <span>Using {pc} properties</span>
        </div>
        <p className="text-gray-400 text-sm mb-3 text-center">
          Tap exactly three cards where, for each property (count, shape
          {pc >= 3 ? ', color' : ''}
          {pc >= 4 ? ', fill style' : ''}), values are either all the same or all different.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {round.cards.map((card, idx) => {
            const on = selected.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleSelect(idx)}
                className={`rounded-xl transition-all ${
                  on ? 'ring-2 ring-accent scale-[1.02]' : 'hover:opacity-90'
                }`}
              >
                <CardFace card={card} propCount={pc} />
              </button>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-500 mb-2">{selected.length}/3 selected</p>
        <button
          type="button"
          disabled={selected.length !== 3}
          onClick={trySet}
          className="w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check set
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Set finder</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Like SET®: pick three cards that match the &quot;all same or all different&quot; rule.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-xl px-3 py-2 text-white"
          >
            {[5, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cards on table</label>
          <select
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-xl px-3 py-2 text-white"
          >
            {[9, 10, 12].map((n) => (
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
