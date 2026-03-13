import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { CompanyType } from '../../../jobs/interfaces/job-posting.interface';

export interface SkillSignalSampleRole {
  company: CompanyType;
  title: string;
  department: string;
  field: string;
  url: string;
}

export interface SkillSignalItem {
  skill: string;
  demandCount: number;
  companyCount: number;
  companies: CompanyType[];
  sampleRoles: SkillSignalSampleRole[];
}

export interface SkillSignalSummary {
  totalJobs: number;
  jobsWithSkills: number;
  coverageRatio: number;
  totalSkills: number;
}

export interface SkillSignalResult {
  generatedAt: string;
  snapshot?: SnapshotMetadata;
  summary: SkillSignalSummary;
  skills: SkillSignalItem[];
}
