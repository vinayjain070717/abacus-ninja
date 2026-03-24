import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';
type BinOp = 'convert' | 'add' | 'sub';

const DIFF_PARAMS = {
  easy: { bits: 4, ops: ['convert'] as const },
  medium: { bits: 6, ops: ['convert', 'add'] as const },
  hard: { bits: 8, ops: ['add', 'sub', 'convert'] as const },
} as const;

interface BinProblem {
  question: string;
  answer: string;
  answerNumeric: number;
  answerIsBinary: boolean;
}

interface RoundResult {
  problem: BinProblem;
  userAnswer: string;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOp(ops: readonly BinOp[]): BinOp {
  return ops[randInt(0, ops.length - 1)];
}

function parseBinStrict(s: string): number | null {
  const t = s.replace(/\s/g, '');
  if (t === '' || !/^[01]+$/.test(t)) return null;
  return parseInt(t, 2);
}

function parseUserNumber(p: BinProblem, raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '');
  if (t === '') return null;
  if (p.answerIsBinary) {
    return parseBinStrict(t);
  }
  if (!/^-?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function makeConvert(bits: number): BinProblem {
  const maxVal = (1 << bits) - 1;
  const n = randInt(1, maxVal);
  if (Math.random() < 0.5) {
    const binStr = n.toString(2).padStart(bits, '0');
    return {
      question: `Convert binary ${binStr} to decimal`,
      answer: String(n),
      answerNumeric: n,
      answerIsBinary: false,
    };
  }
  return {
    question: `Convert ${n} to binary`,
    answer: n.toString(2),
    answerNumeric: n,
    answerIsBinary: true,
  };
}

function makeAdd(bits: number): BinProblem {
  const maxVal = (1 << bits) - 1;
  const a = randInt(1, maxVal);
  const b = randInt(1, maxVal);
  const sum = a + b;
  const ab = a.toString(2).padStart(bits, '0');
  const bb = b.toString(2).padStart(bits, '0');
  return {
    question: `${ab} + ${bb} = ? (binary)`,
    answer: sum.toString(2),
    answerNumeric: sum,
    answerIsBinary: true,
  };
}

function makeSub(bits: number): BinProblem {
  const maxVal = (1 << bits) - 1;
  const a = randInt(2, maxVal);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const ab = a.toString(2).padStart(bits, '0');
  const bb = b.toString(2).padStart(bits, '0');
  return {
    question: `${ab} − ${bb} = ? (binary)`,
    answer: diff.toString(2),
    answerNumeric: diff,
    answerIsBinary: true,
  };
}

function makeProblem(bits: number, ops: readonly BinOp[]): BinProblem {
  const op = pickOp(ops);
  if (op === 'convert') return makeConvert(bits);
  if (op === 'add') return makeAdd(bits);
  return makeSub(bits);
}

function answersMatch(p: BinProblem, raw: string): boolean {
  const u = parseUserNumber(p, raw);
  if (u === null) return false;
  return u === p.answerNumeric;
}

export default function BinaryArithmetic({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<BinProblem[]>(() => {
    if (!worksheetMode) return [];
    const { bits, ops } = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
    return Array.from({ length: worksheetMode.rounds }, () => makeProblem(bits, ops as readonly BinOp[]));
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<RoundResult[]>([]);

  const problem = allProblems[currentIdx];

  const startGame = () => {
    const { bits, ops } = DIFF_PARAMS[effectiveDiff];
    const ps = Array.from({ length: totalRounds }, () => makeProblem(bits, ops as readonly BinOp[]));
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
    const correct = answersMatch(problem, answer);
    const row: RoundResult = { problem, userAnswer: answer, correct };
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
          <p className="text-gray-400 text-sm mb-2">Binary arithmetic</p>
          <p className="text-lg md:text-xl font-bold text-primary mb-2 font-mono leading-relaxed px-1">{problem.question}</p>
          <p className="text-gray-500 text-xs mb-6">
            {problem.answerIsBinary ? 'Answer in binary (digits 0–1).' : 'Answer in decimal.'}
          </p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
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
          <p className="text-gray-300 font-mono text-sm">{lastResult.problem.question}</p>
          <p className="text-gray-400 font-mono">Correct: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">You: {lastResult.userAnswer.trim() || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Binary arithmetic</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Binary answers match by numeric value (leading zeros optional).</p>
        </div>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto text-left">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="text-gray-200 font-mono">{r.problem.question}</div>
              <div className="font-mono text-gray-400 mt-1">{r.problem.answer}</div>
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
      <h2 className="text-2xl font-bold mb-6 text-center">Binary arithmetic</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Convert between binary and decimal, or add/subtract in binary. Answers are compared by numeric value.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 12, 15, 20].map((n) => (
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
