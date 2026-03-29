import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { generateWorksheet, type Worksheet } from '../utils/worksheetGenerator';
import { APP_CONFIG, getBrainGameLabel, getWorksheetGameConfig, levelToDifficulty, type BrainBenefit } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';
import { formatTime, calculatePercentage, getGrade } from '../utils/scoring';
import { generateMemorySequence } from '../utils/problemGenerator';
import DetailedReport from '../components/shared/DetailedReport';
import type { ReportData, ReportSection, ReportDetail } from '../types/report';

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
const SquareRootSprint = lazy(() => import('../components/memorization/SquareRootSprint'));
const SpeedFactoring = lazy(() => import('../components/memorization/SpeedFactoring'));
const ComplementTo100 = lazy(() => import('../components/memorization/ComplementTo100'));
const PercentageChange = lazy(() => import('../components/memorization/PercentageChange'));
const GcdLcmSprint = lazy(() => import('../components/memorization/GcdLcmSprint'));
const DigitSumChain = lazy(() => import('../components/memorization/DigitSumChain'));
const VedicMathDrills = lazy(() => import('../components/memorization/VedicMathDrills'));
const PowersOf2 = lazy(() => import('../components/memorization/PowersOf2'));
const DualNBack = lazy(() => import('../components/memorization/DualNBack'));
const SimonNumbers = lazy(() => import('../components/memorization/SimonNumbers'));
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

type Phase = 'start' | 'addSub' | 'game1' | 'multiply' | 'game2' | 'division' | 'game3' | 'game4' | 'game5' | 'results';

const PHASE_ORDER: Phase[] = ['start', 'addSub', 'game1', 'multiply', 'game2', 'division', 'game3', 'game4', 'game5', 'results'];
const GAME_PHASES: Phase[] = ['game1', 'game2', 'game3', 'game4', 'game5'];

