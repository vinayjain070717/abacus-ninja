import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import {
  generateDualNBackSequence,
  type DualNBackProblem,
  type DualNBackStep,
} from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS: Record<Difficulty, { nBack: number; seqLength: number }> = {
  easy: { nBack: 1, seqLength: 15 },
  medium: { nBack: 2, seqLength: 20 },
  hard: { nBack: 3, seqLength: 25 },
};

const STEP_MS = 2500;
const FEEDBACK_MS = 800;

export default function DualNBack({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 5);

  const [roundsData, setRoundsData] = useState<DualNBackProblem[]>(() => {
    if (!worksheetMode) return [];
    const d = (worksheetMode.difficulty ?? 'medium') as Difficulty;
    const { seqLength, nBack } = DIFF_PARAMS[d];
    return Array.from({ length: worksheetMode.rounds }, () => generateDualNBackSequence(seqLength, nBack));
  });
  const [roundIdx, setRoundIdx] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const [numHits, setNumHits] = useState(0);
  const [numMisses, setNumMisses] = useState(0);
  const [numFalseAlarms, setNumFalseAlarms] = useState(0);
  const [posHits, setPosHits] = useState(0);
  const [posMisses, setPosMisses] = useState(0);
  const [posFalseAlarms, setPosFalseAlarms] = useState(0);

  const [feedbackLines, setFeedbackLines] = useState<string[]>([]);

  const [clickedNum, setClickedNum] = useState(false);
  const [clickedPos, setClickedPos] = useState(false);

  const clickedNumRef = useRef(false);
  const clickedPosRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const problem = roundsData[roundIdx];
  const sequence: DualNBackStep[] = problem?.sequence ?? [];
  const n = problem?.nBack ?? DIFF_PARAMS[effectiveDiff].nBack;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    clickedNumRef.current = false;
    clickedPosRef.current = false;
    setClickedNum(false);
    setClickedPos(false);
  }, [stepIndex, roundIdx]);

  const finishAllRounds = useCallback(() => {
    const numOpp = numHits + numMisses;
    const posOpp = posHits + posMisses;
    const score = numHits + posHits;
    const total = Math.max(1, numOpp + posOpp);
    if (worksheetMode && onCompleteRef.current) {
      onCompleteRef.current(score, total);
      return;
    }
    setPhase('results');
  }, [worksheetMode, numHits, numMisses, posHits, posMisses]);

  useEffect(() => {
    if (phase !== 'playing' || sequence.length === 0) return;

    if (stepIndex >= sequence.length) {
      if (roundIdx + 1 < roundsData.length) {
        setRoundIdx((r) => r + 1);
        setStepIndex(0);
      } else {
        finishAllRounds();
      }
      return;
    }

    clearTimer();
    timerRef.current = setTimeout(() => {
      const i = stepIndex;
      const cn = clickedNumRef.current;
      const cp = clickedPosRef.current;
      const lines: string[] = [];

      const numTarget = i >= n && problem.numberMatches[i];
      const posTarget = i >= n && problem.positionMatches[i];

      if (i < n) {
        if (cn) {
          setNumFalseAlarms((x) => x + 1);
          lines.push('Number: false alarm (no target yet)');
        }
        if (cp) {
          setPosFalseAlarms((x) => x + 1);
          lines.push('Position: false alarm (no target yet)');
        }
        if (!cn && !cp) {
          lines.push('No targets this step — good.');
        }
      } else {
        if (numTarget) {
          if (cn) {
            setNumHits((h) => h + 1);
            lines.push('Number: hit');
          } else {
            setNumMisses((m) => m + 1);
            lines.push('Number: missed match');
          }
        } else if (cn) {
          setNumFalseAlarms((f) => f + 1);
          lines.push('Number: false alarm');
        } else {
          lines.push('Number: correct reject');
        }

        if (posTarget) {
          if (cp) {
            setPosHits((h) => h + 1);
            lines.push('Position: hit');
          } else {
            setPosMisses((m) => m + 1);
            lines.push('Position: missed match');
          }
        } else if (cp) {
          setPosFalseAlarms((f) => f + 1);
          lines.push('Position: false alarm');
        } else {
          lines.push('Position: correct reject');
        }
      }

      setFeedbackLines(lines);
      setPhase('feedback');
    }, STEP_MS);

    return () => clearTimer();
  }, [
    phase,
    stepIndex,
    sequence.length,
    roundIdx,
    roundsData.length,
    n,
    problem,
    clearTimer,
    finishAllRounds,
  ]);

  useEffect(() => {
    if (phase !== 'feedback') return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      clickedNumRef.current = false;
      clickedPosRef.current = false;
      setStepIndex((s) => s + 1);
      setPhase('playing');
    }, FEEDBACK_MS);
    return () => clearTimer();
  }, [phase, clearTimer]);

  const onNumMatch = () => {
    if (phase !== 'playing' || stepIndex >= sequence.length) return;
    clickedNumRef.current = true;
    setClickedNum(true);
  };

  const onPosMatch = () => {
    if (phase !== 'playing' || stepIndex >= sequence.length) return;
    clickedPosRef.current = true;
    setClickedPos(true);
  };

  const startGame = () => {
    const { seqLength, nBack } = DIFF_PARAMS[effectiveDiff];
    const rs = Array.from({ length: totalRounds }, () =>
      generateDualNBackSequence(seqLength, nBack));
    setRoundsData(rs);
    setRoundIdx(0);
    setStepIndex(0);
    setNumHits(0);
    setNumMisses(0);
    setNumFalseAlarms(0);
    setPosHits(0);
    setPosMisses(0);
    setPosFalseAlarms(0);
    setFeedbackLines([]);
    setPhase('playing');
  };

  const numOpp = numHits + numMisses;
  const posOpp = posHits + posMisses;
  const numAcc = numOpp > 0 ? Math.round((numHits / numOpp) * 100) : 0;
  const posAcc = posOpp > 0 ? Math.round((posHits / posOpp) * 100) : 0;

  if (phase === 'results') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Dual N-Back Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50 space-y-4">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wide">Number stream</p>
            <p className="text-3xl font-bold text-primary tabular-nums">
              {numHits}/{numOpp} <span className="text-lg text-gray-400">({numAcc}%)</span>
            </p>
            <p className="text-gray-500 text-xs">False alarms: {numFalseAlarms}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm uppercase tracking-wide">Position stream</p>
            <p className="text-3xl font-bold text-primary tabular-nums">
              {posHits}/{posOpp} <span className="text-lg text-gray-400">({posAcc}%)</span>
            </p>
            <p className="text-gray-500 text-xs">False alarms: {posFalseAlarms}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">
            Play Again
          </button>
          {!worksheetMode && (
            <button type="button" onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if ((phase === 'playing' || phase === 'feedback') && sequence.length > 0 && stepIndex < sequence.length) {
    const step = sequence[stepIndex];
    const grid = Array.from({ length: 9 }, (_, i) => i);

    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {roundIdx + 1}/{roundsData.length} · Step {stepIndex + 1}/{sequence.length}
          </span>
          <span className="text-primary">N = {n}</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4 border border-gray-700/50">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Position</p>
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mb-6">
            {grid.map((i) => (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold border-2 ${
                  i === step.position
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-light border-gray-600 text-gray-500'
                }`}
              >
                {i === step.position ? '●' : ''}
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Number</p>
          <span className="text-6xl font-bold text-primary tabular-nums">{step.number}</span>
        </div>
        {phase === 'feedback' && (
          <div className="mb-4 text-left text-sm text-gray-300 space-y-1 bg-surface-light/50 rounded-lg p-3 border border-gray-700/50">
            {feedbackLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onNumMatch}
            disabled={phase === 'feedback'}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              clickedNum && phase === 'playing'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-surface-light hover:bg-gray-600'
            } ${phase === 'feedback' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🔢 Number Match
          </button>
          <button
            type="button"
            onClick={onPosMatch}
            disabled={phase === 'feedback'}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              clickedPos && phase === 'playing'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-surface-light hover:bg-gray-600'
            } ${phase === 'feedback' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📍 Position Match
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-4">Each step lasts {(STEP_MS / 1000).toFixed(1)}s — tap when either stream matches the one from N steps back.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Dual N-Back</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Two streams: a 3×3 position and a digit. Press Number Match or Position Match when the current stimulus matches the one from N steps ago.
        </p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 5, 8, 10].map((x) => (
              <option key={x} value={x}>
                {x}
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
