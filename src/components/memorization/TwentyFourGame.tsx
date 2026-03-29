import { useState, useRef } from 'react';
import { generateTwentyFourNumbers, type TwentyFourProblem } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'playing' | 'results';

const DIFF_PARAMS = {
  easy: { maxNumber: 6 },
  medium: { maxNumber: 9 },
  hard: { maxNumber: 13 },
} as const;

interface RoundResult {
  problem: TwentyFourProblem;
  userExpr: string;
  correct: boolean;
}

function safeEval24(expr: string, nums: number[]): boolean {
  try {
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/x/gi, '*');
    const digitsInExpr = normalized.match(/\d+/g)?.map(Number).sort((a, b) => a - b) ?? [];
    const sortedNums = [...nums].sort((a, b) => a - b);
    if (digitsInExpr.length !== 4 || digitsInExpr.join(',') !== sortedNums.join(',')) return false;
    const result = Function(`"use strict"; return (${normalized})`)();
    return Math.abs(result - 24) < 0.0001;
  } catch {
    return false;
  }
}

export default function TwentyFourGame({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const wsMax = DIFF_PARAMS[worksheetMode?.difficulty ?? 'medium'].maxNumber;

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<TwentyFourProblem[]>(() =>
    worksheetMode ? Array.from({ length: worksheetMode.rounds }, () => generateTwentyFourNumbers(wsMax)) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [expr, setExpr] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const cap = DIFF_PARAMS[effectiveDiff].maxNumber;
    const ps = Array.from({ length: totalRounds }, () => generateTwentyFourNumbers(cap));
    setAllProblems(ps);
    setCurrentIdx(0);
    setExpr('');
    setResults([]);
    setShowHint(false);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitAnswer = () => {
    const problem = allProblems[currentIdx];
    const correct = safeEval24(expr, problem.numbers);
    const newResults = [...results, { problem, userExpr: expr, correct }];
    setResults(newResults);
    setExpr('');
    setShowHint(false);

    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      const score = newResults.filter(r => r.correct).length;
      if (worksheetMode && onComplete) { onComplete(score, newResults.length); return; }
      setPhase('results');
    }
  };

  const skip = () => {
    const problem = allProblems[currentIdx];
    const newResults = [...results, { problem, userExpr: '(skipped)', correct: false }];
    setResults(newResults);
    setExpr('');
    setShowHint(false);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const score = newResults.filter(r => r.correct).length;
      if (worksheetMode && onComplete) { onComplete(score, newResults.length); return; }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Twenty Four Game',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Twenty Four Game', icon: '🧠',
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
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Problem {currentIdx + 1} / {allProblems.length}</span>
          <span>Make 24</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <div className="flex justify-center gap-3 mb-6">
            {problem.numbers.map((n, i) => (
              <div key={i} className="w-14 h-14 flex items-center justify-center bg-primary rounded-xl text-2xl font-bold">{n}</div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mb-3">Use +, -, *, / and () to make 24</p>
          <input
            ref={inputRef}
            type="text"
            value={expr}
            onChange={e => setExpr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            placeholder="e.g. (3 + 5) * (4 - 1)"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-lg font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
          {showHint && <p className="text-yellow-400 text-xs mt-2">Hint: {problem.solutionHint}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={submitAnswer} className="px-6 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
          <button onClick={() => setShowHint(true)} className="px-4 py-3 bg-surface-light rounded-lg text-sm hover:bg-gray-600">Hint</button>
          <button onClick={skip} className="px-4 py-3 bg-surface-light rounded-lg text-sm hover:bg-gray-600">Skip</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">24 Game</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Use 4 numbers with +, -, *, / to make exactly 24.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Problems</label>
          <select value={totalRounds} onChange={e => setTotalRounds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
