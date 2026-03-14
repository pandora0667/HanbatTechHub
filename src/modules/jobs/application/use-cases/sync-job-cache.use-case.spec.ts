import { Test, TestingModule } from '@nestjs/testing';
import {
  CAREER_TYPE,
  COMPANY_ENUM,
  EMPLOYMENT_TYPE,
  LOCATION_TYPE,
} from '../../constants/job-codes.constant';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { SyncJobCacheUseCase } from './sync-job-cache.use-case';
import { JobPostingChangeDetectorService } from '../../domain/services/job-posting-change-detector.service';
import { CompanyType, JobPosting } from '../../interfaces/job-posting.interface';
import { JobMarketHistoryBuilderService } from '../../domain/services/job-market-history-builder.service';

describe('SyncJobCacheUseCase', () => {
  let useCase: SyncJobCacheUseCase;

  const buildJob = (
    id: string,
    company: CompanyType = COMPANY_ENUM.LINE,
    title = `Job ${id}`,
  ): JobPosting => ({
    id,
    company,
    title,
    department: 'Engineering',
    field: 'Engineering',
    requirements: {
      career: CAREER_TYPE.ANY,
      skills: [],
    },
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    locations: [LOCATION_TYPE.SEOUL],
    period: {
      start: new Date('2026-03-01T00:00:00.000Z'),
      end: new Date('2026-03-31T00:00:00.000Z'),
    },
    url: `https://example.com/jobs/${id}`,
    source: {
      originalId: id,
      originalUrl: `https://example.com/jobs/${id}`,
    },
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  });

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

  const jobPostingCollectorService = {
    fetchJobsByCompany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncJobCacheUseCase,
        JobPostingChangeDetectorService,
        JobMarketHistoryBuilderService,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useValue: jobPostingCacheRepository,
        },
        {
          provide: JobPostingCollectorService,
          useValue: jobPostingCollectorService,
        },
      ],
    }).compile();

    useCase = module.get(SyncJobCacheUseCase);
    jest.clearAllMocks();
  });

  it('stores company caches, all jobs, and last update timestamp', async () => {
    const now = new Date('2026-03-08T00:00:00.000Z');
    const lineJobs = [buildJob('line-1', COMPANY_ENUM.LINE)];
    const tossJobs = [
      buildJob('toss-1', COMPANY_ENUM.TOSS),
      buildJob('toss-2', COMPANY_ENUM.TOSS),
    ];

    jobPostingCollectorService.fetchJobsByCompany.mockResolvedValue([
      { company: COMPANY_ENUM.LINE, jobs: lineJobs },
      { company: COMPANY_ENUM.TOSS, jobs: tossJobs },
    ]);
    jobPostingCacheRepository.getCompanyJobs.mockResolvedValue(null);
    jobPostingCacheRepository.getAllJobs.mockResolvedValue(null);

    await useCase.execute(now);

    expect(jobPostingCollectorService.fetchJobsByCompany).toHaveBeenCalledWith({
      continueOnError: true,
      coolDownBetweenRuns: true,
    });
    expect(jobPostingCacheRepository.setCompanyJobs).toHaveBeenNthCalledWith(
      1,
      COMPANY_ENUM.LINE,
      expect.objectContaining({
        jobs: lineJobs,
        snapshot: expect.objectContaining({
          sourceIds: ['opportunity.jobs.line'],
        }),
      }),
    );
    expect(jobPostingCacheRepository.setCompanyJobs).toHaveBeenNthCalledWith(
      2,
      COMPANY_ENUM.TOSS,
      expect.objectContaining({
        jobs: tossJobs,
        snapshot: expect.objectContaining({
          sourceIds: ['opportunity.jobs.toss'],
        }),
      }),
    );
    expect(jobPostingCacheRepository.setAllJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        jobs: [...lineJobs, ...tossJobs],
        snapshot: expect.objectContaining({
          sourceIds: ['opportunity.jobs.line', 'opportunity.jobs.toss'],
        }),
      }),
    );
    expect(jobPostingCacheRepository.clearDerivedSearchCaches).toHaveBeenCalled();
    expect(jobPostingCacheRepository.appendJobMarketHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.objectContaining({
          totalOpenOpportunities: 3,
          companiesHiring: 2,
        }),
      }),
    );
    expect(jobPostingCacheRepository.setJobChangeSignals).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.objectContaining({
          total: 0,
        }),
      }),
    );
    expect(jobPostingCacheRepository.setLastUpdate).toHaveBeenCalledWith(
      now.toISOString(),
    );
  });

  it('reuses the previous company snapshot when a company crawl fails', async () => {
    const now = new Date('2026-03-13T04:00:00.000Z');
    const previousTossJobs = [
      buildJob('toss-prev', COMPANY_ENUM.TOSS, 'Prev Toss Job'),
    ];
    const lineJobs = [buildJob('line-1', COMPANY_ENUM.LINE)];

    jobPostingCollectorService.fetchJobsByCompany.mockResolvedValue([
      { company: COMPANY_ENUM.LINE, jobs: lineJobs },
    ]);
    jobPostingCacheRepository.getAllJobs.mockResolvedValue({
      jobs: previousTossJobs,
      snapshot: {
        collectedAt: '2026-03-12T00:00:00.000Z',
        staleAt: '2026-03-12T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.75,
        sourceIds: ['opportunity.jobs.toss'],
      },
    });
    jobPostingCacheRepository.getCompanyJobs.mockImplementation(async (company) => {
      if (company === COMPANY_ENUM.TOSS) {
        return {
          jobs: previousTossJobs,
          snapshot: {
            collectedAt: '2026-03-12T00:00:00.000Z',
            staleAt: '2026-03-12T12:00:00.000Z',
            ttlSeconds: 43200,
            confidence: 0.64,
            sourceIds: ['opportunity.jobs.toss'],
          },
        };
      }

      return null;
    });

    await useCase.execute(now);

    expect(jobPostingCacheRepository.setAllJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        jobs: expect.arrayContaining([
          expect.objectContaining({ company: COMPANY_ENUM.LINE }),
          expect.objectContaining({ company: COMPANY_ENUM.TOSS }),
        ]),
      }),
    );
  });
});
