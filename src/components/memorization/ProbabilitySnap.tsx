import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { type: 'coin-dice' as const },
  medium: { type: 'two-dice' as const },
  hard: { type: 'combinatorics' as const },
} as const;

const TOLERANCE = 0.01;

interface ProbProblem {
  question: string;
  answer: number;
  answerDisplay: string;
}

interface RoundResult {
  problem: ProbProblem;
  userVal: number | null;
  correct: boolean;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function parseProbability(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '');
  if (t === '') return null;
  const slash = t.indexOf('/');
  if (slash >= 0) {
    const num = Number(t.slice(0, slash));
    const den = Number(t.slice(slash + 1));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function probMatch(user: number, expected: number): boolean {
  return Math.abs(user - expected) <= TOLERANCE;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function makeEasy(): ProbProblem {
  const pool = [
    {
      q: 'Probability of heads on a fair coin flip?',
      a: 0.5,
      d: '1/2',
    },
    {
      q: 'Probability of tails on a fair coin flip?',
      a: 0.5,
      d: '1/2',
    },
    {
      q: 'Probability of rolling a 6 on a fair six-sided die?',
      a: 1 / 6,
      d: '1/6',
    },
    {
      q: 'Probability of rolling an even number on a fair six-sided die?',
      a: 0.5,
      d: '1/2',
    },
    {
      q: 'Probability of rolling at least 5 on a fair six-sided die?',
      a: 2 / 6,
      d: '1/3',
    },
  ];
  const pick = pool[randInt(0, pool.length - 1)];
  return { question: pick.q, answer: pick.a, answerDisplay: pick.d };
}

function diceWaysForSum(sum: number): number {
  let c = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (d1 + d2 === sum) c++;
    }
  }
  return c;
}

function makeMedium(): ProbProblem {
  const target = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12][randInt(0, 10)];
  const ways = diceWaysForSum(target);
  const g = gcd(ways, 36);
  const num = ways / g;
  const den = 36 / g;
  return {
    question: `Two fair dice are rolled. Probability their sum is ${target}?`,
    answer: ways / 36,
    answerDisplay: num === ways && den === 36 ? `${ways}/36` : `${num}/${den}`,
  };
}

function makeHard(): ProbProblem {
  const r = randInt(3, 7);
  const b = randInt(2, 6);
  const total = r + b;
  const pick = randInt(2, Math.min(4, r));
  const num = comb(r, pick) * comb(b, 0);
  const den = comb(total, pick);
  const g = gcd(num, den);
  const n2 = num / g;
  const d2 = den / g;
  return {
    question: `A bag has ${r} red and ${b} blue marbles. You pick ${pick} at random without replacement. Probability all ${pick} are red?`,
    answer: num / den,
    answerDisplay: `${n2}/${d2}`,
  };
}

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - k + i)) / i;
  }
  return Math.round(res);
}

function makeProblem(kind: 'coin-dice' | 'two-dice' | 'combinatorics'): ProbProblem {
  if (kind === 'coin-dice') return makeEasy();
  if (kind === 'two-dice') return makeMedium();
  return makeHard();
}

export default function ProbabilitySnap({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<ProbProblem[]>(() => {
    if (!worksheetMode) return [];
    const kind = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].type;
    return Array.from({ length: worksheetMode.rounds }, () => makeProblem(kind));
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
    const kind = DIFF_PARAMS[effectiveDiff].type;
    const ps = Array.from({ length: totalRounds }, () => makeProblem(kind));
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
    const userVal = parseProbability(answer);
    const correct = userVal !== null && probMatch(userVal, problem.answer);
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
          <p className="text-gray-400 text-sm mb-2">Probability snap</p>
          <p className="text-lg md:text-xl font-bold text-primary mb-6 leading-snug px-1">{problem.question}</p>
          <p className="text-gray-500 text-xs mb-4">Answer as a fraction (e.g. 1/6) or decimal (±{TOLERANCE}).</p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. 1/6 or 0.167"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary"
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
          <p className="text-gray-300 text-left">{lastResult.problem.question}</p>
          <p className="text-gray-400 font-mono">
            Correct: {lastResult.problem.answerDisplay} (≈ {lastResult.problem.answer.toFixed(4)})
          </p>
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
      title: 'Probability Snap',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Probability Snap', icon: '🧠',
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
      <h2 className="text-2xl font-bold mb-6 text-center">Probability snap</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Quick probability: easy coin and die, two-dice sums, or combinatorics. Use fractions or decimals.
        </p>
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
