export interface ReportDetail {
  display: string;
  correct: boolean;
  correctAnswer?: string;
  userAnswer?: string;
  timeSec?: number;
}

export interface ReportSection {
  label: string;
  icon: string;
  score: number;
  total: number;
  timeSpentSec: number;
  idealTimeSec: number;
  details?: ReportDetail[];
}

export interface ReportSuggestion {
  icon: string;
  title: string;
  tips: string[];
}

export interface ReportData {
  title: string;
  subtitle?: string;
  totalTimeSec: number;
  sections: ReportSection[];
  suggestions?: ReportSuggestion[];
}
