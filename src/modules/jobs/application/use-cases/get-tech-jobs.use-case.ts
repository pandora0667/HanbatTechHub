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

      const jobs =
        cachedJobs ?? (await this.fetchAndCacheJobs(cacheKey, query));

      const filteredJobs = this.jobPostingSearchService.filter(jobs, query);
      return this.jobPostingSearchService.paginate(filteredJobs, query);
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
  ): Promise<JobPosting[]> {
    const jobs = await this.jobPostingCollectorService.fetchAllJobs({
      company: query.company,
      continueOnError: !query.company,
    });

    await this.jobPostingCacheRepository.setSearchJobs(cacheKey, jobs);
    return jobs;
  }
}
