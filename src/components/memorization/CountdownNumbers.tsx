import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import { generateCountdownProblem, type CountdownProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

const DIFF_PARAMS = {
  easy: { numberCount: 4 },
  medium: { numberCount: 5 },
  hard: { numberCount: 6 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: CountdownProblem;
  expr: string;
  correct: boolean;
}

function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function evalMatchesCountdown(expr: string, numbers: number[], target: number): boolean {
  try {
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/x/gi, '*');
    const extracted = normalized.match(/\d+/g)?.map(Number) ?? [];
    if (!multisetEqual(extracted, numbers)) return false;
    const result = Function(`"use strict"; return (${normalized})`)();
    return typeof result === 'number' && Number.isFinite(result) && Math.abs(result - target) < 1e-9;
  } catch {
    return false;
  }
}

export default function CountdownNumbers({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [numberCount, setNumberCount] = useState(4);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 6);

  const [allProblems, setAllProblems] = useState<CountdownProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateCountdownProblem(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].numberCount)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [expr, setExpr] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const nc = DIFF_PARAMS[effectiveDiff].numberCount;
    const ps = Array.from({ length: totalRounds }, () => generateCountdownProblem(nc));
    setAllProblems(ps);
    setCurrentIdx(0);
    setExpr('');
    setResults([]);
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const trimmed = expr.trim();
    const correct = evalMatchesCountdown(trimmed, problem.numbers, problem.target);
    const result = { problem, expr: trimmed, correct };
    setResults((prev) => [...prev, result]);
    setExpr('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
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

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Countdown</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            Target: {lastResult.problem.target} · Numbers: [{lastResult.problem.numbers.join(', ')}]
          </p>
          <p className="text-gray-400 font-mono text-xs mt-1">Your expression: {lastResult.expr || '—'}</p>
          {!lastResult.correct && (
            <div className="mt-2">
              <p className="text-red-400 text-sm">Did not reach the target.</p>
              <p className="text-gray-500 font-mono text-xs mt-1">One solution: {lastResult.problem.solution}</p>
            </div>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Countdown Numbers',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Countdown Numbers', icon: '🎯',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: `[${r.problem.numbers.join(', ')}] → ${r.problem.target}`,
          correct: r.correct,
          correctAnswer: r.problem.solution,
          userAnswer: r.expr || '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Countdown</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">Use every number exactly once with +, −, ×, ÷ and parentheses.</p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {problem.numbers.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="px-4 py-2 rounded-xl bg-surface-light font-mono font-bold text-lg border border-gray-600"
              >
                {n}
              </span>
            ))}
          </div>
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">Target</span>
            <div className="text-4xl font-bold font-mono text-accent">{problem.target}</div>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. (50 - 25) * 10 + 75"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-lg font-mono focus:outline-none focus:border-primary text-white"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="w-full py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Countdown numbers</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Combine all given numbers to hit the target exactly.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Numbers per puzzle</label>
          <select
            value={numberCount}
            onChange={(e) => setNumberCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 5, 6].map((n) => (
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
            {[4, 6, 8, 10].map((n) => (
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
