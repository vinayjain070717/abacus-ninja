import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';

type PhaseKind = 'work' | 'break' | 'longBreak';

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimer() {
  const { workMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak } = APP_CONFIG.focusTimer;

  const workSec = workMinutes * 60;
  const breakSec = breakMinutes * 60;
  const longBreakSec = longBreakMinutes * 60;

  const [phaseKind, setPhaseKind] = useState<PhaseKind>('work');
  const [remaining, setRemaining] = useState(workSec);
  const [running, setRunning] = useState(false);

  const phaseRef = useRef<PhaseKind>('work');
  phaseRef.current = phaseKind;
  const workSessionsDoneRef = useRef(0);

  const reset = useCallback(() => {
    setRunning(false);
    workSessionsDoneRef.current = 0;
    setPhaseKind('work');
    phaseRef.current = 'work';
    setRemaining(workSec);
  }, [workSec]);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;

        const pk = phaseRef.current;
        if (pk === 'work') {
          workSessionsDoneRef.current += 1;
          const n = workSessionsDoneRef.current;
          if (n % sessionsBeforeLongBreak === 0) {
            setPhaseKind('longBreak');
            phaseRef.current = 'longBreak';
            return longBreakSec;
          }
          setPhaseKind('break');
          phaseRef.current = 'break';
          return breakSec;
        }

        setPhaseKind('work');
        phaseRef.current = 'work';
        return workSec;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, workSec, breakSec, longBreakSec, sessionsBeforeLongBreak]);

  return (
    <div className="rounded-xl border border-gray-600 bg-surface p-3 w-full max-w-[220px] shadow-lg">
      <div
        className={`text-center text-xs font-bold uppercase tracking-wide mb-2 rounded-md py-1 ${
          phaseKind === 'work'
            ? 'bg-red-900/50 text-red-200'
            : phaseKind === 'break'
              ? 'bg-green-900/50 text-green-200'
              : 'bg-emerald-900/50 text-emerald-200'
        }`}
      >
        {phaseKind === 'work' ? 'Focus' : phaseKind === 'break' ? 'Break' : 'Long break'}
      </div>
      <div className="text-center font-mono text-2xl font-bold tabular-nums mb-3">{formatMmSs(remaining)}</div>
      <div className="flex gap-1.5 justify-center">
        <button
          type="button"
          onClick={() => setRunning((x) => !x)}
          className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-surface-light px-2 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-500">
        Work {workMinutes}m · Break {breakMinutes}m · Long {longBreakMinutes}m / {sessionsBeforeLongBreak} sessions
      </p>
    </div>
  );
}
