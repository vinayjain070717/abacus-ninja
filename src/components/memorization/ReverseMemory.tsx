import { useState, useEffect, useRef } from 'react';
import { generateMemorySequence } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';

type Phase = 'config' | 'showing' | 'input' | 'results';

const DIFF_PARAMS = {
  easy: { count: 4, displayTime: 5 },
  medium: { count: 6, displayTime: 3 },
  hard: { count: 10, displayTime: 2 },
} as const;

export default function ReverseMemory({
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
  const [displayTime, setDisplayTime] = useState<number>(DIFF_PARAMS.medium.displayTime);

  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setCount(p.count);
    setDisplayTime(p.displayTime);
  }, [difficulty, worksheetMode]);

  const startGame = () => {
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

    setTimeout(() => {
      setPhase('input');
      setTimeout(() => inputRef.current?.focus(), 100);
    }, dt * 1000);
  };

  const reversed = [...sequence].reverse();

  const submit = () => {
    const userDigits = userInput.split('').map(Number).filter((n) => !isNaN(n));
    let correct = 0;
    for (let i = 0; i < reversed.length; i++) {
      if (userDigits[i] === reversed[i]) correct++;
    }
    setScore(correct);
    if (worksheetMode && onComplete) {
      onComplete(correct, sequence.length);
      return;
    }
    setPhase('results');
  };

  if (phase === 'results') {
    const userDigits = userInput.split('').map(Number);
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{score}/{sequence.length}</div>
          <p className="text-gray-400 text-sm mb-3">Original: {sequence.join(' ')}</p>
          <p className="text-gray-400 text-sm mb-3">Reversed: {reversed.join(' ')}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {reversed.map((n, i) => (
              <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg font-bold ${userDigits[i] === n ? 'bg-green-700' : 'bg-red-700'}`}>{n}</div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-3">Your input: {userInput || '—'}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">Play Again</button>
          <button onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">Settings</button>
        </div>
      </div>
    );
  }

  if (phase === 'showing') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Memorize (type in REVERSE!)</h2>
        <div className="bg-surface rounded-2xl p-8">
          <div className="flex justify-center gap-3 flex-wrap">
            {sequence.map((n, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center bg-purple-700 rounded-lg text-2xl font-bold">{n}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'input') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Type in REVERSE order</h2>
        <div className="bg-surface rounded-2xl p-8">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={count}
            placeholder="Reversed digits..."
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Reverse Memory</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">How many numbers</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {Array.from({ length: 15 }, (_, i) => i + 3).map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
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
