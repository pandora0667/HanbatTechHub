import { Test, TestingModule } from '@nestjs/testing';
import { COMPANY_ENUM } from '../../constants/job-codes.constant';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../ports/job-posting-cache.repository';
import { JobPostingCollectorService } from '../services/job-posting-collector.service';
import { SyncJobCacheUseCase } from './sync-job-cache.use-case';

describe('SyncJobCacheUseCase', () => {
  let useCase: SyncJobCacheUseCase;

  const jobPostingCacheRepository: jest.Mocked<JobPostingCacheRepository> = {
    initializeJobsCache: jest.fn(),
    getSearchJobs: jest.fn(),
    setSearchJobs: jest.fn(),
    getCompanyJobs: jest.fn(),
    setCompanyJobs: jest.fn(),
    setAllJobs: jest.fn(),
    setLastUpdate: jest.fn(),
  };

  const jobPostingCollectorService = {
    fetchJobsByCompany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncJobCacheUseCase,
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
    const lineJobs = [{ id: 'line-1' }];
    const tossJobs = [{ id: 'toss-1' }, { id: 'toss-2' }];

    jobPostingCollectorService.fetchJobsByCompany.mockResolvedValue([
      { company: COMPANY_ENUM.LINE, jobs: lineJobs },
      { company: COMPANY_ENUM.TOSS, jobs: tossJobs },
    ]);

    await useCase.execute(now);

    expect(jobPostingCollectorService.fetchJobsByCompany).toHaveBeenCalledWith({
      continueOnError: true,
      coolDownBetweenRuns: true,
    });
    expect(jobPostingCacheRepository.setCompanyJobs).toHaveBeenNthCalledWith(
      1,
      COMPANY_ENUM.LINE,
      lineJobs,
    );
    expect(jobPostingCacheRepository.setCompanyJobs).toHaveBeenNthCalledWith(
      2,
      COMPANY_ENUM.TOSS,
      tossJobs,
    );
    expect(jobPostingCacheRepository.setAllJobs).toHaveBeenCalledWith([
      ...lineJobs,
      ...tossJobs,
    ]);
    expect(jobPostingCacheRepository.setLastUpdate).toHaveBeenCalledWith(
      now.toISOString(),
    );
  });
});
