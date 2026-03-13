import { Inject, Injectable } from '@nestjs/common';
import { SnapshotMetadata } from '../../../../common/types/snapshot.types';
import { mergeSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { JOB_SOURCE_COMPANIES } from '../../constants/job-source.constant';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheEntry,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';

@Injectable()
export class JobPostingSnapshotReaderService {
  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
  ) {}

  async getResolvedAllJobs(): Promise<JobPostingCacheEntry | null> {
    const allJobsEntry = await this.jobPostingCacheRepository.getAllJobs();

    if (allJobsEntry && allJobsEntry.jobs.length > 0) {
      return allJobsEntry;
    }

    const companyEntries = await Promise.all(
      JOB_SOURCE_COMPANIES.map((company) =>
        this.jobPostingCacheRepository.getCompanyJobs(company),
      ),
    );
    const existingEntries = companyEntries.filter(
      (entry): entry is JobPostingCacheEntry => entry !== null,
    );

    if (existingEntries.length === 0) {
      return allJobsEntry;
    }

    const jobs = this.dedupeJobs(existingEntries.flatMap((entry) => entry.jobs));
    const snapshot = mergeSnapshotMetadata(
      existingEntries
        .map((entry) => entry.snapshot)
        .filter(
          (entry): entry is SnapshotMetadata => entry !== undefined,
        ),
    );

    if (!snapshot) {
      return allJobsEntry;
    }

    return {
      jobs,
      snapshot,
    };
  }

  async getResolvedCompanyJobs(
    company: CompanyType,
  ): Promise<JobPostingCacheEntry | null> {
    const companyEntry = await this.jobPostingCacheRepository.getCompanyJobs(company);
    if (companyEntry) {
      return companyEntry;
    }

    const allJobsEntry = await this.getResolvedAllJobs();
    if (!allJobsEntry) {
      return null;
    }

    return {
      jobs: allJobsEntry.jobs.filter((job) => job.company === company),
      snapshot: allJobsEntry.snapshot,
    };
  }

  private dedupeJobs(jobs: JobPosting[]): JobPosting[] {
    const deduped = new Map<string, JobPosting>();

    for (const job of jobs) {
      const key = `${job.company}:${job.id}:${job.url}`;
      const existing = deduped.get(key);

      if (!existing || job.updatedAt.getTime() > existing.updatedAt.getTime()) {
        deduped.set(key, job);
      }
    }

    return Array.from(deduped.values());
  }
}
