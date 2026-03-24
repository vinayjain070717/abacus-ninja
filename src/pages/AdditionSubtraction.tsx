import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { generateAddSubProblem, type AddSubProblem } from '../utils/problemGenerator';
import { APP_CONFIG, type BrainBenefit } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';
import { formatTime, calculatePercentage, getGrade } from '../utils/scoring';

type Mode = 'config' | 'flash' | 'static' | 'answer' | 'results';
type OpMode = 'mixed' | 'add' | 'sub';

interface ProblemResult {
  problem: AddSubProblem;
  userAnswer: number | null;
  correct: boolean;
}

export default function AdditionSubtraction() {
  const { settings } = useAppStore();
  const [mode, setMode] = useState<Mode>('config');
  const [practiceMode, setPracticeMode] = useState<'flash' | 'static'>('flash');
  const [digits, setDigits] = useState(2);
  const [rows, setRows] = useState(settings.defaultRows[2] || APP_CONFIG.additionSubtraction.defaultRows[2]);
  const [problems, setProblems] = useState(settings.defaultProblems || 10);
  const [speed, setSpeed] = useState(settings.defaultSpeeds[2] || APP_CONFIG.additionSubtraction.defaultSpeeds[2]);
  const [opMode, setOpMode] = useState<OpMode>('mixed');

  const [allProblems, setAllProblems] = useState<AddSubProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRows(settings.defaultRows[digits] || APP_CONFIG.additionSubtraction.defaultRows[digits]);
    setSpeed(settings.defaultSpeeds[digits] || APP_CONFIG.additionSubtraction.defaultSpeeds[digits]);
  }, [digits, settings]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => () => { stopTimer(); if (flashRef.current) clearTimeout(flashRef.current); }, [stopTimer]);

  const generateProblems = () => {
    return Array.from({ length: problems }, () => {
      const p = generateAddSubProblem({ digits, rowCount: rows });
      if (opMode === 'add') {
        return { ...p, operations: p.operations.map(() => '+' as const), answer: p.numbers.reduce((a, b) => a + b, 0), display: p.numbers.join(' + ') };
      }
      return p;
    });
  };

  const startPractice = () => {
    const ps = generateProblems();
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setSeconds(0);
    setAnswer('');
    startTimer();

    if (practiceMode === 'flash') {
      setMode('flash');
      setFlashIdx(0);
      runFlash(ps[0], 0);
    } else {
      setMode('static');
    }
  };

  const runFlash = (problem: AddSubProblem, startAt: number) => {
    setFlashIdx(startAt);
    const interval = (60 / speed) * 1000;

    let idx = startAt;
    const tick = () => {
      if (idx < problem.numbers.length - 1) {
        idx++;
        setFlashIdx(idx);
        flashRef.current = setTimeout(tick, interval);
      } else {
        setMode('answer');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    flashRef.current = setTimeout(tick, interval);
  };

  const submitAnswer = () => {
    const problem = allProblems[currentIdx];
    const userAns = answer.trim() === '' ? null : parseInt(answer);
    const correct = userAns === problem.answer;
    const newResults = [...results, { problem, userAnswer: userAns, correct }];
    setResults(newResults);
    setAnswer('');

    if (currentIdx + 1 < allProblems.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);

      if (practiceMode === 'flash') {
        setMode('flash');
        setFlashIdx(0);
        runFlash(allProblems[nextIdx], 0);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      stopTimer();
      setMode('results');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitAnswer();
  };

  const correctCount = results.filter((r) => r.correct).length;

  if (mode === 'results') {
    const pct = calculatePercentage(correctCount, results.length);
    const grade = getGrade(pct);
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Results</h2>
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
              <div className="text-right">
                <span className="text-sm font-semibold">
                  = {r.problem.answer}
                </span>
                {!r.correct && (
                  <span className="text-red-400 text-sm ml-3">
                    You: {r.userAnswer ?? '—'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => { setResults([]); startPractice(); }} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">
            New Set
          </button>
          <button onClick={() => setMode('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">
            Change Settings
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'flash') {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-6 text-sm text-gray-400">
          <span>Problem {currentIdx + 1} / {allProblems.length}</span>
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="bg-surface rounded-2xl p-12 min-h-[200px] flex items-center justify-center">
          {flashIdx >= 0 && flashIdx < problem.numbers.length && (
            <div>
              {flashIdx > 0 && (
                <span className="text-3xl text-gray-400 mr-2">
                  {problem.operations[flashIdx - 1] === '+' ? '+' : '−'}
                </span>
              )}
              <span className="text-6xl font-bold text-white tabular-nums">
                {problem.numbers[flashIdx]}
              </span>
            </div>
          )}
        </div>
        <p className="text-gray-500 mt-4 text-sm">
          Number {flashIdx + 1} of {problem.numbers.length}
        </p>
      </div>
    );
  }

  if (mode === 'answer' || mode === 'static') {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-6 text-sm text-gray-400">
          <span>Problem {currentIdx + 1} / {allProblems.length}</span>
          <span>{formatTime(seconds)}</span>
        </div>
        {mode === 'static' && (
          <div className="bg-surface rounded-2xl p-8 mb-6">
            <p className="text-2xl font-mono font-bold tracking-wide">{problem.display}</p>
          </div>
        )}
        {mode === 'answer' && (
          <div className="bg-surface rounded-2xl p-8 mb-6">
            <p className="text-gray-400 text-lg">What is the answer?</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your answer"
            className="w-48 px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
          <button onClick={submitAnswer} className="px-6 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-center">Addition & Subtraction</h1>
        <InfoTooltip benefit={(APP_CONFIG.arithmeticBenefits as Record<string, BrainBenefit>).addition} />
      </div>

      <div className="bg-surface rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Practice Mode</label>
          <div className="flex gap-2">
            {(['flash', 'static'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPracticeMode(m)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  practiceMode === m ? 'bg-primary text-white' : 'bg-surface-light text-gray-400 hover:text-white'
                }`}
              >
                {m === 'flash' ? 'Flash Anzan' : 'Static'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Digits</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setDigits(d)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  digits === d ? 'bg-accent text-white' : 'bg-surface-light text-gray-400 hover:text-white'
                }`}
              >
                {d} Digit
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Operation</label>
          <div className="flex gap-2">
            {([
              ['mixed', 'Mixed'],
              ['add', 'Add Only'],
              ['sub', 'Sub Only'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setOpMode(val as OpMode)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  opMode === val ? 'bg-primary text-white' : 'bg-surface-light text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rows</label>
            <select value={rows} onChange={(e) => setRows(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
              {Array.from({ length: 13 }, (_, i) => i + 3).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Problems</label>
            <select value={problems} onChange={(e) => setProblems(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
              {[5, 10, 15, 20, 25, 30, 40, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          {practiceMode === 'flash' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Speed</label>
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
                {[10, 15, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200].map((n) => (
                  <option key={n} value={n}>{n}/min</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button onClick={startPractice} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark transition-colors">
          Start Practice
        </button>
      </div>
    </div>
  );
}
