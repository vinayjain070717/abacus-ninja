import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import { generatePrimeOrNotProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

const DIFF_PARAMS = {
  easy: { maxNumber: 50 },
  medium: { maxNumber: 100 },
  hard: { maxNumber: 200 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: { number: number; isPrime: boolean };
  chosePrime: boolean;
  correct: boolean;
}

export default function PrimeOrNot({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [maxNumber, setMaxNumber] = useState(100);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 12);

  const [allProblems, setAllProblems] = useState(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generatePrimeOrNotProblem(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].maxNumber)
        )
      : [] as { number: number; isPrime: boolean }[]
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const startTimeRef = useRef(Date.now());

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      const score = results.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, results.length);
        return;
      }
      setPhase('results');
    }
  };

  const startGame = () => {
    startTimeRef.current = Date.now();
    const mx = DIFF_PARAMS[effectiveDiff].maxNumber;
    const ps = Array.from({ length: totalRounds }, () => generatePrimeOrNotProblem(mx));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const choose = (prime: boolean) => {
    if (phase !== 'playing' || allProblems.length === 0) return;
    const problem = allProblems[currentIdx];
    const correct = prime === problem.isPrime;
    const result: RoundResult = { problem, chosePrime: prime, correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult && allProblems.length > 0) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-2xl font-mono font-bold text-gray-200">{lastResult.problem.number}</p>
          <p className="text-gray-400">{lastResult.problem.isPrime ? 'is Prime' : 'is Not Prime'}</p>
          {!lastResult.correct && (
            <p className="text-red-400">You chose: {lastResult.chosePrime ? 'Prime' : 'Not Prime'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Prime or Not',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Prime or Not', icon: '🔍',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: String(r.problem.number),
          correct: r.correct,
          correctAnswer: r.problem.isPrime ? 'Prime' : 'Not Prime',
          userAnswer: r.chosePrime ? 'Prime' : 'Not Prime',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-2xl p-10 mb-6 transition-[box-shadow,background-color] duration-200">
          <p className="text-gray-400 text-sm mb-4">Is this number prime?</p>
          <div className="text-6xl font-bold font-mono tabular-nums">{problem.number}</div>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => choose(true)}
            className="flex-1 min-w-[140px] py-4 rounded-xl font-bold bg-surface-light hover:bg-primary hover:text-white transition-colors disabled:opacity-50 border border-gray-600"
          >
            Prime
          </button>
          <button
            type="button"
            onClick={() => choose(false)}
            className="flex-1 min-w-[140px] py-4 rounded-xl font-bold bg-surface-light hover:bg-accent hover:text-white transition-colors disabled:opacity-50 border border-gray-600"
          >
            Not prime
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Prime or not</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Decide quickly whether each number is prime.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max number</label>
          <select
            value={maxNumber}
            onChange={(e) => setMaxNumber(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[50, 100, 150, 200].map((n) => (
              <option key={n} value={n}>
                Up to {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[8, 12, 15, 20].map((n) => (
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
