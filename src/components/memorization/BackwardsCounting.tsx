import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { step: 2, startMax: 50 },
  medium: { step: 7, startMax: 200 },
  hard: { step: 13, startMax: 500 },
};

const TERMS_PER_ROUND = 5;

interface RoundResult {
  start: number;
  step: number;
  expected: number[];
  userAnswers: number[];
  correct: boolean;
}

function generateProblem(step: number, startMax: number) {
  const minStart = step * TERMS_PER_ROUND + 1;
  const start = Math.floor(Math.random() * (Math.max(startMax, minStart + 10) - minStart + 1)) + minStart;
  const expected: number[] = [];
  let val = start;
  for (let i = 0; i < TERMS_PER_ROUND; i++) {
    val -= step;
    expected.push(val);
  }
  return { start, step, expected };
}

export default function BackwardsCounting({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const totalRounds = worksheetMode?.rounds ?? 8;

  const params = DIFF_PARAMS[effectiveDiff];
  const [problem, setProblem] = useState(() => generateProblem(params.step, params.startMax));
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const roundRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    setProblem(generateProblem(p.step, p.startMax));
    setAnswer('');
    setResults([]);
    setLastResult(null);
    roundRef.current = 0;
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    const userNums = answer
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    const correct =
      userNums.length === problem.expected.length &&
      userNums.every((v, i) => v === problem.expected[i]);
    const result: RoundResult = {
      start: problem.start,
      step: problem.step,
      expected: problem.expected,
      userAnswers: userNums,
      correct,
    };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    roundRef.current += 1;
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (roundRef.current >= totalRounds) {
      const score = results.filter((r) => r.correct).length + (lastResult?.correct ? 1 : 0);
      if (worksheetMode && onComplete) {
        onComplete(score, totalRounds);
        return;
      }
      setPhase('results');
    } else {
      const p = DIFF_PARAMS[effectiveDiff];
      setProblem(generateProblem(p.step, p.startMax));
      setAnswer('');
      setPhase('playing');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <p className="text-sm text-gray-400 mb-2">
          {roundRef.current} / {totalRounds}
        </p>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={roundRef.current >= totalRounds}
        >
          <p className="text-gray-300">
            Start: {lastResult.start}, Step: {lastResult.step}
          </p>
          <p className="text-gray-400 font-mono text-sm">
            Expected: {lastResult.expected.join(', ')}
          </p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono text-sm">
              Your answer: {lastResult.userAnswers.join(', ') || '—'}
            </p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Backwards Counting',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Backwards Counting', icon: '🧠',
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

  if (phase === 'playing') {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>{roundRef.current + 1} / {totalRounds}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-2">Count backwards by {problem.step}</p>
          <div className="text-4xl font-bold font-mono text-accent mb-4">{problem.start}</div>
          <p className="text-gray-500 text-xs mb-4">
            Type the next {TERMS_PER_ROUND} numbers, separated by spaces or commas
          </p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={`e.g. ${problem.start - problem.step}, ${problem.start - 2 * problem.step}, ...`}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-lg font-mono focus:outline-none focus:border-primary text-white"
            autoFocus
          />
        </div>
        <button onClick={submit} className="w-full py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Backwards Counting</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Count backwards from a number by a given step. Type the next {TERMS_PER_ROUND} numbers.
        </p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
