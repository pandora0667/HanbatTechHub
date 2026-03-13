import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';

export const JOB_POSTING_CACHE_REPOSITORY = 'JOB_POSTING_CACHE_REPOSITORY';

export interface JobPostingCacheEntry {
  jobs: JobPosting[];
  snapshot: SnapshotMetadata;
}

export interface JobPostingCacheRepository {
  initializeJobsCache(): Promise<void>;
  getSearchJobs(cacheKey: string): Promise<JobPostingCacheEntry | null>;
  setSearchJobs(cacheKey: string, entry: JobPostingCacheEntry): Promise<void>;
  getCompanyJobs(company: CompanyType): Promise<JobPostingCacheEntry | null>;
  setCompanyJobs(
    company: CompanyType,
    entry: JobPostingCacheEntry,
  ): Promise<void>;
  getAllJobs(): Promise<JobPostingCacheEntry | null>;
  setAllJobs(entry: JobPostingCacheEntry): Promise<void>;
  getLastUpdate(): Promise<string | null>;
  setLastUpdate(timestamp: string): Promise<void>;
}
