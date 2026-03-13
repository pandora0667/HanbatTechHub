import { SnapshotMetadata } from '../../../../common/types/snapshot.types';

export type OpportunitySignalSeverity = 'closing_today' | 'closing_soon' | 'watch';

export interface OpportunitySignal {
  type: 'job_deadline';
  severity: OpportunitySignalSeverity;
  id: string;
  company: string;
  title: string;
  department: string;
  field: string;
  deadline: string;
  daysRemaining: number;
  url: string;
  locations: string[];
}

export interface OpportunitySignalSummary {
  total: number;
  closingToday: number;
  closingSoon: number;
  watch: number;
  windowDays: number;
}

export interface OpportunitySignalResult {
  generatedAt: string;
  snapshot?: SnapshotMetadata;
  summary: OpportunitySignalSummary;
  signals: OpportunitySignal[];
}
