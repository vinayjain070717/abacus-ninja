import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { minuteStep: 15 },
  medium: { minuteStep: 5 },
  hard: { minuteStep: 1 },
} as const;

const TOLERANCE = 1;

interface ClockProblem {
  hour12: number;
  minute: number;
  display: string;
  angle: number;
}

interface RoundResult {
  problem: ClockProblem;
  userVal: number | null;
  correct: boolean;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Smaller angle between hour and minute hands (degrees). */
function clockAngleDegrees(hour12: number, minute: number): number {
  const H = hour12 % 12;
  const M = minute;
  const raw = Math.abs(30 * H - 5.5 * M);
  return Math.min(raw, 360 - raw);
}

function makeProblem(minuteStep: number): ClockProblem {
  const hour12 = randInt(1, 12);
  const nSteps = Math.floor(60 / minuteStep);
  const minute = randInt(0, nSteps - 1) * minuteStep;
  const angle = Math.round(clockAngleDegrees(hour12, minute) * 100) / 100;
  const mm = minute.toString().padStart(2, '0');
  const display = `${hour12}:${mm}`;
  return { hour12, minute, display, angle };
}

function parseAngle(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function anglesMatch(user: number, expected: number): boolean {
  const d = Math.abs(user - expected);
  return d <= TOLERANCE || Math.abs(d - 360) <= TOLERANCE;
}

export default function ClockAngle({
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

  const [allProblems, setAllProblems] = useState<ClockProblem[]>(() => {
    if (!worksheetMode) return [];
    const step = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].minuteStep;
    return Array.from({ length: worksheetMode.rounds }, () => makeProblem(step));
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
    const step = DIFF_PARAMS[effectiveDiff].minuteStep;
    const ps = Array.from({ length: totalRounds }, () => makeProblem(step));
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
    const userVal = parseAngle(answer);
    const correct = userVal !== null && anglesMatch(userVal, problem.angle);
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

  const handAngles = (p: ClockProblem) => {
    const mDeg = p.minute * 6;
    const hDeg = ((p.hour12 % 12) + p.minute / 60) * 30;
    return { mDeg, hDeg };
  };

  if (phase === 'playing' && problem) {
    const { mDeg, hDeg } = handAngles(problem);
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-xl p-8 border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-2">Angle between hands (smaller angle, 0–360°)</p>
          <p className="text-3xl font-bold text-primary mb-4">{problem.display}</p>
          <div className="flex justify-center mb-6">
            <svg width="160" height="160" viewBox="0 0 100 100" className="text-primary">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600" />
              {[12, 3, 6, 9].map((mark) => {
                const rad = ((mark % 12) * 30 - 90) * (Math.PI / 180);
                const x1 = 50 + 40 * Math.cos(rad);
                const y1 = 50 + 40 * Math.sin(rad);
                const x2 = 50 + 36 * Math.cos(rad);
                const y2 = 50 + 36 * Math.sin(rad);
                return <line key={mark} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" className="text-gray-500" />;
              })}
              <line
                x1="50"
                y1="50"
                x2={50 + 28 * Math.sin((mDeg * Math.PI) / 180)}
                y2={50 - 28 * Math.cos((mDeg * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent"
              />
              <line
                x1="50"
                y1="50"
                x2={50 + 22 * Math.sin((hDeg * Math.PI) / 180)}
                y2={50 - 22 * Math.cos((hDeg * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary"
              />
              <circle cx="50" cy="50" r="3" fill="currentColor" className="text-gray-300" />
            </svg>
          </div>
          <p className="text-gray-500 text-xs mb-4">±{TOLERANCE}° tolerance</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Degrees"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
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
          <p className="text-gray-300">Time {lastResult.problem.display}</p>
          <p className="text-gray-400 font-mono">Smaller angle: {lastResult.problem.angle}°</p>
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
      title: 'Clock Angle',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Clock Angle', icon: '🧠',
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
      <h2 className="text-2xl font-bold mb-6 text-center">Clock angle</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Use the smaller angle between the hour and minute hands (0°–180°). Formula hint: |30H − 5.5M| then take the
          minimum with 360 minus that.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 15, 20].map((n) => (
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
