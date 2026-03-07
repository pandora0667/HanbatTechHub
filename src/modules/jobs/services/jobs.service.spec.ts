import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { RedisService } from '../../redis/redis.service';
import { CRAWLER_TOKEN } from '../crawlers';
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
      expect.any(Array),
      expect.any(Number),
    );
    expect(response.data).toHaveLength(5);
    expect(response.meta.totalPages).toBe(3);
  });
});