function getNextPhase(current: Phase): Phase {
  const idx = PHASE_ORDER.indexOf(current);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

interface BrainGameResult { game: string; score: number; total: number; timeSec: number }

export default function DailyWorksheet() {
  const [phase, setPhase] = useState<Phase>('start');
  const [level, setLevel] = useState(1);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);

  const [addSubAnswers, setAddSubAnswers] = useState<string[]>([]);
  const [multiplyAnswers, setMultiplyAnswers] = useState<string[]>([]);
  const [divisionAnswers, setDivisionAnswers] = useState<string[]>([]);
  const [brainGameScores, setBrainGameScores] = useState<BrainGameResult[]>([]);

  const [seconds, setSeconds] = useState(0);
  const [sectionStart, setSectionStart] = useState(0);
  const [sectionTimes, setSectionTimes] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const startWorksheet = () => {
    const ws = generateWorksheet(level);
    setWorksheet(ws);
    setAddSubAnswers(Array(APP_CONFIG.worksheet.addSubCount).fill(''));
    setMultiplyAnswers(Array(APP_CONFIG.worksheet.multiplyCount).fill(''));
    setDivisionAnswers(Array(APP_CONFIG.worksheet.divisionCount).fill(''));
    setBrainGameScores([]);
    setSeconds(0);
    setSectionStart(0);
    setSectionTimes({});
    setPhase('addSub');
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), APP_CONFIG.ui.timerIntervalMs);
  };

  const advancePhase = (from: Phase) => {
    const elapsed = seconds - sectionStart;
    setSectionTimes((st) => ({ ...st, [from]: elapsed }));
    setSectionStart(seconds);
    const next = getNextPhase(from);
    if (next === 'results') {
      finishWorksheet();
    } else {
      setPhase(next);
    }
  };

  const handleBrainGameComplete = (gamePhase: Phase, gameName: string, score: number, total: number) => {
    const elapsed = seconds - sectionStart;
    setBrainGameScores((prev) => [...prev, { game: gameName, score, total, timeSec: elapsed }]);
    advancePhase(gamePhase);
  };

  const finishWorksheet = () => {
    stopTimer();
    setPhase('results');
  };

  if (phase === 'start') {
    const levelCfg = APP_CONFIG.levels[Math.min(level, APP_CONFIG.worksheet.maxLevel) - 1];
    return (
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Daily Worksheet</h1>
        <div className="bg-surface rounded-xl p-6 space-y-4">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <label className="text-sm text-gray-400">Select Level</label>
              <InfoTooltip benefit={(APP_CONFIG.levelBenefits as BrainBenefit[])[level - 1]} />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: APP_CONFIG.worksheet.maxLevel }, (_, i) => i + 1).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`w-10 h-10 rounded-lg font-bold ${
                    level === l ? 'bg-accent text-white' : 'bg-surface-light text-white hover:bg-gray-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-light rounded-lg p-4 text-left text-sm">
            <h3 className="font-bold mb-2">Level {level} Contents:</h3>
            <ul className="space-y-1 text-gray-400">
              <li>{APP_CONFIG.worksheet.addSubCount} Addition/Subtraction ({levelCfg.addSub.minDigits}-{levelCfg.addSub.maxDigits} digit)</li>
              <li>{APP_CONFIG.worksheet.multiplyCount} Multiplication problems</li>
              <li>{APP_CONFIG.worksheet.divisionCount} Division problems</li>
              <li>{APP_CONFIG.worksheet.brainGameSlots} Brain games</li>
            </ul>
          </div>

          <button onClick={startWorksheet} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
            Start Worksheet
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    if (!worksheet) return null;

    const addSubDetails: ReportDetail[] = worksheet.addSubProblems.map((p, i) => {
      const userVal = parseInt(addSubAnswers[i]);
      const correct = userVal === p.answer;
      return { display: p.display, correct, correctAnswer: String(p.answer), userAnswer: addSubAnswers[i] || '—' };
    });
    const multiplyDetails: ReportDetail[] = worksheet.multiplyProblems.map((p, i) => {
      const userVal = parseInt(multiplyAnswers[i]);
      const correct = userVal === p.answer;
      return { display: p.display, correct, correctAnswer: String(p.answer), userAnswer: multiplyAnswers[i] || '—' };
    });
    const divisionDetails: ReportDetail[] = worksheet.divisionProblems.map((p, i) => {
      const userVal = parseInt(divisionAnswers[i]);
      const correct = userVal === p.quotient;
      return { display: p.display, correct, correctAnswer: String(p.quotient), userAnswer: divisionAnswers[i] || '—' };
    });

    const lvlIdx = Math.min(level, APP_CONFIG.worksheet.maxLevel) - 1;
    const diff = levelToDifficulty(level);

    const sections: ReportSection[] = [
      {
        label: 'Addition & Subtraction',
        icon: '±',
        score: addSubDetails.filter((d) => d.correct).length,
        total: APP_CONFIG.worksheet.addSubCount,
        timeSpentSec: sectionTimes.addSub || 0,
        idealTimeSec: APP_CONFIG.idealTimes.addSubPerProblem[lvlIdx] * APP_CONFIG.worksheet.addSubCount,
        details: addSubDetails,
      },
      {
        label: 'Multiplication',
        icon: '×',
        score: multiplyDetails.filter((d) => d.correct).length,
        total: APP_CONFIG.worksheet.multiplyCount,
        timeSpentSec: sectionTimes.multiply || 0,
        idealTimeSec: APP_CONFIG.idealTimes.multiplyPerProblem[lvlIdx] * APP_CONFIG.worksheet.multiplyCount,
        details: multiplyDetails,
      },
      {
        label: 'Division',
        icon: '÷',
        score: divisionDetails.filter((d) => d.correct).length,
        total: APP_CONFIG.worksheet.divisionCount,
        timeSpentSec: sectionTimes.division || 0,
        idealTimeSec: APP_CONFIG.idealTimes.divisionPerProblem[lvlIdx] * APP_CONFIG.worksheet.divisionCount,
        details: divisionDetails,
      },
      ...brainGameScores.map((bg) => ({
        label: getBrainGameLabel(bg.game),
        icon: '🧠',
        score: bg.score,
        total: bg.total,
        timeSpentSec: bg.timeSec,
        idealTimeSec: (APP_CONFIG.idealTimes.brainGamePerRound[diff] || 12) * Math.max(bg.total, 1),
      })),
    ];

    const reportData: ReportData = {
      title: 'Worksheet Complete!',
      subtitle: `Level ${level} · ${new Date().toLocaleDateString()}`,
      totalTimeSec: seconds,
      sections,
    };

    const handlePrint = () => {
      const totalCorrect = sections.reduce((s, sec) => s + sec.score, 0);
      const totalProblems = sections.reduce((s, sec) => s + sec.total, 0);
      const pct = calculatePercentage(totalCorrect, totalProblems);
      const grade = getGrade(pct);
      const sectionRows = sections
        .map((sec) => `<tr><td style="padding:6px 8px">${sec.icon} ${sec.label}</td><td style="padding:6px 8px;text-align:right;font-family:monospace">${sec.score}/${sec.total}</td><td style="padding:6px 8px;text-align:right;color:#888">${formatTime(sec.timeSpentSec)}</td><td style="padding:6px 8px;text-align:right;color:#aaa">${formatTime(sec.idealTimeSec)}</td></tr>`)
        .join('');
      const html = `<!DOCTYPE html><html><head><title>Worksheet Results - ${APP_CONFIG.app.name}</title>
