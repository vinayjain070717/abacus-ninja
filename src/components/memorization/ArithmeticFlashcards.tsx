import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const TIME_SECONDS = 60;

const DIFF_PARAMS = {
  easy: { ops: ['+', '-'] as const, maxVal: 20 },
  medium: { ops: ['+', '-', '*'] as const, maxVal: 50 },
  hard: { ops: ['+', '-', '*', '/'] as const, maxVal: 100 },
} as const;

type Op = '+' | '-' | '*' | '/';

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOp(ops: readonly Op[]): Op {
  return ops[randomInt(0, ops.length - 1)]!;
}

export interface ArithmeticFlashProblem {
  display: string;
  answer: number;
}

export function generateArithmeticFlashProblem(maxVal: number, ops: readonly Op[]): ArithmeticFlashProblem {
  const op = pickOp(ops);
  if (op === '+') {
    const a = randomInt(1, maxVal);
    const b = randomInt(1, maxVal);
    return { display: `${a} + ${b}`, answer: a + b };
  }
  if (op === '-') {
    let a = randomInt(1, maxVal);
    let b = randomInt(1, maxVal);
    if (b > a) [a, b] = [b, a];
    return { display: `${a} − ${b}`, answer: a - b };
  }
  if (op === '*') {
    const cap = Math.min(12, maxVal);
    const a = randomInt(2, Math.max(2, cap));
    const b = randomInt(2, Math.max(2, cap));
    return { display: `${a} × ${b}`, answer: a * b };
  }
  const divisor = randomInt(2, Math.min(12, maxVal));
  const quotient = randomInt(1, Math.max(1, Math.floor(maxVal / divisor)));
  const dividend = divisor * quotient;
  return { display: `${dividend} ÷ ${divisor}`, answer: quotient };
}

export default function ArithmeticFlashcards({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;

  const [secondsLeft, setSecondsLeft] = useState(TIME_SECONDS);
  const [problem, setProblem] = useState<ArithmeticFlashProblem | null>(null);
  const [answer, setAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [attempted, setAttempted] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const countsRef = useRef({ correct: 0, attempted: 0 });
  const sprintEndedRef = useRef(false);
  const paramsRef = useRef<{ ops: readonly Op[]; maxVal: number }>(DIFF_PARAMS.medium);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!worksheetMode) {
      paramsRef.current = DIFF_PARAMS[difficulty];
    }
  }, [difficulty, worksheetMode]);

  const nextProblem = useCallback(() => {
    const p = paramsRef.current;
    setProblem(generateArithmeticFlashProblem(p.maxVal, p.ops));
    setAnswer('');
  }, []);

  const finishPlaying = useCallback(() => {
    if (sprintEndedRef.current) return;
    sprintEndedRef.current = true;
    const { correct, attempted: att } = countsRef.current;
    setCorrectCount(correct);
    setAttempted(att);
    if (worksheetMode && onCompleteRef.current) {
      onCompleteRef.current(correct, att);
      setPhase('results');
      return;
    }
    setPhase('feedback');
  }, [worksheetMode]);

  useEffect(() => {
    if (phase !== 'playing' || !problem) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          queueMicrotask(() => finishPlaying());
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, problem, finishPlaying]);

  useEffect(() => {
    if (phase === 'playing' && problem) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [phase, problem]);

  const startGame = () => {
    paramsRef.current = DIFF_PARAMS[effectiveDiff];
    sprintEndedRef.current = false;
    countsRef.current = { correct: 0, attempted: 0 };
    setSecondsLeft(TIME_SECONDS);
    setCorrectCount(0);
    setAttempted(0);
    setProblem(generateArithmeticFlashProblem(paramsRef.current.maxVal, paramsRef.current.ops));
    setAnswer('');
    setPhase('playing');
  };

  useEffect(() => {
    if (!worksheetMode || phase !== 'playing') return;
    paramsRef.current = DIFF_PARAMS[effectiveDiff];
    if (!problem) {
      setProblem(generateArithmeticFlashProblem(paramsRef.current.maxVal, paramsRef.current.ops));
    }
  }, [worksheetMode, phase, effectiveDiff, problem]);

  const submit = () => {
    if (phase !== 'playing' || !problem || secondsLeft <= 0) return;
    const n = answer.trim() === '' ? NaN : Number(answer);
    const ok = n === problem.answer;
    countsRef.current.attempted += 1;
    if (ok) countsRef.current.correct += 1;
    setAttempted((a) => a + 1);
    if (ok) setCorrectCount((c) => c + 1);
    nextProblem();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const leaveFeedback = () => {
    setPhase('results');
  };

  if (phase === 'feedback') {
    const c = countsRef.current.correct;
    const a = countsRef.current.attempted;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <RoundFeedback correct={c > 0} onNext={leaveFeedback} isLastRound>
          <p className="text-gray-300 font-semibold">Time&apos;s up ({TIME_SECONDS}s)</p>
          <p className="text-gray-400 text-sm mt-2">
            Correct: <span className="text-accent font-bold">{c}</span> · Answered:{' '}
            <span className="font-mono">{a}</span>
          </p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Arithmetic flashcards</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-2">{TIME_SECONDS}-second round</p>
          <div className="text-4xl font-bold mb-2 text-accent">{correctCount}</div>
          <p className="text-gray-400">correct out of {attempted} answered</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark"
          >
            Play again
          </button>
          {!worksheetMode && (
            <button
              type="button"
              onClick={() => setPhase('config')}
              className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600"
            >
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && problem) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-400">
            Correct: <span className="text-primary font-bold">{countsRef.current.correct}</span>
          </div>
          <div
            className={`text-2xl font-mono font-bold tabular-nums px-4 py-2 rounded-xl bg-surface-light border ${
              secondsLeft <= 10 ? 'border-amber-500 text-amber-300' : 'border-gray-600 text-primary'
            }`}
          >
            {secondsLeft}s
          </div>
          <div className="text-sm text-gray-400">Done: {countsRef.current.attempted}</div>
        </div>
        <div className="bg-surface rounded-2xl p-10">
          <p className="text-gray-400 text-sm mb-4">Solve</p>
          <p className="text-4xl sm:text-5xl font-bold font-mono text-primary mb-8">{problem.display}</p>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full max-w-xs mx-auto px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-3xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit (Enter)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Arithmetic flashcards</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          You have <span className="text-primary font-semibold">{TIME_SECONDS} seconds</span>. Type each answer and
          press Enter for the next problem. Wrong answers still count as attempts.
        </p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button
          type="button"
          onClick={startGame}
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          Start {TIME_SECONDS}s round
        </button>
      </div>
    </div>
  );
}
