import { Test } from '@nestjs/testing';
import { SignalsService } from '../../../signals/signals.service';
import { GetTodayWorkspaceUseCase } from './get-today-workspace.use-case';
import { TodayWorkspaceOverviewService } from '../../domain/services/today-workspace-overview.service';
import { WorkspaceSectionBuilderService } from '../services/workspace-section-builder.service';

describe('GetTodayWorkspaceUseCase', () => {
  const signalsService = {
    getSourceFreshnessSignals: jest.fn(),
    getOpportunityChangeSignals: jest.fn(),
    getUpcomingOpportunitySignals: jest.fn(),
  };
  const workspaceSectionBuilderService = {
    getLatestContent: jest.fn(),
    getLatestNotices: jest.fn(),
  };

  let useCase: GetTodayWorkspaceUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetTodayWorkspaceUseCase,
        TodayWorkspaceOverviewService,
        {
          provide: SignalsService,
          useValue: signalsService,
        },
        {
          provide: WorkspaceSectionBuilderService,
          useValue: workspaceSectionBuilderService,
        },
      ],
    }).compile();

    useCase = moduleRef.get(GetTodayWorkspaceUseCase);
  });

  it('aggregates today workspace sections from internal services', async () => {
    signalsService.getSourceFreshnessSignals.mockResolvedValue({
      generatedAt: '2026-03-13T00:00:00.000Z',
      summary: {
        total: 4,
        fresh: 2,
        stale: 1,
        missing: 1,
      },
      signals: [],
    });
    signalsService.getOpportunityChangeSignals.mockResolvedValue({
      generatedAt: '2026-03-13T00:05:00.000Z',
      summary: {
        total: 3,
        created: 1,
        updated: 1,
        removed: 1,
      },
      signals: [],
      snapshot: {
        collectedAt: '2026-03-13T00:00:00.000Z',
        staleAt: '2026-03-13T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      },
    });
    signalsService.getUpcomingOpportunitySignals.mockResolvedValue({
      generatedAt: '2026-03-13T00:06:00.000Z',
      summary: {
        total: 2,
        closingToday: 1,
        closingSoon: 1,
        watch: 0,
        windowDays: 7,
      },
      signals: [],
      snapshot: {
        collectedAt: '2026-03-13T00:00:00.000Z',
        staleAt: '2026-03-13T12:00:00.000Z',
        ttlSeconds: 43200,
        confidence: 0.8,
        sourceIds: ['opportunity.jobs.naver'],
      },
    });
    workspaceSectionBuilderService.getLatestContent.mockResolvedValue({
      items: [{ id: '1' }, { id: '2' }],
      meta: {
        totalCount: 2,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        snapshot: {
          collectedAt: '2026-03-13T00:00:00.000Z',
          staleAt: '2026-03-13T08:00:00.000Z',
          ttlSeconds: 28800,
          confidence: 0.9,
          sourceIds: ['content.blog.toss'],
        },
      },
    });
    workspaceSectionBuilderService.getLatestNotices.mockResolvedValue({
      items: [{ nttId: '1' }],
      meta: {
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        snapshot: {
          collectedAt: '2026-03-13T00:10:00.000Z',
          staleAt: '2026-03-13T08:10:00.000Z',
          ttlSeconds: 28800,
          confidence: 0.85,
          sourceIds: ['institution.hanbat.notice'],
        },
      },
    });

    const result = await useCase.execute({
      contentLimit: 2,
      noticeLimit: 1,
      changeLimit: 3,
      deadlineLimit: 2,
      deadlineWindowDays: 7,
    });

    expect(signalsService.getOpportunityChangeSignals).toHaveBeenCalledWith({
      limit: 3,
    });
    expect(signalsService.getUpcomingOpportunitySignals).toHaveBeenCalledWith({
      limit: 2,
      days: 7,
    });
    expect(workspaceSectionBuilderService.getLatestContent).toHaveBeenCalledWith(2);
    expect(workspaceSectionBuilderService.getLatestNotices).toHaveBeenCalledWith(1);
    expect(result.overview).toEqual({
      staleSources: 1,
      missingSources: 1,
      opportunityChanges: 3,
      upcomingOpportunities: 2,
      latestContentItems: 2,
      latestNoticeItems: 1,
    });
    expect(result.snapshot).toEqual(
      expect.objectContaining({
        sourceIds: expect.arrayContaining([
          'content.blog.toss',
          'institution.hanbat.notice',
          'opportunity.jobs.naver',
        ]),
      }),
    );
  });
});
