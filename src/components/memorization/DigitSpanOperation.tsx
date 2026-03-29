import { useState, useEffect, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import { generateDigitSpanOperation, type DigitSpanProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

const DIFF_PARAMS = {
  easy: { count: 4 },
  medium: { count: 6 },
  hard: { count: 9 },
} as const;

type Phase = 'config' | 'showing' | 'input' | 'feedback' | 'results';

interface RoundResult {
  problem: DigitSpanProblem;
  userInput: string;
  digitScore: number;
}

export default function DigitSpanOperation({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'showing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [digitCount, setDigitCount] = useState(5);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);

  const [allProblems, setAllProblems] = useState<DigitSpanProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateDigitSpanOperation(DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'].count)
        )
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentProblem = allProblems[currentIdx];

  useEffect(() => {
    if (phase !== 'showing' || allProblems.length === 0) return;
    const t = setTimeout(() => {
      setPhase('input');
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 4000);
    return () => clearTimeout(t);
  }, [phase, currentIdx, allProblems.length]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const c = DIFF_PARAMS[effectiveDiff].count;
    const ps = Array.from({ length: totalRounds }, () => generateDigitSpanOperation(c));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setLastResult(null);
    setUserInput('');
    setPhase('showing');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    setUserInput('');
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setPhase('showing');
    } else {
      const totalScore = results.reduce((s, r) => s + r.digitScore, 0);
      const totalPossible = results.reduce((s, r) => s + r.problem.transformed.length, 0);
      if (worksheetMode && onComplete) {
        onComplete(totalScore, totalPossible);
        return;
      }
      setPhase('results');
    }
  };

  const scoreDigits = (problem: DigitSpanProblem, raw: string): number => {
    const digits = raw.replace(/\D/g, '').split('').map(Number).filter((n) => !Number.isNaN(n));
    const t = problem.transformed;
    let correct = 0;
    for (let i = 0; i < t.length; i++) {
      if (digits[i] === t[i]) correct++;
    }
    return correct;
  };

  const submit = () => {
    if (!currentProblem) return;
    const digitScore = scoreDigits(currentProblem, userInput);
    const newResults = [...results, { problem: currentProblem, userInput, digitScore }];
    setResults(newResults);
    setLastResult({ problem: currentProblem, userInput, digitScore });
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastResult) {
    const correct = lastResult.digitScore === lastResult.problem.transformed.length;
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Round recap</span>
        </div>
        <RoundFeedback
          correct={correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">Shown: {lastResult.problem.original.join(' ')}</p>
          <p className="text-gray-400 font-mono">Expected: {lastResult.problem.transformed.join('')}</p>
          <p className="text-gray-400 font-mono">You typed: {lastResult.userInput || '—'}</p>
          <p
            className={`font-bold ${lastResult.digitScore === lastResult.problem.transformed.length ? 'text-green-400' : 'text-amber-400'}`}
          >
            {lastResult.digitScore}/{lastResult.problem.transformed.length} digits correct
          </p>
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Digit Span Operation',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Digit Span Operation', icon: '🔢',
        score: results.reduce((s, r) => s + r.digitScore, 0),
        total: results.reduce((s, r) => s + r.problem.transformed.length, 0),
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r, i) => ({
          display: `Round ${i + 1}`,
          correct: r.digitScore === r.problem.transformed.length,
          correctAnswer: r.problem.transformed.join(''),
          userAnswer: r.userInput || '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'showing' && currentProblem) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Memorize</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-gray-700/50">
          <p className="text-gray-400 mb-4 text-sm">You will type the sequence reversed, each digit +1 (9→0).</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {currentProblem.original.map((n, i) => (
              <div
                key={i}
                className="w-12 h-12 flex items-center justify-center bg-surface-light rounded-xl text-2xl font-bold text-primary border border-gray-600"
              >
                {n}
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-6">Hidden in 4 seconds…</p>
        </div>
      </div>
    );
  }

  if (phase === 'input' && currentProblem) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Your answer</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-gray-700/50">
          <p className="text-gray-400 mb-4">Type reversed digits with +1 each (wrap 9→0).</p>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={currentProblem.transformed.length + 4}
            placeholder="Digits…"
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.35em] focus:outline-none focus:border-primary text-primary"
            autoFocus
          />
        </div>
        <button type="button" onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Digit Span (+1, reversed)</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Memorize digits for 4 seconds, then enter them reversed with each digit increased by 1 (mod 10).</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Digits per round</label>
          <select
            value={digitCount}
            onChange={(e) => setDigitCount(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 15].map((n) => (
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
