import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { startRange: 10, terms: 8 },
  medium: { startRange: 50, terms: 10 },
  hard: { startRange: 200, terms: 12 },
} as const;

interface FibProblem {
  a: number;
  b: number;
  terms: number;
  sequence: number[];
  display: string;
}

interface FibRoundResult {
  problem: FibProblem;
  correctTerms: number;
  totalTerms: number;
  correct: boolean;
  userRaw: string;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function buildSequence(a: number, b: number, terms: number): number[] {
  const seq = [a, b];
  for (let i = 2; i < terms; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

function makeProblem(startRange: number, terms: number): FibProblem {
  const a = randInt(1, startRange);
  const b = randInt(1, startRange);
  const sequence = buildSequence(a, b, terms);
  return {
    a,
    b,
    terms,
    sequence,
    display: `Start: ${a}, ${b} — enter the next ${terms - 2} terms (comma or space separated).`,
  };
}

function parseTerms(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
}

export default function FibonacciSprint({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 6);

  const [allProblems, setAllProblems] = useState<FibProblem[]>(() => {
    if (!worksheetMode) return [];
    const { startRange, terms } = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
    return Array.from({ length: worksheetMode.rounds }, () => makeProblem(startRange, terms));
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<FibRoundResult[]>([]);
  const [lastResult, setLastResult] = useState<FibRoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<FibRoundResult[]>([]);

  const problem = allProblems[currentIdx];

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const { startRange, terms } = DIFF_PARAMS[effectiveDiff];
    const ps = Array.from({ length: totalRounds }, () => makeProblem(startRange, terms));
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
    const expected = problem.sequence.slice(2);
    const got = parseTerms(answer);
    let correctTerms = 0;
    for (let i = 0; i < expected.length; i++) {
      if (got[i] === expected[i]) correctTerms++;
    }
    const totalTerms = expected.length;
    const correct = correctTerms === totalTerms;
    const row: FibRoundResult = { problem, correctTerms, totalTerms, correct, userRaw: answer };
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
      const nextResults = resultsRef.current;
      const score = nextResults.reduce((s, r) => s + r.correctTerms, 0);
      const total = nextResults.reduce((s, r) => s + r.totalTerms, 0);
      if (worksheetMode && onComplete) {
        onComplete(score, total);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'playing' && problem) {
    const { terms } = problem;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>
            Score: {results.reduce((s, r) => s + r.correctTerms, 0)}/
            {results.reduce((s, r) => s + r.totalTerms, 0)}
          </span>
        </div>
        <div className="bg-surface rounded-xl p-8 border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-2">Fibonacci-like sequence</p>
          <p className="text-xl font-bold text-primary mb-1">
            {problem.a}, {problem.b}, …
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Type the next {terms - 2} terms (each is the sum of the two before).
          </p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. 3, 5, 8, 13, 21, 34"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-lg font-mono focus:outline-none focus:border-primary"
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
    const expected = lastResult.problem.sequence.slice(2).join(', ');
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>
            Score: {results.reduce((s, r) => s + r.correctTerms, 0)}/
            {results.reduce((s, r) => s + r.totalTerms, 0)}
          </span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">{lastResult.problem.display}</p>
          <p className="text-gray-400 font-mono">
            Correct terms: {lastResult.correctTerms}/{lastResult.totalTerms} — full answer: {expected}
          </p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono text-xs mt-1">You entered: {lastResult.userRaw || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Fibonacci Sprint',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Fibonacci Sprint', icon: '🧠',
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
      <h2 className="text-2xl font-bold mb-6 text-center">Fibonacci sprint</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Two starting numbers are shown. Enter the next terms so each is the sum of the previous two.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 6, 8, 10, 12].map((n) => (
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
