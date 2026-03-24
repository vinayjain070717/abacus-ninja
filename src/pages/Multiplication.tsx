import { useState, useRef, useEffect, useCallback } from 'react';
import { generateMultiplication, type MultiplyProblem } from '../utils/problemGenerator';
import { APP_CONFIG, type BrainBenefit } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';

const MULTIPLY_TYPES = APP_CONFIG.multiplication.types;
import { formatTime, calculatePercentage, getGrade } from '../utils/scoring';

type Mode = 'config' | 'practice' | 'results';

interface ProblemResult {
  problem: MultiplyProblem;
  userAnswer: number | null;
  correct: boolean;
}

export default function Multiplication() {
  const [mode, setMode] = useState<Mode>('config');
  const [selectedType, setSelectedType] = useState({ d1: 2, d2: 1 });
  const [questions, setQuestions] = useState(10);
  const [timed, setTimed] = useState(true);

  const [allProblems, setAllProblems] = useState<MultiplyProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const start = () => {
    const ps = Array.from({ length: questions }, () =>
      generateMultiplication({ digits1: selectedType.d1, digits2: selectedType.d2 })
    );
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setSeconds(0);
    setAnswer('');
    setMode('practice');

    if (timed) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      stopTimer();
      setMode('results');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitAnswer();
  };

  if (mode === 'results') {
    const correctCount = results.filter((r) => r.correct).length;
    const pct = calculatePercentage(correctCount, results.length);
    const grade = getGrade(pct);
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Multiplication Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 text-center">
          <div className="text-4xl font-bold mb-2">
            {correctCount}/{results.length}{' '}
            <span className="text-lg text-gray-400">({pct}%)</span>
          </div>
          <div className={`text-lg font-semibold ${grade.color}`}>{grade.label}</div>
          {timed && <div className="text-gray-400 mt-2">Time: {formatTime(seconds)}</div>}
        </div>
        <div className="space-y-2 mb-6">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex justify-between items-center p-3 rounded-lg ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <span className="text-sm font-mono">{r.problem.display}</span>
              <div className="text-right">
                <span className="text-sm font-semibold">= {r.problem.answer.toLocaleString()}</span>
                {!r.correct && (
                  <span className="text-red-400 text-sm ml-3">You: {r.userAnswer ?? '—'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={start} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">New Set</button>
          <button onClick={() => setMode('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">Settings</button>
        </div>
      </div>
    );
  }

  if (mode === 'practice') {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-6 text-sm text-gray-400">
          <span>Problem {currentIdx + 1} / {allProblems.length}</span>
          {timed && <span>{formatTime(seconds)}</span>}
        </div>
        <div className="bg-surface rounded-2xl p-8 mb-6">
          <div className="text-right font-mono text-3xl font-bold mb-1">{problem.num1.toLocaleString()}</div>
          <div className="text-right font-mono text-3xl font-bold">× {problem.num2.toLocaleString()}</div>
          <div className="border-t border-gray-600 mt-3 pt-3">
            <div className="flex gap-3 justify-center">
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer"
                className="w-48 px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary"
                autoFocus
              />
              <button onClick={submitAnswer} className="px-6 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-center">Multiplication</h1>
        <InfoTooltip benefit={(APP_CONFIG.arithmeticBenefits as Record<string, BrainBenefit>).multiplication} />
      </div>
      <div className="bg-surface rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Select Type</label>
          <div className="grid grid-cols-4 gap-2">
            {MULTIPLY_TYPES.map((t) => (
              <button
                key={t.label}
                onClick={() => setSelectedType({ d1: t.d1, d2: t.d2 })}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  selectedType.d1 === t.d1 && selectedType.d2 === t.d2
                    ? 'bg-accent text-white'
                    : 'bg-surface-light text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Questions</label>
            <select value={questions} onChange={(e) => setQuestions(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
              {[5, 10, 15, 20, 25, 30, 40, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mode</label>
            <div className="flex gap-2">
              <button onClick={() => setTimed(true)} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${timed ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>Timed</button>
              <button onClick={() => setTimed(false)} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${!timed ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>Untimed</button>
            </div>
          </div>
        </div>

        <button onClick={start} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark transition-colors">Start</button>
      </div>
    </div>
  );
}
