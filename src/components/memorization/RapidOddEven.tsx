import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { maxValue: 20, displayMs: 2000 },
  medium: { maxValue: 100, displayMs: 1500 },
  hard: { maxValue: 999, displayMs: 1000 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundProblem {
  n: number;
  isOdd: boolean;
}

interface RoundResult {
  problem: RoundProblem;
  pickedOdd: boolean | null;
  correct: boolean;
}

function randomProblem(maxValue: number): RoundProblem {
  const n = Math.floor(Math.random() * maxValue) + 1;
  return { n, isOdd: n % 2 === 1 };
}

export default function RapidOddEven({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 20);

  const [problems, setProblems] = useState<RoundProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          randomProblem(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].maxValue)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const answeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const finalizeRound = (pickedOdd: boolean | null) => {
    clearTimer();
    answeredRef.current = true;
    const problem = problems[currentIdx];
    if (!problem) return;
    const correct = pickedOdd !== null && pickedOdd === problem.isOdd;
    const result: RoundResult = { problem, pickedOdd, correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  const choose = (pickedOdd: boolean) => {
    if (phase !== 'playing' || answeredRef.current) return;
    finalizeRound(pickedOdd);
  };

  useEffect(() => {
    if (phase !== 'playing' || problems.length === 0) return;
    const problem = problems[currentIdx];
    if (!problem) return;
    answeredRef.current = false;
    const ms = DIFF_PARAMS[effectiveDiff].displayMs;
    setTimeLeft(ms);
    const start = Date.now();
    clearTimer();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setTimeLeft(Math.max(0, ms - elapsed));
      if (elapsed >= ms && !answeredRef.current) {
        finalizeRound(null);
      }
    }, 50);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx, problems, effectiveDiff]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const mx = DIFF_PARAMS[effectiveDiff].maxValue;
    const ps = Array.from({ length: totalRounds }, () => randomProblem(mx));
    setProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < problems.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      const score = results.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, problems.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult && problems.length > 0) {
    const { problem, correct, pickedOdd } = lastResult;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {problems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= problems.length}
        >
          <p className="text-3xl font-mono font-bold text-gray-200">{problem.n}</p>
          <p className="text-gray-400">{problem.isOdd ? 'Odd' : 'Even'}</p>
          {!correct && (
            <p className="text-red-400">
              {pickedOdd === null ? 'Time ran out.' : `You chose: ${pickedOdd ? 'Odd' : 'Even'}`}
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
      title: 'Rapid Odd Even',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Rapid Odd Even', icon: '🧠',
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

  if (phase === 'playing' && problems.length > 0) {
    const problem = problems[currentIdx];
    const ms = DIFF_PARAMS[effectiveDiff].displayMs;
    const progress = ms > 0 ? 1 - timeLeft / ms : 0;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {problems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-xl p-10 mb-4">
          <p className="text-gray-400 text-sm mb-4">Odd or even?</p>
          <div className="text-6xl font-bold font-mono tabular-nums">{problem.n}</div>
        </div>
        <div className="h-1.5 bg-surface-light rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-accent rounded-full transition-none"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => choose(true)}
            className="flex-1 min-w-[120px] py-4 rounded-xl font-bold bg-surface-light border border-gray-600 hover:border-accent hover:bg-surface transition-colors"
          >
            Odd
          </button>
          <button
            type="button"
            onClick={() => choose(false)}
            className="flex-1 min-w-[120px] py-4 rounded-xl font-bold bg-surface-light border border-gray-600 hover:border-accent hover:bg-surface transition-colors"
          >
            Even
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Rapid odd / even</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Classify each number before the bar runs out.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[15, 20, 25, 30].map((n) => (
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
