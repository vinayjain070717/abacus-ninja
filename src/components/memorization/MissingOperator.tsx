import { useState, useEffect, useRef } from 'react';
import { generateMissingOperatorProblem, type MissingOperatorProblem } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: MissingOperatorProblem;
  userOps: string[];
  correct: boolean;
}

const DIFF_PARAMS = {
  easy: { operands: 2, maxValue: 20 },
  medium: { operands: 3, maxValue: 50 },
  hard: { operands: 4, maxValue: 100 },
} as const;

export default function MissingOperator({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const wsP = DIFF_PARAMS[wsDiff];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [digits, setDigits] = useState(1);
  const [opCount, setOpCount] = useState<number>(DIFF_PARAMS.medium.operands);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [problems] = useState<MissingOperatorProblem[]>(() =>
    Array.from({ length: worksheetMode?.rounds ?? 10 }, () =>
      generateMissingOperatorProblem(1, wsP.operands, wsP.maxValue)
    )
  );
  const [allProblems, setAllProblems] = useState<MissingOperatorProblem[]>(worksheetMode ? problems : []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOps, setSelectedOps] = useState<string[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const opsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setOpCount(p.operands);
  }, [difficulty, worksheetMode]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setOpCount(p.operands);
    const ps = Array.from({ length: totalRounds }, () =>
      generateMissingOperatorProblem(digits, p.operands, p.maxValue)
    );
    setAllProblems(ps);
    setCurrentIdx(0);
    setSelectedOps(Array(p.operands).fill(''));
    setResults([]);
    setLastResult(null);
    setPhase('playing');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOps(Array(allProblems[currentIdx + 1].operators.length).fill(''));
      setPhase('playing');
    } else {
      const score = results.filter(r => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, results.length);
        return;
      }
      setPhase('results');
    }
  };

  const selectOp = (slotIdx: number, op: string) => {
    const newOps = [...selectedOps];
    newOps[slotIdx] = op;
    setSelectedOps(newOps);
  };

  const submitAnswer = () => {
    const problem = allProblems[currentIdx];
    const correct = selectedOps.every((op, i) => op === problem.operators[i]);
    const newResults = [...results, { problem, userOps: [...selectedOps], correct }];
    setResults(newResults);
    setLastResult({ problem, userOps: [...selectedOps], correct });
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Problem {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Missing Operator</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300 font-mono">
            {lastResult.problem.operands[0]}{' '}
            {lastResult.problem.operators.map((op, j) => `${op} ${lastResult.problem.operands[j + 1]}`).join(' ')} ={' '}
            {lastResult.problem.answer}
          </p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your operators: {lastResult.userOps.join(', ')}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter(r => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{score}/{results.length}</div>
        </div>
        <div className="space-y-2 mb-6">
          {results.map((r, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm font-mono ${r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              {r.problem.operands[0]} {r.problem.operators.map((op, j) => `${op} ${r.problem.operands[j + 1]}`).join(' ')} = {r.problem.answer}
              {!r.correct && <span className="text-red-400 ml-2">(You: {r.userOps.join(', ')})</span>}
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
    const opButtons = ['+', '-', '×', '÷'];

    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Problem {currentIdx + 1} / {allProblems.length}</span>
          <span>Missing Operator</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap text-xl font-mono font-bold">
            <span>{problem.operands[0]}</span>
            {problem.operators.map((_, slotIdx) => (
              <span key={slotIdx} className="flex items-center gap-2">
                <span className={`inline-block w-12 h-10 leading-10 rounded-lg text-center ${selectedOps[slotIdx] ? 'bg-primary text-white' : 'bg-surface-light text-gray-500 border border-dashed border-gray-500'}`}>
                  {selectedOps[slotIdx] || '?'}
                </span>
                <span>{problem.operands[slotIdx + 1]}</span>
              </span>
            ))}
            <span>= {problem.answer}</span>
          </div>

          <div className="mt-4 space-y-3">
            {problem.operators.map((_, slotIdx) => (
              <div key={slotIdx} className="flex gap-2 justify-center">
                <span className="text-xs text-gray-400 self-center w-12">Slot {slotIdx + 1}:</span>
                {opButtons.map((op) => (
                  <button
                    key={op}
                    ref={el => { opsRef.current[slotIdx] = el; }}
                    onClick={() => selectOp(slotIdx, op)}
                    className={`w-10 h-10 rounded-lg font-bold text-lg ${selectedOps[slotIdx] === op ? 'bg-accent text-white' : 'bg-surface-light text-gray-300 hover:bg-gray-600'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={submitAnswer}
          disabled={selectedOps.some(o => !o)}
          className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Missing Operator</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Operand digits</label>
          <div className="flex gap-2">
            {[1, 2].map(d => (
              <button key={d} onClick={() => setDigits(d)} className={`flex-1 py-2 rounded-lg font-bold ${digits === d ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{d}-digit</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Operators to fill</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => setOpCount(n)} className={`flex-1 py-2 rounded-lg font-bold ${opCount === n ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Problems</label>
          <select value={totalRounds} onChange={e => setTotalRounds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
