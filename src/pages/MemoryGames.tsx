import { useState, lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { APP_CONFIG, BRAIN_GAME_IDS, type GameCategory, type BrainGameConfig } from '../config/appConfig';
import InfoTooltip from '../components/shared/InfoTooltip';

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
const NumberPath = lazy(() => import('../components/memorization/NumberPath'));
const Kakuro = lazy(() => import('../components/memorization/Kakuro'));
const NonogramNumbers = lazy(() => import('../components/memorization/NonogramNumbers'));
const SetFinder = lazy(() => import('../components/memorization/SetFinder'));
const LogicGridPuzzle = lazy(() => import('../components/memorization/LogicGridPuzzle'));

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
  'memory': 'from-pink-600/30 to-pink-800/30 border-pink-700/50',
  'mental-arithmetic': 'from-blue-600/30 to-blue-800/30 border-blue-700/50',
  'logic': 'from-purple-600/30 to-purple-800/30 border-purple-700/50',
  'speed': 'from-orange-600/30 to-orange-800/30 border-orange-700/50',
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
        <Suspense fallback={<div className="text-center text-gray-400 py-12">Loading game...</div>}>
          <GameComponent />
        </Suspense>
      </div>
    );
  }

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
            className={`bg-gradient-to-br ${CATEGORY_COLORS[game.category]} border rounded-xl p-4 text-left hover:scale-[1.02] transition-transform flex flex-col gap-2 h-full cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{game.icon}</span>
              <span className="font-bold text-sm leading-tight flex-1">{game.label}</span>
              <InfoTooltip benefit={game.benefit} />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed flex-1">{game.description}</p>
            {game.example && (
              <div className="bg-black/20 rounded-lg px-2 py-1.5 mt-auto">
                <p className="text-xs font-mono text-gray-300">{game.example}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
