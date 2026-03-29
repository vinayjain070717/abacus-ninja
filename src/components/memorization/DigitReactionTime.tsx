import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { displayMs: 1500 },
  medium: { displayMs: 1000 },
  hard: { displayMs: 600 },
} as const;

interface RoundResult {
  digit: number;
  correct: boolean;
  reactionMs: number | null;
  typed?: number;
}

function randomDigit(): number {
  return Math.floor(Math.random() * 10);
}

export default function DigitReactionTime({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [displayMs, setDisplayMs] = useState<number>(DIFF_PARAMS.medium.displayMs);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 15);

  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const [showDigit, setShowDigit] = useState(true);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;
  const shownAtRef = useRef(0);
  const answeredRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (worksheetMode) return;
    setDisplayMs(DIFF_PARAMS[difficulty].displayMs);
  }, [difficulty, worksheetMode]);

  const clearRoundTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startRound = useCallback(() => {
    answeredRef.current = false;
    const d = randomDigit();
    setCurrentDigit(d);
    setShowDigit(true);
    const ms = worksheetMode ? DIFF_PARAMS[effectiveDiff].displayMs : displayMs;
    shownAtRef.current = Date.now();
    clearRoundTimer();
    timeoutRef.current = window.setTimeout(() => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const miss: RoundResult = { digit: d, correct: false, reactionMs: null };
      const next = [...resultsRef.current, miss];
      resultsRef.current = next;
      setResults(next);
      setLastResult(miss);
      setShowDigit(false);
      setPhase('feedback');
    }, ms);
  }, [displayMs, effectiveDiff, worksheetMode]);

  useEffect(() => {
    if (phase !== 'playing') return;
    startRound();
    return () => clearRoundTimer();
  }, [phase, roundIndex, startRound]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    setDisplayMs(p.displayMs);
    setRoundIndex(0);
    setResults([]);
    setLastResult(null);
    resultsRef.current = [];
    setCurrentDigit(null);
    setPhase('playing');
  };

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== 'playing' || answeredRef.current || !showDigit || currentDigit === null) return;
      if (!/^[0-9]$/.test(e.key)) return;
      const typed = Number(e.key);
      answeredRef.current = true;
      clearRoundTimer();
      const reactionMs = Date.now() - shownAtRef.current;
      const correct = typed === currentDigit;
      const row: RoundResult = {
        digit: currentDigit,
        correct,
        reactionMs: correct ? reactionMs : null,
        typed: correct ? undefined : typed,
      };
      const next = [...resultsRef.current, row];
      resultsRef.current = next;
      setResults(next);
      setLastResult(row);
      setShowDigit(false);
      setPhase('feedback');
    },
    [phase, showDigit, currentDigit]
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, onKeyDown]);

  const advanceFromFeedback = () => {
    setLastResult(null);
    const prev = resultsRef.current;
    if (roundIndex + 1 < totalRounds) {
      setRoundIndex((i) => i + 1);
      setPhase('playing');
    } else {
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, prev.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {roundIndex + 1} / {totalRounds}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={roundIndex + 1 >= totalRounds}
        >
          <p className="text-gray-300">
            The digit was <span className="font-mono text-2xl text-accent">{lastResult.digit}</span>
          </p>
          {lastResult.correct && lastResult.reactionMs !== null && (
            <p className="text-gray-400 text-sm mt-2">Reaction time: {lastResult.reactionMs}ms</p>
          )}
          {!lastResult.correct && lastResult.typed !== undefined && (
            <p className="text-red-400 text-sm mt-2">You pressed {lastResult.typed}.</p>
          )}
          {!lastResult.correct && lastResult.typed === undefined && (
            <p className="text-red-400 text-sm mt-2">Too slow — digit was hidden.</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Digit Reaction Time',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Digit Reaction Time', icon: '🧠',
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

  if (phase === 'playing') {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {roundIndex + 1} / {totalRounds}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <h2 className="text-xl font-bold mb-4">Type the digit while it&apos;s visible</h2>
        <div className="bg-surface rounded-2xl p-16 min-h-[200px] flex items-center justify-center">
          {showDigit && currentDigit !== null ? (
            <span className="text-8xl font-bold font-mono text-accent tabular-nums">{currentDigit}</span>
          ) : (
            <span className="text-gray-500 text-lg">…</span>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-4">
          Flash time: {worksheetMode ? DIFF_PARAMS[effectiveDiff].displayMs : displayMs}ms
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Digit reaction</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          A digit flashes briefly. Press the matching number key before it disappears. Wrong keys count as a miss.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[10, 12, 15, 20].map((n) => (
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
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          Start
        </button>
      </div>
    </div>
  );
}
