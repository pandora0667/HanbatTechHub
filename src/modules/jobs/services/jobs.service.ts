import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../../redis/redis.service';
import { IJobCrawler } from '../interfaces/job-crawler.interface';
import { CompanyType, JobPosting } from '../interfaces/job-posting.interface';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPostingResponseDto } from '../dto/responses/job-posting.response.dto';
import { SupportedCompaniesResponseDto } from '../dto/responses/supported-companies.response.dto';
import {
  REDIS_KEYS,
  JOBS_CACHE_TTL,
  JOBS_UPDATE_CRON,
  JOB_CRAWLING_CONFIG,
} from '../constants/redis.constant';
import { isBackgroundSyncEnabled } from '../../../common/utils/background-sync.util';
import {
  JOB_CRAWLER_REGISTRY,
  JobCrawlerRegistry,
} from '../application/ports/job-crawler-registry';
import { JobCrawlerExecutionService } from '../application/services/job-crawler-execution.service';
import { JobPostingSearchService } from '../domain/services/job-posting-search.service';
import { PaginatedResult } from '../domain/types/paginated-result.type';
import { JobPostingResponseMapper } from '../presentation/mappers/job-posting-response.mapper';
import { GetCompanyJobsUseCase } from '../application/use-cases/get-company-jobs.use-case';
import { GetSupportedCompaniesUseCase } from '../application/use-cases/get-supported-companies.use-case';

