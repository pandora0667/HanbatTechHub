import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../../redis/redis.service';
import { IJobCrawler } from '../interfaces/job-crawler.interface';
import { CompanyType, JobPosting } from '../interfaces/job-posting.interface';
import { GetJobsQueryDto } from '../dto/requests/get-jobs-query.dto';
import { JobPostingResponseDto } from '../dto/responses/job-posting.response.dto';
import { CRAWLER_TOKEN } from '../crawlers';
import {
  REDIS_KEYS,
  JOBS_CACHE_TTL,
  JOBS_UPDATE_CRON,
  JOB_CRAWLING_CONFIG,
} from '../constants/redis.constant';

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
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly crawlers: Map<CompanyType, IJobCrawler>;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @Inject(CRAWLER_TOKEN) private readonly jobCrawlers: IJobCrawler[],
  ) {
    this.crawlers = new Map(
      jobCrawlers.map((crawler) => [crawler.company, crawler]),
    );

    // 서버 시작시 초기 데이터 로드
    this.updateJobCache();
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
        throw new Error(`Crawler not found for company: ${company}`);
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
        () => crawler.fetchJobs(query),
        `Fetching jobs for ${company}`,
      );

      // 데이터 캐싱
      await this.redisService.set(cacheKey, jobs, JOBS_CACHE_TTL);

      // 필터링 및 페이지네이션 처리
      const filteredJobs = this.filterJobs(jobs, query);
      const transformedJobs = this.transformToResponse(filteredJobs);
      return this.paginateResponse(transformedJobs, query);
    } catch (error) {
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
    try {
      const now = new Date();
      this.logger.log(`Updating job cache... [KST: ${now.toLocaleTimeString('ko-KR')}]`);

      // 모든 크롤러에서 데이터 가져오기
      const tasks = Array.from(this.crawlers.values()).map((crawler) =>
        this.updateCompanyJobs(crawler),
      );

      await Promise.allSettled(tasks);

      // 마지막 업데이트 시간 기록
      await this.redisService.set(
        REDIS_KEYS.JOBS_LAST_UPDATE,
        now.toISOString(),
      );

      this.logger.log(`Job cache updated successfully [KST: ${new Date().toLocaleTimeString('ko-KR')}]`);
    } catch (error) {
      this.logger.error(`Job cache update failed: ${error.message}`);
    }
  }

  private async updateCompanyJobs(crawler: IJobCrawler): Promise<void> {
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

      // 전체 기술 직군 캐시에도 추가
      const allTechKey = REDIS_KEYS.JOBS_ALL;
      const existingJobs =
        (await this.redisService.get<JobPosting[]>(allTechKey)) || [];

      // 회사 데이터 업데이트
      const filteredJobs = existingJobs.filter(
        (job) => job.company !== crawler.company,
      );
      const updatedJobs = [...filteredJobs, ...jobs];

      await this.redisService.set(allTechKey, updatedJobs, JOBS_CACHE_TTL);

      this.logger.log(`Updated ${jobs.length} jobs for ${crawler.company}`);
    } catch (error) {
      this.logger.error(
        `Failed to update jobs for ${crawler.company}: ${error.message}`,
      );
    }
  }

  private async fetchAllTechJobs(
    query: GetJobsQueryDto,
  ): Promise<JobPosting[]> {
    // 캐시 키
    const cacheKey = REDIS_KEYS.JOBS_ALL;

    // 캐시에서 데이터 조회
    const cachedData = await this.redisService.get<JobPosting[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    // 캐시에 없는 경우 모든 크롤러에서 병렬로 데이터 가져오기
    const crawlerTasks = Array.from(this.crawlers.entries()).map(
      async ([company, crawler]) => {
        try {
          // 재시도 로직 적용
          return await this.executeWithRetry(
            () => crawler.fetchJobs(query),
            `Fetching jobs for ${company} in fetchAllTechJobs`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to fetch jobs for ${company}: ${error.message}`,
          );
          return [];
        }
      },
    );

    // 모든 크롤러 결과 병합
    const results = await Promise.all(crawlerTasks);
    const jobs = results.flat();

    // 데이터 캐싱
    await this.redisService.set(cacheKey, jobs, JOBS_CACHE_TTL);

    return jobs;
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
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedData = jobs.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        total: jobs.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(jobs.length / limit),
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
}