<style>body{font-family:'Segoe UI',system-ui,sans-serif;max-width:600px;margin:40px auto;color:#222}
h1{font-size:24px;margin-bottom:4px}h2{font-size:18px;color:#666;margin-top:0}
table{width:100%;border-collapse:collapse;margin-top:12px}
th{text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;font-size:12px;color:#888}
td{border-bottom:1px solid #eee}
tr:nth-child(even){background:#f9f9f9}
.grade{font-size:22px;font-weight:700;margin:12px 0}
</style></head><body>
<h1>Worksheet Results</h1><h2>Level ${level} · ${new Date().toLocaleDateString()}</h2>
<p style="font-size:28px;font-weight:700;margin:16px 0">${formatTime(seconds)}</p>
<p class="grade" style="color:${pct >= 90 ? '#16a34a' : pct >= 70 ? '#2563eb' : pct >= 50 ? '#f59e0b' : '#ef4444'}">${totalCorrect}/${totalProblems} (${pct}%) — ${grade.label}</p>
<table><tr><th>Section</th><th style="text-align:right">Score</th><th style="text-align:right">Your Time</th><th style="text-align:right">Target</th></tr>${sectionRows}</table>
<p style="margin-top:24px;font-size:11px;color:#aaa;text-align:center">Generated by ${APP_CONFIG.app.name}</p>
</body></html>`;
      const printWin = window.open('', '_blank', 'width=700,height=800');
      if (!printWin) return;
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      printWin.print();
    };

    return (
      <DetailedReport
        data={reportData}
        onPlayAgain={() => setPhase('start')}
        onPrint={handlePrint}
      />
    );
  }

  if (!worksheet) return null;

  if (phase === 'addSub') {
    return (
      <WorksheetSection
        title="Section 1: Addition & Subtraction"
        subtitle={`${APP_CONFIG.worksheet.addSubCount} Problems`}
        timer={formatTime(seconds)}
        problems={worksheet.addSubProblems.map((p) => ({ display: p.display, correctAnswer: p.answer }))}
        answers={addSubAnswers}
        onAnswer={(i, v) => { const a = [...addSubAnswers]; a[i] = v; setAddSubAnswers(a); }}
        onNext={() => advancePhase('addSub')}
        onSkip={() => advancePhase('addSub')}
        nextLabel="Next: Brain Game 1 →"
      />
    );
  }

  if (phase === 'multiply') {
    return (
      <WorksheetSection
        title="Section 2: Multiplication"
        subtitle={`${APP_CONFIG.worksheet.multiplyCount} Problems`}
        timer={formatTime(seconds)}
        problems={worksheet.multiplyProblems.map((p) => ({ display: p.display, correctAnswer: p.answer }))}
        answers={multiplyAnswers}
        onAnswer={(i, v) => { const a = [...multiplyAnswers]; a[i] = v; setMultiplyAnswers(a); }}
        onNext={() => advancePhase('multiply')}
        onSkip={() => advancePhase('multiply')}
        nextLabel="Next: Brain Game 2 →"
      />
    );
  }

  if (phase === 'division') {
    return (
      <WorksheetSection
        title="Section 3: Division"
        subtitle={`${APP_CONFIG.worksheet.divisionCount} Problems`}
        timer={formatTime(seconds)}
        problems={worksheet.divisionProblems.map((p) => ({ display: p.display, correctAnswer: p.quotient }))}
        answers={divisionAnswers}
        onAnswer={(i, v) => { const a = [...divisionAnswers]; a[i] = v; setDivisionAnswers(a); }}
        onNext={() => advancePhase('division')}
        onSkip={() => advancePhase('division')}
        nextLabel="Next: Brain Game 3 →"
      />
    );
  }

  if (GAME_PHASES.includes(phase)) {
    const gameIdx = GAME_PHASES.indexOf(phase);
    const gameType = worksheet.brainGames[gameIdx];
    const gameLabel = getBrainGameLabel(gameType);
    const config = getWorksheetGameConfig(gameType);

    return (
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Brain Game {gameIdx + 1}/{APP_CONFIG.worksheet.brainGameSlots}</h2>
            <p className="text-sm text-gray-400">{gameLabel} — {config.description}</p>
          </div>
          <div className="text-lg font-mono text-primary">{formatTime(seconds)}</div>
        </div>
        <Suspense fallback={<div className="text-center text-gray-400">Loading game...</div>}>
          <WorksheetGameDispatcher
            gameType={gameType}
            config={config}
            level={level}
            onComplete={(score, total) => handleBrainGameComplete(phase, gameType, score, total)}
          />
        </Suspense>
        <button
          onClick={() => handleBrainGameComplete(phase, gameType, 0, 0)}
          className="mt-4 w-full py-2 bg-surface-light rounded-lg font-semibold text-gray-400 hover:bg-gray-600 hover:text-white text-sm"
        >
          Skip This Game →
        </button>
      </div>
    );
  }

  return null;
}

function WorksheetSection({ title, subtitle, timer, problems, answers, onAnswer, onNext, onSkip, nextLabel }: {
  title: string;
  subtitle: string;
  timer: string;
  problems: { display: string; correctAnswer: number }[];
  answers: string[];
  onAnswer: (i: number, v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  nextLabel: string;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const handleBlur = (i: number) => {
    if (answers[i].trim() !== '') {
      setChecked((prev) => new Set(prev).add(i));
    }
  };

  const getFeedback = (i: number): 'correct' | 'wrong' | null => {
    if (!APP_CONFIG.worksheet.showInlineFeedback) return null;
    if (!checked.has(i) || answers[i].trim() === '') return null;
    return parseInt(answers[i]) === problems[i].correctAnswer ? 'correct' : 'wrong';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <div className="text-lg font-mono text-primary">{timer}</div>
      </div>

      <div className="space-y-2 mb-6">
        {problems.map((p, i) => {
          const feedback = getFeedback(i);
          return (
            <div key={i} className="flex items-center gap-3 bg-surface rounded-lg p-3">
              <span className="text-gray-500 text-sm w-8 text-right">{i + 1}.</span>
              <span className="flex-1 font-mono text-sm">{p.display} =</span>
              <input
                type="number"
                value={answers[i]}
                onChange={(e) => onAnswer(i, e.target.value)}
                onBlur={() => handleBlur(i)}
                className={`w-32 px-3 py-2 bg-surface-light border rounded-lg text-center font-mono focus:outline-none focus:border-primary ${
                  feedback === 'correct' ? 'border-green-500' :
                  feedback === 'wrong' ? 'border-red-500' :
                  'border-gray-600'
                }`}
              />
              {feedback === 'correct' && <span className="text-green-400 text-sm font-bold w-28 text-left">✓</span>}
              {feedback === 'wrong' && <span className="text-red-400 text-xs w-28 text-left">✗ Ans: {p.correctAnswer}</span>}
              {feedback === null && <span className="w-28" />}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onSkip} className="px-6 py-3 bg-surface-light rounded-lg font-semibold text-gray-400 hover:bg-gray-600 hover:text-white">
          Skip Section →
        </button>
        <button onClick={onNext} className="flex-1 py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function WorksheetGameDispatcher({ gameType, config, level, onComplete }: {
  gameType: string;
  config: { rounds: number };
  level: number;
  onComplete: (score: number, total: number) => void;
}) {
  const worksheetMode = { rounds: config.rounds, difficulty: levelToDifficulty(level) };

  switch (gameType) {
    case 'number-memory':
      return <WorksheetNumberMemory rounds={worksheetMode.rounds} onComplete={onComplete} />;
    case 'reverse-memory':
      return <WorksheetReverseMemory rounds={worksheetMode.rounds} onComplete={onComplete} />;
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
    case 'square-root-sprint':
      return <SquareRootSprint worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'speed-factoring':
      return <SpeedFactoring worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'complement-to-100':
      return <ComplementTo100 worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'percentage-change':
      return <PercentageChange worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'gcd-lcm-sprint':
      return <GcdLcmSprint worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'digit-sum-chain':
      return <DigitSumChain worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'vedic-math-drills':
      return <VedicMathDrills worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'powers-of-2':
      return <PowersOf2 worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'dual-n-back':
      return <DualNBack worksheetMode={worksheetMode} onComplete={onComplete} />;
    case 'simon-numbers':
      return <SimonNumbers worksheetMode={worksheetMode} onComplete={onComplete} />;
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
      return <WorksheetNumberMemory rounds={7} onComplete={onComplete} />;
  }
}

function WorksheetNumberMemory({ rounds, onComplete }: { rounds: number; onComplete: (score: number, total: number) => void }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalMax, setTotalMax] = useState(0);
  const [sequence, setSequence] = useState(() => generateMemorySequence(7));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, currentRound]);

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
      setPhase('show');
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 mb-3">Round {currentRound + 1}/{rounds}</p>
      {phase === 'show' ? (
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">Memorize!</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {sequence.map((n, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center bg-primary rounded-lg text-2xl font-bold">{n}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">Type the numbers in order</p>
          <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && submit()} maxLength={7} className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary" autoFocus />
          <button onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
        </div>
      )}
    </div>
  );
}

function WorksheetReverseMemory({ rounds, onComplete }: { rounds: number; onComplete: (score: number, total: number) => void }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalMax, setTotalMax] = useState(0);
  const [sequence, setSequence] = useState(() => generateMemorySequence(6));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, currentRound]);

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
      setPhase('show');
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 mb-3">Round {currentRound + 1}/{rounds} (type REVERSED)</p>
      {phase === 'show' ? (
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">Memorize (type in reverse!)</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {sequence.map((n, i) => (
              <div key={i} className="w-12 h-12 flex items-center justify-center bg-purple-700 rounded-lg text-2xl font-bold">{n}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 mb-4">Type in REVERSE order</p>
          <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && submit()} maxLength={6} className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary" autoFocus />
          <button onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
        </div>
      )}
    </div>
  );
}