export type PaginatedResponse<T> = PaginatedResult<T>;

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private isUpdatingCache = false;

  constructor(
    private readonly redisService: RedisService,
    @Inject(JOB_CRAWLER_REGISTRY)
    private readonly jobCrawlerRegistry: JobCrawlerRegistry,
    private readonly jobCrawlerExecutionService: JobCrawlerExecutionService,
    private readonly jobPostingSearchService: JobPostingSearchService,
    private readonly jobPostingResponseMapper: JobPostingResponseMapper,
    private readonly getCompanyJobsUseCase: GetCompanyJobsUseCase,
    private readonly getSupportedCompaniesUseCase: GetSupportedCompaniesUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      this.logger.log(
        'ENABLE_BACKGROUND_SYNC=false, startup job sync is skipped.',
      );
      return;
    }

    await this.initializeJobs();
  }

  /**
   * 채용정보 서비스 초기화
   */
  private async initializeJobs(): Promise<void> {
    try {
      // Redis 캐시 초기화 (hbnu:jobs:* 패턴의 키만)
      await this.redisService.initializeServiceCache('hbnu:jobs');
      this.logger.log('Jobs cache initialized');

      // 초기 데이터 로드
      await this.updateJobCache();
      this.logger.log('Initial job data loaded');
    } catch (error) {
      this.logger.error(`Failed to initialize jobs: ${error.message}`);
    }
  }

  async getTechJobs(
    query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    try {
      const cacheKey = this.jobPostingSearchService.buildTechJobsCacheKey(query);

      const cachedData = await this.redisService.get<JobPosting[]>(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return this.buildSearchResponse(cachedData, query);
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      const jobs = await this.fetchAllTechJobs(query);

      await this.redisService.set(cacheKey, jobs, JOBS_CACHE_TTL);

      return this.buildSearchResponse(jobs, query);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch tech jobs: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to fetch job postings');
    }
  }

  async getCompanyTechJobs(
    company: CompanyType,
    query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    const result = await this.getCompanyJobsUseCase.execute(company, query);
    return this.jobPostingResponseMapper.toPaginatedResponse(result);
  }

  @Cron(JOBS_UPDATE_CRON)
  async updateJobCache(): Promise<void> {
    if (!isBackgroundSyncEnabled()) {
      return;
    }

    if (this.isUpdatingCache) {
      this.logger.warn('Job cache update is already running. Skipping overlap.');
      return;
    }

    this.isUpdatingCache = true;

    try {
      const now = new Date();
      this.logger.log(
        `Updating job cache... [KST: ${now.toLocaleTimeString('ko-KR')}]`,
      );

      // 메모리 피크를 줄이기 위해 회사별 크롤링을 순차 처리합니다.
      const allJobs: JobPosting[] = [];
      const crawlers = this.jobCrawlerRegistry.getAll();

      for (const [index, crawler] of crawlers.entries()) {
        const jobs = await this.updateCompanyJobs(crawler);
        allJobs.push(...jobs);

        if (index < crawlers.length - 1) {
          await this.coolDownBetweenCrawlerRuns();
        }
      }

      await this.redisService.set(REDIS_KEYS.JOBS_ALL, allJobs, JOBS_CACHE_TTL);

      // 마지막 업데이트 시간 기록
      await this.redisService.set(
        REDIS_KEYS.JOBS_LAST_UPDATE,
        now.toISOString(),
      );

      this.logger.log(
        `Job cache updated successfully [KST: ${new Date().toLocaleTimeString('ko-KR')}]`,
      );
    } catch (error) {
      this.logger.error(`Job cache update failed: ${error.message}`);
    } finally {
      this.isUpdatingCache = false;
    }
  }

  private async updateCompanyJobs(crawler: IJobCrawler): Promise<JobPosting[]> {
    try {
      this.logger.log(`Updating jobs for ${crawler.company}...`);

      // 재시도 로직을 포함한 데이터 가져오기
      const jobs = await this.executeWithRetry(
        () => crawler.fetchJobs(),
        `Updating cache for ${crawler.company}`,
      );

      // 회사별 캐시 키
      const companyKey = `${REDIS_KEYS.JOBS_COMPANY}${crawler.company}`;

      // 캐싱
      await this.redisService.set(companyKey, jobs, JOBS_CACHE_TTL);

      this.logger.log(`Updated ${jobs.length} jobs for ${crawler.company}`);
      return jobs;
    } catch (error) {
      this.logger.error(
        `Failed to update jobs for ${crawler.company}: ${error.message}`,
      );
      return [];
    }
  }

  private async coolDownBetweenCrawlerRuns(): Promise<void> {
    if (JOB_CRAWLING_CONFIG.REQUEST_DELAY <= 0) {
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, JOB_CRAWLING_CONFIG.REQUEST_DELAY),
    );
  }

  private async fetchAllTechJobs(
    query: GetJobsQueryDto,
  ): Promise<JobPosting[]> {
    try {
      const allJobs: JobPosting[] = [];
      const crawlers = query.company
        ? [this.requireCrawler(query.company)]
        : this.jobCrawlerRegistry.getAll();

      for (const crawler of crawlers) {
        try {
          const jobs = await this.jobCrawlerExecutionService.executeWithRetry(
            () => crawler.fetchJobs(),
            `Fetching jobs for ${crawler.company}`,
          );
          allJobs.push(...jobs);
        } catch (error) {
          this.logger.error(
            `Failed to fetch jobs for ${crawler.company}:`,
            error,
          );
          continue;
        }
      }

      return allJobs;
    } catch (error) {
      this.logger.error('Failed to fetch all tech jobs:', error);
      throw new InternalServerErrorException('Failed to fetch tech jobs');
    }
  }

  async getSupportedCompanies(): Promise<SupportedCompaniesResponseDto> {
    return this.getSupportedCompaniesUseCase.execute();
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    return this.jobCrawlerExecutionService.executeWithRetry(operation, context);
  }

  private buildSearchResponse(
    jobs: JobPosting[],
    query: GetJobsQueryDto,
  ): PaginatedResponse<JobPostingResponseDto> {
    const filteredJobs = this.jobPostingSearchService.filter(jobs, query);
    const paginatedJobs = this.jobPostingSearchService.paginate(
      filteredJobs,
      query,
    );

    return this.jobPostingResponseMapper.toPaginatedResponse(paginatedJobs);
  }

  private requireCrawler(company: CompanyType): IJobCrawler {
    const crawler = this.jobCrawlerRegistry.get(company);

    if (!crawler) {
      throw new InternalServerErrorException(
        `Crawler not found for company: ${company}`,
      );
    }

    return crawler;
  }
}
