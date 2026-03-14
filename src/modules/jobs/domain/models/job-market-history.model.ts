import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { CompanyType } from '../../interfaces/job-posting.interface';

export interface JobMarketHistorySummary {
  totalOpenOpportunities: number;
  companiesHiring: number;
  fieldsTracked: number;
  skillsTracked: number;
}

export interface JobMarketHistoryCompanyItem {
  company: CompanyType;
  openJobs: number;
  fields: number;
  skills: number;
}

export interface JobMarketHistoryFieldItem {
  field: string;
  openJobs: number;
  companies: number;
}

export interface JobMarketHistorySkillItem {
  skill: string;
  demandCount: number;
  companyCount: number;
}

export interface JobMarketHistoryEntry {
  snapshot: SnapshotMetadata;
  summary: JobMarketHistorySummary;
  companies: JobMarketHistoryCompanyItem[];
  fields: JobMarketHistoryFieldItem[];
  skills: JobMarketHistorySkillItem[];
}
