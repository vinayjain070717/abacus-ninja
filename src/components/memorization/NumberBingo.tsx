import { useState, useMemo, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateNumberBingoBoard, type NumberBingoBoard } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';

const DIFF_PARAMS = {
  easy: { gridSize: 3 },
  medium: { gridSize: 4 },
  hard: { gridSize: 5 },
} as const;

type Phase = 'config' | 'playing' | 'results';

function gridDim(total: number): number {
  const r = Math.round(Math.sqrt(total));
  return r * r === total ? r : Math.ceil(Math.sqrt(total));
}

function shuffledIndices(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function NumberBingo({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [gridSize, setGridSize] = useState(3);
  const sessionGridRef = useRef(3);
  const previewBoard = useMemo(() => generateNumberBingoBoard(gridSize), [gridSize]);

  const wsRounds = worksheetMode?.rounds;
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const worksheetBootstrap = useMemo(() => {
    if (wsRounds == null) return null;
    const gs = DIFF_PARAMS[wsDiff].gridSize;
    sessionGridRef.current = gs;
    const b = generateNumberBingoBoard(gs);
    return { board: b, order: shuffledIndices(b.questions.length), target: wsRounds };
  }, [wsRounds, wsDiff]);

  const [playBoard, setPlayBoard] = useState<NumberBingoBoard | null>(() => worksheetBootstrap?.board ?? null);
  const [questionOrder, setQuestionOrder] = useState<number[]>(() => worksheetBootstrap?.order ?? []);
  const [qPos, setQPos] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [scoreCount, setScoreCount] = useState(0);
  const [cluesDone, setCluesDone] = useState(0);
  const [sessionTarget, setSessionTarget] = useState(() => worksheetBootstrap?.target ?? 0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [missedFirstTry, setMissedFirstTry] = useState(false);

  const startGame = () => {
    const gs = DIFF_PARAMS[effectiveDiff].gridSize;
    sessionGridRef.current = gs;
    const b = generateNumberBingoBoard(gs);
    setPlayBoard(b);
    setQuestionOrder(shuffledIndices(b.questions.length));
    setQPos(0);
    setMarked(new Set());
    setScoreCount(0);
    setCluesDone(0);
    setSessionTarget(b.questions.length);
    setMissedFirstTry(false);
    setPhase('playing');
  };

  const currentQIndex = questionOrder[qPos] ?? 0;
  const currentQuestion = playBoard?.questions[currentQIndex];

  const cellClick = (value: number, cellIndex: number) => {
    if (!playBoard || !currentQuestion || phase !== 'playing') return;
    if (marked.has(cellIndex)) return;

    if (value === currentQuestion.answer) {
      const earned = !missedFirstTry;
      const nextMarked = new Set(marked);
      nextMarked.add(cellIndex);
      const nextScore = scoreCount + (earned ? 1 : 0);
      const nextClues = cluesDone + 1;
      setMarked(nextMarked);
      setScoreCount(nextScore);
      setCluesDone(nextClues);
      setMissedFirstTry(false);

      if (nextClues >= sessionTarget) {
        if (worksheetMode && onComplete) {
          onComplete(nextScore, sessionTarget);
          return;
        }
        setPhase('results');
        return;
      }

      if (qPos + 1 < questionOrder.length) {
        setQPos(qPos + 1);
      } else {
        const nb = generateNumberBingoBoard(worksheetMode ? 3 : gridSize);
        setPlayBoard(nb);
        setQuestionOrder(shuffledIndices(nb.questions.length));
        setQPos(0);
        setMarked(new Set());
      }
    } else {
      setMissedFirstTry(true);
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 350);
    }
  };

  if (phase === 'results' && playBoard) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Number bingo — results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">
            {scoreCount}/{sessionTarget}
          </div>
          <p className="text-gray-400 text-sm">First-try correct clues.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark text-white"
          >
            Play again
          </button>
          {!worksheetMode && (
            <button
              type="button"
              onClick={() => {
                setPlayBoard(null);
                setPhase('config');
              }}
              className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600"
            >
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && playBoard && currentQuestion) {
    const dim = gridDim(playBoard.grid.length);
    return (
      <div className="max-w-md mx-auto text-primary">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Clue {cluesDone + 1} / {sessionTarget}
          </span>
          <span>Score: {scoreCount}</span>
        </div>
        <div
          className={`bg-surface rounded-2xl p-6 mb-4 transition-shadow ${
            wrongFlash ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <p className="text-gray-400 text-sm mb-2">Solve and tap the answer on the grid.</p>
          <p className="text-2xl font-mono font-bold text-center mb-6">{currentQuestion.expression}</p>
          <div
            className="grid gap-2 mx-auto w-full max-w-xs"
            style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
          >
            {playBoard.grid.map((value, i) => {
              const isMarked = marked.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isMarked}
                  onClick={() => cellClick(value, i)}
                  className={`aspect-square rounded-xl font-mono text-lg font-bold transition-colors ${
                    isMarked
                      ? 'bg-green-900/40 border-2 border-green-600 text-green-200 cursor-default'
                      : 'bg-surface-light border border-gray-600 hover:bg-primary hover:text-white hover:border-primary'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Number bingo</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Each cell is a unique product. Match the expression to the right square. Only your first tap per clue counts
          for score.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Grid size</label>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 4].map((n) => (
              <option key={n} value={n}>
                {n} × {n} ({n * n} cells)
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-lg bg-surface-light/50 p-3 text-sm text-gray-400">
          Preview: {previewBoard.questions.length} clues on a {gridDim(previewBoard.grid.length)}×
          {gridDim(previewBoard.grid.length)} board.
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button
          type="button"
          onClick={startGame}
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          Start
        </button>
      </div>
    </div>
  );
}
