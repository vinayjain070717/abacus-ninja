import { useState, useEffect, useRef } from 'react';
import { generateFlashSumProblem, type FlashSumProblem } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

type Phase = 'config' | 'showing' | 'input' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { count: 3, maxDigits: 1, displayTime: 3 },
  medium: { count: 4, maxDigits: 1, displayTime: 2 },
  hard: { count: 6, maxDigits: 2, displayTime: 1.5 },
} as const;

interface RoundResult {
  problem: FlashSumProblem;
  userAnswer: number | null;
  correct: boolean;
}

export default function FlashSum({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const wsP = DIFF_PARAMS[worksheetMode?.difficulty ?? 'medium'];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'showing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [count, setCount] = useState<number>(DIFF_PARAMS.medium.count);
  const [maxDigits, setMaxDigits] = useState<number>(DIFF_PARAMS.medium.maxDigits);
  const [displayTime, setDisplayTime] = useState<number>(DIFF_PARAMS.medium.displayTime);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<FlashSumProblem[]>(() =>
    worksheetMode ? Array.from({ length: worksheetMode.rounds }, () => generateFlashSumProblem(wsP.count, wsP.maxDigits)) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setCount(p.count);
    setMaxDigits(p.maxDigits);
    setDisplayTime(p.displayTime);
  }, [difficulty, worksheetMode]);

  useEffect(() => {
    if (phase !== 'showing' || allProblems.length === 0) return;
    const t = setTimeout(() => {
      setPhase('input');
      setTimeout(() => inputRef.current?.focus(), 100);
    }, displayTime * 1000);
    return () => clearTimeout(t);
  }, [phase, currentIdx, displayTime, allProblems.length]);

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    setCount(p.count);
    setMaxDigits(p.maxDigits);
    setDisplayTime(p.displayTime);
    const ps = Array.from({ length: totalRounds }, () => generateFlashSumProblem(p.count, p.maxDigits));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setAnswer('');
    setPhase('showing');
  };

  const submitAnswer = () => {
    const problem = allProblems[currentIdx];
    const userAns = answer.trim() === '' ? null : parseInt(answer);
    const correct = userAns === problem.answer;
    const newResults = [...results, { problem, userAnswer: userAns, correct }];
    setResults(newResults);
    setAnswer('');

    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setPhase('showing');
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
      title: 'Flash Sum Results',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Flash Sum', icon: '⚡',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: `${r.problem.numbers.join(' + ')} = ?`,
          correct: r.correct,
          correctAnswer: String(r.problem.answer),
          userAnswer: r.userAnswer != null ? String(r.userAnswer) : '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'showing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Round {currentIdx + 1} / {allProblems.length}</span>
          <span>Flash Sum</span>
        </div>
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">What is the sum?</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {problem.numbers.map((n, i) => (
              <div key={i} className="w-14 h-14 flex items-center justify-center bg-blue-600 rounded-xl text-2xl font-bold">{n}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'input') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Round {currentIdx + 1} / {allProblems.length}</span>
          <span>Flash Sum</span>
        </div>
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">What was the sum?</p>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            className="w-48 px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button onClick={submitAnswer} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Flash Sum</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Numbers flash briefly. Type their sum from memory.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Numbers per round</label>
          <select value={count} onChange={e => setCount(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Digit size</label>
          <div className="flex gap-2">
            {[1, 2].map(d => (
              <button key={d} onClick={() => setMaxDigits(d)} className={`flex-1 py-2 rounded-lg font-bold ${maxDigits === d ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>{d}-digit</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Display time</label>
          <select value={displayTime} onChange={e => setDisplayTime(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[1, 1.5, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}s</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
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
