import { useState, useEffect, useRef } from 'react';
import { generateNumberGrid } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'showing' | 'input' | 'results';

const DIFF_PARAMS = {
  easy: { gridSize: 3, displayTime: 15 },
  medium: { gridSize: 4, displayTime: 10 },
  hard: { gridSize: 5, displayTime: 7 },
} as const;

export default function SpeedGrid({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const wsParams = DIFF_PARAMS[wsDiff];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'showing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [gridSize, setGridSize] = useState<number>(worksheetMode ? wsParams.gridSize : 4);
  const [displayTime, setDisplayTime] = useState<number>(worksheetMode ? wsParams.displayTime : 10);
  const wsRound = useRef(0);
  const wsScore = useRef(0);
  const wsTotal = useRef(0);
  const maxRounds = worksheetMode?.rounds ?? 1;

  const [grid, setGrid] = useState<number[][]>(() =>
    worksheetMode ? generateNumberGrid(wsParams.gridSize, wsParams.gridSize) : []
  );
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    worksheetMode
      ? Array.from({ length: wsParams.gridSize }, () => Array(wsParams.gridSize).fill(''))
      : []
  );
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(worksheetMode ? wsParams.displayTime : 0);

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setGridSize(p.gridSize);
    setDisplayTime(p.displayTime);
  }, [difficulty, worksheetMode]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    const size = p.gridSize;
    const dt = p.displayTime;
    setGridSize(size);
    setDisplayTime(dt);
    const g = generateNumberGrid(size, size);
    setGrid(g);
    setUserGrid(Array.from({ length: size }, () => Array(size).fill('')));
    setScore(0);
    setCountdown(dt);
    wsRound.current = 0;
    wsScore.current = 0;
    wsTotal.current = 0;
    setPhase('showing');
  };

  useEffect(() => {
    if (phase !== 'showing') return;
    if (countdown <= 0) {
      setPhase('input');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const updateCell = (r: number, c: number, val: string) => {
    const ng = userGrid.map((row) => [...row]);
    ng[r][c] = val.slice(-1);
    setUserGrid(ng);
  };

  const submit = () => {
    let correct = 0;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (parseInt(userGrid[r][c]) === grid[r][c]) correct++;
      }
    }
    const total = gridSize * gridSize;
    wsScore.current += correct;
    wsTotal.current += total;
    wsRound.current += 1;

    const p = DIFF_PARAMS[effectiveDiff];
    const dt = worksheetMode ? p.displayTime : displayTime;
    const size = worksheetMode ? p.gridSize : gridSize;

    if (worksheetMode && wsRound.current >= maxRounds) {
      if (onComplete) onComplete(wsScore.current, wsTotal.current);
      return;
    }
    if (worksheetMode && wsRound.current < maxRounds) {
      const g = generateNumberGrid(size, size);
      setGrid(g);
      setUserGrid(Array.from({ length: size }, () => Array(size).fill('')));
      setCountdown(dt);
      setPhase('showing');
      return;
    }

    setScore(correct);
    setPhase('results');
  };

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const total = gridSize * gridSize;
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const details = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isCorrect = parseInt(userGrid[r][c]) === grid[r][c];
        details.push({
          display: `Cell (${r + 1},${c + 1})`,
          correct: isCorrect,
          correctAnswer: String(grid[r][c]),
          userAnswer: userGrid[r][c] || '—',
        });
      }
    }
    const reportData: ReportData = {
      title: 'Speed Grid',
      subtitle: `${effectiveDiff} · ${gridSize}×${gridSize} grid`,
      totalTimeSec,
      sections: [{
        label: 'Speed Grid', icon: '⚡',
        score, total,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * Math.max(1, Math.ceil(total / 4)),
        details,
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={() => setPhase('config')} />;
  }

  if (phase === 'showing') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-2">Memorize the grid!</h2>
        <p className="text-gray-400 mb-4">{countdown}s remaining</p>
        <div className="bg-surface rounded-2xl p-6 inline-block">
          <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {grid.map((row, r) =>
              row.map((val, c) => (
                <div key={`${r}-${c}`} className="w-12 h-12 flex items-center justify-center bg-primary rounded-lg text-xl font-bold">{val}</div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'input') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Recreate the grid!</h2>
        <div className="bg-surface rounded-2xl p-6 inline-block mb-4">
          <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {userGrid.map((row, r) =>
              row.map((val, c) => (
                <input
                  key={`${r}-${c}`}
                  type="text"
                  value={val}
                  onChange={(e) => updateCell(r, c, e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-12 h-12 text-center bg-surface-light border border-gray-600 rounded-lg text-xl font-bold focus:outline-none focus:border-primary"
                  maxLength={1}
                />
              ))
            )}
          </div>
        </div>
        <br />
        <button onClick={submit} className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Speed Number Grid</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Grid size</label>
          <div className="flex gap-2">
            {[3, 4, 5].map((s) => (
              <button key={s} onClick={() => setGridSize(s)} className={`flex-1 py-2 rounded-lg font-bold ${gridSize === s ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{s}x{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Display time (sec)</label>
          <select value={displayTime} onChange={(e) => setDisplayTime(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[5, 7, 10, 15, 20, 30].map((n) => (<option key={n} value={n}>{n}s</option>))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
