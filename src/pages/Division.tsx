import { useState, useRef, useEffect, useCallback } from 'react';
import { generateDivision, type DivisionProblem } from '../utils/problemGenerator';
import { APP_CONFIG, type BrainBenefit } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';

const DIVISION_TYPES = APP_CONFIG.division.types;
import { formatTime, calculatePercentage, getGrade } from '../utils/scoring';

type Mode = 'config' | 'practice' | 'results';

interface ProblemResult {
  problem: DivisionProblem;
  userQuotient: number | null;
  userRemainder: number | null;
  correct: boolean;
}

export default function Division() {
  const [mode, setMode] = useState<Mode>('config');
  const [selectedType, setSelectedType] = useState({ dividendDigits: 3, divisorDigits: 1 });
  const [questions, setQuestions] = useState(10);
  const [allowRemainder, setAllowRemainder] = useState(false);

  const [allProblems, setAllProblems] = useState<DivisionProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [quotientAns, setQuotientAns] = useState('');
  const [remainderAns, setRemainderAns] = useState('');
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
      generateDivision({
        dividendDigits: selectedType.dividendDigits,
        divisorDigits: selectedType.divisorDigits,
        allowRemainder,
      })
    );
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setSeconds(0);
    setQuotientAns('');
    setRemainderAns('');
    setMode('practice');
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitAnswer = () => {
    const problem = allProblems[currentIdx];
    const uq = quotientAns.trim() === '' ? null : parseInt(quotientAns);
    const ur = remainderAns.trim() === '' ? (allowRemainder ? null : 0) : parseInt(remainderAns);
    const correct = uq === problem.quotient && (!allowRemainder || ur === problem.remainder);
    const newResults = [...results, { problem, userQuotient: uq, userRemainder: ur, correct }];
    setResults(newResults);
    setQuotientAns('');
    setRemainderAns('');

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
        <h2 className="text-2xl font-bold mb-4 text-center">Division Results</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 text-center">
          <div className="text-4xl font-bold mb-2">
            {correctCount}/{results.length}{' '}
            <span className="text-lg text-gray-400">({pct}%)</span>
          </div>
          <div className={`text-lg font-semibold ${grade.color}`}>{grade.label}</div>
          <div className="text-gray-400 mt-2">Time: {formatTime(seconds)}</div>
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
              <div className="text-right text-sm">
                <span className="font-semibold">= {r.problem.quotient}</span>
                {allowRemainder && <span className="text-gray-400"> R{r.problem.remainder}</span>}
                {!r.correct && (
                  <span className="text-red-400 ml-3">
                    You: {r.userQuotient ?? '—'}
                    {allowRemainder && ` R${r.userRemainder ?? '—'}`}
                  </span>
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
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 mb-6">
          <p className="text-2xl font-mono font-bold mb-4">{problem.display} = ?</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Quotient</label>
              <input
                ref={inputRef}
                type="number"
                value={quotientAns}
                onChange={(e) => setQuotientAns(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
            {allowRemainder && (
              <div>
                <label className="text-xs text-gray-400">Remainder</label>
                <input
                  type="number"
                  value={remainderAns}
                  onChange={(e) => setRemainderAns(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
          <button onClick={submitAnswer} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-center">Division</h1>
        <InfoTooltip benefit={(APP_CONFIG.arithmeticBenefits as Record<string, BrainBenefit>).division} />
      </div>
      <div className="bg-surface rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Select Type</label>
          <div className="grid grid-cols-4 gap-2">
            {DIVISION_TYPES.map((t) => (
              <button
                key={t.label}
                onClick={() => setSelectedType({ dividendDigits: t.dividendDigits, divisorDigits: t.divisorDigits })}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  selectedType.dividendDigits === t.dividendDigits && selectedType.divisorDigits === t.divisorDigits
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
            <label className="block text-sm text-gray-400 mb-1">Remainder</label>
            <div className="flex gap-2">
              <button onClick={() => setAllowRemainder(false)} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${!allowRemainder ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>No Remainder</button>
              <button onClick={() => setAllowRemainder(true)} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${allowRemainder ? 'bg-primary text-white' : 'bg-surface-light text-gray-400'}`}>Allow</button>
            </div>
          </div>
        </div>

        <button onClick={start} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark transition-colors">Start</button>
      </div>
    </div>
  );
}
