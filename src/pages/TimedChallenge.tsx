import { useEffect, useRef, useState, Suspense } from 'react';
import { APP_CONFIG, BRAIN_GAME_IDS, getBrainGameLabel } from '../config/appConfig';
import { CustomGameDispatcher } from './CustomWorksheet';

const UNSUPPORTED_GAMES = new Set(['simon-numbers']);

const TIME_OPTIONS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TIMED_GAME_IDS = BRAIN_GAME_IDS.filter((id) => !UNSUPPORTED_GAMES.has(id));

export default function TimedChallenge() {
  const [step, setStep] = useState<'pick' | 'play' | 'done'>('pick');
  const [gameId, setGameId] = useState(TIMED_GAME_IDS[0] ?? 'speed-grid');
  const [limitSec, setLimitSec] = useState<number>(APP_CONFIG.timedChallenge.defaultTimeLimitSeconds);
  const [sessionKey, setSessionKey] = useState(0);
  const [accumScore, setAccumScore] = useState(0);
  const [accumTotal, setAccumTotal] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const endAtRef = useRef<number>(0);
  const [, setTick] = useState(0);

  const remaining =
    step === 'play' && endAtRef.current > 0 ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000)) : 0;

  useEffect(() => {
    if (step !== 'play') return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 'play' || !endAtRef.current) return;
    if (Date.now() >= endAtRef.current) setStep('done');
  }, [step, remaining]);

  const start = () => {
    endAtRef.current = Date.now() + limitSec * 1000;
    setAccumScore(0);
    setAccumTotal(0);
    setRoundsCompleted(0);
    setSessionKey((k) => k + 1);
    setStep('play');
  };

  const onRoundComplete = (score: number, total: number) => {
    setAccumScore((s) => s + score);
    setAccumTotal((t) => t + total);
    setRoundsCompleted((r) => r + 1);
    if (Date.now() < endAtRef.current) {
      setSessionKey((k) => k + 1);
    } else {
      setStep('done');
    }
  };

  if (step === 'done') {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">Time&apos;s up</h2>
        <div className="rounded-xl border border-gray-700 bg-surface p-6 space-y-2">
          <p className="text-gray-400 text-sm">Rounds completed</p>
          <p className="text-3xl font-bold text-primary">{roundsCompleted}</p>
          <p className="text-gray-400 text-sm pt-2">Score (from finished rounds)</p>
          <p className="text-2xl font-mono">
            {accumScore}/{accumTotal || 0}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep('pick')}
          className="px-6 py-2 rounded-lg bg-accent font-semibold hover:bg-accent-dark"
        >
          New challenge
        </button>
      </div>
    );
  }

  if (step === 'pick') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">Timed challenge</h1>
        <p className="text-gray-400 text-sm text-center">Pick a brain game and how long you want to play.</p>

        <label className="block">
          <span className="text-sm text-gray-400 mb-1 block">Game</span>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-light border border-gray-600 focus:border-primary focus:outline-none"
          >
            {TIMED_GAME_IDS.map((id) => (
              <option key={id} value={id}>
                {getBrainGameLabel(id)}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-sm text-gray-400 mb-2 block">Time limit</span>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                type="button"
                onClick={() => setLimitSec(opt.seconds)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  limitSec === opt.seconds ? 'bg-primary text-white' : 'bg-surface-light text-gray-300 hover:bg-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={start} className="w-full py-3 rounded-xl bg-accent font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto relative">
      <div className="sticky top-0 z-20 mb-3 rounded-xl border-2 border-accent bg-surface/95 backdrop-blur px-4 py-3 flex items-center justify-between shadow-lg">
        <span className="text-sm font-semibold text-gray-300">{getBrainGameLabel(gameId)}</span>
        <span
          className={`font-mono text-xl font-bold tabular-nums ${remaining <= 10 ? 'text-red-400 animate-pulse' : 'text-primary'}`}
        >
          {formatClock(remaining)}
        </span>
      </div>

      <Suspense fallback={<div className="text-center text-gray-400 py-12">Loading game…</div>}>
        <CustomGameDispatcher key={sessionKey} gameType={gameId} rounds={1} onComplete={onRoundComplete} />
      </Suspense>
    </div>
  );
}
