import { useState, useRef } from 'react';
import { generateNumberSequence, type SequenceProblem } from '../../utils/problemGenerator';
import type { Difficulty } from '../../config/appConfig';
import { APP_CONFIG } from '../../config/appConfig';
import DifficultySelector from '../shared/DifficultySelector';
import RoundFeedback from '../shared/RoundFeedback';
import DetailedReport from '../shared/DetailedReport';
import type { ReportData } from '../../types/report';

type Phase = 'config' | 'playing' | 'feedback' | 'results';

interface RoundResult {
  problem: SequenceProblem;
  userAnswer: number | null;
  correct: boolean;
}

const SEQ_LEVEL: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 4,
};

export default function NumberSequence({ worksheetMode, onComplete }: {
  worksheetMode?: { rounds: number; difficulty?: Difficulty };
  onComplete?: (score: number, total: number) => void;
}) {
  const initialLevel = SEQ_LEVEL[worksheetMode?.difficulty ?? 'medium'];

  const [phase, setPhase] = useState<Phase>(worksheetMode ? 'playing' : 'config');
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const effectiveDiff = worksheetMode?.difficulty ?? gameDifficulty;
  const [totalRounds, setTotalRounds] = useState(worksheetMode?.rounds ?? 10);

  const [allProblems, setAllProblems] = useState<SequenceProblem[]>(() =>
    worksheetMode ? Array.from({ length: worksheetMode.rounds }, () => generateNumberSequence(initialLevel)) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<RoundResult[]>([]);
  resultsRef.current = results;

  const startGame = () => {
    startTimeRef.current = Date.now();
    const level = SEQ_LEVEL[effectiveDiff];
    const ps = Array.from({ length: totalRounds }, () => generateNumberSequence(level));
    setAllProblems(ps);
    setCurrentIdx(0);
    setResults([]);
    setAnswer('');
    setLastResult(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitAnswer = () => {
    const problem = allProblems[currentIdx];
    const userAns = answer.trim() === '' ? null : parseInt(answer);
    const correct = userAns === problem.answer;
    const result = { problem, userAnswer: userAns, correct };
    setResults((prev) => [...prev, result]);
    setAnswer('');
    setLastResult(result);
    setPhase('feedback');
  };

  const advanceFromFeedback = () => {
    setLastResult(null);
    if (currentIdx + 1 < allProblems.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
      setPhase('playing');
    } else {
      const prev = resultsRef.current;
      const score = prev.filter((r) => r.correct).length;
      if (worksheetMode && onComplete) {
        onComplete(score, prev.length);
        return;
      }
      setPhase('results');
    }
  };

  if (phase === 'feedback' && lastResult) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>
            Problem {currentIdx + 1} / {allProblems.length}
          </span>
          <span>Number Sequence</span>
        </div>
        <RoundFeedback
          correct={lastResult.correct}
          onNext={advanceFromFeedback}
          isLastRound={currentIdx + 1 >= allProblems.length}
        >
          <p className="text-gray-300">
            {lastResult.problem.sequence.join(', ')},{' '}
            <span className="font-bold text-accent">{lastResult.problem.answer}</span>
          </p>
          {'rule' in lastResult.problem && lastResult.problem.rule && (
            <p className="text-gray-500 text-xs">Pattern: {lastResult.problem.rule}</p>
          )}
          {!lastResult.correct && (
            <p className="text-red-400 font-mono">Your answer: {lastResult.userAnswer ?? '—'}</p>
          )}
        </RoundFeedback>
      </div>
    );
  }

  if (phase === 'results') {
    const totalTimeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const idealPerRound = (APP_CONFIG.idealTimes.brainGamePerRound as Record<string, number>)[effectiveDiff] || 12;
    const reportData: ReportData = {
      title: 'Number Sequence',
      subtitle: `${effectiveDiff} · ${results.length} rounds`,
      totalTimeSec,
      sections: [{
        label: 'Number Sequence', icon: '🔢',
        score: results.filter((r) => r.correct).length, total: results.length,
        timeSpentSec: totalTimeSec, idealTimeSec: idealPerRound * results.length,
        details: results.map((r) => ({
          display: `${r.problem.sequence.join(', ')}, ?`,
          correct: r.correct,
          correctAnswer: String(r.problem.answer),
          userAnswer: r.userAnswer != null ? String(r.userAnswer) : '—',
        })),
      }],
    };
    return <DetailedReport data={reportData} onPlayAgain={startGame} onSettings={worksheetMode ? undefined : () => setPhase('config')} />;
  }

  if (phase === 'playing' && allProblems.length > 0) {
    const problem = allProblems[currentIdx];
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-between mb-4 text-sm text-gray-400">
          <span>Problem {currentIdx + 1} / {allProblems.length}</span>
          <span>Number Sequence</span>
        </div>
        <div className="bg-surface rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {problem.sequence.map((n, i) => (
              <div key={i} className="w-14 h-14 flex items-center justify-center bg-surface-light rounded-xl text-xl font-bold">{n}</div>
            ))}
            <div className="w-14 h-14 flex items-center justify-center border-2 border-dashed border-accent rounded-xl text-xl text-accent font-bold">?</div>
          </div>
          <p className="text-gray-400 text-sm mt-4">What comes next?</p>
        </div>
        <div className="flex gap-3 justify-center">
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            className="w-32 px-4 py-3 bg-surface-light border border-gray-600 rounded-lg text-center text-xl font-mono focus:outline-none focus:border-primary"
            autoFocus
          />
          <button onClick={submitAnswer} className="px-6 py-3 bg-accent rounded-lg font-bold hover:bg-accent-dark">Submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Number Sequence</h2>
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <p className="text-gray-400 text-sm">Find the pattern and fill in the missing number.</p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Problems</label>
          <select value={totalRounds} onChange={e => setTotalRounds(Number(e.target.value))} className="w-full bg-surface-light border border-gray-600 rounded-lg px-3 py-2 text-white">
            {[5, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <DifficultySelector value={gameDifficulty} onChange={setGameDifficulty} />
        <button onClick={startGame} className="w-full py-3 bg-accent rounded-lg font-bold text-lg hover:bg-accent-dark">Start</button>
      </div>
    </div>
  );
}
