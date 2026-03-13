import { Test } from '@nestjs/testing';
import { CompanyIntelligenceService } from '../../../company-intelligence/company-intelligence.service';
import { SkillIntelligenceService } from '../../../skill-intelligence/skill-intelligence.service';
import { GetCompanyResearchUseCase } from './get-company-research.use-case';
import { CompanyResearchBuilderService } from '../../domain/services/company-research-builder.service';

describe('GetCompanyResearchUseCase', () => {
  const companyIntelligenceService = {
    getCompanyBrief: jest.fn(),
  };
  const skillIntelligenceService = {
    getSkillMap: jest.fn(),
  };

  let useCase: GetCompanyResearchUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetCompanyResearchUseCase,
        CompanyResearchBuilderService,
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

    useCase = moduleRef.get(GetCompanyResearchUseCase);
  });

  it('builds a deterministic research brief from cached company signals', async () => {
    companyIntelligenceService.getCompanyBrief.mockResolvedValue({
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
        jobs: {
          items: [
            {
              id: 'job-1',
              title: 'Backend Engineer',
              department: 'Engineering',
              field: 'Backend',
              locations: ['Seongnam'],
              deadline: '2026-03-20T00:00:00.000Z',
              url: 'https://example.com/job-1',
            },
          ],
        },
        latestContent: {
          available: true,
          items: [
            {
              id: 'content-1',
              title: 'Scaling NAVER APIs',
              description: 'desc',
              link: 'https://example.com/content-1',
              publishDate: '2026-03-10T00:00:00.000Z',
            },
          ],
        },
        recentChanges: {
          generatedAt: '2026-03-14T00:00:00.000Z',
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
              jobId: 'job-1',
              company: 'NAVER',
              title: 'Backend Engineer',
              department: 'Engineering',
              field: 'Backend',
              url: 'https://example.com/job-1',
              locations: ['Seongnam'],
              deadline: '2026-03-20T00:00:00.000Z',
            },
          ],
        },
        upcomingDeadlines: {
          generatedAt: '2026-03-14T00:00:00.000Z',
          summary: {
            total: 1,
            closingToday: 0,
            closingSoon: 1,
            watch: 0,
            windowDays: 7,
          },
          signals: [
            {
              type: 'job_deadline',
              severity: 'closing_soon',
              id: 'job-1',
              company: 'NAVER',
              title: 'Backend Engineer',
              department: 'Engineering',
              field: 'Backend',
              deadline: '2026-03-20T00:00:00.000Z',
              daysRemaining: 6,
              url: 'https://example.com/job-1',
              locations: ['Seongnam'],
            },
          ],
        },
        sources: [{ id: 'opportunity.jobs.naver' }],
      },
    });
    skillIntelligenceService.getSkillMap.mockResolvedValue({
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
        {
          skill: 'TypeScript',
          demandCount: 3,
          companyCount: 1,
          companies: ['NAVER'],
          sampleRoles: [
            {
              company: 'NAVER',
              title: 'Backend Engineer',
              department: 'Engineering',
              field: 'Backend',
              url: 'https://example.com/job-1',
            },
          ],
        },
      ],
    });

    const result = await useCase.execute('NAVER', {
      jobLimit: 3,
      contentLimit: 2,
      changeLimit: 5,
      deadlineLimit: 3,
      deadlineWindowDays: 7,
      skillLimit: 5,
      minSkillDemand: 1,
    });

    expect(result.company.code).toBe('NAVER');
    expect(result.thesis.headline).toContain('NAVER Careers');
    expect(result.insights).toHaveLength(4);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'apply',
        }),
        expect.objectContaining({
          type: 'read',
        }),
      ]),
    );
  });
});
