import { APP_CONFIG } from '../config/appConfig';

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
