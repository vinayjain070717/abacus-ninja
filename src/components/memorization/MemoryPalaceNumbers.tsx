import { useEffect, useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { positions: 4 },
  medium: { positions: 6 },
  hard: { positions: 9 },
} as const;

const ROOMS = [
  'Kitchen',
  'Bedroom',
  'Library',
  'Garage',
  'Garden',
  'Office',
  'Attic',
  'Basement',
  'Study',
] as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';
type PlayingStep = 'memorize' | 'recall';

interface PalaceRound {
  rooms: string[];
  values: number[];
}

interface RoundResult {
  round: PalaceRound;
  answers: string[];
  correctCount: number;
  correct: boolean;
}

export default function MemoryPalaceNumbers({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 5);

  const buildRound = (diff: Difficulty): PalaceRound => {
    const n = DIFF_PARAMS[diff].positions;
    const rooms = ROOMS.slice(0, n);
    const values = Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10);
    return { rooms, values };
  };

  const [playingStep, setPlayingStep] = useState<PlayingStep>('memorize');
  const [rounds, setRounds] = useState<PalaceRound[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => buildRound(worksheetMode.difficulty ?? 'medium'))
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [memMsLeft, setMemMsLeft] = useState(5000);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  useEffect(() => {
    if (phase !== 'playing' || playingStep !== 'memorize') return;
    setMemMsLeft(5000);
    const start = Date.now();
    const id = setInterval(() => {
      setMemMsLeft(Math.max(0, 5000 - (Date.now() - start)));
    }, 50);
    const t = setTimeout(() => {
      clearInterval(id);
      const r = rounds[currentIdx];
      setAnswers(Array(r.rooms.length).fill(''));
      setPlayingStep('recall');
    }, 5000);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [phase, playingStep, currentIdx, rounds]);

  const startGame = () => {
    const rs = Array.from({ length: totalRounds }, () => buildRound(effectiveDiff));
    setRounds(rs);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setPlayingStep('memorize');
    setPhase('playing');
  };

  const setAnswerAt = (i: number, v: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = v.replace(/\D/g, '').slice(0, 2);
      return next;
    });
  };

  const submitRecall = () => {
    if (phase !== 'playing' || playingStep !== 'recall' || rounds.length === 0) return;
    const round = rounds[currentIdx];
    let correctCount = 0;
    for (let i = 0; i < round.values.length; i++) {
      const n = parseInt(answers[i] ?? '', 10);
      if (!Number.isNaN(n) && n === round.values[i]) correctCount++;
    }
    const correct = correctCount === round.values.length;
    const result: RoundResult = { round, answers: [...answers], correctCount, correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < rounds.length) {
      setCurrentIdx((i) => i + 1);
      setPlayingStep('memorize');
      setPhase('playing');
    } else {
      const score = results.reduce((s, r) => s + r.correctCount, 0);
      const totalPts = results.reduce((s, r) => s + r.round.values.length, 0);
      if (worksheetMode && onComplete) {
        onComplete(score, totalPts);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult && rounds.length > 0) {
    const { round, correctCount, correct } = lastResult;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {rounds.length}
          </span>
          <span>
            Recall: {results.reduce((s, r) => s + r.correctCount, 0)} /{' '}
            {results.reduce((s, r) => s + r.round.values.length, 0)}
          </span>
        </div>
        <RoundFeedback
          correct={correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= rounds.length}
        >
          <ul className="text-left text-sm space-y-1">
            {round.rooms.map((room, i) => (
              <li key={room}>
                <span className="text-gray-400">{room}:</span>{' '}
                <span className="font-mono font-bold">{round.values[i]}</span>
              </li>
            ))}
          </ul>
          {!correct && (
            <p className="text-red-400 text-sm mt-2">
              You recalled {correctCount}/{round.values.length} correctly.
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.reduce((s, r) => s + r.correctCount, 0);
    const totalPts = results.reduce((s, r) => s + r.round.values.length, 0);
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Memory palace — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{totalPts}
          </div>
          <p className="text-gray-400 text-sm">Correct digit recalls across all rooms</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-accent rounded-xl font-semibold hover:bg-accent-dark"
          >
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

  if (phase === 'playing' && rounds.length > 0) {
    const round = rounds[currentIdx];
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {rounds.length}
          </span>
          <span>
            Recall: {results.reduce((s, r) => s + r.correctCount, 0)} /{' '}
            {results.reduce((s, r) => s + r.round.values.length, 0)}
          </span>
        </div>
        {playingStep === 'memorize' ? (
          <div className="bg-surface rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-4 text-center">Memorize each number in its room ({(memMsLeft / 1000).toFixed(1)}s)</p>
            <ul className="space-y-3">
              {round.rooms.map((room, i) => (
                <li
                  key={`${room}-${i}`}
                  className="flex justify-between items-center bg-surface-light rounded-xl px-4 py-3 border border-gray-600"
                >
                  <span className="text-gray-300">{room}</span>
                  <span className="font-mono text-2xl font-bold text-accent">{round.values[i]}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm text-center">Type the two-digit number for each room</p>
            <div className="space-y-3">
              {round.rooms.map((room, i) => (
                <div
                  key={`${room}-in-${i}`}
                  className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-gray-600"
                >
                  <span className="text-gray-300 w-28 shrink-0">{room}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={answers[i] ?? ''}
                    onChange={(e) => setAnswerAt(i, e.target.value)}
                    className="flex-1 bg-surface-light border border-gray-600 rounded-lg px-3 py-2 font-mono text-center text-white focus:outline-none focus:border-accent"
                    placeholder="##"
                    maxLength={2}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={submitRecall}
              className="w-full py-3 bg-accent rounded-xl font-bold hover:bg-accent-dark"
            >
              Submit recalls
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Memory palace numbers</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Numbers are paired with rooms. Study the map for 5 seconds, then type each number from memory.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 5, 7, 8].map((n) => (
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
