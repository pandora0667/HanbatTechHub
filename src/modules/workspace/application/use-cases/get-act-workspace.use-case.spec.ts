import { Test } from '@nestjs/testing';
import { BLOG_POST_REPOSITORY } from '../../../blog/application/ports/blog-post.repository';
import { BLOG_SOURCE_CATALOG } from '../../../blog/application/ports/blog-source-catalog';
import { GetInstitutionOpportunityBoardUseCase } from '../../../institution-intelligence/application/use-cases/get-institution-opportunity-board.use-case';
import { NOTICE_CACHE_REPOSITORY } from '../../../notice/application/ports/notice-cache.repository';
import { SignalsService } from '../../../signals/signals.service';
import { GetActWorkspaceUseCase } from './get-act-workspace.use-case';
import { ActWorkspaceOverviewService } from '../../domain/services/act-workspace-overview.service';
import { WorkspaceActionBuilderService } from '../../domain/services/workspace-action-builder.service';

describe('GetActWorkspaceUseCase', () => {
  const signalsService = {
    getUpcomingOpportunitySignals: jest.fn(),
    getOpportunityChangeSignals: jest.fn(),
  };
  const blogPostRepository = {
    getPostsForCompanies: jest.fn(),
    getCompanyLastUpdate: jest.fn(),
  };
  const blogSourceCatalog = {
    listCodes: jest.fn(),
  };
  const noticeCacheRepository = {
    getNoticeGroup: jest.fn(),
    getLastUpdate: jest.fn(),
  };
  const getInstitutionOpportunityBoardUseCase = {
    execute: jest.fn(),
  };

  let useCase: GetActWorkspaceUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetActWorkspaceUseCase,
        WorkspaceActionBuilderService,
        ActWorkspaceOverviewService,
        {
          provide: SignalsService,
          useValue: signalsService,
        },
        {
          provide: BLOG_POST_REPOSITORY,
          useValue: blogPostRepository,
        },
        {
          provide: BLOG_SOURCE_CATALOG,
          useValue: blogSourceCatalog,
        },
        {
          provide: NOTICE_CACHE_REPOSITORY,
          useValue: noticeCacheRepository,
        },
        {
          provide: GetInstitutionOpportunityBoardUseCase,
          useValue: getInstitutionOpportunityBoardUseCase,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetActWorkspaceUseCase);
  });

  it('builds prioritized action items from internal snapshots', async () => {
    signalsService.getUpcomingOpportunitySignals.mockResolvedValue({
      generatedAt: '2026-03-14T00:00:00.000Z',
      summary: {
        total: 1,
        closingToday: 1,
        closingSoon: 0,
        watch: 0,
        windowDays: 7,
      },
      snapshot: {
        collectedAt: '2026-03-14T00:00:00.000Z',
        staleAt: '2026-03-14T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.kakao'],
      },
      signals: [
        {
          type: 'job_deadline',
          severity: 'closing_today',
          id: 'job-1',
          company: 'KAKAO',
          title: 'Backend Engineer',
          department: 'Platform',
          field: 'Backend',
          deadline: '2026-03-14T23:59:59.000Z',
          daysRemaining: 1,
          url: 'https://example.com/job-1',
          locations: ['분당'],
        },
      ],
    });
    signalsService.getOpportunityChangeSignals
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 1, created: 1, updated: 0, removed: 0 },
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.kakao'],
        },
        signals: [
          {
            type: 'job_change',
            changeType: 'new',
            jobId: 'job-2',
            company: 'KAKAO',
            title: 'Data Engineer',
            department: 'Data',
            field: 'Data',
            url: 'https://example.com/job-2',
            locations: ['분당'],
            deadline: '2026-03-20T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        generatedAt: '2026-03-14T00:00:00.000Z',
        summary: { total: 1, created: 0, updated: 1, removed: 0 },
        snapshot: {
          collectedAt: '2026-03-14T00:00:00.000Z',
          staleAt: '2026-03-14T12:00:00.000Z',
          ttlSeconds: 43200,
          confidence: 0.8,
          sourceIds: ['opportunity.jobs.kakao'],
        },
        signals: [
          {
            type: 'job_change',
            changeType: 'updated',
            jobId: 'job-3',
            company: 'KAKAO',
            title: 'Frontend Engineer',
            department: 'Product',
            field: 'Frontend',
            url: 'https://example.com/job-3',
            locations: ['분당'],
            deadline: '2026-03-22T00:00:00.000Z',
            changedFields: ['period'],
          },
        ],
      });
    noticeCacheRepository.getNoticeGroup.mockResolvedValue([
      {
        no: '1',
        title: '장학 신청 공지',
        author: '학생처',
        viewCount: 100,
        date: '2026-03-14',
        link: 'https://example.com/notice-1',
        hasAttachment: true,
        isNew: true,
        nttId: 'notice-1',
      },
    ]);
    noticeCacheRepository.getLastUpdate.mockResolvedValue(
      '2026-03-14T00:10:00.000Z',
    );
    getInstitutionOpportunityBoardUseCase.execute.mockResolvedValue({
      generatedAt: '2026-03-14T00:12:00.000Z',
      summary: {
        totalOpportunities: 1,
        serviceTypesCovered: 1,
        liveInstitutions: 1,
        fallbackInstitutions: 0,
      },
      snapshot: {
        collectedAt: '2026-03-14T00:11:00.000Z',
        staleAt: '2026-03-15T00:11:00.000Z',
        ttlSeconds: 86400,
        confidence: 0.72,
        sourceIds: ['institution.snu.discovery'],
      },
      meta: {
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 3,
        snapshot: {
          collectedAt: '2026-03-14T00:11:00.000Z',
          staleAt: '2026-03-15T00:11:00.000Z',
          ttlSeconds: 86400,
          confidence: 0.72,
          sourceIds: ['institution.snu.discovery'],
        },
      },
      items: [
        {
          id: 'inst-1',
          institutionId: 'SNU',
          institutionName: '서울대학교',
          region: '수도권',
          serviceType: 'scholarship',
          title: '장학금·학자금',
          url: 'https://example.com/snu-scholarship',
          pageUrl: 'https://example.com',
          matchedKeywords: ['장학'],
          score: 4,
          discoveryMode: 'live',
          sourceId: 'institution.snu.discovery',
        },
      ],
      sources: [],
    });
    blogSourceCatalog.listCodes.mockReturnValue(['KAKAO_ENTERPRISE']);
    blogPostRepository.getPostsForCompanies.mockResolvedValue([
      {
        id: 'post-1',
        company: 'KAKAO_ENTERPRISE',
        title: 'Kafka 운영기',
        description: '...',
        link: 'https://example.com/post-1',
        publishDate: new Date('2026-03-13T00:00:00.000Z'),
        isTranslated: true,
      },
    ]);
    blogPostRepository.getCompanyLastUpdate.mockResolvedValue(
      '2026-03-14T00:30:00.000Z',
    );

    const result = await useCase.execute({
      limit: 10,
      deadlineLimit: 3,
      newJobLimit: 3,
      updatedJobLimit: 3,
      noticeLimit: 2,
      contentLimit: 2,
      deadlineWindowDays: 7,
    });

    expect(result.overview).toEqual({
      totalActions: 6,
      urgent: 1,
      high: 2,
      medium: 2,
      low: 1,
      applyNow: 1,
      readNow: 1,
    });
    expect(result.actions[0]).toEqual(
      expect.objectContaining({
        type: 'apply',
        priority: 'urgent',
      }),
    );
    expect(result.sections.institutionChecks).toHaveLength(1);
    expect(result.sections.institutionOpportunities).toHaveLength(1);
    expect(result.sections.readingQueue).toHaveLength(1);
  });
});
