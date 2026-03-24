import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

type ConvKind =
  | 'cm_m'
  | 'm_cm'
  | 'g_kg'
  | 'kg_g'
  | 'l_ml'
  | 'ml_l'
  | 'hr_min'
  | 'min_hr'
  | 'F_C'
  | 'C_F'
  | 'mi_km'
  | 'km_mi';

const DIFF_PARAMS = {
  easy: { kinds: ['cm_m', 'm_cm', 'g_kg', 'kg_g'] as ConvKind[] },
  medium: {
    kinds: ['cm_m', 'm_cm', 'g_kg', 'kg_g', 'l_ml', 'ml_l', 'hr_min', 'min_hr'] as ConvKind[],
  },
  hard: {
    kinds: [
      'cm_m',
      'm_cm',
      'g_kg',
      'kg_g',
      'l_ml',
      'ml_l',
      'hr_min',
      'min_hr',
      'F_C',
      'C_F',
      'mi_km',
      'km_mi',
    ] as ConvKind[],
  },
} as const;

interface ConvProblem {
  kind: ConvKind;
  valueIn: number;
  prompt: string;
  answer: number;
}

interface RoundResult {
  problem: ConvProblem;
  userAnswer: string;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

function toAnswer(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function convert(kind: ConvKind, valueIn: number): number {
  switch (kind) {
    case 'cm_m':
      return valueIn / 100;
    case 'm_cm':
      return valueIn * 100;
    case 'g_kg':
      return valueIn / 1000;
    case 'kg_g':
      return valueIn * 1000;
    case 'l_ml':
      return valueIn * 1000;
    case 'ml_l':
      return valueIn / 1000;
    case 'hr_min':
      return valueIn * 60;
    case 'min_hr':
      return valueIn / 60;
    case 'F_C':
      return ((valueIn - 32) * 5) / 9;
    case 'C_F':
      return (valueIn * 9) / 5 + 32;
    case 'mi_km':
      return valueIn * 1.60934;
    case 'km_mi':
      return valueIn / 1.60934;
    default:
      return valueIn;
  }
}

function promptFor(kind: ConvKind, valueIn: number): string {
  const v = Number.isInteger(valueIn) ? String(valueIn) : String(valueIn);
  switch (kind) {
    case 'cm_m':
      return `Convert ${v} cm to m`;
    case 'm_cm':
      return `Convert ${v} m to cm`;
    case 'g_kg':
      return `Convert ${v} g to kg`;
    case 'kg_g':
      return `Convert ${v} kg to g`;
    case 'l_ml':
      return `Convert ${v} L to ml`;
    case 'ml_l':
      return `Convert ${v} ml to L`;
    case 'hr_min':
      return `Convert ${v} hr to min`;
    case 'min_hr':
      return `Convert ${v} min to hr`;
    case 'F_C':
      return `Convert ${v} °F to °C`;
    case 'C_F':
      return `Convert ${v} °C to °F`;
    case 'mi_km':
      return `Convert ${v} mi to km`;
    case 'km_mi':
      return `Convert ${v} km to mi`;
    default:
      return '';
  }
}

function generateValue(kind: ConvKind): number {
  switch (kind) {
    case 'cm_m':
      return randInt(50, 2500);
    case 'm_cm':
      return randInt(1, 8) + (Math.random() < 0.4 ? 0 : randInt(0, 9) / 10);
    case 'g_kg':
      return randInt(200, 8000);
    case 'kg_g':
      return randInt(1, 12) + (Math.random() < 0.3 ? 0 : randInt(0, 9) / 10);
    case 'l_ml':
      return randInt(1, 8) + (Math.random() < 0.35 ? 0 : randInt(0, 9) / 10);
    case 'ml_l':
      return randInt(250, 4500);
    case 'hr_min':
      return randInt(1, 12) + (Math.random() < 0.25 ? 0 : randInt(0, 5) / 4);
    case 'min_hr':
      return randInt(15, 240);
    case 'F_C':
      return randInt(-10, 100);
    case 'C_F':
      return randInt(-15, 38);
    case 'mi_km':
      return randInt(1, 40) + (Math.random() < 0.4 ? 0 : randInt(0, 9) / 10);
    case 'km_mi':
      return randInt(2, 60) + (Math.random() < 0.35 ? 0 : randInt(0, 9) / 10);
    default:
      return 1;
  }
}

function generateProblem(kinds: readonly ConvKind[]): ConvProblem {
  const kind = pick([...kinds]);
  const valueIn = generateValue(kind);
  const raw = convert(kind, valueIn);
  const answer = toAnswer(raw);
  return {
    kind,
    valueIn,
    prompt: promptFor(kind, valueIn),
    answer,
  };
}

function generateAllProblems(rounds: number, diff: Difficulty): ConvProblem[] {
  const kinds = DIFF_PARAMS[diff].kinds;
  return Array.from({ length: rounds }, () => generateProblem(kinds));
}

function parseUserNumber(s: string): number | null {
  const t = s.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function closeEnough(user: number, expected: number): boolean {
  const tol = Math.max(0.02, Math.abs(expected) * 0.02);
  return Math.abs(user - expected) <= tol;
}

function formatAns(n: number): string {
  if (Math.abs(n - Math.round(n)) < 1e-5) return String(Math.round(n));
  return n.toFixed(3).replace(/\.?0+$/, '');
}

export default function UnitConversion({
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
  const [allProblems, setAllProblems] = useState<ConvProblem[]>(() =>
    worksheetMode ? generateAllProblems(worksheetMode.rounds, initialDiff) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
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
    const correct = u !== null && closeEnough(u, problem.answer);
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
          <span>Unit conversion</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">{p.prompt}</p>
          <p className="text-accent font-mono font-bold mt-2">Answer ≈ {formatAns(p.answer)}</p>
          {!lastResult.correct && (
            <p className="text-gray-500 text-xs mt-1">Your answer: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-lg mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Unit conversion — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {score}/{results.length}
          </div>
        </div>
        <div className="space-y-2 mb-6 text-left max-h-72 overflow-y-auto text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="text-gray-300">{r.problem.prompt}</div>
              <div className="text-gray-400 font-mono text-xs mt-1">
                Correct: {formatAns(r.problem.answer)} · You: {r.userAnswer || '—'}
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
          <span>Unit conversion</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-4">Type the converted value (decimals allowed, ~2% tolerance).</p>
          <div className="text-center mb-6 text-xl md:text-2xl font-semibold text-accent px-2">{problem.prompt}</div>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. 2.5"
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
      <h2 className="text-2xl font-bold mb-6 text-center">Unit conversion</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Easy: cm/m, g/kg · Medium: + L/ml, hr/min · Hard: + °F/°C, mi/km
        </p>
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
