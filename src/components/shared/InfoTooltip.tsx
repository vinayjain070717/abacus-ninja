import { useState, useRef, useEffect } from 'react';
import type { BrainBenefit } from '../../config/appConfig';

function RatingDots({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-400 w-16 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              i < value ? 'bg-primary' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-500 w-6 text-right">{value}/5</span>
    </div>
  );
}

const SKILL_LABELS: Record<string, string> = {
  'working-memory': 'Working Memory',
  'short-term-memory': 'Short-term Memory',
  'long-term-memory': 'Long-term Memory',
  'processing-speed': 'Processing Speed',
  'mental-arithmetic': 'Mental Arithmetic',
  'pattern-recognition': 'Pattern Recognition',
  'logical-reasoning': 'Logical Reasoning',
  'attention': 'Attention',
  'concentration': 'Concentration',
  'visualization': 'Visualization',
  'number-sense': 'Number Sense',
  'estimation': 'Estimation',
  'sequential-thinking': 'Sequential Thinking',
};

export default function InfoTooltip({ benefit }: { benefit: BrainBenefit }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const [align, setAlign] = useState<'left' | 'right'>('right');
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const popoverHeight = 280;
      setPlacement(spaceAbove >= popoverHeight ? 'above' : 'below');
      const spaceRight = window.innerWidth - rect.right;
      setAlign(spaceRight >= 270 ? 'left' : 'right');
    }
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(o => !o); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-5 h-5 rounded-full border border-gray-500 text-gray-400 text-[11px] font-bold flex items-center justify-center hover:border-primary hover:text-primary transition-colors shrink-0"
        aria-label="Show brain benefit info"
      >
        i
      </button>

      {open && (
        <div
          className={`absolute z-50 w-64 bg-surface border border-gray-600 rounded-xl shadow-xl p-3 text-left ${
            placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="space-y-1.5 mb-3">
            <RatingDots value={benefit.brainPower} label="Brain" />
            <RatingDots value={benefit.memoryImpact} label="Memory" />
            <RatingDots value={benefit.speedImpact} label="Speed" />
          </div>

          <div className="flex flex-wrap gap-1 mb-2.5">
            {benefit.skills.map((s) => (
              <span
                key={s}
                className="px-1.5 py-0.5 bg-primary/15 text-primary text-[10px] rounded-md font-medium"
              >
                {SKILL_LABELS[s] || s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <span className="text-accent font-bold">&#8635;</span> {benefit.frequency}
            </span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1">
              <span className="text-accent font-bold">&#9201;</span> {benefit.timeToResults}
            </span>
          </div>

          <p className="text-[11px] text-gray-300 leading-relaxed italic">
            &ldquo;{benefit.benefitSummary}&rdquo;
          </p>

          {placement === 'above' ? (
            <div className={`absolute bottom-0 ${align === 'right' ? 'right-4' : 'left-4'} translate-y-1/2 rotate-45 w-2 h-2 bg-surface border-r border-b border-gray-600`} />
          ) : (
            <div className={`absolute top-0 ${align === 'right' ? 'right-4' : 'left-4'} -translate-y-1/2 rotate-45 w-2 h-2 bg-surface border-l border-t border-gray-600`} />
          )}
        </div>
      )}
    </div>
  );
}
