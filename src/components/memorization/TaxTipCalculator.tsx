import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { percents: [5, 10, 15] as const },
  medium: { percents: [8, 12, 18, 20] as const },
  hard: { percents: [7.5, 13, 17.5, 22] as const },
} as const;

const TOLERANCE = 0.01;

interface TipProblem {
  billCents: number;
  tipPercent: number;
  total: number;
  display: string;
}

interface RoundResult {
  problem: TipProblem;
  userVal: number | null;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function makeProblem(percents: readonly number[]): TipProblem {
  const dollars = randInt(8, 120);
  const cents = randInt(0, 99);
  const billCents = dollars * 100 + cents;
  const tipPercent = percents[randInt(0, percents.length - 1)];
  const tipAmount = (billCents * tipPercent) / 100;
  const total = Math.round(billCents + tipAmount) / 100;
  const billStr = (billCents / 100).toFixed(2);
  const display = `Bill: $${billStr}, Tip: ${tipPercent}% — what is the total (bill + tip)?`;
  return { billCents, tipPercent, total, display };
}

function parseMoney(s: string): number | null {
  const t = s.trim().replace(/\$/g, '').replace(/\s/g, '').replace(/,/g, '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function TaxTipCalculator({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<TipProblem[]>(() => {
    if (!worksheetMode) return [];
    const percents = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].percents;
    return Array.from({ length: worksheetMode.rounds }, () => makeProblem(percents));
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<RoundResult[]>([]);

  const problem = allProblems[currentIdx];

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const percents = DIFF_PARAMS[effectiveDiff].percents;
    const ps = Array.from({ length: totalRounds }, () => makeProblem(percents));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setAnswer('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    if (!problem) return;
    const userVal = parseMoney(answer);
    const correct = userVal !== null && Math.abs(userVal - problem.total) <= TOLERANCE;
    const row: RoundResult = { problem, userVal, correct };
    setResults((r) => {
      const next = [...r, row];
      resultsRef.current = next;
      return next;
    });
    setLastResult(row);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setAnswer('');
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const rs = resultsRef.current;
      const score = rs.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, rs.length);
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
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-xl p-8 border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-2">Bill + tip total</p>
          <p className="text-xl md:text-2xl font-bold text-primary mb-2 leading-snug">
            Bill: ${(problem.billCents / 100).toFixed(2)}, Tip: {problem.tipPercent}%
          </p>
          <p className="text-gray-500 text-xs mb-6">Enter total in dollars (±${TOLERANCE.toFixed(2)}).</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. 51.75"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
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
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">{lastResult.problem.display}</p>
          <p className="text-gray-400 font-mono">Correct total: ${lastResult.problem.total.toFixed(2)}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your answer: {lastResult.userVal ?? '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Tax Tip Calculator',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Tax Tip Calculator', icon: '🧠',
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

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Tax &amp; tip calculator</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Compute the full amount after adding the tip to the bill. Answers within ±$0.01 count as correct.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 15, 20].map((n) => (
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
