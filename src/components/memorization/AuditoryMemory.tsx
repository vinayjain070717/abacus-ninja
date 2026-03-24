import { useState, useRef, useEffect, useCallback } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateAuditorySequence, type AuditorySequenceProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'speaking' | 'flashing' | 'input' | 'feedback' | 'results';

interface RoundResult {
  problem: AuditorySequenceProblem;
  userAnswer: string;
  correct: boolean;
}

const DIFF_PARAMS: Record<Difficulty, { count: number; speed: number }> = {
  easy: { count: 4, speed: 1.2 },
  medium: { count: 6, speed: 1.0 },
  hard: { count: 9, speed: 0.7 },
};

function timingFromSpeed(speed: number) {
  return {
    flashMs: Math.round(500 * speed),
    speechGapMs: Math.round(140 * speed),
    speechRate: Math.min(1.15, Math.max(0.45, 0.45 + (1.2 - speed) * 0.9)),
  };
}

export default function AuditoryMemory({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;

  const timingRef = useRef(
    timingFromSpeed(DIFF_PARAMS[(worksheetMode?.difficulty ?? 'medium') as Difficulty].speed)
  );

  const [phase, setPhase] = useState<Phase>(() => {
    if (!worksheetMode) return 'config';
    return canSpeak ? 'speaking' : 'flashing';
  });
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 8);
  const [useVisual, setUseVisual] = useState(!canSpeak);

  const [allProblems, setAllProblems] = useState<AuditorySequenceProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () =>
          generateAuditorySequence(DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty].count)
        )
      : []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const [flashIdx, setFlashIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakChainRef = useRef<{ cancelled: boolean } | null>(null);

  resultsRef.current = results;

  const clearFlashTimer = useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }, []);

  const cancelSpeechChain = useCallback(() => {
    if (speakChainRef.current) {
      speakChainRef.current.cancelled = true;
      speakChainRef.current = null;
    }
    if (canSpeak) {
      window.speechSynthesis.cancel();
    }
  }, [canSpeak]);

  useEffect(() => () => {
    clearFlashTimer();
    cancelSpeechChain();
  }, [clearFlashTimer, cancelSpeechChain]);

  const problem = allProblems[currentIdx];

  const startGame = () => {
    cancelSpeechChain();
    clearFlashTimer();
    const { count, speed } = DIFF_PARAMS[effectiveDiff];
    timingRef.current = timingFromSpeed(speed);
    const ps = Array.from({ length: totalRounds }, () => generateAuditorySequence(count));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setAnswer('');
    setFlashIdx(0);
    const visual = !canSpeak || useVisual;
    setPhase(visual ? 'flashing' : 'speaking');
  };

  /* Sequential speech for current problem */
  useEffect(() => {
    if (phase !== 'speaking' || !problem || useVisual || !canSpeak) return;

    const chain = { cancelled: false };
    speakChainRef.current = chain;
    window.speechSynthesis.cancel();

    let i = 0;
    const speakNext = () => {
      if (chain.cancelled) return;
      if (i >= problem.digits.length) {
        setPhase('input');
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      const u = new SpeechSynthesisUtterance(String(problem.digits[i]));
      u.rate = timingRef.current.speechRate;
      u.onend = () => {
        if (chain.cancelled) return;
        i += 1;
        setTimeout(() => speakNext(), timingRef.current.speechGapMs);
      };
      u.onerror = () => {
        if (chain.cancelled) return;
        setUseVisual(true);
        setFlashIdx(0);
        setPhase('flashing');
      };
      window.speechSynthesis.speak(u);
    };

    speakNext();

    return () => {
      chain.cancelled = true;
      window.speechSynthesis.cancel();
    };
  }, [phase, problem, useVisual, canSpeak]);

  /* Visual flash one digit at a time */
  useEffect(() => {
    if (phase !== 'flashing' || !problem) return;

    if (flashIdx >= problem.digits.length) {
      setPhase('input');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    clearFlashTimer();
    flashTimerRef.current = setTimeout(() => setFlashIdx((x) => x + 1), timingRef.current.flashMs);
    return () => clearFlashTimer();
  }, [phase, flashIdx, problem, clearFlashTimer]);

  const submit = () => {
    if (!problem) return;
    const expected = problem.digits.join('');
    const got = answer.replace(/\D/g, '');
    const correct = got === expected;
    const newResults = [...resultsRef.current, { problem, userAnswer: answer, correct }];
    resultsRef.current = newResults;
    setResults(newResults);
    setLastResult({ problem, userAnswer: answer, correct });
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    cancelSpeechChain();
    clearFlashTimer();
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setAnswer('');
      setFlashIdx(0);
      const visual = !canSpeak || useVisual;
      setPhase(visual ? 'flashing' : 'speaking');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, Math.max(1, prev.length));
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Auditory Memory</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2 text-primary tabular-nums">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Rounds correct</p>
        </div>
        <div className="space-y-2 mb-6 text-left">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm font-mono border ${
                r.correct ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'
              }`}
            >
              <div className="text-gray-400">Correct: {r.problem.digits.join(' ')}</div>
              {!r.correct && <div className="text-red-400 mt-1">You: {r.userAnswer || '—'}</div>}
            </div>
          ))}
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

  if (phase === 'feedback' && lastResult) {
    const expected = lastResult.problem.digits.join(' ');
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Auditory Memory</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-400">Correct sequence: {expected}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">You typed: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if ((phase === 'speaking' || phase === 'flashing') && problem) {
    const visual = phase === 'flashing' || !canSpeak;
    const idx = flashIdx;
    const digit = visual && idx < problem.digits.length ? problem.digits[idx] : null;

    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">{visual ? 'Visual' : 'Listen'}</span>
        </div>
        <div className="bg-surface rounded-2xl p-10 border border-gray-700/50 min-h-[160px] flex flex-col items-center justify-center">
          {visual ? (
            <>
              <p className="text-gray-500 text-xs mb-4 uppercase tracking-wide">Memorize</p>
              {digit !== null ? (
                <span className="text-7xl font-bold text-primary tabular-nums">{digit}</span>
              ) : (
                <span className="text-gray-500">Done</span>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-2">Listen to each digit…</p>
              <p className="text-sm text-gray-500 tabular-nums">{problem.digits.length} digits</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'input' && problem) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Your answer</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-gray-700/50">
          <p className="text-gray-400 mb-4">Type the digits in order</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:border-primary text-primary"
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
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Auditory Memory</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">
          {canSpeak
            ? 'Digits are spoken aloud (or switch to visual flash). Type them back from memory.'
            : 'Speech synthesis is not available — digits will flash on screen like Flash Sum.'}
        </p>
        {canSpeak && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useVisual}
              onChange={(e) => setUseVisual(e.target.checked)}
              className="rounded border-gray-600"
            />
            Use visual flash instead of speech
          </label>
        )}
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 12, 15].map((n) => (
              <option key={n} value={n}>
                {n}
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
