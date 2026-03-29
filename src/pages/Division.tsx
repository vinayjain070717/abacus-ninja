import { useState, useRef, useEffect, useCallback } from 'react';
import { generateDivision, type DivisionProblem } from '../utils/problemGenerator';
import { APP_CONFIG, type BrainBenefit } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';

const DIVISION_TYPES = APP_CONFIG.division.types;
import { formatTime } from '../utils/scoring';
import DetailedReport from '../components/shared/DetailedReport';
import type { ReportData } from '../types/report';

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
    const lvlIdx = Math.min(selectedType.dividendDigits, APP_CONFIG.idealTimes.divisionPerProblem.length) - 1;
    const idealPerProblem = APP_CONFIG.idealTimes.divisionPerProblem[lvlIdx];
    const reportData: ReportData = {
      title: 'Division Results',
      subtitle: `${selectedType.dividendDigits}÷${selectedType.divisorDigits} digit · ${results.length} problems`,
      totalTimeSec: seconds,
      sections: [{
        label: 'Division',
        icon: '÷',
        score: results.filter((r) => r.correct).length,
        total: results.length,
        timeSpentSec: seconds,
        idealTimeSec: idealPerProblem * results.length,
        details: results.map((r) => {
          const correctStr = allowRemainder ? `${r.problem.quotient} R${r.problem.remainder}` : String(r.problem.quotient);
          const userStr = r.userQuotient != null
            ? (allowRemainder ? `${r.userQuotient} R${r.userRemainder ?? '—'}` : String(r.userQuotient))
            : '—';
          return {
            display: `${r.problem.display} = ?`,
            correct: r.correct,
            correctAnswer: correctStr,
            userAnswer: userStr,
          };
        }),
      }],
    };
    return (
      <DetailedReport
        data={reportData}
        onPlayAgain={start}
        onSettings={() => setMode('config')}
      />
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
