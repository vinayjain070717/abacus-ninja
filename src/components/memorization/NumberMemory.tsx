import { useState, useEffect, useRef } from 'react';
import { generateMemorySequence } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'showing' | 'input' | 'results';

const DIFF_PARAMS = {
  easy: { count: 4, displayTime: 5 },
  medium: { count: 7, displayTime: 3 },
  hard: { count: 12, displayTime: 2 },
} as const;

export default function NumberMemory({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>('config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [count, setCount] = useState<number>(DIFF_PARAMS.medium.count);
  const [displayMode, setDisplayMode] = useState<'one' | 'all'>('all');
  const [displayTime, setDisplayTime] = useState<number>(DIFF_PARAMS.medium.displayTime);

  const [sequence, setSequence] = useState<number[]>([]);
  const [flashIdx, setFlashIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setCount(p.count);
    setDisplayTime(p.displayTime);
  }, [difficulty, worksheetMode]);

  const startTimeRef = useRef(Date.now());

  const startGame = () => {
    startTimeRef.current = Date.now();
    const p = DIFF_PARAMS[effectiveDiff];
    const c = p.count;
    const dt = p.displayTime;
    setCount(c);
    setDisplayTime(dt);
    const seq = generateMemorySequence(c);
    setSequence(seq);
    setUserInput('');
    setScore(0);
    setPhase('showing');

    if (displayMode === 'all') {
      setTimeout(() => {
        setPhase('input');
        setTimeout(() => inputRef.current?.focus(), 100);
      }, dt * 1000);
    } else {
      setFlashIdx(0);
    }
  };

  useEffect(() => {
    if (phase !== 'showing' || displayMode !== 'one') return;
    if (flashIdx >= sequence.length) {
      setPhase('input');
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    const t = setTimeout(() => setFlashIdx((i) => i + 1), displayTime * 1000);
    return () => clearTimeout(t);
  }, [phase, flashIdx, displayMode, displayTime, sequence.length]);

  const submit = () => {
    const userDigits = userInput.split('').map(Number).filter((n) => !isNaN(n));
    let correct = 0;
    for (let i = 0; i < sequence.length; i++) {
      if (userDigits[i] === sequence[i]) correct++;
    }
    setScore(correct);
    if (worksheetMode && onComplete) {
      onComplete(correct, sequence.length);
      return;
    }
    setPhase('results');
  };

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const userDigits = userInput.split('').map(Number).filter((n) => !isNaN(n));
    const reportData: ReportData = {
      title: 'Number Memory',
      subtitle: `${effectiveDiff} · ${sequence.length} digits`,
      totalTimeSec,
      sections: [{
        label: 'Number Memory', icon: '🧠',
        score, total: sequence.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * Math.max(1, Math.ceil(sequence.length / 4)),
        details: sequence.map((n, i) => ({
          display: `Position ${i + 1}`,
          correct: userDigits[i] === n,
          correctAnswer: String(n),
          userAnswer: userDigits[i] != null ? String(userDigits[i]) : '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={() => setPhase('config')} />;
  }

  if (phase === 'showing') {
    if (displayMode === 'all') {
      return (
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold mb-4">Memorize!</h2>
          <div className="bg-surface rounded-2xl p-8">
            <div className="flex justify-center gap-3 flex-wrap">
              {sequence.map((n, i) => (
                <div key={i} className="w-12 h-12 flex items-center justify-center bg-primary rounded-lg text-2xl font-bold">{n}</div>
              ))}
            </div>
          </div>
          <p className="text-gray-400 mt-4">Disappears in {displayTime} seconds...</p>
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Memorize!</h2>
        <div className="bg-surface rounded-2xl p-12">
          {flashIdx < sequence.length && (
            <span className="text-7xl font-bold">{sequence[flashIdx]}</span>
          )}
        </div>
        <p className="text-gray-400 mt-4">Number {flashIdx + 1} of {sequence.length}</p>
      </div>
    );
  }

  if (phase === 'input') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Type the numbers you remember</h2>
        <div className="bg-surface rounded-2xl p-8">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={count}
            placeholder="Type digits..."
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary"
            autoFocus
          />
          <div className="text-gray-400 text-sm mt-3">{userInput.length}/{count} digits</div>
        </div>
        <button onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Number Memory</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">How many numbers</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {Array.from({ length: 18 }, (_, i) => i + 3).map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Display mode</label>
          <div className="flex gap-2">
            <button onClick={() => setDisplayMode('all')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${displayMode === 'all' ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>All at once</button>
            <button onClick={() => setDisplayMode('one')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${displayMode === 'one' ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>One-by-one</button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Display time (sec)</label>
          <select value={displayTime} onChange={(e) => setDisplayTime(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[1, 2, 3, 4, 5, 7, 10].map((n) => (<option key={n} value={n}>{n}s</option>))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
