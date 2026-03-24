import { useState, useEffect, useRef } from 'react';
import { generateMentalMathChain, type MentalMathStep } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'answer' | 'feedback' | 'results';

const DIFF_PARAMS = {
  easy: { chainLength: 4, maxDigits: 1, speed: 3 },
  medium: { chainLength: 5, maxDigits: 1, speed: 2 },
  hard: { chainLength: 8, maxDigits: 2, speed: 1.5 },
} as const;

export default function MentalMathChain({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
} = {}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [chainLength, setChainLength] = useState<number>(DIFF_PARAMS.medium.chainLength);
  const [maxDigits, setMaxDigits] = useState<number>(DIFF_PARAMS.medium.maxDigits);
  const [speed, setSpeed] = useState<number>(DIFF_PARAMS.medium.speed);

  const [start, setStart] = useState(0);
  const [steps, setSteps] = useState<MentalMathStep[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [lastFeedback, setLastFeedback] = useState<{
    start: number;
    steps: MentalMathStep[];
    correctAnswer: number;
    userAnswer: string;
    correct: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRound = useRef(0);
  const wsScore = useRef(0);
  const maxRounds = worksheetMode?.rounds ?? 1;

  useEffect(() => {
    if (worksheetMode) return;
    const p = DIFF_PARAMS[difficulty];
    setChainLength(p.chainLength);
    setMaxDigits(p.maxDigits);
    setSpeed(p.speed);
  }, [difficulty, worksheetMode]);

  useEffect(() => {
    if (worksheetMode && phase === 'playing' && steps.length === 0) {
      const p = DIFF_PARAMS[effectiveDiff];
      setSpeed(p.speed);
      const chain = generateMentalMathChain(p.chainLength, p.maxDigits);
      setStart(chain.start);
      setSteps(chain.steps);
      setCorrectAnswer(chain.answer);
      setCurrentStep(-1);
    }
  }, [worksheetMode, phase, steps.length, effectiveDiff]);

  const startGame = () => {
    const p = DIFF_PARAMS[effectiveDiff];
    setChainLength(p.chainLength);
    setMaxDigits(p.maxDigits);
    setSpeed(p.speed);
    const chain = generateMentalMathChain(p.chainLength, p.maxDigits);
    setStart(chain.start);
    setSteps(chain.steps);
    setCorrectAnswer(chain.answer);
    setCurrentStep(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setLastFeedback(null);
    wsRound.current = 0;
    wsScore.current = 0;
    setPhase('playing');
  };

  const nextChain = () => {
    const p = worksheetMode ? DIFF_PARAMS[effectiveDiff] : { chainLength, maxDigits };
    const chain = generateMentalMathChain(p.chainLength, p.maxDigits);
    setStart(chain.start);
    setSteps(chain.steps);
    setCorrectAnswer(chain.answer);
    setCurrentStep(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setPhase('playing');
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
    setPhase('results');
  };

  useEffect(() => {
    if (phase !== 'playing' || steps.length === 0) return;
    if (currentStep >= steps.length - 1) {
      setTimeout(() => {
        setPhase('answer');
        setTimeout(() => inputRef.current?.focus(), 100);
      }, speed * 1000);
      return;
    }
    const t = setTimeout(() => setCurrentStep((s) => s + 1), speed * 1000);
    return () => clearTimeout(t);
  }, [phase, currentStep, steps.length, speed]);

  const submit = () => {
    const ans = parseInt(userAnswer);
    const correct = ans === correctAnswer;
    setIsCorrect(correct);
    wsRound.current += 1;
    if (correct) wsScore.current += 1;
    setLastFeedback({ start, steps, correctAnswer, userAnswer, correct });
    setPhase('feedback');
  };

  if (phase === 'feedback' && lastFeedback) {
    return (
      <div className="max-w-md mx-auto text-center">
        {worksheetMode && (
          <p className="text-sm text-gray-400 mb-2">
            Chain {wsRound.current}/{maxRounds}
          </p>
        )}
        <RoundFeedback
          correct={lastFeedback.correct}
          onNext={advanceFromFeedback}
          isLastRound={worksheetMode ? wsRound.current >= maxRounds : true}
        >
          <div className="text-left bg-surface-light rounded-lg p-3 font-mono text-sm space-y-1">
            <div className="text-gray-300">Start: {lastFeedback.start}</div>
            {lastFeedback.steps.map((s, i) => (
              <div key={i} className="text-gray-400">
                {s.operation} {s.value}
              </div>
            ))}
            <div className="border-t border-gray-600 pt-1 font-bold text-gray-200">= {lastFeedback.correctAnswer}</div>
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
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Result</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className={`text-4xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? 'Correct!' : 'Wrong!'}
          </div>
          <div className="text-left bg-surface-light rounded-lg p-4 font-mono text-sm space-y-1">
            <div>Start: {start}</div>
            {steps.map((s, i) => (<div key={i}>{s.operation} {s.value}</div>))}
            <div className="border-t border-gray-600 pt-1 font-bold">= {correctAnswer}</div>
            {!isCorrect && <div className="text-red-400">Your answer: {userAnswer}</div>}
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">Play Again</button>
          <button onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">Settings</button>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && steps.length > 0) {
    return (
      <div className="max-w-md mx-auto text-center">
        {worksheetMode && <p className="text-sm text-gray-400 mb-2">Chain {wsRound.current + 1}/{maxRounds}</p>}
        <h2 className="text-xl font-bold mb-4">Track the total!</h2>
        <div className="bg-surface rounded-2xl p-12">
          {currentStep === -1 ? (
            <span className="text-6xl font-bold">{start}</span>
          ) : (
            <div>
              <span className="text-4xl text-gray-400 mr-2">{steps[currentStep].operation}</span>
              <span className="text-6xl font-bold">{steps[currentStep].value}</span>
            </div>
          )}
        </div>
        <p className="text-gray-400 mt-4">Step {currentStep + 2} of {steps.length + 1}</p>
      </div>
    );
  }

  if (phase === 'answer') {
    return (
      <div className="max-w-md mx-auto text-center">
        {worksheetMode && <p className="text-sm text-gray-400 mb-2">Chain {wsRound.current + 1}/{maxRounds}</p>}
        <h2 className="text-xl font-bold mb-4">What is the final answer?</h2>
        <div className="bg-surface rounded-2xl p-8">
          <input ref={inputRef} type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-48 px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary" autoFocus />
        </div>
        <button onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Mental Math Chain</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Chain length</label>
          <select value={chainLength} onChange={(e) => setChainLength(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {Array.from({ length: 11 }, (_, i) => i + 5).map((n) => (<option key={n} value={n}>{n} steps</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max number</label>
          <div className="flex gap-2">
            <button onClick={() => setMaxDigits(1)} className={`flex-1 py-2 rounded-lg font-semibold ${maxDigits === 1 ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>1-digit</button>
            <button onClick={() => setMaxDigits(2)} className={`flex-1 py-2 rounded-lg font-semibold ${maxDigits === 2 ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>2-digit</button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Speed (sec per step)</label>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[1, 1.5, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n}s</option>))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
