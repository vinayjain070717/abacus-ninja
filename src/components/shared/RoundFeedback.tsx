import { useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';

interface RoundFeedbackProps {
  correct: boolean;
  onNext: () => void;
  children: React.ReactNode;
  isLastRound?: boolean;
}

export default function RoundFeedback({ correct, onNext, children, isLastRound }: RoundFeedbackProps) {
  const duration = APP_CONFIG.ui.roundFeedbackMs;
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  useEffect(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const ms = Date.now() - start;
      setElapsed(ms);
      if (ms >= duration) {
        if (timerRef.current) clearInterval(timerRef.current);
        onNextRef.current();
      }
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration]);

  const progress = Math.min(elapsed / duration, 1);

  return (
    <div
      role="alert"
      className={`rounded-xl border p-5 ${correct ? 'bg-green-900/20 border-green-700/60' : 'bg-red-900/20 border-red-700/60'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-lg font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>
          {correct ? '✓ Correct!' : '✗ Wrong'}
        </span>
      </div>

      <div className="text-sm space-y-1 mb-4">
        {children}
      </div>

      <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-none rounded-full ${correct ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <button
        onClick={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          onNext();
        }}
        className="w-full py-2 bg-accent rounded-lg font-bold text-sm hover:bg-accent-dark"
      >
        {isLastRound ? 'See Results' : 'Next →'}
      </button>
    </div>
  );
}
