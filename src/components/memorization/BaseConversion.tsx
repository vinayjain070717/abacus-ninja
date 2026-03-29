import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import { generateBaseConversion, type BaseConversionProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

const DIFF_PARAMS = {
  easy: { maxNumber: 15 },
  medium: { maxNumber: 64 },
  hard: { maxNumber: 255 },
} as const;

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: BaseConversionProblem;
  userAnswer: string;
  correct: boolean;
}

function normalizeAnswer(problem: BaseConversionProblem, raw: string): string {
  const t = raw.trim();
  if (problem.toBase === 'binary') {
    return t.replace(/\s+/g, '');
  }
  if (problem.toBase === 'hex') {
    return t.toUpperCase();
  }
  return t.replace(/\s+/g, '');
}

function answersMatch(problem: BaseConversionProblem, user: string): boolean {
  const u = normalizeAnswer(problem, user);
  const expected = problem.answer;
  if (problem.toBase === 'hex') {
    return u.toUpperCase() === expected.toUpperCase();
  }
  return u === expected;
}

export default function BaseConversion({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [maxDecimal, setMaxDecimal] = useState(255);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<BaseConversionProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateBaseConversion(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].maxNumber)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());

  const problem = allProblems[currentIdx];

  const startGame = () => {
    startTimeRef.current = Date.now();
    const mx = DIFF_PARAMS[effectiveDiff].maxNumber;
    const ps = Array.from({ length: totalRounds }, () => generateBaseConversion(mx));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setAnswer('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    if (!problem) return;
    const correct = answersMatch(problem, answer);
    const newResults = [...results, { problem, userAnswer: answer, correct }];
    setResults(newResults);
    setLastResult({ problem, userAnswer: answer, correct });
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
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Convert</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-2">Convert as requested (hex is case-insensitive).</p>
          <p className="text-2xl font-bold text-primary mb-6">{problem.question}</p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={problem.toBase === 'decimal' ? 'Decimal value' : problem.toBase === 'binary' ? 'e.g. 1101' : 'e.g. FF'}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary text-primary"
            autoFocus
          />
        </div>
        <button type="button" onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
          Submit
        </button>
      </div>
    );
  }

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Convert</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">{lastResult.problem.question}</p>
          <p className="text-gray-400 font-mono">Correct: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your answer: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Base Conversion',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Base Conversion', icon: '🔄',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: r.problem.question,
          correct: r.correct,
          correctAnswer: r.problem.answer,
          userAnswer: r.userAnswer || '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Base Conversion</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Practice converting between decimal, binary, and hexadecimal.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max decimal value</label>
          <select
            value={maxDecimal}
            onChange={(e) => setMaxDecimal(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[63, 127, 255, 511, 1023].map((n) => (
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
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
