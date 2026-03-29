import { useState, Suspense, useEffect } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { useSearchParams } from 'react-router-dom';
import { APP_CONFIG, BRAIN_GAME_IDS, type GameCategory, type BrainGameConfig } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { getAllPersonalBests } from '../hooks/usePersonalBest';

import NumberMemory from '../components/memorization/NumberMemory';
import ReverseMemory from '../components/memorization/ReverseMemory';
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

const RunningTotal = lazyWithRetry(() => import('../components/memorization/RunningTotal'));
const EstimationStation = lazyWithRetry(() => import('../components/memorization/EstimationStation'));
const PercentageSnap = lazyWithRetry(() => import('../components/memorization/PercentageSnap'));
const FractionToDecimal = lazyWithRetry(() => import('../components/memorization/FractionToDecimal'));
const DoubleHalveChain = lazyWithRetry(() => import('../components/memorization/DoubleHalveChain'));
const TimesTableSprint = lazyWithRetry(() => import('../components/memorization/TimesTableSprint'));
const DigitSpanOperation = lazyWithRetry(() => import('../components/memorization/DigitSpanOperation'));
const NBackNumbers = lazyWithRetry(() => import('../components/memorization/NBackNumbers'));
const WhatChanged = lazyWithRetry(() => import('../components/memorization/WhatChanged'));
const MagicSquare = lazyWithRetry(() => import('../components/memorization/MagicSquare'));
const NumberCrossword = lazyWithRetry(() => import('../components/memorization/NumberCrossword'));
const OddOneOut = lazyWithRetry(() => import('../components/memorization/OddOneOut'));
const BaseConversion = lazyWithRetry(() => import('../components/memorization/BaseConversion'));
const KenKenPuzzle = lazyWithRetry(() => import('../components/memorization/KenKenPuzzle'));
const PrimeOrNot = lazyWithRetry(() => import('../components/memorization/PrimeOrNot'));
const CountdownNumbers = lazyWithRetry(() => import('../components/memorization/CountdownNumbers'));
const NumberBingo = lazyWithRetry(() => import('../components/memorization/NumberBingo'));
const ClosestTo100 = lazyWithRetry(() => import('../components/memorization/ClosestTo100'));
const SquareRootSprint = lazyWithRetry(() => import('../components/memorization/SquareRootSprint'));
const SpeedFactoring = lazyWithRetry(() => import('../components/memorization/SpeedFactoring'));
const ComplementTo100 = lazyWithRetry(() => import('../components/memorization/ComplementTo100'));
const PercentageChange = lazyWithRetry(() => import('../components/memorization/PercentageChange'));
const GcdLcmSprint = lazyWithRetry(() => import('../components/memorization/GcdLcmSprint'));
const DigitSumChain = lazyWithRetry(() => import('../components/memorization/DigitSumChain'));
const VedicMathDrills = lazyWithRetry(() => import('../components/memorization/VedicMathDrills'));
const PowersOf2 = lazyWithRetry(() => import('../components/memorization/PowersOf2'));
const DualNBack = lazyWithRetry(() => import('../components/memorization/DualNBack'));
const SimonNumbers = lazyWithRetry(() => import('../components/memorization/SimonNumbers'));
const AuditoryMemory = lazyWithRetry(() => import('../components/memorization/AuditoryMemory'));
const CalendarCalculation = lazyWithRetry(() => import('../components/memorization/CalendarCalculation'));
const RomanNumerals = lazyWithRetry(() => import('../components/memorization/RomanNumerals'));
const NumberAnagram = lazyWithRetry(() => import('../components/memorization/NumberAnagram'));
const MatrixPattern = lazyWithRetry(() => import('../components/memorization/MatrixPattern'));
const MentalDivisionRace = lazyWithRetry(() => import('../components/memorization/MentalDivisionRace'));
const NumberBondSnap = lazyWithRetry(() => import('../components/memorization/NumberBondSnap'));
const OrderOfOperations = lazyWithRetry(() => import('../components/memorization/OrderOfOperations'));
const EquationBuilder = lazyWithRetry(() => import('../components/memorization/EquationBuilder'));
const UnitConversion = lazyWithRetry(() => import('../components/memorization/UnitConversion'));
const FibonacciSprint = lazyWithRetry(() => import('../components/memorization/FibonacciSprint'));
const TaxTipCalculator = lazyWithRetry(() => import('../components/memorization/TaxTipCalculator'));
const ClockAngle = lazyWithRetry(() => import('../components/memorization/ClockAngle'));
const ProbabilitySnap = lazyWithRetry(() => import('../components/memorization/ProbabilitySnap'));
const BinaryArithmetic = lazyWithRetry(() => import('../components/memorization/BinaryArithmetic'));
const ColorNumberStroop = lazyWithRetry(() => import('../components/memorization/ColorNumberStroop'));
const SpatialMemoryGrid = lazyWithRetry(() => import('../components/memorization/SpatialMemoryGrid'));
const BackwardsCounting = lazyWithRetry(() => import('../components/memorization/BackwardsCounting'));
const MemoryPalaceNumbers = lazyWithRetry(() => import('../components/memorization/MemoryPalaceNumbers'));
const RapidOddEven = lazyWithRetry(() => import('../components/memorization/RapidOddEven'));
const GreaterThanChain = lazyWithRetry(() => import('../components/memorization/GreaterThanChain'));
const ArithmeticFlashcards = lazyWithRetry(() => import('../components/memorization/ArithmeticFlashcards'));
const DigitReactionTime = lazyWithRetry(() => import('../components/memorization/DigitReactionTime'));
const MissingDigit = lazyWithRetry(() => import('../components/memorization/MissingDigit'));
const ChainMultiplication = lazyWithRetry(() => import('../components/memorization/ChainMultiplication'));
const NumberPath = lazyWithRetry(() => import('../components/memorization/NumberPath'));
const Kakuro = lazyWithRetry(() => import('../components/memorization/Kakuro'));
const NonogramNumbers = lazyWithRetry(() => import('../components/memorization/NonogramNumbers'));
const SetFinder = lazyWithRetry(() => import('../components/memorization/SetFinder'));
const LogicGridPuzzle = lazyWithRetry(() => import('../components/memorization/LogicGridPuzzle'));

