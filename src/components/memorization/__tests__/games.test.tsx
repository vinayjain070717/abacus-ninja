import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import MissingOperator from '../MissingOperator';
import TwentyFourGame from '../TwentyFourGame';
import FlashSum from '../FlashSum';
import GreaterLessEqual from '../GreaterLessEqual';
import NumberSequence from '../NumberSequence';
import NumberPairMatch from '../NumberPairMatch';
import NumberSorting from '../NumberSorting';
import SpeedGrid from '../SpeedGrid';
import MentalMathChain from '../MentalMathChain';
import MiniSudoku from '../MiniSudoku';
import NumberMemory from '../NumberMemory';
import ReverseMemory from '../ReverseMemory';
import RunningTotal from '../RunningTotal';
import EstimationStation from '../EstimationStation';
import PercentageSnap from '../PercentageSnap';
import FractionToDecimal from '../FractionToDecimal';
import DoubleHalveChain from '../DoubleHalveChain';
import TimesTableSprint from '../TimesTableSprint';
import DigitSpanOperation from '../DigitSpanOperation';
import NBackNumbers from '../NBackNumbers';
import WhatChanged from '../WhatChanged';
import MagicSquare from '../MagicSquare';
import OddOneOut from '../OddOneOut';
import BaseConversion from '../BaseConversion';
import PrimeOrNot from '../PrimeOrNot';
import CountdownNumbers from '../CountdownNumbers';
import NumberBingo from '../NumberBingo';
import ClosestTo100 from '../ClosestTo100';
import NumberCrossword from '../NumberCrossword';
import KenKenPuzzle from '../KenKenPuzzle';
import SquareRootSprint from '../SquareRootSprint';
import SpeedFactoring from '../SpeedFactoring';
import ComplementTo100 from '../ComplementTo100';
import PercentageChange from '../PercentageChange';
import GcdLcmSprint from '../GcdLcmSprint';
import DigitSumChain from '../DigitSumChain';
import VedicMathDrills from '../VedicMathDrills';
import PowersOf2 from '../PowersOf2';
import DualNBack from '../DualNBack';
import SimonNumbers from '../SimonNumbers';
import AuditoryMemory from '../AuditoryMemory';
import CalendarCalculation from '../CalendarCalculation';
import RomanNumerals from '../RomanNumerals';
import NumberAnagram from '../NumberAnagram';
import MatrixPattern from '../MatrixPattern';
import FibonacciSprint from '../FibonacciSprint';
import TaxTipCalculator from '../TaxTipCalculator';
import ClockAngle from '../ClockAngle';
import ProbabilitySnap from '../ProbabilitySnap';
import BinaryArithmetic from '../BinaryArithmetic';
import NumberPath from '../NumberPath';
import Kakuro from '../Kakuro';
import NonogramNumbers from '../NonogramNumbers';
import SetFinder from '../SetFinder';
import LogicGridPuzzle from '../LogicGridPuzzle';
import GreaterThanChain from '../GreaterThanChain';
import ArithmeticFlashcards from '../ArithmeticFlashcards';
import DigitReactionTime from '../DigitReactionTime';
import MissingDigit from '../MissingDigit';
import ChainMultiplication from '../ChainMultiplication';

