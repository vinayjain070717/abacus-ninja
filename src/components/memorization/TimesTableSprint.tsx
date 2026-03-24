import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateTimesTableProblem, type TimesTableProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'sprinting' | 'results';

const DIFF_PARAMS = {
  easy: { maxFactor: 9, timeLimitSeconds: 90 },
  medium: { maxFactor: 12, timeLimitSeconds: 60 },
  hard: { maxFactor: 15, timeLimitSeconds: 45 },
} as const;

export default function TimesTableSprint({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'sprinting' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [maxFactor, setMaxFactor] = useState(12);

  const wsParams = worksheetMode ? DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'] : DIFF_PARAMS.medium;
  const [secondsLeft, setSecondsLeft] = useState<number>(wsParams.timeLimitSeconds);
  const [activeTimeLimit, setActiveTimeLimit] = useState<number>(wsParams.timeLimitSeconds);
  const [problem, setProblem] = useState<TimesTableProblem | null>(() =>
    worksheetMode ? generateTimesTableProblem(wsParams.maxFactor) : null
  );
  const [answer, setAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const countsRef = useRef({ correct: 0, attempted: 0 });
  const sprintEndedRef = useRef(false);
  const sessionMaxFactorRef = useRef(wsParams.maxFactor);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const nextProblem = useCallback(() => {
    setProblem(generateTimesTableProblem(sessionMaxFactorRef.current));
    setAnswer('');
  }, []);

  const endSprint = useCallback(() => {
    if (sprintEndedRef.current) return;
    sprintEndedRef.current = true;
    const { correct, attempted: att } = countsRef.current;
    setPhase('results');
    if (worksheetMode && onCompleteRef.current) onCompleteRef.current(correct, att);
  }, [worksheetMode]);

  useEffect(() => {
    if (phase !== 'sprinting') return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          queueMicrotask(() => endSprint());
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, endSprint]);

  useEffect(() => {
    if (phase === 'sprinting' && problem) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [phase, problem]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    sessionMaxFactorRef.current = p.maxFactor;
    sprintEndedRef.current = false;
    countsRef.current = { correct: 0, attempted: 0 };
    setActiveTimeLimit(p.timeLimitSeconds);
    setSecondsLeft(p.timeLimitSeconds);
    setCorrectCount(0);
    setAttempted(0);
    setProblem(generateTimesTableProblem(p.maxFactor));
    setAnswer('');
    setPhase('sprinting');
  };

  const submit = () => {
    if (phase !== 'sprinting' || !problem || secondsLeft <= 0) return;
    const n = answer.trim() === '' ? NaN : Number(answer);
    const ok = n === problem.answer;
    countsRef.current.attempted += 1;
    if (ok) countsRef.current.correct += 1;
    setAttempted((a) => a + 1);
    if (ok) setCorrectCount((c) => c + 1);
    nextProblem();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (phase === 'results') {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Times table sprint</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-2">
            {activeTimeLimit}-second sprint
            {worksheetMode ? (
              <span className="block text-xs mt-1 text-gray-500">Worksheet mode · one {activeTimeLimit}s round</span>
            ) : null}
          </p>
          <div className="text-4xl font-bold mb-2 text-accent">{correctCount}</div>
          <p className="text-gray-400">correct out of {attempted} answered</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold text-white hover:bg-primary-dark"
          >
            Sprint again
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

  if (phase === 'sprinting' && problem) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-400">
            Correct: <span className="text-primary font-bold">{correctCount}</span>
          </div>
          <div
            className={`text-2xl font-mono font-bold tabular-nums px-4 py-2 rounded-xl bg-surface-light border ${
              secondsLeft <= 10 ? 'border-amber-500 text-amber-300' : 'border-gray-600 text-primary'
            }`}
          >
            {secondsLeft}s
          </div>
          <div className="text-sm text-gray-400">Answered: {attempted}</div>
        </div>
        <div className="bg-surface rounded-2xl p-10">
          <p className="text-gray-400 text-sm mb-4">Multiply</p>
          <p className="text-5xl font-bold font-mono text-primary mb-8">{problem.display}</p>
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
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Times table sprint</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          You have <span className="text-primary font-semibold">{DIFF_PARAMS[effectiveDiff].timeLimitSeconds} seconds</span>.
          Answer as many multiplication facts as you can. Wrong answers still count toward “answered.”
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Factors up to</label>
          <select
            value={maxFactor}
            onChange={(e) => setMaxFactor(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[9, 10, 12, 15].map((n) => (
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
          Start {DIFF_PARAMS[effectiveDiff].timeLimitSeconds}s sprint
        </button>
      </div>
    </div>
  );
}
