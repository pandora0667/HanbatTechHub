import { Test } from '@nestjs/testing';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import {
  JOB_POSTING_CACHE_REPOSITORY,
  JobPostingCacheRepository,
} from '../../../jobs/application/ports/job-posting-cache.repository';
import { JobPostingSearchService } from '../../../jobs/domain/services/job-posting-search.service';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetOpportunityBoardUseCase } from './get-opportunity-board.use-case';

describe('GetOpportunityBoardUseCase', () => {
  const jobPostingCacheRepository = {
    getAllJobs: jest.fn(),
    getJobChangeSignals: jest.fn(),
  } as unknown as Pick<
    JobPostingCacheRepository,
    'getAllJobs' | 'getJobChangeSignals'
  >;
  const sourceRegistryService = {
    list: jest.fn(() => [
      {
        id: 'opportunity.jobs.naver',
        name: 'NAVER Careers',
      },
      {
        id: 'opportunity.jobs.kakao',
        name: 'Kakao Careers API',
      },
    ]),
  };

  let useCase: GetOpportunityBoardUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetOpportunityBoardUseCase,
        JobPostingSearchService,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useValue: jobPostingCacheRepository,
        },
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetOpportunityBoardUseCase);
  });

  it('builds a paginated opportunity board with change and deadline signals', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const later = new Date();
    later.setDate(later.getDate() + 12);

    (jobPostingCacheRepository.getAllJobs as jest.Mock).mockResolvedValue({
      jobs: [
        {
          id: 'naver-backend',
          company: 'NAVER',
          title: 'Backend Engineer',
          department: 'Engineering',
          field: 'Backend',
          requirements: {
            career: '신입',
            skills: ['TypeScript'],
          },
          employmentType: '정규',
          locations: ['분당'],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: soon,
          },
          url: 'https://example.com/naver-backend',
          source: {
            originalId: '1',
            originalUrl: 'https://example.com/naver-backend',
          },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-14T00:00:00.000Z'),
        },
        {
          id: 'kakao-frontend',
          company: 'KAKAO',
          title: 'Frontend Engineer',
          department: 'Engineering',
          field: 'Frontend',
          requirements: {
            career: '신입',
            skills: ['React'],
          },
          employmentType: '정규',
          locations: ['분당'],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: later,
          },
          url: 'https://example.com/kakao-frontend',
          source: {
            originalId: '2',
            originalUrl: 'https://example.com/kakao-frontend',
          },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-13T00:00:00.000Z'),
        },
      ],
      snapshot: buildSnapshotMetadata({
        collectedAt: '2026-03-14T00:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver', 'opportunity.jobs.kakao'],
      }),
    });
    (jobPostingCacheRepository.getJobChangeSignals as jest.Mock).mockResolvedValue({
      generatedAt: '2026-03-14T00:00:00.000Z',
      summary: {
        total: 1,
        created: 1,
        updated: 0,
        removed: 0,
      },
      signals: [
        {
          type: 'job_change',
          changeType: 'new',
          jobId: 'naver-backend',
        },
      ],
    });

    const result = await useCase.execute({
      sort: 'deadline',
      deadlineWindowDays: 7,
      page: 1,
      limit: 10,
    });

    expect(result.summary).toEqual(
      expect.objectContaining({
        totalOpenOpportunities: 2,
        companies: 2,
        closingSoon: 1,
        newSignals: 1,
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'naver-backend',
        signal: expect.objectContaining({
          isNew: true,
          closesSoon: true,
        }),
      }),
    );
  });
});
