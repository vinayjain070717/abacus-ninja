import { useCallback, useEffect, useMemo, useState } from 'react';

const NUM_RODS = 13;
const MAX_VAL = 9999999999999n;

type RodState = { heaven: boolean; earthUp: number };

function rodDigit(r: RodState): number {
  return (r.heaven ? 5 : 0) + r.earthUp;
}

function digitToRod(d: number): RodState {
  const v = ((d % 10) + 10) % 10;
  if (v >= 5) return { heaven: true, earthUp: v - 5 };
  return { heaven: false, earthUp: v };
}

function bigIntToRods(n: bigint): RodState[] {
  const s = n.toString().replace(/\D/g, '');
  const clipped = s.length > NUM_RODS ? s.slice(-NUM_RODS) : s.padStart(NUM_RODS, '0');
  const digits = clipped.split('').map((c) => parseInt(c, 10));
  // clipped is MSB-first, length NUM_RODS; rod index i (0=1s) = digits from right
  const rods: RodState[] = [];
  for (let i = 0; i < NUM_RODS; i++) {
    const fromRight = NUM_RODS - 1 - i;
    rods.push(digitToRod(digits[fromRight] ?? 0));
  }
  return rods;
}

function rodsToBigInt(rods: RodState[]): bigint {
  let t = 0n;
  for (let i = 0; i < NUM_RODS; i++) {
    t += BigInt(rodDigit(rods[i])) * 10n ** BigInt(i);
  }
  return t;
}

function placeLabel(pow: number): string {
  if (pow === 0) return '1s';
  if (pow === 1) return '10s';
  if (pow === 2) return '100s';
  return `10^${pow}`;
}