const GAME_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  'number-memory': NumberMemory as React.ComponentType<Record<string, unknown>>,
  'reverse-memory': ReverseMemory as React.ComponentType<Record<string, unknown>>,
  'speed-grid': SpeedGrid as React.ComponentType<Record<string, unknown>>,
  'mental-math-chain': MentalMathChain as React.ComponentType<Record<string, unknown>>,
  'mini-sudoku': MiniSudoku as React.ComponentType<Record<string, unknown>>,
  'missing-operator': MissingOperator as React.ComponentType<Record<string, unknown>>,
  'twenty-four-game': TwentyFourGame as React.ComponentType<Record<string, unknown>>,
  'flash-sum': FlashSum as React.ComponentType<Record<string, unknown>>,
  'greater-less-equal': GreaterLessEqual as React.ComponentType<Record<string, unknown>>,
  'number-sequence': NumberSequence as React.ComponentType<Record<string, unknown>>,
  'number-pair-match': NumberPairMatch as React.ComponentType<Record<string, unknown>>,
  'number-sorting': NumberSorting as React.ComponentType<Record<string, unknown>>,
  'running-total': RunningTotal as React.ComponentType<Record<string, unknown>>,
  'estimation-station': EstimationStation as React.ComponentType<Record<string, unknown>>,
  'percentage-snap': PercentageSnap as React.ComponentType<Record<string, unknown>>,
  'fraction-to-decimal': FractionToDecimal as React.ComponentType<Record<string, unknown>>,
  'double-halve-chain': DoubleHalveChain as React.ComponentType<Record<string, unknown>>,
  'times-table-sprint': TimesTableSprint as React.ComponentType<Record<string, unknown>>,
  'digit-span-operation': DigitSpanOperation as React.ComponentType<Record<string, unknown>>,
  'n-back-numbers': NBackNumbers as React.ComponentType<Record<string, unknown>>,
  'what-changed': WhatChanged as React.ComponentType<Record<string, unknown>>,
  'magic-square': MagicSquare as React.ComponentType<Record<string, unknown>>,
  'number-crossword': NumberCrossword as React.ComponentType<Record<string, unknown>>,
  'odd-one-out': OddOneOut as React.ComponentType<Record<string, unknown>>,
  'base-conversion': BaseConversion as React.ComponentType<Record<string, unknown>>,
  'kenken-puzzle': KenKenPuzzle as React.ComponentType<Record<string, unknown>>,
  'prime-or-not': PrimeOrNot as React.ComponentType<Record<string, unknown>>,
  'countdown-numbers': CountdownNumbers as React.ComponentType<Record<string, unknown>>,
  'number-bingo': NumberBingo as React.ComponentType<Record<string, unknown>>,
  'closest-to-100': ClosestTo100 as React.ComponentType<Record<string, unknown>>,
  'square-root-sprint': SquareRootSprint as React.ComponentType<Record<string, unknown>>,
  'speed-factoring': SpeedFactoring as React.ComponentType<Record<string, unknown>>,
  'complement-to-100': ComplementTo100 as React.ComponentType<Record<string, unknown>>,
  'percentage-change': PercentageChange as React.ComponentType<Record<string, unknown>>,
  'gcd-lcm-sprint': GcdLcmSprint as React.ComponentType<Record<string, unknown>>,
  'digit-sum-chain': DigitSumChain as React.ComponentType<Record<string, unknown>>,
  'vedic-math-drills': VedicMathDrills as React.ComponentType<Record<string, unknown>>,
  'powers-of-2': PowersOf2 as React.ComponentType<Record<string, unknown>>,
  'dual-n-back': DualNBack as React.ComponentType<Record<string, unknown>>,
  'simon-numbers': SimonNumbers as React.ComponentType<Record<string, unknown>>,
  'auditory-memory': AuditoryMemory as React.ComponentType<Record<string, unknown>>,
  'calendar-calculation': CalendarCalculation as React.ComponentType<Record<string, unknown>>,
  'roman-numerals': RomanNumerals as React.ComponentType<Record<string, unknown>>,
  'number-anagram': NumberAnagram as React.ComponentType<Record<string, unknown>>,
  'matrix-pattern': MatrixPattern as React.ComponentType<Record<string, unknown>>,
  'mental-division-race': MentalDivisionRace as React.ComponentType<Record<string, unknown>>,
  'number-bond-snap': NumberBondSnap as React.ComponentType<Record<string, unknown>>,
  'order-of-operations': OrderOfOperations as React.ComponentType<Record<string, unknown>>,
  'equation-builder': EquationBuilder as React.ComponentType<Record<string, unknown>>,
  'unit-conversion': UnitConversion as React.ComponentType<Record<string, unknown>>,
  'fibonacci-sprint': FibonacciSprint as React.ComponentType<Record<string, unknown>>,
  'tax-tip-calculator': TaxTipCalculator as React.ComponentType<Record<string, unknown>>,
  'clock-angle': ClockAngle as React.ComponentType<Record<string, unknown>>,
  'probability-snap': ProbabilitySnap as React.ComponentType<Record<string, unknown>>,
  'binary-arithmetic': BinaryArithmetic as React.ComponentType<Record<string, unknown>>,
  'color-number-stroop': ColorNumberStroop as React.ComponentType<Record<string, unknown>>,
  'spatial-memory-grid': SpatialMemoryGrid as React.ComponentType<Record<string, unknown>>,
  'backwards-counting': BackwardsCounting as React.ComponentType<Record<string, unknown>>,
  'memory-palace-numbers': MemoryPalaceNumbers as React.ComponentType<Record<string, unknown>>,
  'rapid-odd-even': RapidOddEven as React.ComponentType<Record<string, unknown>>,
  'greater-than-chain': GreaterThanChain as React.ComponentType<Record<string, unknown>>,
  'arithmetic-flashcards': ArithmeticFlashcards as React.ComponentType<Record<string, unknown>>,
  'digit-reaction-time': DigitReactionTime as React.ComponentType<Record<string, unknown>>,
  'missing-digit': MissingDigit as React.ComponentType<Record<string, unknown>>,
  'chain-multiplication': ChainMultiplication as React.ComponentType<Record<string, unknown>>,
  'number-path': NumberPath as React.ComponentType<Record<string, unknown>>,
  'kakuro': Kakuro as React.ComponentType<Record<string, unknown>>,
  'nonogram-numbers': NonogramNumbers as React.ComponentType<Record<string, unknown>>,
  'set-finder': SetFinder as React.ComponentType<Record<string, unknown>>,
  'logic-grid-puzzle': LogicGridPuzzle as React.ComponentType<Record<string, unknown>>,
};

