import { useState, useEffect, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { steps: 3, maxMult: 5, speedSec: 2.5 },
  medium: { steps: 5, maxMult: 9, speedSec: 2 },
  hard: { steps: 7, maxMult: 12, speedSec: 1.5 },
} as const;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export interface MultiplyChain {
  start: number;
  factors: number[];
  product: number;
}

export function generateMultiplyChain(steps: number, maxMult: number): MultiplyChain {
  const start = randomInt(2, 5);
  const factors = Array.from({ length: steps }, () => randomInt(2, maxMult));
  const product = factors.reduce((acc, f) => acc * f, start);
  return { start, factors, product };
}

export default function ChainMultiplication({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [steps, setSteps] = useState(DIFF_PARAMS.medium.steps);
  const [maxMult, setMaxMult] = useState(DIFF_PARAMS.medium.maxMult);
  const [speedSec, setSpeedSec] = useState(DIFF_PARAMS.medium.speedSec);
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 6);

  const [chain, setChain] = useState<MultiplyChain | null>(() => {
    if (!worksheetMode) return null;
    const p = DIFF_PARAMS[worksheetMode.difficulty ?? 'medium'];
    return generateMultiplyChain(p.steps, p.maxMult);
  });
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{
    chain: MultiplyChain;
    userAnswer: string;
    correct: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRound = useRef(0);
  const wsScore = useRef(0);
  const maxRounds = worksheetMode?.rounds ?? totalRounds;

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setSteps(p.steps);
    setMaxMult(p.maxMult);
    setSpeedSec(p.speedSec);
  }, [difficulty, worksheetMode]);

  const armChain = (c: MultiplyChain) => {
    setChain(c);
    setCurrentStep(-1);
    setShowAnswer(false);
    setUserAnswer('');
    setLastFeedback(null);
  };

  const nextChain = () => {
    const p = worksheetMode ? DIFF_PARAMS[effectiveDiff] : { steps, maxMult };
    armChain(generateMultiplyChain(p.steps, p.maxMult));
    setPhase('playing');
  };

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setSteps(p.steps);
    setMaxMult(p.maxMult);
    setSpeedSec(p.speedSec);
    wsRound.current = 0;
    wsScore.current = 0;
    setRoundIndex(0);
    setScore(0);
    armChain(generateMultiplyChain(p.steps, p.maxMult));
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing' || !chain || chain.factors.length === 0 || showAnswer) return;

    const last = chain.factors.length - 1;
    if (currentStep >= last) {
      const t = window.setTimeout(() => {
        setShowAnswer(true);
        window.setTimeout(() => inputRef.current?.focus(), 80);
      }, speedSec * 1000);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCurrentStep((s) => s + 1), speedSec * 1000);
    return () => window.clearTimeout(t);
  }, [phase, currentStep, chain, speedSec, showAnswer]);

  const submit = () => {
    if (!chain || !showAnswer) return;
    const n = userAnswer.trim() === '' ? NaN : Number(userAnswer);
    const correct = n === chain.product;
    if (!worksheetMode) setScore((s) => s + (correct ? 1 : 0));
    wsRound.current += 1;
    if (correct) wsScore.current += 1;
    setLastFeedback({ chain, userAnswer, correct });
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastFeedback(null);
    if (worksheetMode) {
      if (wsRound.current >= maxRounds) {
        onComplete?.(wsScore.current, maxRounds);
        return;
      }
      nextChain();
      return;
    }
    if (roundIndex + 1 < totalRounds) {
      setRoundIndex((r) => r + 1);
      const p = { steps, maxMult };
      armChain(generateMultiplyChain(p.steps, p.maxMult));
      setPhase('playing');
    } else {
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastFeedback) {
    const { chain: ch } = lastFeedback;
    const isLast = worksheetMode ? wsRound.current >= maxRounds : roundIndex + 1 >= totalRounds;
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        {worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Round {wsRound.current}/{maxRounds}
          </p>
        )}
        {!worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Round {roundIndex + 1}/{totalRounds} · Score {score}
          </p>
        )}
        <RoundFeedback correct={lastFeedback.correct} onNext={advanceFromFeedback} isLastRound={isLast}>
          <div className="text-left bg-surface-light rounded-lg p-3 font-mono text-sm space-y-1">
            <div className="text-gray-300">Start: {ch.start}</div>
            {ch.factors.map((f, i) => (
              <div key={i} className="text-gray-400">
                × {f}
              </div>
            ))}
            <div className="border-t border-gray-600 pt-1 font-bold text-gray-200">= {ch.product}</div>
          </div>
          {!lastFeedback.correct && (
            <p className="text-red-400 font-mono mt-2">Your answer: {lastFeedback.userAnswer}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        <h2 className="text-2xl font-bold mb-4">Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2 text-accent">
            {score}/{totalRounds}
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={() => setPhase('config')}
            className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600"
          >
            Settings
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && chain && !showAnswer) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        {!worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Round {roundIndex + 1}/{totalRounds} · Score {score}
          </p>
        )}
        {worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Round {wsRound.current + 1}/{maxRounds}
          </p>
        )}
        <h2 className="text-xl font-bold mb-4">Multiply step by step</h2>
        <div className="bg-surface rounded-2xl p-12">
          {currentStep === -1 ? (
            <span className="text-6xl font-bold">{chain.start}</span>
          ) : (
            <div>
              <span className="text-4xl text-gray-400 mr-2">×</span>
              <span className="text-6xl font-bold">{chain.factors[currentStep]}</span>
            </div>
          )}
        </div>
        <p className="text-gray-400 mt-4">
          Step {currentStep + 2} of {chain.factors.length + 1}
        </p>
      </div>
    );
  }

  if (phase === 'playing' && chain && showAnswer) {
    return (
      <div className="max-w-md mx-auto text-center text-primary">
        {!worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Round {roundIndex + 1}/{totalRounds} · Score {score}
          </p>
        )}
        {worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Round {wsRound.current + 1}/{maxRounds}
          </p>
        )}
        <h2 className="text-xl font-bold mb-4">Final product?</h2>
        <div className="bg-surface rounded-2xl p-8">
          <input
            ref={inputRef}
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-48 px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Chain multiplication</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">
          Start with a small number, then multiply by each factor shown. Enter the final product.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[4, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Steps (factors)</label>
          <select
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max multiplier</label>
          <select
            value={maxMult}
            onChange={(e) => setMaxMult(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Seconds per step</label>
          <select
            value={speedSec}
            onChange={(e) => setSpeedSec(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[1, 1.5, 2, 2.5, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}s
              </option>
            ))}
          </select>
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
