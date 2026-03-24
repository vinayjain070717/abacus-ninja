import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG, VEDIC_CHAPTERS } from '../config/appConfig';

type Example = { problem: string; solution: string };

type TrickSection = {
  id: string;
  title: string;
  explanation: string;
  steps?: string[];
  examples: Example[];
  practiceGame?: string;
};

const MULTIPLICATION_TRICKS: TrickSection[] = [
  {
    id: 'm11',
    title: 'Multiply by 11',
    explanation: 'For two-digit numbers: add the digits and insert the sum between them (carry if needed).',
    steps: ['Add tens and ones', 'If sum ≥ 10, carry 1 to the hundreds place'],
    examples: [
      { problem: '11 × 45', solution: '495' },
      { problem: '11 × 78', solution: '858' },
      { problem: '11 × 29', solution: '319' },
    ],
    practiceGame: '/multiplication',
  },
  {
    id: 'sq5',
    title: 'Square numbers ending in 5',
    explanation: 'First part × (first+1), then append 25.',
    examples: [
      { problem: '45²', solution: '2025' },
      { problem: '65²', solution: '4225' },
      { problem: '115²', solution: '13225' },
    ],
    practiceGame: '/multiplication',
  },
  {
    id: 'near100',
    title: 'Multiply numbers near 100',
    explanation: 'Use distance from 100: (100−a)(100−b) = 100(100−a−b) + ab.',
    examples: [
      { problem: '96 × 97', solution: '9312' },
      { problem: '98 × 95', solution: '9310' },
      { problem: '104 × 102', solution: '10608' },
    ],
    practiceGame: '/multiplication',
  },
  {
    id: 'lattice',
    title: 'Lattice multiplication',
    explanation: 'Grid with diagonals; multiply digit pairs into cells; sum diagonals for each place value.',
    steps: ['Build grid for digits of each factor', 'Fill small products', 'Sum diagonals with carries'],
    examples: [
      { problem: '23 × 45', solution: '1035' },
      { problem: '12 × 34', solution: '408' },
      { problem: '56 × 78', solution: '4368' },
    ],
    practiceGame: '/multiplication',
  },
  {
    id: 'doublehalf',
    title: 'Double and halve',
    explanation: 'Replace 2a × (b/2) when one factor is even — product unchanged, often easier mentally.',
    examples: [
      { problem: '14 × 25', solution: '7 × 50 = 350' },
      { problem: '16 × 35', solution: '8 × 70 = 560' },
      { problem: '12 × 125', solution: '6 × 250 = 1500' },
    ],
    practiceGame: '/memory?game=double-halve-chain',
  },
];

const DIVISION_TRICKS: TrickSection[] = [
  {
    id: 'divrules',
    title: 'Divisibility rules (2–9)',
    explanation: 'Quick filters before long division.',
    steps: [
      '2: last digit even',
      '3: digit sum divisible by 3',
      '4: last two digits divisible by 4',
      '5: last digit 0 or 5',
      '6: divisible by 2 and 3',
      '7: double last digit, subtract from rest; repeat',
      '8: last three digits divisible by 8',
      '9: digit sum divisible by 9',
    ],
    examples: [
      { problem: '738 ÷ 9?', solution: 'Digit sum 18 → yes' },
      { problem: '1848 ÷ 8?', solution: '848÷8=106 → yes' },
      { problem: '294 ÷ 6?', solution: 'Even and digit sum 15 → yes' },
    ],
    practiceGame: '/division',
  },
];

const ADDITION_TRICKS: TrickSection[] = [
  {
    id: 'comp',
    title: 'Complement to tidy tens',
    explanation: 'Borrow from one addend to round the other, then add the remainder.',
    examples: [
      { problem: '48 + 37', solution: '50 + 35 = 85' },
      { problem: '199 + 76', solution: '200 + 75 = 275' },
      { problem: '58 + 24', solution: '60 + 22 = 82' },
    ],
    practiceGame: '/addition',
  },
  {
    id: 'round',
    title: 'Round and adjust',
    explanation: 'Round to a landmark, add, then fix the rounding error.',
    examples: [
      { problem: '73 + 19', solution: '73 + 20 − 1 = 92' },
      { problem: '456 + 98', solution: '456 + 100 − 2 = 554' },
      { problem: '612 + 297', solution: '612 + 300 − 3 = 909' },
    ],
    practiceGame: '/addition',
  },
  {
    id: 'split',
    title: 'Split by place value',
    explanation: 'Add hundreds, then tens, then ones.',
    examples: [
      { problem: '248 + 367', solution: '500+100+15 = 615' },
      { problem: '519 + 884', solution: '1300+103 = 1403' },
    ],
    practiceGame: '/addition',
  },
];

const MEMORY_TRICKS: TrickSection[] = [
  {
    id: 'chunk',
    title: 'Chunking',
    explanation: 'Group digits into 3–4 digit chunks instead of one long string.',
    examples: [
      { problem: 'Long number', solution: '149 | 217 | 761 | 989' },
      { problem: 'Phone-style', solution: 'Groups of 3–4 lower cognitive load' },
      { problem: 'Story per chunk', solution: 'Link chunks with a narrative' },
    ],
    practiceGame: '/memory?game=number-memory',
  },
  {
    id: 'major',
    title: 'Major system',
    explanation: 'Map consonants to digits and build memorable words.',
    examples: [
      { problem: '14', solution: 'Word "tire" pattern' },
      { problem: 'Pi digits', solution: 'Sentence word-length encoding' },
      { problem: 'Decode', solution: 'Extract digits from consonant sounds' },
    ],
    practiceGame: '/memory?game=reverse-memory',
  },
  {
    id: 'shapes',
    title: 'Number shapes',
    explanation: 'Associate 0–9 with simple pictures and chain them.',
    examples: [
      { problem: '7-1-4', solution: 'Three linked images in order' },
      { problem: 'Peg list', solution: 'Fixed 0–9 images' },
      { problem: 'Link method', solution: 'Chain images sequentially' },
    ],
    practiceGame: '/memory?game=digit-span-operation',
  },
];

