import { useState, useRef } from 'react';
import { generateTwentyFourNumbers, type TwentyFourProblem } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
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

  const startGame = () => {
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
    const score = results.filter(r => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">24 Game Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{score}/{results.length}</div>
        </div>
        <div className="space-y-2 mb-6">
          {results.map((r, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm ${r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              <span className="font-mono">[{r.problem.numbers.join(', ')}]</span>
              <span className="text-gray-400 ml-2">{r.userExpr}</span>
              {!r.correct && <span className="text-yellow-400 ml-2 text-xs">Hint: {r.problem.solutionHint}</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">Play Again</button>
          {!worksheetMode && <button onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">Settings</button>}
        </div>
      </div>
    );
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
