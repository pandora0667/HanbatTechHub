import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';

export const JOB_POSTING_CACHE_REPOSITORY = 'JOB_POSTING_CACHE_REPOSITORY';

export interface JobPostingCacheRepository {
  initializeJobsCache(): Promise<void>;
  getSearchJobs(cacheKey: string): Promise<JobPosting[] | null>;
  setSearchJobs(cacheKey: string, jobs: JobPosting[]): Promise<void>;
  getCompanyJobs(company: CompanyType): Promise<JobPosting[] | null>;
  setCompanyJobs(company: CompanyType, jobs: JobPosting[]): Promise<void>;
  setAllJobs(jobs: JobPosting[]): Promise<void>;
  setLastUpdate(timestamp: string): Promise<void>;
}
