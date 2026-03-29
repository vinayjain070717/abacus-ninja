import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { APP_CONFIG, BRAIN_GAME_IDS, getBrainGameLabel, type BrainGameConfig, type GameCategory } from '../config/appConfig';
import { generateAddSubMixed, generateMultiplication, generateDivision, generateMemorySequence } from '../utils/problemGenerator';
import type { AddSubProblem, MultiplyProblem, DivisionProblem } from '../utils/problemGenerator';
import DetailedReport from '../components/shared/DetailedReport';
import type { ReportData } from '../types/report';

import SpeedGrid from '../components/memorization/SpeedGrid';
import MentalMathChain from '../components/memorization/MentalMathChain';
import MiniSudoku from '../components/memorization/MiniSudoku';
import MissingOperator from '../components/memorization/MissingOperator';
import TwentyFourGame from '../components/memorization/TwentyFourGame';
import FlashSum from '../components/memorization/FlashSum';
import GreaterLessEqual from '../components/memorization/GreaterLessEqual';
import NumberSequence from '../components/memorization/NumberSequence';
import NumberPairMatch from '../components/memorization/NumberPairMatch';
import NumberSorting from '../components/memorization/NumberSorting';

const RunningTotal = lazy(() => import('../components/memorization/RunningTotal'));
const EstimationStation = lazy(() => import('../components/memorization/EstimationStation'));
const PercentageSnap = lazy(() => import('../components/memorization/PercentageSnap'));
const FractionToDecimal = lazy(() => import('../components/memorization/FractionToDecimal'));
const DoubleHalveChain = lazy(() => import('../components/memorization/DoubleHalveChain'));
const TimesTableSprint = lazy(() => import('../components/memorization/TimesTableSprint'));
const DigitSpanOperation = lazy(() => import('../components/memorization/DigitSpanOperation'));
const NBackNumbers = lazy(() => import('../components/memorization/NBackNumbers'));
const WhatChanged = lazy(() => import('../components/memorization/WhatChanged'));
const MagicSquare = lazy(() => import('../components/memorization/MagicSquare'));
const NumberCrossword = lazy(() => import('../components/memorization/NumberCrossword'));
const OddOneOut = lazy(() => import('../components/memorization/OddOneOut'));
const BaseConversion = lazy(() => import('../components/memorization/BaseConversion'));
const KenKenPuzzle = lazy(() => import('../components/memorization/KenKenPuzzle'));
const PrimeOrNot = lazy(() => import('../components/memorization/PrimeOrNot'));
const CountdownNumbers = lazy(() => import('../components/memorization/CountdownNumbers'));
const NumberBingo = lazy(() => import('../components/memorization/NumberBingo'));
const ClosestTo100 = lazy(() => import('../components/memorization/ClosestTo100'));
const ComplementTo100 = lazy(() => import('../components/memorization/ComplementTo100'));
const SquareRootSprint = lazy(() => import('../components/memorization/SquareRootSprint'));
const SpeedFactoring = lazy(() => import('../components/memorization/SpeedFactoring'));
const VedicMathDrills = lazy(() => import('../components/memorization/VedicMathDrills'));
const PercentageChange = lazy(() => import('../components/memorization/PercentageChange'));
const GcdLcmSprint = lazy(() => import('../components/memorization/GcdLcmSprint'));
const DigitSumChain = lazy(() => import('../components/memorization/DigitSumChain'));
const PowersOf2 = lazy(() => import('../components/memorization/PowersOf2'));
const DualNBack = lazy(() => import('../components/memorization/DualNBack'));
const AuditoryMemory = lazy(() => import('../components/memorization/AuditoryMemory'));
const CalendarCalculation = lazy(() => import('../components/memorization/CalendarCalculation'));
const RomanNumerals = lazy(() => import('../components/memorization/RomanNumerals'));
const NumberAnagram = lazy(() => import('../components/memorization/NumberAnagram'));
const MatrixPattern = lazy(() => import('../components/memorization/MatrixPattern'));
const MentalDivisionRace = lazy(() => import('../components/memorization/MentalDivisionRace'));
const NumberBondSnap = lazy(() => import('../components/memorization/NumberBondSnap'));
const OrderOfOperations = lazy(() => import('../components/memorization/OrderOfOperations'));
const EquationBuilder = lazy(() => import('../components/memorization/EquationBuilder'));
const UnitConversion = lazy(() => import('../components/memorization/UnitConversion'));
const FibonacciSprint = lazy(() => import('../components/memorization/FibonacciSprint'));
const TaxTipCalculator = lazy(() => import('../components/memorization/TaxTipCalculator'));
const ClockAngle = lazy(() => import('../components/memorization/ClockAngle'));
const ProbabilitySnap = lazy(() => import('../components/memorization/ProbabilitySnap'));
const BinaryArithmetic = lazy(() => import('../components/memorization/BinaryArithmetic'));
const ColorNumberStroop = lazy(() => import('../components/memorization/ColorNumberStroop'));
const SpatialMemoryGrid = lazy(() => import('../components/memorization/SpatialMemoryGrid'));
const BackwardsCounting = lazy(() => import('../components/memorization/BackwardsCounting'));
const MemoryPalaceNumbers = lazy(() => import('../components/memorization/MemoryPalaceNumbers'));
const RapidOddEven = lazy(() => import('../components/memorization/RapidOddEven'));
const GreaterThanChain = lazy(() => import('../components/memorization/GreaterThanChain'));
const ArithmeticFlashcards = lazy(() => import('../components/memorization/ArithmeticFlashcards'));
const DigitReactionTime = lazy(() => import('../components/memorization/DigitReactionTime'));
const MissingDigit = lazy(() => import('../components/memorization/MissingDigit'));
const ChainMultiplication = lazy(() => import('../components/memorization/ChainMultiplication'));