const worksheetGames = [
  { name: 'MissingOperator', Component: MissingOperator },
  { name: 'TwentyFourGame', Component: TwentyFourGame },
  { name: 'FlashSum', Component: FlashSum },
  { name: 'GreaterLessEqual', Component: GreaterLessEqual },
  { name: 'NumberSequence', Component: NumberSequence },
  { name: 'NumberPairMatch', Component: NumberPairMatch },
  { name: 'NumberSorting', Component: NumberSorting },
  { name: 'SpeedGrid', Component: SpeedGrid },
  { name: 'MentalMathChain', Component: MentalMathChain },
  { name: 'MiniSudoku', Component: MiniSudoku },
  { name: 'RunningTotal', Component: RunningTotal },
  { name: 'EstimationStation', Component: EstimationStation },
  { name: 'PercentageSnap', Component: PercentageSnap },
  { name: 'FractionToDecimal', Component: FractionToDecimal },
  { name: 'DoubleHalveChain', Component: DoubleHalveChain },
  { name: 'TimesTableSprint', Component: TimesTableSprint },
  { name: 'DigitSpanOperation', Component: DigitSpanOperation },
  { name: 'NBackNumbers', Component: NBackNumbers },
  { name: 'WhatChanged', Component: WhatChanged },
  { name: 'MagicSquare', Component: MagicSquare },
  { name: 'OddOneOut', Component: OddOneOut },
  { name: 'BaseConversion', Component: BaseConversion },
  { name: 'PrimeOrNot', Component: PrimeOrNot },
  { name: 'CountdownNumbers', Component: CountdownNumbers },
  { name: 'NumberBingo', Component: NumberBingo },
  { name: 'ClosestTo100', Component: ClosestTo100 },
  { name: 'NumberCrossword', Component: NumberCrossword },
  { name: 'KenKenPuzzle', Component: KenKenPuzzle },
  { name: 'FibonacciSprint', Component: FibonacciSprint },
  { name: 'TaxTipCalculator', Component: TaxTipCalculator },
  { name: 'ClockAngle', Component: ClockAngle },
  { name: 'ProbabilitySnap', Component: ProbabilitySnap },
  { name: 'BinaryArithmetic', Component: BinaryArithmetic },
  { name: 'NumberPath', Component: NumberPath },
  { name: 'Kakuro', Component: Kakuro },
  { name: 'NonogramNumbers', Component: NonogramNumbers },
  { name: 'SetFinder', Component: SetFinder },
  { name: 'LogicGridPuzzle', Component: LogicGridPuzzle },
  { name: 'GreaterThanChain', Component: GreaterThanChain },
  { name: 'ArithmeticFlashcards', Component: ArithmeticFlashcards },
  { name: 'DigitReactionTime', Component: DigitReactionTime },
  { name: 'MissingDigit', Component: MissingDigit },
  { name: 'ChainMultiplication', Component: ChainMultiplication },
] as const;

