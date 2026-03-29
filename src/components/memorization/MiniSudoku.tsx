import { useState, useEffect, useRef } from 'react';
import { generateSudoku, type SudokuPuzzle } from '../../utils/sudokuGenerator';
import { formatTime } from '../../utils/scoring';
import type { Difficulty } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'playing' | 'results';

const DIFF_SIZE: Record<Difficulty, 4 | 6 | 9> = { easy: 4, medium: 6, hard: 9 };

export default function MiniSudoku({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const wsSize = DIFF_SIZE[wsDiff];
  const [size, setSize] = useState<4 | 6 | 9>(worksheetMode ? wsSize : 6);

  const [initData] = useState(() => {
    if (worksheetMode) {
      const p = generateSudoku(wsSize);
      return { puzzle: p, grid: p.puzzle.map((row) => row.map((v) => (v === null ? '' : String(v)))) };
    }
    return { puzzle: null as SudokuPuzzle | null, grid: [] as string[][] };
  });
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(initData.puzzle);
  const [userGrid, setUserGrid] = useState<string[][]>(initData.grid);
  const [seconds, setSeconds] = useState(0);
  const [_errors, setErrors] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const chosenSize = DIFF_SIZE[difficulty];
    setSize(chosenSize);
    const p = generateSudoku(chosenSize);
    setPuzzle(p);
    setUserGrid(p.puzzle.map((row) => row.map((v) => (v === null ? '' : String(v)))));
    setSeconds(0);
    setErrors(0);
    setPhase('playing');
  };

  const updateCell = (r: number, c: number, val: string) => {
    if (!puzzle || puzzle.puzzle[r][c] !== null) return;
    const filtered = val.replace(/[^1-9]/g, '').slice(-1);
    if (filtered && parseInt(filtered) > size) return;
    const ng = userGrid.map((row) => [...row]);
    ng[r][c] = filtered;
    setUserGrid(ng);
  };

  const submit = () => {
    if (!puzzle) return;
    let errs = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (parseInt(userGrid[r][c]) !== puzzle.solution[r][c]) errs++;
      }
    }
    setErrors(errs);
    const correct = size * size - errs;
    if (worksheetMode && onComplete) { onComplete(correct, size * size); return; }
    setPhase('results');
  };

  if (phase === 'results' && puzzle) {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const total = size * size;
    const details = [];
    let correctCells = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (puzzle.puzzle[r][c] !== null) continue;
        const isCorrect = parseInt(userGrid[r][c]) === puzzle.solution[r][c];
        if (isCorrect) correctCells++;
        details.push({
          display: `Cell (${r + 1},${c + 1})`,
          correct: isCorrect,
          correctAnswer: String(puzzle.solution[r][c]),
          userAnswer: userGrid[r][c] || '—',
        });
      }
    }
    const reportData: ReportData = {
      title: 'Mini Sudoku',
      subtitle: `${difficulty} · ${size}×${size}`,
      totalTimeSec,
      sections: [{
        label: 'Mini Sudoku', icon: '🧩',
        score: correctCells, total: details.length || total,
        timeSpentSec: totalTimeSec, idealTimeSec: size * size * 3,
        details,
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={() => setPhase('config')} />;
  }

  if (phase === 'playing' && puzzle) {
    const cellSize = size === 9 ? 'w-8 h-8 text-sm' : 'w-11 h-11 text-lg';
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>{size}x{size} Sudoku</span>
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="bg-surface rounded-2xl p-4 inline-block mb-4 overflow-x-auto">
          <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {userGrid.map((row, r) =>
              row.map((val, c) => {
                const isGiven = puzzle.puzzle[r][c] !== null;
                const borderR = (c + 1) % puzzle.boxCols === 0 && c < size - 1 ? 'border-r-2 border-r-gray-400' : '';
                const borderB = (r + 1) % puzzle.boxRows === 0 && r < size - 1 ? 'border-b-2 border-b-gray-400' : '';
                return (
                  <input
                    key={`${r}-${c}`}
                    type="text"
                    value={val}
                    onChange={(e) => updateCell(r, c, e.target.value)}
                    readOnly={isGiven}
                    className={`${cellSize} text-center font-bold rounded border focus:outline-none focus:border-primary ${borderR} ${borderB} ${
                      isGiven ? 'bg-surface-light text-white border-gray-600 cursor-default' : 'bg-bg border-gray-700 text-accent'
                    }`}
                    maxLength={1}
                  />
                );
              })
            )}
          </div>
        </div>
        <br />
        <button onClick={submit} className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Check Solution</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Sudoku</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <p className="text-sm text-gray-400 text-center">
          Easy = 4x4 · Medium = 6x6 · Hard = 9x9
        </p>
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start Puzzle</button>
      </div>
    </div>
  );
}
