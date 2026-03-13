import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import { COMPANY_ENUM, EMPLOYMENT_TYPE, CAREER_TYPE, LOCATION_TYPE } from '../../../jobs/constants/job-codes.constant';
import { OpportunitySignalBuilderService } from '../../domain/services/opportunity-signal-builder.service';
import { GetUpcomingOpportunitySignalsUseCase } from './get-upcoming-opportunity-signals.use-case';

describe('GetUpcomingOpportunitySignalsUseCase', () => {
  let useCase: GetUpcomingOpportunitySignalsUseCase;

  const jobPostingSnapshotReaderService = {
    getResolvedAllJobs: jest.fn(),
    getResolvedCompanyJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpcomingOpportunitySignalsUseCase,
        OpportunitySignalBuilderService,
        {
          provide: JobPostingSnapshotReaderService,
          useValue: jobPostingSnapshotReaderService,
        },
      ],
    }).compile();

    useCase = module.get(GetUpcomingOpportunitySignalsUseCase);
    jest.clearAllMocks();
  });

  it('returns upcoming deadline signals from cached jobs', async () => {
    jobPostingSnapshotReaderService.getResolvedAllJobs.mockResolvedValue({
      jobs: [
        {
          id: 'line-1',
          company: COMPANY_ENUM.LINE,
          title: 'Backend Engineer',
          department: 'Engineering',
          field: 'Backend',
          requirements: {
            career: CAREER_TYPE.ANY,
            skills: ['Node.js'],
          },
          employmentType: EMPLOYMENT_TYPE.FULL_TIME,
          locations: [LOCATION_TYPE.SEOUL],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
          url: 'https://example.com/jobs/line-1',
          source: {
            originalId: 'line-1',
            originalUrl: 'https://example.com/jobs/line-1',
          },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ],
      snapshot: {
        collectedAt: '2026-03-13T00:00:00.000Z',
        staleAt: '2026-03-13T01:00:00.000Z',
        ttlSeconds: 3600,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.line'],
      },
    });

    const result = await useCase.execute({ days: 7, limit: 5 });

    expect(jobPostingSnapshotReaderService.getResolvedAllJobs).toHaveBeenCalled();
    expect(result.summary.total).toBe(1);
    expect(result.signals[0]).toEqual(
      expect.objectContaining({
        type: 'job_deadline',
        company: COMPANY_ENUM.LINE,
      }),
    );
    expect(result.snapshot?.sourceIds).toEqual(['opportunity.jobs.line']);
  });
});
