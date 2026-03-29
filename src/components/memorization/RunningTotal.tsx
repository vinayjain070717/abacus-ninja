import { useState, useEffect, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import { generateRunningTotalProblem, type RunningTotalProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

type Phase = 'config' | 'flashing' | 'input' | 'feedback' | 'results';

const FLASH_MS = 1500;

const DIFF_PARAMS = {
  easy: { steps: 4, maxOperand: 10 },
  medium: { steps: 6, maxOperand: 20 },
  hard: { steps: 8, maxOperand: 50 },
} as const;

function maxOperandToMaxDigits(maxOperand: number): number {
  if (maxOperand <= 12) return 1;
  if (maxOperand <= 99) return 2;
  return 3;
}

interface RoundResult {
  problem: RunningTotalProblem;
  userAnswer: number | null;
  correct: boolean;
}

export default function RunningTotal({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'flashing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [opCount, setOpCount] = useState(6);
  const [maxDigits, setMaxDigits] = useState(1);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<RunningTotalProblem[]>(() => {
    if (!worksheetMode) return [];
    const p = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
    const md = maxOperandToMaxDigits(p.maxOperand);
    return Array.from({ length: worksheetMode.rounds }, () => generateRunningTotalProblem(p.steps, md));
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [opIndex, setOpIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());

  const problem = allProblems[currentIdx];

  useEffect(() => {
    if (phase !== 'flashing' || !problem || problem.operations.length === 0) return;
    if (opIndex >= problem.operations.length) {
      setPhase('input');
    }
  }, [phase, opIndex, problem]);

  useEffect(() => {
    if (phase !== 'flashing' || !problem || problem.operations.length === 0) return;
    if (opIndex >= problem.operations.length) {
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    const t = setTimeout(() => setOpIndex((i) => i + 1), FLASH_MS);
    return () => clearTimeout(t);
  }, [phase, opIndex, problem]);

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    const steps = p.steps;
    const maxD = maxOperandToMaxDigits(p.maxOperand);
    const ps = Array.from({ length: totalRounds }, () => generateRunningTotalProblem(steps, maxD));
    setAllProblems(ps);
    setCurrentIdx(0);
    setOpIndex(0);
    setResults([]);
    setAnswer('');
    setLastResult(null);
    setPhase('flashing');
  };

  const submitAnswer = () => {
    if (!problem) return;
    const userAns = answer.trim() === '' ? null : Number(answer);
    const correct = userAns === problem.answer;
    const result = { problem, userAnswer: userAns, correct };
    setResults((prev) => [...prev, result]);
    setAnswer('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setOpIndex(0);
      setPhase('flashing');
    } else {
      const score = results.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, results.length);
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
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Running total</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            {lastResult.problem.operations.map((o) => `${o.op} ${o.value}`).join(' ')} →{' '}
            {lastResult.problem.answer}
          </p>
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
      title: 'Running Total',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Running Total', icon: '🔢',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: r.problem.operations.map((o) => `${o.op} ${o.value}`).join(' '),
          correct: r.correct,
          correctAnswer: String(r.problem.answer),
          userAnswer: r.userAnswer != null ? String(r.userAnswer) : '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'flashing' && problem) {
    const currentOp = opIndex < problem.operations.length ? problem.operations[opIndex] : null;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Running total</span>
        </div>
        <div className="bg-surface rounded-2xl p-10 min-h-[200px] flex items-center justify-center">
          {currentOp && (
            <div className="flex items-baseline justify-center gap-4">
              <span className="text-5xl font-bold text-accent">{currentOp.op}</span>
              <span className="text-6xl font-bold tabular-nums">{currentOp.value}</span>
            </div>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-4">
          Step {Math.min(opIndex + 1, problem.operations.length)} / {problem.operations.length}
        </p>
      </div>
    );
  }

  if (phase === 'input' && problem) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Running total</span>
        </div>
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">What is the final total?</p>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
            className="w-full max-w-xs mx-auto px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={submitAnswer}
          className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Running total</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Operations flash one at a time (<span className="text-primary">+</span> or{' '}
          <span className="text-primary">−</span>). Keep a running total and enter the result.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Operations per round</label>
          <select
            value={opCount}
            onChange={(e) => setOpCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Number size</label>
          <div className="flex gap-2">
            {[1, 2].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMaxDigits(d)}
                className={`flex-1 py-2 rounded-lg font-bold ${
                  maxDigits === d ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'
                }`}
              >
                {d}-digit
              </button>
            ))}
          </div>
        </div>
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
