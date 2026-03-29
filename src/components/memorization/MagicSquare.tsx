import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import { generateMagicSquare, type MagicSquareProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: MagicSquareProblem;
  correct: boolean;
}

function isBlank(blanks: [number, number][], r: number, c: number): boolean {
  return blanks.some(([br, bc]) => br === r && bc === c);
}

function checkMagic(grid: number[][], magicSum: number): boolean {
  const sums: number[] = [];
  for (let r = 0; r < 3; r++) sums.push(grid[r].reduce((a, b) => a + b, 0));
  for (let c = 0; c < 3; c++) sums.push(grid[0][c] + grid[1][c] + grid[2][c]);
  sums.push(grid[0][0] + grid[1][1] + grid[2][2]);
  sums.push(grid[0][2] + grid[1][1] + grid[2][0]);
  return sums.every((s) => s === magicSum);
}

export default function MagicSquare({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 5);

  const [allProblems, setAllProblems] = useState<MagicSquareProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => generateMagicSquare())
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<{
    problem: MagicSquareProblem;
    correct: boolean;
    userGrid: number[][] | null;
  } | null>(null);
  const [fillHint, setFillHint] = useState<string | null>(null);

  const problem = allProblems[currentIdx];

  const advanceFromFeedback = () => {
    setLastResult(null);
    setInputs({});
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
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

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const ps = Array.from({ length: totalRounds }, () => generateMagicSquare());
    setAllProblems(ps);
    setCurrentIdx(0);
    setInputs({});
    setResults([]);
    setLastResult(null);
    setFillHint(null);
    setPhase('playing');
  };

  const buildGrid = (): number[][] | null => {
    if (!problem) return null;
    const g: number[][] = [];
    for (let r = 0; r < 3; r++) {
      const row: number[] = [];
      for (let c = 0; c < 3; c++) {
        if (isBlank(problem.blanks, r, c)) {
          const raw = inputs[`${r},${c}`]?.trim() ?? '';
          const n = parseInt(raw, 10);
          if (raw === '' || Number.isNaN(n)) return null;
          row.push(n);
        } else {
          row.push(problem.solution[r][c]);
        }
      }
      g.push(row);
    }
    return g;
  };

  const validate = () => {
    if (!problem || phase !== 'playing') return;
    const grid = buildGrid();
    if (!grid) {
      setFillHint('Fill every blank with a whole number.');
      return;
    }
    setFillHint(null);
    const ok = checkMagic(grid, problem.magicSum);
    setResults((prev) => [...prev, { problem, correct: ok }]);
    setLastResult({ problem, correct: ok, userGrid: grid });
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Magic sum = {lastResult.problem.magicSum}</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">Magic sum: {lastResult.problem.magicSum}</p>
          {lastResult.correct ? (
            <p className="text-green-400">All rows, columns, and diagonals sum correctly!</p>
          ) : (
            <>
              <p className="text-red-400">Not all sums matched.</p>
              <div className="grid grid-cols-3 gap-1 w-max mx-auto mt-2">
                {lastResult.problem.solution.flat().map((v: number, i: number) => (
                  <div key={i} className="w-10 h-10 flex items-center justify-center bg-surface-light rounded text-sm font-bold">
                    {v}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-1">Correct solution shown above</p>
            </>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[difficulty] || 12;
    const reportData: ReportData = {
      title: 'Magic Square',
      subtitle: `${difficulty} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Magic Square', icon: '🧠',
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

  if (phase === 'playing' && problem) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Magic sum = {problem.magicSum}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-gray-700/50">
          <p className="text-gray-400 text-sm mb-4">Complete the 3×3 grid so every row, column, and diagonal sums to {problem.magicSum}.</p>
          <div className="grid grid-cols-3 gap-2 w-max mx-auto">
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const blank = isBlank(problem.blanks, r, c);
                const key = `${r},${c}`;
                return (
                  <div key={key} className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]">
                    {blank ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={inputs[key] ?? ''}
                        onChange={(e) => {
                          setFillHint(null);
                          setInputs((prev) => ({
                            ...prev,
                            [key]: e.target.value.replace(/[^\d-]/g, ''),
                          }));
                        }}
                        className="w-full h-full text-center text-xl font-bold rounded-lg bg-surface-light border border-gray-600 text-primary focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded-lg bg-surface-light border border-gray-700 text-2xl font-bold text-primary">
                        {problem.solution[r][c]}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {fillHint && <p className="mt-4 text-sm text-amber-400">{fillHint}</p>}
        </div>
        <button
          type="button"
          onClick={validate}
          className="mt-6 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark disabled:opacity-50 disabled:pointer-events-none"
        >
          Check
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Magic Square</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Fill in the missing cells so all rows, columns, and diagonals sum to the magic total (15 for a classic 3×3).</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 5, 8, 10].map((n) => (
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
