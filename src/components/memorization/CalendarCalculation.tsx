import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateCalendarProblem, type CalendarProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS: Record<Difficulty, { yearStart: number; yearEnd: number }> = {
  easy: { yearStart: 2020, yearEnd: 2026 },
  medium: { yearStart: 2000, yearEnd: 2030 },
  hard: { yearStart: 1900, yearEnd: 2099 },
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface RoundResult {
  problem: CalendarProblem;
  picked: string;
  correct: boolean;
}

export default function CalendarCalculation({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<CalendarProblem[]>(() => {
    if (!worksheetMode) return [];
    const y = DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty];
    return Array.from({ length: worksheetMode.rounds }, () =>
      generateCalendarProblem([y.yearStart, y.yearEnd])
    );
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;

  const problem = allProblems[currentIdx];

  const startGame = () => {
    const { yearStart, yearEnd } = DIFF_PARAMS[effectiveDiff];
    const lo = Math.min(yearStart, yearEnd);
    const hi = Math.max(yearStart, yearEnd);
    const ps = Array.from({ length: totalRounds }, () => generateCalendarProblem([lo, hi]));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setPhase('playing');
  };

  const pickDay = (day: string) => {
    if (!problem || phase !== 'playing') return;
    const correct = day === problem.dayOfWeek;
    const row: RoundResult = { problem, picked: day, correct };
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
    setLastResult(row);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, Math.max(1, prev.length));
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Calendar Calculation</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2 text-primary tabular-nums">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Correct</p>
        </div>
        <div className="space-y-2 mb-6 text-left text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                r.correct ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'
              }`}
            >
              <div className="text-gray-300">{r.problem.display}</div>
              <div className="text-primary mt-1">Answer: {r.problem.dayOfWeek}</div>
              {!r.correct && <div className="text-red-400 mt-1">You: {r.picked}</div>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">
            Play Again
          </button>
          {!worksheetMode && (
            <button type="button" onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Calendar</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">{lastResult.problem.display}</p>
          <p className="text-gray-400">Correct day: {lastResult.problem.dayOfWeek}</p>
          {!lastResult.correct && <p className="text-red-400">You chose: {lastResult.picked}</p>}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'playing' && problem) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Day of week</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-6 border border-gray-700/50">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">What day was</p>
          <p className="text-2xl md:text-3xl font-bold text-primary mb-6">{problem.display}?</p>
          <div className="grid grid-cols-1 gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pickDay(d)}
                className="py-3 px-4 bg-surface-light hover:bg-primary/30 border border-gray-600 rounded-lg font-semibold text-left"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Calendar Calculation</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Given a calendar date, choose the correct day of the week.</p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 12, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
