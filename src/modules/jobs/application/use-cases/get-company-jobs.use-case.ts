import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyType,
  JobPosting,
} from '../../interfaces/job-posting.interface';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingSearchService } from '../../domain/services/job-posting-search.service';
import { JobSearchQuery } from '../../domain/types/job-search-query.type';
import { PaginatedResult } from '../../domain/types/paginated-result.type';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { JOBS_FRESHNESS_TTL } from '../../constants/redis.constant';
import { JobPostingCacheEntry } from '../ports/job-posting-cache.repository';
import { getJobSourceDescriptor } from '../../constants/job-source.constant';

@Injectable()
export class GetCompanyJobsUseCase {
  private readonly logger = new Logger(GetCompanyJobsUseCase.name);

  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly jobPostingCollectorService: JobPostingCollectorService,
    private readonly jobPostingSearchService: JobPostingSearchService,
  ) {}

  async execute(
    company: CompanyType,
    query: JobSearchQuery,
  ): Promise<PaginatedResult<JobPosting>> {
    try {
      const cachedJobs =
        await this.jobPostingCacheRepository.getCompanyJobs(company);
      const jobsEntry =
        cachedJobs ?? (await this.fetchAndCacheCompanyJobs(company));

      const filteredJobs = this.jobPostingSearchService.filter(
        jobsEntry.jobs,
        query,
      );
      const paginated = this.jobPostingSearchService.paginate(filteredJobs, query);

      return {
        ...paginated,
        meta: {
          ...paginated.meta,
          snapshot: jobsEntry.snapshot,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch ${company} tech jobs: ${errorMessage}`,
      );
      throw new InternalServerErrorException(
        `Failed to fetch ${company} job postings`,
      );
    }
  }

  private async fetchAndCacheCompanyJobs(
    company: CompanyType,
  ): Promise<JobPostingCacheEntry> {
    const jobs =
      await this.jobPostingCollectorService.fetchCompanyJobs(company);

    const source = getJobSourceDescriptor(company);
    const entry: JobPostingCacheEntry = {
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_FRESHNESS_TTL,
        confidence: source.confidence,
        sourceIds: [source.id],
      }),
    };

    await this.jobPostingCacheRepository.setCompanyJobs(company, entry);
    return entry;
  }
}
