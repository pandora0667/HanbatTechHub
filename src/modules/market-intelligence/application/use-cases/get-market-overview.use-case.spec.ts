import { Test } from '@nestjs/testing';
import { buildSnapshotMetadata } from '../../../../common/utils/snapshot.util';
import { JOB_POSTING_CACHE_REPOSITORY } from '../../../jobs/application/ports/job-posting-cache.repository';
import { JobMarketHistoryBuilderService } from '../../../jobs/domain/services/job-market-history-builder.service';
import { JobPostingSnapshotReaderService } from '../../../jobs/application/services/job-posting-snapshot-reader.service';
import { SignalsService } from '../../../signals/signals.service';
import { SkillIntelligenceService } from '../../../skill-intelligence/skill-intelligence.service';
import { SourceRegistryService } from '../../../source-registry/source-registry.service';
import { GetMarketOverviewUseCase } from './get-market-overview.use-case';
import { MarketOverviewBuilderService } from '../../domain/services/market-overview-builder.service';

describe('GetMarketOverviewUseCase', () => {
  const jobPostingSnapshotReaderService = {
    getResolvedAllJobs: jest.fn(),
  };
  const signalsService = {
    getOpportunityChangeSignals: jest.fn(),
    getUpcomingOpportunitySignals: jest.fn(),
    getSourceFreshnessSignals: jest.fn(),
  };
  const jobPostingCacheRepository = {
    getJobMarketHistory: jest.fn(),
  };
  const skillIntelligenceService = {
    getSkillMap: jest.fn(),
  };
  const sourceRegistryService = {
    list: jest.fn(() => [
      { id: 'opportunity.jobs.naver', name: 'NAVER Careers' },
      { id: 'opportunity.jobs.kakao', name: 'Kakao Careers API' },
    ]),
  };

  let useCase: GetMarketOverviewUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetMarketOverviewUseCase,
        MarketOverviewBuilderService,
        {
          provide: JobPostingSnapshotReaderService,
          useValue: jobPostingSnapshotReaderService,
        },
        JobMarketHistoryBuilderService,
        {
          provide: JOB_POSTING_CACHE_REPOSITORY,
          useValue: jobPostingCacheRepository,
        },
        {
          provide: SignalsService,
          useValue: signalsService,
        },
        {
          provide: SkillIntelligenceService,
          useValue: skillIntelligenceService,
        },
        {
          provide: SourceRegistryService,
          useValue: sourceRegistryService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetMarketOverviewUseCase);
  });

  it('builds a market overview from cached snapshots', async () => {
    jobPostingSnapshotReaderService.getResolvedAllJobs.mockResolvedValue({
      jobs: [
        {
          id: 'naver-backend',
          company: 'NAVER',
          title: 'Backend Engineer',
          department: 'Engineering',
          field: 'Backend',
          requirements: { career: '신입', skills: ['TypeScript'] },
          employmentType: '정규',
          locations: ['분당'],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2026-03-18T00:00:00.000Z'),
          },
          url: 'https://example.com/naver-backend',
          source: { originalId: '1', originalUrl: 'https://example.com/naver-backend' },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-14T00:00:00.000Z'),
        },
        {
          id: 'kakao-frontend',
          company: 'KAKAO',
          title: 'Frontend Engineer',
          department: 'Engineering',
          field: 'Frontend',
          requirements: { career: '신입', skills: ['React'] },
          employmentType: '정규',
          locations: ['분당'],
          period: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2026-03-20T00:00:00.000Z'),
          },
          url: 'https://example.com/kakao-frontend',
          source: { originalId: '2', originalUrl: 'https://example.com/kakao-frontend' },
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
    signalsService.getOpportunityChangeSignals.mockResolvedValue({
      summary: { total: 2, created: 1, updated: 1, removed: 0 },
      signals: [
        { jobId: 'naver-backend', changeType: 'new' },
        { jobId: 'kakao-frontend', changeType: 'updated' },
      ],
    });
    signalsService.getUpcomingOpportunitySignals.mockResolvedValue({
      summary: { total: 1, closingToday: 0, closingSoon: 1, watch: 0, windowDays: 7 },
      signals: [{ id: 'naver-backend' }],
    });
    signalsService.getSourceFreshnessSignals.mockResolvedValue({
      summary: { total: 3, fresh: 2, stale: 1, missing: 0 },
      signals: [
        {
          sourceId: 'opportunity.jobs.naver',
          name: 'NAVER Careers',
          provider: 'NAVER',
          status: 'fresh',
          confidence: 0.8,
        },
        {
          sourceId: 'opportunity.jobs.kakao',
          name: 'Kakao Careers API',
          provider: 'KAKAO',
          status: 'stale',
          confidence: 0.82,
        },
      ],
    });
    jobPostingCacheRepository.getJobMarketHistory.mockResolvedValue([
      {
        snapshot: buildSnapshotMetadata({
          collectedAt: '2026-03-10T00:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.naver', 'opportunity.jobs.kakao'],
        }),
        summary: {
          totalOpenOpportunities: 1,
          companiesHiring: 1,
          fieldsTracked: 1,
          skillsTracked: 1,
        },
        companies: [{ company: 'NAVER', openJobs: 1, fields: 1, skills: 1 }],
        fields: [{ field: 'Backend', openJobs: 1, companies: 1 }],
        skills: [{ skill: 'TypeScript', demandCount: 1, companyCount: 1 }],
      },
    ]);
    skillIntelligenceService.getSkillMap.mockResolvedValue({
      summary: { totalJobs: 2, jobsWithSkills: 2, coverageRatio: 1, totalSkills: 2 },
      skills: [
        { skill: 'TypeScript', demandCount: 1, companyCount: 1 },
        { skill: 'React', demandCount: 1, companyCount: 1 },
      ],
    });

    const result = await useCase.execute({
      topCompanyLimit: 5,
      topSkillLimit: 10,
      topFieldLimit: 8,
      staleSourceLimit: 5,
      deadlineWindowDays: 7,
    });

    expect(result.summary).toEqual(
      expect.objectContaining({
        totalOpenOpportunities: 2,
        companiesHiring: 2,
        skillsTracked: 2,
        newSignals: 1,
        updatedSignals: 1,
        closingSoonOpportunities: 1,
        historyPoints: 2,
      }),
    );
    expect(result.sections.topCompanies[0]).toEqual(
      expect.objectContaining({
        company: expect.any(String),
        openJobs: expect.any(Number),
      }),
    );
    expect(result.sections.topSkills).toHaveLength(2);
    expect(result.sections.trends).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          historyPoints: 2,
          totalOpenOpportunitiesDelta: 1,
          companiesHiringDelta: 1,
        }),
        timeline: expect.arrayContaining([
          expect.objectContaining({
            collectedAt: expect.any(String),
            totalOpenOpportunities: expect.any(Number),
          }),
        ]),
        companyMomentum: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            delta: expect.any(Number),
            direction: expect.any(String),
          }),
        ]),
      }),
    );
    expect(jobPostingSnapshotReaderService.getResolvedAllJobs).toHaveBeenCalled();
    expect(jobPostingCacheRepository.getJobMarketHistory).toHaveBeenCalledWith(10);
  });
});
