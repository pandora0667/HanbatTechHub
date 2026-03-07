import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GetJobsQueryDto } from '../../dto/requests/get-jobs-query.dto';
import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import {
  JOB_CRAWLER_REGISTRY,
  JobCrawlerRegistry,
} from '../ports/job-crawler-registry';
import { JobCrawlerExecutionService } from '../services/job-crawler-execution.service';
import { JobPostingSearchService } from '../../domain/services/job-posting-search.service';
import { PaginatedResult } from '../../domain/types/paginated-result.type';

@Injectable()
export class GetCompanyJobsUseCase {
  private readonly logger = new Logger(GetCompanyJobsUseCase.name);

  constructor(
    @Inject(JOB_POSTING_CACHE_REPOSITORY)
    private readonly jobPostingCacheRepository: JobPostingCacheRepository,
    @Inject(JOB_CRAWLER_REGISTRY)
    private readonly jobCrawlerRegistry: JobCrawlerRegistry,
    private readonly jobCrawlerExecutionService: JobCrawlerExecutionService,
    private readonly jobPostingSearchService: JobPostingSearchService,
  ) {}

  async execute(
    company: CompanyType,
    query: GetJobsQueryDto,
  ): Promise<PaginatedResult<JobPosting>> {
    try {
      const crawler = this.jobCrawlerRegistry.get(company);
      if (!crawler) {
        throw new NotFoundException(`Crawler not found for company: ${company}`);
      }

      const cachedJobs =
        await this.jobPostingCacheRepository.getCompanyJobs(company);
      const jobs =
        cachedJobs ??
        (await this.fetchAndCacheCompanyJobs(company, () => crawler.fetchJobs()));

      const filteredJobs = this.jobPostingSearchService.filter(jobs, query);
      return this.jobPostingSearchService.paginate(filteredJobs, query);
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
    fetchJobs: () => Promise<JobPosting[]>,
  ): Promise<JobPosting[]> {
    const jobs = await this.jobCrawlerExecutionService.executeWithRetry(
      fetchJobs,
      `Fetching jobs for ${company}`,
    );

    await this.jobPostingCacheRepository.setCompanyJobs(company, jobs);
    return jobs;
  }
}
