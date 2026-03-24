import { useState, useRef, useMemo } from 'react';
import { VEDIC_CHAPTERS, type Difficulty, type VedicChapter } from '../../config/appConfig';
import { generateVedicProblem, type VedicProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'learn' | 'playing' | 'feedback' | 'results';

const VEDIC_TYPES = [
  { value: '', label: 'Mixed (all tricks)' },
  { value: 'ekadhikena-square-5', label: 'Square numbers ending in 5' },
  { value: 'nikhilam-multiply-near-base', label: 'Multiply near 100 / 1000' },
  { value: 'urdhva-tiryagbhyam', label: 'Vertically & crosswise (2-digit ×)' },
  { value: 'anurupyena', label: 'Proportionate scaling (×25, ×50, ×125)' },
  { value: 'puranapuranabhyam', label: 'Square by completion (near 30, 50...)' },
  { value: 'ekanyunena-multiply-9s', label: 'Multiply by 99 / 999' },
  { value: 'multiply-by-11', label: 'Multiply by 11' },
  { value: 'yavadunam-square-near-base', label: 'Square near 100 / 1000' },
] as const;

const DRILL_TO_CHAPTER: Record<string, VedicChapter | undefined> = {};
for (const ch of VEDIC_CHAPTERS) {
  if (ch.drillType) DRILL_TO_CHAPTER[ch.drillType] = ch;
}

interface RoundResult {
  problem: VedicProblem;
  userAnswer: number | null;
  correct: boolean;
}

function LearnScreen({
  chapter,
  onReady,
  onSkip,
}: {
  chapter: VedicChapter;
  onReady: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-1 text-center text-primary">{chapter.title}</h2>
      <p className="text-center text-gray-500 italic text-sm mb-4">{chapter.subtitle}</p>

      <div className="bg-surface rounded-xl p-5 space-y-4 text-sm text-gray-300">
        <p className="leading-relaxed">{chapter.content}</p>

        {chapter.visualFormula && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 text-center">
            <span className="font-mono text-primary text-base">{chapter.visualFormula}</span>
          </div>
        )}

        <div className="bg-surface-light/40 border border-gray-600/50 rounded-lg px-4 py-3">
          <p className="font-semibold text-gray-200 mb-2 text-xs uppercase tracking-wider">How it works</p>
          <p className="text-gray-400 leading-relaxed text-[13px]">{chapter.theory}</p>
        </div>

        <div>
          <p className="font-semibold text-gray-200 mb-2">Step-by-step</p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
            {chapter.steps.map((st, i) => (
              <li key={i} className="leading-relaxed">{st}</li>
            ))}
          </ol>
        </div>

        {chapter.tips.length > 0 && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3">
            <p className="font-semibold text-accent mb-2 text-xs uppercase tracking-wider">Tips</p>
            <ul className="space-y-1.5">
              {chapter.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-gray-400 text-[13px]">
                  <span className="text-accent shrink-0">&#9679;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="font-semibold text-gray-200 mb-2">Examples</p>
          <ul className="space-y-2">
            {chapter.examples.slice(0, 3).map((ex, i) => (
              <li key={i} className="bg-surface-light/50 rounded-lg px-3 py-2.5">
                <span className="font-mono text-primary font-bold">{ex.problem}</span>
                <span className="text-gray-500 mx-2">→</span>
                <span className="font-mono text-accent whitespace-pre-line">{ex.solution}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-5">
        <button
          type="button"
          onClick={onReady}
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          I understand — start practicing
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          Skip to practice →
        </button>
      </div>
    </div>
  );
}

export default function VedicMathDrills({
  worksheetMode,
  onComplete,
}: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [trickType, setTrickType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);
  const [allProblems, setAllProblems] = useState<VedicProblem[]>(() =>
    worksheetMode ? Array.from({ length: worksheetMode.rounds }, () => generateVedicProblem()) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedChapter = useMemo(() => {
    if (!trickType) return undefined;
    return DRILL_TO_CHAPTER[trickType];
  }, [trickType]);

  const generateAndStart = () => {
    void effectiveDiff;
    const ps = Array.from({ length: totalRounds }, () =>
      trickType ? generateVedicProblem(trickType) : generateVedicProblem()
    );
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setAnswer('');
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleStartFromConfig = () => {
    if (selectedChapter) {
      setPhase('learn');
    } else {
      generateAndStart();
    }
  };

  const submit = () => {
    const problem = allProblems[currentIdx];
    const userVal = answer.trim() === '' ? null : Number(answer);
    const correct = userVal !== null && userVal === problem.answer;
    const result = { problem, userAnswer: userVal, correct };
    setResults((prev) => [...prev, result]);
    setAnswer('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
      setPhase('playing');
    } else {
      const score = results.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, results.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'learn' && selectedChapter) {
    return (
      <LearnScreen
        chapter={selectedChapter}
        onReady={generateAndStart}
        onSkip={generateAndStart}
      />
    );
  }

  if (phase === 'feedback' && lastResult) {
    const p = lastResult.problem;
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Vedic math drills</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            {p.question} = {p.answer}
          </p>
          <div className="text-gray-400 text-xs mt-2 text-left whitespace-pre-line">{p.explanation}</div>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your answer: {lastResult.userAnswer ?? '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Vedic math drills</h2>
        <div className="bg-surface rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold mb-2 text-primary">
            {score}/{results.length}
          </div>
        </div>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto text-left">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                r.correct ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div className="font-mono">
                {r.problem.question} = {r.problem.answer}
              </div>
              <div className="text-gray-500 text-xs mt-1 whitespace-pre-line">{r.problem.explanation}</div>
              {!r.correct && (
                <span className="text-red-400 text-sm font-mono">You: {r.userAnswer ?? '—'}</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={generateAndStart}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark"
          >
            Play Again
          </button>
          {!worksheetMode && (
            <button
              type="button"
              onClick={() => setPhase('config')}
              className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600"
            >
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Score: {results.filter((r) => r.correct).length}</span>
        </div>
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-gray-400 text-sm mb-4">Solve using the shortcut</p>
          <p className="text-4xl font-bold text-primary mb-6">{problem.question}</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full max-w-xs mx-auto px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark"
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Vedic math drills</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Practice classic Vedic-style mental tricks. Select a specific trick to see a lesson before practicing.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Trick type</label>
          <select
            value={trickType}
            onChange={(e) => setTrickType(e.target.value)}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {VEDIC_TYPES.map((t) => (
              <option key={t.value || 'mixed'} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <button
          type="button"
          onClick={handleStartFromConfig}
          className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark"
        >
          {selectedChapter ? 'Learn & Practice' : 'Start'}
        </button>
      </div>
    </div>
  );
}
