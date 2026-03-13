import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { CompanyType, LocationType } from '../../interfaces/job-posting.interface';

export type JobPostingChangeType = 'new' | 'updated' | 'removed';

export interface JobPostingChangeSignal {
  type: 'job_change';
  changeType: JobPostingChangeType;
  jobId: string;
  company: CompanyType;
  title: string;
  department: string;
  field: string;
  url: string;
  locations: LocationType[];
  deadline: string;
  changedFields?: string[];
}

export interface JobPostingChangeSummary {
  total: number;
  created: number;
  updated: number;
  removed: number;
}

export interface JobPostingChangeResult {
  generatedAt: string;
  baselineCollectedAt?: string;
  snapshot?: SnapshotMetadata;
  summary: JobPostingChangeSummary;
  signals: JobPostingChangeSignal[];
}
