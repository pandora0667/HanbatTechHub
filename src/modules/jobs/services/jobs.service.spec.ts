import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { RedisService } from '../../redis/redis.service';
import { CRAWLER_TOKEN } from '../crawlers';
import { JobPostingSearchService } from '../domain/services/job-posting-search.service';
import { JobPostingChangeDetectorService } from '../domain/services/job-posting-change-detector.service';
import { JobCrawlerExecutionService } from '../application/services/job-crawler-execution.service';
import { JobPostingCollectorService } from '../application/services/job-posting-collector.service';
import { GetCompanyJobsUseCase } from '../application/use-cases/get-company-jobs.use-case';
import { GetSupportedCompaniesUseCase } from '../application/use-cases/get-supported-companies.use-case';
import { GetTechJobsUseCase } from '../application/use-cases/get-tech-jobs.use-case';
import { SyncJobCacheUseCase } from '../application/use-cases/sync-job-cache.use-case';
import { InitializeJobsCacheUseCase } from '../application/use-cases/initialize-jobs-cache.use-case';
import { JobPostingResponseMapper } from '../presentation/mappers/job-posting-response.mapper';
import { JobCrawlerRegistryService } from '../infrastructure/services/job-crawler-registry.service';
import { RedisJobPostingCacheRepository } from '../infrastructure/persistence/redis-job-posting-cache.repository';
import { JOB_CRAWLER_REGISTRY } from '../application/ports/job-crawler-registry';
import { JOB_POSTING_CACHE_REPOSITORY } from '../application/ports/job-posting-cache.repository';
import {
  COMPANY_ENUM,
  EMPLOYMENT_TYPE,
  CAREER_TYPE,
  LOCATION_TYPE,
} from '../constants/job-codes.constant';
import { JobPosting } from '../interfaces/job-posting.interface';

describe('JobsService', () => {
  let service: JobsService;
  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
    initializeServiceCache: jest.fn(),
    flushByPattern: jest.fn(),
  };

  const buildJob = (id: string, department = 'Engineering'): JobPosting => ({
    id,
    company: COMPANY_ENUM.LINE,
    title: `Job ${id}`,
    department,
    field: department,
    requirements: { career: CAREER_TYPE.ANY, skills: [] },
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    locations: [LOCATION_TYPE.BUNDANG],
    period: {
      start: new Date('2025-01-01T00:00:00.000Z'),
      end: new Date('2025-12-31T00:00:00.000Z'),
    },
    url: `https://example.com/jobs/${id}`,
    source: {
      originalId: id,
      originalUrl: `https://example.com/jobs/${id}`,
    },
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  });

  const crawler = {
    company: COMPANY_ENUM.LINE,
    fetchJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        JobPostingSearchService,
        JobPostingChangeDetectorService,
        JobCrawlerExecutionService,
        JobPostingCollectorService,
        GetCompanyJobsUseCase,
        GetSupportedCompaniesUseCase,
        GetTechJobsUseCase,
        SyncJobCacheUseCase,
        InitializeJobsCacheUseCase,
        JobPostingResponseMapper,
        JobCrawlerRegistryService,
        RedisJobPostingCacheRepository,
        {
          provide: JOB_CRAWLER_REGISTRY,
          useExisting: JobCrawlerRegistryService,
        },
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useExisting: RedisJobPostingCacheRepository,
        },
        { provide: RedisService, useValue: redisService },
        { provide: CRAWLER_TOKEN, useValue: [crawler] },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  it('does not forward request filters into the company cache population query', async () => {
    redisService.get.mockResolvedValue(null);
    crawler.fetchJobs.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => buildJob(String(index + 1))),
    );

    const response = await service.getCompanyTechJobs(COMPANY_ENUM.LINE, {
      page: 2,
      limit: 5,
      department: 'Engineering',
    });

    expect(crawler.fetchJobs).toHaveBeenCalledWith();
    expect(redisService.set).toHaveBeenCalledWith(
      'hbnu:jobs:company:LINE',
      expect.objectContaining({
        jobs: expect.any(Array),
        snapshot: expect.objectContaining({
          sourceIds: ['opportunity.jobs.line'],
        }),
      }),
      expect.any(Number),
    );
    expect(response.data).toHaveLength(5);
    expect(response.meta.totalPages).toBe(3);
    expect(response.meta.snapshot?.sourceIds).toEqual(['opportunity.jobs.line']);
  });

  it('returns supported companies from the registry-backed use case', async () => {
    const response = await service.getSupportedCompanies();

    expect(response.companies).toEqual([
      {
        code: COMPANY_ENUM.LINE,
        name: COMPANY_ENUM.LINE,
      },
    ]);
  });
});
