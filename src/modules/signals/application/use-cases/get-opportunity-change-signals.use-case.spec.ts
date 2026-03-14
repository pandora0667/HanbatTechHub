import { Test, TestingModule } from '@nestjs/testing';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { COMPANY_ENUM } from '../../../jobs/constants/job-codes.constant';
import { GetOpportunityChangeSignalsUseCase } from './get-opportunity-change-signals.use-case';

describe('GetOpportunityChangeSignalsUseCase', () => {
  let useCase: GetOpportunityChangeSignalsUseCase;

  const jobPostingCacheRepository: jest.Mocked<JobPostingCacheRepository> = {
    initializeJobsCache: jest.fn(),
    clearDerivedSearchCaches: jest.fn(),
    getSearchJobs: jest.fn(),
    setSearchJobs: jest.fn(),
    getCompanyJobs: jest.fn(),
    setCompanyJobs: jest.fn(),
    getAllJobs: jest.fn(),
    setAllJobs: jest.fn(),
    getJobChangeSignals: jest.fn(),
    setJobChangeSignals: jest.fn(),
    getJobMarketHistory: jest.fn(),
    appendJobMarketHistory: jest.fn(),
    getLastUpdate: jest.fn(),
    setLastUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOpportunityChangeSignalsUseCase,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useValue: jobPostingCacheRepository,
        },
      ],
    }).compile();

    useCase = module.get(GetOpportunityChangeSignalsUseCase);
    jest.clearAllMocks();
  });

  it('filters stored change signals by company and type', async () => {
    jobPostingCacheRepository.getJobChangeSignals.mockResolvedValue({
      generatedAt: '2026-03-13T00:00:00.000Z',
      summary: {
        total: 2,
        created: 1,
        updated: 1,
        removed: 0,
      },
      signals: [
        {
          type: 'job_change',
          changeType: 'new',
          jobId: '1',
          company: COMPANY_ENUM.LINE,
          title: 'Backend Engineer',
          department: 'Engineering',
          field: 'Backend',
          url: 'https://example.com/jobs/1',
          locations: ['서울'],
          deadline: '2026-03-31T00:00:00.000Z',
        },
        {
          type: 'job_change',
          changeType: 'updated',
          jobId: '2',
          company: COMPANY_ENUM.KAKAO,
          title: 'Data Engineer',
          department: 'Platform',
          field: 'Data',
          url: 'https://example.com/jobs/2',
          locations: ['서울'],
          deadline: '2026-03-31T00:00:00.000Z',
          changedFields: ['title'],
        },
      ],
    });

    const result = await useCase.execute({
      company: COMPANY_ENUM.LINE,
      changeType: 'new',
    });

    expect(result.summary).toEqual({
      total: 1,
      created: 1,
      updated: 0,
      removed: 0,
    });
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].company).toBe(COMPANY_ENUM.LINE);
  });
});
