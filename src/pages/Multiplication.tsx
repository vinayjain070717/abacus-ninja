import { useState, useRef, useEffect, useCallback } from 'react';
import { generateMultiplication, type MultiplyProblem } from '../utils/problemGenerator';
import { APP_CONFIG, type BrainBenefit } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';

const MULTIPLY_TYPES = APP_CONFIG.multiplication.types;
import { formatTime } from '../utils/scoring';
import DetailedReport from '../components/shared/DetailedReport';
import type { ReportData } from '../types/report';

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
    const lvlIdx = Math.min(Math.max(selectedType.d1, selectedType.d2), APP_CONFIG.idealTimes.multiplyPerProblem.length) - 1;
    const idealPerProblem = APP_CONFIG.idealTimes.multiplyPerProblem[lvlIdx];
    const reportData: ReportData = {
      title: 'Multiplication Results',
      subtitle: `${selectedType.d1}×${selectedType.d2} digit · ${results.length} problems${timed ? '' : ' (untimed)'}`,
      totalTimeSec: seconds,
      sections: [{
        label: 'Multiplication',
        icon: '×',
        score: results.filter((r) => r.correct).length,
        total: results.length,
        timeSpentSec: seconds,
        idealTimeSec: timed ? idealPerProblem * results.length : 0,
        details: results.map((r) => ({
          display: `${r.problem.display} = ?`,
          correct: r.correct,
          correctAnswer: r.problem.answer.toLocaleString(),
          userAnswer: r.userAnswer != null ? String(r.userAnswer) : '—',
        })),
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
