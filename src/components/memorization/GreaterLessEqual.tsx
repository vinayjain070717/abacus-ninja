import { useState, useEffect, useRef } from 'react';
import { generateComparisonPair, type ComparisonProblem } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: ComparisonProblem;
  userAnswer: string;
  correct: boolean;
  timeMs: number;
}

const DIFF_PARAMS = {
  easy: { maxValue: 50, timeLimitSeconds: 90, complexity: 1 },
  medium: { maxValue: 200, timeLimitSeconds: 60, complexity: 2 },
  hard: { maxValue: 999, timeLimitSeconds: 45, complexity: 3 },
} as const;

export default function GreaterLessEqual({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const wsP = DIFF_PARAMS[worksheetMode?.difficulty ?? 'medium'];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? gameDifficulty;
  const [complexity, setComplexity] = useState<number>(DIFF_PARAMS.medium.complexity);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(DIFF_PARAMS.medium.timeLimitSeconds);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 15);

  const [allProblems, setAllProblems] = useState<ComparisonProblem[]>(() =>
    worksheetMode ? Array.from({ length: worksheetMode.rounds }, () => generateComparisonPair(wsP.complexity)) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const roundStart = useRef(Date.now());
  const timedOutRef = useRef(false);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[gameDifficulty];
    setComplexity(p.complexity);
    setTimeLimitSeconds(p.timeLimitSeconds);
  }, [gameDifficulty, worksheetMode]);

  useEffect(() => {
    if (phase === 'playing') roundStart.current = Date.now();
  }, [phase, currentIdx]);

  useEffect(() => {
    if (phase !== 'playing' || !allProblems.length) {
      setTimeLeft(null);
      timedOutRef.current = false;
      return;
    }
    setTimeLeft(timeLimitSeconds);
    timedOutRef.current = false;
  }, [phase, currentIdx, timeLimitSeconds, allProblems.length]);

  useEffect(() => {
    if (phase !== 'playing' || timeLeft === null || timeLeft <= 0) return;
    const id = window.setTimeout(() => setTimeLeft((t) => (t === null ? null : t - 1)), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  const applyAnswer = (choice: '>' | '<' | '=') => {
    const problem = allProblems[currentIdx];
    const correct = choice === problem.correctAnswer;
    const timeMs = Date.now() - roundStart.current;
    const result: RoundResult = { problem, userAnswer: choice, correct, timeMs };
    timedOutRef.current = true;
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  };

  useEffect(() => {
    if (phase !== 'playing' || timeLeft !== 0 || !allProblems.length || timedOutRef.current) return;
    timedOutRef.current = true;
    const problem = allProblems[currentIdx];
    const wrongPick = (['>', '<', '='] as const).find((c) => c !== problem.correctAnswer) ?? '<';
    const timeMs = Date.now() - roundStart.current;
    const result: RoundResult = { problem, userAnswer: `${wrongPick} (timeout)`, correct: false, timeMs };
    setResults((prev) => [...prev, result]);
    setLastResult(result);
    setPhase('feedback');
  }, [phase, timeLeft, currentIdx, allProblems]);

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter(r => r.correct).length;
      if (worksheetMode && onComplete) { onComplete(score, prev.length); return; }
      setPhase('results');
    }
  };

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    setComplexity(p.complexity);
    setTimeLimitSeconds(p.timeLimitSeconds);
    const ps = Array.from({ length: totalRounds }, () => generateComparisonPair(p.complexity));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const answer = (choice: '>' | '<' | '=') => {
    if (timedOutRef.current) return;
    applyAnswer(choice);
  };

  if (phase === 'feedback' && lastResult && allProblems.length > 0) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>{currentIdx + 1} / {allProblems.length}</span>
          <span>Score: {results.filter(r => r.correct).length}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300 font-mono text-lg">{lastResult.problem.leftDisplay} {lastResult.problem.correctAnswer} {lastResult.problem.rightDisplay}</p>
          {!lastResult.correct && <p className="text-red-400">You chose: {lastResult.userAnswer}</p>}
          <p className="text-gray-500 text-xs">Response time: {lastResult.timeMs}ms</p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Greater Less Equal',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Greater Less Equal', icon: '🧠',
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
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>{currentIdx + 1} / {allProblems.length}</span>
          <span>Score: {results.filter(r => r.correct).length}</span>
        </div>
        {timeLeft !== null && (
          <p className="text-accent font-bold text-sm mb-2">Time: {timeLeft}s</p>
        )}
        <div className="bg-surface rounded-2xl p-6 mb-4 transition-colors">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="bg-surface-light rounded-xl p-4">
              <p className="text-xl font-mono font-bold">{problem.leftDisplay}</p>
            </div>
            <div className="text-3xl text-gray-500 font-bold">vs</div>
            <div className="bg-surface-light rounded-xl p-4">
              <p className="text-xl font-mono font-bold">{problem.rightDisplay}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          {(['<', '=', '>'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => answer(ch)}
              className="w-16 h-16 rounded-xl text-3xl font-bold bg-surface-light hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Greater / Less / Equal</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Compare two expressions. Tap &gt;, &lt;, or = as fast as you can.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Complexity</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(c => (
              <button key={c} onClick={() => setComplexity(c)} className={`flex-1 py-2 rounded-lg font-bold ${complexity === c ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{c}-digit</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Time limit (sec / round)</label>
          <select value={timeLimitSeconds} onChange={e => setTimeLimitSeconds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[30, 45, 60, 90, 120].map(n => <option key={n} value={n}>{n}s</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select value={totalRounds} onChange={e => setTotalRounds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[10, 15, 20, 30].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <DifficultySelector value={gameDifficulty} onChange={setGameDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
