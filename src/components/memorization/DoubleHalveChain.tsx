import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateDoubleHalveChain, type DoubleHalveProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { steps: 4, maxStart: 50 },
  medium: { steps: 6, maxStart: 200 },
  hard: { steps: 8, maxStart: 500 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: DoubleHalveProblem;
  userAnswer: number | null;
  correct: boolean;
}

export default function DoubleHalveChain({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [stepCount, setStepCount] = useState(5);
  const [maxStart, setMaxStart] = useState(48);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<DoubleHalveProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => {
          const p = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
          return generateDoubleHalveChain(p.steps, p.maxStart);
        })
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const problem = allProblems[currentIdx];

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    const ps = Array.from({ length: totalRounds }, () => generateDoubleHalveChain(p.steps, p.maxStart));
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
    const userAns = answer.trim() === '' ? null : Number(answer);
    const correct = userAns === problem.answer;
    const newResults = [...results, { problem, userAnswer: userAns, correct }];
    setResults(newResults);
    setLastResult({ problem, userAnswer: userAns, correct });
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
          <p className="text-gray-400 text-sm mb-4">Apply double and halve in order (halve uses integer division).</p>
          <div className="bg-surface-light rounded-xl p-6 mb-6">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Start</p>
            <p className="text-5xl font-bold tabular-nums text-accent">{problem.start}</p>
          </div>
          <ol className="text-left text-lg text-primary space-y-2 mb-6 list-decimal list-inside">
            {problem.steps.map((s, i) => (
              <li key={i} className="font-semibold capitalize">
                {s}
              </li>
            ))}
          </ol>
          <p className="text-gray-400 mb-3">Final value?</p>
          <input
            ref={inputRef}
            type="number"
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
          <p className="text-gray-300">
            Start: {lastResult.problem.start} → {lastResult.problem.steps.join(' → ')}
          </p>
          <p className="text-gray-400 font-mono">Final value: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your answer: {lastResult.userAnswer ?? '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Double / halve chain</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{score}/{results.length}</div>
        </div>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto text-left text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg font-mono ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="text-gray-200">Start {r.problem.start}</div>
              <div className="text-gray-400">
                {r.problem.steps.map((s, j) => (
                  <span key={j}>
                    → {s}
                    {j < r.problem.steps.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </div>
              <div className="mt-1 font-bold">= {r.problem.answer}</div>
              {!r.correct && <div className="text-red-400">You: {r.userAnswer ?? '—'}</div>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold text-white hover:bg-primary-dark"
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

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Double / halve chain</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Start from a number, then alternate <span className="text-primary font-semibold">double</span> and{' '}
          <span className="text-primary font-semibold">halve</span> (floor). Enter the final value.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Steps in chain</label>
          <select
            value={stepCount}
            onChange={(e) => setStepCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max starting number</label>
          <select
            value={maxStart}
            onChange={(e) => setMaxStart(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[24, 48, 64, 96].map((n) => (
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
            {[5, 8, 10, 15].map((n) => (
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
