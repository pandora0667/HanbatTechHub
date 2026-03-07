import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../../redis/redis.service';
import { IJobCrawler } from '../interfaces/job-crawler.interface';
import { CompanyType, JobPosting } from '../interfaces/job-posting.interface';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPostingResponseDto } from '../dto/responses/job-posting.response.dto';
import { SupportedCompaniesResponseDto } from '../dto/responses/supported-companies.response.dto';
import { CRAWLER_TOKEN } from '../crawlers';
import {
  REDIS_KEYS,
  JOBS_CACHE_TTL,
  JOBS_UPDATE_CRON,
  JOB_CRAWLING_CONFIG,
} from '../constants/redis.constant';
import { isBackgroundSyncEnabled } from '../../../common/utils/background-sync.util';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private readonly crawlers: Map<CompanyType, IJobCrawler>;
  private isUpdatingCache = false;

  constructor(
    private readonly redisService: RedisService,
    @Inject(CRAWLER_TOKEN) private readonly jobCrawlers: IJobCrawler[],
  ) {
    this.crawlers = new Map(
      jobCrawlers.map((crawler) => [crawler.company, crawler]),
    );
  }

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

  /**
   * 재시도 로직을 포함한 함수 실행 헬퍼
   * @param operation 실행할 작업 함수
   * @param context 로깅을 위한 컨텍스트 정보
   * @param config 재시도 설정
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    config = JOB_CRAWLING_CONFIG,
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = config.INITIAL_DELAY;

    for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // 마지막 시도면 예외 발생
        if (attempt === config.MAX_RETRIES) {
          this.logger.error(
            `Failed after ${config.MAX_RETRIES} attempts: ${context}. Error: ${error.message}`,
          );
          break;
        }

        // 재시도 지연 계산 (지터 추가)
        const jitter = Math.floor(Math.random() * config.JITTER);
        const retryDelay = delay + jitter;

        this.logger.warn(
          `Attempt ${attempt} failed: ${context}. Retrying in ${retryDelay}ms. Error: ${error.message}`,
        );

        // 지연 후 재시도
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // 다음 재시도의 지연 시간 증가 (지수 백오프)
        delay *= config.BACKOFF_FACTOR;
      }
    }

    throw lastError;
  }

  async getTechJobs(
    query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    try {
      // 캐시 키 생성
      const cacheKey = this.generateCacheKey(query);

      // 캐시에서 데이터 조회
      const cachedData = await this.redisService.get<JobPosting[]>(cacheKey);

      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        const filteredJobs = this.filterJobs(cachedData, query);
        const transformedJobs = this.transformToResponse(filteredJobs);
        return this.paginateResponse(transformedJobs, query);
      }

      // 캐시에 없는 경우 데이터 가져오기
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      const jobs = await this.fetchAllTechJobs(query);

      // 필터링 전 모든 데이터 캐싱
      await this.redisService.set(cacheKey, jobs, JOBS_CACHE_TTL);

      // 필터링 및 페이지네이션 처리
      const filteredJobs = this.filterJobs(jobs, query);
      const transformedJobs = this.transformToResponse(filteredJobs);
      return this.paginateResponse(transformedJobs, query);
    } catch (error) {
      this.logger.error(`Failed to fetch tech jobs: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch job postings');
    }
  }

  async getCompanyTechJobs(
    company: CompanyType,
    query: GetJobsQueryDto,
  ): Promise<PaginatedResponse<JobPostingResponseDto>> {
    try {
      const crawler = this.crawlers.get(company);
      if (!crawler) {
        throw new NotFoundException(`Crawler not found for company: ${company}`);
      }

      // 캐시 키 생성
      const cacheKey = `${REDIS_KEYS.JOBS_COMPANY}${company}`;

      // 캐시에서 데이터 조회
      const cachedData = await this.redisService.get<JobPosting[]>(cacheKey);

      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        const filteredJobs = this.filterJobs(cachedData, query);
        const transformedJobs = this.transformToResponse(filteredJobs);
        return this.paginateResponse(transformedJobs, query);
      }

      // 캐시에 없는 경우 데이터 가져오기 (재시도 로직 적용)
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      const jobs = await this.executeWithRetry(
        () => crawler.fetchJobs(),
        `Fetching jobs for ${company}`,
      );

      // 데이터 캐싱
      await this.redisService.set(cacheKey, jobs, JOBS_CACHE_TTL);

      // 필터링 및 페이지네이션 처리
      const filteredJobs = this.filterJobs(jobs, query);
      const transformedJobs = this.transformToResponse(filteredJobs);
      return this.paginateResponse(transformedJobs, query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch ${company} tech jobs: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to fetch ${company} job postings`,
      );
    }
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
      const crawlers = Array.from(this.crawlers.values());

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
      // 특정 회사가 지정된 경우 해당 회사의 채용정보만 조회
      if (query.company) {
        const crawler = this.crawlers.get(query.company);
        if (!crawler) {
          throw new NotFoundException(
            `Crawler not found for company: ${query.company}`,
          );
        }
        return await this.executeWithRetry(
          () => crawler.fetchJobs(),
          `Fetching jobs for ${query.company}`,
        );
      }

      // 모든 회사의 채용정보 조회
      const allJobs: JobPosting[] = [];
      for (const [company, crawler] of this.crawlers) {
        try {
          const jobs = await this.executeWithRetry(
            () => crawler.fetchJobs(),
            `Fetching jobs for ${company}`,
          );
          allJobs.push(...jobs);
        } catch (error) {
          this.logger.error(`Failed to fetch jobs for ${company}:`, error);
          // 한 회사 실패해도 다른 회사는 계속 진행
          continue;
        }
      }

      return allJobs;
    } catch (error) {
      this.logger.error('Failed to fetch all tech jobs:', error);
      throw new InternalServerErrorException('Failed to fetch tech jobs');
    }
  }

  private filterJobs(jobs: JobPosting[], query: GetJobsQueryDto): JobPosting[] {
    let filteredJobs = jobs;

    if (query.department) {
      filteredJobs = filteredJobs.filter((job) =>
        job.department.toLowerCase().includes(query.department!.toLowerCase()),
      );
    }

    if (query.field) {
      filteredJobs = filteredJobs.filter((job) =>
        job.field.toLowerCase().includes(query.field!.toLowerCase()),
      );
    }

    if (query.career) {
      filteredJobs = filteredJobs.filter(
        (job) => job.requirements.career === query.career,
      );
    }

    if (query.employmentType) {
      filteredJobs = filteredJobs.filter(
        (job) => job.employmentType === query.employmentType,
      );
    }

    if (query.location) {
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.includes(query.location!),
      );
    }

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      filteredJobs = filteredJobs.filter((job) => {
        // 제목과 설명에서 검색
        const titleMatch = job.title.toLowerCase().includes(keyword);
        const descMatch =
          job.description?.toLowerCase().includes(keyword) || false;

        // 태그에서 검색
        const tagMatch =
          job.tags?.some((tag) => tag.toLowerCase().includes(keyword)) || false;

        // 스킬에서 검색
        const skillMatch =
          job.requirements.skills?.some((skill) =>
            skill.toLowerCase().includes(keyword),
          ) || false;

        return titleMatch || descMatch || tagMatch || skillMatch;
      });
    }

    return filteredJobs;
  }

  private paginateResponse(
    jobs: JobPostingResponseDto[],
    query: GetJobsQueryDto,
  ): PaginatedResponse<JobPostingResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const start = (safePage - 1) * safeLimit;
    const end = start + safeLimit;

    const paginatedData = jobs.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        total: jobs.length,
        page: safePage,
        limit: safeLimit,
        totalPages:
          jobs.length === 0 ? 0 : Math.ceil(jobs.length / safeLimit),
      },
    };
  }

  private transformToResponse(jobs: JobPosting[]): JobPostingResponseDto[] {
    return jobs.map((job) => {
      const dto = new JobPostingResponseDto();
      Object.assign(dto, {
        ...job,
        requirements: {
          ...job.requirements,
          skills: job.requirements.skills || [],
        },
      });
      return dto;
    });
  }

  private generateCacheKey(query: GetJobsQueryDto): string {
    const baseKey = REDIS_KEYS.JOBS_TECH;

    if (!query || Object.keys(query).length === 0) {
      return REDIS_KEYS.JOBS_ALL;
    }

    const parts = [baseKey];

    if (query.department) {
      parts.push(`department:${query.department}`);
    }

    if (query.field) {
      parts.push(`field:${query.field}`);
    }

    if (query.career) {
      parts.push(`career:${query.career}`);
    }

    if (query.employmentType) {
      parts.push(`employmentType:${query.employmentType}`);
    }

    if (query.location) {
      parts.push(`location:${query.location}`);
    }

    if (query.keyword) {
      parts.push(`keyword:${query.keyword}`);
    }

    return parts.join(':');
  }

  async getSupportedCompanies(): Promise<SupportedCompaniesResponseDto> {
    try {
      const companies = Array.from(this.crawlers.keys()).map((code) => ({
        code,
        name: code,
      }));

      return { companies };
    } catch (error) {
      this.logger.error(`Failed to get supported companies: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to get supported companies',
      );
    }
  }
}