export default function AbacusVisualizer() {
  const [rods, setRods] = useState<RodState[]>(() =>
    Array.from({ length: NUM_RODS }, () => ({ heaven: false, earthUp: 0 }))
  );
  const [inputStr, setInputStr] = useState('0');
  const [quizMode, setQuizMode] = useState(false);
  const [quizTarget, setQuizTarget] = useState<bigint | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizGuess, setQuizGuess] = useState('');

  const displayValue = useMemo(() => rodsToBigInt(rods), [rods]);

  useEffect(() => {
    if (quizMode) return;
    setInputStr(displayValue.toString());
  }, [displayValue, quizMode]);

  const applyNumberString = useCallback((raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, '');
    if (cleaned === '') {
      setInputStr('0');
      setRods(bigIntToRods(0n));
      return;
    }
    let v = BigInt(cleaned);
    if (v > MAX_VAL) v = MAX_VAL;
    setInputStr(v.toString());
    setRods(bigIntToRods(v));
  }, []);

  const toggleHeaven = (idx: number) => {
    setRods((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], heaven: !next[idx].heaven };
      return next;
    });
    setQuizMode(false);
    setQuizFeedback(null);
  };

  const clickEarthBead = (rodIdx: number, beadIdx: number) => {
    setRods((prev) => {
      const next = [...prev];
      const r = next[rodIdx];
      const want = beadIdx + 1;
      const earthUp = r.earthUp === want ? beadIdx : want;
      next[rodIdx] = { ...r, earthUp: Math.max(0, Math.min(4, earthUp)) };
      return next;
    });
    setQuizMode(false);
    setQuizFeedback(null);
  };

  const randomQuiz = () => {
    let s = '';
    for (let i = 0; i < NUM_RODS; i++) s += String(Math.floor(Math.random() * 10));
    let n = BigInt(s);
    if (n > MAX_VAL) n = MAX_VAL;
    setRods(bigIntToRods(n));
    setQuizTarget(n);
    setQuizGuess('');
    setQuizFeedback(null);
    setQuizMode(true);
    setInputStr(n.toString());
  };

  const checkQuiz = () => {
    if (quizTarget === null) return;
    const g = BigInt(quizGuess.replace(/[^\d]/g, '') || '0');
    setQuizFeedback(g === quizTarget ? 'Correct!' : `Not quite — value was ${quizTarget.toString()}`);
  };

  const rodIndicesLTR = useMemo(() => [...Array(NUM_RODS).keys()].map((i) => NUM_RODS - 1 - i), []);

  return (
    <div className="max-w-6xl mx-auto px-1">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Soroban visualizer</h1>
      <p className="text-gray-400 text-center text-sm mb-4">
        Japanese abacus — 13 rods, heaven (5) + four earth beads (1 each). Click beads or type a value.
      </p>

      <div className="rounded-2xl border-4 border-amber-900/80 bg-gradient-to-b from-amber-900/40 to-amber-950/80 p-3 md:p-6 shadow-xl overflow-x-auto">
        <div className="flex justify-center min-w-[640px] md:min-w-0 gap-0.5 md:gap-1">
          {rodIndicesLTR.map((rodIdx) => {
            const r = rods[rodIdx];
            const pow = rodIdx;
            return (
              <div key={rodIdx} className="flex flex-col items-center w-8 sm:w-10 md:w-12 flex-shrink-0">
                <div className="relative flex flex-col items-center w-full h-[200px] sm:h-[240px] md:h-[260px]">
                  {/* heaven zone */}
                  <div className="flex-1 flex flex-col-reverse items-center justify-end pb-1 w-full">
                    <button
                      type="button"
                      aria-label={`Rod ${pow} heaven bead`}
                      onClick={() => toggleHeaven(rodIdx)}
                      className={`rounded-full border-2 w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 ${
                        r.heaven
                          ? 'bg-amber-400 border-amber-200 translate-y-6 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'bg-zinc-700 border-zinc-500 translate-y-0 opacity-70'
                      }`}
                    />
                  </div>

                  {/* bar */}
                  <div className="h-1.5 w-full bg-amber-950 rounded-sm shadow-md z-10 border border-amber-800" />

                  {/* earth beads */}
                  <div className="flex-1 flex flex-col items-center justify-start pt-1 gap-1.5 w-full">
                    {[0, 1, 2, 3].map((beadIdx) => {
                      const active = beadIdx < r.earthUp;
                      return (
                        <button
                          key={beadIdx}
                          type="button"
                          aria-label={`Rod ${pow} earth bead ${beadIdx + 1}`}
                          onClick={() => clickEarthBead(rodIdx, beadIdx)}
                          className={`rounded-full border-2 w-7 h-7 sm:w-8 sm:h-8 transition-all duration-200 ${
                            active
                              ? 'bg-amber-500 border-amber-200 -translate-y-1 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                              : 'bg-zinc-800 border-zinc-600 translate-y-0 opacity-60'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* rod line */}
                  <div
                    className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-amber-950/90 -translate-x-1/2 -z-10 pointer-events-none"
                    aria-hidden
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] text-amber-200/90 mt-1 font-mono text-center leading-tight">
                  {placeLabel(pow)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-surface border border-gray-700 p-4 space-y-3">
        <div className="text-center">
          <span className="text-gray-400 text-sm">Current value</span>
          <div className="font-mono text-xl md:text-2xl font-bold text-primary break-all">{displayValue.toString()}</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <label className="flex-1 block">
            <span className="text-xs text-gray-400 mb-1 block">Enter number (max 13 digits)</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputStr}
              onChange={(e) => applyNumberString(e.target.value)}
              disabled={quizMode && quizTarget !== null}
              className="w-full px-3 py-2 rounded-lg bg-surface-light border border-gray-600 font-mono focus:border-primary focus:outline-none disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={randomQuiz}
            className="px-4 py-2 rounded-lg bg-accent font-semibold hover:bg-accent-dark whitespace-nowrap"
          >
            Quiz mode
          </button>
        </div>

        {quizMode && (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center pt-2 border-t border-gray-700">
            <p className="text-sm text-gray-400 flex-1">Beads show a random value — type what you see, then check.</p>
            <input
              type="text"
              inputMode="numeric"
              value={quizGuess}
              onChange={(e) => setQuizGuess(e.target.value)}
              placeholder="Your answer"
              className="px-3 py-2 rounded-lg bg-surface-light border border-gray-600 font-mono sm:w-40"
            />
            <button
              type="button"
              onClick={checkQuiz}
              className="px-4 py-2 rounded-lg bg-primary font-semibold hover:bg-primary/90"
            >
              Check
            </button>
          </div>
        )}
        {quizFeedback && <p className="text-center font-semibold text-accent">{quizFeedback}</p>}
      </div>
    </div>
  );
}
