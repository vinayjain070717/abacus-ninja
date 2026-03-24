import { useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';

const DISPLAY_MS = 800;

const DIFF_PARAMS: Record<Difficulty, { sequenceStart: number; maxLength: number }> = {
  easy: { sequenceStart: 3, maxLength: 7 },
  medium: { sequenceStart: 3, maxLength: 15 },
  hard: { sequenceStart: 6, maxLength: 14 },
};

type Phase = 'config' | 'show' | 'input' | 'results';

function randomDigit() {
  return 1 + Math.floor(Math.random() * 9);
}

export default function SimonNumbers({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const targetSuccesses = worksheetMode?.rounds ?? 0;

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const seqParamsRef = useRef(
    worksheetMode
      ? DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty]
      : DIFF_PARAMS.medium
  );

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'show' : 'config');
  const [sequence, setSequence] = useState<number[]>(() => {
    if (!worksheetMode) return [];
    const p = DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty];
    return Array.from({ length: p.sequenceStart }, randomDigit);
  });
  const [showIdx, setShowIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const beginShow = useCallback((seq: number[]) => {
    setSequence(seq);
    setShowIdx(0);
    setUserInput('');
    setPhase('show');
  }, []);

  useEffect(() => {
    if (phase !== 'show') return;
    if (showIdx >= sequence.length) {
      setPhase('input');
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    const id = setTimeout(() => setShowIdx((i) => i + 1), DISPLAY_MS);
    return () => clearTimeout(id);
  }, [phase, showIdx, sequence.length]);

  const startFreePlay = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    seqParamsRef.current = p;
    setSuccessCount(0);
    beginShow(Array.from({ length: p.sequenceStart }, randomDigit));
  };

  const submit = () => {
    const digits = userInput.replace(/\D/g, '').split('').map(Number);
    const ok =
      digits.length === sequence.length && digits.every((d, i) => d === sequence[i]);

    if (!ok) {
      if (worksheetMode && onComplete) {
        onComplete(successCount, targetSuccesses);
        return;
      }
      setPhase('results');
      return;
    }

    const nextCount = successCount + 1;
    setSuccessCount(nextCount);

    if (worksheetMode && nextCount >= targetSuccesses) {
      onComplete?.(nextCount, targetSuccesses);
      return;
    }

    if (sequence.length >= seqParamsRef.current.maxLength) {
      if (worksheetMode && onComplete) {
        onComplete(nextCount, targetSuccesses);
        return;
      }
      setPhase('results');
      return;
    }

    beginShow([...sequence, randomDigit()]);
  };

  if (phase === 'results' && !worksheetMode) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Simon Numbers</h2>
        <p className="text-gray-400 mb-2">Successful recalls in a row</p>
        <p className="text-4xl font-bold text-primary mb-6">{successCount}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startFreePlay}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={() => setPhase('config')}
            className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'config') {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">Simon Numbers</h2>
        <p className="text-gray-400 text-sm">
          Watch the sequence, then type it back. Each success adds one more digit (up to{' '}
          {DIFF_PARAMS[difficulty].maxLength}).
        </p>
        <div className="text-left max-w-md mx-auto">
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>
        <button
          type="button"
          onClick={startFreePlay}
          className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Start
        </button>
      </div>
    );
  }

  if (phase === 'show') {
    return (
      <div className="max-w-md mx-auto text-center">
        <p className="text-sm text-gray-400 mb-4">
          Watch… {Math.min(showIdx + 1, sequence.length)}/{sequence.length}
        </p>
        <div className="bg-surface rounded-2xl p-12 min-h-[160px] flex items-center justify-center">
          {showIdx < sequence.length ? (
            <span className="text-6xl font-bold tabular-nums">{sequence[showIdx]}</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-4">
      <p className="text-sm text-gray-400">
        Repeat the sequence ({sequence.length} digits)
        {worksheetMode ? ` · ${successCount}/${targetSuccesses} levels` : null}
      </p>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        maxLength={sequence.length}
        className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:border-primary"
        placeholder="Digits"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={submit}
        className="px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
      >
        Submit
      </button>
    </div>
  );
}
