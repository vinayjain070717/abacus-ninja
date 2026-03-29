import { APP_CONFIG } from '../config/appConfig';
import type { ReportSection, ReportSuggestion } from '../types/report';

export function calculatePercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function shouldLevelUp(percentage: number): boolean {
  return percentage >= APP_CONFIG.scoring.levelUpThreshold;
}

export function getGrade(percentage: number): { label: string; color: string } {
  for (const grade of APP_CONFIG.scoring.grades) {
    if (percentage >= grade.min) return { label: grade.label, color: grade.color };
  }
  return { label: 'Needs Work', color: 'text-red-400' };
}

export function generateSuggestions(sections: ReportSection[]): ReportSuggestion[] {
  if (sections.length === 0) return [];
  const suggestions: ReportSuggestion[] = [];

  const withPct = sections
    .filter((s) => s.total > 0)
    .map((s) => ({ ...s, pct: calculatePercentage(s.score, s.total) }));

  if (withPct.length === 0) return [];

  const weakest = withPct.reduce((a, b) => (a.pct < b.pct ? a : b));

  if (weakest.pct < 90) {
    const tips: string[] = [];
    if (weakest.pct < 50) {
      tips.push(`You got ${weakest.score}/${weakest.total} correct — start with easier difficulty to build confidence.`);
      tips.push('Focus on accuracy first, then gradually increase speed.');
    } else if (weakest.pct < 70) {
      tips.push(`Accuracy is ${weakest.pct}% — practice this section daily for 5 minutes.`);
      tips.push('Review the problems you got wrong and try similar ones.');
    } else {
      tips.push(`Almost there at ${weakest.pct}% — a few more practice sessions will get you to mastery.`);
    }
    tips.push('Consistency beats intensity — short daily practice is more effective than long occasional sessions.');
    suggestions.push({ icon: '🎯', title: `Weakest area: ${weakest.label}`, tips });
  }

  const overTime = withPct
    .filter((s) => s.idealTimeSec > 0 && s.timeSpentSec > s.idealTimeSec)
    .sort((a, b) => (b.timeSpentSec - b.idealTimeSec) - (a.timeSpentSec - a.idealTimeSec));

  if (overTime.length > 0) {
    const slowest = overTime[0];
    const overBy = slowest.timeSpentSec - slowest.idealTimeSec;
    const tips: string[] = [
      `You took ${formatTime(overBy)} longer than the target time.`,
      'Try timed drills at a lower difficulty to build speed.',
    ];
    if (slowest.pct >= 85) {
      tips.push('Your accuracy is great — now focus on getting faster with the same problems.');
    }
    suggestions.push({ icon: '⏱', title: `Slowest section: ${slowest.label}`, tips });
  }

  if (suggestions.length === 0 && withPct.every((s) => s.pct >= 90)) {
    suggestions.push({
      icon: '🏆',
      title: 'Excellent performance!',
      tips: [
        'You scored 90%+ across all sections — great work!',
        'Try increasing the difficulty or moving to the next level.',
        'Challenge yourself with timed mode for even faster results.',
      ],
    });
  }

  return suggestions;
}