type Section =
  | { kind: 'add'; title: string; problems: { display: string; correctAnswer: number }[] }
  | { kind: 'multiply'; title: string; problems: { display: string; correctAnswer: number }[] }
  | { kind: 'divide'; title: string; problems: { display: string; correctAnswer: number }[] }
  | { kind: 'game'; title: string; gameId: string; rounds: number };

const defaultCount = () => APP_CONFIG.customWorksheet.defaultProblemsPerType;
const LS_KEY = 'abacus_custom_config';

interface SavedConfig {
  level: number;
  useAdd: boolean; useMul: boolean; useDiv: boolean;
  addCount: number; mulCount: number; divCount: number;
  gamePick: Record<string, boolean>;
  gameCounts: Record<string, number>;
}

function loadSavedConfig(): SavedConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as SavedConfig;
  } catch { /* corrupted */ }
  return null;
}

const PRESETS = {
  quick: { label: 'Quick (5 min)', addCount: 5, mulCount: 0, divCount: 0, useAdd: true, useMul: false, useDiv: false, gameCount: 2 },
  standard: { label: 'Standard (15 min)', addCount: 10, mulCount: 5, divCount: 5, useAdd: true, useMul: true, useDiv: true, gameCount: 4 },
  full: { label: 'Full (30 min)', addCount: 15, mulCount: 10, divCount: 10, useAdd: true, useMul: true, useDiv: true, gameCount: 8 },
} as const;

const GAME_CATEGORIES: GameCategory[] = ['memory', 'mental-arithmetic', 'logic', 'speed'];

function getGamesByCategory(): Record<GameCategory, string[]> {
  const result = { memory: [] as string[], 'mental-arithmetic': [] as string[], logic: [] as string[], speed: [] as string[] };
  for (const id of BRAIN_GAME_IDS) {
    const cfg = (APP_CONFIG.brainGames as Record<string, BrainGameConfig>)[id];
    if (cfg) result[cfg.category].push(id);
  }
  return result;
}

