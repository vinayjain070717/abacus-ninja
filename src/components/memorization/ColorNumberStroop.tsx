import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { displayMs: 3000 },
  medium: { displayMs: 2000 },
  hard: { displayMs: 1200 },
} as const;

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'] as const;
type ColorName = (typeof COLORS)[number];

const COLOR_CLASS: Record<ColorName, string> = {
  red: 'text-red-500',
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
};

type Phase = 'config' | 'playing' | 'feedback' | 'results';
type QuestionKind = 'number' | 'color';

interface StroopProblem {
  digit: number;
  inkColor: ColorName;
  question: QuestionKind;
  choices: (number | string)[];
  correct: number | string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildStroopProblem(): StroopProblem {
  const digit = Math.floor(Math.random() * 9) + 1;
  const inkColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const question: QuestionKind = Math.random() < 0.5 ? 'number' : 'color';

  if (question === 'number') {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== digit);
    const wrong = shuffle(pool).slice(0, 3);
    const choices = shuffle([digit, ...wrong]);
    return { digit, inkColor, question, choices, correct: digit };
  }

  const wrongColors = COLORS.filter((c) => c !== inkColor);
  const picks = shuffle([...wrongColors]).slice(0, 3);
  const choices = shuffle([inkColor, ...picks]);
  return { digit, inkColor, question, choices, correct: inkColor };
}

function generateAllProblems(count: number): StroopProblem[] {
  return Array.from({ length: count }, () => buildStroopProblem());
}

interface RoundResult {
  problem: StroopProblem;
  answered: boolean;
  picked: number | string | null;
  correct: boolean;
}

export default function ColorNumberStroop({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 15);

  const [allProblems, setAllProblems] = useState<StroopProblem[]>(() =>
    worksheetMode ? generateAllProblems(worksheetMode.rounds) : []
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

  const finalizeRound = (picked: number | string | null, answered: boolean) => {
    clearTimer();
    answeredRef.current = true;
    const problem = allProblems[currentIdx];
    if (!problem) return;
    const correct =
      picked !== null &&
      (typeof problem.correct === 'number'
        ? Number(picked) === problem.correct
        : String(picked) === String(problem.correct));
    const result: RoundResult = { problem, answered, picked, correct };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  const finishRound = (picked: number | string | null, answered: boolean) => {
    if (phase !== 'playing' || allProblems.length === 0 || answeredRef.current) return;
    finalizeRound(picked, answered);
  };

  useEffect(() => {
    if (phase !== 'playing' || allProblems.length === 0) return;
    const problem = allProblems[currentIdx];
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
        finalizeRound(null, false);
      }
    }, 50);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timer tied to round index only; finalize reads latest state via closure on tick
  }, [phase, currentIdx, allProblems, effectiveDiff, clearTimer]);

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setPhase('playing');
    } else {
      const score = results.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, allProblems.length);
        return;
      }
      setPhase('results');
    }
  };

  const startGame = () => {
    const n = totalRounds;
    const ps = generateAllProblems(n);
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const pick = (value: number | string) => {
    if (phase !== 'playing' || answeredRef.current) return;
    finishRound(value, true);
  };

  if (phase === 'feedback' && lastResult && allProblems.length > 0) {
    const { problem, correct, picked } = lastResult;
    const label =
      problem.question === 'number' ? `The number was ${problem.digit}.` : `The ink color was ${problem.inkColor}.`;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">{label}</p>
          {!correct && (
            <p className="text-red-400">
              {picked === null ? 'Time ran out.' : `You picked: ${String(picked)}`}
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Color & number Stroop — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
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

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    const ms = DIFF_PARAMS[effectiveDiff].displayMs;
    const progress = ms > 0 ? 1 - timeLeft / ms : 0;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-2">
            {problem.question === 'number' ? 'What is the number?' : 'What is the ink color?'}
          </p>
          <div className={`text-7xl font-bold font-mono tabular-nums ${COLOR_CLASS[problem.inkColor]}`}>
            {problem.digit}
          </div>
        </div>
        <div className="h-1.5 bg-surface-light rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-accent rounded-full transition-none"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {problem.choices.map((c, i) => (
            <button
              key={`${String(c)}-${i}`}
              type="button"
              onClick={() => pick(c)}
              className="py-4 rounded-xl font-bold bg-surface-light border border-gray-600 hover:border-accent hover:bg-surface transition-colors"
            >
              {String(c)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Color & number Stroop</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          A digit appears in colored ink. Answer what is asked — the digit or the ink color — before time runs out.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[10, 15, 20, 25].map((n) => (
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