const CATEGORY_COLORS: Record<GameCategory, string> = {
  'memory': 'from-pink-900/80 to-pink-950/90 border-pink-700/50',
  'mental-arithmetic': 'from-blue-900/80 to-blue-950/90 border-blue-700/50',
  'logic': 'from-purple-900/80 to-purple-950/90 border-purple-700/50',
  'speed': 'from-orange-900/80 to-orange-950/90 border-orange-700/50',
};

const CATEGORY_IMAGES: Record<GameCategory, string> = {
  'memory': 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=75&auto=format',
  'mental-arithmetic': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=75&auto=format',
  'logic': 'https://images.unsplash.com/photo-1529590003495-b2646e2718bf?w=400&q=75&auto=format',
  'speed': 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&q=75&auto=format',
};

const ALL_CATEGORIES: ('all' | GameCategory)[] = ['all', 'memory', 'mental-arithmetic', 'logic', 'speed'];

type SortOption = 'name' | 'brain' | 'memory' | 'speed';

export default function MemoryGames() {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameFromUrl = searchParams.get('game');
  const [activeGame, setActiveGame] = useState<string | null>(() =>
    gameFromUrl && GAME_COMPONENTS[gameFromUrl] ? gameFromUrl : null
  );
  const [filter, setFilter] = useState<'all' | GameCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  useEffect(() => {
    const g = searchParams.get('game');
    if (g && GAME_COMPONENTS[g]) setActiveGame(g);
  }, [searchParams]);

  const goBackToGrid = () => {
    setActiveGame(null);
    setSearchParams({});
  };

  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame];
    if (!GameComponent) return null;
    return (
      <div>
        <button type="button" onClick={goBackToGrid} className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-1">
          ← Back to Games
        </button>
        <ErrorBoundary>
          <Suspense fallback={<div className="text-center text-gray-400 py-12">Loading game...</div>}>
            <GameComponent />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  const pbData = getAllPersonalBests();
  const games = BRAIN_GAME_IDS.map((id) => ({
    id,
    ...(APP_CONFIG.brainGames as Record<string, BrainGameConfig>)[id],
  }));

  const filtered = filter === 'all' ? games : games.filter((g) => g.category === filter);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'brain':
        return b.benefit.brainPower - a.benefit.brainPower || a.label.localeCompare(b.label);
      case 'memory':
        return b.benefit.memoryImpact - a.benefit.memoryImpact || a.label.localeCompare(b.label);
      case 'speed':
        return b.benefit.speedImpact - a.benefit.speedImpact || a.label.localeCompare(b.label);
      default:
        return a.label.localeCompare(b.label);
    }
  });

  return (
    <div className={APP_CONFIG.ui.maxWidthGameGrid + ' mx-auto'}>
      <h1 className="text-2xl font-bold mb-2 text-center">Brain Games</h1>
      <p className="text-gray-400 text-center mb-6">{games.length} games to train your mind</p>

      <div className="flex flex-wrap gap-2 justify-center mb-6 items-center">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-primary text-white'
                : 'bg-surface text-gray-400 hover:text-white hover:bg-surface-light'
            }`}
          >
            {cat === 'all' ? 'All' : APP_CONFIG.gameCategories[cat].label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-surface border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="name">Name (A-Z)</option>
            <option value="brain">Brain Power</option>
            <option value="memory">Memory Impact</option>
            <option value="speed">Speed Impact</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sorted.map((game) => (
          <div
            key={game.id}
            role="button"
            tabIndex={0}
            onClick={() => setActiveGame(game.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveGame(game.id); } }}
            className="rounded-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer relative group border border-gray-700/50 h-full"
          >
            <img
              src={CATEGORY_IMAGES[game.category]}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[game.category]}`} />
            <div className="relative z-10 p-4 flex flex-col gap-2 h-full">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{game.icon}</span>
                <span className="font-bold text-sm leading-tight flex-1 text-white">{game.label}</span>
                <InfoTooltip benefit={game.benefit} />
              </div>
              {pbData[game.id] && (
                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 rounded px-1.5 py-0.5 self-start">
                  PB: {pbData[game.id].pct}%
                </span>
              )}
              <p className="text-xs text-white/70 leading-relaxed flex-1">{game.description}</p>
              {game.example && (
                <div className="bg-black/30 rounded-lg px-2 py-1.5 mt-auto">
                  <p className="text-xs font-mono text-white/80">{game.example}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
