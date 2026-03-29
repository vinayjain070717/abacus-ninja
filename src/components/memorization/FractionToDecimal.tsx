import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import { generateFractionProblem, type FractionProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

const DIFF_PARAMS = {
  easy: { maxDenom: 5 },
  medium: { maxDenom: 10 },
  hard: { maxDenom: 20 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const TOLERANCE = 0.01;

interface RoundResult {
  problem: FractionProblem;
  userAnswer: number | null;
  correct: boolean;
}

function parseNumber(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function FractionToDecimal({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [maxDenominator, setMaxDenominator] = useState(12);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 12);

  const [allProblems, setAllProblems] = useState<FractionProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateFractionProblem(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].maxDenom)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());

  const problem = allProblems[currentIdx];

  const startGame = () => {
    startTimeRef.current = Date.now();
    const md = DIFF_PARAMS[effectiveDiff].maxDenom;
    const ps = Array.from({ length: totalRounds }, () => generateFractionProblem(md));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setAnswer('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submit = () => {
    if (!problem) return;
    const userVal = parseNumber(answer);
    const correct =
      userVal !== null && Math.abs(userVal - problem.answer) <= TOLERANCE;
    const newResults = [
      ...results,
      { problem, userAnswer: userVal, correct },
    ];
    setResults(newResults);
    setLastResult({ problem, userAnswer: userVal, correct });
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setAnswer('');
      setTimeout(() => inputRef.current?.focus(), 100);
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

  if (phase === 'playing' && problem) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 text-sm mb-4">Convert to decimal</p>
          <div className="flex flex-col items-center mb-6">
            <span className="text-5xl font-bold tabular-nums text-primary">{problem.numerator}</span>
            <div className="w-20 border-t-2 border-gray-400 my-1" />
            <span className="text-5xl font-bold tabular-nums text-primary">{problem.denominator}</span>
          </div>
          <p className="text-gray-500 text-xs mb-4">±{TOLERANCE} tolerance</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full max-w-xs mx-auto px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  if (phase === 'feedback' && lastResult) {
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
          <p className="text-gray-300">{lastResult.problem.display}</p>
          <p className="text-gray-400 font-mono">Correct answer: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your answer: {lastResult.userAnswer ?? '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Fraction → Decimal',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Fraction → Decimal', icon: '🔢',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: r.problem.display,
          correct: r.correct,
          correctAnswer: String(r.problem.answer),
          userAnswer: r.userAnswer != null ? String(r.userAnswer) : '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Fraction → decimal</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Type the decimal equivalent. Answers are checked to three decimal places (±{TOLERANCE}).
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max denominator</label>
          <select
            value={maxDenominator}
            onChange={(e) => setMaxDenominator(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[8, 10, 12, 16, 20].map((n) => (
              <option key={n} value={n}>
                {n}
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