describe('Game components - standalone render', () => {
  worksheetGames.forEach(({ name, Component }) => {
    it(`${name} renders without crashing`, () => {
      const { container } = render(<Component />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('NumberMemory renders without crashing', () => {
    const { container } = render(<NumberMemory />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ReverseMemory renders without crashing', () => {
    const { container } = render(<ReverseMemory />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('Game components - worksheet mode', () => {
  worksheetGames.forEach(({ name, Component }) => {
    it(`${name} renders in worksheet mode`, () => {
      const onComplete = vi.fn();
      const { container } = render(
        <Component worksheetMode={{ rounds: 1 }} onComplete={onComplete} />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });
});

describe('SquareRootSprint', () => {
  it('renders without crashing', () => {
    render(<SquareRootSprint />);
  });

  it('shows config screen with start button', () => {
    render(<SquareRootSprint />);
    expect(screen.getByRole('heading', { level: 2, name: /square root sprint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<SquareRootSprint worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('SpeedFactoring', () => {
  it('renders without crashing', () => {
    render(<SpeedFactoring />);
  });

  it('shows config screen with start button', () => {
    render(<SpeedFactoring />);
    expect(screen.getByRole('heading', { level: 2, name: /speed factoring/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<SpeedFactoring worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('ComplementTo100', () => {
  it('renders without crashing', () => {
    render(<ComplementTo100 />);
  });

  it('shows config screen with start button', () => {
    render(<ComplementTo100 />);
    expect(screen.getByRole('heading', { level: 2, name: /complement drill/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<ComplementTo100 worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('PercentageChange', () => {
  it('renders without crashing', () => {
    render(<PercentageChange />);
  });

  it('shows config screen with start button', () => {
    render(<PercentageChange />);
    expect(screen.getByRole('heading', { level: 2, name: /percentage change/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<PercentageChange worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('GcdLcmSprint', () => {
  it('renders without crashing', () => {
    render(<GcdLcmSprint />);
  });

  it('shows config screen with start button', () => {
    render(<GcdLcmSprint />);
    expect(screen.getByRole('heading', { level: 2, name: /gcd.*lcm sprint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<GcdLcmSprint worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('DigitSumChain', () => {
  it('renders without crashing', () => {
    render(<DigitSumChain />);
  });

  it('shows config screen with start button', () => {
    render(<DigitSumChain />);
    expect(screen.getByRole('heading', { level: 2, name: /digit sum chain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<DigitSumChain worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('VedicMathDrills', () => {
  it('renders without crashing', () => {
    render(<VedicMathDrills />);
  });

  it('shows config screen with start button', () => {
    render(<VedicMathDrills />);
    expect(screen.getByRole('heading', { level: 2, name: /vedic math drills/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<VedicMathDrills worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('PowersOf2', () => {
  it('renders without crashing', () => {
    render(<PowersOf2 />);
  });

  it('shows config screen with start button', () => {
    render(<PowersOf2 />);
    expect(screen.getByRole('heading', { level: 2, name: /powers of 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<PowersOf2 worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('DualNBack', () => {
  it('renders without crashing', () => {
    render(<DualNBack />);
  });

  it('shows config screen with start button', () => {
    render(<DualNBack />);
    expect(screen.getByRole('heading', { level: 2, name: /dual n-back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<DualNBack worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('SimonNumbers', () => {
  it('renders without crashing', () => {
    render(<SimonNumbers />);
  });

  it('shows config screen with start button', () => {
    render(<SimonNumbers />);
    expect(screen.getByRole('heading', { level: 2, name: /simon numbers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<SimonNumbers worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('AuditoryMemory', () => {
  beforeEach(() => {
    window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() } as unknown as SpeechSynthesis;
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        rate = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing', () => {
    render(<AuditoryMemory />);
  });

  it('shows config screen with start button', () => {
    render(<AuditoryMemory />);
    expect(screen.getByRole('heading', { level: 2, name: /auditory memory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<AuditoryMemory worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('CalendarCalculation', () => {
  it('renders without crashing', () => {
    render(<CalendarCalculation />);
  });

  it('shows config screen with start button', () => {
    render(<CalendarCalculation />);
    expect(screen.getByRole('heading', { level: 2, name: /calendar calculation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<CalendarCalculation worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('RomanNumerals', () => {
  it('renders without crashing', () => {
    render(<RomanNumerals />);
  });

  it('shows config screen with start button', () => {
    render(<RomanNumerals />);
    expect(screen.getByRole('heading', { level: 2, name: /roman numerals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<RomanNumerals worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('NumberAnagram', () => {
  it('renders without crashing', () => {
    render(<NumberAnagram />);
  });

  it('shows config screen with start button', () => {
    render(<NumberAnagram />);
    expect(screen.getByRole('heading', { level: 2, name: /number anagram/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<NumberAnagram worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('MatrixPattern', () => {
  it('renders without crashing', () => {
    render(<MatrixPattern />);
  });

  it('shows config screen with start button', () => {
    render(<MatrixPattern />);
    expect(screen.getByRole('heading', { level: 2, name: /matrix pattern/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<MatrixPattern worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('GreaterThanChain', () => {
  it('renders without crashing', () => {
    render(<GreaterThanChain />);
  });

  it('shows config with start', () => {
    render(<GreaterThanChain />);
    expect(screen.getByRole('heading', { level: 2, name: /greater-than chain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<GreaterThanChain worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('ArithmeticFlashcards', () => {
  it('renders without crashing', () => {
    render(<ArithmeticFlashcards />);
  });

  it('shows config with start', () => {
    render(<ArithmeticFlashcards />);
    expect(screen.getByRole('heading', { level: 2, name: /arithmetic flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start.*60s round/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<ArithmeticFlashcards worksheetMode={{ rounds: 1 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('DigitReactionTime', () => {
  it('renders without crashing', () => {
    render(<DigitReactionTime />);
  });

  it('shows config with start', () => {
    render(<DigitReactionTime />);
    expect(screen.getByRole('heading', { level: 2, name: /digit reaction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<DigitReactionTime worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('MissingDigit', () => {
  it('renders without crashing', () => {
    render(<MissingDigit />);
  });

  it('shows config with start', () => {
    render(<MissingDigit />);
    expect(screen.getByRole('heading', { level: 2, name: /missing digit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<MissingDigit worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});

describe('ChainMultiplication', () => {
  it('renders without crashing', () => {
    render(<ChainMultiplication />);
  });

  it('shows config with start', () => {
    render(<ChainMultiplication />);
    expect(screen.getByRole('heading', { level: 2, name: /chain multiplication/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument();
  });

  it('renders in worksheet mode', () => {
    const onComplete = vi.fn();
    render(<ChainMultiplication worksheetMode={{ rounds: 3 }} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /^start$/i })).not.toBeInTheDocument();
  });
});