const TABS = ['Vedic Math', 'Multiplication', 'Division', 'Addition', 'Memory'] as const;
type Tab = (typeof TABS)[number];

function MultiLineText({ text }: { text: string }) {
  const lines = text.split('\n');
  if (lines.length <= 1) return <span className="font-mono text-accent">{text}</span>;
  return (
    <span className="font-mono text-accent">
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

function VedicAccordionBlock({ showPractice }: { showPractice: boolean }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));

  const toggle = (idx: number) => {
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  return (
    <div className="space-y-2">
      {VEDIC_CHAPTERS.map((ch, idx) => {
        const isOpen = open.has(idx);
        return (
          <div key={idx} className="rounded-xl border border-gray-700 bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-surface-light/80"
            >
              <div className="flex-1 pr-2">
                <span className="font-semibold text-sm md:text-base">{ch.title}</span>
                <span className="block text-xs text-gray-500 italic mt-0.5">{ch.subtitle}</span>
              </div>
              <span className="text-gray-400 text-lg flex-shrink-0">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-700/50 space-y-4 text-sm text-gray-300">
                <p className="leading-relaxed">{ch.content}</p>

                {ch.visualFormula && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 text-center">
                    <span className="font-mono text-primary text-base">{ch.visualFormula}</span>
                  </div>
                )}

                <div className="bg-surface-light/40 border border-gray-600/50 rounded-lg px-4 py-3">
                  <p className="font-semibold text-gray-200 mb-2 text-xs uppercase tracking-wider">How it works</p>
                  <p className="text-gray-400 leading-relaxed text-[13px]">{ch.theory}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-200 mb-2">Step-by-step method</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
                    {ch.steps.map((st, i) => (
                      <li key={i} className="leading-relaxed">{st}</li>
                    ))}
                  </ol>
                </div>

                {ch.tips.length > 0 && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3">
                    <p className="font-semibold text-accent mb-2 text-xs uppercase tracking-wider">Tips & pitfalls</p>
                    <ul className="space-y-1.5">
                      {ch.tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-gray-400 text-[13px]">
                          <span className="text-accent shrink-0">&#9679;</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="font-semibold text-gray-200 mb-2">Worked examples</p>
                  <ul className="space-y-2">
                    {ch.examples.map((ex, i) => (
                      <li key={i} className="bg-surface-light/50 rounded-lg px-3 py-2.5">
                        <span className="font-mono text-primary font-bold">{ex.problem}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <MultiLineText text={ex.solution} />
                      </li>
                    ))}
                  </ul>
                </div>

                {showPractice && ch.practiceGame && (
                  <Link
                    to={ch.practiceGame}
                    className="inline-block mt-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark"
                  >
                    Practice now
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AccordionBlock({
  sections,
  showPractice,
}: {
  sections: TrickSection[];
  showPractice: boolean;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(sections[0]?.id ? [sections[0].id] : []));

  const toggle = (id: string) => {
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-2">
      {sections.map((sec) => {
        const isOpen = open.has(sec.id);
        return (
          <div key={sec.id} className="rounded-xl border border-gray-700 bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(sec.id)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-surface-light/80"
            >
              <span className="font-semibold text-sm md:text-base pr-2">{sec.title}</span>
              <span className="text-gray-400 text-lg flex-shrink-0">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-700/50 space-y-3 text-sm text-gray-300">
                <p>{sec.explanation}</p>
                {sec.steps && sec.steps.length > 0 && (
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    {sec.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                )}
                <div>
                  <p className="font-semibold text-gray-200 mb-1">Worked examples</p>
                  <ul className="space-y-2">
                    {sec.examples.map((ex, i) => (
                      <li key={i} className="bg-surface-light/50 rounded-lg px-3 py-2">
                        <span className="font-mono text-primary">{ex.problem}</span>
                        <span className="text-gray-500"> → </span>
                        <span className="font-mono text-accent">{ex.solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {showPractice && sec.practiceGame && (
                  <Link
                    to={sec.practiceGame}
                    className="inline-block mt-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark"
                  >
                    Practice now
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Tutorials() {
  const [tab, setTab] = useState<Tab>('Vedic Math');
  const showPractice = APP_CONFIG.tutorials.showPracticeLinks;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Tutorials & tricks</h1>
      <p className="text-gray-400 text-center text-sm mb-6">Expand a section to read steps and examples.</p>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-surface border border-gray-600 text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Vedic Math' && <VedicAccordionBlock showPractice={showPractice} />}
      {tab === 'Multiplication' && <AccordionBlock sections={MULTIPLICATION_TRICKS} showPractice={showPractice} />}
      {tab === 'Division' && <AccordionBlock sections={DIVISION_TRICKS} showPractice={showPractice} />}
      {tab === 'Addition' && <AccordionBlock sections={ADDITION_TRICKS} showPractice={showPractice} />}
      {tab === 'Memory' && <AccordionBlock sections={MEMORY_TRICKS} showPractice={showPractice} />}
    </div>
  );
}
