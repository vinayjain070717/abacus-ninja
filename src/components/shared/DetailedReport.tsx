import { useState, useEffect } from 'react';
import type { ReportData, ReportSection } from '../../types/report';
import { calculatePercentage, formatTime, getGrade, generateSuggestions } from '../../utils/scoring';
import { SoundManager } from '../../utils/sounds';
import { useStreak } from '../../hooks/useStreak';
import { usePersonalBest } from '../../hooks/usePersonalBest';

interface DetailedReportProps {
  data: ReportData;
  onPlayAgain: () => void;
  onSettings?: () => void;
  onPrint?: () => void;
  extraActions?: React.ReactNode;
  gameId?: string;
}

function TimeBar({ spent, ideal }: { spent: number; ideal: number }) {
  if (ideal <= 0) return null;
  const ratio = Math.min(spent / ideal, 2);
  const pct = Math.min(ratio * 100, 100);
  const overPct = ratio > 1 ? Math.min((ratio - 1) * 100, 100) : 0;
  const isOver = spent > ideal;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Your time: {formatTime(spent)}</span>
        <span>Target: {formatTime(ideal)}</span>
      </div>
      <div className="h-2 bg-surface-light rounded-full overflow-hidden relative">
        {!isOver ? (
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <>
            <div className="h-full bg-green-500 rounded-l-full absolute inset-y-0 left-0" style={{ width: '50%' }} />
            <div
              className="h-full bg-red-500 rounded-r-full absolute inset-y-0 left-1/2"
              style={{ width: `${Math.min(overPct, 50)}%` }}
            />
          </>
        )}
      </div>
      <div className="text-xs text-right">
        {isOver ? (
          <span className="text-red-400">{formatTime(spent - ideal)} over target</span>
        ) : (
          <span className="text-green-400">{formatTime(ideal - spent)} under target</span>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: ReportSection }) {
  const [expanded, setExpanded] = useState(false);
  const pct = calculatePercentage(section.score, section.total);
  const grade = getGrade(pct);
  const hasDetails = section.details && section.details.length > 0;

  return (
    <div className="bg-surface rounded-xl border border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full text-left p-4 ${hasDetails ? 'cursor-pointer hover:bg-surface-light/50' : 'cursor-default'} transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>{section.icon}</span>
            <div>
              <h4 className="font-semibold text-white text-sm">{section.label}</h4>
              <p className="text-xs text-gray-500">{formatTime(section.timeSpentSec)}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
            <div>
              <div className="font-bold text-white tabular-nums">
                {section.score}/{section.total}
              </div>
              <div className={`text-xs font-medium ${grade.color}`}>{pct}% &middot; {grade.label}</div>
            </div>
            {hasDetails && (
              <span className={`text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                &#9662;
              </span>
            )}
          </div>
        </div>
        <TimeBar spent={section.timeSpentSec} ideal={section.idealTimeSec} />
      </button>

      {expanded && hasDetails && (
        <div data-print-expand className="border-t border-gray-700 max-h-60 overflow-y-auto">
          {section.details!.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-2 text-xs border-b border-gray-800 last:border-b-0 ${
                d.correct ? 'bg-green-900/10' : 'bg-red-900/10'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={d.correct ? 'text-green-400' : 'text-red-400'}>
                  {d.correct ? '✓' : '✗'}
                </span>
                <span className="font-mono text-gray-300 truncate">{d.display}</span>
              </div>
              <div className="shrink-0 text-right ml-3">
                {!d.correct && d.correctAnswer && (
                  <span className="text-gray-400">Ans: {d.correctAnswer}</span>
                )}
                {!d.correct && d.userAnswer && (
                  <span className="text-red-400 ml-2">You: {d.userAnswer}</span>
                )}
                {d.timeSec !== undefined && (
                  <span className="text-gray-500 ml-2">{d.timeSec.toFixed(1)}s</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareButton({ data, pct, totalScore, totalProblems, grade }: {
  data: ReportData; pct: number; totalScore: number; totalProblems: number; grade: { label: string };
}) {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    const text = `${data.title} | ${pct}% (${totalScore}/${totalProblems}) | ${formatTime(data.totalTimeSec)} | ${grade.label} | abacusninja.vercel.app`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleShare}
      className="px-5 py-2 bg-surface-light rounded-xl font-semibold text-gray-300 hover:bg-gray-600 text-sm"
    >
      {copied ? '✓ Copied!' : '📤 Share'}
    </button>
  );
}

export default function DetailedReport({ data, onPlayAgain, onSettings, onPrint, extraActions, gameId }: DetailedReportProps) {
  const totalScore = data.sections.reduce((s, sec) => s + sec.score, 0);
  const totalProblems = data.sections.reduce((s, sec) => s + sec.total, 0);
  const pct = calculatePercentage(totalScore, totalProblems);
  const grade = getGrade(pct);
  const totalIdeal = data.sections.reduce((s, sec) => s + sec.idealTimeSec, 0);
  const [isNewPB, setIsNewPB] = useState(false);

  const { recordPractice } = useStreak();
  const { recordScore } = usePersonalBest(gameId);
  useEffect(() => {
    SoundManager.play('complete');
    recordPractice();
    if (gameId && totalProblems > 0) {
      const newBest = recordScore(totalScore, totalProblems);
      if (newBest) setIsNewPB(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* ── Summary Header ── */}
      <div className="text-center">
        {isNewPB && (
          <div className="inline-block bg-yellow-500/20 border border-yellow-500/50 rounded-xl px-4 py-2 mb-3">
            <span className="text-yellow-400 font-bold text-sm">🏆 New Personal Best!</span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-1">{data.title}</h2>
        {data.subtitle && <p className="text-sm text-gray-400 mb-4">{data.subtitle}</p>}
      </div>

      <div className="bg-surface rounded-2xl p-6 text-center border border-gray-700">
        <div className="text-4xl font-bold text-white mb-1 tabular-nums">{formatTime(data.totalTimeSec)}</div>
        <div className="text-gray-500 text-sm mb-3">Total Time</div>

        <div className={`text-2xl font-bold mb-1 ${grade.color}`}>
          {totalScore}/{totalProblems} ({pct}%)
        </div>
        <div className={`text-sm font-semibold ${grade.color}`}>{grade.label}</div>

        {totalIdeal > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            Target time: {formatTime(totalIdeal)}
            {data.totalTimeSec <= totalIdeal ? (
              <span className="text-green-400 ml-2">&#9650; {formatTime(totalIdeal - data.totalTimeSec)} faster</span>
            ) : (
              <span className="text-red-400 ml-2">&#9660; {formatTime(data.totalTimeSec - totalIdeal)} slower</span>
            )}
          </div>
        )}
      </div>

      {/* ── Section Breakdown ── */}
      {data.sections.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Section Breakdown</h3>
          <div className="space-y-3">
            {data.sections.map((sec, i) => (
              <SectionCard key={i} section={sec} />
            ))}
          </div>
        </div>
      )}

      {/* Single section: still show expandable details */}
      {data.sections.length === 1 && (
        <SectionCard section={data.sections[0]} />
      )}

      {/* ── Improvement Suggestions ── */}
      {(() => {
        const tips = data.suggestions ?? generateSuggestions(data.sections);
        if (tips.length === 0) return null;
        return (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">How to Improve</h3>
            <div className="space-y-3">
              {tips.map((s, i) => (
                <div key={i} className="bg-surface rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                  </div>
                  <ul className="space-y-1">
                    {s.tips.map((tip, j) => (
                      <li key={j} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-gray-600 shrink-0">-</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Actions ── */}
      <div className="flex gap-3 justify-center flex-wrap no-print">
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="px-5 py-2 bg-surface-light rounded-xl font-semibold text-gray-300 hover:bg-gray-600 text-sm"
          >
            🖨️ Print
          </button>
        )}
        <ShareButton data={data} pct={pct} totalScore={totalScore} totalProblems={totalProblems} grade={grade} />
        <button
          type="button"
          onClick={onPlayAgain}
          className="px-6 py-2 bg-primary rounded-xl font-semibold hover:bg-primary/90 text-white"
        >
          Play Again
        </button>
        {onSettings && (
          <button
            type="button"
            onClick={onSettings}
            className="px-5 py-2 bg-surface-light rounded-xl font-semibold text-gray-300 hover:bg-gray-600 text-sm"
          >
            Settings
          </button>
        )}
        {extraActions}
      </div>
    </div>
  );
}
