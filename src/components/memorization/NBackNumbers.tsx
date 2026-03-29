import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import { generateNBackSequence, type NBackSequence } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'running' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { nBack: 1, seqLength: 12 },
  medium: { nBack: 2, seqLength: 18 },
  hard: { nBack: 3, seqLength: 26 },
} as const;

const STEP_MS = 2000;
const FEEDBACK_MS = 800;

export default function NBackNumbers({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'running' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [nBack, setNBack] = useState(2);
  const [seqLength, setSeqLength] = useState(18);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 5);

  const wsRounds = worksheetMode?.rounds ?? 0;
  const wsDiff = worksheetMode?.difficulty ?? 'medium';
  const [roundsData, setRoundsData] = useState<NBackSequence[]>(() =>
    worksheetMode
      ? Array.from({ length: wsRounds }, () => {
          const p = DIFF_PARAMS[wsDiff];
          return generateNBackSequence(p.seqLength, p.nBack);
        })
      : []
  );
  const [roundIdx, setRoundIdx] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [userClicked, setUserClicked] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | 'missed' | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isWorksheet = useRef(!!worksheetMode);

  const hitsRef = useRef({ totalHits: 0, totalOpps: 0, roundHits: 0, roundOpps: 0 });

  const sequence = roundsData[roundIdx]?.sequence ?? [];
  const n = roundsData[roundIdx]?.nBack ?? nBack;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Step timer: only depends on phase, stepIndex, roundIdx
  useEffect(() => {
    if (phase !== 'running' || sequence.length === 0) return;

    if (stepIndex >= sequence.length) {
      const h = hitsRef.current;
      const newTotalHits = h.totalHits + h.roundHits;
      const newTotalOpps = h.totalOpps + h.roundOpps;

      if (roundIdx + 1 < roundsData.length) {
        hitsRef.current = { totalHits: newTotalHits, totalOpps: newTotalOpps, roundHits: 0, roundOpps: 0 };
        setRoundIdx((r) => r + 1);
        setStepIndex(0);
        setUserClicked(false);
        setFeedbackType(null);
      } else {
        if (isWorksheet.current && onCompleteRef.current) {
          onCompleteRef.current(newTotalHits, Math.max(1, newTotalOpps));
          return;
        }
        hitsRef.current = { ...hitsRef.current, totalHits: newTotalHits, totalOpps: newTotalOpps };
        setPhase('results');
      }
      return;
    }

    const clickedAtStart = userClicked;
    timerRef.current = setTimeout(() => {
      const match = stepIndex >= n && sequence[stepIndex] === sequence[stepIndex - n];

      if (match && clickedAtStart) {
        setFeedbackType('correct');
        hitsRef.current.roundHits++;
        hitsRef.current.roundOpps++;
      } else if (match && !clickedAtStart) {
        setFeedbackType('missed');
        hitsRef.current.roundOpps++;
      } else if (!match && clickedAtStart) {
        setFeedbackType('wrong');
      } else {
        setStepIndex((s) => s + 1);
        setUserClicked(false);
        return;
      }

      setPhase('feedback');
    }, STEP_MS);

    return () => clearTimer();
  }, [phase, stepIndex, roundIdx, sequence, n, userClicked, roundsData.length, clearTimer]);

  useEffect(() => {
    if (phase !== 'feedback') return;
    timerRef.current = setTimeout(() => {
      setFeedbackType(null);
      setUserClicked(false);
      setStepIndex((s) => s + 1);
      setPhase('running');
    }, FEEDBACK_MS);
    return () => clearTimer();
  }, [phase, clearTimer]);

  const onMatchClick = () => {
    if (phase !== 'running' || stepIndex >= sequence.length || userClicked) return;
    setUserClicked(true);
  };

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    const rs = Array.from({ length: totalRounds }, () => generateNBackSequence(p.seqLength, p.nBack));
    setRoundsData(rs);
    setRoundIdx(0);
    setStepIndex(0);
    hitsRef.current = { totalHits: 0, totalOpps: 0, roundHits: 0, roundOpps: 0 };
    setUserClicked(false);
    setFeedbackType(null);
    setPhase('running');
  };

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const h = hitsRef.current;
    const totalOpp = Math.max(1, h.totalOpps);
    const reportData: ReportData = {
      title: 'N-Back Numbers',
      subtitle: `${effectiveDiff} · N=${n} · ${roundsData.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'N-Back Numbers', icon: '🔢',
        score: h.totalHits, total: totalOpp,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * roundsData.length,
        details: [],
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={isWorksheet.current ? undefined : () => setPhase('config')} gameId="n-back-numbers" />;
  }

  if ((phase === 'running' || phase === 'feedback') && sequence.length > 0 && stepIndex < sequence.length) {
    const display = sequence[stepIndex];
    const ringColor = feedbackType === 'correct' ? 'ring-4 ring-green-500'
      : feedbackType === 'wrong' ? 'ring-4 ring-red-500'
      : feedbackType === 'missed' ? 'ring-4 ring-yellow-500'
      : '';

    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Round {roundIdx + 1}/{roundsData.length} · Step {stepIndex + 1}/{sequence.length}</span>
          <span className="text-primary">N = {n}</span>
        </div>
        <div className={`bg-surface rounded-2xl p-10 mb-6 border border-gray-700/50 min-h-[200px] flex flex-col items-center justify-center transition-all ${ringColor}`}>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-4">Current</p>
          <span className="text-7xl font-bold text-primary tabular-nums">{display}</span>
          {feedbackType === 'correct' && <p className="text-green-400 text-sm mt-4 font-bold">Correct match!</p>}
          {feedbackType === 'wrong' && <p className="text-red-400 text-sm mt-4 font-bold">Not a match</p>}
          {feedbackType === 'missed' && <p className="text-yellow-400 text-sm mt-4 font-bold">Missed! That was a match</p>}
          {!feedbackType && <p className="text-gray-400 text-sm mt-6">Press Match! if this equals the number from {n} step{n !== 1 ? 's' : ''} ago</p>}
        </div>
        <button
          onClick={onMatchClick}
          disabled={phase === 'feedback' || userClicked}
          className={`w-full max-w-xs mx-auto px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            userClicked ? 'bg-blue-700 text-white' :
            phase === 'feedback' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' :
            'bg-accent hover:bg-accent-dark'
          }`}
        >
          {userClicked ? '✓ Matched' : 'Match!'}
        </button>
        <p className="text-gray-500 text-xs mt-4">Each number shows for 2 seconds</p>
      </div>
    );
  }

  if (phase === 'running' && stepIndex >= sequence.length) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p>Advancing to next round...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">N-Back Numbers</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Numbers appear one at a time. Tap Match! when the current number equals the one from N steps back.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">N (steps back)</label>
          <select value={nBack} onChange={(e) => setNBack(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[1, 2, 3].map((x) => <option key={x} value={x}>{x}-back</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Sequence length</label>
          <select value={seqLength} onChange={(e) => setSeqLength(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[12, 15, 18, 22, 26].map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select value={totalRounds} onChange={(e) => setTotalRounds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[3, 5, 8, 10].map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
