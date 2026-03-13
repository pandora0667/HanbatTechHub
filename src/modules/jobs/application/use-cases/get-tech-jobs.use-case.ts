import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobPosting } from '../../interfaces/job-posting.interface';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingSearchService } from '../../domain/services/job-posting-search.service';
import { JobSearchQuery } from '../../domain/types/job-search-query.type';
import { PaginatedResult } from '../../domain/types/paginated-result.type';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { JobPostingCacheEntry } from '../ports/job-posting-cache.repository';
import { JOBS_CACHE_TTL } from '../../constants/redis.constant';
import { getJobSourceDescriptor } from '../../constants/job-source.constant';

@Injectable()
export class GetTechJobsUseCase {
  private readonly logger = new Logger(GetTechJobsUseCase.name);

  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    private readonly jobPostingSearchService: JobPostingSearchService,
    private readonly jobPostingCollectorService: JobPostingCollectorService,
  ) {}

  async execute(query: JobSearchQuery): Promise<PaginatedResult<JobPosting>> {
    try {
      const cacheKey =
        this.jobPostingSearchService.buildTechJobsCacheKey(query);
      const cachedJobs =
        await this.jobPostingCacheRepository.getSearchJobs(cacheKey);

      const jobsEntry =
        cachedJobs ?? (await this.fetchAndCacheJobs(cacheKey, query));

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
      this.logger.error(`Failed to fetch tech jobs: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to fetch job postings');
    }
  }

  private async fetchAndCacheJobs(
    cacheKey: string,
    query: JobSearchQuery,
  ): Promise<JobPostingCacheEntry> {
    const jobs = await this.jobPostingCollectorService.fetchAllJobs({
      company: query.company,
      continueOnError: !query.company,
    });

    const sourceIds = query.company
      ? [getJobSourceDescriptor(query.company).id]
      : Array.from(
          new Set(jobs.map((job) => getJobSourceDescriptor(job.company).id)),
        );
    const confidence = sourceIds.length === 1
      ? getJobSourceDescriptor(query.company ?? jobs[0]?.company).confidence
      : 0.75;
    const entry: JobPostingCacheEntry = {
      jobs,
      snapshot: buildSnapshotMetadata({
        collectedAt: new Date(),
        ttlSeconds: JOBS_CACHE_TTL,
        confidence,
        sourceIds,
      }),
    };

    await this.jobPostingCacheRepository.setSearchJobs(cacheKey, entry);
    return entry;
  }
}