export default function CustomWorksheet() {
  const saved = useRef(loadSavedConfig());
  const [phase, setPhase] = useState<'setup' | 'run' | 'results'>('setup');
  const [level, setLevel] = useState(saved.current?.level ?? 5);
  const [useAdd, setUseAdd] = useState(saved.current?.useAdd ?? false);
  const [useMul, setUseMul] = useState(saved.current?.useMul ?? false);
  const [useDiv, setUseDiv] = useState(saved.current?.useDiv ?? false);
  const [addCount, setAddCount] = useState<number>(saved.current?.addCount ?? defaultCount());
  const [mulCount, setMulCount] = useState<number>(saved.current?.mulCount ?? defaultCount());
  const [divCount, setDivCount] = useState<number>(saved.current?.divCount ?? defaultCount());
  const [gamePick, setGamePick] = useState<Record<string, boolean>>(() =>
    saved.current?.gamePick ?? Object.fromEntries(BRAIN_GAME_IDS.map((id) => [id, false]))
  );
  const [gameCounts, setGameCounts] = useState<Record<string, number>>(() =>
    saved.current?.gameCounts ?? Object.fromEntries(BRAIN_GAME_IDS.map((id) => [id, defaultCount()]))
  );
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [sectionResults, setSectionResults] = useState<{ title: string; score: number; total: number; timeSec: number }[]>([]);
  const startTimeRef = useRef(Date.now());
  const sectionStartRef = useRef(Date.now());
  const gamesByCategory = useRef(getGamesByCategory());

  const totalSelected = (): number => {
    let t = 0;
    if (useAdd) t += Math.max(0, addCount);
    if (useMul) t += Math.max(0, mulCount);
    if (useDiv) t += Math.max(0, divCount);
    for (const id of BRAIN_GAME_IDS) {
      if (gamePick[id]) t += Math.max(0, gameCounts[id] || 0);
    }
    return t;
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    const p = PRESETS[preset];
    setUseAdd(p.useAdd); setUseMul(p.useMul); setUseDiv(p.useDiv);
    setAddCount(p.addCount); setMulCount(p.mulCount); setDivCount(p.divCount);
    const newPick: Record<string, boolean> = {};
    const newCounts: Record<string, number> = {};
    const shuffled = [...BRAIN_GAME_IDS].sort(() => Math.random() - 0.5);
    for (const id of BRAIN_GAME_IDS) {
      newPick[id] = shuffled.indexOf(id) < p.gameCount;
      newCounts[id] = defaultCount();
    }
    setGamePick(newPick);
    setGameCounts(newCounts);
  };

  const resetConfig = () => {
    setLevel(5); setUseAdd(false); setUseMul(false); setUseDiv(false);
    setAddCount(defaultCount()); setMulCount(defaultCount()); setDivCount(defaultCount());
    setGamePick(Object.fromEntries(BRAIN_GAME_IDS.map((id) => [id, false])));
    setGameCounts(Object.fromEntries(BRAIN_GAME_IDS.map((id) => [id, defaultCount()])));
    localStorage.removeItem(LS_KEY);
  };

  const toggleCategory = (cat: GameCategory, on: boolean) => {
    const ids = gamesByCategory.current[cat];
    setGamePick((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = on;
      return next;
    });
  };

  const generate = () => {
    const max = APP_CONFIG.customWorksheet.maxTotalProblems;
    const t = totalSelected();
    if (t === 0) return;
    if (t > max) {
      alert(`Total problems (${t}) exceeds limit (${max}).`);
      return;
    }

    localStorage.setItem(LS_KEY, JSON.stringify({
      level, useAdd, useMul, useDiv, addCount, mulCount, divCount, gamePick, gameCounts,
    } as SavedConfig));

    const cfg = APP_CONFIG.levels[Math.min(level, APP_CONFIG.worksheet.maxLevel) - 1];
    const next: Section[] = [];

    if (useAdd && addCount > 0) {
      const problems: AddSubProblem[] = Array.from({ length: addCount }, () =>
        generateAddSubMixed({
          minDigits: cfg.addSub.minDigits,
          maxDigits: cfg.addSub.maxDigits,
          minNumbers: cfg.addSub.minNumbers,
          maxNumbers: cfg.addSub.maxNumbers,
        })
      );
      next.push({
        kind: 'add',
        title: 'Addition / Subtraction',
        problems: problems.map((p) => ({ display: p.display, correctAnswer: p.answer })),
      });
    }
    if (useMul && mulCount > 0) {
      const problems: MultiplyProblem[] = Array.from({ length: mulCount }, () => {
        const spec = cfg.multiply[Math.floor(Math.random() * cfg.multiply.length)];
        return generateMultiplication({ digits1: spec.d1, digits2: spec.d2 });
      });
      next.push({
        kind: 'multiply',
        title: 'Multiplication',
        problems: problems.map((p) => ({ display: p.display, correctAnswer: p.answer })),
      });
    }
    if (useDiv && divCount > 0) {
      const problems: DivisionProblem[] = Array.from({ length: divCount }, () => {
        const spec = cfg.divide[Math.floor(Math.random() * cfg.divide.length)];
        return generateDivision({
          dividendDigits: spec.dividendDigits,
          divisorDigits: spec.divisorDigits,
          allowRemainder: APP_CONFIG.division.allowRemainder,
        });
      });
      next.push({
        kind: 'divide',
        title: 'Division',
        problems: problems.map((p) => ({ display: p.display, correctAnswer: p.quotient })),
      });
    }

    for (const id of BRAIN_GAME_IDS) {
      if (gamePick[id] && (gameCounts[id] || 0) > 0) {
        const rounds = Math.max(1, gameCounts[id] || defaultCount());
        next.push({
          kind: 'game',
          title: getBrainGameLabel(id),
          gameId: id,
          rounds,
        });
      }
    }

    setSections(next);
    setSectionIdx(0);
    setSectionResults([]);
    startTimeRef.current = Date.now();
    sectionStartRef.current = Date.now();
    setPhase('run');
    const first = next[0];
    if (first && (first.kind === 'add' || first.kind === 'multiply' || first.kind === 'divide')) {
      setAnswers(Array(first.problems.length).fill(''));
    } else {
      setAnswers([]);
    }
  };

  const current = sections[sectionIdx];

  const advanceSection = () => {
    const nextIdx = sectionIdx + 1;
    sectionStartRef.current = Date.now();
    if (nextIdx >= sections.length) {
      setPhase('results');
    } else {
      setSectionIdx(nextIdx);
      const n = sections[nextIdx];
      if (n && (n.kind === 'add' || n.kind === 'multiply' || n.kind === 'divide')) {
        setAnswers(Array(n.problems.length).fill(''));
      } else {
        setAnswers([]);
      }
    }
  };

  const finishArithmetic = (title: string, problems: { display: string; correctAnswer: number }[], ans: string[]) => {
    let score = 0;
    problems.forEach((p, i) => {
      if (parseInt(ans[i], 10) === p.correctAnswer) score++;
    });
    const timeSec = Math.round((Date.now() - sectionStartRef.current) / 1000);
    setSectionResults((r) => [...r, { title, score, total: problems.length, timeSec }]);
    advanceSection();
  };

  const finishGame = (title: string, score: number, total: number) => {
    const timeSec = Math.round((Date.now() - sectionStartRef.current) / 1000);
    setSectionResults((r) => [...r, { title, score, total, timeSec }]);
    advanceSection();
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center">Custom Worksheet</h1>
        <p className="text-gray-400 text-sm text-center mb-4">
          Choose sections and counts (max {APP_CONFIG.customWorksheet.maxTotalProblems} total).
        </p>

        {/* Preset buttons */}
        <div className="flex gap-2 justify-center mb-6">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="px-4 py-2 bg-surface-light rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-600 hover:text-white transition-colors border border-gray-700"
            >
              {PRESETS[key].label}
            </button>
          ))}
          <button
            type="button"
            onClick={resetConfig}
            className="px-4 py-2 bg-red-900/30 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/50 transition-colors border border-red-700/30"
          >
            Reset
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Level (difficulty)</label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: APP_CONFIG.worksheet.maxLevel }, (_, i) => i + 1).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`w-10 h-10 rounded-lg font-bold ${
                  level === l ? 'bg-accent text-white' : 'bg-surface-light text-gray-300 hover:bg-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 bg-surface rounded-xl border border-gray-700 p-4">
          {(
            [
              ['add', useAdd, setUseAdd, addCount, setAddCount, 'Addition / Subtraction'],
              ['mul', useMul, setUseMul, mulCount, setMulCount, 'Multiplication'],
              ['div', useDiv, setUseDiv, divCount, setDivCount, 'Division'],
            ] as const
          ).map(([key, on, setOn, cnt, setCnt, label]) => (
            <div key={key} className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 min-w-[200px]">
                <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
                <span className="font-medium">{label}</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Count
                <input
                  type="number"
                  min={1}
                  max={50}
                  disabled={!on}
                  value={cnt}
                  onChange={(e) => setCnt(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-2 py-1 rounded bg-surface-light border border-gray-600 disabled:opacity-40"
                />
              </label>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold mt-6 mb-2">Brain Games</h2>
        <div className="space-y-2">
          {GAME_CATEGORIES.map((cat) => {
            const ids = gamesByCategory.current[cat];
            const catLabel = APP_CONFIG.gameCategories[cat].label;
            const isCollapsed = collapsedCats[cat] ?? false;
            const selectedCount = ids.filter((id) => gamePick[id]).length;
            const allSelected = ids.every((id) => gamePick[id]);
            return (
              <div key={cat} className="bg-surface rounded-xl border border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCollapsedCats((c) => ({ ...c, [cat]: !isCollapsed }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-gray-500 transition-transform duration-200 text-xs ${isCollapsed ? '' : 'rotate-90'}`}>&#9654;</span>
                    <span className="font-semibold text-sm">{catLabel}</span>
                    <span className="text-xs text-gray-500">({selectedCount}/{ids.length})</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-400" onClick={(e) => e.stopPropagation()}>
                    All
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleCategory(cat, e.target.checked)}
                    />
                  </label>
                </button>
                {!isCollapsed && (
                  <div className="border-t border-gray-700 px-3 py-2 space-y-1 max-h-40 overflow-y-auto">
                    {ids.map((id) => (
                      <div key={id} className="flex flex-wrap items-center gap-2 text-sm">
                        <label className="flex items-center gap-2 flex-1 min-w-[180px]">
                          <input
                            type="checkbox"
                            checked={gamePick[id]}
                            onChange={(e) => setGamePick((p) => ({ ...p, [id]: e.target.checked }))}
                          />
                          <span className="text-gray-300">{getBrainGameLabel(id)}</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          disabled={!gamePick[id]}
                          value={gameCounts[id]}
                          onChange={(e) =>
                            setGameCounts((c) => ({ ...c, [id]: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                          }
                          className="w-16 px-2 py-1 rounded bg-surface-light border border-gray-600 disabled:opacity-40 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">Selected total: {totalSelected()}</div>
        <button
          type="button"
          onClick={generate}
          className="mt-4 w-full py-3 bg-primary rounded-xl font-bold text-lg hover:bg-primary/90"
        >
          Generate & start
        </button>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const iconMap: Record<string, string> = { 'Addition / Subtraction': '±', Multiplication: '×', Division: '÷' };
    const reportData: ReportData = {
      title: 'Custom Worksheet',
      subtitle: `Level ${level}`,
      totalTimeSec,
      sections: sectionResults.map((s) => {
        const idealPerProblem = s.title.includes('Addition') ? (APP_CONFIG.idealTimes.addSubPerProblem[Math.min(level, 10) - 1] ?? 5)
          : s.title.includes('Multiplication') ? (APP_CONFIG.idealTimes.multiplyPerProblem[Math.min(level, 10) - 1] ?? 7)
          : s.title.includes('Division') ? (APP_CONFIG.idealTimes.divisionPerProblem[Math.min(level, 10) - 1] ?? 7)
          : (APP_CONFIG.idealTimes.brainGamePerRound['medium'] ?? 12);
        return {
          label: s.title,
          icon: iconMap[s.title] ?? '🧠',
          score: s.score,
          total: s.total,
          timeSpentSec: s.timeSec,
          idealTimeSec: s.total * idealPerProblem,
          details: [],
        };
      }),
    };

    return (
      <DetailedReport
        data={reportData}
        onPlayAgain={() => { setPhase('setup'); setSectionResults([]); }}
        onPrint={() => window.print()}
        gameId="custom-worksheet"
      />
    );
  }

  if (!current) return null;

  if (current.kind === 'add' || current.kind === 'multiply' || current.kind === 'divide') {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-gray-400 mb-2">
          Section {sectionIdx + 1}/{sections.length}: {current.title}
        </p>
        <WorksheetProblems
          title={current.title}
          problems={current.problems}
          answers={answers}
          onAnswer={(i, v) => {
            const a = [...answers];
            a[i] = v;
            setAnswers(a);
          }}
          onNext={() => finishArithmetic(current.title, current.problems, answers)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <p className="text-sm text-gray-400 mb-2">
        Section {sectionIdx + 1}/{sections.length}: {current.title}
      </p>
      <Suspense fallback={<div className="text-center text-gray-400 py-8">Loading game…</div>}>
        <CustomGameDispatcher
          gameType={current.gameId}
          rounds={current.rounds}
          onComplete={(score, total) => finishGame(current.title, score, total)}
        />
      </Suspense>
    </div>
  );
}

function WorksheetProblems({
  title,
  problems,
  answers,
  onAnswer,
  onNext,
}: {
  title: string;
  problems: { display: string; correctAnswer: number }[];
  answers: string[];
  onAnswer: (i: number, v: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-2 mb-6">
        {problems.map((p, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface rounded-lg p-3 border border-gray-700">
            <span className="text-gray-500 text-sm w-8 text-right">{i + 1}.</span>
            <span className="flex-1 font-mono text-sm">{p.display} =</span>
            <input
              type="number"
              value={answers[i] ?? ''}
              onChange={(e) => onAnswer(i, e.target.value)}
              className="w-32 px-3 py-2 bg-surface-light border border-gray-600 rounded-lg text-center font-mono focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={onNext} className="w-full py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
        Next section →
      </button>
    </>
  );
}

/** Shared by {@link TimedChallenge} for worksheet-style brain games. */
export function CustomGameDispatcher({
  gameType,
  rounds,
  onComplete,
}: {
  gameType: string;
  rounds: number;
  onComplete: (score: number, total: number) => void;
}) {
  const worksheetMode = { rounds };

  switch (gameType) {
    case 'number-memory':
      return <WsNumberMemory rounds={rounds} onComplete={onComplete} />;
    case 'reverse-memory':
      return <WsReverseMemory rounds={rounds} onComplete={onComplete} />;
    case 'speed-grid':
      return <SpeedGrid worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'mental-math-chain':
      return <MentalMathChain worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'mini-sudoku':
      return <MiniSudoku worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'missing-operator':
      return <MissingOperator worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'twenty-four-game':
      return <TwentyFourGame worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'flash-sum':
      return <FlashSum worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'greater-less-equal':
      return <GreaterLessEqual worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-sequence':
      return <NumberSequence worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-pair-match':
      return <NumberPairMatch worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-sorting':
      return <NumberSorting worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'running-total':
      return <RunningTotal worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'estimation-station':
      return <EstimationStation worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'percentage-snap':
      return <PercentageSnap worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'fraction-to-decimal':
      return <FractionToDecimal worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'double-halve-chain':
      return <DoubleHalveChain worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'times-table-sprint':
      return <TimesTableSprint worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'digit-span-operation':
      return <DigitSpanOperation worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'n-back-numbers':
      return <NBackNumbers worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'what-changed':
      return <WhatChanged worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'magic-square':
      return <MagicSquare worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-crossword':
      return <NumberCrossword worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'odd-one-out':
      return <OddOneOut worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'base-conversion':
      return <BaseConversion worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'kenken-puzzle':
      return <KenKenPuzzle worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'prime-or-not':
      return <PrimeOrNot worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'countdown-numbers':
      return <CountdownNumbers worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-bingo':
      return <NumberBingo worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'closest-to-100':
      return <ClosestTo100 worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'complement-to-100':
      return <ComplementTo100 worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'square-root-sprint':
      return <SquareRootSprint worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'speed-factoring':
      return <SpeedFactoring worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'vedic-math-drills':
      return <VedicMathDrills worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'percentage-change':
      return <PercentageChange worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'gcd-lcm-sprint':
      return <GcdLcmSprint worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'digit-sum-chain':
      return <DigitSumChain worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'powers-of-2':
      return <PowersOf2 worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'dual-n-back':
      return <DualNBack worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'auditory-memory':
      return <AuditoryMemory worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'calendar-calculation':
      return <CalendarCalculation worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'roman-numerals':
      return <RomanNumerals worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-anagram':
      return <NumberAnagram worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'matrix-pattern':
      return <MatrixPattern worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'mental-division-race':
      return <MentalDivisionRace worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'number-bond-snap':
      return <NumberBondSnap worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'order-of-operations':
      return <OrderOfOperations worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'equation-builder':
      return <EquationBuilder worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'unit-conversion':
      return <UnitConversion worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'fibonacci-sprint':
      return <FibonacciSprint worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'tax-tip-calculator':
      return <TaxTipCalculator worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'clock-angle':
      return <ClockAngle worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'probability-snap':
      return <ProbabilitySnap worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'binary-arithmetic':
      return <BinaryArithmetic worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'color-number-stroop':
      return <ColorNumberStroop worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'spatial-memory-grid':
      return <SpatialMemoryGrid worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'backwards-counting':
      return <BackwardsCounting worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'memory-palace-numbers':
      return <MemoryPalaceNumbers worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'rapid-odd-even':
      return <RapidOddEven worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'greater-than-chain':
      return <GreaterThanChain worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'arithmetic-flashcards':
      return <ArithmeticFlashcards worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'digit-reaction-time':
      return <DigitReactionTime worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'missing-digit':
      return <MissingDigit worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'chain-multiplication':
      return <ChainMultiplication worksheetMode={worksheetMode} onComplete={onComplete} />;
    default:
      return (
        <div className="text-center text-gray-400 py-8 border border-dashed border-gray-600 rounded-xl">
          <p>“{gameType}” is not available in custom worksheet mode yet.</p>
          <p className="text-sm mt-2">Uncheck it or pick another game.</p>
        </div>
      );
  }
}

function WsNumberMemory({ rounds, onComplete }: { rounds: number; onComplete: (score: number, total: number) => void }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalMax, setTotalMax] = useState(0);
  const [sequence, setSequence] = useState(() => generateMemorySequence(7));
  const [memPhase, setMemPhase] = useState<'show' | 'input'>('show');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (memPhase === 'show') {
      const t = setTimeout(() => setMemPhase('input'), 4000);
      return () => clearTimeout(t);
    }
  }, [memPhase, currentRound]);

  const submit = () => {
    const userDigits = userInput.split('').map(Number);
    let correct = 0;
    for (let i = 0; i < sequence.length; i++) {
      if (userDigits[i] === sequence[i]) correct++;
    }
    const newScore = totalScore + correct;
    const newMax = totalMax + sequence.length;

    if (currentRound + 1 >= rounds) {
      onComplete(newScore, newMax);
    } else {
      setTotalScore(newScore);
      setTotalMax(newMax);
      setCurrentRound(currentRound + 1);
      setSequence(generateMemorySequence(7));
      setUserInput('');
      setMemPhase('show');
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 mb-3">Round {currentRound + 1}/{rounds}</p>
      {memPhase === 'show' ? (
        <div className="bg-surface rounded-2xl p-8 border border-gray-700">
          <p className="text-gray-400 mb-4">Memorize</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {sequence.map((n, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center bg-primary rounded-lg text-2xl font-bold">
                {n}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 border border-gray-700">
          <p className="text-gray-400 mb-4">Type the digits in order</p>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={7}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary"
            autoFocus
          />
          <button type="button" onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

function WsReverseMemory({ rounds, onComplete }: { rounds: number; onComplete: (score: number, total: number) => void }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalMax, setTotalMax] = useState(0);
  const [sequence, setSequence] = useState(() => generateMemorySequence(6));
  const [memPhase, setMemPhase] = useState<'show' | 'input'>('show');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (memPhase === 'show') {
      const t = setTimeout(() => setMemPhase('input'), 4000);
      return () => clearTimeout(t);
    }
  }, [memPhase, currentRound]);

  const submit = () => {
    const reversed = [...sequence].reverse();
    const userDigits = userInput.split('').map(Number);
    let correct = 0;
    for (let i = 0; i < reversed.length; i++) {
      if (userDigits[i] === reversed[i]) correct++;
    }
    const newScore = totalScore + correct;
    const newMax = totalMax + sequence.length;

    if (currentRound + 1 >= rounds) {
      onComplete(newScore, newMax);
    } else {
      setTotalScore(newScore);
      setTotalMax(newMax);
      setCurrentRound(currentRound + 1);
      setSequence(generateMemorySequence(6));
      setUserInput('');
      setMemPhase('show');
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 mb-3">Round {currentRound + 1}/{rounds} — reverse order</p>
      {memPhase === 'show' ? (
        <div className="bg-surface rounded-2xl p-8 border border-gray-700">
          <p className="text-gray-400 mb-4">Memorize (you will type reversed)</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {sequence.map((n, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center bg-purple-700 rounded-lg text-2xl font-bold">
                {n}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 border border-gray-700">
          <p className="text-gray-400 mb-4">Type in reverse order</p>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={6}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary"
            autoFocus
          />
          <button type="button" onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
