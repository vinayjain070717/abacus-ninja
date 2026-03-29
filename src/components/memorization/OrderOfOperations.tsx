import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { operators: 2, maxValue: 10 },
  medium: { operators: 3, maxValue: 20 },
  hard: { operators: 4, maxValue: 50 },
} as const;

interface OoProblem {
  expression: string;
  answer: number;
}

interface RoundResult {
  problem: OoProblem;
  userAnswer: string;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOp(allowDiv: boolean): string {
  const pool = allowDiv ? (['+', '-', '*', '/'] as const) : (['+', '-', '*'] as const);
  return pool[randInt(0, pool.length - 1)];
}

function evalExpr(expr: string): number {
  const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/');
  return Function(`"use strict"; return (${normalized})`)() as number;
}

function isAcceptableAnswer(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n - Math.round(n)) < 1e-9 && Math.abs(n) <= 1e9;
}

function maybeAddParens(inner: string, wrap: boolean): string {
  return wrap ? `(${inner})` : inner;
}

/** Build a random binary tree, stringify with parentheses, integer answer */
function generateProblem(numOps: number, maxVal: number, allowDiv: boolean): OoProblem {
  for (let attempt = 0; attempt < 120; attempt++) {
    type Node =
      | { k: 'n'; v: number }
      | { k: 'b'; op: string; left: Node; right: Node };

    function build(size: number): Node {
      if (size === 1) return { k: 'n', v: randInt(1, maxVal) };
      const leftSize = randInt(1, size - 1);
      const rightSize = size - leftSize;
      return {
        k: 'b',
        op: pickOp(allowDiv),
        left: build(leftSize),
        right: build(rightSize),
      };
    }

    function toString(n: Node, parentPrec: number, isRightChild: boolean): string {
      if (n.k === 'n') return String(n.v);
      const prec = n.op === '+' || n.op === '-' ? 1 : 2;
      let s = `${toString(n.left, prec, false)} ${n.op === '*' ? '×' : n.op === '/' ? '÷' : n.op} ${toString(
        n.right,
        prec,
        true
      )}`;
      if (n.op === '-' && n.right.k === 'b') {
        s = `${toString(n.left, prec, false)} - (${toString(n.right, 0, false)})`;
      }
      const needParen =
        parentPrec > prec || (parentPrec === prec && isRightChild && (n.op === '-' || n.op === '/'));
      return maybeAddParens(s, needParen);
    }

    const root = build(numOps + 1);
    const expression = toString(root, 0, false).replace(/\*/g, '×').replace(/\//g, '÷');
    const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/');
    try {
      const v = evalExpr(normalized);
      if (!isAcceptableAnswer(v)) continue;
      if (allowDiv && normalized.includes('/')) {
        const parts = normalized.split(/[+\-*/]/); // rough — skip deep check
        void parts;
      }
      return { expression, answer: Math.round(v) };
    } catch {
      /* retry */
    }
  }

  const a = randInt(1, maxVal);
  const b = randInt(1, maxVal);
  const c = randInt(1, maxVal);
  return { expression: `${a} + ${b} × ${c}`, answer: a + b * c };
}

function generateAllProblems(rounds: number, diff: Difficulty): OoProblem[] {
  const { operators, maxValue } = DIFF_PARAMS[diff];
  const allowDiv = diff === 'hard';
  return Array.from({ length: rounds }, () => generateProblem(operators, maxValue, allowDiv));
}

function parseUserNumber(s: string): number | null {
  const t = s.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function OrderOfOperations({
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
  const [allProblems, setAllProblems] = useState<OoProblem[]>(() =>
    worksheetMode ? generateAllProblems(worksheetMode.rounds, initialDiff) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    setAllProblems(generateAllProblems(totalRounds, effectiveDiff));
    setCurrentIdx(0);
    setAnswer('');
    setResults([]);
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const u = parseUserNumber(answer);
    const correct = u !== null && Math.abs(u - problem.answer) < 1e-6;
    const result: RoundResult = { problem, userAnswer: answer.trim(), correct };
    setResults((prev) => [...prev, result]);
    setAnswer('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
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
    const p = lastResult.problem;
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Order of operations</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300 font-mono text-sm">{p.expression}</p>
          <p className="text-accent font-bold mt-2">= {p.answer}</p>
          {!lastResult.correct && (
            <p className="text-gray-500 text-xs mt-1">Your answer: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Order Of Operations',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Order Of Operations', icon: '🧠',
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

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-lg mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>BODMAS / PEMDAS</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">Use correct order: × ÷ before + − (and parentheses).</p>
          <div className="text-center mb-6 font-mono text-2xl md:text-3xl font-bold text-accent break-all px-2">
            {problem.expression}
          </div>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Answer"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-xl font-mono text-center focus:outline-none focus:border-primary text-white"
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
      <h2 className="text-2xl font-bold mb-6 text-center">Order of operations</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Evaluate each expression using standard precedence.</p>
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
