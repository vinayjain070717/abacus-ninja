import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
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

  const wsRounds = worksheetMode?.rounds ?? 0;
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const [roundsData, setRoundsData] = useState<DualNBackProblem[]>(() => {
    if (!worksheetMode) return [];
    const { seqLength, nBack } = DIFF_PARAMS[wsDiff];
    return Array.from({ length: wsRounds }, () => generateDualNBackSequence(seqLength, nBack));
  });
  const [roundIdx, setRoundIdx] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const [feedbackLines, setFeedbackLines] = useState<string[]>([]);
  const [clickedNum, setClickedNum] = useState(false);
  const [clickedPos, setClickedPos] = useState(false);

  const clickedNumRef = useRef(false);
  const clickedPosRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isWorksheet = useRef(!!worksheetMode);

  const scoresRef = useRef({ numHits: 0, numMisses: 0, numFA: 0, posHits: 0, posMisses: 0, posFA: 0 });

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

  useEffect(() => {
    if (phase !== 'playing' || sequence.length === 0) return;

    if (stepIndex >= sequence.length) {
      if (roundIdx + 1 < roundsData.length) {
        setRoundIdx((r) => r + 1);
        setStepIndex(0);
      } else {
        const s = scoresRef.current;
        const numOpp = s.numHits + s.numMisses;
        const posOpp = s.posHits + s.posMisses;
        const score = s.numHits + s.posHits;
        const total = Math.max(1, numOpp + posOpp);
        if (isWorksheet.current && onCompleteRef.current) {
          onCompleteRef.current(score, total);
          return;
        }
        setPhase('results');
      }
      return;
    }

    clearTimer();
    timerRef.current = setTimeout(() => {
      const i = stepIndex;
      const cn = clickedNumRef.current;
      const cp = clickedPosRef.current;
      const lines: string[] = [];
      const s = scoresRef.current;

      const numTarget = i >= n && problem.numberMatches[i];
      const posTarget = i >= n && problem.positionMatches[i];

      if (i < n) {
        if (cn) { s.numFA++; lines.push('Number: false alarm (no target yet)'); }
        if (cp) { s.posFA++; lines.push('Position: false alarm (no target yet)'); }
        if (!cn && !cp) { lines.push('No targets this step — good.'); }
      } else {
        if (numTarget) {
          if (cn) { s.numHits++; lines.push('Number: hit'); }
          else { s.numMisses++; lines.push('Number: missed match'); }
        } else if (cn) { s.numFA++; lines.push('Number: false alarm'); }
        else { lines.push('Number: correct reject'); }

        if (posTarget) {
          if (cp) { s.posHits++; lines.push('Position: hit'); }
          else { s.posMisses++; lines.push('Position: missed match'); }
        } else if (cp) { s.posFA++; lines.push('Position: false alarm'); }
        else { lines.push('Position: correct reject'); }
      }

      setFeedbackLines(lines);
      setPhase('feedback');
    }, STEP_MS);

    return () => clearTimer();
  }, [phase, stepIndex, sequence.length, roundIdx, roundsData.length, n, problem, clearTimer]);

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

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const { seqLength, nBack } = DIFF_PARAMS[effectiveDiff];
    const rs = Array.from({ length: totalRounds }, () =>
      generateDualNBackSequence(seqLength, nBack));
    setRoundsData(rs);
    setRoundIdx(0);
    setStepIndex(0);
    scoresRef.current = { numHits: 0, numMisses: 0, numFA: 0, posHits: 0, posMisses: 0, posFA: 0 };
    setFeedbackLines([]);
    setPhase('playing');
  };

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const s = scoresRef.current;
    const numOpp = s.numHits + s.numMisses;
    const posOpp = s.posHits + s.posMisses;
    const reportData: ReportData = {
      title: 'Dual N-Back',
      subtitle: `${effectiveDiff} · N=${n} · ${roundsData.length} rounds`,
      totalTimeSec,
      sections: [
        {
          label: 'Number Match', icon: '🔢',
          score: s.numHits, total: Math.max(1, numOpp),
          timeSpentSec: Math.round(totalTimeSec / 2), idealTimeSec: idealPerRound * roundsData.length,
          details: [],
        },
        {
          label: 'Position Match', icon: '📍',
          score: s.posHits, total: Math.max(1, posOpp),
          timeSpentSec: Math.round(totalTimeSec / 2), idealTimeSec: idealPerRound * roundsData.length,
          details: [],
        },
      ],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={isWorksheet.current ? undefined : () => setPhase('config')} gameId="dual-n-back" />;
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

  if (phase === 'playing' && stepIndex >= sequence.length) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p>Advancing to next round...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Dual N-Back</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          Two streams: a 3x3 position and a digit. Press Number Match or Position Match when the current stimulus matches the one from N steps ago.
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
