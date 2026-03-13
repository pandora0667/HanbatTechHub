import { Test } from '@nestjs/testing';
import { CompanyIntelligenceService } from '../../../company-intelligence/company-intelligence.service';
import { SkillIntelligenceService } from '../../../skill-intelligence/skill-intelligence.service';
import { GetCompanyCompareUseCase } from './get-company-compare.use-case';
import { CompanyCompareOverviewService } from '../../domain/services/company-compare-overview.service';

describe('GetCompanyCompareUseCase', () => {
  const companyIntelligenceService = {
    getCompanyBrief: jest.fn(),
  };
  const skillIntelligenceService = {
    getSkillMap: jest.fn(),
  };

  let useCase: GetCompanyCompareUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetCompanyCompareUseCase,
        CompanyCompareOverviewService,
        {
          provide: CompanyIntelligenceService,
          useValue: companyIntelligenceService,
        },
        {
          provide: SkillIntelligenceService,
          useValue: skillIntelligenceService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetCompanyCompareUseCase);
  });

  it('compares multiple companies from cached briefs and skill maps', async () => {
    companyIntelligenceService.getCompanyBrief
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        company: {
          code: 'NAVER',
          name: 'NAVER Careers',
          provider: 'NAVER',
        },
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.naver'],
        },
        overview: {
          openJobs: 5,
          newJobs: 2,
          updatedJobs: 1,
          removedJobs: 0,
          closingSoonJobs: 1,
          latestContentItems: 2,
        },
        sections: {
          sources: [{ id: 'opportunity.jobs.naver' }],
        },
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        company: {
          code: 'KAKAO',
          name: 'Kakao Careers API',
          provider: 'KAKAO',
        },
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.kakao'],
        },
        overview: {
          openJobs: 3,
          newJobs: 1,
          updatedJobs: 1,
          removedJobs: 0,
          closingSoonJobs: 2,
          latestContentItems: 1,
        },
        sections: {
          sources: [{ id: 'opportunity.jobs.kakao' }],
        },
      });
    skillIntelligenceService.getSkillMap
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.naver'],
        },
        summary: {
          totalJobs: 5,
          jobsWithSkills: 4,
          coverageRatio: 0.8,
          totalSkills: 2,
        },
        skills: [
          { skill: 'TypeScript', demandCount: 3, companyCount: 1 },
          { skill: 'Java', demandCount: 2, companyCount: 1 },
        ],
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.kakao'],
        },
        summary: {
          totalJobs: 3,
          jobsWithSkills: 2,
          coverageRatio: 0.67,
          totalSkills: 1,
        },
        skills: [{ skill: 'Kotlin', demandCount: 2, companyCount: 1 }],
      });

    const result = await useCase.execute({
      companies: ['NAVER', 'KAKAO'],
      jobLimit: 3,
      contentLimit: 2,
      changeLimit: 5,
      deadlineLimit: 3,
      deadlineWindowDays: 7,
      skillLimit: 5,
      minSkillDemand: 1,
    });

    expect(result.overview).toEqual({
      companyCount: 2,
      totalOpenJobs: 8,
      totalNewJobs: 3,
      totalClosingSoonJobs: 3,
      broadestSkillCoverageCompany: 'NAVER Careers',
      mostActiveHiringCompany: 'NAVER Careers',
    });
    expect(result.companies).toHaveLength(2);
    expect(result.companies[0].topSkills[0]).toEqual(
      expect.objectContaining({
        skill: expect.any(String),
        demandCount: expect.any(Number),
      }),
    );
  });

  it('rejects duplicate-only company comparisons', async () => {
    await expect(
      useCase.execute({
        companies: ['NAVER', 'NAVER'],
        jobLimit: 3,
        contentLimit: 2,
        changeLimit: 5,
        deadlineLimit: 3,
        deadlineWindowDays: 7,
        skillLimit: 5,
        minSkillDemand: 1,
      }),
    ).rejects.toThrow(
      'At least two distinct companies are required for comparison.',
    );
  });
});
