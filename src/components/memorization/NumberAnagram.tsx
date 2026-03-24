import { useState, useRef } from 'react';
import type { Difficulty } from '../../config/appConfig';
import { generateAnagramProblem, type AnagramProblem } from '../../utils/problemGenerator';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

const DIFF_PARAMS: Record<Difficulty, { digitCount: number }> = {
  easy: { digitCount: 3 },
  medium: { digitCount: 5 },
  hard: { digitCount: 7 },
};
type SortMode = 'smallest' | 'largest' | 'mixed';

interface RoundResult {
  problem: AnagramProblem;
  userAnswer: string;
  correct: boolean;
}

export default function NumberAnagram({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? difficulty;
  const [sortMode, setSortMode] = useState<SortMode>('mixed');
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<AnagramProblem[]>(() =>
    worksheetMode
      ? Array.from({ length: worksheetMode.rounds }, () => {
          const dc = DIFF_PARAMS[(worksheetMode.difficulty ?? 'medium') as Difficulty].digitCount;
          return generateAnagramProblem(dc, dc, undefined);
        })
      : []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;
  const inputRef = useRef<HTMLInputElement>(null);

  const problem = allProblems[currentIdx];

  const startGame = () => {
    const dc = DIFF_PARAMS[effectiveDiff].digitCount;
    const m = sortMode === 'mixed' ? undefined : sortMode;
    const ps = Array.from({ length: totalRounds }, () => generateAnagramProblem(dc, dc, m));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    resultsRef.current = [];
    setLastResult(null);
    setAnswer('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    if (!problem) return;
    const n = parseInt(answer.replace(/\D/g, ''), 10);
    const correct = !Number.isNaN(n) && n === problem.answer;
    const row: RoundResult = { problem, userAnswer: answer, correct };
    const next = [...resultsRef.current, row];
    resultsRef.current = next;
    setResults(next);
    setLastResult(row);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx((i) => i + 1);
      setAnswer('');
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, Math.max(1, prev.length));
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'results') {
    const score = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Number Anagram</h2>
        <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="text-4xl font-bold mb-2 text-primary tabular-nums">
            {score}/{results.length}
          </div>
          <p className="text-gray-400 text-sm">Correct</p>
        </div>
        <div className="space-y-2 mb-6 text-left text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border font-mono ${
                r.correct ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'
              }`}
            >
              <div className="text-gray-300">
                {r.problem.display} → {r.problem.mode === 'smallest' ? 'smallest' : 'largest'}
              </div>
              <div className="text-primary mt-1">Answer: {r.problem.answer}</div>
              {!r.correct && <div className="text-red-400 mt-1">You: {r.userAnswer || '—'}</div>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={startGame} className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary-dark">
            Play Again
          </button>
          {!worksheetMode && (
            <button type="button" onClick={() => setPhase('config')} className="px-6 py-2 bg-surface-light rounded-lg font-semibold hover:bg-gray-600">
              Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Anagram</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            Digits: {lastResult.problem.display} — make the{' '}
            {lastResult.problem.mode === 'smallest' ? 'smallest' : 'largest'} number.
          </p>
          <p className="text-gray-400 font-mono">Correct: {lastResult.problem.answer}</p>
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">You: {lastResult.userAnswer || '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'playing' && problem) {
    const goal = problem.mode === 'smallest' ? 'smallest' : 'largest';
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Round {currentIdx + 1} / {allProblems.length}
          </span>
          <span className="text-primary">Rearrange</span>
        </div>
        <div className="bg-surface rounded-2xl p-8 border border-gray-700/50">
          <p className="text-2xl font-bold text-primary font-mono tracking-widest mb-2">{problem.display}</p>
          <p className="text-gray-400 mb-6">Make the <span className="text-accent font-semibold">{goal}</span> number using each digit once.</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-2xl font-mono focus:outline-none focus:border-primary text-primary"
            autoFocus
          />
        </div>
        <button type="button" onClick={submit} className="mt-4 px-8 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">
          Submit
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Number Anagram</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4 border border-gray-700/50">
        <p className="text-gray-400 text-sm">Reorder the digits to form the smallest or largest possible number.</p>
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
        <div>
          <label className="block text-sm text-gray-400 mb-1">Goal</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="mixed">Mixed</option>
            <option value="smallest">Smallest only</option>
            <option value="largest">Largest only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rounds</label>
          <select
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {[5, 8, 10, 12, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">
          Start
        </button>
      </div>
    </div>
  );
}
