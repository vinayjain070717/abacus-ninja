import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { dividendDigits: 2, divisorDigits: 1 },
  medium: { dividendDigits: 3, divisorDigits: 1 },
  hard: { dividendDigits: 4, divisorDigits: 2 },
} as const;

interface DivisionProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
}

interface RoundResult {
  problem: DivisionProblem;
  quotientInput: string;
  remainderInput: string;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minForDigits(d: number): number {
  return d <= 1 ? 1 : 10 ** (d - 1);
}

function maxForDigits(d: number): number {
  return 10 ** d - 1;
}

function generateProblem(p: { dividendDigits: number; divisorDigits: number }): DivisionProblem {
  const dMin = minForDigits(p.dividendDigits);
  const dMax = maxForDigits(p.dividendDigits);
  const sMin = p.divisorDigits === 1 ? 2 : 10;
  const sMax = p.divisorDigits === 1 ? 9 : 99;

  for (let attempt = 0; attempt < 80; attempt++) {
    const divisor = randInt(sMin, sMax);
    const dividend = randInt(Math.max(dMin, divisor + 1), dMax);
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    if (quotient >= 1) {
      return { dividend, divisor, quotient, remainder };
    }
  }
  const divisor = 2;
  const dividend = Math.max(dMin, divisor * 5);
  return {
    dividend,
    divisor,
    quotient: Math.floor(dividend / divisor),
    remainder: dividend % divisor,
  };
}

function generateAllProblems(rounds: number, diff: Difficulty): DivisionProblem[] {
  const p = DIFF_PARAMS[diff];
  return Array.from({ length: rounds }, () => generateProblem(p));
}

function checkAnswer(
  problem: DivisionProblem,
  quotientStr: string,
  remainderStr: string
): boolean {
  const q = Number(quotientStr.trim());
  if (!Number.isFinite(q) || !Number.isInteger(q)) return false;
  if (q !== problem.quotient) return false;
  const remTrim = remainderStr.trim();
  if (remTrim === '') return true;
  const r = Number(remTrim);
  return Number.isFinite(r) && Number.isInteger(r) && r === problem.remainder;
}

export default function MentalDivisionRace({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const initialDiff = (worksheetMode?.difficulty ?? 'medium') as Difficulty;
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);
  const [allProblems, setAllProblems] = useState<DivisionProblem[]>(() =>
    worksheetMode ? generateAllProblems(worksheetMode.rounds, initialDiff) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [quotientInput, setQuotientInput] = useState('');
  const [remainderInput, setRemainderInput] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const quotientRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    const ps = generateAllProblems(totalRounds, effectiveDiff);
    setAllProblems(ps);
    setCurrentIdx(0);
    setQuotientInput('');
    setRemainderInput('');
    setResults([]);
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => quotientRef.current?.focus(), 50);
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const correct = checkAnswer(problem, quotientInput, remainderInput);
    const result: RoundResult = {
      problem,
      quotientInput,
      remainderInput,
      correct,
    };
    setResults((prev) => [...prev, result]);
    setQuotientInput('');
    setRemainderInput('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setTimeout(() => quotientRef.current?.focus(), 50);
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
    const pr = lastResult.problem;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Division race</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            {pr.dividend} ÷ {pr.divisor} = {pr.quotient} remainder {pr.remainder}
          </p>
          {!lastResult.correct && (
            <p className="text-gray-400 text-xs mt-1">
              Your answer: Q {lastResult.quotientInput || '—'}
              {lastResult.remainderInput.trim() !== '' ? `, R ${lastResult.remainderInput}` : ''}
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Division race — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
        </div>
        <div className="space-y-2 mb-6 text-left max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="font-mono text-gray-300">
                {r.problem.dividend} ÷ {r.problem.divisor} → Q {r.problem.quotient} R {r.problem.remainder}
              </div>
              <div className="mt-1 text-gray-400">
                You: Q {r.quotientInput || '—'}
                {r.remainderInput.trim() !== '' ? `, R ${r.remainderInput}` : ''}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark text-white"
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

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Division race</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">Integer quotient; remainder optional but must be exact if you enter it.</p>
          <div className="text-center mb-6">
            <span className="text-gray-400 text-sm">Divide</span>
            <div className="text-4xl font-bold font-mono text-accent mt-1">
              {problem.dividend} ÷ {problem.divisor}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quotient</label>
              <input
                ref={quotientRef}
                type="text"
                inputMode="numeric"
                value={quotientInput}
                onChange={(e) => setQuotientInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-lg font-mono focus:outline-none focus:border-primary text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Remainder (optional)</label>
              <input
                type="text"
                inputMode="numeric"
                value={remainderInput}
                onChange={(e) => setRemainderInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-lg font-mono focus:outline-none focus:border-primary text-white"
              />
            </div>
          </div>
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
      <h2 className="text-2xl font-bold mb-6 text-center">Mental division race</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Type the quotient (and remainder if you like). Wrong remainder counts wrong if entered.</p>
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
