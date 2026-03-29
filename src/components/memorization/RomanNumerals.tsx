import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import { generateRomanProblem, type RomanNumeralProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS: Record<Difficulty, { maxNumber: number }> = {
  easy: { maxNumber: 50 },
  medium: { maxNumber: 500 },
  hard: { maxNumber: 3999 },
};
type RomanMode = 'to-roman' | 'from-roman' | 'mixed';

interface RoundResult {
  problem: RomanNumeralProblem;
  userAnswer: string;
  correct: boolean;
}

function normalizeRoman(s: string): string {
  return s.trim().replace(/\s+/g, '').toUpperCase();
}

function checkAnswer(problem: RomanNumeralProblem, raw: string): boolean {
  const u = raw.trim();
  if (problem.mode === 'to-roman') {
    return normalizeRoman(u) === normalizeRoman(problem.answer);
  }
  const n = u.replace(/\s+/g, '');
  return n === problem.answer;
}

export default function RomanNumerals({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [mode, setMode] = useState<RomanMode>('mixed');
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<RomanNumeralProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateRomanProblem(
            DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty].maxNumber,
            undefined
          ))
      : []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;
  const inputRef = useRef<HTMLInputElement>(null);

  const problem = allProblems[currentIdx];

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const genMode = mode === 'mixed' ? undefined : mode;
    const ps = Array.from({ length: totalRounds }, () =>
      generateRomanProblem(DIFF_PARAMS[effectiveDiff].maxNumber, genMode)
    );
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
    const correct = checkAnswer(problem, answer);
    const row: RoundResult = { problem, userAnswer: answer, correct };
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
    setLastResult(row);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setAnswer('');
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, Math.max(1, prev.length));
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Roman Numerals',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Roman Numerals', icon: '🧠',
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

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Roman</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300 font-mono">{lastResult.problem.question}</p>
          <p className="text-gray-400 font-mono">Correct: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">You: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'playing' && problem) {
    const hint =
      problem.mode === 'to-roman'
        ? 'Enter the Roman numeral (e.g. XIV).'
        : 'Enter the decimal number.';

    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">{problem.mode === 'to-roman' ? '→ Roman' : '→ Decimal'}</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-gray-700/50">
          <p className="text-gray-500 text-xs mb-2">{hint}</p>
          <p className="text-3xl font-bold text-primary mb-6 font-mono">{problem.question}</p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
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

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Roman Numerals</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Convert between decimal numbers and Roman numerals.</p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RomanMode)}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="mixed">Mixed</option>
            <option value="to-roman">Decimal → Roman</option>
            <option value="from-roman">Roman → Decimal</option>
          </select>
        </div>
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
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
