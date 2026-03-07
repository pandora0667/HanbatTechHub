import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';

export const JOB_POSTING_CACHE_REPOSITORY = 'JOB_POSTING_CACHE_REPOSITORY';

export interface JobPostingCacheRepository {
  getCompanyJobs(company: CompanyType): Promise<JobPosting[] | null>;
  setCompanyJobs(company: CompanyType, jobs: JobPosting[]): Promise<void>;
}
